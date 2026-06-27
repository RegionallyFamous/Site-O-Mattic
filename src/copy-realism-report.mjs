import { requiredServiceDetailFields, validateProductionPolishFields } from "./production-polish-fields.mjs";
import { readSpec, specTargets } from "./spec-utils.mjs";

const targets = await specTargets(process.argv.slice(2));
let hasFailures = false;
const catalogSpecs = [];
const instructionPattern = /\b(send|share|tell|include|date|photo|photos|call|email|venue|access|size|window|colors|symptoms|address|room|scope|count|guest|guests|palette|timing|checkout|lock|laundry|menu|headcount|event|surface|project|bike|vehicle|yard|home|timeline|finish|power|outlet|circuit|roof|pool|plant|pet|soil|shelf|wardrobe|temperament|mobility|retouch)\b/i;
const processActionPattern = /\b(send|check|confirm|review|prep|set|schedule|arrive|place|clean|tune|install|handoff|reply|walk|test|measure|sort|match|deliver|quote|reset|route|design|style|choose|build|plan|pack|label|wash|brush|skim|mount|pair|organize|stage|garnish|sharpen|photograph|paint|repair|restore|seal|stain|remove|donate|refresh|sample|reserve|book|compare|explore|view|lock|translate|treat|extract|pick|line|clear|bag|text|load|sweep|shape|leave|read|talk|share)\b/i;
const nicheLeakChecks = [
  { pattern: /\b(timers?|takedown)\b/i, allowed: /holiday-light-installation/, label: "holiday-light scheduling language" },
  { pattern: /\b(loose joints?|sentimental constraints?)\b/i, allowed: /furniture-refinishing-repair/, label: "furniture repair constraints" },
  { pattern: /\b(blade condition|skip the bench|problem blades)\b/i, allowed: /mobile-knife-sharpening/, label: "knife sharpening bench language" },
  { pattern: /\b(equipment photos|storm\/debris|storm debris)\b/i, allowed: /pool-cleaning/, label: "pool route equipment language" },
  { pattern: /\bfixed finishes\b/i, allowed: /interior-color-consultant/, label: "interior color fixed-finish language" },
  { pattern: /\bdonation or packing needs\b/i, allowed: /senior-downsizing-move-prep/, label: "downsizing packing language" },
  { pattern: /\bpower\/water rules\b/i, allowed: /coffee-cart-catering|mocktail-beverage-cart|wood-fired-pizza-taco-catering|micro-wedding-florals/, label: "event utility rules language" },
  { pattern: /\bbackdrop or sound footprint\b/i, allowed: /$^/, label: "generic backdrop/sound footprint language" },
  { pattern: /\bfinished report or handoff\b/i, allowed: /vacation-rental-turnover|smart-home-setup/, label: "receipt handoff language" },
  { pattern: /\bparking or storage priorities\b/i, allowed: /garage-organization/, label: "garage parking priority language" },
  { pattern: /\bdecision pressure\b/i, allowed: /$^/, label: "generic consult-pressure language" }
];
const fakeLocalAreaPattern = /\b(across town|across the area|across the local area|local area|metro area|across the metro|across the city|nearby neighborhoods)\b/i;

for (const target of targets) {
  const spec = await readSpec(target);
  catalogSpecs.push(spec);
  const report = inspectCopy(spec);
  printReport(target, report);
  if (report.checks.some((check) => !check.passed)) {
    hasFailures = true;
  }
}

const catalogReport = inspectCatalogCopy(catalogSpecs);
if (catalogReport.checks.length) {
  printCatalogReport(catalogReport);
}
if (catalogReport.checks.some((check) => !check.passed)) {
  hasFailures = true;
}

if (hasFailures) {
  process.exit(1);
}

