import fs from "node:fs/promises";
import path from "node:path";
import {
  extractCustomCss,
  extractGlobalStyles,
  extractLayoutSignature,
  extractPageContent,
  getRunPhpStep,
  readBlueprint
} from "./blueprint-inspect.mjs";
import { imageInfo } from "./image-size.mjs";
import {
  POLISH_REVIEW_VERSION,
  silhouetteContract,
  styleFamilyContract,
  validatePatternMatrixFit
} from "./production-polish-matrix.mjs";
import { requiredBrandBriefFields, requiredServiceDetailFields, validateProductionPolishFields } from "./production-polish-fields.mjs";
import { blueprintDirForSpec, blueprintPathForSpec, readSpec, specTargets } from "./spec-utils.mjs";

const REVIEW_VERSION = POLISH_REVIEW_VERSION;
const REVIEW_CATEGORIES = [
  "firstViewport",
  "logoScale",
  "typography",
  "polishContract",
  "imageProof",
  "ctaClarity",
  "mobilePolish",
  "layoutDistinctness",
  "copySpecificity",
  "assetQa",
  "brandBrief"
];

const args = process.argv.slice(2);
const write = args.includes("--write");
const targetArgs = args.filter((arg) => arg !== "--write");
const targets = await specTargets(targetArgs);
let hasFailures = false;

for (const target of targets) {
  const spec = await readSpec(target);
  const review = await buildPremiumReview(spec);

  if (write) {
    spec.release = spec.release || {};
    spec.release.premiumReview = review.snapshot;
    await fs.writeFile(target, `${JSON.stringify(spec, null, 2)}\n`);
    console.log(`Stored premium review ${review.snapshot.score}/100 for ${target}`);
    continue;
  }

  const report = validateStoredReview(spec, review);
  printReport(target, report);
  if (report.checks.some((check) => !check.passed)) {
    hasFailures = true;
  }
}

if (hasFailures) {
  process.exit(1);
}

