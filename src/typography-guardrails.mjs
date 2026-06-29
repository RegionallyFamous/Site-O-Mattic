import {
  extractCustomCss,
  extractGlobalStyles,
  extractPageContent,
  getRunPhpStep,
} from "./blueprint-inspect.mjs";
import { blueprintPathForSpec, readSpec, specTargets } from "./spec-utils.mjs";
import fs from "node:fs/promises";

const hasExplicitTargets = process.argv.slice(2).length > 0;
const targets = process.argv.slice(2);
if (!targets.length) {
  targets.push(...await defaultTargets());
}

let hasFailure = false;
const reports = [];

for (const target of targets) {
  const report = await buildReport(target);
  reports.push(report);
  printReport(report);
  if (report.checks.some((check) => !check.passed)) {
    hasFailure = true;
  }
}

const batchReport = hasExplicitTargets ? null : buildBatchTypographyReport(reports);
if (batchReport) {
  printReport(batchReport);
  if (batchReport.checks.some((check) => !check.passed)) {
    hasFailure = true;
  }
}

if (hasFailure) {
  process.exit(1);
}

async function buildReport(target) {
  const { blueprint, blueprintTarget, spec } = await loadBlueprintForTarget(target);
  const phpStep = getRunPhpStep(blueprint);
  if (!phpStep) {
    return {
      target,
      checks: [{ name: "runPHP setup", passed: false, detail: "Missing setup step." }],
      type: {}
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
  add(checks, "typography treatment is defined", !type.fallbackTreatment, type.fallbackTreatment ? `${type.treatment || "missing"} fell back to ${type.fallbackTreatment}` : type.treatment || "missing treatment");
  add(checks, "body type is readable", isReadableBodyStack(type.bodyFont), type.bodyFont || "missing body font");
  add(checks, "display type avoids novelty fonts", hasNoNoveltyFonts(type.displayFont), type.displayFont || "missing display font");
  add(checks, "display type avoids heavy fallback slabs", hasNoHeavyFallbackDisplay(type), type.displayFont || "missing display font");
  add(checks, "accent type avoids novelty fonts", hasNoNoveltyFonts(type.accentFont), type.accentFont || "missing accent font");
  add(checks, "accent role fits premium service voice", premiumAccentRoleFitPass(type), describePremiumAccentRole(type));
  add(checks, "role font voices have contrast", roleFontVoicesHaveContrast(type), describeRoleVoices(type));
  add(checks, "botanical service type has organic contrast", botanicalServiceTypePass(type, pageContent, spec), describeBotanicalTypeVoice(type, pageContent, spec));
  add(checks, "heading weight restraint", headingWeightPass(type), `weight ${type.headingWeight || "missing"} for ${type.displayFont || "missing display font"}`);
  add(checks, "action/nav/label weight restraint", actionWeightPass(type), `action ${type.actionWeight || "missing"}, nav ${type.navWeight || "missing"}, label ${type.labelWeight || "missing"}`);
  add(checks, "line-height readability", lineHeightsPass(type), `heading ${type.headingLineHeight || "missing"}, body ${type.bodyLineHeight || "missing"}`);
  add(checks, "readable copy measure", measurePass(customCss, measure), `copy ${measure.copy || "missing"}, tight ${measure.tight || "missing"}`);
  add(checks, "fluid scale restraint", fluidScalePass(fontSizes), describeScale(fontSizes));
  add(checks, "proof metric alignment rails", proofMetricAlignmentPass(customCss), "Shared CSS uses fixed stat and label rows for proof cards.");
  add(checks, "utility text uses type tokens", utilityTextTokenPass(pageContent, customCss, type), describeUtilityText(pageContent, customCss));
  add(checks, "proof/stat text weight restraint", proofTextWeightPass(pageContent, type), describeProofTextWeights(pageContent));
  add(checks, "effective heading caps", headingCaps, "Shared CSS caps h1/h2/h3 size, weight, and line-height over legacy inline styles.");
  add(checks, "manual headline hyphenation", headlineHyphenationPass(customCss), "Headlines should wrap by words first; do not allow automatic mid-word hyphenation.");
  add(checks, "variant rhythm does not undercut type system", variantRhythmPass(customCss), "Variant CSS must not reintroduce priority overrides.");
  add(checks, "inline heading restraint", inlineHeadingsPass(pageContent, headingCaps, fontSizes), describeInlineHeadings(pageContent, fontSizes));
  add(checks, "body copy weight restraint", bodyCopyWeightPass(pageContent), describeBodyCopyWeights(pageContent));
  add(checks, "paragraph rhythm", paragraphRhythmPass(pageContent), "Readable body copy should not use cramped line-height.");
  add(checks, "uppercase label restraint", uppercaseLabelsPass(pageContent), "Small uppercase labels must be large enough and not black-weight.");
  add(checks, "small bold inline text restraint", smallBoldInlineTextPass(pageContent), describeSmallBoldInlineText(pageContent));

  return { target, checks, type };
}

async function loadBlueprintForTarget(target) {
  const parsed = JSON.parse(await fs.readFile(target, "utf8"));
  if (Array.isArray(parsed.steps)) {
    return { blueprint: parsed, blueprintTarget: target, spec: await specForBlueprintTarget(target) };
  }
  if (parsed.slug) {
    const blueprintTarget = blueprintPathForSpec(parsed);
    return {
      blueprint: JSON.parse(await fs.readFile(blueprintTarget, "utf8")),
      blueprintTarget,
      spec: parsed
    };
  }
  return { blueprint: parsed, blueprintTarget: target, spec: await specForBlueprintTarget(target) };
}

async function specForBlueprintTarget(blueprintTarget) {
  const slug = String(blueprintTarget || "").match(/public\/blueprints\/([^/]+)\/blueprint\.json$/)?.[1];
  if (!slug) {
    return null;
  }
  try {
    return JSON.parse(await fs.readFile(`specs/${slug}.json`, "utf8"));
  } catch {
    return null;
  }
}

function add(checks, name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), detail });
}

