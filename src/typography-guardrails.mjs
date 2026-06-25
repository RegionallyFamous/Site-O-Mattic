import {
  extractCustomCss,
  extractGlobalStyles,
  extractPageContent,
  getRunPhpStep,
} from "./blueprint-inspect.mjs";
import { blueprintPathForSpec, readSpec, specTargets } from "./spec-utils.mjs";
import fs from "node:fs/promises";

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
  const { blueprint, blueprintTarget } = await loadBlueprintForTarget(target);
  const phpStep = getRunPhpStep(blueprint);
  if (!phpStep) {
    return {
      target,
      checks: [{ name: "runPHP setup", passed: false, detail: "Missing setup step." }]
    };
  }

  const pageContent = extractPageContent(phpStep.code);
  const customCss = extractCustomCss(phpStep.code);
  const globalStyles = extractGlobalStyles(phpStep.code);
  const type = globalStyles?.settings?.custom?.som?.type || {};
  const measure = globalStyles?.settings?.custom?.som?.measure || {};
  const fontSizes = Object.fromEntries((globalStyles?.settings?.typography?.fontSizes || []).map((item) => [item.slug, item]));
  const headingCaps = hasEffectiveHeadingCaps(customCss);
  const checks = [];

  add(checks, "target resolution", Boolean(blueprintTarget), `${target} -> ${blueprintTarget || "missing blueprint"}`);
  add(checks, "body type is readable", isReadableBodyStack(type.bodyFont), type.bodyFont || "missing body font");
  add(checks, "display type avoids novelty fonts", hasNoNoveltyFonts(type.displayFont), type.displayFont || "missing display font");
  add(checks, "accent type avoids novelty fonts", hasNoNoveltyFonts(type.accentFont), type.accentFont || "missing accent font");
  add(checks, "heading weight restraint", headingWeightPass(type), `weight ${type.headingWeight || "missing"} for ${type.displayFont || "missing display font"}`);
  add(checks, "action/nav weight restraint", actionWeightPass(type), `action ${type.actionWeight || "missing"}, nav ${type.navWeight || "missing"}`);
  add(checks, "line-height readability", lineHeightsPass(type), `heading ${type.headingLineHeight || "missing"}, body ${type.bodyLineHeight || "missing"}`);
  add(checks, "readable copy measure", measurePass(customCss, measure), `copy ${measure.copy || "missing"}, tight ${measure.tight || "missing"}`);
  add(checks, "fluid scale restraint", fluidScalePass(fontSizes), describeScale(fontSizes));
  add(checks, "effective heading caps", headingCaps, "Shared CSS caps h1/h2/h3 size, weight, and line-height over legacy inline styles.");
  add(checks, "manual headline hyphenation", headlineHyphenationPass(customCss), "Headlines should wrap by words first; do not allow automatic mid-word hyphenation.");
  add(checks, "variant rhythm does not undercut type system", variantRhythmPass(customCss), "Variant CSS must not reintroduce cramped important line-height overrides.");
  add(checks, "inline heading restraint", inlineHeadingsPass(pageContent, headingCaps), describeInlineHeadings(pageContent));
  add(checks, "paragraph rhythm", paragraphRhythmPass(pageContent), "Readable body copy should not use cramped line-height.");
  add(checks, "uppercase label restraint", uppercaseLabelsPass(pageContent), "Small uppercase labels must be large enough and not black-weight.");

  return { target, checks };
}

async function loadBlueprintForTarget(target) {
  const parsed = JSON.parse(await fs.readFile(target, "utf8"));
  if (Array.isArray(parsed.steps)) {
    return { blueprint: parsed, blueprintTarget: target };
  }
  if (parsed.slug) {
    const blueprintTarget = blueprintPathForSpec(parsed);
    return {
      blueprint: JSON.parse(await fs.readFile(blueprintTarget, "utf8")),
      blueprintTarget
    };
  }
  return { blueprint: parsed, blueprintTarget: target };
}

function add(checks, name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), detail });
}

function isReadableBodyStack(stack) {
  return Boolean(stack)
    && hasNoNoveltyFonts(stack)
    && !/\b(monospace|Mono|Consolas|Menlo|Arial Narrow|Roboto Condensed|Aptos Narrow|Impact)\b/i.test(stack);
}

