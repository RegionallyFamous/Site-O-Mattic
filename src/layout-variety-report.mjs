import {
  extractLayoutSignature,
  extractPageContent,
  getRunPhpStep,
  readBlueprint
} from "./blueprint-inspect.mjs";
import { LAYOUT_ARCHETYPES } from "./layout-archetypes.mjs";
import { blueprintPathForSpec, readSpec, specTargets } from "./spec-utils.mjs";

const DEFAULT_TARGETS = [
  "public/blueprints/lawn-care-service/blueprint.json",
  "public/blueprints/pressure-washing-service/blueprint.json"
];

const targets = process.argv.slice(2);
if (!targets.length) {
  targets.push(...await defaultTargets());
}

if (targets.length < 2) {
  console.log("Layout variety report needs at least two Blueprints.");
  process.exit(1);
}

const reports = await Promise.all(targets.map((target) => inspectBlueprint(target)));
let hasFailure = false;

console.log("\nLayout variety report");
for (const report of reports) {
  printBlueprintReport(report);
  if (report.checks.some((check) => !check.passed)) {
    hasFailure = true;
  }
}

for (let left = 0; left < reports.length; left += 1) {
  for (let right = left + 1; right < reports.length; right += 1) {
    const comparison = compareReports(reports[left], reports[right]);
    printComparison(comparison);
    if (!comparison.passed) {
      hasFailure = true;
    }
  }
}

if (hasFailure) {
  process.exit(1);
}

async function inspectBlueprint(target) {
  const blueprint = await readBlueprint(target);
  const phpStep = getRunPhpStep(blueprint);
  const checks = [];

  if (!phpStep) {
    return {
      target,
      signature: null,
      pageContent: "",
      componentClasses: new Set(),
      navLabels: [],
      checks: [{ name: "runPHP setup", passed: false, detail: "Missing setup step." }]
    };
  }

  let signature = null;
  try {
    signature = extractLayoutSignature(phpStep.code);
  } catch (error) {
    checks.push({ name: "layout signature JSON", passed: false, detail: error.message });
  }

  const pageContent = extractPageContent(phpStep.code);
  const componentClasses = new Set([...pageContent.matchAll(/\bsom-[a-z0-9-]+/g)].map((match) => match[0]));
  const navigationLinks = extractNavigationLinks(pageContent);
  const navLabels = navigationLinks.map((link) => link.label);
  const navTargets = navigationLinks.map((link) => link.target);

  add(checks, "embedded signature", Boolean(signature?.variant), signature?.variant || "Missing layout variant.");
  add(checks, "cataloged layout variant", Boolean(LAYOUT_ARCHETYPES[signature?.variant]?.archetype), signature?.variant || "Missing layout variant.");
  add(checks, "signature shape", hasSignatureShape(signature), signature ? `${signature.archetype}; ${signature.hero}` : "Missing signature fields.");
  add(checks, "expected component classes", hasExpectedClasses(signature, componentClasses), signature?.componentClassesExpected?.join(", ") || "No expected classes.");
  add(checks, "expected layout markers", hasExpectedMarkers(signature, pageContent), signature?.layoutMarkers?.join(", ") || "No expected markers.");
  add(checks, "navigation matches signature", arraysEqual(navLabels, signature?.navLabels || []), navLabels.join(" / ") || "No nav labels found.");
  add(checks, "navigation anchors match signature", arraysEqual(navTargets, signature?.anchorOrder || []), navTargets.join(" / ") || "No navigation anchors found.");

  return { target, signature, pageContent, componentClasses, navLabels, checks };
}

