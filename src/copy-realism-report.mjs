import { requiredServiceDetailFields, validateProductionPolishFields } from "./production-polish-fields.mjs";
import { readSpec, specTargets } from "./spec-utils.mjs";

const targets = await specTargets(process.argv.slice(2));
let hasFailures = false;
const instructionPattern = /\b(send|share|tell|include|date|photo|photos|call|email|venue|access|size|window|colors|symptoms|address|room|scope|count|guest|guests|palette|timing|checkout|lock|laundry|menu|headcount|event|surface|project|bike|vehicle|yard|home|timeline|finish|power|roof|pool|plant|pet)\b/i;
const processActionPattern = /\b(send|check|confirm|review|prep|set|schedule|arrive|place|clean|tune|install|handoff|reply|walk|test|measure|sort|match|deliver|quote|reset|route|design|style|choose|build|plan|pack|label|wash|brush|skim|mount|pair|organize|stage|garnish|sharpen|photograph|paint|repair|restore|seal|stain|remove|donate|refresh|sample|reserve|book|compare|explore|view|lock|translate|treat|extract|pick|line|clear|bag|text|load|sweep|shape|leave|read|talk|share)\b/i;

for (const target of targets) {
  const spec = await readSpec(target);
  const report = inspectCopy(spec);
  printReport(target, report);
  if (report.checks.some((check) => !check.passed)) {
    hasFailures = true;
  }
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
  add(checks, "concrete nouns", concreteWordCount(allCopy) >= 45, `${concreteWordCount(allCopy)} concrete-ish words`);
  add(checks, "no empty marketing filler", fillerCount(allCopy) <= 2, `${fillerCount(allCopy)} filler phrase hits`);
  add(checks, "proof avoids fake review claims", !/\b(5-star|five-star|hundreds of reviews|rated #?1|best in town)\b/i.test(allCopy), "No unverifiable review/ranking claims.");
  add(checks, "process includes real next steps", (spec.process || []).every((item) => processActionPattern.test(`${item.title} ${item.text}`)), "Each process item should describe an action.");
  add(checks, "copy stays concise", String(spec.copy?.heroTitle || "").length <= 78 && String(spec.copy?.heroText || "").length <= 300, `${String(spec.copy?.heroTitle || "").length} title chars / ${String(spec.copy?.heroText || "").length} hero text chars`);

  return { checks };
}

function actionCta(value) {
  return /\b(book|check|send|request|call|ask|plan|start|join|compare|see|explore|reserve|email|get|build|choose|schedule|review|sample|feed|order|quote|price|visit|fix|clean|style|design|view|browse|what|text)\b/i.test(String(value || ""));
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

function add(checks, name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), detail });
}

function printReport(target, report) {
  console.log(`\nCopy realism for ${target}`);
  for (const check of report.checks) {
    console.log(`- ${check.passed ? "OK" : "FAIL"} ${check.name}: ${check.detail}`);
  }
}
