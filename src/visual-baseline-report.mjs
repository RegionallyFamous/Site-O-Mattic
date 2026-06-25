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
  const desktop = await exists(path.join(baselineDir, "desktop.png"));
  const mobile = await exists(path.join(baselineDir, "mobile.png"));
  const review = await exists(path.join(baselineDir, "review.json"));

  return [
    { name: "visual baseline approved", passed: spec.release.visualBaseline === "approved", detail: spec.release.visualBaseline },
    { name: "desktop screenshot", passed: desktop, detail: path.join(baselineDir, "desktop.png") },
    { name: "mobile screenshot", passed: mobile, detail: path.join(baselineDir, "mobile.png") },
    { name: "review metadata", passed: review, detail: path.join(baselineDir, "review.json") }
  ];
}

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}