function compareReports(left, right) {
  const checks = [];
  const leftSignature = left.signature || {};
  const rightSignature = right.signature || {};
  const navSimilarity = jaccard(left.navLabels, right.navLabels);
  const classSimilarity = jaccard([...left.componentClasses], [...right.componentClasses]);

  checks.push(diffCheck("variant", leftSignature.variant !== rightSignature.variant, leftSignature.variant, rightSignature.variant));
  checks.push(diffCheck("hero", leftSignature.hero !== rightSignature.hero, leftSignature.hero, rightSignature.hero));
  checks.push(diffCheck("service presentation", leftSignature.servicePresentation !== rightSignature.servicePresentation, leftSignature.servicePresentation, rightSignature.servicePresentation));
  checks.push(diffCheck("proof treatment", leftSignature.proofTreatment !== rightSignature.proofTreatment, leftSignature.proofTreatment, rightSignature.proofTreatment));
  checks.push(diffCheck("CTA rhythm", leftSignature.ctaRhythm !== rightSignature.ctaRhythm, leftSignature.ctaRhythm, rightSignature.ctaRhythm));
  checks.push(diffCheck("section order", !arraysEqual(leftSignature.sectionOrder || [], rightSignature.sectionOrder || []), (leftSignature.sectionOrder || []).join(" > "), (rightSignature.sectionOrder || []).join(" > ")));
  checks.push({ name: "nav label overlap", passed: navSimilarity < 0.75, detail: `Jaccard ${navSimilarity.toFixed(2)}` });
  checks.push({ name: "component class overlap", passed: classSimilarity < 0.65, detail: `Jaccard ${classSimilarity.toFixed(2)}` });

  const score = checks.filter((check) => check.passed).length;
  return {
    left: left.target,
    right: right.target,
    score,
    total: checks.length,
    checks,
    passed: score >= 6 && checks[0].passed && checks[1].passed && checks[2].passed
  };
}

function add(checks, name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), detail });
}

function diffCheck(name, passed, leftValue, rightValue) {
  return {
    name,
    passed: Boolean(passed),
    detail: `${leftValue || "missing"} | ${rightValue || "missing"}`
  };
}

function hasSignatureShape(signature) {
  if (!signature) {
    return false;
  }
  const strings = ["variant", "archetype", "hero", "servicePresentation", "proofTreatment", "ctaRhythm"];
  const arrays = ["sectionOrder", "navLabels", "anchorOrder", "componentClassesExpected", "layoutMarkers"];
  return strings.every((field) => typeof signature[field] === "string" && signature[field])
    && arrays.every((field) => Array.isArray(signature[field]) && signature[field].length);
}

function hasExpectedClasses(signature, componentClasses) {
  return Boolean(signature?.componentClassesExpected?.every((className) => componentClasses.has(className)));
}

function hasExpectedMarkers(signature, pageContent) {
  return Boolean(signature?.layoutMarkers?.every((marker) => pageContent.includes(marker)));
}

function extractNavigationLinks(pageContent) {
  return [...pageContent.matchAll(/<!-- wp:navigation-link \{"label":"([^"]+)","url":"#([^"]+)"/g)]
    .map((match) => ({ label: match[1], target: match[2] }));
}

function arraysEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function jaccard(left, right) {
  const a = new Set(left);
  const b = new Set(right);
  const union = new Set([...a, ...b]);
  if (!union.size) {
    return 1;
  }
  let intersection = 0;
  for (const value of a) {
    if (b.has(value)) {
      intersection += 1;
    }
  }
  return intersection / union.size;
}

function printBlueprintReport(report) {
  console.log(`\nBlueprint: ${report.target}`);
  for (const check of report.checks) {
    console.log(`- ${check.passed ? "OK" : "FAIL"} ${check.name}: ${check.detail}`);
  }
}

function printComparison(comparison) {
  console.log(`\nComparison: ${comparison.left} <-> ${comparison.right}`);
  console.log(`Score: ${comparison.score}/${comparison.total}`);
  for (const check of comparison.checks) {
    console.log(`- ${check.passed ? "OK" : "FAIL"} ${check.name}: ${check.detail}`);
  }
}

async function defaultTargets() {
  const targetsFromSpecs = await Promise.all((await specTargets([])).map(async (specPath) => blueprintPathForSpec(await readSpec(specPath))));
  return targetsFromSpecs.length ? targetsFromSpecs : DEFAULT_TARGETS;
}