function hasNoNoveltyFonts(stack) {
  return Boolean(stack)
    && !/\b(Impact|Arial Black|Segoe UI Black|Comic Sans|Papyrus|Brush Script|Curlz|Jokerman|Chiller|Cooper Black|Arial Rounded MT Bold)\b/i.test(stack);
}

function headingWeightPass(type) {
  const weight = number(type.headingWeight);
  if (!Number.isFinite(weight)) {
    return false;
  }
  return weight >= 600 && weight <= (isSerifStack(type.displayFont) ? 720 : 820);
}

function actionWeightPass(type) {
  const action = number(type.actionWeight);
  const nav = number(type.navWeight);
  return Number.isFinite(action)
    && Number.isFinite(nav)
    && action >= 650
    && action <= 820
    && nav >= 650
    && nav <= 800;
}

function lineHeightsPass(type) {
  const heading = number(type.headingLineHeight);
  const body = number(type.bodyLineHeight);
  return Number.isFinite(heading)
    && Number.isFinite(body)
    && heading >= 1.02
    && heading <= 1.12
    && body >= 1.52
    && body <= 1.66;
}

function fluidScalePass(fontSizes) {
  const bodyMin = remValue(fontSizes.body?.fluid?.min || fontSizes.body?.size);
  const bodyMax = remValue(fontSizes.body?.fluid?.max || fontSizes.body?.size);
  const leadMax = remValue(fontSizes.lead?.fluid?.max || fontSizes.lead?.size);
  const cardMax = remValue(fontSizes["card-title"]?.fluid?.max || fontSizes["card-title"]?.size);
  const sectionMax = remValue(fontSizes["section-title"]?.fluid?.max || fontSizes["section-title"]?.size);
  const heroMin = remValue(fontSizes.hero?.fluid?.min || fontSizes.hero?.size);
  const heroMax = remValue(fontSizes.hero?.fluid?.max || fontSizes.hero?.size);

  return [bodyMin, bodyMax, leadMax, cardMax, sectionMax, heroMin, heroMax].every(Number.isFinite)
    && bodyMin >= 0.98
    && bodyMax <= 1.18
    && leadMax <= 1.55
    && cardMax <= 2
    && sectionMax <= 3.85
    && heroMin >= 2.45
    && heroMax <= 5.4;
}

function measurePass(customCss, measure) {
  const copyMeasure = chValue(measure.copy);
  const tightMeasure = chValue(measure.tight);
  return Number.isFinite(copyMeasure)
    && Number.isFinite(tightMeasure)
    && tightMeasure >= 45
    && tightMeasure <= 58
    && copyMeasure >= 58
    && copyMeasure <= 72
    && customCss.includes("--wp--custom--som--measure--copy")
    && customCss.includes("max-inline-size:var(--wp--custom--som--measure--copy)")
    && customCss.includes("p.has-text-align-center");
}

function variantRhythmPass(customCss) {
  return !/line-height:\s*(?:0?\.[0-9]+|1\.3[0-9])!important/i.test(customCss);
}

function headlineHyphenationPass(customCss) {
  return customCss.includes("hyphens:manual")
    && !customCss.includes("hyphens:auto");
}

function inlineHeadingsPass(markup, headingCaps) {
  if (headingCaps) {
    return true;
  }
  return inlineHeadings(markup).every((heading) => {
    const sizeMax = maxPxFromFontSize(heading.style);
    const lineHeight = lineHeightFromStyle(heading.style);
    const weight = fontWeightFromStyle(heading.style);
    const sizeOk = !Number.isFinite(sizeMax)
      || (heading.level === 1 ? sizeMax <= 82 : sizeMax <= 64);
    const lineOk = !Number.isFinite(lineHeight) || lineHeight >= 1;
    const weightOk = !Number.isFinite(weight) || (heading.level === 1 ? weight <= 820 : weight <= 850);
    return sizeOk && lineOk && weightOk;
  });
}

function paragraphRhythmPass(markup) {
  return inlineParagraphs(markup).every(({ style, text }) => {
    const normalizedText = text.replace(/\s+/g, " ").trim();
    const lineHeight = lineHeightFromStyle(style);
    if (normalizedText.length < 60 || !Number.isFinite(lineHeight)) {
      return true;
    }
    return lineHeight >= 1.42;
  });
}

