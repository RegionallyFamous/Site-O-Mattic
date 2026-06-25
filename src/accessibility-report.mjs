import {
  extractElementIds,
  extractHrefTargets,
  extractPageContent,
  extractPhpStringAssignment,
  getRunPhpStep,
  readBlueprint
} from "./blueprint-inspect.mjs";
import { blueprintPathForSpec, readSpec, specTargets } from "./spec-utils.mjs";

const DEFAULT_TARGETS = [
  "public/blueprints/lawn-care-service/blueprint.json",
  "public/blueprints/pressure-washing-service/blueprint.json"
];

const targets = process.argv.slice(2);
if (!targets.length) {
  targets.push(...await defaultTargets());
}

let hasFailure = false;

for (const target of targets) {
  const report = await buildReport(target);
  printReport(report);
  if (report.checks.some((check) => !check.passed)) {
    hasFailure = true;
  }
}

if (hasFailure) {
  process.exit(1);
}

async function buildReport(target) {
  const blueprint = await readBlueprint(target);
  const phpStep = getRunPhpStep(blueprint);
  const checks = [];

  if (!phpStep) {
    return { target, checks: [{ name: "runPHP setup", passed: false, detail: "Missing setup step." }] };
  }

  const pageContent = extractPageContent(phpStep.code);
  const headings = [...pageContent.matchAll(/<h([1-6])\b/g)].map((match) => Number(match[1]));
  const links = extractLinks(pageContent);
  const ids = [...pageContent.matchAll(/\bid=(["'])([^"']+)\1/g)].map((match) => match[2]);
  const assetPayloads = extractAssets(phpStep.code);
  const buttonLinks = links.filter((link) => link.className.includes("wp-block-button__link"));

  add(checks, "single h1", headings.filter((level) => level === 1).length === 1, `${headings.filter((level) => level === 1).length} h1 headings.`);
  add(checks, "heading order", headingOrderPass(headings), headings.join(" > "));
  add(checks, "valid in-page link targets", extractHrefTargets(pageContent).every((id) => extractElementIds(pageContent).has(id)), "All #links target existing IDs.");
  add(checks, "unique element IDs", new Set(ids).size === ids.length, `${ids.length} IDs.`);
  add(checks, "accessible media metadata", ["hero", "logo", "favicon"].every((key) => assetPayloads?.[key]?.alt), "Hero, logo, and favicon attachment alt text present.");
  add(checks, "button link text", buttonLinks.length >= 2 && buttonLinks.every((link) => link.text.length >= 3), `${buttonLinks.length} CTA-style links.`);
  add(checks, "safe link hrefs", links.every((link) => isSafeHref(link.href)), `${links.length} links checked.`);
  add(checks, "no vague link text", links.every((link) => !/^(click here|learn more|read more)$/i.test(link.text)), "Link text names the action.");
  add(checks, "navigation labels unique", navigationLabelsUnique(pageContent), "Navigation labels do not repeat.");

  return { target, checks };
}

function extractAssets(phpCode) {
  const raw = extractPhpStringAssignment(phpCode, "$site_o_mattic_assets");
  return raw ? JSON.parse(raw) : null;
}

function extractLinks(markup) {
  return [...markup.matchAll(/<a\b([^>]*)>(.*?)<\/a>/gs)].map((match) => {
    const attrs = match[1];
    const href = attr(attrs, "href");
    const className = attr(attrs, "class");
    const text = stripTags(match[2]).trim();
    return { href, className, text };
  });
}

function attr(attrs, name) {
  const match = attrs.match(new RegExp(`\\b${name}=("|')([^"']*)\\1`));
  return match ? match[2] : "";
}

function stripTags(value) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
}

function headingOrderPass(headings) {
  if (!headings.length || headings[0] !== 1) {
    return false;
  }

  let previous = headings[0];
  for (const level of headings.slice(1)) {
    if (level > previous + 1) {
      return false;
    }
    previous = level;
  }
  return true;
}

function isSafeHref(href) {
  return /^#[-_a-zA-Z0-9]+$/.test(href)
    || /^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/.test(href)
    || /^tel:\+?[0-9]+$/.test(href)
    || /^https?:\/\//.test(href);
}

function navigationLabelsUnique(markup) {
  const labels = [...markup.matchAll(/<!-- wp:navigation-link \{"label":"([^"]+)"/g)].map((match) => match[1]);
  return labels.length > 0 && new Set(labels).size === labels.length;
}

function add(checks, name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), detail });
}

function printReport(report) {
  const passed = report.checks.filter((check) => check.passed).length;
  console.log(`\nAccessibility report for ${report.target}`);
  console.log(`Score: ${passed}/${report.checks.length}`);
  for (const check of report.checks) {
    console.log(`- ${check.passed ? "OK" : "FAIL"} ${check.name}: ${check.detail}`);
  }
}

async function defaultTargets() {
  const targetsFromSpecs = await Promise.all((await specTargets([])).map(async (specPath) => blueprintPathForSpec(await readSpec(specPath))));
  return targetsFromSpecs.length ? targetsFromSpecs : DEFAULT_TARGETS;
}
