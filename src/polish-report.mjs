import {
  contrastRatio,
  extractCustomCss,
  extractElementIds,
  extractGlobalStyles,
  extractHrefTargets,
  extractLayoutSignature,
  extractPageContent,
  getRunPhpStep,
  readBlueprint
} from "./blueprint-inspect.mjs";

const DEFAULT_TARGETS = [
  "public/blueprints/lawn-care-service/blueprint.json",
  "public/blueprints/pressure-washing-service/blueprint.json"
];

const targets = process.argv.slice(2);
if (!targets.length) {
  targets.push(...DEFAULT_TARGETS);
}

let hasFailure = false;

for (const target of targets) {
  const report = await buildReport(target);
  printReport(report);
  if (report.checks.some((check) => check.critical && !check.passed)) {
    hasFailure = true;
  }
}

if (hasFailure) {
  process.exit(1);
}

async function buildReport(target) {
  const blueprint = await readBlueprint(target);
  const phpStep = getRunPhpStep(blueprint);
  const checks = [];
  const info = [];

  if (!phpStep) {
    return {
      target,
      checks: [{ name: "runPHP setup", passed: false, critical: true, detail: "Missing setup step." }],
      info
    };
  }

  const pageContent = extractPageContent(phpStep.code);
  const customCss = extractCustomCss(phpStep.code);
  const globalStyles = extractGlobalStyles(phpStep.code);
  const layoutSignature = extractLayoutSignature(phpStep.code);
  const palette = Object.fromEntries((globalStyles?.settings?.color?.palette || []).map((item) => [item.slug, item.color]));
  const blockStyles = globalStyles?.styles?.blocks || {};
  const componentClasses = new Set([...pageContent.matchAll(/\bsom-[a-z0-9-]+/g)].map((match) => match[0]));
  const hrefTargets = extractHrefTargets(pageContent);
  const ids = extractElementIds(pageContent);
  const inlineStyleCount = (pageContent.match(/\bstyle=/g) || []).length;

  add(checks, "self-contained Blueprint", blueprint.features?.networking === false && phpStep.code.includes("base64_decode"), "Networking is off and media is embedded.");
  add(checks, "front-page ownership", phpStep.code.includes("'post_type' => 'wp_template'") && phpStep.code.includes("'post_name' => 'front-page'"), "Custom front-page template removes default theme wrapper.");
  add(checks, "fluid type scale", (globalStyles?.settings?.typography?.fontSizes || []).length >= 6 && globalStyles?.settings?.typography?.fluid === true, "At least six fluid font sizes.");
  add(checks, "spacing scale", (globalStyles?.settings?.spacing?.spacingSizes || []).length >= 7 && globalStyles?.settings?.spacing?.blockGap === true, "Seven spacing presets and block gap support.");
  add(checks, "surface tokens", Boolean(globalStyles?.settings?.custom?.som?.radius && globalStyles?.settings?.custom?.som?.shadow), "Custom radius and shadow variables.");
  add(checks, "shadow presets", (globalStyles?.settings?.shadow?.presets || []).length >= 3, "Card, lift, and button shadows.");
  add(checks, "gradient presets", (globalStyles?.settings?.color?.gradients || []).length >= 2, "Brand and highlight gradients.");
  add(checks, "block-level styling", ["core/button", "core/buttons", "core/columns", "core/group", "core/heading", "core/image", "core/list", "core/navigation"].every((name) => blockStyles[name]), "Core block defaults are styled in global styles.");
  add(checks, "hover and focus", Boolean(globalStyles?.styles?.elements?.link?.[":hover"] && globalStyles?.styles?.elements?.link?.[":focus"] && customCss.includes(":focus-visible")), "Links and buttons have interactive states.");
  add(checks, "component polish classes", componentClasses.size >= 3 && customCss.includes(".som-card"), `${componentClasses.size} Site-O-Mattic component classes found.`);
  add(checks, "layout signature", Boolean(layoutSignature?.variant && layoutSignature?.archetype), layoutSignature ? `${layoutSignature.variant}: ${layoutSignature.archetype}` : "Missing layout signature.");
  add(checks, "valid in-page anchors", hrefTargets.every((targetId) => ids.has(targetId)), hrefTargets.length ? `${hrefTargets.length} in-page links checked.` : "No in-page links found.");
  add(checks, "no empty links", !/href=(["'])#\1/.test(pageContent), "No empty hash links.");
  add(checks, "contrast pairs", contrastPairsPass(palette), "Primary text/background pairs meet WCAG AA contrast.");
  add(checks, "logo rule", phpStep.code.includes(`${extractBusinessName(phpStep.code)} logo`) && !/tagline/i.test(extractLogoMetadata(phpStep.code)), "Logo metadata stays brand/name only.");

  info.push(`inline style attributes: ${inlineStyleCount}`);
  if (layoutSignature) {
    info.push(`layout signature: ${layoutSignature.variant} / ${layoutSignature.hero}`);
  }
  info.push(`component classes: ${[...componentClasses].sort().join(", ")}`);

  return { target, checks, info };
}

function add(checks, name, passed, detail, critical = true) {
  checks.push({ name, passed: Boolean(passed), detail, critical });
}

function contrastPairsPass(palette) {
  const pairs = [
    ["deep-green", "white"],
    ["deep-green", "sun"],
    ["deep-green", "cream"],
    ["deep-green", "mist"],
    ["grass", "white"]
  ];
  return pairs.every(([a, b]) => {
    if (!palette[a] || !palette[b]) {
      return false;
    }
    return contrastRatio(palette[a], palette[b]) >= 4.5;
  });
}

function extractBusinessName(phpCode) {
  const match = phpCode.match(/update_option\('blogname', '([^']+)'/);
  return match ? match[1] : "";
}

function extractLogoMetadata(phpCode) {
  const logoMatch = phpCode.match(/"logo":\{"filename":"[^"]+","mimeType":"[^"]+","title":"([^"]+)","alt":"([^"]+)"/);
  return logoMatch ? `${logoMatch[1]} ${logoMatch[2]}` : "";
}

function printReport(report) {
  const passed = report.checks.filter((check) => check.passed).length;
  const total = report.checks.length;
  console.log(`\nPolish report for ${report.target}`);
  console.log(`Score: ${passed}/${total}`);
  for (const check of report.checks) {
    const icon = check.passed ? "OK" : "FAIL";
    console.log(`- ${icon} ${check.name}: ${check.detail}`);
  }
  for (const detail of report.info) {
    console.log(`  info: ${detail}`);
  }
}