function buildBatchTypographyReport(reports) {
  const usableReports = reports.filter((report) => report.type?.bodyFont && report.type?.displayFont && report.type?.accentFont);
  if (usableReports.length < 10) {
    return null;
  }

  const checks = [];
  const displayCounts = countBy(usableReports, (report) => primaryFamily(report.type.displayFont));
  const tripletCounts = countBy(usableReports, (report) => [
    primaryFamily(report.type.bodyFont),
    primaryFamily(report.type.displayFont),
    primaryFamily(report.type.accentFont)
  ].join(" / "));
  const categoryCounts = countBy(usableReports, (report) => displayCategory(report.type.displayFont));
  const maxDisplay = maxCount(displayCounts);
  const maxTriplet = maxCount(tripletCounts);
  const maxCategory = maxCount(categoryCounts);
  const total = usableReports.length;
  const displayFamilyBudget = Math.ceil(total * 0.18);
  const displayCategoryBudget = Math.floor(total * 0.4);

  add(checks, "batch display variety", displayCounts.size >= Math.min(6, Math.ceil(total / 6)), describeCounts(displayCounts));
  add(checks, "batch display concentration", maxDisplay.count <= displayFamilyBudget, `${maxDisplay.key || "missing"} used ${maxDisplay.count}/${total}; budget ${displayFamilyBudget}`);
  add(checks, "batch exact pairing concentration", maxTriplet.count <= Math.ceil(total * 0.16), `${maxTriplet.key || "missing"} used ${maxTriplet.count}/${total}`);
  add(checks, "batch display category mix", categoryCounts.size >= 3, describeCounts(categoryCounts));
  add(checks, "batch display category concentration", maxCategory.count <= displayCategoryBudget, `${maxCategory.key || "missing"} used ${maxCategory.count}/${total}; budget ${displayCategoryBudget}`);

  return { target: "batch typography distribution", checks, type: {} };
}

