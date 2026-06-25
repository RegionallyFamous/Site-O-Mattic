import {
  extractElementIds,
  extractHrefTargets,
  extractPageContent,
  getRunPhpStep,
  readBlueprint
} from "./blueprint-inspect.mjs";
import { blueprintPathForSpec, readSpec, specTargets } from "./spec-utils.mjs";

const targets = await specTargets(process.argv.slice(2));
let hasFailures = false;

for (const target of targets) {
  const spec = await readSpec(target);
  const report = await inspectConversion(spec, target);
  printReport(target, report);
  if (report.checks.some((check) => !check.passed)) {
    hasFailures = true;
  }
}

if (hasFailures) {
  process.exit(1);
}

async function inspectConversion(spec, target) {
  const checks = [];
  const blueprint = await readBlueprint(blueprintPathForSpec(spec));
  const phpStep = getRunPhpStep(blueprint);
  if (!phpStep) {
    return { checks: [{ name: "runPHP setup", passed: false, detail: "Missing setup step." }] };
  }

  const pageContent = extractPageContent(phpStep.code);
  const links = extractLinks(pageContent);
  const buttonLinks = links.filter((link) => link.className.includes("wp-block-button__link"));
  const navigationLinks = extractNavigationLinks(pageContent);
  const hrefTargets = extractHrefTargets(pageContent);
  const elementIds = extractElementIds(pageContent);
  const text = stripTags(pageContent);
  const telLinks = links.filter((link) => link.href.startsWith("tel:"));
  const mailLinks = links.filter((link) => link.href.startsWith("mailto:"));
  const inPageButtons = buttonLinks.filter((link) => link.href.startsWith("#"));
  const directButtons = buttonLinks.filter((link) => /^(tel|mailto):/.test(link.href));

  add(checks, "conversion target", Boolean(spec.slug && blueprint), `${spec.slug} -> ${target}`);
  add(checks, "real contact paths", telLinks.length >= 1 && mailLinks.length >= 1, `${telLinks.length} tel / ${mailLinks.length} email links`);
  add(checks, "CTA count restraint", buttonLinks.length >= 3 && buttonLinks.length <= 8, `${buttonLinks.length} button links`);
  add(checks, "CTA path mix", inPageButtons.length >= 1 && directButtons.length >= 2, `${inPageButtons.length} in-page / ${directButtons.length} direct`);
  add(checks, "final CTA is direct", /^(tel|mailto):/.test(buttonLinks.at(-1)?.href || ""), buttonLinks.at(-1)?.href || "missing final button");
  add(checks, "CTA text is specific", buttonLinks.every((link) => actionTextPass(link.text)), buttonLinks.map((link) => link.text).join(" / "));
  add(checks, "CTA labels fit buttons", buttonLinks.every((link) => link.text.length >= 3 && link.text.length <= 34), buttonLinks.map((link) => `${link.text.length}:${link.text}`).join(" / "));
  add(checks, "no external link dependency", links.every((link) => !/^https?:\/\//i.test(link.href)), `${links.filter((link) => /^https?:\/\//i.test(link.href)).length} external links`);
  add(checks, "navigation stays scannable", navigationLinks.length >= 2 && navigationLinks.length <= 4 && navigationLinks.every((link) => link.label.length <= 16), navigationLinks.map((link) => link.label).join(" / "));
  add(checks, "navigation targets real sections", navigationLinks.every((link) => elementIds.has(link.target)) && hrefTargets.every((id) => elementIds.has(id)), navigationLinks.map((link) => `#${link.target}`).join(" / "));
  add(checks, "quote section exists", elementIds.has("quote"), "Every one-page site needs a final action anchor.");
  add(checks, "conversion content density", text.length >= 1500 && text.length <= 8500, `${text.length} rendered text characters`);
  add(checks, "service proof before close", hasProofBeforeQuote(pageContent), "Proof/process/scope content appears before the quote anchor.");

  return { checks };
}

function extractLinks(markup) {
  return [...markup.matchAll(/<a\b([^>]*)>(.*?)<\/a>/gs)].map((match) => {
    const attrs = match[1];
    return {
      href: attr(attrs, "href"),
      className: attr(attrs, "class"),
      text: stripTags(match[2]).trim()
    };
  });
}

function extractNavigationLinks(markup) {
  return [...markup.matchAll(/<!-- wp:navigation-link \{"label":"([^"]+)","url":"#([^"]+)"/g)]
    .map((match) => ({ label: match[1], target: match[2] }));
}

function attr(attrs, name) {
  const match = attrs.match(new RegExp(`\\b${name}=("|')([^"']*)\\1`));
  return match ? match[2] : "";
}

function stripTags(value) {
  return String(value || "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function actionTextPass(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized || genericCtaText(normalized)) {
    return false;
  }
  if (/\([0-9]{3}\)\s*[0-9]{3}-[0-9]{4}/.test(normalized)) {
    return true;
  }

  const hasAction = /\b(book|check|send|request|call|ask|plan|start|join|compare|see|explore|reserve|email|get|build|choose|schedule|review|sample|feed|order|quote|price|visit|fix|clean|style|design|view|browse|text)\b/i.test(normalized);
  const hasContext = normalized.split(/\s+/).length >= 2;
  const hasNicheQuestion = /^what (?:we|you|it|they) (?:take|clean|cover|bring|do|need|set|install|repair|haul)\b/i.test(normalized);
  return (hasAction && hasContext) || hasNicheQuestion;
}

function genericCtaText(text) {
  return /^(?:click here|learn more\b.*|read more\b.*|more|details|submit|services|contact|contact us|get started|book now|call now|call|start|go)$/i.test(text);
}

function hasProofBeforeQuote(markup) {
  const quoteIndex = markup.indexOf('id="quote"');
  if (quoteIndex === -1) {
    return false;
  }
  const beforeQuote = markup.slice(0, quoteIndex);
  return /\bsom-[a-z0-9-]*(proof|process|plan|scope|service|package|style|card|table)[a-z0-9-]*\b/i.test(beforeQuote)
    || /<!-- wp:(?:details|table|quote|pullquote|gallery|media-text)\b/.test(beforeQuote);
}

function add(checks, name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), detail });
}

function printReport(target, report) {
  const passed = report.checks.filter((check) => check.passed).length;
  console.log(`\nConversion guardrails for ${target}`);
  console.log(`Score: ${passed}/${report.checks.length}`);
  for (const check of report.checks) {
    console.log(`- ${check.passed ? "OK" : "FAIL"} ${check.name}: ${check.detail}`);
  }
}