function inspectCopy(spec) {
  const checks = [];
  const allCopy = [
    spec.copy?.heroText,
    spec.copy?.introText,
    spec.copy?.quoteText,
    spec.contact?.serviceArea,
    ...((spec.services || []).flatMap((item) => [item.title, item.text])),
    ...((spec.process || []).flatMap((item) => [item.title, item.text])),
    ...((spec.proof || []).flatMap((item) => [item.stat, item.label])),
    ...requiredServiceDetailFields().map((field) => spec.serviceDetails?.[field])
  ].filter(Boolean).join(" ");

  const polishErrors = validateProductionPolishFields(spec).filter((error) => error.startsWith("serviceDetails"));

  add(checks, "service details present", !polishErrors.length, polishErrors.join("; ") || "turnaround, what to send, prep, rhythm, objection answer");
  add(checks, "quote text gives instructions", instructionPattern.test(spec.copy?.quoteText || ""), spec.copy?.quoteText || "missing quote text");
  add(checks, "CTA names action", actionCta(spec.copy?.primaryCta) && actionCta(spec.copy?.secondaryCta), `${spec.copy?.primaryCta || "missing"} / ${spec.copy?.secondaryCta || "missing"}`);
  add(checks, "service-area specificity", String(spec.contact?.serviceArea || "").length >= 80 && commaCount(spec.contact?.serviceArea) >= 2, spec.contact?.serviceArea || "missing service area");
  add(checks, "service area uses named places", !fakeLocalAreaPattern.test(spec.contact?.serviceArea || ""), spec.contact?.serviceArea || "missing service area");
  add(checks, "concrete nouns", concreteWordCount(allCopy) >= 45, `${concreteWordCount(allCopy)} concrete-ish words`);
  add(checks, "no empty marketing filler", fillerCount(allCopy) <= 2, `${fillerCount(allCopy)} filler phrase hits`);
  add(checks, "proof avoids fake review claims", !/\b(5-star|five-star|hundreds of reviews|rated #?1|best in town)\b/i.test(allCopy), "No unverifiable review/ranking claims.");
  add(checks, "process includes real next steps", (spec.process || []).every((item) => processActionPattern.test(`${item.title} ${item.text}`)), "Each process item should describe an action.");
  add(checks, "copy stays concise", String(spec.copy?.heroTitle || "").length <= 78 && String(spec.copy?.heroText || "").length <= 300, `${String(spec.copy?.heroTitle || "").length} title chars / ${String(spec.copy?.heroText || "").length} hero text chars`);
  const nicheLeaks = nicheFitProblems(spec, allCopy);
  add(checks, "no wrong-niche service language", nicheLeaks.length === 0, nicheLeaks.join("; ") || "No copied operating details from another niche.");

  return { checks };
}

function inspectCatalogCopy(specs) {
  const checks = [];
  if (specs.length < 12) {
    return { checks };
  }

  const quoteOpenings = specs.map((spec) => quoteOpening(spec.copy?.quoteText));
  const topQuoteOpening = topCount(quoteOpenings);
  const genericObjectionHits = specs.filter((spec) => /scope,\s*access,\s*timing,\s*and\s*fit\s*are\s*confirmed\s*before\s*booking/i.test(spec.serviceDetails?.objectionAnswer || ""));
  const duplicateObjection = topCount(specs.map((spec) => normalizeSentence(spec.serviceDetails?.objectionAnswer)));
  const quoteOpeningBudget = Math.max(5, Math.floor(specs.length * 0.28));

  add(checks, "quote instruction openings vary", topQuoteOpening.count <= quoteOpeningBudget && topQuoteOpening.value !== "send", `${topQuoteOpening.value || "none"} appears ${topQuoteOpening.count}/${specs.length}; budget ${quoteOpeningBudget}`);
  add(checks, "objection answers are pattern-specific", genericObjectionHits.length === 0, genericObjectionHits.map((spec) => spec.slug).join(", ") || "No generic shared objection answer.");
  add(checks, "objection answers avoid exact duplicates", duplicateObjection.count <= 2, `${duplicateObjection.value || "none"} appears ${duplicateObjection.count}/${specs.length}`);

  return { checks };
}

function actionCta(value) {
  return /\b(book|check|send|request|call|ask|plan|map|start|join|compare|see|explore|reserve|email|get|build|choose|schedule|review|sample|feed|order|quote|price|estimate|visit|fix|clean|clear|style|design|view|browse|what|text)\b/i.test(String(value || ""));
}

function commaCount(value) {
  return (String(value || "").match(/,/g) || []).length;
}

function concreteWordCount(value) {
  const stop = new Set(["that", "this", "with", "from", "your", "into", "about", "before", "after", "right", "clear", "small", "local", "service"]);
  return String(value || "")
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.filter((word) => word.length >= 5 && !stop.has(word)).length || 0;
}

function fillerCount(value) {
  const matches = String(value || "").match(/\b(quality service|professional service|we care|best service|great results|customer satisfaction|one stop shop|stress free)\b/gi);
  return matches?.length || 0;
}

function nicheFitProblems(spec, allCopy) {
  return nicheLeakChecks
    .filter((check) => check.pattern.test(allCopy) && !check.allowed.test(spec.slug || ""))
    .map((check) => `${check.label} appears in ${spec.slug}`);
}

function quoteOpening(value) {
  const words = String(value || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return words.join(" ");
}

function normalizeSentence(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function topCount(values) {
  const counts = new Map();
  for (const value of values.filter(Boolean)) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value))[0] || { value: "", count: 0 };
}

function add(checks, name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), detail });
}

function printReport(target, report) {
  console.log(`\nCopy realism for ${target}`);
  for (const check of report.checks) {
    console.log(`- ${check.passed ? "OK" : "FAIL"} ${check.name}: ${check.detail}`);
  }
}

function printCatalogReport(report) {
  console.log("\nCatalog copy realism");
  for (const check of report.checks) {
    console.log(`- ${check.passed ? "OK" : "FAIL"} ${check.name}: ${check.detail}`);
  }
}
