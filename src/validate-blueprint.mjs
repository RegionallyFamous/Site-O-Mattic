import fs from "node:fs/promises";
import path from "node:path";
import {
  extractBlockNames,
  extractCustomCss,
  extractElementIds,
  extractGlobalStyles,
  extractHrefTargets,
  extractLayoutSignature,
  extractPageContent,
  getRunPhpStep,
  readBlueprint
} from "./blueprint-inspect.mjs";
import { LAYOUT_ARCHETYPES } from "./layout-archetypes.mjs";
import { blueprintPathForSpec, readSpec, specTargets } from "./spec-utils.mjs";

const ALLOWED_CORE_BLOCKS = new Set([
  "button",
  "buttons",
  "column",
  "columns",
  "cover",
  "group",
  "heading",
  "image",
  "list",
  "list-item",
  "navigation",
  "navigation-link",
  "paragraph",
  "post-content",
  "separator",
  "site-logo",
  "spacer"
]);

const targets = process.argv.slice(2);
if (!targets.length) {
  targets.push(...await defaultTargets());
}

let hasFailures = false;

for (const target of targets) {
  const result = await validate(target);
  if (!result.ok) {
    hasFailures = true;
  }
}

if (hasFailures) {
  process.exit(1);
}

async function validate(target) {
const blueprint = await readBlueprint(target);
const errors = [];
const warnings = [];
const bundleDir = path.dirname(path.resolve(target));

if (blueprint.$schema !== "https://playground.wordpress.net/blueprint-schema.json") {
  errors.push("Missing or unexpected Blueprint schema URL.");
}

if (!blueprint.landingPage || !blueprint.landingPage.startsWith("/")) {
  errors.push("landingPage must start with /.");
}

if (blueprint.features?.networking !== false) {
  errors.push("features.networking should be false for this self-contained Blueprint.");
}

if (!Array.isArray(blueprint.steps)) {
  errors.push("steps must be an array.");
}

const writeFileSteps = blueprint.steps?.filter((step) => step.step === "writeFile") || [];
if (writeFileSteps.length) {
  errors.push("The Studio-ready Blueprint should be self-contained and not require writeFile bundled resources.");
}

const packagedAssetsDir = path.join(bundleDir, "assets");
if (await exists(packagedAssetsDir)) {
  for (const asset of ["assets/hero.jpg", "assets/logo.png", "assets/favicon.png"]) {
    const assetPath = path.join(bundleDir, asset);
    if (!(await exists(assetPath))) {
      errors.push(`Missing packaged asset copy: ${asset}`);
    }
  }
} else {
  warnings.push("No packaged assets directory found; validating as standalone Blueprint JSON.");
}

const phpStep = getRunPhpStep(blueprint);
if (!phpStep) {
  errors.push("Missing runPHP setup step.");
} else {
  if (!phpStep.code.includes("require_once('/wordpress/wp-load.php');")) {
    errors.push("runPHP must require /wordpress/wp-load.php.");
  }
  if (!phpStep.code.includes("base64_decode") || !phpStep.code.includes("wp_upload_bits")) {
    errors.push("runPHP should decode embedded assets and upload them into the Media Library.");
  }
  if (!phpStep.code.includes("wp_insert_attachment") || !phpStep.code.includes("wp_generate_attachment_metadata")) {
    errors.push("runPHP should import embedded assets into the Media Library.");
  }
  if (!phpStep.code.includes("'post_type' => 'wp_template'") || !phpStep.code.includes("'post_name' => 'front-page'")) {
    errors.push("runPHP should create a custom front-page block template to avoid default theme wrappers.");
  }
  if (!phpStep.code.includes("wp_update_custom_css_post")) {
    errors.push("runPHP should add core custom CSS fallback for palette preset classes.");
  }
  if (!phpStep.code.includes("show_admin_bar_front")) {
    errors.push("runPHP should hide the front-end admin bar for clean visual previews.");
  }
  const pageContent = extractPageContent(phpStep.code);
  const blockNames = extractBlockNames(phpStep.code);
  const disallowed = [...new Set(blockNames.filter((name) => !ALLOWED_CORE_BLOCKS.has(name)))];
  if (disallowed.length) {
    errors.push(`Non-core or unexpected block names found: ${disallowed.join(", ")}`);
  }
  if (/href=(["'])#\1/.test(phpStep.code)) {
    errors.push("Empty anchor links are not allowed.");
  }
  for (const hrefTarget of extractHrefTargets(pageContent)) {
    if (!extractElementIds(pageContent).has(hrefTarget)) {
      errors.push(`In-page link points to missing anchor: #${hrefTarget}`);
    }
  }
  validateLayoutSignature(phpStep.code, pageContent, errors);
  if (!phpStep.code.includes("wp_set_object_terms") || !phpStep.code.includes("'wp_theme'")) {
    warnings.push("Global styles are not explicitly attached to the active theme term.");
  }
  if (!phpStep.code.includes("WP_Theme_JSON_Resolver::clean_cached_data")) {
    warnings.push("Theme JSON cache is not explicitly cleaned after global style updates.");
  }
  validateGlobalStyles(phpStep.code, errors);
}

if (!blueprint.steps?.some((step) => step.step === "login")) {
  warnings.push("No login step found; Playground previews may not open as admin.");
}

function validateGlobalStyles(phpCode, errors) {
  let globalStyles;
  try {
    globalStyles = extractGlobalStyles(phpCode);
  } catch (error) {
    errors.push(`Could not parse wp_global_styles JSON: ${error.message}`);
    return;
  }

  if (!globalStyles) {
    errors.push("No wp_global_styles update found.");
    return;
  }

  const settings = globalStyles.settings || {};
  const styles = globalStyles.styles || {};
  const requiredBlockStyles = [
    "core/button",
    "core/buttons",
    "core/columns",
    "core/group",
    "core/heading",
    "core/image",
    "core/list",
    "core/navigation"
  ];
  const blockStyles = styles.blocks || {};

  if (!settings.useRootPaddingAwareAlignments) {
    errors.push("Global styles should enable root-padding-aware alignments.");
  }
  if ((settings.typography?.fontSizes || []).length < 6 || settings.typography?.fluid !== true) {
    errors.push("Global styles should define a fluid type scale with at least six font sizes.");
  }
  if ((settings.spacing?.spacingSizes || []).length < 7 || settings.spacing?.blockGap !== true) {
    errors.push("Global styles should define a spacing scale and enable block gap controls.");
  }
  if ((settings.shadow?.presets || []).length < 3) {
    errors.push("Global styles should define shadow presets for surface polish.");
  }
  if ((settings.color?.gradients || []).length < 2) {
    errors.push("Global styles should define useful gradient presets.");
  }
  if (!settings.custom?.som?.radius || !settings.custom?.som?.shadow) {
    errors.push("Global styles should define Site-O-Mattic custom radius and shadow tokens.");
  }
  for (const blockName of requiredBlockStyles) {
    if (!blockStyles[blockName]) {
      errors.push(`Missing block-level global style for ${blockName}.`);
    }
  }
  if (!styles.elements?.link?.[":hover"] || !styles.elements?.link?.[":focus"]) {
    errors.push("Global styles should define link hover and focus treatments.");
  }
  if (!styles.css || !styles.css.includes(":focus-visible") || !styles.css.includes(".som-card")) {
    errors.push("Global styles custom CSS should include polish classes and focus-visible states.");
  }

  const customCss = extractCustomCss(phpCode);
  if (!customCss.includes("--wp--preset--spacing--70") || !customCss.includes("--wp--custom--som--shadow--card")) {
    errors.push("Custom CSS fallback should define spacing and Site-O-Mattic shadow variables.");
  }
  if (!customCss.includes(":focus-visible") || !customCss.includes(".som-card")) {
    errors.push("Custom CSS fallback should include focus-visible and component polish classes.");
  }
}

function validateLayoutSignature(phpCode, pageContent, errors) {
  let signature;
  try {
    signature = extractLayoutSignature(phpCode);
  } catch (error) {
    errors.push(`Could not parse layout signature JSON: ${error.message}`);
    return;
  }

  if (!signature) {
    errors.push("Missing Site-O-Mattic layout signature.");
    return;
  }
  if (!LAYOUT_ARCHETYPES[signature.variant]?.archetype) {
    errors.push(`Layout signature variant is not implemented in the layout catalog: ${signature.variant}.`);
  }

  const requiredStringFields = ["variant", "archetype", "hero", "servicePresentation", "proofTreatment", "ctaRhythm"];
  for (const field of requiredStringFields) {
    if (!signature[field] || typeof signature[field] !== "string") {
      errors.push(`Layout signature missing string field: ${field}.`);
    }
  }

  const requiredArrayFields = ["sectionOrder", "navLabels", "anchorOrder", "componentClassesExpected", "layoutMarkers"];
  for (const field of requiredArrayFields) {
    if (!Array.isArray(signature[field]) || !signature[field].length) {
      errors.push(`Layout signature missing array field: ${field}.`);
    }
  }

  const componentClasses = new Set([...pageContent.matchAll(/\bsom-[a-z0-9-]+/g)].map((match) => match[0]));
  for (const className of signature.componentClassesExpected || []) {
    if (!componentClasses.has(className)) {
      errors.push(`Layout signature expects missing component class: ${className}.`);
    }
  }

  for (const marker of signature.layoutMarkers || []) {
    if (!pageContent.includes(marker)) {
      errors.push(`Layout signature expects missing layout marker: ${marker}.`);
    }
  }
}

if (errors.length) {
  console.log(`Validation failed for ${target}`);
  for (const error of errors) {
    console.log(`- ${error}`);
  }
  return { ok: false };
}

console.log(`Validation OK for ${target}`);
for (const warning of warnings) {
  console.log(`Warning: ${warning}`);
}
return { ok: true };
}

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function defaultTargets() {
  return Promise.all((await specTargets([])).map(async (specPath) => blueprintPathForSpec(await readSpec(specPath))));
}
