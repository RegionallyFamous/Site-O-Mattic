import fs from "node:fs/promises";
import path from "node:path";
import { imageInfo } from "./image-size.mjs";
import { blueprintDirForSpec, blueprintPathForSpec, readSpec, specTargets } from "./spec-utils.mjs";

const budgets = JSON.parse(await fs.readFile("config/production-guardrails.json", "utf8"));
const targets = await specTargets();
let hasFailures = false;

for (const target of targets) {
  const spec = await readSpec(target);
  const report = await inspectSpec(spec);
  printReport(target, report);
  if (report.checks.some((check) => !check.passed)) {
    hasFailures = true;
  }
}

if (hasFailures) {
  process.exit(1);
}

async function inspectSpec(spec) {
  const checks = [];
  const blueprintPath = blueprintPathForSpec(spec);
  const blueprintDir = blueprintDirForSpec(spec);
  const zipPath = path.join(blueprintDir, `${spec.slug}-blueprint.zip`);
  const manifestPath = path.join(blueprintDir, "asset-manifest.json");
  const manifest = await readJsonIfExists(manifestPath);

  await checkAssetBudgets(spec, manifest, checks);
  await checkFileBudget(blueprintPath, budgets.blueprintJsonMaxBytes, "Blueprint JSON size", checks);
  await checkFileBudget(zipPath, budgets.zipMaxBytes, "Blueprint ZIP size", checks);
  checkManifest(spec, manifest, checks);
  await checkPromptNotes(spec, checks);
  await checkReleaseState(spec, checks);

  return { checks };
}

async function checkAssetBudgets(spec, manifest, checks) {
  for (const [key, source] of Object.entries(spec.assets || {})) {
    const budget = budgets.assets[key];
    const info = await imageInfo(source);
    const extension = path.extname(source).toLowerCase();

    add(checks, `${key} extension`, budget.allowedExtensions.includes(extension), `${extension}; allowed ${budget.allowedExtensions.join(", ")}`);
    add(checks, `${key} byte budget`, info.byteSize <= budget.maxBytes, `${formatBytes(info.byteSize)} <= ${formatBytes(budget.maxBytes)}`);
    add(checks, `${key} width budget`, info.width >= budget.minWidth && info.width <= budget.maxWidth, `${info.width}px in ${budget.minWidth}-${budget.maxWidth}px`);
    add(checks, `${key} height budget`, info.height >= budget.minHeight && info.height <= budget.maxHeight, `${info.height}px in ${budget.minHeight}-${budget.maxHeight}px`);

    const manifestAsset = manifest?.assets?.[key];
    add(checks, `${key} manifest match`, Boolean(manifestAsset)
      && manifestAsset.source === source
      && manifestAsset.byteSize === info.byteSize
      && manifestAsset.width === info.width
      && manifestAsset.height === info.height,
    manifestAsset ? `${manifestAsset.width}x${manifestAsset.height}, ${formatBytes(manifestAsset.byteSize)}` : "Missing manifest entry.");
  }
}

async function checkFileBudget(filePath, maxBytes, name, checks) {
  const stat = await fs.stat(filePath).catch(() => null);
  add(checks, name, Boolean(stat) && stat.size <= maxBytes, stat ? `${formatBytes(stat.size)} <= ${formatBytes(maxBytes)}` : `Missing ${filePath}.`);
}

function checkManifest(spec, manifest, checks) {
  add(checks, "asset manifest present", Boolean(manifest), "Generated asset-manifest.json exists.");
  add(checks, "asset manifest identity", manifest?.slug === spec.slug && manifest?.businessName === spec.businessName, `${manifest?.slug || "missing"} / ${manifest?.businessName || "missing"}`);
  add(checks, "asset manifest embedded flags", ["hero", "logo", "favicon"].every((key) => manifest?.assets?.[key]?.embedded === true), "Hero, logo, and favicon are marked embedded.");
}

async function checkPromptNotes(spec, checks) {
  const heroDir = path.dirname(spec.assets.hero);
  const promptPath = path.join(heroDir, "hero-prompt.md");
  const stat = await fs.stat(promptPath).catch(() => null);
  add(checks, "hero prompt notes", Boolean(stat) && stat.size > 100, stat ? `${promptPath} (${formatBytes(stat.size)})` : `Missing ${promptPath}.`);
}

async function checkReleaseState(spec, checks) {
  const release = spec.release || {};
  const isPublished = release.status === "published";
  const hasApprovedBaseline = release.visualBaseline === "approved";
  add(checks, "release status set", ["draft", "approved", "published"].includes(release.status), release.status || "missing");
  add(checks, "human polish review", release.status === "draft" || Object.values(release.reviewChecklist || {}).every(Boolean), release.status === "draft" ? "Draft can be incomplete." : "All review checklist values are true.");

  if (isPublished) {
    const baselineDir = path.join("qa", "baselines", spec.slug);
    const desktop = await fs.stat(path.join(baselineDir, "desktop.png")).catch(() => null);
    const mobile = await fs.stat(path.join(baselineDir, "mobile.png")).catch(() => null);
    add(checks, "published visual baseline approved", hasApprovedBaseline, release.visualBaseline || "missing");
    add(checks, "published desktop baseline", Boolean(desktop), `${baselineDir}/desktop.png`);
    add(checks, "published mobile baseline", Boolean(mobile), `${baselineDir}/mobile.png`);
  } else {
    add(checks, "published baseline gate", true, "Only required when release.status is published.");
  }
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

function add(checks, name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), detail });
}

function formatBytes(bytes) {
  return `${Math.round(bytes / 1024)} KB`;
}

function printReport(target, report) {
  console.log(`\nProduction guardrails for ${target}`);
  for (const check of report.checks) {
    console.log(`- ${check.passed ? "OK" : "FAIL"} ${check.name}: ${check.detail}`);
  }
}
