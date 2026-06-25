import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { imageInfo } from "./image-size.mjs";
import {
  buildLayoutSignature,
  layoutArchetypeFor,
  layoutVariantFor,
  renderFamilyForVariant
} from "./layout-archetypes.mjs";
import {
  buildCustomCss,
  buildDesignTokens,
  buildGlobalStyles
} from "./blueprint-style-system.mjs";

const execFileAsync = promisify(execFile);

const BLUEPRINT_SCHEMA = "https://playground.wordpress.net/blueprint-schema.json";

const ROOT = process.cwd();
const BLUEPRINT_OUTPUT_ROOT = path.join(ROOT, "public", "blueprints");
const BUNDLE_MTIME = new Date("2026-01-01T00:00:00Z");

const CORE_BLOCKS_USED = [
  "buttons",
  "button",
  "column",
  "columns",
  "cover",
  "details",
  "gallery",
  "group",
  "heading",
  "image",
  "list",
  "list-item",
  "media-text",
  "navigation",
  "navigation-link",
  "paragraph",
  "post-content",
  "pullquote",
  "quote",
  "separator",
  "site-logo",
  "spacer",
  "table"
];

const VARIANT_CLASS_FINGERPRINTS = {
  "side-rail-estimate": {
    "som-side-rail-shell": "som-estimate-rail-shell",
    "som-side-rail": "som-estimate-rail",
    "som-side-main": "som-estimate-main",
    "som-haul-hero": "som-consult-hero",
    "som-haul-photo": "som-consult-photo",
    "som-haul-ticket": "som-consult-ticket",
    "som-donation-strip": "som-consult-proof-strip",
    "som-haul-card": "som-consult-card",
    "som-haul-step": "som-consult-step"
  },
  "bottom-dock-booking": {
    "som-fixed-page": "som-booking-page",
    "som-fixed-header": "som-booking-header",
    "som-fixed-hero": "som-booking-hero",
    "som-detail-photo": "som-booking-photo",
    "som-detail-ticket": "som-booking-ticket",
    "som-detail-proof": "som-route-proof",
    "som-detail-package": "som-tune-package",
    "som-detail-step": "som-route-step",
    "som-mobile-action-bar": "som-booking-dock"
  },
  "sharp-route-bench": {
    "som-workshop-page": "som-sharp-page",
    "som-workshop-header": "som-sharp-header",
    "som-workshop-hero": "som-sharp-hero",
    "som-workshop-photo": "som-sharp-photo",
    "som-workshop-ticket": "som-edge-ticket",
    "som-material-proof": "som-edge-proof",
    "som-wood-card": "som-sharp-card",
    "som-care-note": "som-edge-care-note",
    "som-craft-step": "som-sharp-step"
  },
  "bike-route-workstand": {
    "som-workshop-page": "som-bike-page",
    "som-workshop-header": "som-bike-header",
    "som-workshop-hero": "som-bike-hero",
    "som-workshop-photo": "som-workstand-photo",
    "som-workshop-ticket": "som-route-ticket",
    "som-material-proof": "som-ride-proof",
    "som-wood-card": "som-tune-card",
    "som-care-note": "som-ride-care-note",
    "som-craft-step": "som-bike-route-step",
    "som-quote-strip": "som-bike-booking-strip"
  },
  "organizing-zone-board": {
    "som-zone-page": "som-organizing-page",
    "som-zone-header": "som-organizing-header",
    "som-zone-hero": "som-organizing-hero",
    "som-zone-photo": "som-organizing-photo",
    "som-zone-map": "som-shelf-map",
    "som-zone-proof": "som-reset-proof",
    "som-zone-card": "som-shelf-card",
    "som-zone-step": "som-reset-step",
    "som-zone-note": "som-shelf-note"
  },
  "route-led-schedule": {
    "som-card": "som-route-plan-card",
    "som-process-card": "som-route-process-card",
    "som-proof-card": "som-route-proof-card",
    "som-quote-card": "som-route-quote-card",
    "som-footer": "som-route-footer"
  },
  "story-card-consult": {
    "som-checklist-hero": "som-story-hero",
    "som-urgency-band": "som-story-proof-band",
    "som-check-card": "som-support-card",
    "som-proof-card": "som-family-proof-card",
    "som-quote-strip": "som-consult-quote-strip"
  },
  "turnover-receipt-board": {
    "som-receipt-page": "som-turnover-page",
    "som-receipt-header": "som-turnover-header",
    "som-receipt-header-action": "som-turnover-header-action",
    "som-receipt-hero-shell": "som-turnover-hero-shell",
    "som-receipt-hero": "som-turnover-hero",
    "som-receipt-card": "som-turnover-card",
    "som-receipt-proof-strip": "som-host-proof-strip",
    "som-receipt-proof": "som-host-proof",
    "som-receipt-scope": "som-turnover-scope",
    "som-receipt-table": "som-turnover-table",
    "som-receipt-safety": "som-turnover-safety",
    "som-receipt-step": "som-turnover-step",
    "som-receipt-details": "som-turnover-details",
    "som-receipt-detail": "som-turnover-detail"
  },
  "pet-portrait-gallery": galleryFingerprint("pet"),
  "dessert-table-gallery": galleryFingerprint("dessert"),
  "balloon-backdrop-gallery": galleryFingerprint("balloon"),
  "picnic-proposal-lookbook": galleryFingerprint("picnic"),
  "headshot-proof-gallery": galleryFingerprint("headshot"),
  "street-food-menu-board": menuFingerprint("streetfood"),
  "mocktail-cart-menu": menuFingerprint("mocktail"),
  "micro-wedding-floral-story": storyFingerprint("floral"),
  "color-consult-story": storyFingerprint("color"),
  "photo-booth-strip-packages": fixedActionFingerprint("booth"),
  "soundcheck-console": sideRailFingerprint("sound"),
  "mural-lettering-workshop": workshopFingerprint("mural"),
  "furniture-refinish-proof": beforeAfterFingerprint("furniture")
};

function galleryFingerprint(prefix) {
  return {
    "som-gallery-hero": `som-${prefix}-gallery-hero`,
    "som-gallery-image": `som-${prefix}-gallery-image`,
    "som-gallery-copy": `som-${prefix}-gallery-copy`,
    "som-gallery-note": `som-${prefix}-gallery-note`,
    "som-style-card": `som-${prefix}-style-card`,
    "som-gallery-proof": `som-${prefix}-gallery-proof`,
    "som-process-card": `som-${prefix}-process-card`,
    "som-quote-strip": `som-${prefix}-quote-strip`
  };
}

function menuFingerprint(prefix) {
  return {
    "som-menu-page": `som-${prefix}-menu-page`,
    "som-menu-header": `som-${prefix}-menu-header`,
    "som-menu-hero": `som-${prefix}-menu-hero`,
    "som-menu-photo": `som-${prefix}-menu-photo`,
    "som-menu-ticket": `som-${prefix}-menu-ticket`,
    "som-menu-proof": `som-${prefix}-menu-proof`,
    "som-menu-package": `som-${prefix}-menu-package`,
    "som-menu-event": `som-${prefix}-menu-event`,
    "som-menu-step": `som-${prefix}-menu-step`,
    "som-quote-strip": `som-${prefix}-quote-strip`
  };
}

function storyFingerprint(prefix) {
  return {
    "som-checklist-hero": `som-${prefix}-story-hero`,
    "som-urgency-band": `som-${prefix}-proof-band`,
    "som-check-card": `som-${prefix}-support-card`,
    "som-proof-card": `som-${prefix}-proof-card`,
    "som-quote-strip": `som-${prefix}-consult-strip`
  };
}

function fixedActionFingerprint(prefix) {
  return {
    "som-fixed-page": `som-${prefix}-page`,
    "som-fixed-header": `som-${prefix}-header`,
    "som-fixed-hero": `som-${prefix}-hero`,
    "som-detail-photo": `som-${prefix}-photo`,
    "som-detail-ticket": `som-${prefix}-ticket`,
    "som-detail-proof": `som-${prefix}-proof`,
    "som-detail-package": `som-${prefix}-package`,
    "som-detail-step": `som-${prefix}-step`,
    "som-mobile-action-bar": `som-${prefix}-action-dock`,
    "som-quote-strip": `som-${prefix}-quote-strip`
  };
}

function sideRailFingerprint(prefix) {
  return {
    "som-side-rail-shell": `som-${prefix}-rail-shell`,
    "som-side-rail": `som-${prefix}-rail`,
    "som-side-main": `som-${prefix}-main`,
    "som-haul-hero": `som-${prefix}-hero`,
    "som-haul-photo": `som-${prefix}-photo`,
    "som-haul-ticket": `som-${prefix}-ticket`,
    "som-donation-strip": `som-${prefix}-proof-strip`,
    "som-haul-card": `som-${prefix}-card`,
    "som-haul-step": `som-${prefix}-step`,
    "som-quote-strip": `som-${prefix}-quote-strip`
  };
}

function workshopFingerprint(prefix) {
  return {
    "som-workshop-page": `som-${prefix}-page`,
    "som-workshop-header": `som-${prefix}-header`,
    "som-workshop-hero": `som-${prefix}-hero`,
    "som-workshop-photo": `som-${prefix}-photo`,
    "som-workshop-ticket": `som-${prefix}-ticket`,
    "som-material-proof": `som-${prefix}-proof`,
    "som-wood-card": `som-${prefix}-card`,
    "som-care-note": `som-${prefix}-care-note`,
    "som-craft-step": `som-${prefix}-step`,
    "som-quote-strip": `som-${prefix}-quote-strip`
  };
}

function beforeAfterFingerprint(prefix) {
  return {
    "som-split-hero": `som-${prefix}-split-hero`,
    "som-hero-photo": `som-${prefix}-hero-photo`,
    "som-before-after": `som-${prefix}-before-after`,
    "som-evidence-card": `som-${prefix}-evidence-card`,
    "som-quote-strip": `som-${prefix}-quote-strip`,
    "som-surface-row": `som-${prefix}-surface-row`,
    "som-method-pill": `som-${prefix}-method-pill`,
    "som-timeline-step": `som-${prefix}-timeline-step`,
    "som-proof-grid": `som-${prefix}-proof-grid`,
    "som-proof-card": `som-${prefix}-proof-card`
  };
}

async function main() {
  const specPath = process.argv[2] || "specs/lawn-care-service.json";
  const spec = JSON.parse(await fs.readFile(specPath, "utf8"));
  const outDir = path.join(BLUEPRINT_OUTPUT_ROOT, spec.slug);
  const outAssets = path.join(outDir, "assets");

  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outAssets, { recursive: true });

  const assets = await copyAssets(spec, outAssets);
  const assetManifest = buildAssetManifest(spec, assets);
  const blueprint = buildBlueprint(spec, assets);

  await fs.writeFile(path.join(outDir, "blueprint.json"), `${JSON.stringify(blueprint, null, 2)}\n`);
  await fs.writeFile(path.join(outDir, "asset-manifest.json"), `${JSON.stringify(assetManifest, null, 2)}\n`);
  await fs.writeFile(path.join(outDir, "README.md"), buildOutputReadme(spec));
  await fs.writeFile(path.join(outDir, "playground-preview.md"), buildPreviewNotes(spec));
  await writeBundle(outDir, `${spec.slug}-blueprint.zip`);

  console.log(`Built ${path.relative(ROOT, path.join(outDir, "blueprint.json"))}`);
  console.log(`Bundled ${path.relative(ROOT, path.join(outDir, `${spec.slug}-blueprint.zip`))}`);
  console.log(`Core blocks: ${CORE_BLOCKS_USED.map((name) => `core/${name}`).join(", ")}`);
}

async function copyAssets(spec, outAssets) {
  const mapped = {};

  for (const [key, source] of Object.entries(spec.assets)) {
    const sourcePath = path.join(ROOT, source);
    const extension = path.extname(sourcePath);
    const fileName = `${key}${extension}`;
    const targetPath = path.join(outAssets, fileName);
    await fs.copyFile(sourcePath, targetPath);
    const sourceInfo = await imageInfo(sourcePath);
    mapped[key] = {
      source: source,
      path: `/assets/${fileName}`,
      fileName,
      mimeType: mimeTypeForPath(sourcePath),
      byteSize: sourceInfo.byteSize,
      width: sourceInfo.width,
      height: sourceInfo.height,
      base64: await fs.readFile(sourcePath, "base64")
    };
  }

  return mapped;
}

function buildAssetManifest(spec, assets) {
  return {
    version: 1,
    slug: spec.slug,
    businessName: spec.businessName,
    layoutVariant: layoutVariantFor(spec),
    assets: Object.fromEntries(Object.entries(assets).map(([key, asset]) => [
      key,
      {
        source: asset.source,
        fileName: asset.fileName,
        outputPath: asset.path,
        mimeType: asset.mimeType,
        byteSize: asset.byteSize,
        width: asset.width,
        height: asset.height,
        embedded: true
      }
    ]))
  };
}

function buildBlueprint(spec, assets) {
  return {
    $schema: BLUEPRINT_SCHEMA,
    landingPage: spec.landingPage || "/",
    preferredVersions: {
      php: "8.4",
      wp: "latest"
    },
    features: {
      networking: false
    },
    steps: [
      {
        step: "login",
        username: "admin",
        password: "password"
      },
      {
        step: "runPHP",
        code: buildSetupPhp(spec, assets)
      }
    ]
  };
}

function buildSetupPhp(spec, assets) {
  const pageContent = normalizePageTypography(buildPageContent(spec), spec);
  const globalStyles = buildGlobalStyles(spec);
  const customCss = buildCustomCss(spec);
  const layoutSignature = buildLayoutSignature(spec);
  const frontPageTemplateContent = '<!-- wp:post-content {"align":"full","layout":{"type":"default"}} /-->';
  const heroMeta = spec.assetMeta?.hero || {};
  const assetPayloads = {
    hero: {
      filename: assets.hero.fileName,
      mimeType: assets.hero.mimeType,
      title: heroMeta.title || `${spec.businessName} hero image`,
      alt: heroMeta.alt || `Hero image for ${spec.businessName}.`,
      base64: assets.hero.base64
    },
    logo: {
      filename: assets.logo.fileName,
      mimeType: assets.logo.mimeType,
      title: `${spec.businessName} logo`,
      alt: `${spec.businessName} logo`,
      base64: assets.logo.base64
    },
    favicon: {
      filename: assets.favicon.fileName,
      mimeType: assets.favicon.mimeType,
      title: `${spec.businessName} favicon`,
      alt: `${spec.businessName} favicon`,
      base64: assets.favicon.base64
    }
  };

  return `<?php
require_once('/wordpress/wp-load.php');
require_once('/wordpress/wp-admin/includes/image.php');

$theme_slug = ${phpString(spec.themeSlug)};
if ($theme_slug && wp_get_theme($theme_slug)->exists()) {
    switch_theme($theme_slug);
}

function site_o_mattic_import_asset($asset) {
    $bytes = base64_decode($asset['base64'], true);
    if (false === $bytes) {
        throw new Exception('Could not decode asset: ' . $asset['filename']);
    }

    $upload = wp_upload_bits($asset['filename'], null, $bytes);
    if (!empty($upload['error'])) {
        throw new Exception($upload['error']);
    }

    $attachment_id = wp_insert_attachment([
        'post_mime_type' => $asset['mimeType'],
        'post_title' => $asset['title'],
        'post_content' => '',
        'post_excerpt' => $asset['alt'],
        'post_status' => 'inherit',
    ], $upload['file']);

    if (is_wp_error($attachment_id)) {
        throw new Exception($attachment_id->get_error_message());
    }

    update_post_meta($attachment_id, '_wp_attachment_image_alt', $asset['alt']);
    $metadata = wp_generate_attachment_metadata($attachment_id, $upload['file']);
    if (!is_wp_error($metadata) && !empty($metadata)) {
        wp_update_attachment_metadata($attachment_id, $metadata);
    }

    return $attachment_id;
}

$site_o_mattic_assets = json_decode(${phpString(JSON.stringify(assetPayloads))}, true);
$site_o_mattic_layout_signature_json = ${phpString(JSON.stringify(layoutSignature))};
$site_o_mattic_layout_signature = json_decode($site_o_mattic_layout_signature_json, true);
$hero_id = site_o_mattic_import_asset($site_o_mattic_assets['hero']);
$logo_id = site_o_mattic_import_asset($site_o_mattic_assets['logo']);
$favicon_id = site_o_mattic_import_asset($site_o_mattic_assets['favicon']);

$hero_url = wp_get_attachment_url($hero_id);
$content_template = ${phpString(pageContent)};
$page_content = strtr($content_template, [
    '{{hero_id}}' => (string) $hero_id,
    '{{hero_url}}' => esc_url($hero_url),
]);

update_option('blogname', ${phpString(spec.businessName)});
update_option('blogdescription', ${phpString(spec.tagline)});
update_option('timezone_string', 'America/Chicago');
update_option('show_avatars', 0);
update_option('default_comment_status', 'closed');
update_option('default_ping_status', 'closed');
update_user_meta(1, 'show_admin_bar_front', 'false');

set_theme_mod('custom_logo', $logo_id);
update_option('site_logo', $logo_id);
update_option('site_icon', $favicon_id);

foreach ([['hello-world', 'post'], ['sample-page', 'page'], ['privacy-policy', 'page']] as $default_content) {
    [$default_slug, $default_type] = $default_content;
    $default_post = get_page_by_path($default_slug, OBJECT, $default_type);
    if ($default_post instanceof WP_Post) {
        wp_trash_post($default_post->ID);
    }
}

$front_page = get_page_by_path('home', OBJECT, 'page');
$front_page_args = [
    'post_title' => 'Home',
    'post_name' => 'home',
    'post_content' => $page_content,
    'post_status' => 'publish',
    'post_type' => 'page',
    'post_author' => 1,
    'comment_status' => 'closed',
    'ping_status' => 'closed',
];

if ($front_page instanceof WP_Post) {
    $front_page_args['ID'] = $front_page->ID;
    $front_page_id = wp_update_post($front_page_args, true);
} else {
    $front_page_id = wp_insert_post($front_page_args, true);
}

if (is_wp_error($front_page_id)) {
    throw new Exception($front_page_id->get_error_message());
}

update_option('show_on_front', 'page');
update_option('page_on_front', (int) $front_page_id);
update_option('page_for_posts', 0);
update_option('permalink_structure', '/%postname%/');

$front_page_template_content = ${phpString(frontPageTemplateContent)};
$front_page_template_post = get_page_by_path('front-page', OBJECT, 'wp_template');
$front_page_template_args = [
    'post_title' => 'Site-O-Mattic Front Page',
    'post_name' => 'front-page',
    'post_content' => $front_page_template_content,
    'post_excerpt' => 'Full-width single-page template generated by Site-O-Mattic.',
    'post_status' => 'publish',
    'post_type' => 'wp_template',
    'post_author' => 1,
];

if ($front_page_template_post instanceof WP_Post) {
    $front_page_template_args['ID'] = $front_page_template_post->ID;
    $front_page_template_id = wp_update_post($front_page_template_args, true);
} else {
    $front_page_template_id = wp_insert_post($front_page_template_args, true);
}

if (is_wp_error($front_page_template_id)) {
    throw new Exception($front_page_template_id->get_error_message());
}

wp_set_object_terms((int) $front_page_template_id, get_stylesheet(), 'wp_theme');

$global_styles = ${phpString(JSON.stringify(globalStyles, null, 2))};
$global_styles_id = null;

if (class_exists('WP_Theme_JSON_Resolver')) {
    $global_styles_cpt = WP_Theme_JSON_Resolver::get_user_data_from_wp_global_styles(wp_get_theme(), true);
    if (!empty($global_styles_cpt['ID'])) {
        $global_styles_id = wp_update_post([
            'ID' => (int) $global_styles_cpt['ID'],
            'post_title' => 'Custom Styles',
            'post_content' => $global_styles,
            'post_status' => 'publish',
            'post_type' => 'wp_global_styles',
            'post_author' => 1,
        ], true);
    }
}

if (!$global_styles_id || is_wp_error($global_styles_id)) {
    $global_styles_id = wp_insert_post([
        'post_title' => 'Custom Styles',
        'post_name' => 'wp-global-styles-' . urlencode(get_stylesheet()),
        'post_content' => $global_styles,
        'post_status' => 'publish',
        'post_type' => 'wp_global_styles',
        'post_author' => 1,
        'tax_input' => [
            'wp_theme' => [get_stylesheet()],
        ],
    ], true);
}

if (!is_wp_error($global_styles_id)) {
    wp_set_object_terms((int) $global_styles_id, get_stylesheet(), 'wp_theme');
}

$custom_css = ${phpString(customCss)};
if (function_exists('wp_update_custom_css_post')) {
    wp_update_custom_css_post($custom_css, [
        'stylesheet' => get_stylesheet(),
    ]);
}

if (class_exists('WP_Theme_JSON_Resolver')) {
    WP_Theme_JSON_Resolver::clean_cached_data();
}
if (function_exists('wp_clean_theme_json_cache')) {
    wp_clean_theme_json_cache();
}

flush_rewrite_rules();
`;
}

function normalizePageTypography(markup, spec) {
  const tokens = buildDesignTokens(spec).typography;
  const headingProps = {
    "font-weight": tokens.headingWeight,
    "line-height": tokens.headingLineHeight
  };

  return markup
    .replace(/<!-- wp:heading(\s+\{[^]*?\})?\s*-->/g, (match, rawAttributes = "") => {
      if (!rawAttributes.trim()) {
        return match;
      }
      try {
        const attrs = JSON.parse(rawAttributes.trim());
        attrs.style = attrs.style || {};
        attrs.style.typography = attrs.style.typography || {};
        attrs.style.typography.fontWeight = tokens.headingWeight;
        attrs.style.typography.lineHeight = tokens.headingLineHeight;
        return `<!-- wp:heading ${JSON.stringify(attrs)} -->`;
      } catch {
        return match;
      }
    })
    .replace(/(<h[1-6]\b[^>]*\bstyle=")([^"]*)("[^>]*>)/g, (_match, before, style, after) => {
      return `${before}${rewriteInlineStyle(style, headingProps)}${after}`;
    });
}

function rewriteInlineStyle(style, updates) {
  const declarations = style
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean);
  const seen = new Set();
  const rewritten = declarations.map((declaration) => {
    const separator = declaration.indexOf(":");
    if (separator === -1) {
      return declaration;
    }
    const property = declaration.slice(0, separator).trim().toLowerCase();
    if (!Object.hasOwn(updates, property)) {
      return declaration;
    }
    seen.add(property);
    return `${property}:${updates[property]}`;
  });

  for (const [property, value] of Object.entries(updates)) {
    if (!seen.has(property)) {
      rewritten.push(`${property}:${value}`);
    }
  }

  return rewritten.join(";");
}

function buildPageContent(spec) {
  const layoutVariant = layoutVariantFor(spec);
  const variant = renderVariantForSpec(spec);
  let content;

  if (layoutVariant === "dessert-table-gallery") {
    content = buildDessertTableGalleryPageContent(spec);
  } else if (layoutVariant === "color-consult-story") {
    content = buildColorConsultStoryPageContent(spec);
  } else if (variant === "before-after-quote") {
    content = buildBeforeAfterQuotePageContent(spec);
  } else if (variant === "lawn-route-status-board") {
    content = buildRouteLedSchedulePageContent(spec);
  } else if (variant === "route-plan") {
    content = buildRoutePlanPageContent(spec);
  } else if (variant === "water-test-board") {
    content = buildWaterTestBoardPageContent(spec);
  } else if (variant === "zone-grid-planner") {
    content = buildZoneGridPlannerPageContent(spec);
  } else if (variant === "checklist-urgency") {
    content = buildChecklistUrgencyPageContent(spec);
  } else if (variant === "urgent-checklist") {
    content = buildUrgentChecklistPageContent(spec);
  } else if (variant === "risk-prevention") {
    content = buildRiskPreventionPageContent(spec);
  } else if (variant === "gallery-led") {
    content = buildGalleryLedPageContent(spec);
  } else if (variant === "surface-seasonal") {
    content = buildSurfaceSeasonalPageContent(spec);
  } else if (variant === "stain-care") {
    content = buildStainCarePageContent(spec);
  } else if (variant === "side-rail-service") {
    content = buildSideRailServicePageContent(spec);
  } else if (variant === "package-menu-board") {
    content = buildPackageMenuBoardPageContent(spec);
  } else if (variant === "fixed-bottom-action") {
    content = buildFixedBottomActionPageContent(spec);
  } else if (variant === "workshop-bench") {
    content = buildWorkshopBenchPageContent(spec);
  } else if (variant === "service-receipt-stack") {
    content = buildServiceReceiptStackPageContent(spec);
  } else {
    throw new Error(`Unsupported layoutVariant: ${variant}`);
  }

  return applyVariantClassFingerprint(content, spec);
}

