import fs from "node:fs/promises";
import path from "node:path";

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

const target = process.argv[2] || "public/blueprints/lawn-care-service/blueprint.json";
const blueprint = JSON.parse(await fs.readFile(target, "utf8"));
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

const phpStep = blueprint.steps?.find((step) => step.step === "runPHP");
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
  const blockNames = [...phpStep.code.matchAll(/<!--\s+wp:([a-z0-9-]+)/g)].map((match) => match[1]);
  const disallowed = [...new Set(blockNames.filter((name) => !ALLOWED_CORE_BLOCKS.has(name)))];
  if (disallowed.length) {
    errors.push(`Non-core or unexpected block names found: ${disallowed.join(", ")}`);
  }
  if (/href=(["'])#\1/.test(phpStep.code)) {
    errors.push("Empty anchor links are not allowed.");
  }
  if (!phpStep.code.includes("wp_global_styles")) {
    warnings.push("No wp_global_styles update found.");
  }
  if (!phpStep.code.includes("wp_set_object_terms") || !phpStep.code.includes("'wp_theme'")) {
    warnings.push("Global styles are not explicitly attached to the active theme term.");
  }
  if (!phpStep.code.includes("WP_Theme_JSON_Resolver::clean_cached_data")) {
    warnings.push("Theme JSON cache is not explicitly cleaned after global style updates.");
  }
}

if (!blueprint.steps?.some((step) => step.step === "login")) {
  warnings.push("No login step found; Playground previews may not open as admin.");
}

if (errors.length) {
  console.log(`Validation failed for ${target}`);
  for (const error of errors) {
    console.log(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Validation OK for ${target}`);
for (const warning of warnings) {
  console.log(`Warning: ${warning}`);
}

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}
