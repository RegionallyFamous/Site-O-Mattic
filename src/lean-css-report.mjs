import { readBlueprint, getRunPhpStep, extractCustomCss } from "./blueprint-inspect.mjs";
import { blueprintPathForSpec, readSpec, specTargets } from "./spec-utils.mjs";

const strict = process.argv.includes("--strict");
const rows = [];

for (const target of await specTargets(process.argv.slice(2).filter((arg) => arg !== "--strict"))) {
  const spec = await readSpec(target);
  const blueprint = await readBlueprint(blueprintPathForSpec(spec));
  const phpStep = getRunPhpStep(blueprint);
  const customCss = phpStep ? extractCustomCss(phpStep.code) : "";
  const row = analyzeCss(spec, customCss);
  rows.push(row);
}

rows.sort((a, b) => b.score - a.score || b.cssBytes - a.cssBytes || a.slug.localeCompare(b.slug));

console.log("Lean CSS report");
console.log(`- Blueprints checked: ${rows.length}`);
console.log(`- Strict mode: ${strict ? "on" : "off"}`);
console.log("- Use this as block-first triage evidence; screenshot review decides taste.");
console.log("");

for (const row of rows) {
  const review = row.reviewNotes.length ? row.reviewNotes.join(", ") : "none";
  const severe = row.severeFlags.length ? `, severe: ${row.severeFlags.join(", ")}` : "";
  console.log(`${row.slug}: score ${row.score}, css ${row.cssBytes} bytes, !important ${row.important}, media ${row.media}, review: ${review}${severe}`);
}

const failures = rows.filter((row) => row.score >= 28 || row.severeFlags.some((flag) => flag.startsWith("very-heavy")));

if (failures.length) {
  console.log("");
  console.log("Highest-priority lean/block-first reviews:");
  for (const row of failures.slice(0, 12)) {
    const review = row.reviewNotes.length ? row.reviewNotes.join(", ") : "score-review";
    console.log(`- ${row.slug}: ${review}`);
    for (const advice of adviceFor(row)) {
      console.log(`  ${advice}`);
    }
  }
}

if (strict && failures.length) {
  process.exitCode = 1;
}

function analyzeCss(spec, customCss) {
  const counts = {
    important: count(customCss, /!important\b/g),
    negativeMargins: count(customCss, /margin(?:-[a-z]+)?\s*:\s*-[\d.]/gi),
    transforms: count(customCss, /(?:^|[;{\s])transform\s*:/gi),
    fixedOrSticky: count(customCss, /\bposition\s*:\s*(?:fixed|sticky)\b/gi),
    wildcardSelectors: count(customCss, /\[[^\]]*\*=/g),
    media: count(customCss, /@media\b/g)
  };

  const score = Math.round(
    (customCss.length / 2200)
    + counts.important * 0.25
    + counts.negativeMargins * 2
    + counts.transforms * 2
    + counts.fixedOrSticky * 3
    + counts.wildcardSelectors * 3
    + counts.media * 0.5
  );

  const severeFlags = [];
  if (customCss.length > 19000) severeFlags.push("very-heavy-css");
  if (counts.important > 80) severeFlags.push("important-heavy");
  if (counts.negativeMargins > 2) severeFlags.push("negative-margin-layout");
  if (counts.transforms > 2) severeFlags.push("transform-layout");
  if (counts.fixedOrSticky > 1) severeFlags.push("fixed-or-sticky-ui");
  if (counts.wildcardSelectors > 0) severeFlags.push("wildcard-proof-selectors");
  if (counts.media > 8) severeFlags.push("breakpoint-heavy");

  const reviewNotes = [];
  if (score >= 28) reviewNotes.push("score-review");
  if (customCss.length >= 16000) reviewNotes.push("large-css-surface");
  if (customCss.length >= 14000 && customCss.length < 16000) reviewNotes.push("moderate-css-surface");
  if (counts.important >= 60) reviewNotes.push("important-heavy-review");
  if (counts.media >= 6) reviewNotes.push("breakpoint-review");
  if (counts.negativeMargins > 0) reviewNotes.push("negative-margin-check");
  if (counts.transforms > 0) reviewNotes.push("transform-layout-check");
  if (counts.fixedOrSticky > 0) reviewNotes.push("sticky-safe-area-check");
  if (counts.wildcardSelectors > 0) reviewNotes.push("wildcard-selector-check");

  return {
    slug: spec.slug,
    layoutVariant: spec.layoutVariant,
    cssBytes: customCss.length,
    score,
    reviewNotes,
    severeFlags,
    ...counts
  };
}

function adviceFor(row) {
  const advice = [];
  if (row.cssBytes >= 14000) {
    advice.push("- Move repeated type, spacing, radius, shadow, and table defaults into global styles/block defaults before trimming CSS.");
  }
  if (row.important >= 60) {
    advice.push("- Replace repeated !important overrides with block attributes, block-level global styles, or a lower-specificity shared selector.");
  }
  if (row.media >= 6) {
    advice.push("- Check whether breakpoint rules can become responsive block settings, intrinsic grid/flex behavior, or one shared mobile fallback.");
  }
  if (row.fixedOrSticky > 0) {
    advice.push("- Verify sticky/fixed UI with screenshots, focus walk, anchor offsets, and safe-area/footer overlap checks.");
  }
  if (row.negativeMargins > 0 || row.transforms > 0) {
    advice.push("- Inspect any offset layout by eye; prefer block spacing, alignments, and section order over visual nudges.");
  }
  if (!advice.length) {
    advice.push("- Inspect screenshots first, then remove only CSS that duplicates core block support or theme JSON behavior.");
  }
  return advice;
}

function count(value, pattern) {
  return [...String(value || "").matchAll(pattern)].length;
}