function countBy(items, keyFn) {
  const counts = new Map();
  for (const item of items) {
    const key = keyFn(item) || "missing";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function maxCount(counts) {
  let winner = { key: "", count: 0 };
  for (const [key, count] of counts) {
    if (count > winner.count) {
      winner = { key, count };
    }
  }
  return winner;
}

function describeCounts(counts) {
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([key, count]) => `${key}:${count}`)
    .join(", ");
}

function displayCategory(stack) {
  const family = primaryFamily(stack);
  if (/\b(didot|bodoni|baskerville|hoefler|charter|iowan|palatino|georgia|cambria)\b/i.test(family)) {
    return "editorial-serif";
  }
  if (/\b(rockwell|american typewriter)\b/i.test(family)) {
    return "slab-or-workbench";
  }
  if (/\b(din|aptos narrow|arial narrow|roboto condensed)\b/i.test(family)) {
    return "condensed-utility";
  }
  if (/\b(futura|century gothic)\b/i.test(family)) {
    return "geometric-sans";
  }
  return "sturdy-humanist-sans";
}

function isReadableBodyStack(stack) {
  return Boolean(stack)
    && hasNoNoveltyFonts(stack)
    && !/\b(monospace|Mono|Consolas|Menlo|Arial Narrow|Roboto Condensed|Aptos Narrow|Impact)\b/i.test(stack);
}

function hasNoNoveltyFonts(stack) {
  return Boolean(stack)
    && !/\b(Impact|Arial Black|Segoe UI Black|Comic Sans|Papyrus|Brush Script|Curlz|Jokerman|Chiller|Cooper Black|Arial Rounded MT Bold|Chalkboard|Marker Felt|Noteworthy|Herculanum|Zapfino|Snell Roundhand|Mistral|Bradley Hand|Hobo|Party LET)\b/i.test(stack);
}

function hasNoHeavyFallbackDisplay(type) {
  const display = primaryFamily(type.displayFont);
  return Boolean(display)
    && !/\b(rockwell|american typewriter)\b/i.test(display);
}

function premiumAccentRoleFitPass(type) {
  const treatment = String(type.treatment || "");
  if (!/(craft-bench|restoration-craft|handcrafted-lettering|pet-editorial)/.test(treatment)) {
    return true;
  }
  return !isMonoOrReceiptStack(type.accentFont);
}

function describePremiumAccentRole(type) {
  return `${type.treatment || "missing treatment"} uses ${primaryFamily(type.accentFont) || "missing accent"}`;
}

function roleFontVoicesHaveContrast(type) {
  const body = primaryFamily(type.bodyFont);
  const display = primaryFamily(type.displayFont);
  const accent = primaryFamily(type.accentFont);
  const voices = new Set([body, display, accent].filter(Boolean));
  return Boolean(body && display && accent)
    && body !== display
    && body !== accent
    && display !== accent
    && voices.size === 3;
}

function botanicalServiceTypePass(type, markup, spec) {
  if (!isBotanicalServiceSpec(spec, markup)) {
    return true;
  }
  const category = displayCategory(type.displayFont);
  const weight = number(type.headingWeight);
  if (/editorial-serif|slab-or-workbench/.test(category)) {
    return Number.isFinite(weight) && weight <= 700;
  }
  return Number.isFinite(weight) && weight <= 720;
}

function describeBotanicalTypeVoice(type, markup, spec) {
  if (!isBotanicalServiceSpec(spec, markup)) {
    return "not a botanical service page";
  }
  return `${displayCategory(type.displayFont)} display at weight ${type.headingWeight || "missing"} (${primaryFamily(type.displayFont) || "missing"})`;
}

function isBotanicalServiceSpec(spec, markup) {
  const specIdentity = [
    spec?.slug,
    spec?.niche,
    spec?.businessName,
    spec?.pattern?.secondaryPattern,
    spec?.pattern?.styleContract,
    spec?.brandBrief?.signatureMove
  ].filter(Boolean).join(" ");
  if (/\b(houseplant|plant care|plant-care|office plant|pollinator garden|garden refresh|micro-wedding floral|florals|floral design|botanical)\b/i.test(specIdentity)) {
    return true;
  }
  return /\b(houseplant|plant care|office plant care|pollinator garden|garden refresh|floral service|botanical service)\b/i.test(stripTags(markup));
}

function describeRoleVoices(type) {
  return `body ${primaryFamily(type.bodyFont) || "missing"}, display ${primaryFamily(type.displayFont) || "missing"}, accent ${primaryFamily(type.accentFont) || "missing"}`;
}

function primaryFamily(stack) {
  return String(stack || "")
    .split(",")[0]
    .replaceAll("\"", "")
    .replaceAll("'", "")
    .trim()
    .toLowerCase();
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
  const label = number(type.labelWeight);
  return Number.isFinite(action)
    && Number.isFinite(nav)
    && Number.isFinite(label)
    && action >= 650
    && action <= 820
    && nav >= 650
    && nav <= 800
    && label >= 620
    && label <= 780;
}

function lineHeightsPass(type) {
  const heading = number(type.headingLineHeight);
  const body = number(type.bodyLineHeight);
  return Number.isFinite(heading)
    && Number.isFinite(body)
    && heading >= 1.04
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

function proofMetricAlignmentPass(customCss) {
  return customCss.includes("grid-template-rows:minmax(2.1em, auto) auto")
    && customCss.includes(".som-proof-card")
    && !customCss.includes("[class*=\"-proof-card\"]")
    && customCss.includes("font-family:var(--wp--preset--font-family--display)")
    && customCss.includes("font-family:var(--wp--preset--font-family--accent)");
}

function utilityTextTokenPass(markup, customCss, type) {
  const label = number(type.labelWeight);
  const action = number(type.actionWeight);
  return Number.isFinite(label)
    && Number.isFinite(action)
    && customCss.includes("--wp--custom--som--type--label-weight")
    && customCss.includes("font-weight:var(--wp--custom--som--type--label-weight)")
    && inlineUtilityParagraphs(markup).every(({ style }) => {
      const weight = fontWeightFromStyle(style);
      return !Number.isFinite(weight) || weight <= label;
    })
    && inlineButtonAnchors(markup).every(({ style }) => {
      const weight = fontWeightFromStyle(style);
      return Number.isFinite(weight) && weight <= action;
    });
}

function describeUtilityText(markup, customCss) {
  const utilityWeights = inlineUtilityParagraphs(markup)
    .map(({ style }) => fontWeightFromStyle(style))
    .filter(Number.isFinite);
  const buttonWeights = inlineButtonAnchors(markup)
    .map(({ style }) => fontWeightFromStyle(style))
    .filter(Number.isFinite);
  const maxUtility = utilityWeights.length ? Math.max(...utilityWeights) : "none";
  const maxButton = buttonWeights.length ? Math.max(...buttonWeights) : "none";
  const hasVariable = customCss.includes("--wp--custom--som--type--label-weight") ? "label var present" : "label var missing";
  return `${hasVariable}; utility max ${maxUtility}; button max ${maxButton}`;
}

function proofTextWeightPass(markup, type) {
  const label = number(type.labelWeight || type.actionWeight);
  const cap = Number.isFinite(label) ? Math.min(label, 780) : 780;
  return inlineProofParagraphs(markup).every(({ style }) => {
    const weight = fontWeightFromStyle(style);
    return !Number.isFinite(weight) || weight <= cap;
  });
}

function describeProofTextWeights(markup) {
  const weights = inlineProofParagraphs(markup)
    .map(({ style }) => fontWeightFromStyle(style))
    .filter(Number.isFinite);
  const maxWeight = weights.length ? Math.max(...weights) : "none";
  return `proof/stat paragraph max ${maxWeight}`;
}

function variantRhythmPass(customCss) {
  return !priorityOverridePattern().test(customCss);
}

function headlineHyphenationPass(customCss) {
  return customCss.includes("hyphens:manual")
    && !customCss.includes("hyphens:auto");
}

function inlineHeadingsPass(markup, headingCaps, fontSizes) {
  return inlineHeadings(markup).every((heading) => {
    const sizeMax = maxPxFromFontSize(heading.style, fontSizes);
    const lineHeight = lineHeightFromStyle(heading.style);
    const weight = fontWeightFromStyle(heading.style);
    const sizeOk = !Number.isFinite(sizeMax)
      || (heading.level === 1 ? sizeMax <= 86 : sizeMax <= 64);
    const lineOk = !Number.isFinite(lineHeight) || lineHeight >= 1;
    const weightOk = !Number.isFinite(weight) || (heading.level === 1 ? weight <= 820 : weight <= 850);
    return headingCaps && sizeOk && lineOk && weightOk;
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

function bodyCopyWeightPass(markup) {
  return inlineParagraphs(markup).every(({ style, text }) => {
    const normalizedText = text.replace(/\s+/g, " ").trim();
    const weight = fontWeightFromStyle(style);
    if (normalizedText.length < 55 || !Number.isFinite(weight)) {
      return true;
    }
    return weight <= 820;
  });
}

function describeBodyCopyWeights(markup) {
  const weights = inlineParagraphs(markup)
    .map(({ style, text }) => ({ weight: fontWeightFromStyle(style), length: text.replace(/\s+/g, " ").trim().length }))
    .filter((item) => item.length >= 55 && Number.isFinite(item.weight));
  const maxWeight = weights.length ? Math.max(...weights.map((item) => item.weight)) : "none";
  return `long paragraph max ${maxWeight}`;
}

function uppercaseLabelsPass(markup) {
  return [...markup.matchAll(/<p\b[^>]*style="([^"]*text-transform:\s*uppercase[^"]*)"[^>]*>/gi)].every((match) => {
    const style = match[1];
    const fontSize = maxPxFromFontSize(style);
    const weight = fontWeightFromStyle(style);
    return (!Number.isFinite(fontSize) || fontSize >= 16)
      && (!Number.isFinite(weight) || weight <= 780);
  });
}

function smallBoldInlineTextPass(markup) {
  return smallBoldInlineTextFindings(markup).length === 0;
}

function describeSmallBoldInlineText(markup) {
  const findings = smallBoldInlineTextFindings(markup);
  if (!findings.length) {
    return "No inline text under 16px paired with 700+ weight.";
  }
  return findings.slice(0, 4).map((item) => `${item.tag} ${item.size}px / w${item.weight}`).join("; ");
}

function smallBoldInlineTextFindings(markup) {
  return [...markup.matchAll(/<([a-z0-9-]+)\b[^>]*style="([^"]*)"[^>]*>/gi)]
    .map((match) => ({
      tag: match[1].toLowerCase(),
      style: match[2],
      size: maxPxFromFontSize(match[2]),
      weight: fontWeightFromStyle(match[2])
    }))
    .filter((item) => ["p", "ul", "ol", "li", "span", "a", "summary", "td", "th"].includes(item.tag))
    .filter((item) => Number.isFinite(item.size) && item.size < 16 && Number.isFinite(item.weight) && item.weight >= 700);
}

function inlineHeadings(markup) {
  return [...markup.matchAll(/<h([1-6])\b[^>]*style="([^"]*)"[^>]*>/gi)]
    .map((match) => ({ level: Number(match[1]), style: match[2] }));
}

function inlineParagraphs(markup) {
  return [...markup.matchAll(/<p\b[^>]*style="([^"]*)"[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => ({ style: match[1], text: stripTags(match[2]) }));
}

function inlineUtilityParagraphs(markup) {
  return [...markup.matchAll(/<p\b([^>]*)style="([^"]*)"([^>]*)>/gi)]
    .filter((match) => {
      const tag = `${match[1]} ${match[3]}`;
      return /text-transform:\s*uppercase/i.test(match[2]) || isUtilityTypographyClass(tag);
    })
    .map((match) => ({ style: match[2] }));
}

function inlineProofParagraphs(markup) {
  const proofClassPattern = [
    "som-proof-card",
    "som-route-proof-card",
    "som-evidence-card",
    "som-floating-proof-cell",
    "som-floral-proof-card",
    "som-process-card"
  ].join("|");
  const containerPattern = new RegExp(`<div\\b(?=[^>]*\\b(?:${proofClassPattern})\\b)[^>]*>([\\s\\S]*?)<\\/div>`, "gi");
  const paragraphs = [];
  for (const container of markup.matchAll(containerPattern)) {
    for (const paragraph of container[1].matchAll(/<p\b[^>]*style="([^"]*)"[^>]*>/gi)) {
      paragraphs.push({ style: paragraph[1] });
    }
  }
  return paragraphs;
}

function inlineButtonAnchors(markup) {
  return [...markup.matchAll(/<a\b(?=[^>]*\bwp-block-button__link\b)[^>]*style="([^"]*)"[^>]*>/gi)]
    .map((match) => ({ style: match[1] }));
}

function isUtilityTypographyClass(tag) {
  return /\bsom-(?:chip|method-pill|ticket-line|rail-note|date-cell|section-anchor-label|route-status-stat|route-status-label|route-process-label|[a-z-]+number)\b/.test(String(tag || ""));
}

function hasEffectiveHeadingCaps(customCss) {
  return customCss.includes(".wp-site-blocks h1.wp-block-heading")
    && customCss.includes(".wp-site-blocks h2.wp-block-heading")
    && customCss.includes(".wp-site-blocks h3.wp-block-heading")
    && customCss.includes("font-weight:var(--wp--custom--som--type--heading-weight)")
    && customCss.includes("line-height:var(--wp--custom--som--type--heading-line-height)")
    && /h1\.wp-block-heading\{[\s\S]*font-size:clamp\(/.test(customCss)
    && /h2\.wp-block-heading\{[\s\S]*font-size:clamp\(/.test(customCss)
    && /h3\.wp-block-heading\{[\s\S]*font-size:clamp\(/.test(customCss);
}

function priorityOverridePattern() {
  return new RegExp(`!${"important"}\\b`, "i");
}

function stripTags(value) {
  return value.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]*>/g, "");
}

function maxPxFromFontSize(style, fontSizes = {}) {
  const fontSize = style.match(/font-size:\s*([^;]+)/i)?.[1];
  if (!fontSize) {
    return NaN;
  }
  const pxValues = [...fontSize.matchAll(/([0-9.]+)px/g)].map((match) => Number(match[1]));
  const remValues = [...fontSize.matchAll(/([0-9.]+)rem/g)].map((match) => Number(match[1]) * 16);
  const presetValues = [...fontSize.matchAll(/var\(--wp--preset--font-size--([a-z0-9-]+)\)/gi)]
    .map((match) => fontSizePresetMaxPx(fontSizes[match[1]]))
    .filter(Number.isFinite);
  const allValues = [...pxValues, ...remValues, ...presetValues];
  return allValues.length ? Math.max(...allValues) : NaN;
}

function lineHeightFromStyle(style) {
  return number(style.match(/line-height:\s*([0-9.]+)/i)?.[1]);
}

function fontWeightFromStyle(style) {
  return number(style.match(/font-weight:\s*([0-9]+)/i)?.[1]);
}

function isSerifStack(stack) {
  const value = String(stack || "").replace(/\bsans-serif\b/gi, "");
  return /\b(serif|Georgia|Cambria|Iowan|Palatino|Rockwell|Slab|Didot|Bodoni|Baskerville|Hoefler|Charter|American Typewriter|Times)\b/i.test(value);
}

function isMonoOrReceiptStack(stack) {
  return /\b(mono|monospace|courier|consolas|menlo|sfmono|liberation mono|ibm plex mono)\b/i.test(String(stack || ""));
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

function fontSizePresetMaxPx(preset) {
  if (!preset) {
    return NaN;
  }
  const values = [preset.fluid?.max, preset.size]
    .map((value) => remValue(value) * 16)
    .filter(Number.isFinite);
  return values.length ? Math.max(...values) : NaN;
}

function describeInlineHeadings(markup, fontSizes) {
  const headings = inlineHeadings(markup)
    .map((heading) => `h${heading.level} max ${maxPxFromFontSize(heading.style, fontSizes) || "?"}px / lh ${lineHeightFromStyle(heading.style) || "?"} / w ${fontWeightFromStyle(heading.style) || "?"}`);
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
