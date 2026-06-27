import fs from "node:fs/promises";
import path from "node:path";
import { buildDesignTokens } from "./blueprint-style-system.mjs";
import { layoutArchetypeFor, layoutVariantFor, renderFamilyForVariant } from "./layout-archetypes.mjs";
import { RICH_CORE_BLOCKS, normalizeCoreBlockPlan } from "./production-polish-matrix.mjs";
import { readSpec, specTargets } from "./spec-utils.mjs";

const OUTPUT_PATH = path.join("docs", "catalog-uniqueness-report.md");
const writeMode = process.argv.includes("--write");
const targetArgs = process.argv.slice(2).filter((arg) => arg !== "--write");
const targets = await specTargets(targetArgs);
const specs = await Promise.all(targets.map(async (specPath) => ({ spec: await readSpec(specPath), specPath })));
const rows = specs.map(({ spec, specPath }) => buildRow(spec, specPath));
const report = buildReport(rows);
const output = `${renderMarkdown(report)}\n`;
const failures = [...report.failures];

if (writeMode) {
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, output);
  console.log(`Wrote ${OUTPUT_PATH}`);
} else {
  let current = "";
  try {
    current = await fs.readFile(OUTPUT_PATH, "utf8");
  } catch {
    failures.push(`${OUTPUT_PATH} is missing. Run npm run blueprint:uniqueness:write.`);
  }
  if (current && current !== output) {
    failures.push(`${OUTPUT_PATH} is stale. Run npm run blueprint:uniqueness:write.`);
  }
}