export async function buildPremiumReview(spec) {
  const blueprint = await readBlueprint(blueprintPathForSpec(spec));
  const phpStep = getRunPhpStep(blueprint);
  const pageContent = phpStep ? extractPageContent(phpStep.code) : "";
  const customCss = phpStep ? extractCustomCss(phpStep.code) : "";
  const globalStyles = phpStep ? extractGlobalStyles(phpStep.code) : null;
  const signature = phpStep ? extractLayoutSignature(phpStep.code) : null;
  const manifest = await readJsonIfExists(path.join(blueprintDirForSpec(spec), "asset-manifest.json"));
  const logo = await imageInfo(spec.assets.logo);
  const favicon = await imageInfo(spec.assets.favicon);
  const prompt = await fs.readFile(path.join(path.dirname(spec.assets.hero), "hero-prompt.md"), "utf8").catch(() => "");
  const fieldErrors = validateProductionPolishFields(spec);
  const matrixErrors = validatePatternMatrixFit(spec.pattern);
  const heroEvidenceText = `${spec.assetMeta?.hero?.alt || ""} ${prompt}`;
  const hasContactPath = pageContent.includes(spec.contact?.phoneHref || "tel:")
    || pageContent.includes(spec.contact?.emailHref || "mailto:")
    || /^tel:\+?[0-9]+/.test(spec.contact?.phoneHref || "")
    || /^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/.test(spec.contact?.emailHref || "");
  const categoryChecks = {
    firstViewport: [
      Boolean(spec.release?.reviewChecklist?.firstViewportClear),
      String(spec.copy?.heroTitle || "").length >= 18 && String(spec.copy?.heroTitle || "").length <= 82,
      String(spec.copy?.heroText || "").length >= 70 && String(spec.copy?.heroText || "").length <= 310,
      /\bwp-block-button__link\b/.test(pageContent)
    ],
    logoScale: [
      logo.width >= 900,
      logo.height >= 180,
      logo.width / logo.height >= 3,
      siteLogoWidthFromMarkup(pageContent) >= 220,
      siteLogoWidthFromMarkup(pageContent) <= 260,
      Boolean(spec.release?.reviewChecklist?.logoReadable)
    ],
    typography: [
      (globalStyles?.settings?.typography?.fontFamilies || []).length >= 3,
      Boolean(globalStyles?.settings?.custom?.som?.type?.bodyFont),
      Boolean(globalStyles?.settings?.custom?.som?.type?.displayFont),
      Boolean(globalStyles?.settings?.custom?.som?.measure?.copy),
      customCss.includes("hyphens:manual"),
      Boolean(spec.release?.reviewChecklist?.hierarchyDistinct)
    ],
    polishContract: [
      !matrixErrors.length,
      Boolean(silhouetteContract(spec.pattern?.silhouette)),
      Boolean(styleFamilyContract(spec.pattern?.styleFamily)),
      Boolean(globalStyles?.settings?.custom?.som?.pattern?.styleContract),
      Boolean(globalStyles?.settings?.custom?.som?.pattern?.colorRoles?.action),
      Boolean(globalStyles?.settings?.custom?.som?.pattern?.geometry?.radiusScale)
    ],
    imageProof: [
      String(spec.assetMeta?.hero?.alt || "").length >= 60,
      String(spec.pattern?.imageEvidence || "").length >= 25,
      significantOverlap(heroEvidenceText, spec.pattern?.imageEvidence || spec.niche)
        || significantOverlap(heroEvidenceText, spec.niche)
        || significantWords(heroEvidenceText).length >= 12,
      Boolean(spec.release?.reviewChecklist?.heroArtDirected),
      Boolean(spec.release?.reviewChecklist?.noImageArtifacts)
    ],
    ctaClarity: [
      actionText(spec.copy?.primaryCta),
      actionText(spec.copy?.secondaryCta),
      hasContactPath,
      /\b(send|share|include|date|photo|photos|call|email|venue|access|size|window|colors|symptoms|address|room|scope|count|guest|guests|palette|timing|timeline|checkout|lock|laundry|menu|headcount|event|surface|project|bike|vehicle|yard|home|role|usage|decision|family|package|consult|session|device|wifi|wi-fi)\b/i.test(`${spec.copy?.quoteText || ""} ${spec.serviceDetails?.whatToSend || ""}`)
    ],
    mobilePolish: [
      customCss.includes("@media (max-width:700px)"),
      customCss.includes("max-width:min(230px, 62vw)"),
      Boolean(spec.release?.reviewChecklist?.screenshotCompared),
      (spec.pattern?.knownRisks || []).length >= 2
    ],
    layoutDistinctness: [
      Boolean(signature?.visualDifferentiator),
      Boolean(signature?.navigationTreatment),
      Boolean(signature?.typographyTreatment),
      Boolean(signature?.colorStrategy),
      Boolean(spec.release?.reviewChecklist?.layoutDistinct),
      Boolean(spec.release?.reviewChecklist?.signatureMove)
    ],
    copySpecificity: [
      String(spec.contact?.serviceArea || "").length >= 80,
      (spec.services || []).every((item) => String(item.text || "").length >= 35),
      (spec.process || []).every((item) => String(item.text || "").length >= 35),
      (spec.proof || []).every((item) => String(item.label || "").length >= 12),
      requiredServiceDetailFields().every((field) => String(spec.serviceDetails?.[field] || "").length >= 28),
      Boolean(spec.release?.reviewChecklist?.copySpecific)
    ],
    assetQa: [
      manifest?.assets?.hero?.embedded === true,
      manifest?.assets?.logo?.embedded === true,
      manifest?.assets?.favicon?.embedded === true,
      favicon.width === favicon.height,
      favicon.width >= 256
    ],
    brandBrief: [
      requiredBrandBriefFields().every((field) => String(spec.brandBrief?.[field] || "").length >= (field === "trustCue" || field === "signatureMove" ? 10 : field === "mood" ? 12 : 18)),
      !fieldErrors.some((error) => error.startsWith("brandBrief")),
      Boolean(spec.brandBrief?.avoidLookingLike)
    ]
  };

  const categories = Object.fromEntries(Object.entries(categoryChecks).map(([name, checks]) => [name, checks.every(Boolean)]));
  const score = Math.round(Object.values(categories).filter(Boolean).length / REVIEW_CATEGORIES.length * 100);
  const notes = buildNotes(spec, categories, signature);

  return {
    categories,
    notes,
    snapshot: {
      version: REVIEW_VERSION,
      reviewedAt: spec.release?.reviewedAt || "2026-06-25",
      score,
      categories,
      notes
    }
  };
}

