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
console.log("");

for (const row of rows) {
  const flags = row.flags.length ? row.flags.join(", ") : "none";
  console.log(`${row.slug}: score ${row.score}, css ${row.cssBytes} bytes, !important ${row.important}, media ${row.media}, flags: ${flags}`);
}

const failures = rows.filter((row) => row.score >= 28 || row.flags.some((flag) => flag.startsWith("very-heavy")));

if (failures.length) {
  console.log("");
  console.log("Highest-priority lean/block-first reviews:");
  for (const row of failures.slice(0, 12)) {
    console.log(`- ${row.slug}: ${row.flags.join(", ")}`);
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

  const flags = [];
  if (customCss.length > 19000) flags.push("very-heavy-css");
  if (counts.important > 80) flags.push("important-heavy");
  if (counts.negativeMargins > 2) flags.push("negative-margin-layout");
  if (counts.transforms > 2) flags.push("transform-layout");
  if (counts.fixedOrSticky > 1) flags.push("fixed-or-sticky-ui");
  if (counts.wildcardSelectors > 0) flags.push("wildcard-proof-selectors");
  if (counts.media > 8) flags.push("breakpoint-heavy");

  return {
    slug: spec.slug,
    layoutVariant: spec.layoutVariant,
    cssBytes: customCss.length,
    score,
    flags,
    ...counts
  };
}

function count(value, pattern) {
  return [...String(value || "").matchAll(pattern)].length;
}
