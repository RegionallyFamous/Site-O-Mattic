import fs from "node:fs/promises";
import path from "node:path";
import { readSpec, specTargets } from "./spec-utils.mjs";

const targets = await specTargets();
let hasFailures = false;

console.log("\nVisual baseline report");
for (const target of targets) {
  const spec = await readSpec(target);
  const checks = await inspectBaseline(spec);
  console.log(`\nBaseline: ${spec.slug}`);
  for (const check of checks) {
    console.log(`- ${check.passed ? "OK" : "FAIL"} ${check.name}: ${check.detail}`);
  }
  if (checks.some((check) => !check.passed)) {
    hasFailures = true;
  }
}

if (hasFailures) {
  process.exit(1);
}

async function inspectBaseline(spec) {
  if (spec.release?.status !== "published") {
    return [{ name: "published baseline gate", passed: true, detail: "Baselines are required only for published specs." }];
  }

  const baselineDir = path.join("qa", "baselines", spec.slug);
  const desktopPath = path.join(baselineDir, "desktop.png");
  const mobilePath = path.join(baselineDir, "mobile.png");
  const reviewPath = path.join(baselineDir, "review.json");
  const desktop = await fileSize(desktopPath);
  const mobile = await fileSize(mobilePath);
  const review = await readJson(reviewPath);
  const capturedViewports = Array.isArray(review.data?.capturedViewports) ? review.data.capturedViewports : [];

  return [
    { name: "visual baseline approved", passed: spec.release.visualBaseline === "approved", detail: spec.release.visualBaseline },
    { name: "desktop screenshot", passed: desktop > 10_000, detail: desktop ? `${desktopPath} (${desktop} bytes)` : desktopPath },
    { name: "mobile screenshot", passed: mobile > 10_000, detail: mobile ? `${mobilePath} (${mobile} bytes)` : mobilePath },
    { name: "review metadata", passed: review.ok, detail: review.ok ? reviewPath : review.error },
    { name: "reviewed by human", passed: review.data?.reviewed === true, detail: String(review.data?.reviewed ?? "missing") },
    { name: "review slug matches", passed: review.data?.slug === spec.slug, detail: review.data?.slug || "missing" },
    { name: "review viewport list", passed: capturedViewports.includes("desktop") && capturedViewports.includes("mobile"), detail: capturedViewports.join(", ") || "missing" }
  ];
}

async function fileSize(target) {
  try {
    const stat = await fs.stat(target);
    return stat.size;
  } catch {
    return 0;
  }
}

async function readJson(target) {
  try {
    return { ok: true, data: JSON.parse(await fs.readFile(target, "utf8")) };
  } catch (error) {
    return { ok: false, data: null, error: `${target}: ${error.message}` };
  }
}