function validateStoredReview(spec, review) {
  const checks = [];
  const stored = spec.release?.premiumReview;

  add(checks, "premium review stored", Boolean(stored), "release.premiumReview should be stored with the spec.");
  add(checks, "review version current", stored?.version === REVIEW_VERSION, `${stored?.version || "missing"} / ${REVIEW_VERSION}`);
  add(checks, "score threshold", Number(stored?.score) >= 90, `${stored?.score || "missing"}/100`);
  add(checks, "score matches current checks", stored?.score === review.snapshot.score, `${stored?.score || "missing"} stored / ${review.snapshot.score} current`);
  add(checks, "category snapshot matches", REVIEW_CATEGORIES.every((category) => stored?.categories?.[category] === review.categories[category]), describeCategories(stored?.categories, review.categories));
  add(checks, "all premium categories pass", REVIEW_CATEGORIES.every((category) => review.categories[category]), describeCategories(review.categories, review.categories));
  add(checks, "review notes present", Array.isArray(stored?.notes) && stored.notes.length >= 3, `${stored?.notes?.length || 0} notes`);

  return { checks, review };
}

function buildNotes(spec, categories, signature) {
  const positive = [
    `Works: ${spec.brandBrief?.signatureMove || signature?.visualDifferentiator || "the signature move"} gives the page a memorable shape.`,
    `Proof: ${spec.brandBrief?.imageProof || spec.pattern?.imageEvidence || "the hero image"} anchors the niche in the first viewport.`,
    `Action: ${spec.copy?.primaryCta || "primary CTA"} is the main conversion path.`
  ];
  const fixes = Object.entries(categories)
    .filter(([, passed]) => !passed)
    .map(([category]) => `Fix next: ${category} needs another polish pass.`);
  return [...positive, ...fixes].slice(0, 6);
}

function add(checks, name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), detail });
}

function printReport(target, report) {
  console.log(`\nPremium review for ${target}`);
  for (const check of report.checks) {
    console.log(`- ${check.passed ? "OK" : "FAIL"} ${check.name}: ${check.detail}`);
  }
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

function siteLogoWidthFromMarkup(markup) {
  const match = String(markup || "").match(/<!-- wp:site-logo \{"width":([0-9]+)/);
  return match ? Number(match[1]) : NaN;
}

function actionText(value) {
  return /\b(book|check|send|request|call|ask|plan|map|start|join|compare|see|explore|reserve|email|get|build|choose|schedule|review|sample|feed|order|quote|price|estimate|visit|fix|clean|clear|style|design|view|browse|what|text)\b/i.test(String(value || ""));
}

function significantOverlap(left, right) {
  const leftWords = new Set(significantWords(left));
  return significantWords(right).some((word) => leftWords.has(word));
}

function significantWords(value) {
  const stop = new Set(["with", "that", "this", "from", "your", "into", "real", "proof", "service", "image", "evidence", "hero"]);
  return String(value || "")
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.filter((word) => word.length > 3 && !stop.has(word)) || [];
}

function describeCategories(left = {}, right = {}) {
  return REVIEW_CATEGORIES.map((category) => `${category}:${left?.[category]}/${right?.[category]}`).join(", ");
}