function uppercaseLabelsPass(markup) {
  return [...markup.matchAll(/<p\b[^>]*style="([^"]*text-transform:\s*uppercase[^"]*)"[^>]*>/gi)].every((match) => {
    const style = match[1];
    const fontSize = maxPxFromFontSize(style);
    const weight = fontWeightFromStyle(style);
    return (!Number.isFinite(fontSize) || fontSize >= 12)
      && (!Number.isFinite(weight) || weight <= 900);
  });
}

function inlineHeadings(markup) {
  return [...markup.matchAll(/<h([1-6])\b[^>]*style="([^"]*)"[^>]*>/gi)]
    .map((match) => ({ level: Number(match[1]), style: match[2] }));
}

function inlineParagraphs(markup) {
  return [...markup.matchAll(/<p\b[^>]*style="([^"]*)"[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => ({ style: match[1], text: stripTags(match[2]) }));
}

function hasEffectiveHeadingCaps(customCss) {
  return customCss.includes(".wp-site-blocks h1.wp-block-heading")
    && customCss.includes(".wp-site-blocks h2.wp-block-heading")
    && customCss.includes(".wp-site-blocks h3.wp-block-heading")
    && customCss.includes("font-weight:var(--wp--custom--som--type--heading-weight)!important")
    && customCss.includes("line-height:var(--wp--custom--som--type--heading-line-height)!important")
    && /h1\.wp-block-heading\{[\s\S]*font-size:clamp\([^}]+!important/.test(customCss)
    && /h2\.wp-block-heading\{[\s\S]*font-size:clamp\([^}]+!important/.test(customCss)
    && /h3\.wp-block-heading\{[\s\S]*font-size:clamp\([^}]+!important/.test(customCss);
}

function stripTags(value) {
  return value.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]*>/g, "");
}

function maxPxFromFontSize(style) {
  const fontSize = style.match(/font-size:\s*([^;]+)/i)?.[1];
  if (!fontSize) {
    return NaN;
  }
  const pxValues = [...fontSize.matchAll(/([0-9.]+)px/g)].map((match) => Number(match[1]));
  if (pxValues.length) {
    return Math.max(...pxValues);
  }
  const remValues = [...fontSize.matchAll(/([0-9.]+)rem/g)].map((match) => Number(match[1]) * 16);
  return remValues.length ? Math.max(...remValues) : NaN;
}

function lineHeightFromStyle(style) {
  return number(style.match(/line-height:\s*([0-9.]+)/i)?.[1]);
}

function fontWeightFromStyle(style) {
  return number(style.match(/font-weight:\s*([0-9]+)/i)?.[1]);
}

function isSerifStack(stack) {
  return /\b(serif|Georgia|Cambria|Iowan|Palatino|Rockwell|Slab)\b/i.test(String(stack || ""));
}

function remValue(value) {
  const text = String(value || "");
  if (text.endsWith("rem")) {
    return Number.parseFloat(text);
  }
  if (text.endsWith("px")) {
    return Number.parseFloat(text) / 16;
  }
  return Number.parseFloat(text);
}

function chValue(value) {
  const text = String(value || "");
  return text.endsWith("ch") ? Number.parseFloat(text) : NaN;
}

function number(value) {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function describeScale(fontSizes) {
  const pairs = ["body", "lead", "card-title", "section-title", "hero"]
    .map((slug) => `${slug}:${fontSizes[slug]?.fluid?.min || "?"}-${fontSizes[slug]?.fluid?.max || "?"}`);
  return pairs.join(", ");
}

function describeInlineHeadings(markup) {
  const headings = inlineHeadings(markup)
    .map((heading) => `h${heading.level} max ${maxPxFromFontSize(heading.style) || "?"}px / lh ${lineHeightFromStyle(heading.style) || "?"} / w ${fontWeightFromStyle(heading.style) || "?"}`);
  return headings.length ? headings.join("; ") : "No inline heading styles.";
}

function printReport(report) {
  const passed = report.checks.filter((check) => check.passed).length;
  console.log(`\nTypography guardrails for ${report.target}`);
  console.log(`Score: ${passed}/${report.checks.length}`);
  for (const check of report.checks) {
    console.log(`- ${check.passed ? "OK" : "FAIL"} ${check.name}: ${check.detail}`);
  }
}

async function defaultTargets() {
  return Promise.all((await specTargets([])).map(async (specPath) => blueprintPathForSpec(await readSpec(specPath))));
}