function buildDessertTableGalleryPageContent(spec) {
  const { copy, contact } = spec;
  const navLinks = navModelForSpec(spec, ["Styles", "Flavors", "Date"], ["styles", "process", "quote"]);
  const styles = spec.services.map((item, index) => galleryStyleCard(index + 1, item.title, item.text)).join("\n");
  const process = spec.process.map((item, index) => processStep(index + 1, item.title, item.text)).join("\n");
  const proof = spec.proof.map((item) => galleryProof(item.stat, item.label)).join("\n");

  return `
<!-- wp:group {"align":"full","backgroundColor":"white","style":{"spacing":{"padding":{"top":"18px","right":"24px","bottom":"18px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull has-white-background-color has-background" style="padding-top:18px;padding-right:24px;padding-bottom:18px;padding-left:24px">
<!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide">
<!-- wp:site-logo {"width":250,"shouldSyncIcon":true} /-->
<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"780"}}} -->
${navigationLinkBlocks(navLinks)}
<!-- /wp:navigation -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->

<!-- wp:cover {"url":"{{hero_url}}","id":{{hero_id}},"dimRatio":18,"overlayColor":"deep-green","isUserOverlayColor":true,"minHeight":680,"minHeightUnit":"px","align":"full","className":"som-gallery-hero som-gallery-image","style":{"spacing":{"padding":{"top":"46px","right":"24px","bottom":"54px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-cover alignfull som-gallery-hero som-gallery-image" style="padding-top:46px;padding-right:24px;padding-bottom:54px;padding-left:24px;min-height:680px"><span aria-hidden="true" class="wp-block-cover__background has-deep-green-background-color has-background-dim-20 has-background-dim"></span><img class="wp-block-cover__image-background wp-image-{{hero_id}}" alt="${esc(spec.assetMeta.hero.alt)}" src="{{hero_url}}" data-object-fit="cover" data-object-position="50% 52%"/><div class="wp-block-cover__inner-container">
<!-- wp:columns {"verticalAlignment":"bottom","className":"som-gallery-copy-row","style":{"spacing":{"blockGap":{"left":"24px"}}}} -->
<div class="wp-block-columns are-vertically-aligned-bottom som-gallery-copy-row">
<!-- wp:column {"verticalAlignment":"bottom","width":"63%","className":"som-gallery-copy","backgroundColor":"white","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"32px","right":"34px","bottom":"32px","left":"34px"}}}} -->
<div class="wp-block-column is-vertically-aligned-bottom som-gallery-copy has-white-background-color has-background" style="border-radius:8px;padding-top:32px;padding-right:34px;padding-bottom:32px;padding-left:34px;flex-basis:63%">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"850","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:14px;font-style:normal;font-weight:850;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(36px, 4.5vw, 60px)","lineHeight":"1.08","fontStyle":"normal","fontWeight":"620"},"spacing":{"margin":{"top":"10px","bottom":"16px"}}}} -->
<h1 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:10px;margin-bottom:16px;font-size:clamp(36px, 4.5vw, 60px);font-style:normal;font-weight:620;line-height:1.08">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"clamp(18px, 1.5vw, 22px)","lineHeight":"1.5"},"spacing":{"margin":{"bottom":"22px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-bottom:22px;font-size:clamp(18px, 1.5vw, 22px);line-height:1.5">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"13px","bottom":"13px","left":"20px","right":"20px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:6px;padding-top:13px;padding-right:20px;padding-bottom:13px;padding-left:20px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"13px","bottom":"13px","left":"20px","right":"20px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button is-style-outline" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-text-color wp-element-button" href="#${esc(anchorAt(navLinks, 0, "styles"))}" style="border-radius:6px;padding-top:13px;padding-right:20px;padding-bottom:13px;padding-left:20px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"bottom","width":"37%","className":"som-gallery-note","backgroundColor":"deep-green","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"30px","right":"28px","bottom":"30px","left":"28px"}}}} -->
<div class="wp-block-column is-vertically-aligned-bottom som-gallery-note has-deep-green-background-color has-background" style="border-radius:8px;padding-top:30px;padding-right:28px;padding-bottom:30px;padding-left:28px;flex-basis:37%">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-sun-color has-text-color" style="font-size:14px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.introTitle)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"18px","lineHeight":"1.48"}}} -->
<p class="has-white-color has-text-color" style="font-size:18px;line-height:1.48">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div></div>
<!-- /wp:cover -->

<!-- wp:group {"metadata":{"name":"Flavor proof"},"align":"full","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"34px","right":"24px","bottom":"34px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull has-deep-green-background-color has-background" style="padding-top:34px;padding-right:24px;padding-bottom:34px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"14px"}}}} -->
<div class="wp-block-columns alignwide">
${proof}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Styles"},"anchor":"styles","align":"full","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"72px","right":"24px","bottom":"72px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="styles" class="wp-block-group alignfull has-cream-background-color has-background" style="padding-top:72px;padding-right:24px;padding-bottom:72px;padding-left:24px">
<!-- wp:columns {"align":"wide","verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"38px"}}}} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"40%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:40%">
<!-- wp:heading {"level":2,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(32px, 4vw, 50px)","lineHeight":"1.08","fontStyle":"normal","fontWeight":"620"},"spacing":{"margin":{"bottom":"16px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:16px;font-size:clamp(32px, 4vw, 50px);font-style:normal;font-weight:620;line-height:1.08">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:quote {"className":"som-dessert-client-quote"} -->
<blockquote class="wp-block-quote som-dessert-client-quote"><p>${esc(copy.introText)}</p><cite>${esc(spec.businessName)} event planning note</cite></blockquote>
<!-- /wp:quote -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"60%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:60%">
<!-- wp:gallery {"linkTo":"none","columns":3,"imageCrop":true,"className":"som-dessert-proof-gallery"} -->
<figure class="wp-block-gallery has-nested-images columns-3 is-cropped som-dessert-proof-gallery">
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"large","linkDestination":"none","className":"som-dessert-gallery-crop som-dessert-crop-wide"} -->
<figure class="wp-block-image size-large som-dessert-gallery-crop som-dessert-crop-wide"><img src="{{hero_url}}" alt="${esc(spec.assetMeta.hero.alt)} detail crop showing styled dessert table height and color" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"large","linkDestination":"none","className":"som-dessert-gallery-crop som-dessert-crop-flavor"} -->
<figure class="wp-block-image size-large som-dessert-gallery-crop som-dessert-crop-flavor"><img src="{{hero_url}}" alt="${esc(spec.assetMeta.hero.alt)} detail crop showing sweets and serving pieces" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"large","linkDestination":"none","className":"som-dessert-gallery-crop som-dessert-crop-room"} -->
<figure class="wp-block-image size-large som-dessert-gallery-crop som-dessert-crop-room"><img src="{{hero_url}}" alt="${esc(spec.assetMeta.hero.alt)} detail crop showing room-ready dessert table styling" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
</figure>
<!-- /wp:gallery -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"20px"},"margin":{"top":"30px"}}}} -->
<div class="wp-block-columns alignwide" style="margin-top:30px">
${styles}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Process"},"anchor":"process","align":"full","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"72px","right":"24px","bottom":"72px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="process" class="wp-block-group alignfull has-mist-background-color has-background" style="padding-top:72px;padding-right:24px;padding-bottom:72px;padding-left:24px">
<!-- wp:heading {"level":2,"align":"wide","textColor":"deep-green","style":{"typography":{"fontSize":"clamp(31px, 4vw, 50px)","lineHeight":"1.08","fontStyle":"normal","fontWeight":"620"},"spacing":{"margin":{"bottom":"30px"}}}} -->
<h2 class="wp-block-heading alignwide has-deep-green-color has-text-color" style="margin-bottom:30px;font-size:clamp(31px, 4vw, 50px);font-style:normal;font-weight:620;line-height:1.08">${esc(copy.processTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"22px"}}}} -->
<div class="wp-block-columns alignwide">
${process}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Quote"},"anchor":"quote","align":"full","className":"som-quote-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"66px","right":"24px","bottom":"32px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="quote" class="wp-block-group alignfull som-quote-strip has-deep-green-background-color has-background" style="padding-top:66px;padding-right:24px;padding-bottom:32px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"42px"}}}} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"58%"} -->
<div class="wp-block-column" style="flex-basis:58%">
<!-- wp:heading {"level":2,"textColor":"white","style":{"typography":{"fontSize":"clamp(32px, 4.2vw, 52px)","lineHeight":"1.08","fontStyle":"normal","fontWeight":"620"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-white-color has-text-color" style="margin-bottom:18px;font-size:clamp(32px, 4.2vw, 52px);font-style:normal;font-weight:620;line-height:1.08">${esc(copy.quoteTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"20px","lineHeight":"1.5"}}} -->
<p class="has-white-color has-text-color" style="font-size:20px;line-height:1.5">${esc(copy.quoteText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"42%"} -->
<div class="wp-block-column" style="flex-basis:42%">
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"left"},"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","width":100,"style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:6px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">Email date + flavors</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"white","width":100,"style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100 is-style-outline" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-white-color has-text-color wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:6px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
<!-- wp:separator {"className":"is-style-wide","backgroundColor":"sun","style":{"spacing":{"margin":{"top":"48px","bottom":"26px"}}}} -->
<hr class="wp-block-separator has-text-color has-sun-color has-alpha-channel-opacity has-sun-background-color has-background is-style-wide" style="margin-top:48px;margin-bottom:26px"/>
<!-- /wp:separator -->
<!-- wp:group {"align":"wide","className":"som-footer","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide som-footer">
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"700"}}} -->
<p class="has-white-color has-text-color" style="font-size:16px;font-style:normal;font-weight:700">${esc(spec.businessName)} - ${esc(spec.tagline)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-sun-color has-text-color" style="font-size:16px;font-style:normal;font-weight:800">${esc(contact.phoneLabel)} / ${esc(contact.email)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->
`.trim();
}

function buildColorConsultStoryPageContent(spec) {
  const { copy, contact } = spec;
  const navLinks = navModelForSpec(spec, ["Rooms", "Process", "Palette"], ["checklist", "proof", "quote"]);
  const services = spec.services.map((item, index) => colorSupportCard(index + 1, item.title, item.text)).join("\n");
  const process = spec.process.map((item, index) => colorProcessStep(index + 1, item.title, item.text)).join("\n");
  const proof = spec.proof.map((item) => colorProofCard(item.stat, item.label)).join("\n");

  return `
<!-- wp:group {"align":"full","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"18px","right":"24px","bottom":"18px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull has-cream-background-color has-background" style="padding-top:18px;padding-right:24px;padding-bottom:18px;padding-left:24px">
<!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide">
<!-- wp:site-logo {"width":250,"shouldSyncIcon":true} /-->
<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"740"}}} -->
${navigationLinkBlocks(navLinks)}
<!-- /wp:navigation -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->

<!-- wp:media-text {"align":"full","mediaPosition":"right","mediaId":{{hero_id}},"mediaLink":"{{hero_url}}","mediaType":"image","mediaWidth":48,"imageFill":true,"className":"som-checklist-hero","style":{"spacing":{"padding":{"top":"56px","right":"24px","bottom":"60px","left":"24px"}}}} -->
<div class="wp-block-media-text alignfull has-media-on-the-right is-stacked-on-mobile is-image-fill som-checklist-hero" style="padding-top:56px;padding-right:24px;padding-bottom:60px;padding-left:24px;grid-template-columns:auto 48%">
<div class="wp-block-media-text__content">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"850","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:14px;font-style:normal;font-weight:850;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(36px, 4.5vw, 62px)","lineHeight":"1.08","fontStyle":"normal","fontWeight":"620"},"spacing":{"margin":{"top":"12px","bottom":"18px"}}}} -->
<h1 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:12px;margin-bottom:18px;font-size:clamp(36px, 4.5vw, 62px);font-style:normal;font-weight:620;line-height:1.08">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"clamp(19px, 1.7vw, 24px)","lineHeight":"1.52"},"spacing":{"margin":{"bottom":"24px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-bottom:24px;font-size:clamp(19px, 1.7vw, 24px);line-height:1.52">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"13px","bottom":"13px","left":"20px","right":"20px"}},"typography":{"fontStyle":"normal","fontWeight":"780"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:780"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:6px;padding-top:13px;padding-right:20px;padding-bottom:13px;padding-left:20px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"13px","bottom":"13px","left":"20px","right":"20px"}},"typography":{"fontStyle":"normal","fontWeight":"780"}}} -->
<div class="wp-block-button is-style-outline" style="font-style:normal;font-weight:780"><a class="wp-block-button__link has-deep-green-color has-text-color wp-element-button" href="#${esc(anchorAt(navLinks, 1, "proof"))}" style="border-radius:6px;padding-top:13px;padding-right:20px;padding-bottom:13px;padding-left:20px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
<!-- wp:list {"className":"som-color-room-list","style":{"typography":{"fontSize":"17px","lineHeight":"1.5","fontWeight":"650"},"spacing":{"margin":{"top":"26px","bottom":"0"}}}} -->
<ul class="som-color-room-list" style="margin-top:26px;margin-bottom:0;font-size:17px;font-weight:650;line-height:1.5"><!-- wp:list-item --><li>Light shifts, undertones, and existing finishes get checked together.</li><!-- /wp:list-item --><!-- wp:list-item --><li>You leave with sample notes before committing to gallons.</li><!-- /wp:list-item --></ul>
<!-- /wp:list -->
</div>
<figure class="wp-block-media-text__media" style="background-image:url({{hero_url}});background-position:50% 52%"><img src="{{hero_url}}" alt="${esc(spec.assetMeta.hero.alt)}" class="wp-image-{{hero_id}} size-full"/></figure></div>
<!-- /wp:media-text -->

<!-- wp:group {"metadata":{"name":"Room proof"},"anchor":"checklist","align":"full","className":"som-urgency-band","backgroundColor":"white","style":{"spacing":{"padding":{"top":"38px","right":"24px","bottom":"38px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="checklist" class="wp-block-group alignfull som-urgency-band has-white-background-color has-background" style="padding-top:38px;padding-right:24px;padding-bottom:38px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"14px"}}}} -->
<div class="wp-block-columns alignwide">
${proof}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Palette support"},"align":"full","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"74px","right":"24px","bottom":"74px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull has-cream-background-color has-background" style="padding-top:74px;padding-right:24px;padding-bottom:74px;padding-left:24px">
<!-- wp:heading {"level":2,"align":"wide","textColor":"deep-green","style":{"typography":{"fontSize":"clamp(32px, 4vw, 50px)","lineHeight":"1.08","fontStyle":"normal","fontWeight":"620"},"spacing":{"margin":{"bottom":"26px"}}}} -->
<h2 class="wp-block-heading alignwide has-deep-green-color has-text-color" style="margin-bottom:26px;font-size:clamp(32px, 4vw, 50px);font-style:normal;font-weight:620;line-height:1.08">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"20px"}}}} -->
<div class="wp-block-columns alignwide">
${services}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Process"},"anchor":"proof","align":"full","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"74px","right":"24px","bottom":"74px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="proof" class="wp-block-group alignfull has-mist-background-color has-background" style="padding-top:74px;padding-right:24px;padding-bottom:74px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"40px"}}}} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"38%"} -->
<div class="wp-block-column" style="flex-basis:38%">
<!-- wp:heading {"level":2,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(31px, 3.8vw, 48px)","lineHeight":"1.08","fontStyle":"normal","fontWeight":"620"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:18px;font-size:clamp(31px, 3.8vw, 48px);font-style:normal;font-weight:620;line-height:1.08">${esc(copy.processTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:quote {"className":"som-color-consult-quote"} -->
<blockquote class="wp-block-quote som-color-consult-quote"><p>${esc(copy.introText)}</p><cite>Palette note from ${esc(spec.businessName)}</cite></blockquote>
<!-- /wp:quote -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"62%"} -->
<div class="wp-block-column" style="flex-basis:62%">
${process}
<!-- wp:details {"className":"som-color-detail"} -->
<details class="wp-block-details som-color-detail"><summary>What should I send before a palette consult?</summary><!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:17px;line-height:1.5">Room photos in daylight and evening light, current paint names if you know them, fixed finishes, one color you like, and one color that keeps bothering you.</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->
<!-- wp:details {"className":"som-color-detail"} -->
<details class="wp-block-details som-color-detail"><summary>Can you work with samples I already bought?</summary><!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:17px;line-height:1.5">Yes. We can sort what is promising, what is fighting the room, and what deserves a larger test before you paint.</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Palette quote"},"anchor":"quote","align":"full","className":"som-quote-strip","backgroundColor":"white","style":{"spacing":{"padding":{"top":"68px","right":"24px","bottom":"34px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="quote" class="wp-block-group alignfull som-quote-strip has-white-background-color has-background" style="padding-top:68px;padding-right:24px;padding-bottom:34px;padding-left:24px">
<!-- wp:columns {"align":"wide","verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"42px"}}}} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"60%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:60%">
<!-- wp:heading {"level":2,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(32px, 4.2vw, 52px)","lineHeight":"1.08","fontStyle":"normal","fontWeight":"620"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:18px;font-size:clamp(32px, 4.2vw, 52px);font-style:normal;font-weight:620;line-height:1.08">${esc(copy.quoteTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"20px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:20px;line-height:1.55">${esc(copy.quoteText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"40%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:40%">
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"left"},"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","width":100,"style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"780"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100" style="font-style:normal;font-weight:780"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:6px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">Email room photos</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"deep-green","width":100,"style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"780"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100 is-style-outline" style="font-style:normal;font-weight:780"><a class="wp-block-button__link has-deep-green-color has-text-color wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:6px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
<!-- wp:separator {"className":"is-style-wide","backgroundColor":"sun","style":{"spacing":{"margin":{"top":"48px","bottom":"26px"}}}} -->
<hr class="wp-block-separator has-text-color has-sun-color has-alpha-channel-opacity has-sun-background-color has-background is-style-wide" style="margin-top:48px;margin-bottom:26px"/>
<!-- /wp:separator -->
<!-- wp:group {"align":"wide","className":"som-footer","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide som-footer">
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"700"}}} -->
<p class="has-deep-green-color has-text-color" style="font-size:16px;font-style:normal;font-weight:700">${esc(spec.businessName)} - ${esc(spec.tagline)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-grass-color has-text-color" style="font-size:16px;font-style:normal;font-weight:800">${esc(contact.phoneLabel)} / ${esc(contact.email)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->
`.trim();
}

function navModelForSpec(spec, fallbackLabels, fallbackAnchors) {
  const archetype = layoutArchetypeFor(spec);
  const labels = normalizeNavValues(archetype.navLabels, fallbackLabels);
  const anchors = normalizeNavValues(archetype.anchorOrder, fallbackAnchors);
  return labels.map((label, index) => ({
    label,
    anchor: anchors[index] || fallbackAnchors[index] || anchors[0] || "quote"
  }));
}

function normalizeNavValues(values, fallback) {
  const source = Array.isArray(values) && values.length ? values : fallback;
  return fallback.map((value, index) => source[index] || value);
}

function navigationLinkBlocks(links) {
  return links.map((link) => `<!-- wp:navigation-link {"label":"${esc(link.label)}","url":"#${esc(link.anchor)}","kind":"custom","isTopLevelLink":true} /-->`).join("\n");
}

function anchorAt(links, index, fallback = "quote") {
  return links[index]?.anchor || fallback;
}

function buildRouteLedSchedulePageContent(spec) {
  const { copy, contact } = spec;
  const navLinks = navModelForSpec(spec, ["Routes", "Visit notes", "Join"], ["routes", "notes", "quote"]);
  const services = spec.services.map((item, index) => routePlanCard(index + 1, item.title, item.text)).join("\n");
  const processRows = spec.process.map((item, index) => routeTableRow(index + 1, item.title, item.text)).join("\n");
  const processCards = spec.process.map((item, index) => routeProcessCard(index + 1, item.title, item.text)).join("\n");
  const proof = spec.proof.map((item) => routeProofCard(item.stat, item.label)).join("\n");
  const routeAnchor = anchorAt(navLinks, 0, "routes");

  return `
<!-- wp:group {"metadata":{"name":"Route-led schedule page"},"align":"full","className":"som-route-page","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"0","right":"0","bottom":"0","left":"0"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group alignfull som-route-page has-cream-background-color has-background" style="padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
<!-- wp:group {"className":"som-route-header","backgroundColor":"white","style":{"spacing":{"padding":{"top":"18px","right":"clamp(24px, 5vw, 72px)","bottom":"16px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-route-header has-white-background-color has-background" style="padding-top:18px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:16px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"center","isStackedOnMobile":false,"style":{"spacing":{"blockGap":{"left":"22px"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center is-not-stacked-on-mobile">
<!-- wp:column {"verticalAlignment":"center","width":"260px"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:260px">
<!-- wp:site-logo {"width":245,"shouldSyncIcon":true} /-->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center"} -->
<div class="wp-block-column is-vertically-aligned-center">
<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"850"}}} -->
${navigationLinkBlocks(navLinks)}
<!-- /wp:navigation -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"172px","className":"som-route-header-action"} -->
<div class="wp-block-column is-vertically-aligned-center som-route-header-action" style="flex-basis:172px">
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"right"}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"deep-green","textColor":"white","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"12px","right":"18px","bottom":"12px","left":"18px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-white-color has-deep-green-background-color has-text-color has-background wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:6px;padding-top:12px;padding-right:18px;padding-bottom:12px;padding-left:18px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-route-hero-shell","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"clamp(42px, 6vw, 74px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(44px, 6vw, 76px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-route-hero-shell has-cream-background-color has-background" style="padding-top:clamp(42px, 6vw, 74px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(44px, 6vw, 76px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"align":"wide","verticalAlignment":"center","className":"som-route-hero","style":{"spacing":{"blockGap":{"left":"clamp(34px, 5vw, 70px)"}}}} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center som-route-hero">
<!-- wp:column {"verticalAlignment":"center","width":"47%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:47%">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|hero","lineHeight":"0.98","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"12px","bottom":"22px"}}}} -->
<h1 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:12px;margin-bottom:22px;font-size:var(--wp--preset--font-size--hero);font-style:normal;font-weight:900;line-height:0.98">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.48"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-bottom:28px;font-size:var(--wp--preset--font-size--lead);line-height:1.48">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"900"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:900"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:6px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"900"}}} -->
<div class="wp-block-button is-style-outline" style="font-style:normal;font-weight:900"><a class="wp-block-button__link has-deep-green-color has-text-color wp-element-button" href="#${esc(routeAnchor)}" style="border-radius:6px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"53%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:53%">
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"full","linkDestination":"none","className":"som-route-hero-photo"} -->
<figure class="wp-block-image size-full som-route-hero-photo"><img src="{{hero_url}}" alt="${esc(spec.assetMeta.hero.alt)}" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
<!-- wp:group {"className":"som-route-status-board","backgroundColor":"deep-green","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"22px","right":"24px","bottom":"22px","left":"24px"},"margin":{"top":"-74px","right":"28px","left":"28px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-route-status-board has-deep-green-background-color has-background" style="border-radius:8px;margin-top:-74px;margin-right:28px;margin-left:28px;padding-top:22px;padding-right:24px;padding-bottom:22px;padding-left:24px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"12px"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:12px;font-size:13px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Route board</p>
<!-- /wp:paragraph -->
<!-- wp:columns {"className":"som-route-board-row","style":{"spacing":{"blockGap":{"left":"14px"}}}} -->
<div class="wp-block-columns som-route-board-row">
<!-- wp:column -->
<div class="wp-block-column">
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"24px","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"6px"}}}} -->
<p class="has-white-color has-text-color" style="margin-bottom:6px;font-size:24px;font-style:normal;font-weight:900;line-height:1">North + West</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"mist","style":{"typography":{"fontSize":"14px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"750"}}} -->
<p class="has-mist-color has-text-color" style="font-size:14px;font-style:normal;font-weight:750;line-height:1.45">weekly route lanes</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column -->
<div class="wp-block-column">
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"24px","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"6px"}}}} -->
<p class="has-white-color has-text-color" style="margin-bottom:6px;font-size:24px;font-style:normal;font-weight:900;line-height:1">24 hr</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"mist","style":{"typography":{"fontSize":"14px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"750"}}} -->
<p class="has-mist-color has-text-color" style="font-size:14px;font-style:normal;font-weight:750;line-height:1.45">weekday quote reply</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column -->
<div class="wp-block-column">
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"24px","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"6px"}}}} -->
<p class="has-white-color has-text-color" style="margin-bottom:6px;font-size:24px;font-style:normal;font-weight:900;line-height:1">Gate check</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"mist","style":{"typography":{"fontSize":"14px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"750"}}} -->
<p class="has-mist-color has-text-color" style="font-size:14px;font-style:normal;font-weight:750;line-height:1.45">after every visit</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Route plans"},"anchor":"routes","className":"som-route-plans","align":"full","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"74px","right":"clamp(24px, 5vw, 72px)","bottom":"74px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="routes" class="wp-block-group alignfull som-route-plans has-mist-background-color has-background" style="padding-top:74px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:74px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"38px"}}}} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"35%"} -->
<div class="wp-block-column" style="flex-basis:35%">
<!-- wp:heading {"level":2,"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"19px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:19px;line-height:1.5">${esc(contact.serviceArea)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"65%"} -->
<div class="wp-block-column" style="flex-basis:65%">
<!-- wp:columns {"className":"som-route-plan-grid","style":{"spacing":{"blockGap":{"left":"16px"}}}} -->
<div class="wp-block-columns som-route-plan-grid">
${services}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Visit notes"},"anchor":"notes","className":"som-route-notes","align":"full","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"78px","right":"clamp(24px, 5vw, 72px)","bottom":"78px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="notes" class="wp-block-group alignfull som-route-notes has-cream-background-color has-background" style="padding-top:78px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:78px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"38px"}}}} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"42%"} -->
<div class="wp-block-column" style="flex-basis:42%">
<!-- wp:heading {"level":2,"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1">${esc(copy.processTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"20px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:20px;line-height:1.5">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
${processCards}
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"58%"} -->
<div class="wp-block-column" style="flex-basis:58%">
<!-- wp:table {"className":"som-route-table"} -->
<figure class="wp-block-table som-route-table"><table><thead><tr><th>Step</th><th>Route note</th><th>What it means</th></tr></thead><tbody>
${processRows}
</tbody></table></figure>
<!-- /wp:table -->
<!-- wp:details {"className":"som-route-detail"} -->
<details class="wp-block-details som-route-detail"><summary>What should I send for a quote?</summary><!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:17px;line-height:1.5">Address, a few yard photos, preferred access notes, and whether you want weekly mowing, cleanup help, or a one-time reset.</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Route proof"},"anchor":"proof","className":"som-route-proof-board","align":"full","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"72px","right":"clamp(24px, 5vw, 72px)","bottom":"72px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="proof" class="wp-block-group alignfull som-route-proof-board has-deep-green-background-color has-background" style="padding-top:72px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:72px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:heading {"level":2,"align":"wide","textColor":"white","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"30px"}}}} -->
<h2 class="wp-block-heading alignwide has-white-color has-text-color" style="margin-bottom:30px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1">${esc(copy.proofTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"16px"}}}} -->
<div class="wp-block-columns alignwide">
${proof}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Join route"},"anchor":"quote","className":"som-route-join","align":"full","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"84px","right":"clamp(24px, 5vw, 72px)","bottom":"84px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"980px"}} -->
<div id="quote" class="wp-block-group alignfull som-route-join has-cream-background-color has-background" style="padding-top:84px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:84px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:group {"className":"som-route-quote-card","backgroundColor":"white","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"44px","right":"38px","bottom":"44px","left":"38px"}}},"layout":{"type":"constrained","contentSize":"760px"}} -->
<div class="wp-block-group som-route-quote-card has-white-background-color has-background" style="border-radius:8px;padding-top:44px;padding-right:38px;padding-bottom:44px;padding-left:38px">
<!-- wp:heading {"textAlign":"center","level":2,"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-text-align-center has-deep-green-color has-text-color" style="margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1">${esc(copy.quoteTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"align":"center","textColor":"soil","style":{"typography":{"fontSize":"20px","lineHeight":"1.5"}}} -->
<p class="has-text-align-center has-soil-color has-text-color" style="font-size:20px;line-height:1.5">${esc(copy.quoteText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"blockGap":"12px","margin":{"top":"28px"}}}} -->
<div class="wp-block-buttons" style="margin-top:28px">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"900"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:900"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:6px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">Email route photos</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"900"}}} -->
<div class="wp-block-button is-style-outline" style="font-style:normal;font-weight:900"><a class="wp-block-button__link has-deep-green-color has-text-color wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:6px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-route-footer","align":"full","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"30px","right":"clamp(24px, 5vw, 72px)","bottom":"30px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull som-route-footer has-deep-green-background-color has-background" style="padding-top:30px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:30px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide">
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"750"}}} -->
<p class="has-white-color has-text-color" style="font-size:16px;font-style:normal;font-weight:750">${esc(spec.businessName)} - ${esc(spec.tagline)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"850"}}} -->
<p class="has-sun-color has-text-color" style="font-size:16px;font-style:normal;font-weight:850">${esc(contact.phoneLabel)} / ${esc(contact.email)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->
`.trim();
}

function renderVariantForSpec(spec) {
  return renderFamilyForVariant(layoutVariantFor(spec));
}