if (failures.length) {
  console.error("Catalog uniqueness report failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Catalog uniqueness OK: ${rows.length} specs, ${report.score}/100.`);

function buildRow(spec, specPath) {
  const archetype = layoutArchetypeFor(spec);
  const pattern = spec.pattern || {};
  const type = buildDesignTokens(spec).typography.custom;
  return {
    slug: spec.slug,
    specPath,
    niche: spec.niche || spec.businessName || spec.slug,
    layoutVariant: layoutVariantFor(spec),
    renderFamily: renderFamilyForVariant(layoutVariantFor(spec)),
    hero: archetype.hero,
    nav: pattern.navigationPrimitive,
    silhouette: pattern.silhouette,
    styleFamily: pattern.styleFamily,
    surfaceFamily: pattern.surfaceFamily,
    ctaRhythm: pattern.ctaRhythm,
    imageRole: pattern.imageRole,
    mobileAction: pattern.mobileActionPattern,
    coreFeature: richCoreFeature(pattern.coreBlockPlan || []),
    typography: archetype.typographyTreatment || "unknown",
    bodyFontFamily: primaryFontFamily(type.bodyFont),
    displayFontFamily: primaryFontFamily(type.displayFont),
    accentFontFamily: primaryFontFamily(type.accentFont),
    typeTriplet: [
      primaryFontFamily(type.bodyFont),
      primaryFontFamily(type.displayFont),
      primaryFontFamily(type.accentFont)
    ].join(" / "),
    bodyFontCategory: fontCategory(type.bodyFont),
    displayFontCategory: fontCategory(type.displayFont),
    colorStrategy: archetype.colorStrategy || "unknown",
    colorRoleFingerprint: colorRoleFingerprint(pattern.colorRoles || {})
  };
}

function buildReport(items) {
  const dimensions = [
    dimension("navigation primitive", "nav", 5, 0.46),
    dimension("silhouette", "silhouette", 8, 0.18),
    dimension("style family", "styleFamily", 6, 0.22),
    dimension("surface family", "surfaceFamily", 6, 0.22),
    dimension("CTA rhythm", "ctaRhythm", 5, 0.28),
    dimension("image role", "imageRole", 4, 0.49),
    dimension("core block feature", "coreFeature", 5, 0.30),
    dimension("render family", "renderFamily", 10, 0.16),
    dimension("typography treatment", "typography", 18, 0.12),
    dimension("body font family", "bodyFontFamily", 4, 0.42),
    dimension("display font family", "displayFontFamily", 7, 0.28),
    dimension("accent font family", "accentFontFamily", 6, 0.38),
    dimension("body/display/accent triplet", "typeTriplet", 18, 0.12),
    dimension("body font category", "bodyFontCategory", 3, 0.52),
    dimension("display font category", "displayFontCategory", 5, 0.31),
    dimension("color strategy", "colorStrategy", 18, 0.12),
    dimension("color role fingerprint", "colorRoleFingerprint", 8, 0.43)
  ];
  const analyses = dimensions.map((config) => analyzeDimension(items, config));
  const failures = analyses.flatMap((analysis) => analysis.failures);
  const pressurePoints = buildPressurePoints(items, analyses);
  const redesignQueue = buildRedesignQueue(items, analyses);
  const score = scoreReport(analyses, pressurePoints);

  return {
    count: items.length,
    score,
    analyses,
    pressurePoints,
    redesignQueue,
    failures
  };
}

function dimension(label, field, minUnique, maxShare, options = {}) {
  return { label, field, minUnique, maxShare, ...options };
}

function colorRoleFingerprint(roles) {
  return [
    "ink",
    "paper",
    "field",
    "line",
    "primary",
    "action",
    "proof",
    "muted",
    "warning",
    "shadowTint"
  ].map((role) => `${role}:${roles[role] || "missing"}`).join(" / ");
}

function analyzeDimension(items, config) {
  const counts = countBy(items, (item) => item[config.field] || "missing");
  const countedForUnique = [...counts.entries()]
    .filter(([key]) => !(config.ignoreForUnique || []).includes(key));
  const uniqueCount = countedForUnique.length;
  const top = [...counts.entries()].sort(sortCounts)[0] || ["missing", 0];
  const allowedTop = Math.max(1, Math.floor(items.length * config.maxShare));
  const failures = [];

  if (uniqueCount < config.minUnique) {
    failures.push(`${config.label} needs at least ${config.minUnique} distinct values; found ${uniqueCount}.`);
  }
  if (top[1] > allowedTop) {
    failures.push(`${config.label} is too concentrated: ${top[0]} appears ${top[1]}/${items.length}; budget is ${allowedTop}.`);
  }

  return {
    ...config,
    counts,
    uniqueCount,
    top: { value: top[0], count: top[1], allowed: allowedTop, share: top[1] / items.length },
    underused: [...counts.entries()].filter(([, count]) => count === 1).map(([value]) => value).sort(),
    failures
  };
}

function buildPressurePoints(items, analyses) {
  return analyses
    .map((analysis) => ({
      label: analysis.label,
      value: analysis.top.value,
      count: analysis.top.count,
      allowed: analysis.top.allowed,
      share: analysis.top.share,
      remainingBudget: analysis.top.allowed - analysis.top.count
    }))
    .filter((point) => point.count >= Math.max(2, Math.floor(point.allowed * 0.75)))
    .sort((left, right) => left.remainingBudget - right.remainingBudget || right.count - left.count);
}

function buildRedesignQueue(items, analyses) {
  const pressureByField = new Map(analyses.map((analysis) => [analysis.field, analysis]));
  return items
    .map((item) => {
      const reasons = [];
      for (const analysis of pressureByField.values()) {
        if (item[analysis.field] === analysis.top.value && analysis.top.count >= analysis.top.allowed * 0.75) {
          reasons.push(`${analysis.label}:${analysis.top.value}`);
        }
      }
      if (item.coreFeature === "basic-structure") {
        reasons.push("core block feature:basic-structure");
      }
      const uniqueReasons = [...new Set(reasons)];
      return { ...item, reasons: uniqueReasons, score: uniqueReasons.length };
    })
    .filter((item) => item.score >= 3)
    .sort((left, right) => right.score - left.score || left.slug.localeCompare(right.slug))
    .slice(0, 12);
}

function scoreReport(analyses, pressurePoints) {
  const totalDimensions = analyses.length;
  const passingDimensions = analyses.filter((analysis) => !analysis.failures.length).length;
  const pressurePenalty = Math.min(15, pressurePoints.filter((point) => point.remainingBudget <= 1).length * 3);
  return Math.max(0, Math.round((passingDimensions / totalDimensions) * 100 - pressurePenalty));
}

function renderMarkdown(report) {
  return `# Catalog Uniqueness Report

Generated by \`npm run blueprint:uniqueness:write\`. This report catches scale-level sameness before a full catalog redo: overused navigation primitives, repeated render families, repeated actual font families, repeated body/display/accent triplets, repeated style voices, repeated CTA rhythms, image-role concentration, and underuse of richer core blocks.

## Summary

- Specs: ${report.count}
- Score: ${report.score}/100
- Blocking failures: ${report.failures.length}

## Variety Budgets

${renderBudgetTable(report.analyses)}

## Pressure Points

${renderPressurePoints(report.pressurePoints)}

## Redesign Queue

These are the first candidates to rework when doing another polish pass. They sit in several high-pressure buckets or use basic core-block structure.

${renderRedesignQueue(report.redesignQueue)}
`;
}

function renderBudgetTable(analyses) {
  const rows = [
    "| Dimension | Unique | Top Value | Count | Budget | Status |",
    "| --- | ---: | --- | ---: | ---: | --- |",
    ...analyses.map((analysis) => [
      analysis.label,
      String(analysis.uniqueCount),
      code(analysis.top.value),
      String(analysis.top.count),
      String(analysis.top.allowed),
      analysis.failures.length ? `Fail: ${analysis.failures.join("; ")}` : "OK"
    ].join(" | ")).map((line) => `| ${line} |`)
  ];
  return rows.join("\n");
}

function renderPressurePoints(points) {
  if (!points.length) {
    return "No pressure points are close to their budget.";
  }
  return [
    "| Dimension | Value | Count | Budget | Remaining |",
    "| --- | --- | ---: | ---: | ---: |",
    ...points.map((point) => `| ${point.label} | ${code(point.value)} | ${point.count} | ${point.allowed} | ${point.remainingBudget} |`)
  ].join("\n");
}

function renderRedesignQueue(items) {
  if (!items.length) {
    return "No redesign candidates crossed the queue threshold.";
  }
  return [
    "| Slug | Reasons |",
    "| --- | --- |",
    ...items.map((item) => `| ${code(item.slug)} | ${item.reasons.map(code).join(", ")} |`)
  ].join("\n");
}

function countBy(items, keyFn) {
  const counts = new Map();
  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function richCoreFeature(plan) {
  const normalized = normalizeCoreBlockPlan(plan);
  const richBlocks = RICH_CORE_BLOCKS.filter((block) => normalized.includes(block));
  return richBlocks.length ? richBlocks.join("+") : "basic-structure";
}

function sortCounts(left, right) {
  return right[1] - left[1] || String(left[0]).localeCompare(String(right[0]));
}

function primaryFontFamily(stack) {
  return String(stack || "unknown")
    .split(",")[0]
    .replace(/^["']|["']$/g, "")
    .trim() || "unknown";
}

function fontCategory(stack) {
  const value = primaryFontFamily(stack).toLowerCase();
  if (/didot|bodoni|baskerville/.test(value)) return "fashion-serif";
  if (/hoefler|iowan|palatino|charter|cambria|georgia|serif/.test(value)) return "book-editorial-serif";
  if (/rockwell|american typewriter|slab/.test(value)) return "slab-or-typewriter";
  if (/din alternate|aptos narrow|arial narrow|condensed/.test(value)) return "condensed-utility";
  if (/optima|candara/.test(value)) return "elegant-humanist";
  if (/avenir/.test(value)) return "geometric-humanist";
  if (/franklin|aptos display|sturdy/.test(value)) return "sturdy-grotesk";
  if (/futura|century gothic|geometric/.test(value)) return "geometric-commercial";
  if (/gill sans|trebuchet|friendly/.test(value)) return "friendly-humanist";
  return "system-humanist";
}

function code(value) {
  return `\`${String(value ?? "").replaceAll("|", "\\|")}\``;
}