function applyVariantClassFingerprint(content, spec) {
  const classMap = VARIANT_CLASS_FINGERPRINTS[layoutVariantFor(spec)];
  if (!classMap) {
    return content;
  }

  let updated = content;
  for (const [baseClass, extraClass] of Object.entries(classMap)) {
    const pattern = new RegExp(`(?<![a-z0-9-])${escapeRegExp(baseClass)}(?![a-z0-9-])`, "g");
    updated = updated.replace(pattern, `${baseClass} ${extraClass}`);
  }
  return updated;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildServiceReceiptStackPageContent(spec) {
  const { copy, contact } = spec;
  const navLabels = layoutArchetypeFor(spec).navLabels || ["Scope", "Safety", "Quote"];
  const services = spec.services;
  const process = spec.process;
  const proof = spec.proof;

  return `
<!-- wp:group {"metadata":{"name":"Receipt stack page"},"align":"full","className":"som-receipt-page","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"0","right":"0","bottom":"0","left":"0"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group alignfull som-receipt-page has-cream-background-color has-background" style="padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
<!-- wp:group {"className":"som-receipt-header","backgroundColor":"white","style":{"spacing":{"padding":{"top":"18px","right":"clamp(24px, 5vw, 72px)","bottom":"16px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-receipt-header has-white-background-color has-background" style="padding-top:18px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:16px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"center","isStackedOnMobile":false,"style":{"spacing":{"blockGap":{"left":"24px"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center is-not-stacked-on-mobile">
<!-- wp:column {"verticalAlignment":"center","width":"255px"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:255px">
<!-- wp:site-logo {"width":238,"shouldSyncIcon":false} /-->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center"} -->
<div class="wp-block-column is-vertically-aligned-center">
<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"850"}}} -->
<!-- wp:navigation-link {"label":"${esc(navLabels[0])}","url":"#scope","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"${esc(navLabels[1])}","url":"#safety","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"${esc(navLabels[2])}","url":"#quote","kind":"custom","isTopLevelLink":true} /-->
<!-- /wp:navigation -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"170px","className":"som-receipt-header-action"} -->
<div class="wp-block-column is-vertically-aligned-center som-receipt-header-action" style="flex-basis:170px">
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"right"}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"deep-green","textColor":"white","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"12px","right":"18px","bottom":"12px","left":"18px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-white-color has-deep-green-background-color has-text-color has-background wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:6px;padding-top:12px;padding-right:18px;padding-bottom:12px;padding-left:18px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-receipt-hero-shell","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"clamp(42px, 6vw, 76px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(34px, 5vw, 64px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-receipt-hero-shell has-cream-background-color has-background" style="padding-top:clamp(42px, 6vw, 76px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(34px, 5vw, 64px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:media-text {"align":"wide","mediaPosition":"right","mediaId":{{hero_id}},"mediaLink":"{{hero_url}}","mediaType":"image","mediaWidth":46,"imageFill":true,"className":"som-receipt-hero"} -->
<div class="wp-block-media-text alignwide has-media-on-the-right is-stacked-on-mobile is-image-fill som-receipt-hero" style="grid-template-columns:auto 46%">
<figure class="wp-block-media-text__media" style="background-image:url({{hero_url}});background-position:50% 50%"><img src="{{hero_url}}" alt="${esc(spec.assetMeta.hero.alt)}" class="wp-image-{{hero_id}} size-full"/></figure>
<div class="wp-block-media-text__content">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|hero","lineHeight":"0.98","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"12px","bottom":"22px"}}}} -->
<h1 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:12px;margin-bottom:22px;font-size:var(--wp--preset--font-size--hero);font-style:normal;font-weight:900;line-height:0.98">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.52"},"spacing":{"margin":{"bottom":"26px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-bottom:26px;font-size:var(--wp--preset--font-size--lead);line-height:1.52">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":{"left":"12px"}}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:6px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"backgroundColor":"white","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-white-background-color has-text-color has-background wp-element-button" href="#scope" style="border-radius:6px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
${receiptCard(spec)}
</div>
</div>
<!-- /wp:media-text -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-receipt-proof-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"28px","right":"clamp(24px, 5vw, 72px)","bottom":"28px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-receipt-proof-strip has-deep-green-background-color has-background" style="padding-top:28px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:28px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"14px"}}}} -->
<div class="wp-block-columns">
${proof.map((item) => receiptProof(item.stat, item.label)).join("\n")}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Scope"},"id":"scope","className":"som-receipt-scope","backgroundColor":"white","style":{"spacing":{"padding":{"top":"clamp(56px, 7vw, 92px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(56px, 7vw, 92px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="scope" class="wp-block-group som-receipt-scope has-white-background-color has-background" style="padding-top:clamp(56px, 7vw, 92px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(56px, 7vw, 92px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:heading {"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"16px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:16px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.55"},"spacing":{"margin":{"bottom":"32px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-bottom:32px;font-size:var(--wp--preset--font-size--lead);line-height:1.55">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"18px"}}}} -->
<div class="wp-block-columns">
${services.map((service, index) => receiptServiceCard(index + 1, service.title, service.text)).join("\n")}
</div>
<!-- /wp:columns -->
${receiptScopeTable(services)}
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Safety"},"id":"safety","className":"som-receipt-safety","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"clamp(56px, 7vw, 90px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(56px, 7vw, 90px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="safety" class="wp-block-group som-receipt-safety has-mist-background-color has-background" style="padding-top:clamp(56px, 7vw, 90px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(56px, 7vw, 90px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"top","style":{"spacing":{"blockGap":{"left":"clamp(32px, 5vw, 72px)"}}}} -->
<div class="wp-block-columns are-vertically-aligned-top">
<!-- wp:column {"verticalAlignment":"top","width":"38%"} -->
<div class="wp-block-column is-vertically-aligned-top" style="flex-basis:38%">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.introTitle)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"10px","bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:10px;margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1">${esc(copy.processTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:quote {"className":"som-receipt-quote"} -->
<blockquote class="wp-block-quote som-receipt-quote"><p>${esc(contact.serviceArea)}</p><cite>${esc(spec.businessName)}</cite></blockquote>
<!-- /wp:quote -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"top"} -->
<div class="wp-block-column is-vertically-aligned-top">
${process.map((step, index) => receiptStep(index + 1, step.title, step.text)).join("\n")}
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
<!-- wp:group {"className":"som-receipt-details","style":{"spacing":{"margin":{"top":"34px"}}},"layout":{"type":"constrained","wideSize":"980px"}} -->
<div class="wp-block-group som-receipt-details" style="margin-top:34px">
${services.map((service) => receiptDetail(`What is included in ${service.title}?`, service.text)).join("\n")}
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Quote"},"id":"quote","className":"som-quote-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"clamp(56px, 7vw, 86px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(56px, 7vw, 86px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"980px"}} -->
<div id="quote" class="wp-block-group som-quote-strip has-deep-green-background-color has-background" style="padding-top:clamp(56px, 7vw, 86px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(56px, 7vw, 86px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:heading {"textAlign":"center","textColor":"white","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-text-align-center has-white-color has-text-color" style="margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1">${esc(copy.quoteTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"align":"center","textColor":"mist","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.55"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<p class="has-text-align-center has-mist-color has-text-color" style="margin-bottom:28px;font-size:var(--wp--preset--font-size--lead);line-height:1.55">${esc(copy.quoteText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"blockGap":{"left":"12px"}}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:6px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"backgroundColor":"white","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-white-background-color has-text-color has-background wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:6px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-footer","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"28px","right":"clamp(24px, 5vw, 72px)","bottom":"34px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-footer has-cream-background-color has-background" style="padding-top:28px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:34px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:paragraph {"align":"center","textColor":"soil"} -->
<p class="has-text-align-center has-soil-color has-text-color">${esc(spec.businessName)} - ${esc(spec.tagline)} - <a href="${esc(contact.emailHref)}">${esc(contact.email)}</a></p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->`.trim();
}

function receiptCard(spec) {
  const proof = spec.proof.slice(0, 3);
  return `
<!-- wp:group {"className":"som-receipt-card","backgroundColor":"white","style":{"spacing":{"padding":{"top":"20px","right":"20px","bottom":"20px","left":"20px"},"margin":{"top":"28px"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group som-receipt-card has-white-background-color has-background" style="margin-top:28px;padding-top:20px;padding-right:20px;padding-bottom:20px;padding-left:20px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:13px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Estimate receipt</p>
<!-- /wp:paragraph -->
${proof.map((item) => `<div class="som-ticket-line"><span>${esc(item.stat)}</span><strong>${esc(item.label)}</strong></div>`).join("\n")}
</div>
<!-- /wp:group -->`;
}

function receiptProof(stat, label) {
  return `
<!-- wp:column {"className":"som-receipt-proof"} -->
<div class="wp-block-column som-receipt-proof">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"26px","fontStyle":"normal","fontWeight":"900","lineHeight":"1"}}} -->
<p class="has-sun-color has-text-color" style="font-size:26px;font-style:normal;font-weight:900;line-height:1">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"mist","style":{"typography":{"fontSize":"15px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"700"}}} -->
<p class="has-mist-color has-text-color" style="font-size:15px;font-style:normal;font-weight:700;line-height:1.45">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`;
}

function receiptServiceCard(number, title, text) {
  return `
<!-- wp:column {"className":"som-receipt-card","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"22px","right":"22px","bottom":"22px","left":"22px"}}}} -->
<div class="wp-block-column som-receipt-card has-cream-background-color has-background" style="padding-top:22px;padding-right:22px;padding-bottom:22px;padding-left:22px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"900","letterSpacing":"0px","textTransform":"uppercase"}}} -->
<p class="has-grass-color has-text-color" style="font-size:13px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Line ${String(number).padStart(2, "0")}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|card-title","lineHeight":"1.04","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"8px","bottom":"12px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:8px;margin-bottom:12px;font-size:var(--wp--preset--font-size--card-title);font-style:normal;font-weight:900;line-height:1.04">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"16px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:16px;line-height:1.5">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`;
}

function receiptScopeTable(services) {
  const rows = services.map((service, index) => `<tr><td>${esc(service.title)}</td><td>${index === 0 ? "Standard" : index === 1 ? "Add-on" : "Optional"}</td><td>${esc(service.text)}</td></tr>`).join("");
  return `
<!-- wp:table {"className":"som-receipt-table"} -->
<figure class="wp-block-table som-receipt-table"><table><thead><tr><th>Scope line</th><th>Fit</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table></figure>
<!-- /wp:table -->`;
}

function receiptStep(number, title, text) {
  return `
<!-- wp:group {"className":"som-receipt-step","backgroundColor":"white","style":{"spacing":{"padding":{"top":"18px","right":"20px","bottom":"18px","left":"20px"},"margin":{"bottom":"14px"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group som-receipt-step has-white-background-color has-background" style="margin-bottom:14px;padding-top:18px;padding-right:20px;padding-bottom:18px;padding-left:20px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:13px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Step ${number}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"22px","fontStyle":"normal","fontWeight":"900","lineHeight":"1.08"},"spacing":{"margin":{"top":"6px","bottom":"8px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:6px;margin-bottom:8px;font-size:22px;font-style:normal;font-weight:900;line-height:1.08">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"16px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:16px;line-height:1.5">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->`;
}

function receiptDetail(summary, text) {
  return `
<!-- wp:details {"className":"som-receipt-detail"} -->
<details class="wp-block-details som-receipt-detail"><summary>${esc(summary)}</summary>
<!-- wp:paragraph {"textColor":"soil"} -->
<p class="has-soil-color has-text-color">${esc(text)}</p>
<!-- /wp:paragraph -->
</details>
<!-- /wp:details -->`;
}

function buildUrgentChecklistPageContent(spec) {
  const { copy, contact } = spec;
  const services = spec.services;
  const process = spec.process;
  const proof = spec.proof;

  return `
<!-- wp:group {"metadata":{"name":"Urgent checklist page"},"align":"full","className":"som-urgent-page","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"0","right":"0","bottom":"0","left":"0"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group alignfull som-urgent-page has-cream-background-color has-background" style="padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
<!-- wp:group {"className":"som-urgent-header","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"18px","right":"clamp(24px, 5vw, 72px)","bottom":"16px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-urgent-header has-cream-background-color has-background" style="padding-top:18px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:16px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"center","isStackedOnMobile":false,"style":{"spacing":{"blockGap":{"left":"24px"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center is-not-stacked-on-mobile">
<!-- wp:column {"verticalAlignment":"center","width":"260px"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:260px">
<!-- wp:site-logo {"width":235,"shouldSyncIcon":false} /-->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center"} -->
<div class="wp-block-column is-vertically-aligned-center">
<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"850"}}} -->
<!-- wp:navigation-link {"label":"Install","url":"#install","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"Safety","url":"#safety","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"Dates","url":"#quote","kind":"custom","isTopLevelLink":true} /-->
<!-- /wp:navigation -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"178px","className":"som-urgent-header-action"} -->
<div class="wp-block-column is-vertically-aligned-center som-urgent-header-action" style="flex-basis:178px">
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"right"}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"deep-green","textColor":"white","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"12px","right":"18px","bottom":"12px","left":"18px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-white-color has-deep-green-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:6px;padding-top:12px;padding-right:18px;padding-bottom:12px;padding-left:18px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-urgent-hero","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"clamp(46px, 6vw, 80px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(46px, 6vw, 80px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-urgent-hero has-deep-green-background-color has-background" style="padding-top:clamp(46px, 6vw, 80px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(46px, 6vw, 80px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"clamp(34px, 5vw, 72px)"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"42%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:42%">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-sun-color has-text-color" style="font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"white","style":{"typography":{"fontSize":"var:preset|font-size|hero","lineHeight":"0.98","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"16px","bottom":"22px"}}}} -->
<h1 class="wp-block-heading has-white-color has-text-color" style="margin-top:16px;margin-bottom:22px;font-size:var(--wp--preset--font-size--hero);font-style:normal;font-weight:900;line-height:0.98">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"mist","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.52"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<p class="has-mist-color has-text-color" style="margin-bottom:28px;font-size:var(--wp--preset--font-size--lead);line-height:1.52">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":{"left":"12px"}}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:6px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"backgroundColor":"white","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-white-background-color has-text-color has-background wp-element-button" href="#install" style="border-radius:6px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"58%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:58%">
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"full","linkDestination":"none","className":"som-urgent-photo"} -->
<figure class="wp-block-image size-full som-urgent-photo"><img src="{{hero_url}}" alt="${esc(spec.assetMeta.hero.alt)}" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
${urgentDateBoard(proof)}
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-urgent-proof-strip","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"26px","right":"clamp(24px, 5vw, 72px)","bottom":"26px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-urgent-proof-strip has-mist-background-color has-background" style="padding-top:26px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:26px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"16px"}}}} -->
<div class="wp-block-columns">
${proof.map((item) => urgentProof(item.stat, item.label)).join("\n")}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Install"},"id":"install","className":"som-urgent-install","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 92px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(50px, 7vw, 86px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="install" class="wp-block-group som-urgent-install has-cream-background-color has-background" style="padding-top:clamp(54px, 7vw, 92px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(50px, 7vw, 86px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"bottom","style":{"spacing":{"blockGap":{"left":"clamp(32px, 5vw, 70px)"}}}} -->
<div class="wp-block-columns are-vertically-aligned-bottom">
<!-- wp:column {"verticalAlignment":"bottom","width":"45%"} -->
<div class="wp-block-column is-vertically-aligned-bottom" style="flex-basis:45%">
<!-- wp:heading {"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"bottom"} -->
<div class="wp-block-column is-vertically-aligned-bottom">
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.55"},"spacing":{"margin":{"bottom":"24px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-bottom:24px;font-size:var(--wp--preset--font-size--lead);line-height:1.55">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"20px"}}}} -->
<div class="wp-block-columns">
${services.map((service, index) => urgentCard(index + 1, service.title, service.text)).join("\n")}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Safety"},"id":"safety","className":"som-urgent-safety","backgroundColor":"white","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 90px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 90px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="safety" class="wp-block-group som-urgent-safety has-white-background-color has-background" style="padding-top:clamp(54px, 7vw, 90px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(54px, 7vw, 90px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"top","style":{"spacing":{"blockGap":{"left":"clamp(34px, 5vw, 74px)"}}}} -->
<div class="wp-block-columns are-vertically-aligned-top">
<!-- wp:column {"verticalAlignment":"top","width":"38%"} -->
<div class="wp-block-column is-vertically-aligned-top" style="flex-basis:38%">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.proofTitle)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1.02","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"10px","bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:10px;margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1.02">${esc(copy.processTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"19px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:19px;line-height:1.55">${esc(contact.serviceArea)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"top"} -->
<div class="wp-block-column is-vertically-aligned-top">
${process.map((step, index) => urgentStep(index + 1, step.title, step.text)).join("\n")}
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-urgent-faq","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"clamp(46px, 6vw, 74px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(48px, 7vw, 82px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"980px"}} -->
<div class="wp-block-group som-urgent-faq has-cream-background-color has-background" style="padding-top:clamp(46px, 6vw, 74px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(48px, 7vw, 82px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:heading {"textAlign":"center","textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"24px"}}}} -->
<h2 class="wp-block-heading has-text-align-center has-deep-green-color has-text-color" style="margin-bottom:24px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1">Quick date questions</h2>
<!-- /wp:heading -->
${urgentDetail("How early should we reserve a roofline?", "Popular install weeks fill before the first real cold snap. Send a roof photo, preferred glow style, and target week early so we can hold the right ladder time.")}
${urgentDetail("Do you remove and store the lights?", "Yes. Removal is scheduled after the season, cords are checked, clips are sorted, and storage can be labeled so next year starts cleaner.")}
${urgentDetail("Can you match warm white without going overboard?", "Absolutely. We can keep the look classic with roofline-only warm white, add wreaths or pillars, or build a brighter plan if your block expects a little spectacle.")}
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Quote"},"id":"quote","className":"som-quote-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 84px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 84px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"980px"}} -->
<div id="quote" class="wp-block-group som-quote-strip has-deep-green-background-color has-background" style="padding-top:clamp(54px, 7vw, 84px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(54px, 7vw, 84px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:heading {"textAlign":"center","textColor":"white","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-text-align-center has-white-color has-text-color" style="margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1">${esc(copy.quoteTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"align":"center","textColor":"mist","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.55"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<p class="has-text-align-center has-mist-color has-text-color" style="margin-bottom:28px;font-size:var(--wp--preset--font-size--lead);line-height:1.55">${esc(copy.quoteText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"blockGap":{"left":"12px"}}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:6px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"backgroundColor":"white","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-white-background-color has-text-color has-background wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:6px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-footer","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"28px","right":"clamp(24px, 5vw, 72px)","bottom":"34px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-footer has-cream-background-color has-background" style="padding-top:28px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:34px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:paragraph {"align":"center","textColor":"soil"} -->
<p class="has-text-align-center has-soil-color has-text-color">${esc(spec.businessName)} - ${esc(contact.serviceArea)} - <a href="${esc(contact.emailHref)}">${esc(contact.email)}</a></p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->
`.trim();
}

function urgentDateBoard(proof) {
  const first = proof[0] || { stat: "Dates", label: "reserve the install window" };
  const second = proof[1] || { stat: "Safety", label: "roofline and ladder planning" };
  return `
<!-- wp:group {"className":"som-date-board","backgroundColor":"white","style":{"spacing":{"padding":{"top":"20px","right":"22px","bottom":"20px","left":"22px"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group som-date-board has-white-background-color has-background" style="padding-top:20px;padding-right:22px;padding-bottom:20px;padding-left:22px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:13px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Reserve board</p>
<!-- /wp:paragraph -->
<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"12px"}}}} -->
<div class="wp-block-columns">
${urgentBoardCell(first.stat, first.label)}
${urgentBoardCell(second.stat, second.label)}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->
`.trim();
}

function urgentBoardCell(stat, label) {
  return `
<!-- wp:column {"className":"som-date-cell"} -->
<div class="wp-block-column som-date-cell">
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"25px","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"4px"}}}} -->
<p class="has-deep-green-color has-text-color" style="margin-bottom:4px;font-size:25px;font-style:normal;font-weight:900">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"14px","lineHeight":"1.45"}}} -->
<p class="has-soil-color has-text-color" style="font-size:14px;line-height:1.45">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
`.trim();
}

function urgentProof(stat, label) {
  return `
<!-- wp:column {"className":"som-urgent-proof"} -->
<div class="wp-block-column som-urgent-proof">
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"24px","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"4px"}}}} -->
<p class="has-deep-green-color has-text-color" style="margin-bottom:4px;font-size:24px;font-style:normal;font-weight:900">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"15px","lineHeight":"1.4"}}} -->
<p class="has-soil-color has-text-color" style="font-size:15px;line-height:1.4">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
`.trim();
}

function urgentCard(number, title, text) {
  return `
<!-- wp:column {"className":"som-urgent-card"} -->
<div class="wp-block-column som-urgent-card">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"12px"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:12px;font-size:14px;font-style:normal;font-weight:900">0${number}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|card-title","lineHeight":"1.08","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"12px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:12px;font-size:var(--wp--preset--font-size--card-title);font-style:normal;font-weight:900;line-height:1.08">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:17px;line-height:1.5">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
`.trim();
}

function urgentStep(number, title, text) {
  return `
<!-- wp:group {"className":"som-urgent-step","style":{"spacing":{"padding":{"top":"20px","right":"0","bottom":"20px","left":"0"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group som-urgent-step" style="padding-top:20px;padding-right:0;padding-bottom:20px;padding-left:0">
<!-- wp:columns {"verticalAlignment":"top","isStackedOnMobile":false,"style":{"spacing":{"blockGap":{"left":"18px"}}}} -->
<div class="wp-block-columns are-vertically-aligned-top is-not-stacked-on-mobile">
<!-- wp:column {"verticalAlignment":"top","width":"58px"} -->
<div class="wp-block-column is-vertically-aligned-top" style="flex-basis:58px">
<!-- wp:paragraph {"align":"center","className":"som-urgent-step-number","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"900"}}} -->
<p class="has-text-align-center som-urgent-step-number" style="font-size:16px;font-style:normal;font-weight:900">0${number}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"top"} -->
<div class="wp-block-column is-vertically-aligned-top">
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"24px","lineHeight":"1.08","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:8px;font-size:24px;font-style:normal;font-weight:900;line-height:1.08">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:17px;line-height:1.5">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->
`.trim();
}

function urgentDetail(summary, text) {
  return `
<!-- wp:details {"className":"som-urgent-detail"} -->
<details class="wp-block-details som-urgent-detail"><summary>${esc(summary)}</summary>
<!-- wp:paragraph -->
<p>${esc(text)}</p>
<!-- /wp:paragraph -->
</details>
<!-- /wp:details -->
`.trim();
}

function buildZoneGridPlannerPageContent(spec) {
  const { copy, contact } = spec;
  const navLabels = layoutArchetypeFor(spec).navLabels || ["Zones", "Process", "Quote"];
  const services = spec.services;
  const process = spec.process;
  const proof = spec.proof;

  return `
<!-- wp:group {"metadata":{"name":"Zone grid planner page"},"align":"full","className":"som-zone-page","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"0","right":"0","bottom":"0","left":"0"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group alignfull som-zone-page has-cream-background-color has-background" style="padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
<!-- wp:group {"className":"som-zone-header","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"20px","right":"clamp(24px, 5vw, 72px)","bottom":"18px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-zone-header has-cream-background-color has-background" style="padding-top:20px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:18px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"center","isStackedOnMobile":false,"style":{"spacing":{"blockGap":{"left":"24px"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center is-not-stacked-on-mobile">
<!-- wp:column {"verticalAlignment":"center","width":"270px"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:270px">
<!-- wp:site-logo {"width":235,"shouldSyncIcon":false} /-->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center"} -->
<div class="wp-block-column is-vertically-aligned-center">
<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"850"}}} -->
<!-- wp:navigation-link {"label":"${esc(navLabels[0])}","url":"#zones","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"${esc(navLabels[1])}","url":"#process","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"${esc(navLabels[2])}","url":"#quote","kind":"custom","isTopLevelLink":true} /-->
<!-- /wp:navigation -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"180px","className":"som-zone-header-action"} -->
<div class="wp-block-column is-vertically-aligned-center som-zone-header-action" style="flex-basis:180px">
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"right"}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"deep-green","textColor":"white","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"12px","right":"18px","bottom":"12px","left":"18px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-white-color has-deep-green-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:6px;padding-top:12px;padding-right:18px;padding-bottom:12px;padding-left:18px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-zone-hero","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"clamp(34px, 5vw, 70px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(42px, 6vw, 82px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-zone-hero has-deep-green-background-color has-background" style="padding-top:clamp(34px, 5vw, 70px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(42px, 6vw, 82px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"clamp(28px, 5vw, 64px)"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"44%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:44%">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"12px"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:12px;font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"white","style":{"typography":{"fontSize":"var:preset|font-size|hero","lineHeight":"0.98","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"0","bottom":"20px"}}}} -->
<h1 class="wp-block-heading has-white-color has-text-color" style="margin-top:0;margin-bottom:20px;font-size:var(--wp--preset--font-size--hero);font-style:normal;font-weight:900;line-height:0.98">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"mist","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.5"},"spacing":{"margin":{"bottom":"26px"}}}} -->
<p class="has-mist-color has-text-color" style="margin-bottom:26px;font-size:var(--wp--preset--font-size--lead);line-height:1.5">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":{"left":"12px"}}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:6px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"backgroundColor":"cream","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-cream-background-color has-text-color has-background wp-element-button" href="#zones" style="border-radius:6px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
${zoneMap(proof)}
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"56%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:56%">
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"full","linkDestination":"none","className":"som-zone-photo"} -->
<figure class="wp-block-image size-full som-zone-photo"><img src="{{hero_url}}" alt="${esc(spec.assetMeta.hero.alt)}" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-zone-proof-strip","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"28px","right":"clamp(24px, 5vw, 72px)","bottom":"28px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-zone-proof-strip has-mist-background-color has-background" style="padding-top:28px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:28px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"16px"}}}} -->
<div class="wp-block-columns">
${proof.map((item) => zoneProof(item.stat, item.label)).join("\n")}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Zones"},"id":"zones","className":"som-zone-plans","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 92px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 88px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="zones" class="wp-block-group som-zone-plans has-cream-background-color has-background" style="padding-top:clamp(54px, 7vw, 92px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(54px, 7vw, 88px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"bottom","style":{"spacing":{"blockGap":{"left":"clamp(32px, 5vw, 70px)"}}}} -->
<div class="wp-block-columns are-vertically-aligned-bottom">
<!-- wp:column {"verticalAlignment":"bottom","width":"48%"} -->
<div class="wp-block-column is-vertically-aligned-bottom" style="flex-basis:48%">
<!-- wp:heading {"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"bottom"} -->
<div class="wp-block-column is-vertically-aligned-bottom">
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.55"},"spacing":{"margin":{"bottom":"24px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-bottom:24px;font-size:var(--wp--preset--font-size--lead);line-height:1.55">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"20px"}}}} -->
<div class="wp-block-columns">
${services.map((service, index) => zoneCard(index + 1, service.title, service.text)).join("\n")}
</div>
<!-- /wp:columns -->
${zoneNote(copy.introTitle, contact.serviceArea)}
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Process"},"id":"process","className":"som-zone-process","backgroundColor":"white","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 88px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 88px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="process" class="wp-block-group som-zone-process has-white-background-color has-background" style="padding-top:clamp(54px, 7vw, 88px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(54px, 7vw, 88px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"top","style":{"spacing":{"blockGap":{"left":"clamp(34px, 5vw, 74px)"}}}} -->
<div class="wp-block-columns are-vertically-aligned-top">
<!-- wp:column {"verticalAlignment":"top","width":"38%"} -->
<div class="wp-block-column is-vertically-aligned-top" style="flex-basis:38%">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.proofTitle)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1.02","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"10px","bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:10px;margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1.02">${esc(copy.processTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"19px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:19px;line-height:1.55">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"top"} -->
<div class="wp-block-column is-vertically-aligned-top">
${process.map((step, index) => zoneStep(index + 1, step.title, step.text)).join("\n")}
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Quote"},"id":"quote","className":"som-quote-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 84px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 84px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"980px"}} -->
<div id="quote" class="wp-block-group som-quote-strip has-deep-green-background-color has-background" style="padding-top:clamp(54px, 7vw, 84px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(54px, 7vw, 84px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:heading {"textAlign":"center","textColor":"white","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-text-align-center has-white-color has-text-color" style="margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1">${esc(copy.quoteTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"align":"center","textColor":"mist","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.55"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<p class="has-text-align-center has-mist-color has-text-color" style="margin-bottom:28px;font-size:var(--wp--preset--font-size--lead);line-height:1.55">${esc(copy.quoteText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"blockGap":{"left":"12px"}}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:6px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"backgroundColor":"cream","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-cream-background-color has-text-color has-background wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:6px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-footer","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"28px","right":"clamp(24px, 5vw, 72px)","bottom":"34px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-footer has-cream-background-color has-background" style="padding-top:28px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:34px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:paragraph {"align":"center","textColor":"soil"} -->
<p class="has-text-align-center has-soil-color has-text-color">${esc(spec.businessName)} - ${esc(contact.serviceArea)} - <a href="${esc(contact.emailHref)}">${esc(contact.email)}</a></p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->`.trim();
}

function buildWaterTestBoardPageContent(spec) {
  const { copy, contact } = spec;
  const services = spec.services;
  const process = spec.process;
  const proof = spec.proof;

  return `
<!-- wp:group {"metadata":{"name":"Water test board page"},"align":"full","className":"som-water-page","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"0","right":"0","bottom":"0","left":"0"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group alignfull som-water-page has-cream-background-color has-background" style="padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
<!-- wp:group {"className":"som-water-header","backgroundColor":"white","style":{"spacing":{"padding":{"top":"20px","right":"clamp(24px, 5vw, 72px)","bottom":"18px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-water-header has-white-background-color has-background" style="padding-top:20px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:18px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"center","isStackedOnMobile":false,"style":{"spacing":{"blockGap":{"left":"24px"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center is-not-stacked-on-mobile">
<!-- wp:column {"verticalAlignment":"center","width":"270px"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:270px">
<!-- wp:site-logo {"width":235,"shouldSyncIcon":false} /-->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center"} -->
<div class="wp-block-column is-vertically-aligned-center">
<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"800"}}} -->
<!-- wp:navigation-link {"label":"Plans","url":"#plans","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"Water","url":"#water","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"Quote","url":"#quote","kind":"custom","isTopLevelLink":true} /-->
<!-- /wp:navigation -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"190px","className":"som-water-header-action"} -->
<div class="wp-block-column is-vertically-aligned-center som-water-header-action" style="flex-basis:190px">
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"right"}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"deep-green","textColor":"white","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"12px","right":"18px","bottom":"12px","left":"18px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-white-color has-deep-green-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:999px;padding-top:12px;padding-right:18px;padding-bottom:12px;padding-left:18px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:cover {"url":"{{hero_url}}","id":{{hero_id}},"dimRatio":10,"overlayColor":"deep-green","isUserOverlayColor":true,"minHeight":720,"minHeightUnit":"px","align":"full","className":"som-water-hero","style":{"spacing":{"padding":{"top":"clamp(38px, 6vw, 78px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(44px, 7vw, 86px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-cover alignfull som-water-hero" style="padding-top:clamp(38px, 6vw, 78px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(44px, 7vw, 86px);padding-left:clamp(24px, 5vw, 72px);min-height:720px"><span aria-hidden="true" class="wp-block-cover__background has-deep-green-background-color has-background-dim-10 has-background-dim"></span><img class="wp-block-cover__image-background wp-image-{{hero_id}}" alt="" src="{{hero_url}}" data-object-fit="cover" data-object-position="58% 50%"/><div class="wp-block-cover__inner-container">
<!-- wp:columns {"align":"wide","verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"clamp(32px, 5vw, 72px)"}}}} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"52%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:52%">
<!-- wp:group {"className":"som-water-board","backgroundColor":"cream","style":{"border":{"radius":"22px"},"spacing":{"padding":{"top":"34px","right":"34px","bottom":"30px","left":"34px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-water-board has-cream-background-color has-background" style="border-radius:22px;padding-top:34px;padding-right:34px;padding-bottom:30px;padding-left:34px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"10px"}}}} -->
<p class="has-grass-color has-text-color" style="margin-bottom:10px;font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|hero","lineHeight":"0.98","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"0","bottom":"20px"}}}} -->
<h1 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:0;margin-bottom:20px;font-size:var(--wp--preset--font-size--hero);font-style:normal;font-weight:900;line-height:0.98">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.5"},"spacing":{"margin":{"bottom":"26px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-bottom:26px;font-size:var(--wp--preset--font-size--lead);line-height:1.5">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":{"left":"12px"}}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:999px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"backgroundColor":"white","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-white-background-color has-text-color has-background wp-element-button" href="#plans" style="border-radius:999px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
${waterMiniBoard(proof)}
</div>
<!-- /wp:group -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"bottom","width":"48%"} -->
<div class="wp-block-column is-vertically-aligned-bottom" style="flex-basis:48%">
<!-- wp:group {"className":"som-water-note","backgroundColor":"deep-green","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"22px","right":"24px","bottom":"22px","left":"24px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-water-note has-deep-green-background-color has-background" style="border-radius:18px;padding-top:22px;padding-right:24px;padding-bottom:22px;padding-left:24px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:8px;font-size:14px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Route note</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"18px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-white-color has-text-color" style="font-size:18px;font-style:normal;font-weight:800;line-height:1.45">${esc(copy.introTitle)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div></div>
<!-- /wp:cover -->

<!-- wp:group {"metadata":{"name":"Water proof"},"id":"water","className":"som-water-proof-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"30px","right":"clamp(24px, 5vw, 72px)","bottom":"30px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="water" class="wp-block-group som-water-proof-strip has-deep-green-background-color has-background" style="padding-top:30px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:30px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"16px"}}}} -->
<div class="wp-block-columns">
${proof.map((item) => waterProof(item.stat, item.label)).join("\n")}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Plans"},"id":"plans","className":"som-water-plans","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 92px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 88px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="plans" class="wp-block-group som-water-plans has-cream-background-color has-background" style="padding-top:clamp(54px, 7vw, 92px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(54px, 7vw, 88px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"bottom","style":{"spacing":{"blockGap":{"left":"clamp(32px, 5vw, 70px)"}}}} -->
<div class="wp-block-columns are-vertically-aligned-bottom">
<!-- wp:column {"verticalAlignment":"bottom","width":"48%"} -->
<div class="wp-block-column is-vertically-aligned-bottom" style="flex-basis:48%">
<!-- wp:heading {"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"bottom"} -->
<div class="wp-block-column is-vertically-aligned-bottom">
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.55"},"spacing":{"margin":{"bottom":"24px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-bottom:24px;font-size:var(--wp--preset--font-size--lead);line-height:1.55">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"20px"}}}} -->
<div class="wp-block-columns">
${services.map((service, index) => waterPlanCard(index + 1, service.title, service.text)).join("\n")}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Route day"},"id":"process","className":"som-water-route","backgroundColor":"white","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 88px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 88px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="process" class="wp-block-group som-water-route has-white-background-color has-background" style="padding-top:clamp(54px, 7vw, 88px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(54px, 7vw, 88px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"top","style":{"spacing":{"blockGap":{"left":"clamp(34px, 5vw, 74px)"}}}} -->
<div class="wp-block-columns are-vertically-aligned-top">
<!-- wp:column {"verticalAlignment":"top","width":"38%"} -->
<div class="wp-block-column is-vertically-aligned-top" style="flex-basis:38%">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.proofTitle)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1.02","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"10px","bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:10px;margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1.02">${esc(copy.processTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"19px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:19px;line-height:1.55">${esc(contact.serviceArea)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"top"} -->
<div class="wp-block-column is-vertically-aligned-top">
${process.map((step, index) => waterRouteStep(index + 1, step.title, step.text)).join("\n")}
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Quote"},"id":"quote","className":"som-quote-strip","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 84px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 84px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"980px"}} -->
<div id="quote" class="wp-block-group som-quote-strip has-mist-background-color has-background" style="padding-top:clamp(54px, 7vw, 84px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(54px, 7vw, 84px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:heading {"textAlign":"center","textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-text-align-center has-deep-green-color has-text-color" style="margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1">${esc(copy.quoteTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"align":"center","textColor":"soil","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.55"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<p class="has-text-align-center has-soil-color has-text-color" style="margin-bottom:28px;font-size:var(--wp--preset--font-size--lead);line-height:1.55">${esc(copy.quoteText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"blockGap":{"left":"12px"}}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:999px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"backgroundColor":"deep-green","textColor":"white","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-white-color has-deep-green-background-color has-text-color has-background wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:999px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-footer","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"28px","right":"clamp(24px, 5vw, 72px)","bottom":"34px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-footer has-deep-green-background-color has-background" style="padding-top:28px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:34px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:paragraph {"align":"center","textColor":"white"} -->
<p class="has-text-align-center has-white-color has-text-color">${esc(spec.businessName)} - ${esc(contact.serviceArea)} - <a href="${esc(contact.emailHref)}">${esc(contact.email)}</a></p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->`.trim();
}

function buildWorkshopBenchPageContent(spec) {
  const { copy, contact } = spec;
  const navLabels = layoutArchetypeFor(spec).navLabels || ["Wood", "Process", "Quote"];
  const services = spec.services;
  const process = spec.process;
  const proof = spec.proof;

  return `
<!-- wp:group {"metadata":{"name":"Workshop bench page"},"align":"full","className":"som-workshop-page","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"0","right":"0","bottom":"0","left":"0"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group alignfull som-workshop-page has-cream-background-color has-background" style="padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
<!-- wp:group {"className":"som-workshop-header","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"20px","right":"clamp(24px, 5vw, 72px)","bottom":"18px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-workshop-header has-cream-background-color has-background" style="padding-top:20px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:18px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"center","isStackedOnMobile":false,"style":{"spacing":{"blockGap":{"left":"24px"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center is-not-stacked-on-mobile">
<!-- wp:column {"verticalAlignment":"center","width":"270px"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:270px">
<!-- wp:site-logo {"width":235,"shouldSyncIcon":false} /-->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center"} -->
<div class="wp-block-column is-vertically-aligned-center">
<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"850"}}} -->
<!-- wp:navigation-link {"label":"${esc(navLabels[0])}","url":"#wood","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"${esc(navLabels[1])}","url":"#process","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"${esc(navLabels[2])}","url":"#quote","kind":"custom","isTopLevelLink":true} /-->
<!-- /wp:navigation -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"170px","className":"som-workshop-header-action"} -->
<div class="wp-block-column is-vertically-aligned-center som-workshop-header-action" style="flex-basis:170px">
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"right"}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"deep-green","textColor":"white","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"12px","right":"18px","bottom":"12px","left":"18px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-white-color has-deep-green-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:6px;padding-top:12px;padding-right:18px;padding-bottom:12px;padding-left:18px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-workshop-hero","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"clamp(42px, 6vw, 78px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(46px, 7vw, 82px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-workshop-hero has-deep-green-background-color has-background" style="padding-top:clamp(42px, 6vw, 78px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(46px, 7vw, 82px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"clamp(32px, 5vw, 72px)"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"43%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:43%">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-sun-color has-text-color" style="font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"cream","style":{"typography":{"fontSize":"var:preset|font-size|hero","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"12px","bottom":"22px"}}}} -->
<h1 class="wp-block-heading has-cream-color has-text-color" style="margin-top:12px;margin-bottom:22px;font-size:var(--wp--preset--font-size--hero);font-style:normal;font-weight:900;line-height:1">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"mist","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.5"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<p class="has-mist-color has-text-color" style="margin-bottom:28px;font-size:var(--wp--preset--font-size--lead);line-height:1.5">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":{"left":"12px"}}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:6px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"backgroundColor":"cream","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-cream-background-color has-text-color has-background wp-element-button" href="#wood" style="border-radius:6px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"57%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:57%">
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"full","linkDestination":"none","className":"som-workshop-photo"} -->
<figure class="wp-block-image size-full som-workshop-photo"><img src="{{hero_url}}" alt="${esc(spec.assetMeta.hero.alt)}" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
${workshopTicket(proof)}
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-material-proof-rail","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"28px","right":"clamp(24px, 5vw, 72px)","bottom":"28px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-material-proof-rail has-mist-background-color has-background" style="padding-top:28px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:28px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"16px"}}}} -->
<div class="wp-block-columns">
${proof.map((item) => workshopProof(item.stat, item.label)).join("\n")}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Wood scope"},"id":"wood","className":"som-wood-scope","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 92px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 88px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="wood" class="wp-block-group som-wood-scope has-cream-background-color has-background" style="padding-top:clamp(54px, 7vw, 92px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(54px, 7vw, 88px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:heading {"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1.02","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1.02">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.55"},"spacing":{"margin":{"bottom":"32px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-bottom:32px;font-size:var(--wp--preset--font-size--lead);line-height:1.55">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"20px"}}}} -->
<div class="wp-block-columns">
${services.map((service, index) => woodCard(index + 1, service.title, service.text)).join("\n")}
</div>
<!-- /wp:columns -->
${careNote(copy.introTitle, contact.serviceArea)}
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Process"},"id":"process","className":"som-craft-process","backgroundColor":"white","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 88px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 88px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="process" class="wp-block-group som-craft-process has-white-background-color has-background" style="padding-top:clamp(54px, 7vw, 88px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(54px, 7vw, 88px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"top","style":{"spacing":{"blockGap":{"left":"clamp(32px, 5vw, 72px)"}}}} -->
<div class="wp-block-columns are-vertically-aligned-top">
<!-- wp:column {"verticalAlignment":"top","width":"38%"} -->
<div class="wp-block-column is-vertically-aligned-top" style="flex-basis:38%">
<!-- wp:paragraph {"textColor":"leaf","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-leaf-color has-text-color" style="font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.proofTitle)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1.02","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"10px","bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:10px;margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1.02">${esc(copy.processTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"19px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:19px;line-height:1.55">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"top"} -->
<div class="wp-block-column is-vertically-aligned-top">
${process.map((step, index) => craftStep(index + 1, step.title, step.text)).join("\n")}
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Quote"},"id":"quote","className":"som-quote-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 84px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 84px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"980px"}} -->
<div id="quote" class="wp-block-group som-quote-strip has-deep-green-background-color has-background" style="padding-top:clamp(54px, 7vw, 84px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(54px, 7vw, 84px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:heading {"textAlign":"center","textColor":"cream","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-text-align-center has-cream-color has-text-color" style="margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1">${esc(copy.quoteTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"align":"center","textColor":"mist","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.55"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<p class="has-text-align-center has-mist-color has-text-color" style="margin-bottom:28px;font-size:var(--wp--preset--font-size--lead);line-height:1.55">${esc(copy.quoteText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"blockGap":{"left":"12px"}}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:6px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"backgroundColor":"cream","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-cream-background-color has-text-color has-background wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:6px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-footer","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"28px","right":"clamp(24px, 5vw, 72px)","bottom":"34px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-footer has-cream-background-color has-background" style="padding-top:28px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:34px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:paragraph {"align":"center","textColor":"soil"} -->
<p class="has-text-align-center has-soil-color has-text-color">${esc(spec.businessName)} - ${esc(contact.serviceArea)} - <a href="${esc(contact.emailHref)}">${esc(contact.email)}</a></p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->`.trim();
}

function buildFixedBottomActionPageContent(spec) {
  const { copy, contact } = spec;
  const navLabels = layoutArchetypeFor(spec).navLabels || ["Packages", "Process", "Quote"];
  const services = spec.services;
  const process = spec.process;
  const proof = spec.proof;

  return `
<!-- wp:group {"metadata":{"name":"Fixed action page"},"align":"full","className":"som-fixed-page","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"0","right":"0","bottom":"0","left":"0"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group alignfull som-fixed-page has-cream-background-color has-background" style="padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
<!-- wp:group {"className":"som-fixed-header","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"20px","right":"clamp(24px, 5vw, 72px)","bottom":"18px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-fixed-header has-cream-background-color has-background" style="padding-top:20px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:18px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"center","isStackedOnMobile":false,"style":{"spacing":{"blockGap":{"left":"24px"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center is-not-stacked-on-mobile">
<!-- wp:column {"verticalAlignment":"center","width":"270px"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:270px">
<!-- wp:site-logo {"width":235,"shouldSyncIcon":false} /-->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center"} -->
<div class="wp-block-column is-vertically-aligned-center">
<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"800"}}} -->
<!-- wp:navigation-link {"label":"${esc(navLabels[0])}","url":"#packages","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"${esc(navLabels[1])}","url":"#process","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"${esc(navLabels[2])}","url":"#quote","kind":"custom","isTopLevelLink":true} /-->
<!-- /wp:navigation -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"160px","className":"som-fixed-header-action"} -->
<div class="wp-block-column is-vertically-aligned-center som-fixed-header-action" style="flex-basis:160px">
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"right"}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"deep-green","textColor":"white","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"12px","right":"18px","bottom":"12px","left":"18px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-white-color has-deep-green-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:999px;padding-top:12px;padding-right:18px;padding-bottom:12px;padding-left:18px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-fixed-hero","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"clamp(44px, 6vw, 84px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(46px, 7vw, 86px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-fixed-hero has-deep-green-background-color has-background" style="padding-top:clamp(44px, 6vw, 84px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(46px, 7vw, 86px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"clamp(32px, 5vw, 70px)"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"46%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:46%">
<!-- wp:paragraph {"textColor":"leaf","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-leaf-color has-text-color" style="font-size:16px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"white","style":{"typography":{"fontSize":"var:preset|font-size|hero","lineHeight":"0.98","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"12px","bottom":"22px"}}}} -->
<h1 class="wp-block-heading has-white-color has-text-color" style="margin-top:12px;margin-bottom:22px;font-size:var(--wp--preset--font-size--hero);font-style:normal;font-weight:900;line-height:0.98">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"mist","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.5"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<p class="has-mist-color has-text-color" style="margin-bottom:28px;font-size:var(--wp--preset--font-size--lead);line-height:1.5">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":{"left":"12px"}}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:999px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"backgroundColor":"white","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-white-background-color has-text-color has-background wp-element-button" href="#packages" style="border-radius:999px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"54%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:54%">
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"full","linkDestination":"none","className":"som-detail-photo"} -->
<figure class="wp-block-image size-full som-detail-photo"><img src="{{hero_url}}" alt="${esc(spec.assetMeta.hero.alt)}" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
${detailTicket(proof)}
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-detail-proof-strip","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"28px","right":"clamp(24px, 5vw, 72px)","bottom":"28px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-detail-proof-strip has-mist-background-color has-background" style="padding-top:28px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:28px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"16px"}}}} -->
<div class="wp-block-columns">
${proof.map((item) => detailProof(item.stat, item.label)).join("\n")}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Packages"},"id":"packages","className":"som-detail-packages","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 92px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(52px, 7vw, 84px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="packages" class="wp-block-group som-detail-packages has-cream-background-color has-background" style="padding-top:clamp(54px, 7vw, 92px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(52px, 7vw, 84px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:heading {"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.55"},"spacing":{"margin":{"bottom":"32px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-bottom:32px;font-size:var(--wp--preset--font-size--lead);line-height:1.55">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"20px"}}}} -->
<div class="wp-block-columns">
${services.map((service, index) => detailPackageCard(index + 1, service.title, service.text)).join("\n")}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Process"},"id":"process","className":"som-detail-route","backgroundColor":"white","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 88px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 88px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="process" class="wp-block-group som-detail-route has-white-background-color has-background" style="padding-top:clamp(54px, 7vw, 88px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(54px, 7vw, 88px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"top","style":{"spacing":{"blockGap":{"left":"clamp(32px, 5vw, 72px)"}}}} -->
<div class="wp-block-columns are-vertically-aligned-top">
<!-- wp:column {"verticalAlignment":"top","width":"40%"} -->
<div class="wp-block-column is-vertically-aligned-top" style="flex-basis:40%">
<!-- wp:paragraph {"textColor":"leaf","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-leaf-color has-text-color" style="font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.introTitle)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1.02","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"10px","bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:10px;margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1.02">${esc(copy.processTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"19px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:19px;line-height:1.55">${esc(contact.serviceArea)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"top"} -->
<div class="wp-block-column is-vertically-aligned-top">
${process.map((step, index) => detailStep(index + 1, step.title, step.text)).join("\n")}
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Quote"},"id":"quote","className":"som-quote-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 84px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(66px, 8vw, 96px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"980px"}} -->
<div id="quote" class="wp-block-group som-quote-strip has-deep-green-background-color has-background" style="padding-top:clamp(54px, 7vw, 84px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(66px, 8vw, 96px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:heading {"textAlign":"center","textColor":"white","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-text-align-center has-white-color has-text-color" style="margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1">${esc(copy.quoteTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"align":"center","textColor":"mist","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.55"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<p class="has-text-align-center has-mist-color has-text-color" style="margin-bottom:28px;font-size:var(--wp--preset--font-size--lead);line-height:1.55">${esc(copy.quoteText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"blockGap":{"left":"12px"}}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:999px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"backgroundColor":"white","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-white-background-color has-text-color has-background wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:999px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-footer","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"28px","right":"clamp(24px, 5vw, 72px)","bottom":"72px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-footer has-cream-background-color has-background" style="padding-top:28px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:72px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:paragraph {"align":"center","textColor":"soil"} -->
<p class="has-text-align-center has-soil-color has-text-color">${esc(spec.businessName)} - ${esc(contact.serviceArea)} - <a href="${esc(contact.emailHref)}">${esc(contact.email)}</a></p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-mobile-action-bar","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"10px","right":"12px","bottom":"10px","left":"12px"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group som-mobile-action-bar has-deep-green-background-color has-background" style="padding-top:10px;padding-right:12px;padding-bottom:10px;padding-left:12px">
<!-- wp:buttons {"style":{"spacing":{"blockGap":{"left":"8px"}}},"layout":{"type":"flex","justifyContent":"center","flexWrap":"nowrap"}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","width":60,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"12px","right":"16px","bottom":"12px","left":"16px"}}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-60"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:999px;padding-top:12px;padding-right:16px;padding-bottom:12px;padding-left:16px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"backgroundColor":"white","textColor":"deep-green","width":40,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"12px","right":"16px","bottom":"12px","left":"16px"}}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-40"><a class="wp-block-button__link has-deep-green-color has-white-background-color has-text-color has-background wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:999px;padding-top:12px;padding-right:16px;padding-bottom:12px;padding-left:16px">Call to book</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->`.trim();
}

function buildPackageMenuBoardPageContent(spec) {
  const { copy, contact } = spec;
  const services = spec.services;
  const process = spec.process;
  const proof = spec.proof;
  const navLinks = navModelForSpec(spec, ["Packages", "Events", "Date"], ["packages", "events", "quote"]);

  return `
<!-- wp:group {"metadata":{"name":"Menu board page"},"align":"full","className":"som-menu-page","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"0","right":"0","bottom":"0","left":"0"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group alignfull som-menu-page has-cream-background-color has-background" style="padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
<!-- wp:group {"className":"som-menu-header","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"22px","right":"clamp(24px, 5vw, 72px)","bottom":"18px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-menu-header has-cream-background-color has-background" style="padding-top:22px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:18px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"center","isStackedOnMobile":false,"style":{"spacing":{"blockGap":{"left":"24px"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center is-not-stacked-on-mobile">
<!-- wp:column {"verticalAlignment":"center","width":"260px"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:260px">
<!-- wp:site-logo {"width":230,"shouldSyncIcon":false} /-->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center"} -->
<div class="wp-block-column is-vertically-aligned-center">
<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"800"}}} -->
${navigationLinkBlocks(navLinks)}
<!-- /wp:navigation -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"170px","className":"som-menu-header-action"} -->
<div class="wp-block-column is-vertically-aligned-center som-menu-header-action" style="flex-basis:170px">
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"right"}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"deep-green","textColor":"white","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"12px","right":"18px","bottom":"12px","left":"18px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-white-color has-deep-green-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:999px;padding-top:12px;padding-right:18px;padding-bottom:12px;padding-left:18px">Check date</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-menu-hero","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"clamp(42px, 6vw, 84px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(48px, 7vw, 92px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-menu-hero has-deep-green-background-color has-background" style="padding-top:clamp(42px, 6vw, 84px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(48px, 7vw, 92px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"clamp(32px, 5vw, 72px)"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"49%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:49%">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-sun-color has-text-color" style="font-size:16px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"cream","style":{"typography":{"fontSize":"var:preset|font-size|hero","lineHeight":"0.98","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"12px","bottom":"22px"}}}} -->
<h1 class="wp-block-heading has-cream-color has-text-color" style="margin-top:12px;margin-bottom:22px;font-size:var(--wp--preset--font-size--hero);font-style:normal;font-weight:900;line-height:0.98">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"mist","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.5"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<p class="has-mist-color has-text-color" style="margin-bottom:28px;font-size:var(--wp--preset--font-size--lead);line-height:1.5">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":{"left":"12px"}}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:999px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"backgroundColor":"cream","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-cream-background-color has-text-color has-background wp-element-button" href="#packages" style="border-radius:999px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"51%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:51%">
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"full","linkDestination":"none","className":"som-menu-photo"} -->
<figure class="wp-block-image size-full som-menu-photo"><img src="{{hero_url}}" alt="${esc(spec.assetMeta.hero.alt)}" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
${menuTicket(spec)}
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-menu-proof-strip","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"30px","right":"clamp(24px, 5vw, 72px)","bottom":"30px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-menu-proof-strip has-mist-background-color has-background" style="padding-top:30px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:30px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"16px"}}}} -->
<div class="wp-block-columns">
${proof.map((item) => menuProof(item.stat, item.label)).join("\n")}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Packages"},"id":"packages","className":"som-menu-packages","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 92px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 92px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="packages" class="wp-block-group som-menu-packages has-cream-background-color has-background" style="padding-top:clamp(54px, 7vw, 92px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(54px, 7vw, 92px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:heading {"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.5"},"spacing":{"margin":{"bottom":"32px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-bottom:32px;font-size:var(--wp--preset--font-size--lead);line-height:1.5">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"20px"}}}} -->
<div class="wp-block-columns">
${services.map((service, index) => menuPackageCard(index + 1, service.title, service.text)).join("\n")}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Events"},"id":"events","className":"som-menu-event","backgroundColor":"white","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 88px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 88px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="events" class="wp-block-group som-menu-event has-white-background-color has-background" style="padding-top:clamp(54px, 7vw, 88px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(54px, 7vw, 88px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"top","style":{"spacing":{"blockGap":{"left":"clamp(32px, 5vw, 72px)"}}}} -->
<div class="wp-block-columns are-vertically-aligned-top">
<!-- wp:column {"verticalAlignment":"top","width":"40%"} -->
<div class="wp-block-column is-vertically-aligned-top" style="flex-basis:40%">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-sun-color has-text-color" style="font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.introTitle)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1.02","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"10px","bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:10px;margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1.02">${esc(copy.processTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"19px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:19px;line-height:1.55">${esc(contact.serviceArea)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"top"} -->
<div class="wp-block-column is-vertically-aligned-top">
${process.map((step, index) => menuStep(index + 1, step.title, step.text)).join("\n")}
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Quote"},"id":"quote","className":"som-quote-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 84px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 84px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"980px"}} -->
<div id="quote" class="wp-block-group som-quote-strip has-deep-green-background-color has-background" style="padding-top:clamp(54px, 7vw, 84px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(54px, 7vw, 84px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:heading {"textAlign":"center","textColor":"cream","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-text-align-center has-cream-color has-text-color" style="margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1">${esc(copy.quoteTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"align":"center","textColor":"mist","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.55"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<p class="has-text-align-center has-mist-color has-text-color" style="margin-bottom:28px;font-size:var(--wp--preset--font-size--lead);line-height:1.55">${esc(copy.quoteText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"blockGap":{"left":"12px"}}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:999px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"backgroundColor":"cream","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-cream-background-color has-text-color has-background wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:999px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-footer","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"28px","right":"clamp(24px, 5vw, 72px)","bottom":"34px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-footer has-cream-background-color has-background" style="padding-top:28px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:34px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:paragraph {"align":"center","textColor":"soil"} -->
<p class="has-text-align-center has-soil-color has-text-color">${esc(spec.businessName)} - ${esc(contact.serviceArea)} - <a href="${esc(contact.emailHref)}">${esc(contact.email)}</a></p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->`.trim();
}

function buildSideRailServicePageContent(spec) {
  const { copy, contact } = spec;
  const navLinks = navModelForSpec(spec, ["We take", "Sort path", "Quote"], ["take", "sort", "quote"]);
  const servicesAnchor = anchorAt(navLinks, 0, "take");
  const processAnchor = anchorAt(navLinks, 1, "sort");
  const quoteAnchor = anchorAt(navLinks, 2, "quote");
  const services = spec.services.map((item, index) => haulCard(index + 1, item.title, item.text)).join("\n");
  const process = spec.process.map((item, index) => haulStep(index + 1, item.title, item.text)).join("\n");
  const proof = spec.proof.map((item) => haulProof(item.stat, item.label)).join("\n");
  const ticket = haulTicket(spec.proof);

  return `
<!-- wp:group {"metadata":{"name":"Side rail shell"},"align":"full","className":"som-side-rail-shell","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"0","right":"0","bottom":"0","left":"0"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group alignfull som-side-rail-shell has-cream-background-color has-background" style="padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
<!-- wp:group {"className":"som-side-rail","backgroundColor":"white","style":{"spacing":{"padding":{"top":"28px","right":"24px","bottom":"28px","left":"24px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-side-rail has-white-background-color has-background" style="padding-top:28px;padding-right:24px;padding-bottom:28px;padding-left:24px">
<!-- wp:site-logo {"width":230,"shouldSyncIcon":true} /-->
<!-- wp:paragraph {"textColor":"soil","className":"som-rail-note","style":{"typography":{"fontSize":"16px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"700"},"spacing":{"margin":{"top":"24px","bottom":"24px"}}}} -->
<p class="som-rail-note has-soil-color has-text-color" style="margin-top:24px;margin-bottom:24px;font-size:16px;font-style:normal;font-weight:700;line-height:1.45">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
<!-- wp:navigation {"overlayMenu":"mobile","className":"som-rail-nav","layout":{"type":"flex","orientation":"vertical","justifyContent":"left"},"style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"800"}}} -->
${navigationLinkBlocks(navLinks)}
<!-- /wp:navigation -->
<!-- wp:buttons {"className":"som-rail-actions","style":{"spacing":{"blockGap":"10px","margin":{"top":"28px"}}},"layout":{"type":"flex","orientation":"vertical"}} -->
<div class="wp-block-buttons som-rail-actions" style="margin-top:28px">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","width":100,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"13px","bottom":"13px","left":"18px","right":"18px"}},"typography":{"fontStyle":"normal","fontWeight":"850"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100" style="font-style:normal;font-weight:850"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#${esc(quoteAnchor)}" style="border-radius:999px;padding-top:13px;padding-right:18px;padding-bottom:13px;padding-left:18px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"deep-green","width":100,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"13px","bottom":"13px","left":"18px","right":"18px"}},"typography":{"fontStyle":"normal","fontWeight":"850"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100 is-style-outline" style="font-style:normal;font-weight:850"><a class="wp-block-button__link has-deep-green-color has-text-color wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:999px;padding-top:13px;padding-right:18px;padding-bottom:13px;padding-left:18px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-side-main","layout":{"type":"default"}} -->
<div class="wp-block-group som-side-main">
<!-- wp:group {"metadata":{"name":"Haul hero"},"className":"som-haul-hero","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"62px","right":"42px","bottom":"62px","left":"42px"}}},"layout":{"type":"constrained","wideSize":"1120px"}} -->
<div class="wp-block-group som-haul-hero has-deep-green-background-color has-background" style="padding-top:62px;padding-right:42px;padding-bottom:62px;padding-left:42px">
<!-- wp:columns {"align":"wide","verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"42px"}}}} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"45%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:45%">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-sun-color has-text-color" style="font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"white","style":{"typography":{"fontSize":"clamp(44px, 6.6vw, 82px)","lineHeight":"0.96","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"12px","bottom":"22px"}}}} -->
<h1 class="wp-block-heading has-white-color has-text-color" style="margin-top:12px;margin-bottom:22px;font-size:clamp(44px, 6.6vw, 82px);font-style:normal;font-weight:900;line-height:0.96">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"cream","style":{"typography":{"fontSize":"clamp(19px, 1.9vw, 25px)","lineHeight":"1.45"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<p class="has-cream-color has-text-color" style="margin-bottom:28px;font-size:clamp(19px, 1.9vw, 25px);line-height:1.45">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"850"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:850"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#${esc(quoteAnchor)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"white","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"850"}}} -->
<div class="wp-block-button is-style-outline" style="font-style:normal;font-weight:850"><a class="wp-block-button__link has-white-color has-text-color wp-element-button" href="#${esc(servicesAnchor)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
${ticket}
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"55%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:55%">
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"full","linkDestination":"none","className":"som-haul-photo"} -->
<figure class="wp-block-image size-full som-haul-photo"><img src="{{hero_url}}" alt="" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Donation proof"},"className":"som-donation-strip","backgroundColor":"sun","style":{"spacing":{"padding":{"top":"30px","right":"42px","bottom":"30px","left":"42px"}}},"layout":{"type":"constrained","wideSize":"1120px"}} -->
<div class="wp-block-group som-donation-strip has-sun-background-color has-background" style="padding-top:30px;padding-right:42px;padding-bottom:30px;padding-left:42px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"14px"}}}} -->
<div class="wp-block-columns alignwide">
${proof}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Accepted items"},"anchor":"${esc(servicesAnchor)}","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"72px","right":"42px","bottom":"72px","left":"42px"}}},"layout":{"type":"constrained","wideSize":"1120px"}} -->
<div id="${esc(servicesAnchor)}" class="wp-block-group has-cream-background-color has-background" style="padding-top:72px;padding-right:42px;padding-bottom:72px;padding-left:42px">
<!-- wp:columns {"align":"wide","verticalAlignment":"bottom","style":{"spacing":{"blockGap":{"left":"38px"},"margin":{"bottom":"28px"}}}} -->
<div class="wp-block-columns alignwide are-vertically-aligned-bottom" style="margin-bottom:28px">
<!-- wp:column {"verticalAlignment":"bottom","width":"42%"} -->
<div class="wp-block-column is-vertically-aligned-bottom" style="flex-basis:42%">
<!-- wp:heading {"level":2,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(34px, 5vw, 58px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="font-size:clamp(34px, 5vw, 58px);font-style:normal;font-weight:900;line-height:1">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"bottom","width":"58%"} -->
<div class="wp-block-column is-vertically-aligned-bottom" style="flex-basis:58%">
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"19px","lineHeight":"1.5","fontStyle":"normal","fontWeight":"700"}}} -->
<p class="has-soil-color has-text-color" style="font-size:19px;font-style:normal;font-weight:700;line-height:1.5">${esc(contact.serviceArea)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"18px"}}}} -->
<div class="wp-block-columns alignwide">
${services}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Sort path"},"anchor":"${esc(processAnchor)}","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"72px","right":"42px","bottom":"72px","left":"42px"}}},"layout":{"type":"constrained","wideSize":"1120px"}} -->
<div id="${esc(processAnchor)}" class="wp-block-group has-mist-background-color has-background" style="padding-top:72px;padding-right:42px;padding-bottom:72px;padding-left:42px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"34px"}}}} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"34%","className":"som-clearance-zone","backgroundColor":"deep-green","style":{"border":{"radius":"24px"},"spacing":{"padding":{"top":"30px","right":"28px","bottom":"30px","left":"28px"}}}} -->
<div class="wp-block-column som-clearance-zone has-deep-green-background-color has-background" style="border-radius:24px;padding-top:30px;padding-right:28px;padding-bottom:30px;padding-left:28px;flex-basis:34%">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-sun-color has-text-color" style="font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.introTitle)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":2,"textColor":"white","style":{"typography":{"fontSize":"clamp(30px, 4.2vw, 48px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"12px","bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-white-color has-text-color" style="margin-top:12px;margin-bottom:18px;font-size:clamp(30px, 4.2vw, 48px);font-style:normal;font-weight:900;line-height:1">${esc(copy.processTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"cream","style":{"typography":{"fontSize":"18px","lineHeight":"1.5"}}} -->
<p class="has-cream-color has-text-color" style="font-size:18px;line-height:1.5">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"66%"} -->
<div class="wp-block-column" style="flex-basis:66%">
${process}
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Quote"},"anchor":"${esc(quoteAnchor)}","className":"som-quote-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"70px","right":"42px","bottom":"34px","left":"42px"}}},"layout":{"type":"constrained","wideSize":"1120px"}} -->
<div id="${esc(quoteAnchor)}" class="wp-block-group som-quote-strip has-deep-green-background-color has-background" style="padding-top:70px;padding-right:42px;padding-bottom:34px;padding-left:42px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"42px"}}}} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"58%"} -->
<div class="wp-block-column" style="flex-basis:58%">
<!-- wp:heading {"level":2,"textColor":"white","style":{"typography":{"fontSize":"clamp(36px, 6vw, 68px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-white-color has-text-color" style="margin-bottom:18px;font-size:clamp(36px, 6vw, 68px);font-style:normal;font-weight:900;line-height:1">${esc(copy.quoteTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"20px","lineHeight":"1.5"}}} -->
<p class="has-white-color has-text-color" style="font-size:20px;line-height:1.5">${esc(copy.quoteText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"42%"} -->
<div class="wp-block-column" style="flex-basis:42%">
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"left"},"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","width":100,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"850"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100" style="font-style:normal;font-weight:850"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"white","width":100,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"850"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100 is-style-outline" style="font-style:normal;font-weight:850"><a class="wp-block-button__link has-white-color has-text-color wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
<!-- wp:separator {"className":"is-style-wide","backgroundColor":"grass","style":{"spacing":{"margin":{"top":"54px","bottom":"28px"}}}} -->
<hr class="wp-block-separator has-text-color has-grass-color has-alpha-channel-opacity has-grass-background-color has-background is-style-wide" style="margin-top:54px;margin-bottom:28px"/>
<!-- /wp:separator -->
<!-- wp:group {"align":"wide","className":"som-footer","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide som-footer">
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"700"}}} -->
<p class="has-white-color has-text-color" style="font-size:16px;font-style:normal;font-weight:700">${esc(spec.businessName)} - ${esc(spec.tagline)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-sun-color has-text-color" style="font-size:16px;font-style:normal;font-weight:800">${esc(contact.phoneLabel)} / ${esc(contact.email)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->
`.trim();
}

function buildChecklistUrgencyPageContent(spec) {
  const { copy, contact } = spec;
  const services = spec.services.map((item) => checkCard(item.title, item.text)).join("\n");
  const process = spec.process.map((item, index) => processStep(index + 1, item.title, item.text)).join("\n");
  const proof = spec.proof.map((item) => compactProof(item.stat, item.label)).join("\n");
  const navLinks = navModelForSpec(spec, ["Checklist", "Proof", "Quote"], ["checklist", "proof", "quote"]);

  return `
<!-- wp:group {"align":"full","backgroundColor":"white","style":{"spacing":{"padding":{"top":"18px","right":"24px","bottom":"18px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull has-white-background-color has-background" style="padding-top:18px;padding-right:24px;padding-bottom:18px;padding-left:24px">
<!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide">
<!-- wp:site-logo {"width":230,"shouldSyncIcon":true} /-->
<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"700"}}} -->
${navigationLinkBlocks(navLinks)}
<!-- /wp:navigation -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Checklist hero"},"align":"full","className":"som-checklist-hero","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"70px","right":"24px","bottom":"72px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull som-checklist-hero has-cream-background-color has-background" style="padding-top:70px;padding-right:24px;padding-bottom:72px;padding-left:24px">
<!-- wp:columns {"align":"wide","verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"54px"}}}} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"47%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:47%">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:16px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(48px, 7vw, 92px)","lineHeight":"0.94","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"12px","bottom":"22px"}}}} -->
<h1 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:12px;margin-bottom:22px;font-size:clamp(48px, 7vw, 92px);font-style:normal;font-weight:900;line-height:0.94">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"clamp(20px, 2vw, 27px)","lineHeight":"1.45"},"spacing":{"margin":{"bottom":"30px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-bottom:30px;font-size:clamp(20px, 2vw, 27px);line-height:1.45">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button is-style-outline" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-text-color wp-element-button" href="#${esc(anchorAt(navLinks, 0, "checklist"))}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"53%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:53%">
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"full","linkDestination":"none","className":"som-hero-photo"} -->
<figure class="wp-block-image size-full som-hero-photo"><img src="{{hero_url}}" alt="" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Proof"},"anchor":"proof","align":"full","className":"som-urgency-band","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"44px","right":"24px","bottom":"44px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="proof" class="wp-block-group alignfull som-urgency-band has-deep-green-background-color has-background" style="padding-top:44px;padding-right:24px;padding-bottom:44px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"14px"}}}} -->
<div class="wp-block-columns alignwide">
${proof}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Checklist"},"anchor":"checklist","align":"full","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"78px","right":"24px","bottom":"78px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="checklist" class="wp-block-group alignfull has-cream-background-color has-background" style="padding-top:78px;padding-right:24px;padding-bottom:78px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"50px"}}}} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"36%"} -->
<div class="wp-block-column" style="flex-basis:36%">
<!-- wp:heading {"level":2,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(36px, 5.6vw, 64px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:18px;font-size:clamp(36px, 5.6vw, 64px);font-style:normal;font-weight:900;line-height:1">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"20px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:20px;line-height:1.5">${esc(contact.serviceArea)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"64%"} -->
<div class="wp-block-column" style="flex-basis:64%">
${services}
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Process"},"anchor":"process","align":"full","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"78px","right":"24px","bottom":"78px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="process" class="wp-block-group alignfull has-mist-background-color has-background" style="padding-top:78px;padding-right:24px;padding-bottom:78px;padding-left:24px">
<!-- wp:heading {"level":2,"align":"wide","textColor":"deep-green","style":{"typography":{"fontSize":"clamp(34px, 5vw, 58px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"34px"}}}} -->
<h2 class="wp-block-heading alignwide has-deep-green-color has-text-color" style="margin-bottom:34px;font-size:clamp(34px, 5vw, 58px);font-style:normal;font-weight:900;line-height:1">${esc(copy.processTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"24px"}}}} -->
<div class="wp-block-columns alignwide">
${process}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Quote"},"anchor":"quote","align":"full","className":"som-quote-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"70px","right":"24px","bottom":"34px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="quote" class="wp-block-group alignfull som-quote-strip has-deep-green-background-color has-background" style="padding-top:70px;padding-right:24px;padding-bottom:34px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"42px"}}}} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"58%"} -->
<div class="wp-block-column" style="flex-basis:58%">
<!-- wp:heading {"level":2,"textColor":"white","style":{"typography":{"fontSize":"clamp(36px, 6vw, 68px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-white-color has-text-color" style="margin-bottom:18px;font-size:clamp(36px, 6vw, 68px);font-style:normal;font-weight:900;line-height:1">${esc(copy.quoteTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"20px","lineHeight":"1.5"}}} -->
<p class="has-white-color has-text-color" style="font-size:20px;line-height:1.5">${esc(copy.quoteText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"42%"} -->
<div class="wp-block-column" style="flex-basis:42%">
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"left"},"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","width":100,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">Email for a quote</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"white","width":100,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100 is-style-outline" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-white-color has-text-color wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
<!-- wp:separator {"className":"is-style-wide","backgroundColor":"grass","style":{"spacing":{"margin":{"top":"54px","bottom":"28px"}}}} -->
<hr class="wp-block-separator has-text-color has-grass-color has-alpha-channel-opacity has-grass-background-color has-background is-style-wide" style="margin-top:54px;margin-bottom:28px"/>
<!-- /wp:separator -->
<!-- wp:group {"align":"wide","className":"som-footer","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide som-footer">
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"700"}}} -->
<p class="has-white-color has-text-color" style="font-size:16px;font-style:normal;font-weight:700">${esc(spec.businessName)} - ${esc(spec.tagline)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-sun-color has-text-color" style="font-size:16px;font-style:normal;font-weight:800">${esc(contact.phoneLabel)} / ${esc(contact.email)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->
`.trim();
}

function buildSurfaceSeasonalPageContent(spec) {
  const { copy, contact } = spec;
  const services = spec.services.map((item, index) => sealCard(index + 1, item.title, item.text)).join("\n");
  const process = spec.process.map((item, index) => processStep(index + 1, item.title, item.text)).join("\n");
  const proof = spec.proof.map((item) => surfaceBadge(item.stat, item.label)).join("\n");

  return `
<!-- wp:group {"align":"full","backgroundColor":"white","style":{"spacing":{"padding":{"top":"18px","right":"24px","bottom":"18px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull has-white-background-color has-background" style="padding-top:18px;padding-right:24px;padding-bottom:18px;padding-left:24px">
<!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide">
<!-- wp:site-logo {"width":230,"shouldSyncIcon":true} /-->
<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"700"}}} -->
<!-- wp:navigation-link {"label":"Timing","url":"#timing","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"Prep","url":"#prep","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"Quote","url":"#quote","kind":"custom","isTopLevelLink":true} /-->
<!-- /wp:navigation -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Surface hero"},"align":"full","className":"som-surface-hero","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"58px","right":"24px","bottom":"58px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull som-surface-hero has-deep-green-background-color has-background" style="padding-top:58px;padding-right:24px;padding-bottom:58px;padding-left:24px">
<!-- wp:columns {"align":"wide","verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"42px"}}}} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"44%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:44%">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-sun-color has-text-color" style="font-size:16px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"white","style":{"typography":{"fontSize":"clamp(48px, 6.8vw, 88px)","lineHeight":"0.94","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"12px","bottom":"22px"}}}} -->
<h1 class="wp-block-heading has-white-color has-text-color" style="margin-top:12px;margin-bottom:22px;font-size:clamp(48px, 6.8vw, 88px);font-style:normal;font-weight:900;line-height:0.94">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"cream","style":{"typography":{"fontSize":"clamp(20px, 2vw, 26px)","lineHeight":"1.45"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<p class="has-cream-color has-text-color" style="margin-bottom:28px;font-size:clamp(20px, 2vw, 26px);line-height:1.45">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"white","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button is-style-outline" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-white-color has-text-color wp-element-button" href="#timing" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"56%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:56%">
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"full","linkDestination":"none","className":"som-surface-photo"} -->
<figure class="wp-block-image size-full som-surface-photo"><img src="{{hero_url}}" alt="" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Timing"},"anchor":"timing","align":"full","className":"som-surface-band","backgroundColor":"sun","style":{"spacing":{"padding":{"top":"38px","right":"24px","bottom":"38px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="timing" class="wp-block-group alignfull som-surface-band has-sun-background-color has-background" style="padding-top:38px;padding-right:24px;padding-bottom:38px;padding-left:24px">
<!-- wp:columns {"align":"wide","verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"18px"}}}} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"28%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:28%">
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"18px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-deep-green-color has-text-color" style="font-size:18px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.proofTitle)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"72%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:72%">
<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"14px"}}}} -->
<div class="wp-block-columns">
${proof}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Prep"},"anchor":"prep","align":"full","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"78px","right":"24px","bottom":"78px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="prep" class="wp-block-group alignfull has-cream-background-color has-background" style="padding-top:78px;padding-right:24px;padding-bottom:78px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"34px"}}}} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"32%","className":"som-season-note","backgroundColor":"deep-green","style":{"border":{"radius":"24px"},"spacing":{"padding":{"top":"34px","right":"30px","bottom":"34px","left":"30px"}}}} -->
<div class="wp-block-column som-season-note has-deep-green-background-color has-background" style="border-radius:24px;padding-top:34px;padding-right:30px;padding-bottom:34px;padding-left:30px;flex-basis:32%">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-sun-color has-text-color" style="font-size:16px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.introTitle)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":2,"textColor":"white","style":{"typography":{"fontSize":"clamp(32px, 4.4vw, 52px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"12px","bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-white-color has-text-color" style="margin-top:12px;margin-bottom:18px;font-size:clamp(32px, 4.4vw, 52px);font-style:normal;font-weight:900;line-height:1">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"cream","style":{"typography":{"fontSize":"19px","lineHeight":"1.5"}}} -->
<p class="has-cream-color has-text-color" style="font-size:19px;line-height:1.5">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"68%"} -->
<div class="wp-block-column" style="flex-basis:68%">
<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"18px"}}}} -->
<div class="wp-block-columns">
${services}
</div>
<!-- /wp:columns -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"18px","lineHeight":"1.5","fontStyle":"normal","fontWeight":"700"},"spacing":{"margin":{"top":"20px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-top:20px;font-size:18px;font-style:normal;font-weight:700;line-height:1.5">${esc(contact.serviceArea)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Process"},"align":"full","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"78px","right":"24px","bottom":"78px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull has-mist-background-color has-background" style="padding-top:78px;padding-right:24px;padding-bottom:78px;padding-left:24px">
<!-- wp:heading {"level":2,"align":"wide","textColor":"deep-green","style":{"typography":{"fontSize":"clamp(34px, 5vw, 58px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"34px"}}}} -->
<h2 class="wp-block-heading alignwide has-deep-green-color has-text-color" style="margin-bottom:34px;font-size:clamp(34px, 5vw, 58px);font-style:normal;font-weight:900;line-height:1">${esc(copy.processTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"24px"}}}} -->
<div class="wp-block-columns alignwide">
${process}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Quote"},"anchor":"quote","align":"full","className":"som-quote-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"70px","right":"24px","bottom":"34px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="quote" class="wp-block-group alignfull som-quote-strip has-deep-green-background-color has-background" style="padding-top:70px;padding-right:24px;padding-bottom:34px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"42px"}}}} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"58%"} -->
<div class="wp-block-column" style="flex-basis:58%">
<!-- wp:heading {"level":2,"textColor":"white","style":{"typography":{"fontSize":"clamp(36px, 6vw, 68px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-white-color has-text-color" style="margin-bottom:18px;font-size:clamp(36px, 6vw, 68px);font-style:normal;font-weight:900;line-height:1">${esc(copy.quoteTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"20px","lineHeight":"1.5"}}} -->
<p class="has-white-color has-text-color" style="font-size:20px;line-height:1.5">${esc(copy.quoteText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"42%"} -->
<div class="wp-block-column" style="flex-basis:42%">
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"left"},"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","width":100,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">Email driveway photos</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"white","width":100,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100 is-style-outline" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-white-color has-text-color wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
<!-- wp:separator {"className":"is-style-wide","backgroundColor":"grass","style":{"spacing":{"margin":{"top":"54px","bottom":"28px"}}}} -->
<hr class="wp-block-separator has-text-color has-grass-color has-alpha-channel-opacity has-grass-background-color has-background is-style-wide" style="margin-top:54px;margin-bottom:28px"/>
<!-- /wp:separator -->
<!-- wp:group {"align":"wide","className":"som-footer","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide som-footer">
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"700"}}} -->
<p class="has-white-color has-text-color" style="font-size:16px;font-style:normal;font-weight:700">${esc(spec.businessName)} - ${esc(spec.tagline)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-sun-color has-text-color" style="font-size:16px;font-style:normal;font-weight:800">${esc(contact.phoneLabel)} / ${esc(contact.email)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->
`.trim();
}

function buildStainCarePageContent(spec) {
  const { copy, contact } = spec;
  const services = spec.services.map((item, index) => stainCard(index + 1, item.title, item.text)).join("\n");
  const process = spec.process.map((item, index) => processStep(index + 1, item.title, item.text)).join("\n");
  const proof = spec.proof.map((item) => fabricProof(item.stat, item.label)).join("\n");

  return `
<!-- wp:group {"align":"full","backgroundColor":"white","style":{"spacing":{"padding":{"top":"18px","right":"24px","bottom":"18px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull has-white-background-color has-background" style="padding-top:18px;padding-right:24px;padding-bottom:18px;padding-left:24px">
<!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide">
<!-- wp:site-logo {"width":240,"shouldSyncIcon":true} /-->
<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"700"}}} -->
<!-- wp:navigation-link {"label":"Stains","url":"#stains","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"Drying","url":"#drying","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"Quote","url":"#quote","kind":"custom","isTopLevelLink":true} /-->
<!-- /wp:navigation -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Fabric hero"},"align":"full","className":"som-fabric-hero","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"56px","right":"24px","bottom":"60px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull som-fabric-hero has-cream-background-color has-background" style="padding-top:56px;padding-right:24px;padding-bottom:60px;padding-left:24px">
<!-- wp:columns {"align":"wide","verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"48px"}}}} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"46%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:46%">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:16px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(44px, 6.4vw, 78px)","lineHeight":"0.96","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"12px","bottom":"22px"}}}} -->
<h1 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:12px;margin-bottom:22px;font-size:clamp(44px, 6.4vw, 78px);font-style:normal;font-weight:900;line-height:0.96">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"clamp(20px, 2vw, 26px)","lineHeight":"1.45"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-bottom:28px;font-size:clamp(20px, 2vw, 26px);line-height:1.45">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button is-style-outline" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-text-color wp-element-button" href="#stains" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"54%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:54%">
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"full","linkDestination":"none","className":"som-fabric-photo"} -->
<figure class="wp-block-image size-full som-fabric-photo"><img src="{{hero_url}}" alt="" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
<!-- wp:group {"align":"wide","className":"som-care-note","backgroundColor":"white","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"22px","right":"24px","bottom":"22px","left":"24px"},"margin":{"top":"30px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignwide som-care-note has-white-background-color has-background" style="border-radius:18px;margin-top:30px;padding-top:22px;padding-right:24px;padding-bottom:22px;padding-left:24px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<p class="has-grass-color has-text-color" style="margin-bottom:8px;font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.introTitle)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"18px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"700"}}} -->
<p class="has-soil-color has-text-color" style="font-size:18px;font-style:normal;font-weight:700;line-height:1.45">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Fabric proof"},"align":"full","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"42px","right":"24px","bottom":"42px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull has-deep-green-background-color has-background" style="padding-top:42px;padding-right:24px;padding-bottom:42px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"14px"}}}} -->
<div class="wp-block-columns alignwide">
${proof}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Stains"},"anchor":"stains","align":"full","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"78px","right":"24px","bottom":"78px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="stains" class="wp-block-group alignfull has-cream-background-color has-background" style="padding-top:78px;padding-right:24px;padding-bottom:78px;padding-left:24px">
<!-- wp:heading {"level":2,"align":"wide","textColor":"deep-green","style":{"typography":{"fontSize":"clamp(36px, 5.6vw, 64px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading alignwide has-deep-green-color has-text-color" style="margin-bottom:18px;font-size:clamp(36px, 5.6vw, 64px);font-style:normal;font-weight:900;line-height:1">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"align":"wide","textColor":"soil","style":{"typography":{"fontSize":"20px","lineHeight":"1.5"},"spacing":{"margin":{"bottom":"34px"}}}} -->
<p class="alignwide has-soil-color has-text-color" style="margin-bottom:34px;font-size:20px;line-height:1.5">${esc(contact.serviceArea)}</p>
<!-- /wp:paragraph -->
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"22px"}}}} -->
<div class="wp-block-columns alignwide">
${services}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Drying"},"anchor":"drying","align":"full","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"78px","right":"24px","bottom":"78px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="drying" class="wp-block-group alignfull has-mist-background-color has-background" style="padding-top:78px;padding-right:24px;padding-bottom:78px;padding-left:24px">
<!-- wp:heading {"level":2,"align":"wide","textColor":"deep-green","style":{"typography":{"fontSize":"clamp(34px, 5vw, 58px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"34px"}}}} -->
<h2 class="wp-block-heading alignwide has-deep-green-color has-text-color" style="margin-bottom:34px;font-size:clamp(34px, 5vw, 58px);font-style:normal;font-weight:900;line-height:1">${esc(copy.processTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"24px"}}}} -->
<div class="wp-block-columns alignwide">
${process}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Quote"},"anchor":"quote","align":"full","className":"som-quote-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"70px","right":"24px","bottom":"34px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="quote" class="wp-block-group alignfull som-quote-strip has-deep-green-background-color has-background" style="padding-top:70px;padding-right:24px;padding-bottom:34px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"42px"}}}} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"58%"} -->
<div class="wp-block-column" style="flex-basis:58%">
<!-- wp:heading {"level":2,"textColor":"white","style":{"typography":{"fontSize":"clamp(36px, 6vw, 68px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-white-color has-text-color" style="margin-bottom:18px;font-size:clamp(36px, 6vw, 68px);font-style:normal;font-weight:900;line-height:1">${esc(copy.quoteTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"20px","lineHeight":"1.5"}}} -->
<p class="has-white-color has-text-color" style="font-size:20px;line-height:1.5">${esc(copy.quoteText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"42%"} -->
<div class="wp-block-column" style="flex-basis:42%">
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"left"},"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","width":100,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">Email fabric photos</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"white","width":100,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100 is-style-outline" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-white-color has-text-color wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
<!-- wp:separator {"className":"is-style-wide","backgroundColor":"leaf","style":{"spacing":{"margin":{"top":"54px","bottom":"28px"}}}} -->
<hr class="wp-block-separator has-text-color has-leaf-color has-alpha-channel-opacity has-leaf-background-color has-background is-style-wide" style="margin-top:54px;margin-bottom:28px"/>
<!-- /wp:separator -->
<!-- wp:group {"align":"wide","className":"som-footer","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide som-footer">
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"700"}}} -->
<p class="has-white-color has-text-color" style="font-size:16px;font-style:normal;font-weight:700">${esc(spec.businessName)} - ${esc(spec.tagline)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-sun-color has-text-color" style="font-size:16px;font-style:normal;font-weight:800">${esc(contact.phoneLabel)} / ${esc(contact.email)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->
`.trim();
}

function buildGalleryLedPageContent(spec) {
  const { copy, contact } = spec;
  const styles = spec.services.map((item, index) => galleryStyleCard(index + 1, item.title, item.text)).join("\n");
  const process = spec.process.map((item, index) => processStep(index + 1, item.title, item.text)).join("\n");
  const proof = spec.proof.map((item) => galleryProof(item.stat, item.label)).join("\n");
  const navLinks = navModelForSpec(spec, ["Styles", "Process", "Quote"], ["styles", "process", "quote"]);

  return `
<!-- wp:group {"align":"full","backgroundColor":"white","style":{"spacing":{"padding":{"top":"18px","right":"24px","bottom":"18px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull has-white-background-color has-background" style="padding-top:18px;padding-right:24px;padding-bottom:18px;padding-left:24px">
<!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide">
<!-- wp:site-logo {"width":230,"shouldSyncIcon":true} /-->
<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"700"}}} -->
${navigationLinkBlocks(navLinks)}
<!-- /wp:navigation -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Gallery hero"},"align":"full","className":"som-gallery-hero","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"42px","right":"24px","bottom":"58px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull som-gallery-hero has-cream-background-color has-background" style="padding-top:42px;padding-right:24px;padding-bottom:58px;padding-left:24px">
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"full","linkDestination":"none","align":"wide","className":"som-gallery-image"} -->
<figure class="wp-block-image alignwide size-full som-gallery-image"><img src="{{hero_url}}" alt="" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
<!-- wp:columns {"align":"wide","className":"som-gallery-copy-row","verticalAlignment":"bottom","style":{"spacing":{"blockGap":{"left":"24px"}}}} -->
<div class="wp-block-columns alignwide are-vertically-aligned-bottom som-gallery-copy-row">
<!-- wp:column {"verticalAlignment":"bottom","width":"66%","className":"som-gallery-copy","backgroundColor":"white","style":{"border":{"radius":"24px"},"spacing":{"padding":{"top":"30px","right":"34px","bottom":"30px","left":"34px"}}}} -->
<div class="wp-block-column is-vertically-aligned-bottom som-gallery-copy has-white-background-color has-background" style="border-radius:24px;padding-top:30px;padding-right:34px;padding-bottom:30px;padding-left:34px;flex-basis:66%">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:16px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(42px, 6vw, 78px)","lineHeight":"0.96","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"10px","bottom":"18px"}}}} -->
<h1 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:10px;margin-bottom:18px;font-size:clamp(42px, 6vw, 78px);font-style:normal;font-weight:900;line-height:0.96">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"clamp(19px, 1.8vw, 24px)","lineHeight":"1.42"},"spacing":{"margin":{"bottom":"22px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-bottom:22px;font-size:clamp(19px, 1.8vw, 24px);line-height:1.42">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button is-style-outline" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-text-color wp-element-button" href="#${esc(anchorAt(navLinks, 0, "styles"))}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"bottom","width":"34%","className":"som-gallery-note","backgroundColor":"deep-green","style":{"border":{"radius":"24px"},"spacing":{"padding":{"top":"30px","right":"28px","bottom":"30px","left":"28px"}}}} -->
<div class="wp-block-column is-vertically-aligned-bottom som-gallery-note has-deep-green-background-color has-background" style="border-radius:24px;padding-top:30px;padding-right:28px;padding-bottom:30px;padding-left:28px;flex-basis:34%">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-sun-color has-text-color" style="font-size:16px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.introTitle)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"19px","lineHeight":"1.45"}}} -->
<p class="has-white-color has-text-color" style="font-size:19px;line-height:1.45">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Style proof"},"align":"full","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"40px","right":"24px","bottom":"40px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull has-deep-green-background-color has-background" style="padding-top:40px;padding-right:24px;padding-bottom:40px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"14px"}}}} -->
<div class="wp-block-columns alignwide">
${proof}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Styles"},"anchor":"styles","align":"full","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"78px","right":"24px","bottom":"78px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="styles" class="wp-block-group alignfull has-cream-background-color has-background" style="padding-top:78px;padding-right:24px;padding-bottom:78px;padding-left:24px">
<!-- wp:heading {"level":2,"align":"wide","textColor":"deep-green","style":{"typography":{"fontSize":"clamp(36px, 5.6vw, 64px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"30px"}}}} -->
<h2 class="wp-block-heading alignwide has-deep-green-color has-text-color" style="margin-bottom:30px;font-size:clamp(36px, 5.6vw, 64px);font-style:normal;font-weight:900;line-height:1">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"22px"}}}} -->
<div class="wp-block-columns alignwide">
${styles}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Process"},"anchor":"process","align":"full","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"78px","right":"24px","bottom":"78px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="process" class="wp-block-group alignfull has-mist-background-color has-background" style="padding-top:78px;padding-right:24px;padding-bottom:78px;padding-left:24px">
<!-- wp:heading {"level":2,"align":"wide","textColor":"deep-green","style":{"typography":{"fontSize":"clamp(34px, 5vw, 58px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"34px"}}}} -->
<h2 class="wp-block-heading alignwide has-deep-green-color has-text-color" style="margin-bottom:34px;font-size:clamp(34px, 5vw, 58px);font-style:normal;font-weight:900;line-height:1">${esc(copy.processTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"24px"}}}} -->
<div class="wp-block-columns alignwide">
${process}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Quote"},"anchor":"quote","align":"full","className":"som-quote-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"70px","right":"24px","bottom":"34px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="quote" class="wp-block-group alignfull som-quote-strip has-deep-green-background-color has-background" style="padding-top:70px;padding-right:24px;padding-bottom:34px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"42px"}}}} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"58%"} -->
<div class="wp-block-column" style="flex-basis:58%">
<!-- wp:heading {"level":2,"textColor":"white","style":{"typography":{"fontSize":"clamp(36px, 6vw, 68px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-white-color has-text-color" style="margin-bottom:18px;font-size:clamp(36px, 6vw, 68px);font-style:normal;font-weight:900;line-height:1">${esc(copy.quoteTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"20px","lineHeight":"1.5"}}} -->
<p class="has-white-color has-text-color" style="font-size:20px;line-height:1.5">${esc(copy.quoteText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"42%"} -->
<div class="wp-block-column" style="flex-basis:42%">
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"left"},"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","width":100,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">Email a style brief</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"white","width":100,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100 is-style-outline" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-white-color has-text-color wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
<!-- wp:separator {"className":"is-style-wide","backgroundColor":"grass","style":{"spacing":{"margin":{"top":"54px","bottom":"28px"}}}} -->
<hr class="wp-block-separator has-text-color has-grass-color has-alpha-channel-opacity has-grass-background-color has-background is-style-wide" style="margin-top:54px;margin-bottom:28px"/>
<!-- /wp:separator -->
<!-- wp:group {"align":"wide","className":"som-footer","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide som-footer">
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"700"}}} -->
<p class="has-white-color has-text-color" style="font-size:16px;font-style:normal;font-weight:700">${esc(spec.businessName)} - ${esc(spec.tagline)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-sun-color has-text-color" style="font-size:16px;font-style:normal;font-weight:800">${esc(contact.phoneLabel)} / ${esc(contact.email)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->
`.trim();
}

function buildRiskPreventionPageContent(spec) {
  const { copy, contact } = spec;
  const warnings = spec.services.map((item, index) => warningRow(index + 1, item.title, item.text)).join("\n");
  const plan = spec.process.map((item, index) => riskPlanStep(index + 1, item.title, item.text)).join("\n");
  const proof = spec.proof.map((item) => compactProof(item.stat, item.label)).join("\n");

  return `
<!-- wp:group {"align":"full","backgroundColor":"white","style":{"spacing":{"padding":{"top":"18px","right":"24px","bottom":"18px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull has-white-background-color has-background" style="padding-top:18px;padding-right:24px;padding-bottom:18px;padding-left:24px">
<!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide">
<!-- wp:site-logo {"width":230,"shouldSyncIcon":true} /-->
<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"700"}}} -->
<!-- wp:navigation-link {"label":"Warning signs","url":"#signs","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"Plan","url":"#plan","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"Quote","url":"#quote","kind":"custom","isTopLevelLink":true} /-->
<!-- /wp:navigation -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Risk hero"},"align":"full","className":"som-risk-hero","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"64px","right":"24px","bottom":"72px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull som-risk-hero has-cream-background-color has-background" style="padding-top:64px;padding-right:24px;padding-bottom:72px;padding-left:24px">
<!-- wp:columns {"align":"wide","verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"52px"}}}} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"54%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:54%">
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"full","linkDestination":"none","className":"som-hero-photo"} -->
<figure class="wp-block-image size-full som-hero-photo"><img src="{{hero_url}}" alt="" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"46%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:46%">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:16px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(46px, 6.8vw, 86px)","lineHeight":"0.94","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"12px","bottom":"22px"}}}} -->
<h1 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:12px;margin-bottom:22px;font-size:clamp(46px, 6.8vw, 86px);font-style:normal;font-weight:900;line-height:0.94">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"clamp(20px, 2vw, 26px)","lineHeight":"1.45"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-bottom:28px;font-size:clamp(20px, 2vw, 26px);line-height:1.45">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button is-style-outline" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-text-color wp-element-button" href="#signs" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
<!-- wp:group {"className":"som-risk-panel","backgroundColor":"white","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"22px","right":"24px","bottom":"22px","left":"24px"},"margin":{"top":"28px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-risk-panel has-white-background-color has-background" style="border-radius:18px;margin-top:28px;padding-top:22px;padding-right:24px;padding-bottom:22px;padding-left:24px">
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<p class="has-deep-green-color has-text-color" style="margin-bottom:8px;font-size:16px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Service area</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"18px","lineHeight":"1.45"}}} -->
<p class="has-soil-color has-text-color" style="font-size:18px;line-height:1.45">${esc(contact.serviceArea)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Risk proof band"},"align":"full","className":"som-risk-band","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"40px","right":"24px","bottom":"40px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull som-risk-band has-deep-green-background-color has-background" style="padding-top:40px;padding-right:24px;padding-bottom:40px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"14px"}}}} -->
<div class="wp-block-columns alignwide">
${proof}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Warning signs"},"anchor":"signs","align":"full","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"78px","right":"24px","bottom":"78px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="signs" class="wp-block-group alignfull has-cream-background-color has-background" style="padding-top:78px;padding-right:24px;padding-bottom:78px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"48px"}}}} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"36%"} -->
<div class="wp-block-column" style="flex-basis:36%">
<!-- wp:heading {"level":2,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(36px, 5.6vw, 64px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:18px;font-size:clamp(36px, 5.6vw, 64px);font-style:normal;font-weight:900;line-height:1">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"20px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:20px;line-height:1.55">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"64%"} -->
<div class="wp-block-column" style="flex-basis:64%">
${warnings}
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Prevention plan"},"anchor":"plan","align":"full","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"78px","right":"24px","bottom":"78px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="plan" class="wp-block-group alignfull has-mist-background-color has-background" style="padding-top:78px;padding-right:24px;padding-bottom:78px;padding-left:24px">
<!-- wp:heading {"level":2,"align":"wide","textColor":"deep-green","style":{"typography":{"fontSize":"clamp(34px, 5vw, 58px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"34px"}}}} -->
<h2 class="wp-block-heading alignwide has-deep-green-color has-text-color" style="margin-bottom:34px;font-size:clamp(34px, 5vw, 58px);font-style:normal;font-weight:900;line-height:1">${esc(copy.processTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"24px"}}}} -->
<div class="wp-block-columns alignwide">
${plan}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Quote"},"anchor":"quote","align":"full","className":"som-quote-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"70px","right":"24px","bottom":"34px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="quote" class="wp-block-group alignfull som-quote-strip has-deep-green-background-color has-background" style="padding-top:70px;padding-right:24px;padding-bottom:34px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"42px"}}}} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"58%"} -->
<div class="wp-block-column" style="flex-basis:58%">
<!-- wp:heading {"level":2,"textColor":"white","style":{"typography":{"fontSize":"clamp(36px, 6vw, 68px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-white-color has-text-color" style="margin-bottom:18px;font-size:clamp(36px, 6vw, 68px);font-style:normal;font-weight:900;line-height:1">${esc(copy.quoteTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"20px","lineHeight":"1.5"}}} -->
<p class="has-white-color has-text-color" style="font-size:20px;line-height:1.5">${esc(copy.quoteText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"42%"} -->
<div class="wp-block-column" style="flex-basis:42%">
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"left"},"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","width":100,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"white","width":100,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100 is-style-outline" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-white-color has-text-color wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">Send gutter photos</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
<!-- wp:separator {"className":"is-style-wide","backgroundColor":"grass","style":{"spacing":{"margin":{"top":"54px","bottom":"28px"}}}} -->
<hr class="wp-block-separator has-text-color has-grass-color has-alpha-channel-opacity has-grass-background-color has-background is-style-wide" style="margin-top:54px;margin-bottom:28px"/>
<!-- /wp:separator -->
<!-- wp:group {"align":"wide","className":"som-footer","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide som-footer">
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"700"}}} -->
<p class="has-white-color has-text-color" style="font-size:16px;font-style:normal;font-weight:700">${esc(spec.businessName)} - ${esc(spec.tagline)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-sun-color has-text-color" style="font-size:16px;font-style:normal;font-weight:800">${esc(contact.phoneLabel)} / ${esc(contact.email)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->
`.trim();
}

function buildRoutePlanPageContent(spec) {

  const { copy, contact } = spec;
  const navLabels = layoutArchetypeFor(spec).navLabels || ["Services", "How it works", "Quote"];
  const services = spec.services.map((item) => card(item.title, item.text)).join("\n");
  const process = spec.process.map((item, index) => processStep(index + 1, item.title, item.text)).join("\n");
  const proof = spec.proof.map((item) => proofStat(item.stat, item.label)).join("\n");

  return `
<!-- wp:group {"align":"full","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"18px","right":"24px","bottom":"18px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull has-cream-background-color has-background" style="padding-top:18px;padding-right:24px;padding-bottom:18px;padding-left:24px">
<!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide">
<!-- wp:site-logo {"width":230,"shouldSyncIcon":true} /-->
<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"700"}}} -->
<!-- wp:navigation-link {"label":"${esc(navLabels[0])}","url":"#services","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"${esc(navLabels[1])}","url":"#process","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"${esc(navLabels[2])}","url":"#quote","kind":"custom","isTopLevelLink":true} /-->
<!-- /wp:navigation -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->

<!-- wp:cover {"url":"{{hero_url}}","id":{{hero_id}},"dimRatio":60,"overlayColor":"deep-green","isUserOverlayColor":true,"minHeight":720,"minHeightUnit":"px","contentPosition":"center left","align":"full","style":{"spacing":{"padding":{"top":"80px","right":"24px","bottom":"90px","left":"24px"}}}} -->
<div class="wp-block-cover alignfull has-custom-content-position is-position-center-left" style="padding-top:80px;padding-right:24px;padding-bottom:90px;padding-left:24px;min-height:720px"><span aria-hidden="true" class="wp-block-cover__background has-deep-green-background-color has-background-dim-60 has-background-dim"></span><img class="wp-block-cover__image-background wp-image-{{hero_id}}" alt="" src="{{hero_url}}" data-object-fit="cover" data-object-position="68% 50%"/><div class="wp-block-cover__inner-container">
<!-- wp:group {"layout":{"type":"constrained","contentSize":"680px","justifyContent":"left"}} -->
<div class="wp-block-group">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"17px","fontStyle":"normal","fontWeight":"800","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-sun-color has-text-color" style="font-size:17px;font-style:normal;font-weight:800;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"white","style":{"typography":{"fontSize":"clamp(44px, 7vw, 92px)","lineHeight":"0.96","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"12px","bottom":"22px"}}}} -->
<h1 class="wp-block-heading has-white-color has-text-color" style="margin-top:12px;margin-bottom:22px;font-size:clamp(44px, 7vw, 92px);font-style:normal;font-weight:900;line-height:0.96">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"clamp(20px, 2vw, 27px)","lineHeight":"1.45"},"spacing":{"margin":{"bottom":"30px"}}}} -->
<p class="has-white-color has-text-color" style="margin-bottom:30px;font-size:clamp(20px, 2vw, 27px);line-height:1.45">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"white","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button is-style-outline" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-white-color has-text-color wp-element-button" href="#services" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:group -->
</div></div>
<!-- /wp:cover -->

<!-- wp:group {"align":"full","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"86px","right":"24px","bottom":"46px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull has-cream-background-color has-background" style="padding-top:86px;padding-right:24px;padding-bottom:46px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"48px"}}}} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"58%"} -->
<div class="wp-block-column" style="flex-basis:58%">
<!-- wp:heading {"level":2,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(34px, 5vw, 62px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:18px;font-size:clamp(34px, 5vw, 62px);font-style:normal;font-weight:900;line-height:1">${esc(copy.introTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"21px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:21px;line-height:1.55">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"42%","backgroundColor":"mist","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"30px","right":"30px","bottom":"30px","left":"30px"}}}} -->
<div class="wp-block-column has-mist-background-color has-background" style="border-radius:18px;padding-top:30px;padding-right:30px;padding-bottom:30px;padding-left:30px;flex-basis:42%">
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"18px","fontStyle":"normal","fontWeight":"800","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-deep-green-color has-text-color" style="font-size:18px;font-style:normal;font-weight:800;letter-spacing:0px;text-transform:uppercase">Service area</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"22px","lineHeight":"1.45"}}} -->
<p class="has-soil-color has-text-color" style="font-size:22px;line-height:1.45">${esc(contact.serviceArea)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"18px","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-grass-color has-text-color" style="font-size:18px;font-style:normal;font-weight:800">Text photos. Get a simple plan. Watch your curb appeal perk up.</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Services"},"anchor":"services","align":"full","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"46px","right":"24px","bottom":"76px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="services" class="wp-block-group alignfull has-cream-background-color has-background" style="padding-top:46px;padding-right:24px;padding-bottom:76px;padding-left:24px">
<!-- wp:heading {"level":2,"align":"wide","textColor":"deep-green","style":{"typography":{"fontSize":"clamp(34px, 5vw, 58px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<h2 class="wp-block-heading alignwide has-deep-green-color has-text-color" style="margin-bottom:28px;font-size:clamp(34px, 5vw, 58px);font-style:normal;font-weight:900;line-height:1">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"22px"}}}} -->
<div class="wp-block-columns alignwide">
${services}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Process"},"anchor":"process","align":"full","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"78px","right":"24px","bottom":"78px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="process" class="wp-block-group alignfull has-deep-green-background-color has-background" style="padding-top:78px;padding-right:24px;padding-bottom:78px;padding-left:24px">
<!-- wp:heading {"level":2,"align":"wide","textColor":"white","style":{"typography":{"fontSize":"clamp(34px, 5vw, 58px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"34px"}}}} -->
<h2 class="wp-block-heading alignwide has-white-color has-text-color" style="margin-bottom:34px;font-size:clamp(34px, 5vw, 58px);font-style:normal;font-weight:900;line-height:1">${esc(copy.processTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"24px"}}}} -->
<div class="wp-block-columns alignwide">
${process}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"anchor":"proof","align":"full","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"78px","right":"24px","bottom":"78px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="proof" class="wp-block-group alignfull has-mist-background-color has-background" style="padding-top:78px;padding-right:24px;padding-bottom:78px;padding-left:24px">
<!-- wp:heading {"level":2,"align":"wide","textColor":"deep-green","style":{"typography":{"fontSize":"clamp(34px, 5vw, 58px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"30px"}}}} -->
<h2 class="wp-block-heading alignwide has-deep-green-color has-text-color" style="margin-bottom:30px;font-size:clamp(34px, 5vw, 58px);font-style:normal;font-weight:900;line-height:1">${esc(copy.proofTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"18px"}}}} -->
<div class="wp-block-columns alignwide">
${proof}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Quote"},"anchor":"quote","align":"full","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"86px","right":"24px","bottom":"86px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1000px"}} -->
<div id="quote" class="wp-block-group alignfull has-cream-background-color has-background" style="padding-top:86px;padding-right:24px;padding-bottom:86px;padding-left:24px">
<!-- wp:group {"className":"som-quote-card","backgroundColor":"deep-green","style":{"border":{"radius":"24px"},"spacing":{"padding":{"top":"54px","right":"38px","bottom":"54px","left":"38px"}}},"layout":{"type":"constrained","contentSize":"760px"}} -->
<div class="wp-block-group som-quote-card has-deep-green-background-color has-background" style="border-radius:24px;padding-top:54px;padding-right:38px;padding-bottom:54px;padding-left:38px">
<!-- wp:heading {"textAlign":"center","level":2,"textColor":"white","style":{"typography":{"fontSize":"clamp(36px, 6vw, 68px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-text-align-center has-white-color has-text-color" style="margin-bottom:18px;font-size:clamp(36px, 6vw, 68px);font-style:normal;font-weight:900;line-height:1">${esc(copy.quoteTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"align":"center","textColor":"white","style":{"typography":{"fontSize":"21px","lineHeight":"1.5"}}} -->
<p class="has-text-align-center has-white-color has-text-color" style="font-size:21px;line-height:1.5">${esc(copy.quoteText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"blockGap":"12px","margin":{"top":"28px"}}}} -->
<div class="wp-block-buttons" style="margin-top:28px">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">Email for a quote</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"white","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button is-style-outline" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-white-color has-text-color wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->

<!-- wp:group {"align":"full","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"32px","right":"24px","bottom":"32px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull has-deep-green-background-color has-background" style="padding-top:32px;padding-right:24px;padding-bottom:32px;padding-left:24px">
<!-- wp:group {"align":"wide","className":"som-footer","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide som-footer">
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"700"}}} -->
<p class="has-white-color has-text-color" style="font-size:16px;font-style:normal;font-weight:700">${esc(spec.businessName)} - ${esc(spec.tagline)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-sun-color has-text-color" style="font-size:16px;font-style:normal;font-weight:800">${esc(contact.phoneLabel)} / ${esc(contact.email)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->
`.trim();
}

function buildBeforeAfterQuotePageContent(spec) {
  const { copy, contact } = spec;
  const navLinks = navModelForSpec(spec, ["Photo quote", "Surfaces", "Method"], ["quote", "surfaces", "method"]);
  const surfaces = spec.services
    .map((item, index) => surfaceRow(index + 1, item.title, item.text, ["Pressure wash", "Soft wash", "Detail rinse"][index] || "Custom clean"))
    .join("\n");
  const timeline = spec.process
    .map((item, index) => timelineStep(index + 1, item.title, item.text))
    .join("\n");
  const proof = spec.proof
    .map((item) => compactProof(item.stat, item.label))
    .join("\n");

  return `
<!-- wp:group {"align":"full","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"18px","right":"24px","bottom":"18px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull has-cream-background-color has-background" style="padding-top:18px;padding-right:24px;padding-bottom:18px;padding-left:24px">
<!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide">
<!-- wp:site-logo {"width":230,"shouldSyncIcon":true} /-->
<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"700"}}} -->
${navigationLinkBlocks(navLinks)}
<!-- /wp:navigation -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Before/after hero"},"align":"full","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"64px","right":"24px","bottom":"74px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull has-cream-background-color has-background" style="padding-top:64px;padding-right:24px;padding-bottom:74px;padding-left:24px">
<!-- wp:columns {"align":"wide","className":"som-split-hero","style":{"spacing":{"blockGap":{"left":"52px"}}}} -->
<div class="wp-block-columns alignwide som-split-hero">
<!-- wp:column {"width":"47%","style":{"spacing":{"padding":{"top":"24px","bottom":"24px"}}}} -->
<div class="wp-block-column" style="padding-top:24px;padding-bottom:24px;flex-basis:47%">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"17px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:17px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(50px, 7.4vw, 98px)","lineHeight":"0.92","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"12px","bottom":"22px"}}}} -->
<h1 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:12px;margin-bottom:22px;font-size:clamp(50px, 7.4vw, 98px);font-style:normal;font-weight:900;line-height:0.92">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"clamp(20px, 2vw, 27px)","lineHeight":"1.45"},"spacing":{"margin":{"bottom":"30px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-bottom:30px;font-size:clamp(20px, 2vw, 27px);line-height:1.45">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button is-style-outline" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-text-color wp-element-button" href="#surfaces" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
<!-- wp:group {"className":"som-chip-row","style":{"spacing":{"margin":{"top":"34px"}}},"layout":{"type":"flex","flexWrap":"wrap"}} -->
<div class="wp-block-group som-chip-row" style="margin-top:34px">
<!-- wp:paragraph {"className":"som-chip","backgroundColor":"mist","textColor":"deep-green","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900"},"spacing":{"padding":{"top":"10px","right":"14px","bottom":"10px","left":"14px"}}}} -->
<p class="som-chip has-deep-green-color has-mist-background-color has-text-color has-background" style="padding-top:10px;padding-right:14px;padding-bottom:10px;padding-left:14px;font-size:15px;font-style:normal;font-weight:900">Photo-first estimates</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"className":"som-chip","backgroundColor":"mist","textColor":"deep-green","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900"},"spacing":{"padding":{"top":"10px","right":"14px","bottom":"10px","left":"14px"}}}} -->
<p class="som-chip has-deep-green-color has-mist-background-color has-text-color has-background" style="padding-top:10px;padding-right:14px;padding-bottom:10px;padding-left:14px;font-size:15px;font-style:normal;font-weight:900">Soft-wash friendly</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"className":"som-chip","backgroundColor":"mist","textColor":"deep-green","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900"},"spacing":{"padding":{"top":"10px","right":"14px","bottom":"10px","left":"14px"}}}} -->
<p class="som-chip has-deep-green-color has-mist-background-color has-text-color has-background" style="padding-top:10px;padding-right:14px;padding-bottom:10px;padding-left:14px;font-size:15px;font-style:normal;font-weight:900">Plant-rinse checklist</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"53%"} -->
<div class="wp-block-column" style="flex-basis:53%">
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"full","linkDestination":"none","className":"som-hero-photo"} -->
<figure class="wp-block-image size-full som-hero-photo"><img src="{{hero_url}}" alt="" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
<!-- wp:columns {"className":"som-before-after","style":{"spacing":{"blockGap":{"left":"12px"},"margin":{"top":"12px"}}}} -->
<div class="wp-block-columns som-before-after" style="margin-top:12px">
<!-- wp:column {"className":"som-evidence-card","backgroundColor":"deep-green","style":{"border":{"radius":"16px"},"spacing":{"padding":{"top":"18px","right":"20px","bottom":"18px","left":"20px"}}}} -->
<div class="wp-block-column som-evidence-card has-deep-green-background-color has-background" style="border-radius:16px;padding-top:18px;padding-right:20px;padding-bottom:18px;padding-left:20px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-sun-color has-text-color" style="font-size:14px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Before</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"18px","lineHeight":"1.3","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-white-color has-text-color" style="font-size:18px;font-style:normal;font-weight:800;line-height:1.3">Algae, grime, and mystery driveway shadows.</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"className":"som-evidence-card","backgroundColor":"leaf","style":{"border":{"radius":"16px"},"spacing":{"padding":{"top":"18px","right":"20px","bottom":"18px","left":"20px"}}}} -->
<div class="wp-block-column som-evidence-card has-leaf-background-color has-background" style="border-radius:16px;padding-top:18px;padding-right:20px;padding-bottom:18px;padding-left:20px">
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-deep-green-color has-text-color" style="font-size:14px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">After</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"18px","lineHeight":"1.3","fontStyle":"normal","fontWeight":"900"}}} -->
<p class="has-deep-green-color has-text-color" style="font-size:18px;font-style:normal;font-weight:900;line-height:1.3">Clean lines, brighter concrete, better curb appeal.</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Photo quote"},"anchor":"quote","align":"full","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"42px","right":"24px","bottom":"42px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="quote" class="wp-block-group alignfull has-deep-green-background-color has-background" style="padding-top:42px;padding-right:24px;padding-bottom:42px;padding-left:24px">
<!-- wp:columns {"align":"wide","className":"som-quote-strip","style":{"spacing":{"blockGap":{"left":"34px"}}}} -->
<div class="wp-block-columns alignwide som-quote-strip">
<!-- wp:column {"width":"40%"} -->
<div class="wp-block-column" style="flex-basis:40%">
<!-- wp:heading {"level":2,"textColor":"white","style":{"typography":{"fontSize":"clamp(34px, 5vw, 58px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"12px"}}}} -->
<h2 class="wp-block-heading has-white-color has-text-color" style="margin-bottom:12px;font-size:clamp(34px, 5vw, 58px);font-style:normal;font-weight:900;line-height:1">Quote in three photos.</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"19px","lineHeight":"1.45"}}} -->
<p class="has-white-color has-text-color" style="font-size:19px;line-height:1.45">No appointment just to price the obvious stuff. Send the surface, the stain, and the water access.</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"36%"} -->
<div class="wp-block-column" style="flex-basis:36%">
<!-- wp:list {"textColor":"white","className":"som-check-list","style":{"typography":{"fontSize":"18px","lineHeight":"1.55","fontStyle":"normal","fontWeight":"700"}}} -->
<ul class="som-check-list has-white-color has-text-color" style="font-size:18px;font-style:normal;font-weight:700;line-height:1.55"><!-- wp:list-item --><li>Wide shot of the whole area</li><!-- /wp:list-item --><!-- wp:list-item --><li>Close-up of the worst grime</li><!-- /wp:list-item --><!-- wp:list-item --><li>Nearest hose or water spigot</li><!-- /wp:list-item --></ul>
<!-- /wp:list -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"24%","style":{"spacing":{"padding":{"top":"8px"}}}} -->
<div class="wp-block-column" style="padding-top:8px;flex-basis:24%">
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"left"},"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","width":100,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">Email photos</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"white","width":100,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100 is-style-outline" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-white-color has-text-color wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Surfaces"},"anchor":"surfaces","align":"full","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"78px","right":"24px","bottom":"74px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1060px"}} -->
<div id="surfaces" class="wp-block-group alignfull has-cream-background-color has-background" style="padding-top:78px;padding-right:24px;padding-bottom:74px;padding-left:24px">
<!-- wp:heading {"textAlign":"center","level":2,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(36px, 6vw, 68px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-text-align-center has-deep-green-color has-text-color" style="margin-bottom:18px;font-size:clamp(36px, 6vw, 68px);font-style:normal;font-weight:900;line-height:1">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"align":"center","textColor":"soil","style":{"typography":{"fontSize":"20px","lineHeight":"1.5"},"spacing":{"margin":{"bottom":"38px"}}}} -->
<p class="has-text-align-center has-soil-color has-text-color" style="margin-bottom:38px;font-size:20px;line-height:1.5">Different surfaces need different pressure. That is the whole trick.</p>
<!-- /wp:paragraph -->
${surfaces}
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Method"},"anchor":"method","align":"full","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"78px","right":"24px","bottom":"78px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="method" class="wp-block-group alignfull has-mist-background-color has-background" style="padding-top:78px;padding-right:24px;padding-bottom:78px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"52px"}}}} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"48%"} -->
<div class="wp-block-column" style="flex-basis:48%">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:16px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Method, not muscle</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":2,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(36px, 5.8vw, 66px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"10px","bottom":"20px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:10px;margin-bottom:20px;font-size:clamp(36px, 5.8vw, 66px);font-style:normal;font-weight:900;line-height:1">Pressure when it helps. Soft wash when it matters.</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"20px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:20px;line-height:1.55">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"52%","backgroundColor":"white","style":{"border":{"radius":"24px"},"spacing":{"padding":{"top":"34px","right":"34px","bottom":"34px","left":"34px"}}}} -->
<div class="wp-block-column has-white-background-color has-background" style="border-radius:24px;padding-top:34px;padding-right:34px;padding-bottom:34px;padding-left:34px;flex-basis:52%">
<!-- wp:list {"textColor":"deep-green","className":"som-method-list","style":{"typography":{"fontSize":"22px","lineHeight":"1.5","fontStyle":"normal","fontWeight":"900"}}} -->
<ul class="som-method-list has-deep-green-color has-text-color" style="font-size:22px;font-style:normal;font-weight:900;line-height:1.5"><!-- wp:list-item --><li>Concrete gets crisp pressure passes.</li><!-- /wp:list-item --><!-- wp:list-item --><li>Siding gets lower pressure and the right cleaner.</li><!-- /wp:list-item --><!-- wp:list-item --><li>Plants get rinsed before and after.</li><!-- /wp:list-item --><!-- wp:list-item --><li>Edges and runoff get cleaned up before we leave.</li><!-- /wp:list-item --></ul>
<!-- /wp:list -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Timeline"},"anchor":"process","align":"full","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"78px","right":"24px","bottom":"78px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"920px"}} -->
<div id="process" class="wp-block-group alignfull has-cream-background-color has-background" style="padding-top:78px;padding-right:24px;padding-bottom:78px;padding-left:24px">
<!-- wp:heading {"level":2,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(36px, 6vw, 64px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"34px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:34px;font-size:clamp(36px, 6vw, 64px);font-style:normal;font-weight:900;line-height:1">${esc(copy.processTitle)}</h2>
<!-- /wp:heading -->
${timeline}
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Proof and footer"},"anchor":"proof","align":"full","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"76px","right":"24px","bottom":"34px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="proof" class="wp-block-group alignfull has-deep-green-background-color has-background" style="padding-top:76px;padding-right:24px;padding-bottom:34px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"42px"}}}} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"46%"} -->
<div class="wp-block-column" style="flex-basis:46%">
<!-- wp:heading {"level":2,"textColor":"white","style":{"typography":{"fontSize":"clamp(36px, 6vw, 68px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-white-color has-text-color" style="margin-bottom:18px;font-size:clamp(36px, 6vw, 68px);font-style:normal;font-weight:900;line-height:1">${esc(copy.quoteTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"20px","lineHeight":"1.5"}}} -->
<p class="has-white-color has-text-color" style="font-size:20px;line-height:1.5">${esc(copy.quoteText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"54%"} -->
<div class="wp-block-column" style="flex-basis:54%">
<!-- wp:columns {"className":"som-proof-grid","style":{"spacing":{"blockGap":{"left":"14px"}}}} -->
<div class="wp-block-columns som-proof-grid">
${proof}
</div>
<!-- /wp:columns -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":"12px","margin":{"top":"26px"}}}} -->
<div class="wp-block-buttons" style="margin-top:26px">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">Email for a quote</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"white","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button is-style-outline" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-white-color has-text-color wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
<!-- wp:separator {"className":"is-style-wide","backgroundColor":"grass","style":{"spacing":{"margin":{"top":"54px","bottom":"28px"}}}} -->
<hr class="wp-block-separator has-text-color has-grass-color has-alpha-channel-opacity has-grass-background-color has-background is-style-wide" style="margin-top:54px;margin-bottom:28px"/>
<!-- /wp:separator -->
<!-- wp:group {"align":"wide","className":"som-footer","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide som-footer">
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"700"}}} -->
<p class="has-white-color has-text-color" style="font-size:16px;font-style:normal;font-weight:700">${esc(spec.businessName)} - ${esc(spec.tagline)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-sun-color has-text-color" style="font-size:16px;font-style:normal;font-weight:800">${esc(contact.phoneLabel)} / ${esc(contact.email)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->
`.trim();
}

function zoneMap(proof) {
  const items = proof.slice(0, 3);
  const cells = [
    ["Tools", "sun"],
    ["Sports", "grass"],
    ["Seasonal", "cream"],
    ["Overflow", "leaf"]
  ];

  return `
<!-- wp:group {"className":"som-zone-map","backgroundColor":"soil","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"18px","right":"18px","bottom":"16px","left":"18px"},"margin":{"top":"26px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-zone-map has-soil-background-color has-background" style="border-radius:8px;margin-top:26px;padding-top:18px;padding-right:18px;padding-bottom:16px;padding-left:18px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"12px"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:12px;font-size:13px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Zone map</p>
<!-- /wp:paragraph -->
<!-- wp:columns {"className":"som-zone-map-grid","style":{"spacing":{"blockGap":{"left":"8px","top":"8px"}}}} -->
<div class="wp-block-columns som-zone-map-grid">
${cells.map(([label, color]) => `
<!-- wp:column {"backgroundColor":"${color}","className":"som-zone-map-cell","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"12px","right":"12px","bottom":"12px","left":"12px"}}}} -->
<div class="wp-block-column som-zone-map-cell has-${color}-background-color has-background" style="border-radius:6px;padding-top:12px;padding-right:12px;padding-bottom:12px;padding-left:12px">
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-deep-green-color has-text-color" style="font-size:13px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${label}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim()).join("\n")}
</div>
<!-- /wp:columns -->
${items.map((item) => `
<!-- wp:paragraph {"className":"som-ticket-line","textColor":"cream","style":{"typography":{"fontSize":"14px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"850"},"spacing":{"margin":{"top":"0","bottom":"7px"}}}} -->
<p class="som-ticket-line has-cream-color has-text-color" style="margin-top:0;margin-bottom:7px;font-size:14px;font-style:normal;font-weight:850;line-height:1.45"><strong>${esc(item.stat)}</strong> / ${esc(item.label)}</p>
<!-- /wp:paragraph -->`.trim()).join("\n")}
</div>
<!-- /wp:group -->`.trim();
}

function zoneProof(stat, label) {
  return `
<!-- wp:column {"className":"som-zone-proof","backgroundColor":"white","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"22px","right":"20px","bottom":"22px","left":"20px"}}}} -->
<div class="wp-block-column som-zone-proof has-white-background-color has-background" style="border-radius:8px;padding-top:22px;padding-right:20px;padding-bottom:22px;padding-left:20px">
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(26px, 3.5vw, 42px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<p class="has-deep-green-color has-text-color" style="margin-bottom:8px;font-size:clamp(26px, 3.5vw, 42px);font-style:normal;font-weight:900;line-height:1">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"15px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-soil-color has-text-color" style="font-size:15px;font-style:normal;font-weight:800;line-height:1.45">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function zoneCard(number, title, text) {
  return `
<!-- wp:column {"className":"som-zone-card","backgroundColor":"white","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"30px","right":"28px","bottom":"30px","left":"28px"}}}} -->
<div class="wp-block-column som-zone-card has-white-background-color has-background" style="border-radius:8px;padding-top:30px;padding-right:28px;padding-bottom:30px;padding-left:28px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<p class="has-grass-color has-text-color" style="margin-bottom:14px;font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Zone ${number}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|card-title","lineHeight":"1.08","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:14px;font-size:var(--wp--preset--font-size--card-title);font-style:normal;font-weight:900;line-height:1.08">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"18px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:18px;line-height:1.55">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function zoneNote(title, text) {
  return `
<!-- wp:group {"className":"som-zone-note","backgroundColor":"mist","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"26px","right":"28px","bottom":"26px","left":"28px"},"margin":{"top":"22px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-zone-note has-mist-background-color has-background" style="border-radius:8px;margin-top:22px;padding-top:26px;padding-right:28px;padding-bottom:26px;padding-left:28px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<p class="has-grass-color has-text-color" style="margin-bottom:8px;font-size:14px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(title)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"18px","lineHeight":"1.5","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-deep-green-color has-text-color" style="font-size:18px;font-style:normal;font-weight:800;line-height:1.5">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->`.trim();
}

function zoneStep(number, title, text) {
  return `
<!-- wp:group {"className":"som-zone-step","backgroundColor":"cream","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"22px","right":"24px","bottom":"22px","left":"24px"},"margin":{"bottom":"14px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-zone-step has-cream-background-color has-background" style="border-radius:8px;margin-bottom:14px;padding-top:22px;padding-right:24px;padding-bottom:22px;padding-left:24px">
<!-- wp:columns {"verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"20px"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"68px"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:68px">
<!-- wp:paragraph {"align":"center","backgroundColor":"sun","textColor":"deep-green","className":"som-zone-step-number","style":{"typography":{"fontSize":"20px","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"padding":{"top":"14px","bottom":"14px"}}}} -->
<p class="has-text-align-center som-zone-step-number has-deep-green-color has-sun-background-color has-text-color has-background" style="padding-top:14px;padding-bottom:14px;font-size:20px;font-style:normal;font-weight:900;line-height:1">0${number}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center"} -->
<div class="wp-block-column is-vertically-aligned-center">
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"27px","lineHeight":"1.1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:8px;font-size:27px;font-style:normal;font-weight:900;line-height:1.1">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"18px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:18px;line-height:1.5">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->`.trim();
}

function waterMiniBoard(proof) {
  const items = proof.slice(0, 3);
  return `
<!-- wp:group {"className":"som-water-mini-board","backgroundColor":"white","style":{"border":{"radius":"16px"},"spacing":{"padding":{"top":"16px","right":"18px","bottom":"10px","left":"18px"},"margin":{"top":"24px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-water-mini-board has-white-background-color has-background" style="border-radius:16px;margin-top:24px;padding-top:16px;padding-right:18px;padding-bottom:10px;padding-left:18px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"10px"}}}} -->
<p class="has-grass-color has-text-color" style="margin-bottom:10px;font-size:13px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Water board</p>
<!-- /wp:paragraph -->
${items.map((item) => `
<!-- wp:paragraph {"textColor":"deep-green","className":"som-ticket-line","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"850","lineHeight":"1.45"},"spacing":{"margin":{"bottom":"7px"}}}} -->
<p class="som-ticket-line has-deep-green-color has-text-color" style="margin-bottom:7px;font-size:14px;font-style:normal;font-weight:850;line-height:1.45"><strong>${esc(item.stat)}</strong> / ${esc(item.label)}</p>
<!-- /wp:paragraph -->`.trim()).join("\n")}
</div>
<!-- /wp:group -->`.trim();
}

function waterProof(stat, label) {
  return `
<!-- wp:column {"className":"som-water-proof","backgroundColor":"cream","style":{"border":{"radius":"16px"},"spacing":{"padding":{"top":"22px","right":"20px","bottom":"22px","left":"20px"}}}} -->
<div class="wp-block-column som-water-proof has-cream-background-color has-background" style="border-radius:16px;padding-top:22px;padding-right:20px;padding-bottom:22px;padding-left:20px">
<!-- wp:paragraph {"textColor":"leaf","style":{"typography":{"fontSize":"clamp(26px, 3.6vw, 42px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<p class="has-leaf-color has-text-color" style="margin-bottom:8px;font-size:clamp(26px, 3.6vw, 42px);font-style:normal;font-weight:900;line-height:1">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"15px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-deep-green-color has-text-color" style="font-size:15px;font-style:normal;font-weight:800;line-height:1.45">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function waterPlanCard(number, title, text) {
  return `
<!-- wp:column {"className":"som-water-plan","backgroundColor":"white","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"30px","right":"28px","bottom":"30px","left":"28px"}}}} -->
<div class="wp-block-column som-water-plan has-white-background-color has-background" style="border-radius:18px;padding-top:30px;padding-right:28px;padding-bottom:30px;padding-left:28px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<p class="has-grass-color has-text-color" style="margin-bottom:14px;font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Lane ${number}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|card-title","lineHeight":"1.08","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:14px;font-size:var(--wp--preset--font-size--card-title);font-style:normal;font-weight:900;line-height:1.08">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"18px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:18px;line-height:1.55">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function waterRouteStep(number, title, text) {
  return `
<!-- wp:group {"className":"som-water-route-step","backgroundColor":"cream","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"22px","right":"24px","bottom":"22px","left":"24px"},"margin":{"bottom":"14px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-water-route-step has-cream-background-color has-background" style="border-radius:18px;margin-bottom:14px;padding-top:22px;padding-right:24px;padding-bottom:22px;padding-left:24px">
<!-- wp:columns {"verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"20px"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"68px"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:68px">
<!-- wp:paragraph {"align":"center","backgroundColor":"leaf","textColor":"deep-green","className":"som-water-step-number","style":{"typography":{"fontSize":"20px","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"padding":{"top":"14px","bottom":"14px"}}}} -->
<p class="has-text-align-center som-water-step-number has-deep-green-color has-leaf-background-color has-text-color has-background" style="padding-top:14px;padding-bottom:14px;font-size:20px;font-style:normal;font-weight:900;line-height:1">0${number}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center"} -->
<div class="wp-block-column is-vertically-aligned-center">
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"27px","lineHeight":"1.1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:8px;font-size:27px;font-style:normal;font-weight:900;line-height:1.1">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"18px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:18px;line-height:1.5">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->`.trim();
}

function workshopTicket(proof) {
  const items = proof.slice(0, 3);
  return `
<!-- wp:group {"className":"som-workshop-ticket","backgroundColor":"soil","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"18px","right":"20px","bottom":"18px","left":"20px"},"margin":{"top":"28px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-workshop-ticket has-soil-background-color has-background" style="border-radius:8px;margin-top:28px;padding-top:18px;padding-right:20px;padding-bottom:18px;padding-left:20px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"10px"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:10px;font-size:14px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Bench check</p>
<!-- /wp:paragraph -->
${items.map((item) => `
<!-- wp:paragraph {"textColor":"cream","className":"som-ticket-line","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"850","lineHeight":"1.45"},"spacing":{"margin":{"bottom":"7px"}}}} -->
<p class="som-ticket-line has-cream-color has-text-color" style="margin-bottom:7px;font-size:15px;font-style:normal;font-weight:850;line-height:1.45"><strong>${esc(item.stat)}</strong> / ${esc(item.label)}</p>
<!-- /wp:paragraph -->`.trim()).join("\n")}
</div>
<!-- /wp:group -->`.trim();
}

function workshopProof(stat, label) {
  return `
<!-- wp:column {"className":"som-material-proof","backgroundColor":"cream","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"20px","right":"20px","bottom":"20px","left":"20px"}}}} -->
<div class="wp-block-column som-material-proof has-cream-background-color has-background" style="border-radius:8px;padding-top:20px;padding-right:20px;padding-bottom:20px;padding-left:20px">
<!-- wp:paragraph {"textColor":"leaf","style":{"typography":{"fontSize":"28px","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<p class="has-leaf-color has-text-color" style="margin-bottom:8px;font-size:28px;font-style:normal;font-weight:900;line-height:1">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"15px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-deep-green-color has-text-color" style="font-size:15px;font-style:normal;font-weight:800;line-height:1.45">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function woodCard(number, title, text) {
  return `
<!-- wp:column {"className":"som-wood-card","backgroundColor":"white","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"28px","right":"26px","bottom":"28px","left":"26px"}}}} -->
<div class="wp-block-column som-wood-card has-white-background-color has-background" style="border-radius:8px;padding-top:28px;padding-right:26px;padding-bottom:28px;padding-left:26px">
<!-- wp:paragraph {"textColor":"leaf","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"12px"}}}} -->
<p class="has-leaf-color has-text-color" style="margin-bottom:12px;font-size:14px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Bench ${number}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|card-title","lineHeight":"1.08","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"12px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:12px;font-size:var(--wp--preset--font-size--card-title);font-style:normal;font-weight:900;line-height:1.08">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:17px;line-height:1.55">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function careNote(title, text) {
  return `
<!-- wp:group {"className":"som-care-note","backgroundColor":"mist","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"26px","right":"28px","bottom":"26px","left":"28px"},"margin":{"top":"22px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-care-note has-mist-background-color has-background" style="border-radius:8px;margin-top:22px;padding-top:26px;padding-right:28px;padding-bottom:26px;padding-left:28px">
<!-- wp:paragraph {"textColor":"leaf","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<p class="has-leaf-color has-text-color" style="margin-bottom:8px;font-size:14px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(title)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"18px","lineHeight":"1.5","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-deep-green-color has-text-color" style="font-size:18px;font-style:normal;font-weight:800;line-height:1.5">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->`.trim();
}

function craftStep(number, title, text) {
  return `
<!-- wp:group {"className":"som-craft-step","backgroundColor":"cream","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"22px","right":"24px","bottom":"22px","left":"24px"},"margin":{"bottom":"14px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-craft-step has-cream-background-color has-background" style="border-radius:8px;margin-bottom:14px;padding-top:22px;padding-right:24px;padding-bottom:22px;padding-left:24px">
<!-- wp:columns {"verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"18px"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"62px"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:62px">
<!-- wp:paragraph {"align":"center","backgroundColor":"leaf","textColor":"white","className":"som-craft-step-number","style":{"typography":{"fontSize":"21px","lineHeight":"1","fontStyle":"normal","fontWeight":"900"}}} -->
<p class="has-text-align-center som-craft-step-number has-white-color has-leaf-background-color has-text-color has-background" style="font-size:21px;font-style:normal;font-weight:900;line-height:1">${number}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center"} -->
<div class="wp-block-column is-vertically-aligned-center">
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"24px","lineHeight":"1.12","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"6px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:6px;font-size:24px;font-style:normal;font-weight:900;line-height:1.12">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.48"}}} -->
<p class="has-soil-color has-text-color" style="font-size:17px;line-height:1.48">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->`.trim();
}

function card(title, text) {
  return `
<!-- wp:column {"className":"som-card","backgroundColor":"white","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"30px","right":"28px","bottom":"30px","left":"28px"}}}} -->
<div class="wp-block-column som-card has-white-background-color has-background" style="border-radius:18px;padding-top:30px;padding-right:28px;padding-bottom:30px;padding-left:28px">
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"28px","lineHeight":"1.1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:14px;font-size:28px;font-style:normal;font-weight:900;line-height:1.1">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"18px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:18px;line-height:1.55">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function surfaceRow(number, title, text, method) {
  return `
<!-- wp:group {"className":"som-surface-row","backgroundColor":"white","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"22px","right":"24px","bottom":"22px","left":"24px"},"margin":{"bottom":"14px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-surface-row has-white-background-color has-background" style="border-radius:18px;margin-bottom:14px;padding-top:22px;padding-right:24px;padding-bottom:22px;padding-left:24px">
<!-- wp:columns {"verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"22px"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"72px"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:72px">
<!-- wp:paragraph {"align":"center","backgroundColor":"sun","textColor":"deep-green","className":"som-row-number","style":{"typography":{"fontSize":"24px","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"padding":{"top":"14px","bottom":"14px"}}}} -->
<p class="has-text-align-center som-row-number has-deep-green-color has-sun-background-color has-text-color has-background" style="padding-top:14px;padding-bottom:14px;font-size:24px;font-style:normal;font-weight:900;line-height:1">${number}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center"} -->
<div class="wp-block-column is-vertically-aligned-center">
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"28px","lineHeight":"1.1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:8px;font-size:28px;font-style:normal;font-weight:900;line-height:1.1">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"18px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:18px;line-height:1.5">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"170px"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:170px">
<!-- wp:paragraph {"align":"center","backgroundColor":"mist","textColor":"grass","className":"som-method-pill","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"padding":{"top":"10px","right":"14px","bottom":"10px","left":"14px"}}}} -->
<p class="has-text-align-center som-method-pill has-grass-color has-mist-background-color has-text-color has-background" style="padding-top:10px;padding-right:14px;padding-bottom:10px;padding-left:14px;font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(method)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->`.trim();
}

function checkCard(title, text) {
  return `
<!-- wp:group {"className":"som-check-card","backgroundColor":"white","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"22px","right":"24px","bottom":"22px","left":"24px"},"margin":{"bottom":"14px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-check-card has-white-background-color has-background" style="border-radius:18px;margin-bottom:14px;padding-top:22px;padding-right:24px;padding-bottom:22px;padding-left:24px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<p class="has-grass-color has-text-color" style="margin-bottom:8px;font-size:16px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Check ${esc(title)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"18px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:18px;line-height:1.5">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->`.trim();
}

function detailTicket(items) {
  const rows = items.slice(0, 3).map((item) => `
<!-- wp:paragraph {"className":"som-ticket-line","textColor":"mist","style":{"typography":{"fontSize":"14px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"800"},"spacing":{"margin":{"top":"0","bottom":"8px"}}}} -->
<p class="som-ticket-line has-mist-color has-text-color" style="margin-top:0;margin-bottom:8px;font-size:14px;font-style:normal;font-weight:800;line-height:1.45"><strong>${esc(item.stat)}</strong> / ${esc(item.label)}</p>
<!-- /wp:paragraph -->`).join("\n");

  return `
<!-- wp:group {"className":"som-detail-ticket","backgroundColor":"grass","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"18px","right":"18px","bottom":"10px","left":"18px"},"margin":{"top":"20px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-detail-ticket has-grass-background-color has-background" style="border-radius:18px;margin-top:20px;padding-top:18px;padding-right:18px;padding-bottom:10px;padding-left:18px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"10px"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:10px;font-size:13px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Driveway kit</p>
<!-- /wp:paragraph -->
${rows}
</div>
<!-- /wp:group -->`.trim();
}

function detailProof(stat, label) {
  return `
<!-- wp:column {"className":"som-detail-proof","backgroundColor":"white","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"22px","right":"20px","bottom":"22px","left":"20px"}}}} -->
<div class="wp-block-column som-detail-proof has-white-background-color has-background" style="border-radius:18px;padding-top:22px;padding-right:20px;padding-bottom:22px;padding-left:20px">
<!-- wp:paragraph {"textColor":"leaf","style":{"typography":{"fontSize":"clamp(24px, 3vw, 36px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<p class="has-leaf-color has-text-color" style="margin-bottom:8px;font-size:clamp(24px, 3vw, 36px);font-style:normal;font-weight:900;line-height:1">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"15px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-deep-green-color has-text-color" style="font-size:15px;font-style:normal;font-weight:800;line-height:1.45">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function detailPackageCard(number, title, text) {
  return `
<!-- wp:column {"className":"som-detail-package","backgroundColor":"white","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"30px","right":"28px","bottom":"30px","left":"28px"}}}} -->
<div class="wp-block-column som-detail-package has-white-background-color has-background" style="border-radius:18px;padding-top:30px;padding-right:28px;padding-bottom:30px;padding-left:28px">
<!-- wp:paragraph {"textColor":"leaf","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<p class="has-leaf-color has-text-color" style="margin-bottom:14px;font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Detail ${number}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"29px","lineHeight":"1.08","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:14px;font-size:29px;font-style:normal;font-weight:900;line-height:1.08">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"18px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:18px;line-height:1.55">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function detailStep(number, title, text) {
  return `
<!-- wp:group {"className":"som-detail-step","backgroundColor":"cream","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"22px","right":"24px","bottom":"22px","left":"24px"},"margin":{"bottom":"14px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-detail-step has-cream-background-color has-background" style="border-radius:18px;margin-bottom:14px;padding-top:22px;padding-right:24px;padding-bottom:22px;padding-left:24px">
<!-- wp:columns {"verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"20px"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"70px"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:70px">
<!-- wp:paragraph {"align":"center","backgroundColor":"sun","textColor":"deep-green","className":"som-detail-step-number","style":{"typography":{"fontSize":"20px","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"padding":{"top":"14px","bottom":"14px"}}}} -->
<p class="has-text-align-center som-detail-step-number has-deep-green-color has-sun-background-color has-text-color has-background" style="padding-top:14px;padding-bottom:14px;font-size:20px;font-style:normal;font-weight:900;line-height:1">0${number}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center"} -->
<div class="wp-block-column is-vertically-aligned-center">
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"27px","lineHeight":"1.1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:8px;font-size:27px;font-style:normal;font-weight:900;line-height:1.1">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"18px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:18px;line-height:1.5">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->`.trim();
}

function menuTicket(spec) {
  const rows = spec.services.slice(0, 3).map((item) => `
<!-- wp:paragraph {"className":"som-ticket-line","textColor":"mist","style":{"typography":{"fontSize":"14px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"800"},"spacing":{"margin":{"top":"0","bottom":"8px"}}}} -->
<p class="som-ticket-line has-mist-color has-text-color" style="margin-top:0;margin-bottom:8px;font-size:14px;font-style:normal;font-weight:800;line-height:1.45"><strong>${esc(item.title)}</strong> / ${esc(item.text)}</p>
<!-- /wp:paragraph -->`).join("\n");

  return `
<!-- wp:group {"className":"som-menu-ticket","backgroundColor":"grass","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"18px","right":"18px","bottom":"10px","left":"18px"},"margin":{"top":"20px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-menu-ticket has-grass-background-color has-background" style="border-radius:18px;margin-top:20px;padding-top:18px;padding-right:18px;padding-bottom:10px;padding-left:18px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"10px"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:10px;font-size:13px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Menu board</p>
<!-- /wp:paragraph -->
${rows}
</div>
<!-- /wp:group -->`.trim();
}

function menuProof(stat, label) {
  return `
<!-- wp:column {"className":"som-menu-proof","backgroundColor":"white","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"22px","right":"20px","bottom":"22px","left":"20px"}}}} -->
<div class="wp-block-column som-menu-proof has-white-background-color has-background" style="border-radius:18px;padding-top:22px;padding-right:20px;padding-bottom:22px;padding-left:20px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"clamp(24px, 3vw, 36px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:8px;font-size:clamp(24px, 3vw, 36px);font-style:normal;font-weight:900;line-height:1">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"15px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-deep-green-color has-text-color" style="font-size:15px;font-style:normal;font-weight:800;line-height:1.45">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function menuPackageCard(number, title, text) {
  return `
<!-- wp:column {"className":"som-menu-package","backgroundColor":"white","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"30px","right":"28px","bottom":"30px","left":"28px"}}}} -->
<div class="wp-block-column som-menu-package has-white-background-color has-background" style="border-radius:18px;padding-top:30px;padding-right:28px;padding-bottom:30px;padding-left:28px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:14px;font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Package ${number}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"29px","lineHeight":"1.08","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:14px;font-size:29px;font-style:normal;font-weight:900;line-height:1.08">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"18px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:18px;line-height:1.55">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function menuStep(number, title, text) {
  return `
<!-- wp:group {"className":"som-menu-step","backgroundColor":"cream","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"22px","right":"24px","bottom":"22px","left":"24px"},"margin":{"bottom":"14px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-menu-step has-cream-background-color has-background" style="border-radius:18px;margin-bottom:14px;padding-top:22px;padding-right:24px;padding-bottom:22px;padding-left:24px">
<!-- wp:columns {"verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"20px"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"70px"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:70px">
<!-- wp:paragraph {"align":"center","backgroundColor":"sun","textColor":"deep-green","className":"som-menu-step-number","style":{"typography":{"fontSize":"20px","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"padding":{"top":"14px","bottom":"14px"}}}} -->
<p class="has-text-align-center som-menu-step-number has-deep-green-color has-sun-background-color has-text-color has-background" style="padding-top:14px;padding-bottom:14px;font-size:20px;font-style:normal;font-weight:900;line-height:1">0${number}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center"} -->
<div class="wp-block-column is-vertically-aligned-center">
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"27px","lineHeight":"1.1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:8px;font-size:27px;font-style:normal;font-weight:900;line-height:1.1">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"18px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:18px;line-height:1.5">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->`.trim();
}

function warningRow(number, title, text) {
  return `
<!-- wp:group {"className":"som-warning-row","backgroundColor":"white","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"22px","right":"24px","bottom":"22px","left":"24px"},"margin":{"bottom":"14px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-warning-row has-white-background-color has-background" style="border-radius:18px;margin-bottom:14px;padding-top:22px;padding-right:24px;padding-bottom:22px;padding-left:24px">
<!-- wp:columns {"verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"20px"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"70px"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:70px">
<!-- wp:paragraph {"align":"center","backgroundColor":"sun","textColor":"deep-green","className":"som-warning-number","style":{"typography":{"fontSize":"22px","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"padding":{"top":"14px","bottom":"14px"}}}} -->
<p class="has-text-align-center som-warning-number has-deep-green-color has-sun-background-color has-text-color has-background" style="padding-top:14px;padding-bottom:14px;font-size:22px;font-style:normal;font-weight:900;line-height:1">0${number}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center"} -->
<div class="wp-block-column is-vertically-aligned-center">
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"27px","lineHeight":"1.1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:8px;font-size:27px;font-style:normal;font-weight:900;line-height:1.1">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"18px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:18px;line-height:1.5">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->`.trim();
}

function sealCard(number, title, text) {
  return `
<!-- wp:column {"className":"som-seal-card","backgroundColor":"white","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"28px","right":"26px","bottom":"28px","left":"26px"}}}} -->
<div class="wp-block-column som-seal-card has-white-background-color has-background" style="border-radius:18px;padding-top:28px;padding-right:26px;padding-bottom:28px;padding-left:26px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:14px;font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Surface ${number}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"28px","lineHeight":"1.08","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:14px;font-size:28px;font-style:normal;font-weight:900;line-height:1.08">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"18px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:18px;line-height:1.5">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function surfaceBadge(stat, label) {
  return `
<!-- wp:column {"className":"som-surface-badge","backgroundColor":"deep-green","style":{"border":{"radius":"16px"},"spacing":{"padding":{"top":"20px","right":"18px","bottom":"20px","left":"18px"}}}} -->
<div class="wp-block-column som-surface-badge has-deep-green-background-color has-background" style="border-radius:16px;padding-top:20px;padding-right:18px;padding-bottom:20px;padding-left:18px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"clamp(24px, 3vw, 34px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:8px;font-size:clamp(24px, 3vw, 34px);font-style:normal;font-weight:900;line-height:1">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"15px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-white-color has-text-color" style="font-size:15px;font-style:normal;font-weight:800;line-height:1.45">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function stainCard(number, title, text) {
  return `
<!-- wp:column {"className":"som-stain-card","backgroundColor":"white","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"30px","right":"28px","bottom":"30px","left":"28px"}}}} -->
<div class="wp-block-column som-stain-card has-white-background-color has-background" style="border-radius:18px;padding-top:30px;padding-right:28px;padding-bottom:30px;padding-left:28px">
<!-- wp:paragraph {"textColor":"leaf","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<p class="has-leaf-color has-text-color" style="margin-bottom:14px;font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Care ${number}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"29px","lineHeight":"1.08","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:14px;font-size:29px;font-style:normal;font-weight:900;line-height:1.08">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"18px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:18px;line-height:1.55">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function fabricProof(stat, label) {
  return `
<!-- wp:column {"className":"som-fabric-proof","backgroundColor":"white","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"24px","right":"20px","bottom":"24px","left":"20px"}}}} -->
<div class="wp-block-column som-fabric-proof has-white-background-color has-background" style="border-radius:18px;padding-top:24px;padding-right:20px;padding-bottom:24px;padding-left:20px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"clamp(25px, 3.6vw, 38px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"10px"}}}} -->
<p class="has-grass-color has-text-color" style="margin-bottom:10px;font-size:clamp(25px, 3.6vw, 38px);font-style:normal;font-weight:900;line-height:1">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"16px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-soil-color has-text-color" style="font-size:16px;font-style:normal;font-weight:800;line-height:1.45">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function galleryStyleCard(number, title, text) {
  return `
<!-- wp:column {"className":"som-style-card","backgroundColor":"white","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"30px","right":"28px","bottom":"30px","left":"28px"}}}} -->
<div class="wp-block-column som-style-card has-white-background-color has-background" style="border-radius:18px;padding-top:30px;padding-right:28px;padding-bottom:30px;padding-left:28px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<p class="has-grass-color has-text-color" style="margin-bottom:14px;font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Style ${number}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"29px","lineHeight":"1.08","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:14px;font-size:29px;font-style:normal;font-weight:900;line-height:1.08">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"18px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:18px;line-height:1.55">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function galleryProof(stat, label) {
  return `
<!-- wp:column {"className":"som-gallery-proof","backgroundColor":"grass","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"24px","right":"20px","bottom":"24px","left":"20px"}}}} -->
<div class="wp-block-column som-gallery-proof has-grass-background-color has-background" style="border-radius:18px;padding-top:24px;padding-right:20px;padding-bottom:24px;padding-left:20px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"clamp(26px, 4vw, 40px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"10px"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:10px;font-size:clamp(26px, 4vw, 40px);font-style:normal;font-weight:900;line-height:1">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"16px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-white-color has-text-color" style="font-size:16px;font-style:normal;font-weight:800;line-height:1.45">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function colorSupportCard(number, title, text) {
  return `
<!-- wp:column {"className":"som-check-card","backgroundColor":"white","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"28px","right":"26px","bottom":"28px","left":"26px"}}}} -->
<div class="wp-block-column som-check-card has-white-background-color has-background" style="border-radius:8px;padding-top:28px;padding-right:26px;padding-bottom:28px;padding-left:26px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"850","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"12px"}}}} -->
<p class="has-grass-color has-text-color" style="margin-bottom:12px;font-size:14px;font-style:normal;font-weight:850;letter-spacing:0px;text-transform:uppercase">Room ${number}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|card-title","lineHeight":"1.1","fontStyle":"normal","fontWeight":"620"},"spacing":{"margin":{"bottom":"12px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:12px;font-size:var(--wp--preset--font-size--card-title);font-style:normal;font-weight:620;line-height:1.1">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.56"}}} -->
<p class="has-soil-color has-text-color" style="font-size:17px;line-height:1.56">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function colorProofCard(stat, label) {
  return `
<!-- wp:column {"className":"som-proof-card","backgroundColor":"cream","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"22px","right":"20px","bottom":"22px","left":"20px"}}}} -->
<div class="wp-block-column som-proof-card has-cream-background-color has-background" style="border-radius:8px;padding-top:22px;padding-right:20px;padding-bottom:22px;padding-left:20px">
<!-- wp:paragraph {"textColor":"leaf","style":{"typography":{"fontSize":"clamp(24px, 3vw, 34px)","lineHeight":"1","fontStyle":"normal","fontWeight":"760"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<p class="has-leaf-color has-text-color" style="margin-bottom:8px;font-size:clamp(24px, 3vw, 34px);font-style:normal;font-weight:760;line-height:1">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"15px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"760"}}} -->
<p class="has-deep-green-color has-text-color" style="font-size:15px;font-style:normal;font-weight:760;line-height:1.45">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function colorProcessStep(number, title, text) {
  return `
<!-- wp:group {"className":"som-color-process-step","backgroundColor":"white","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"22px","right":"24px","bottom":"22px","left":"24px"},"margin":{"bottom":"14px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-color-process-step has-white-background-color has-background" style="border-radius:8px;margin-bottom:14px;padding-top:22px;padding-right:24px;padding-bottom:22px;padding-left:24px">
<!-- wp:columns {"verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"18px"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"60px"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:60px">
<!-- wp:paragraph {"align":"center","backgroundColor":"sun","textColor":"deep-green","className":"som-color-step-number","style":{"typography":{"fontSize":"18px","lineHeight":"1","fontStyle":"normal","fontWeight":"800"},"spacing":{"padding":{"top":"12px","bottom":"12px"}}}} -->
<p class="has-text-align-center som-color-step-number has-deep-green-color has-sun-background-color has-text-color has-background" style="padding-top:12px;padding-bottom:12px;font-size:18px;font-style:normal;font-weight:800;line-height:1">0${number}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center"} -->
<div class="wp-block-column is-vertically-aligned-center">
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"24px","lineHeight":"1.12","fontStyle":"normal","fontWeight":"620"},"spacing":{"margin":{"bottom":"7px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:7px;font-size:24px;font-style:normal;font-weight:620;line-height:1.12">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:17px;line-height:1.5">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->`.trim();
}

function haulCard(number, title, text) {
  return `
<!-- wp:column {"className":"som-haul-card","backgroundColor":"white","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"30px","right":"28px","bottom":"30px","left":"28px"}}}} -->
<div class="wp-block-column som-haul-card has-white-background-color has-background" style="border-radius:18px;padding-top:30px;padding-right:28px;padding-bottom:30px;padding-left:28px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:14px;font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Load ${number}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"29px","lineHeight":"1.08","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:14px;font-size:29px;font-style:normal;font-weight:900;line-height:1.08">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"18px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:18px;line-height:1.55">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function haulTicket(items) {
  const rows = items.slice(0, 3).map((item) => `
<!-- wp:paragraph {"className":"som-ticket-line","textColor":"cream","style":{"typography":{"fontSize":"14px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"800"},"spacing":{"margin":{"top":"0","bottom":"8px"}}}} -->
<p class="som-ticket-line has-cream-color has-text-color" style="margin-top:0;margin-bottom:8px;font-size:14px;font-style:normal;font-weight:800;line-height:1.45"><strong>${esc(item.stat)}</strong> / ${esc(item.label)}</p>
<!-- /wp:paragraph -->`).join("\n");

  return `
<!-- wp:group {"className":"som-haul-ticket","backgroundColor":"grass","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"18px","right":"18px","bottom":"10px","left":"18px"},"margin":{"top":"28px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-haul-ticket has-grass-background-color has-background" style="border-radius:18px;margin-top:28px;padding-top:18px;padding-right:18px;padding-bottom:10px;padding-left:18px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"10px"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:10px;font-size:13px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Haul ticket</p>
<!-- /wp:paragraph -->
${rows}
</div>
<!-- /wp:group -->`.trim();
}

function haulProof(stat, label) {
  return `
<!-- wp:column {"className":"som-haul-proof","backgroundColor":"deep-green","style":{"border":{"radius":"16px"},"spacing":{"padding":{"top":"22px","right":"20px","bottom":"22px","left":"20px"}}}} -->
<div class="wp-block-column som-haul-proof has-deep-green-background-color has-background" style="border-radius:16px;padding-top:22px;padding-right:20px;padding-bottom:22px;padding-left:20px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"clamp(24px, 3vw, 36px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:8px;font-size:clamp(24px, 3vw, 36px);font-style:normal;font-weight:900;line-height:1">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"15px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-white-color has-text-color" style="font-size:15px;font-style:normal;font-weight:800;line-height:1.45">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function haulStep(number, title, text) {
  return `
<!-- wp:group {"className":"som-haul-step","backgroundColor":"white","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"22px","right":"24px","bottom":"22px","left":"24px"},"margin":{"bottom":"14px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-haul-step has-white-background-color has-background" style="border-radius:18px;margin-bottom:14px;padding-top:22px;padding-right:24px;padding-bottom:22px;padding-left:24px">
<!-- wp:columns {"verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"20px"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"68px"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:68px">
<!-- wp:paragraph {"align":"center","backgroundColor":"sun","textColor":"deep-green","className":"som-haul-number","style":{"typography":{"fontSize":"20px","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"padding":{"top":"14px","bottom":"14px"}}}} -->
<p class="has-text-align-center som-haul-number has-deep-green-color has-sun-background-color has-text-color has-background" style="padding-top:14px;padding-bottom:14px;font-size:20px;font-style:normal;font-weight:900;line-height:1">0${number}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center"} -->
<div class="wp-block-column is-vertically-aligned-center">
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"27px","lineHeight":"1.1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:8px;font-size:27px;font-style:normal;font-weight:900;line-height:1.1">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"18px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:18px;line-height:1.5">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->`.trim();
}

function riskPlanStep(number, title, text) {
  return `
<!-- wp:column {"className":"som-plan-step","backgroundColor":"white","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"30px","right":"28px","bottom":"30px","left":"28px"}}}} -->
<div class="wp-block-column som-plan-step has-white-background-color has-background" style="border-radius:18px;padding-top:30px;padding-right:28px;padding-bottom:30px;padding-left:28px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:16px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Plan ${number}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"28px","lineHeight":"1.1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:14px;font-size:28px;font-style:normal;font-weight:900;line-height:1.1">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"18px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:18px;line-height:1.55">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function timelineStep(number, title, text) {
  return `
<!-- wp:group {"className":"som-timeline-step","style":{"spacing":{"padding":{"top":"8px","bottom":"28px"},"margin":{"bottom":"18px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-timeline-step" style="margin-bottom:18px;padding-top:8px;padding-bottom:28px">
<!-- wp:columns {"verticalAlignment":"top","style":{"spacing":{"blockGap":{"left":"22px"}}}} -->
<div class="wp-block-columns are-vertically-aligned-top">
<!-- wp:column {"verticalAlignment":"top","width":"86px"} -->
<div class="wp-block-column is-vertically-aligned-top" style="flex-basis:86px">
<!-- wp:paragraph {"align":"center","backgroundColor":"deep-green","textColor":"sun","className":"som-timeline-number","style":{"typography":{"fontSize":"18px","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"padding":{"top":"18px","bottom":"18px"}}}} -->
<p class="has-text-align-center som-timeline-number has-sun-color has-deep-green-background-color has-text-color has-background" style="padding-top:18px;padding-bottom:18px;font-size:18px;font-style:normal;font-weight:900;line-height:1">0${number}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"top"} -->
<div class="wp-block-column is-vertically-aligned-top">
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"32px","lineHeight":"1.08","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"10px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:10px;font-size:32px;font-style:normal;font-weight:900;line-height:1.08">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"19px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:19px;line-height:1.55">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->`.trim();
}

function compactProof(stat, label) {
  return `
<!-- wp:column {"className":"som-proof-card","backgroundColor":"grass","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"24px","right":"20px","bottom":"24px","left":"20px"}}}} -->
<div class="wp-block-column som-proof-card has-grass-background-color has-background" style="border-radius:18px;padding-top:24px;padding-right:20px;padding-bottom:24px;padding-left:20px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"clamp(26px, 4vw, 40px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"10px"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:10px;font-size:clamp(26px, 4vw, 40px);font-style:normal;font-weight:900;line-height:1">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"16px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-white-color has-text-color" style="font-size:16px;font-style:normal;font-weight:800;line-height:1.45">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function processStep(number, title, text) {
  return `
<!-- wp:column {"className":"som-process-card","backgroundColor":"grass","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"30px","right":"28px","bottom":"30px","left":"28px"}}}} -->
<div class="wp-block-column som-process-card has-grass-background-color has-background" style="border-radius:18px;padding-top:30px;padding-right:28px;padding-bottom:30px;padding-left:28px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"18px","fontStyle":"normal","fontWeight":"900"}}} -->
<p class="has-sun-color has-text-color" style="font-size:18px;font-style:normal;font-weight:900">Step ${number}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3,"textColor":"white","style":{"typography":{"fontSize":"28px","lineHeight":"1.1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<h3 class="wp-block-heading has-white-color has-text-color" style="margin-bottom:14px;font-size:28px;font-style:normal;font-weight:900;line-height:1.1">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"18px","lineHeight":"1.55"}}} -->
<p class="has-white-color has-text-color" style="font-size:18px;line-height:1.55">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function proofStat(stat, label) {
  return `
<!-- wp:column {"className":"som-proof-card","backgroundColor":"cream","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"30px","right":"26px","bottom":"30px","left":"26px"}}}} -->
<div class="wp-block-column som-proof-card has-cream-background-color has-background" style="border-radius:18px;padding-top:30px;padding-right:26px;padding-bottom:30px;padding-left:26px">
<!-- wp:paragraph {"align":"center","textColor":"grass","style":{"typography":{"fontSize":"clamp(38px, 5vw, 64px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"}}} -->
<p class="has-text-align-center has-grass-color has-text-color" style="font-size:clamp(38px, 5vw, 64px);font-style:normal;font-weight:900;line-height:1">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"align":"center","textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-text-align-center has-soil-color has-text-color" style="font-size:17px;font-style:normal;font-weight:800;line-height:1.45">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function routePlanCard(number, title, text) {
  return `
<!-- wp:column {"className":"som-route-plan-card","backgroundColor":"white","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"24px","right":"22px","bottom":"24px","left":"22px"}}}} -->
<div class="wp-block-column som-route-plan-card has-white-background-color has-background" style="border-radius:8px;padding-top:24px;padding-right:22px;padding-bottom:24px;padding-left:22px">
<!-- wp:paragraph {"className":"som-route-card-number","textColor":"grass","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"16px"}}}} -->
<p class="som-route-card-number has-grass-color has-text-color" style="margin-bottom:16px;font-size:13px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Lane ${number}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"24px","lineHeight":"1.1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"12px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:12px;font-size:24px;font-style:normal;font-weight:900;line-height:1.1">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:17px;line-height:1.5">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function routeProcessCard(number, title, text) {
  return `
<!-- wp:group {"className":"som-route-process-card","backgroundColor":"mist","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"18px","right":"18px","bottom":"18px","left":"18px"},"margin":{"top":"14px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-route-process-card has-mist-background-color has-background" style="border-radius:8px;margin-top:14px;padding-top:18px;padding-right:18px;padding-bottom:18px;padding-left:18px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"7px"}}}} -->
<p class="has-grass-color has-text-color" style="margin-bottom:7px;font-size:13px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Route note ${number}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"17px","lineHeight":"1.42","fontStyle":"normal","fontWeight":"850"}}} -->
<p class="has-deep-green-color has-text-color" style="font-size:17px;font-style:normal;font-weight:850;line-height:1.42">${esc(title)}: ${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->`.trim();
}

function routeTableRow(number, title, text) {
  return `<tr><td>${number}</td><td>${esc(title)}</td><td>${esc(text)}</td></tr>`;
}

function routeProofCard(stat, label) {
  return `
<!-- wp:column {"className":"som-route-proof-card","backgroundColor":"white","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"24px","right":"22px","bottom":"24px","left":"22px"}}}} -->
<div class="wp-block-column som-route-proof-card has-white-background-color has-background" style="border-radius:8px;padding-top:24px;padding-right:22px;padding-bottom:24px;padding-left:22px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"clamp(28px, 4vw, 46px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"10px"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:10px;font-size:clamp(28px, 4vw, 46px);font-style:normal;font-weight:900;line-height:1">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"16px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-deep-green-color has-text-color" style="font-size:16px;font-style:normal;font-weight:800;line-height:1.45">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function buildOutputReadme(spec) {
  return `# ${spec.businessName}

Generated WordPress Studio / Playground Blueprint.

## Import

Use \`public/blueprints/${spec.slug}/blueprint.json\` as the Studio-ready Blueprint file. It is self-contained and embeds the hero image, logo, and favicon in the PHP setup step.

The ZIP includes the same root \`blueprint.json\`, an \`asset-manifest.json\`, plus asset files for inspection and Playground/CLI distribution.

## What It Builds

- Switches to \`${spec.themeSlug}\` when that default theme exists.
- Imports the embedded hero image, logo, and favicon into the Media Library.
- Sets the site logo and site icon.
- Creates a one-page ${spec.niche || "service business"} homepage using core blocks only.
- Creates a front-page block template so the default theme does not wrap the site with its stock header, title, or footer.
- Applies the site palette and typography through WordPress global styles/settings, with a core custom CSS fallback for first-load palette classes.
- Uses the \`${layoutVariantFor(spec)}\` layout archetype.
`;
}

function buildPreviewNotes(spec) {
  return `# Preview Notes

This Blueprint JSON is self-contained. Public Playground previews can use the hosted CORS route:

\`\`\`text
https://playground.wordpress.net/?blueprint-url=<encoded-public-url>/api/blueprints/${spec.slug}/blueprint.json
\`\`\`

For WordPress Studio, import \`public/blueprints/${spec.slug}/blueprint.json\`.
`;
}

async function writeBundle(outDir, bundleName) {
  const bundlePath = path.join(outDir, bundleName);
  const entries = [
    "blueprint.json",
    "asset-manifest.json",
    ...(await listFilesForBundle(path.join(outDir, "assets"), "assets"))
  ];
  await Promise.all(entries.map((entry) => fs.utimes(path.join(outDir, entry), BUNDLE_MTIME, BUNDLE_MTIME)));
  await execFileAsync("zip", ["-Xq", bundlePath, ...entries], { cwd: outDir });
}

async function listFilesForBundle(directory, relativeDirectory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFilesForBundle(absolutePath, relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
}

function phpString(value) {
  return `'${String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\r/g, "")}'`;
}

function mimeTypeForPath(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }
  if (extension === ".png") {
    return "image/png";
  }
  if (extension === ".webp") {
    return "image/webp";
  }
  throw new Error(`Unsupported asset type: ${filePath}`);
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
