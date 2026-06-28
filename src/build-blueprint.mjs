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
    "som-zone-anchor-strip": "som-organizing-anchor-strip",
    "som-zone-anchor-nav": "som-organizing-anchor-nav",
    "som-zone-anchor-action": "som-organizing-anchor-action",
    "som-zone-map": "som-shelf-map",
    "som-zone-proof": "som-reset-proof",
    "som-zone-card": "som-shelf-card",
    "som-zone-step": "som-reset-step",
    "som-zone-note": "som-shelf-note"
  },
  "route-led-schedule": {
    "som-route-page": "som-plant-route-page",
    "som-route-header": "som-plant-route-header",
    "som-route-hero": "som-plant-route-hero",
    "som-route-hero-photo": "som-plant-route-photo",
    "som-route-status-board": "som-plant-care-board",
    "som-route-board-row": "som-plant-board-row",
    "som-route-plans": "som-plant-plans",
    "som-route-plan-grid": "som-plant-plan-grid",
    "som-route-plan-card": "som-plant-plan-card",
    "som-route-card-number": "som-plant-card-number",
    "som-route-notes": "som-plant-notes",
    "som-route-process-card": "som-plant-process-card",
    "som-proof-card": "som-plant-proof-card",
    "som-route-proof-board": "som-plant-proof-board",
    "som-route-proof-card": "som-plant-route-proof-card",
    "som-route-table": "som-plant-note-table",
    "som-route-detail": "som-plant-route-detail",
    "som-route-join": "som-plant-join",
    "som-route-quote-card": "som-plant-quote-card",
    "som-route-footer": "som-plant-route-footer"
  },
  "story-card-consult": {
    "som-checklist-hero": "som-story-hero",
    "som-urgency-band": "som-story-proof-band",
    "som-check-card": "som-support-card",
    "som-proof-card": "som-family-proof-card",
    "som-quote-strip": "som-consult-quote-strip"
  },
  "plant-care-story": plantStoryFingerprint(),
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
  "deck-finish-sample-board": workshopFingerprint("deck"),
  "pet-portrait-gallery": galleryFingerprint("pet"),
  "pet-portrait-booking-dock": fixedActionFingerprint("pet"),
  "pollinator-season-board": zoneFingerprint("pollinator"),
  "dessert-table-gallery": galleryFingerprint("dessert"),
  "balloon-backdrop-gallery": galleryFingerprint("balloon"),
  "picnic-proposal-lookbook": galleryFingerprint("picnic"),
  "headshot-proof-gallery": galleryFingerprint("headshot"),
  "headshot-prep-ledger": receiptFingerprint("headshot"),
  "window-scope-ledger": beforeAfterFingerprint("window"),
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
    "som-proof-gallery": `som-${prefix}-proof-gallery`,
    "som-gallery-quote": `som-${prefix}-gallery-quote`,
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
    "som-menu-table": `som-${prefix}-menu-table`,
    "som-menu-event": `som-${prefix}-menu-event`,
    "som-menu-step": `som-${prefix}-menu-step`,
    "som-quote-strip": `som-${prefix}-quote-strip`
  };
}

function storyFingerprint(prefix) {
  return {
    "som-checklist-hero": `som-${prefix}-story-hero`,
    "som-story-anchor-strip": `som-${prefix}-anchor-strip`,
    "som-story-anchor-label": `som-${prefix}-anchor-label`,
    "som-story-anchor-nav": `som-${prefix}-anchor-nav`,
    "som-story-anchor-action": `som-${prefix}-anchor-action`,
    "som-urgency-band": `som-${prefix}-proof-band`,
    "som-check-card": `som-${prefix}-support-card`,
    "som-check-detail": `som-${prefix}-detail`,
    "som-check-quote": `som-${prefix}-quote`,
    "som-proof-card": `som-${prefix}-proof-card`,
    "som-quote-strip": `som-${prefix}-consult-strip`
  };
}

function plantStoryFingerprint() {
  return {
    ...storyFingerprint("plant"),
    "som-checklist-hero": "som-story-hero som-plant-story-hero",
    "som-urgency-band": "som-story-proof-band som-plant-proof-band",
    "som-check-card": "som-support-card som-plant-support-card",
    "som-proof-card": "som-plant-proof-card",
    "som-check-detail": "som-plant-detail",
    "som-check-quote": "som-plant-quote",
    "som-story-process-step": "som-plant-process-step",
    "som-story-step-number": "som-plant-step-number",
    "som-quote-strip": "som-consult-quote-strip som-plant-consult-strip"
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
    "som-detail-scope-table": `som-${prefix}-scope-table`,
    "som-detail-quote": `som-${prefix}-quote`,
    "som-detail-detail": `som-${prefix}-detail`,
    "som-detail-step": `som-${prefix}-step`,
    "som-mobile-action-bar": `som-${prefix}-action-dock`,
    "som-quote-strip": `som-${prefix}-quote-strip`
  };
}

function zoneFingerprint(prefix) {
  return {
    "som-zone-page": `som-${prefix}-page`,
    "som-zone-header": `som-${prefix}-header`,
    "som-zone-hero": `som-${prefix}-hero`,
    "som-zone-photo": `som-${prefix}-photo`,
    "som-zone-anchor-strip": `som-${prefix}-anchor-strip`,
    "som-zone-anchor-nav": `som-${prefix}-anchor-nav`,
    "som-zone-anchor-action": `som-${prefix}-anchor-action`,
    "som-zone-map": `som-${prefix}-map`,
    "som-zone-proof": `som-${prefix}-proof`,
    "som-zone-card": `som-${prefix}-card`,
    "som-zone-step": `som-${prefix}-step`,
    "som-zone-note": `som-${prefix}-note`,
    "som-quote-strip": `som-${prefix}-quote-strip`
  };
}

function receiptFingerprint(prefix) {
  return {
    "som-receipt-page": `som-${prefix}-page`,
    "som-receipt-header": `som-${prefix}-header`,
    "som-receipt-header-action": `som-${prefix}-header-action`,
    "som-receipt-hero-shell": `som-${prefix}-hero-shell`,
    "som-receipt-hero": `som-${prefix}-hero`,
    "som-receipt-card": `som-${prefix}-card`,
    "som-receipt-proof-strip": `som-${prefix}-proof-strip`,
    "som-receipt-proof": `som-${prefix}-proof`,
    "som-receipt-scope": `som-${prefix}-scope`,
    "som-receipt-table": `som-${prefix}-table`,
    "som-receipt-safety": `som-${prefix}-safety`,
    "som-receipt-step": `som-${prefix}-step`,
    "som-receipt-details": `som-${prefix}-details`,
    "som-receipt-detail": `som-${prefix}-detail`,
    "som-receipt-anchor-strip": `som-${prefix}-anchor-strip`,
    "som-receipt-anchor-nav": `som-${prefix}-anchor-nav`,
    "som-receipt-anchor-action": `som-${prefix}-anchor-action`,
    "som-quote-strip": `som-${prefix}-quote-strip`,
    "som-footer": `som-${prefix}-footer`
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
    "som-side-rail-quote": `som-${prefix}-rail-quote`,
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
    "som-workshop-scope-table": `som-${prefix}-scope-table`,
    "som-workshop-quote": `som-${prefix}-quote`,
    "som-care-note": `som-${prefix}-care-note`,
    "som-workshop-detail": `som-${prefix}-detail`,
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
    "som-floating-proof-action": `som-${prefix}-floating-proof-action`,
    "som-quote-strip": `som-${prefix}-quote-strip`,
    "som-surface-row": `som-${prefix}-surface-row`,
    "som-method-pill": `som-${prefix}-method-pill`,
    "som-method-table": `som-${prefix}-method-table`,
    "som-method-detail": `som-${prefix}-method-detail`,
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
  const designTokens = buildDesignTokens(spec);
  const tokens = designTokens.typography;
  const actionProps = {
    "font-weight": tokens.actionWeight
  };
  const labelProps = {
    "font-weight": tokens.labelWeight || tokens.actionWeight
  };

  const normalized = markup
    .replace(/<!-- wp:(heading|button|navigation|paragraph)(\s+\{[^]*?\})?\s*-->/g, (match, blockName, rawAttributes = "") => {
      if (!rawAttributes.trim()) {
        return match;
      }
      try {
        const attrs = JSON.parse(rawAttributes.trim());
        attrs.style = attrs.style || {};
        attrs.style.typography = attrs.style.typography || {};
        if (blockName === "heading") {
          const level = Number(attrs.level || 2);
          attrs.style.typography.fontSize = headingFontSizeForLevel(level);
          attrs.style.typography.fontWeight = tokens.headingWeight;
          attrs.style.typography.lineHeight = tokens.headingLineHeight;
        } else if (blockName === "button") {
          attrs.style.typography.fontWeight = tokens.actionWeight;
        } else if (blockName === "navigation") {
          attrs.style.typography.fontWeight = tokens.navWeight;
        } else if (blockName === "paragraph" && paragraphUsesUtilityTypography(attrs)) {
          attrs.style.typography.fontWeight = tokens.labelWeight || tokens.actionWeight;
        }
        return `<!-- wp:${blockName} ${JSON.stringify(attrs)} -->`;
      } catch {
        return match;
      }
    })
    .replace(/(<h([1-6])\b[^>]*\bstyle=")([^"]*)("[^>]*>)/g, (_match, before, level, style, after) => {
      return `${before}${rewriteInlineStyle(style, headingPropsForLevel(Number(level), tokens))}${after}`;
    })
    .replace(/(<div\b(?=[^>]*\bwp-block-button\b)[^>]*\bstyle=")([^"]*)("[^>]*>)/g, (_match, before, style, after) => {
      return `${before}${rewriteInlineStyle(style, actionProps)}${after}`;
    })
    .replace(/(<a\b(?=[^>]*\bwp-block-button__link\b)[^>]*\bstyle=")([^"]*)("[^>]*>)/g, (_match, before, style, after) => {
      return `${before}${rewriteInlineStyle(style, actionProps)}${after}`;
    })
    .replace(/(<p\b[^>]*\bstyle=")([^"]*)("[^>]*>)/gi, (match, before, style, after) => {
      if (!/text-transform:\s*uppercase/i.test(style) && !isUtilityTypographyClass(`${before} ${after}`)) {
        return match;
      }
      return `${before}${rewriteInlineStyle(style, labelProps)}${after}`;
    });

  const colorNormalized = normalizePageColorRoles(normalized, designTokens.colorRoles);
  return normalizeProofParagraphTypography(colorNormalized, tokens);
}

function normalizePageColorRoles(markup, colorRoles) {
  const actionSlug = colorClassSlug(colorRoles?.action?.token || "sun");
  const inkSlug = colorClassSlug(colorRoles?.ink?.token || "deepGreen");

  return markup
    .replace(/<!-- wp:button(\s+\{[^]*?\})?\s*-->/g, (match, rawAttributes = "") => {
      if (!rawAttributes.trim()) {
        return match;
      }
      try {
        const attrs = JSON.parse(rawAttributes.trim());
        if (attrs.backgroundColor === "sun") {
          attrs.backgroundColor = actionSlug;
        }
        if (attrs.textColor === "deep-green") {
          attrs.textColor = inkSlug;
        }
        return `<!-- wp:button ${JSON.stringify(attrs)} -->`;
      } catch {
        return match;
      }
    })
    .replace(/(<a\b(?=[^>]*\bwp-block-button__link\b)[^>]*\bclass=")([^"]*)("[^>]*>)/g, (_match, before, className, after) => {
      const rewrittenClassName = className
        .replace(/\bhas-sun-background-color\b/g, `has-${actionSlug}-background-color`)
        .replace(/\bhas-deep-green-color\b/g, `has-${inkSlug}-color`);
      return `${before}${rewrittenClassName}${after}`;
    });
}

function colorClassSlug(token) {
  return String(token || "")
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

function paragraphUsesUtilityTypography(attrs) {
  const typography = attrs?.style?.typography || {};
  return /uppercase/i.test(String(typography.textTransform || ""))
    || isUtilityTypographyClass(attrs?.className);
}

function isUtilityTypographyClass(className) {
  return /\bsom-(?:chip|method-pill|ticket-line|rail-note|date-cell|section-anchor-label|[a-z-]+number)\b/.test(String(className || ""));
}

function normalizeProofParagraphTypography(markup, tokens) {
  const labelWeight = Number.parseInt(tokens.labelWeight || tokens.actionWeight, 10);
  const weightCap = Number.isFinite(labelWeight) ? Math.min(labelWeight, 780) : 760;
  const proofClassPattern = [
    "som-proof-card",
    "som-route-proof-card",
    "som-evidence-card",
    "som-floating-proof-cell",
    "som-floral-proof-card",
    "som-process-card"
  ].join("|");
  const containerPattern = new RegExp(`(<div\\b(?=[^>]*\\b(?:${proofClassPattern})\\b)[^>]*>[\\s\\S]*?<\\/div>)`, "g");

  return markup.replace(containerPattern, (container) => {
    return container.replace(/(<p\b[^>]*\bstyle=")([^"]*)("[^>]*>)/gi, (match, before, style, after) => {
      const currentWeight = Number.parseInt(style.match(/font-weight:\s*([0-9]+)/i)?.[1] || "", 10);
      if (!Number.isFinite(currentWeight) || currentWeight <= weightCap) {
        return match;
      }
      return `${before}${rewriteInlineStyle(style, { "font-weight": String(weightCap) })}${after}`;
    });
  });
}

function headingPropsForLevel(level, tokens) {
  return {
    "font-size": headingFontSizeForLevel(level),
    "font-weight": tokens.headingWeight,
    "line-height": tokens.headingLineHeight
  };
}

function headingFontSizeForLevel(level) {
  if (level === 1) {
    return "clamp(2.25rem, 5vw, var(--wp--preset--font-size--hero))";
  }
  if (level === 2) {
    return "clamp(1.95rem, 4vw, var(--wp--preset--font-size--section-title))";
  }
  return "clamp(1.25rem, 2vw, var(--wp--preset--font-size--card-title))";
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

  if (layoutVariant === "headshot-proof-gallery") {
    content = buildHeadshotProofGalleryPageContent(spec);
  } else if (layoutVariant === "dessert-table-gallery") {
    content = buildDessertTableGalleryPageContent(spec);
  } else if (layoutVariant === "color-consult-story") {
    content = buildColorConsultStoryPageContent(spec);
  } else if (layoutVariant === "story-card-consult" || layoutVariant === "plant-care-story") {
    content = buildStoryCardConsultPageContent(spec);
  } else if (layoutVariant === "turnover-receipt-board") {
    content = buildTurnoverReceiptBoardPageContent(spec);
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
  const styles = spec.services.map((item, index) => galleryStyleCard(index + 1, item.title, item.text, { variant: layoutVariantFor(spec) })).join("\n");
  const process = spec.process.map((item, index) => processStep(index + 1, item.title, item.text)).join("\n");
  const menuItems = spec.proof.map((item, index) => dessertMenuBoardItem(index + 1, item.stat, item.label)).join("\n");

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
<!-- wp:column {"verticalAlignment":"bottom","width":"56%","className":"som-gallery-copy","backgroundColor":"white","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"32px","right":"34px","bottom":"32px","left":"34px"}}}} -->
<div class="wp-block-column is-vertically-aligned-bottom som-gallery-copy has-white-background-color has-background" style="border-radius:8px;padding-top:32px;padding-right:34px;padding-bottom:32px;padding-left:34px;flex-basis:56%">
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
<!-- wp:button {"backgroundColor":"leaf","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"13px","bottom":"13px","left":"20px","right":"20px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-leaf-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:6px;padding-top:13px;padding-right:20px;padding-bottom:13px;padding-left:20px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"13px","bottom":"13px","left":"20px","right":"20px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button is-style-outline" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-text-color wp-element-button" href="#${esc(anchorAt(navLinks, 0, "styles"))}" style="border-radius:6px;padding-top:13px;padding-right:20px;padding-bottom:13px;padding-left:20px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"bottom","width":"44%","className":"som-gallery-note som-dessert-menu-board","backgroundColor":"cream","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"26px","right":"26px","bottom":"24px","left":"26px"}}}} -->
<div class="wp-block-column is-vertically-aligned-bottom som-gallery-note som-dessert-menu-board has-cream-background-color has-background" style="border-radius:8px;padding-top:26px;padding-right:26px;padding-bottom:24px;padding-left:26px;flex-basis:44%">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"850","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:13px;font-style:normal;font-weight:850;letter-spacing:0px;text-transform:uppercase">${esc(copy.introTitle)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"16px","lineHeight":"1.45"},"spacing":{"margin":{"top":"8px","bottom":"14px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-top:8px;margin-bottom:14px;font-size:16px;line-height:1.45">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
${menuItems}
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div></div>
<!-- /wp:cover -->

<!-- wp:group {"metadata":{"name":"Styles"},"anchor":"styles","align":"full","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"72px","right":"24px","bottom":"72px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="styles" class="wp-block-group alignfull has-cream-background-color has-background" style="padding-top:72px;padding-right:24px;padding-bottom:72px;padding-left:24px">
<!-- wp:columns {"align":"wide","verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"38px"}}}} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"40%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:40%">
<!-- wp:heading {"level":2,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(32px, 4vw, 50px)","lineHeight":"1.08","fontStyle":"normal","fontWeight":"620"},"spacing":{"margin":{"bottom":"16px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:16px;font-size:clamp(32px, 4vw, 50px);font-style:normal;font-weight:620;line-height:1.08">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:quote {"className":"som-gallery-quote som-dessert-gallery-quote som-dessert-client-quote"} -->
<blockquote class="wp-block-quote som-gallery-quote som-dessert-gallery-quote som-dessert-client-quote"><p>${esc(copy.introText)}</p><cite>${esc(spec.businessName)} event planning note</cite></blockquote>
<!-- /wp:quote -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"60%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:60%">
<!-- wp:gallery {"linkTo":"none","columns":3,"imageCrop":true,"className":"som-proof-gallery som-dessert-proof-gallery"} -->
<figure class="wp-block-gallery has-nested-images columns-3 is-cropped som-proof-gallery som-dessert-proof-gallery">
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
<!-- wp:buttons {"className":"som-color-header-action","style":{"spacing":{"blockGap":"10px"}}} -->
<div class="wp-block-buttons som-color-header-action">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"10px","bottom":"10px","left":"16px","right":"16px"}},"typography":{"fontStyle":"normal","fontWeight":"780"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:780"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:999px;padding-top:10px;padding-right:16px;padding-bottom:10px;padding-left:16px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
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
<!-- wp:quote {"className":"som-check-quote som-color-quote som-color-consult-quote"} -->
<blockquote class="wp-block-quote som-check-quote som-color-quote som-color-consult-quote"><p>${esc(copy.introText)}</p><cite>Palette note from ${esc(spec.businessName)}</cite></blockquote>
<!-- /wp:quote -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"62%"} -->
<div class="wp-block-column" style="flex-basis:62%">
${process}
<!-- wp:details {"className":"som-check-detail som-color-detail"} -->
<details class="wp-block-details som-check-detail som-color-detail"><summary>What should I send before a palette consult?</summary><!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:17px;line-height:1.5">Room photos in daylight and evening light, current paint names if you know them, fixed finishes, one color you like, and one color that keeps bothering you.</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->
<!-- wp:details {"className":"som-check-detail som-color-detail"} -->
<details class="wp-block-details som-check-detail som-color-detail"><summary>Can you work with samples I already bought?</summary><!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.5"}}} -->
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

function buildStoryCardConsultPageContent(spec) {
  const { copy, contact } = spec;
  const navLinks = navModelForSpec(spec, ["Support", "Steps", "Consult"], ["support", "steps", "quote"]);
  const supportAnchor = anchorAt(navLinks, 0, "support");
  const stepsAnchor = anchorAt(navLinks, 1, "steps");
  const services = spec.services.map((item, index) => storySupportCard(index + 1, item.title, item.text)).join("\n");
  const proof = spec.proof.map((item) => storyProofCard(item.stat, item.label)).join("\n");
  const process = spec.process.map((item, index) => storyProcessStep(index + 1, item.title, item.text)).join("\n");
  const consultQuote = storyConsultQuote(spec);
  const details = storyConsultDetails(spec);
  const heroBullets = storyHeroBullets(spec).map((item) => `<!-- wp:list-item --><li>${esc(item)}</li><!-- /wp:list-item -->`).join("");
  const finalEmailLabel = storyFinalEmailLabel(spec);
  const proofSectionName = storyProofSectionName(spec);
  const navWeight = storyNavWeight(spec);
  const actionWeight = storyActionWeight(spec);
  const heroListWeight = storyHeroListWeight(spec);
  const phoneLineWeight = storyPhoneLineWeight(spec);

  return `
<!-- wp:group {"align":"full","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"18px","right":"24px","bottom":"18px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull has-cream-background-color has-background" style="padding-top:18px;padding-right:24px;padding-bottom:18px;padding-left:24px">
<!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide">
<!-- wp:site-logo {"width":250,"shouldSyncIcon":true} /-->
<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"${navWeight}"}}} -->
${navigationLinkBlocks(navLinks)}
<!-- /wp:navigation -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->

<!-- wp:media-text {"align":"full","mediaPosition":"left","mediaId":{{hero_id}},"mediaLink":"{{hero_url}}","mediaType":"image","mediaWidth":44,"imageFill":true,"className":"som-checklist-hero","style":{"spacing":{"padding":{"top":"0","right":"24px","bottom":"0","left":"24px"}}}} -->
<div class="wp-block-media-text alignfull is-stacked-on-mobile is-image-fill som-checklist-hero" style="padding-top:0;padding-right:24px;padding-bottom:0;padding-left:24px;grid-template-columns:44% auto">
<figure class="wp-block-media-text__media" style="background-image:url({{hero_url}});background-position:50% 50%"><img src="{{hero_url}}" alt="${esc(spec.assetMeta.hero.alt)}" class="wp-image-{{hero_id}} size-full"/></figure>
<div class="wp-block-media-text__content">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"820","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:14px;font-style:normal;font-weight:820;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(38px, 4.8vw, 66px)","lineHeight":"1.07","fontStyle":"normal","fontWeight":"640"},"spacing":{"margin":{"top":"12px","bottom":"18px"}}}} -->
<h1 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:12px;margin-bottom:18px;font-size:clamp(38px, 4.8vw, 66px);font-style:normal;font-weight:640;line-height:1.07">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"clamp(19px, 1.8vw, 24px)","lineHeight":"1.56"},"spacing":{"margin":{"bottom":"24px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-bottom:24px;font-size:clamp(19px, 1.8vw, 24px);line-height:1.56">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"13px","bottom":"13px","left":"20px","right":"20px"}},"typography":{"fontStyle":"normal","fontWeight":"${actionWeight}"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:${actionWeight}"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:6px;padding-top:13px;padding-right:20px;padding-bottom:13px;padding-left:20px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
<!-- wp:paragraph {"className":"som-story-phone-line","textColor":"soil","style":{"typography":{"fontSize":"16px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"${phoneLineWeight}"},"spacing":{"margin":{"top":"16px","bottom":"0"}}}} -->
<p class="som-story-phone-line has-soil-color has-text-color" style="margin-top:16px;margin-bottom:0;font-size:16px;font-style:normal;font-weight:${phoneLineWeight};line-height:1.45">Prefer to talk it through? <a href="${esc(contact.phoneHref)}">${esc(contact.phoneLabel)}</a></p>
<!-- /wp:paragraph -->
<!-- wp:list {"className":"som-story-check-list","style":{"typography":{"fontSize":"17px","lineHeight":"1.5","fontWeight":"${heroListWeight}"},"spacing":{"margin":{"top":"24px","bottom":"0"}}}} -->
<ul class="som-story-check-list" style="margin-top:24px;margin-bottom:0;font-size:17px;font-weight:${heroListWeight};line-height:1.5">${heroBullets}</ul>
<!-- /wp:list -->
</div>
</div>
<!-- /wp:media-text -->

<!-- wp:group {"metadata":{"name":"${esc(proofSectionName)}"},"align":"full","className":"som-urgency-band","backgroundColor":"white","style":{"spacing":{"padding":{"top":"36px","right":"24px","bottom":"36px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull som-urgency-band has-white-background-color has-background" style="padding-top:36px;padding-right:24px;padding-bottom:36px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"14px"}}}} -->
<div class="wp-block-columns alignwide">
${proof}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Support checklist"},"anchor":"${esc(supportAnchor)}","align":"full","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"74px","right":"24px","bottom":"74px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="${esc(supportAnchor)}" class="wp-block-group alignfull has-cream-background-color has-background" style="padding-top:74px;padding-right:24px;padding-bottom:74px;padding-left:24px">
<!-- wp:heading {"level":2,"align":"wide","textColor":"deep-green","style":{"typography":{"fontSize":"clamp(32px, 4vw, 50px)","lineHeight":"1.08","fontStyle":"normal","fontWeight":"640"},"spacing":{"margin":{"bottom":"26px"}}}} -->
<h2 class="wp-block-heading alignwide has-deep-green-color has-text-color" style="margin-bottom:26px;font-size:clamp(32px, 4vw, 50px);font-style:normal;font-weight:640;line-height:1.08">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"20px"}}}} -->
<div class="wp-block-columns alignwide">
${services}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Consult steps"},"anchor":"${esc(stepsAnchor)}","align":"full","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"74px","right":"24px","bottom":"74px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="${esc(stepsAnchor)}" class="wp-block-group alignfull has-mist-background-color has-background" style="padding-top:74px;padding-right:24px;padding-bottom:74px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"40px"}}}} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"38%"} -->
<div class="wp-block-column" style="flex-basis:38%">
<!-- wp:heading {"level":2,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(31px, 3.8vw, 48px)","lineHeight":"1.08","fontStyle":"normal","fontWeight":"640"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:18px;font-size:clamp(31px, 3.8vw, 48px);font-style:normal;font-weight:640;line-height:1.08">${esc(copy.processTitle)}</h2>
<!-- /wp:heading -->
${consultQuote}
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"62%"} -->
<div class="wp-block-column" style="flex-basis:62%">
${process}
${details}
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Consult quote"},"anchor":"quote","align":"full","className":"som-quote-strip","backgroundColor":"white","style":{"spacing":{"padding":{"top":"68px","right":"24px","bottom":"34px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="quote" class="wp-block-group alignfull som-quote-strip has-white-background-color has-background" style="padding-top:68px;padding-right:24px;padding-bottom:34px;padding-left:24px">
<!-- wp:columns {"align":"wide","verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"42px"}}}} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"60%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:60%">
<!-- wp:heading {"level":2,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(32px, 4.2vw, 52px)","lineHeight":"1.08","fontStyle":"normal","fontWeight":"640"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:18px;font-size:clamp(32px, 4.2vw, 52px);font-style:normal;font-weight:640;line-height:1.08">${esc(copy.quoteTitle)}</h2>
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
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","width":100,"style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"${actionWeight}"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100" style="font-style:normal;font-weight:${actionWeight}"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:6px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(finalEmailLabel)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"deep-green","width":100,"style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"${actionWeight}"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100 is-style-outline" style="font-style:normal;font-weight:${actionWeight}"><a class="wp-block-button__link has-deep-green-color has-text-color wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:6px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(contact.phoneLabel)}</a></div>
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

function sectionAnchorStripForSpec(spec, navLinks, label, variantClass = "") {
  if (spec.pattern?.navigationPrimitive !== "section-anchor-strip") {
    return "";
  }

  const classes = ["som-section-anchor-strip", variantClass].filter(Boolean).join(" ");
  const navClass = ["som-section-anchor-nav", variantClass.replace(/-strip$/, "-nav")].filter(Boolean).join(" ");
  const actionClass = ["som-section-anchor-action", variantClass.replace(/-strip$/, "-action")].filter(Boolean).join(" ");

  return `
<!-- wp:group {"metadata":{"name":"Section anchor strip"},"align":"full","className":"${esc(classes)}","backgroundColor":"white","style":{"spacing":{"padding":{"top":"13px","right":"clamp(24px, 5vw, 72px)","bottom":"13px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull ${esc(classes)} has-white-background-color has-background" style="padding-top:13px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:13px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide">
<!-- wp:paragraph {"className":"som-section-anchor-label","textColor":"deep-green","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"850","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="som-section-anchor-label has-deep-green-color has-text-color" style="font-size:13px;font-style:normal;font-weight:850;letter-spacing:0px;text-transform:uppercase">${esc(label)}</p>
<!-- /wp:paragraph -->
<!-- wp:navigation {"overlayMenu":"never","className":"${esc(navClass)}","layout":{"type":"flex","justifyContent":"center"},"style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"780"}}} -->
${navigationLinkBlocks(navLinks)}
<!-- /wp:navigation -->
<!-- wp:buttons {"className":"${esc(actionClass)}","style":{"spacing":{"blockGap":"10px"}}} -->
<div class="wp-block-buttons ${esc(actionClass)}">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"11px","bottom":"11px","left":"18px","right":"18px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:999px;padding-top:11px;padding-right:18px;padding-bottom:11px;padding-left:18px">${esc(spec.copy.primaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->`.trim();
}

function buildRouteLedSchedulePageContent(spec) {
  const { copy, contact } = spec;
  const routeTone = routeLedScheduleTone(spec);
  const navLinks = navModelForSpec(spec, routeTone.navLabels, routeTone.anchorOrder);
  const services = spec.services.map((item, index) => routePlanCard(index + 1, item.title, item.text, routeTone)).join("\n");
  const processRows = spec.process.map((item, index) => routeTableRow(index + 1, item.title, item.text)).join("\n");
  const processCards = spec.process.map((item, index) => routeProcessCard(index + 1, item.title, item.text, routeTone)).join("\n");
  const proof = spec.proof.map((item) => routeProofCard(item.stat, item.label)).join("\n");
  const statusBoard = routeStatusBoardColumns(spec, routeTone);
  const routeAnchor = anchorAt(navLinks, 0, "routes");
  const routeDetailPrompt = routeDetailQuestion(spec);
  const routeDetailAnswer = spec.serviceDetails?.whatToSend || copy.quoteText;

  return `
<!-- wp:group {"metadata":{"name":"Route-led schedule page"},"align":"full","className":"som-route-page","backgroundColor":"${routeTone.pageBackground}","style":{"spacing":{"padding":{"top":"0","right":"0","bottom":"0","left":"0"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group alignfull som-route-page has-${routeTone.pageBackground}-background-color has-background" style="padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
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
<!-- wp:column {"verticalAlignment":"center","width":"210px","className":"som-route-header-action"} -->
<div class="wp-block-column is-vertically-aligned-center som-route-header-action" style="flex-basis:210px">
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"right"}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"deep-green","textColor":"white","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"12px","right":"16px","bottom":"12px","left":"16px"}},"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button" style="font-size:14px;font-style:normal;font-weight:800"><a class="wp-block-button__link has-white-color has-deep-green-background-color has-text-color has-background wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:6px;padding-top:12px;padding-right:16px;padding-bottom:12px;padding-left:16px;white-space:nowrap">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"className":"som-route-hero-shell","backgroundColor":"${routeTone.heroBackground}","style":{"spacing":{"padding":{"top":"${routeTone.heroPaddingTop}","right":"clamp(24px, 5vw, 72px)","bottom":"${routeTone.heroPaddingBottom}","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-route-hero-shell has-${routeTone.heroBackground}-background-color has-background" style="padding-top:${routeTone.heroPaddingTop};padding-right:clamp(24px, 5vw, 72px);padding-bottom:${routeTone.heroPaddingBottom};padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"align":"wide","verticalAlignment":"center","className":"som-route-hero","style":{"spacing":{"blockGap":{"left":"${routeTone.heroGap}"}}}} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center som-route-hero">
<!-- wp:column {"verticalAlignment":"center","width":"${routeTone.copyWidth}"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:${routeTone.copyWidth}">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|hero","lineHeight":"0.98","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"12px","bottom":"22px"}}}} -->
<h1 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:12px;margin-bottom:22px;font-size:var(--wp--preset--font-size--hero);font-style:normal;font-weight:900;line-height:0.98">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"${routeTone.heroTextLineHeight}"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-bottom:28px;font-size:var(--wp--preset--font-size--lead);line-height:${routeTone.heroTextLineHeight}">${esc(copy.heroText)}</p>
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
<!-- wp:column {"verticalAlignment":"center","width":"${routeTone.mediaWidth}"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:${routeTone.mediaWidth}">
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"full","linkDestination":"none","className":"som-route-hero-photo"} -->
<figure class="wp-block-image size-full som-route-hero-photo"><img src="{{hero_url}}" alt="${esc(spec.assetMeta.hero.alt)}" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
<!-- wp:group {"className":"som-route-status-board","backgroundColor":"${routeTone.statusBackground}","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"22px","right":"24px","bottom":"22px","left":"24px"},"margin":{"top":"${routeTone.statusMarginTop}","right":"${routeTone.statusMarginX}","left":"${routeTone.statusMarginX}"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-route-status-board has-${routeTone.statusBackground}-background-color has-background" style="border-radius:8px;margin-top:${routeTone.statusMarginTop};margin-right:${routeTone.statusMarginX};margin-left:${routeTone.statusMarginX};padding-top:22px;padding-right:24px;padding-bottom:22px;padding-left:24px">
<!-- wp:paragraph {"textColor":"${routeTone.statusAccentColor}","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"12px"}}}} -->
<p class="has-${routeTone.statusAccentColor}-color has-text-color" style="margin-bottom:12px;font-size:13px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(routeBoardLabel(spec))}</p>
<!-- /wp:paragraph -->
<!-- wp:columns {"className":"som-route-board-row","style":{"spacing":{"blockGap":{"left":"14px"}}}} -->
<div class="wp-block-columns som-route-board-row">
${statusBoard}
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

<!-- wp:group {"metadata":{"name":"Route plans"},"anchor":"routes","className":"som-route-plans","align":"full","backgroundColor":"${routeTone.plansBackground}","style":{"spacing":{"padding":{"top":"74px","right":"clamp(24px, 5vw, 72px)","bottom":"74px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="routes" class="wp-block-group alignfull som-route-plans has-${routeTone.plansBackground}-background-color has-background" style="padding-top:74px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:74px;padding-left:clamp(24px, 5vw, 72px)">
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

<!-- wp:group {"metadata":{"name":"Visit notes"},"anchor":"notes","className":"som-route-notes","align":"full","backgroundColor":"${routeTone.notesBackground}","style":{"spacing":{"padding":{"top":"78px","right":"clamp(24px, 5vw, 72px)","bottom":"78px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="notes" class="wp-block-group alignfull som-route-notes has-${routeTone.notesBackground}-background-color has-background" style="padding-top:78px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:78px;padding-left:clamp(24px, 5vw, 72px)">
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
<figure class="wp-block-table som-route-table"><table>${tableCaption("Route process notes")}${tableHead(["Step", routeTone.tableNoteLabel, "What it means"])}<tbody>
${processRows}
</tbody></table></figure>
<!-- /wp:table -->
<!-- wp:details {"className":"som-route-detail"} -->
<details class="wp-block-details som-route-detail"><summary>${esc(routeDetailPrompt)}</summary><!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:17px;line-height:1.5">${esc(routeDetailAnswer)}</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Route proof"},"anchor":"proof","className":"som-route-proof-board","align":"full","backgroundColor":"${routeTone.proofBackground}","style":{"spacing":{"padding":{"top":"72px","right":"clamp(24px, 5vw, 72px)","bottom":"72px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="proof" class="wp-block-group alignfull som-route-proof-board has-${routeTone.proofBackground}-background-color has-background" style="padding-top:72px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:72px;padding-left:clamp(24px, 5vw, 72px)">
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

function corePlanIncludes(spec, blockName) {
  const target = String(blockName || "").toLowerCase().replace(/^core\//, "");
  return (spec.pattern?.coreBlockPlan || [])
    .map((item) => String(item).toLowerCase().replace(/^core\//, "").replace(/\s*&\s*/g, "-"))
    .includes(target);
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

function buildTurnoverReceiptBoardPageContent(spec) {
  const { copy, contact } = spec;
  const navLinks = navModelForSpec(spec, ["Checklist", "Readiness", "Coverage"], ["checklist", "readiness", "quote"]);
  const services = spec.services;
  const process = spec.process;
  const proof = spec.proof;

  return `
<!-- wp:group {"metadata":{"name":"Turnover readiness page"},"align":"full","className":"som-turnover-page","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"0","right":"0","bottom":"0","left":"0"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group alignfull som-turnover-page has-cream-background-color has-background" style="padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
<!-- wp:group {"className":"som-turnover-header","backgroundColor":"white","style":{"spacing":{"padding":{"top":"18px","right":"clamp(24px, 5vw, 72px)","bottom":"16px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-turnover-header has-white-background-color has-background" style="padding-top:18px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:16px;padding-left:clamp(24px, 5vw, 72px)">
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
${navigationLinkBlocks(navLinks)}
<!-- /wp:navigation -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"184px","className":"som-turnover-header-action"} -->
<div class="wp-block-column is-vertically-aligned-center som-turnover-header-action" style="flex-basis:184px">
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"right"}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"deep-green","textColor":"white","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"12px","right":"18px","bottom":"12px","left":"18px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-white-color has-deep-green-background-color has-text-color has-background wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:6px;padding-top:12px;padding-right:18px;padding-bottom:12px;padding-left:18px;white-space:nowrap">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:cover {"url":"{{hero_url}}","id":{{hero_id}},"dimRatio":38,"overlayColor":"deep-green","isUserOverlayColor":true,"minHeight":700,"minHeightUnit":"px","align":"full","className":"som-turnover-hero","style":{"spacing":{"padding":{"top":"clamp(48px, 7vw, 96px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(48px, 7vw, 96px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-cover alignfull som-turnover-hero" style="padding-top:clamp(48px, 7vw, 96px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(48px, 7vw, 96px);padding-left:clamp(24px, 5vw, 72px);min-height:700px"><span aria-hidden="true" class="wp-block-cover__background has-deep-green-background-color has-background-dim-40 has-background-dim"></span><img class="wp-block-cover__image-background wp-image-{{hero_id}}" alt="${esc(spec.assetMeta.hero.alt)}" src="{{hero_url}}" data-object-fit="cover" data-object-position="50% 54%"/><div class="wp-block-cover__inner-container">
<!-- wp:columns {"verticalAlignment":"center","align":"wide","style":{"spacing":{"blockGap":{"left":"clamp(30px, 5vw, 70px)"}}}} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"52%","className":"som-turnover-hero-copy"} -->
<div class="wp-block-column is-vertically-aligned-center som-turnover-hero-copy" style="flex-basis:52%">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-sun-color has-text-color" style="font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"white","style":{"typography":{"fontSize":"var:preset|font-size|hero","lineHeight":"1","fontStyle":"normal","fontWeight":"860"},"spacing":{"margin":{"top":"14px","bottom":"20px"}}}} -->
<h1 class="wp-block-heading has-white-color has-text-color" style="margin-top:14px;margin-bottom:20px;font-size:var(--wp--preset--font-size--hero);font-style:normal;font-weight:860;line-height:1">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"mist","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.54"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<p class="has-mist-color has-text-color" style="margin-bottom:28px;font-size:var(--wp--preset--font-size--lead);line-height:1.54">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":{"left":"12px"}}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:6px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"backgroundColor":"white","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-white-background-color has-text-color has-background wp-element-button" href="#checklist" style="border-radius:6px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"48%","className":"som-turnover-readiness-board","backgroundColor":"white","style":{"spacing":{"padding":{"top":"26px","right":"28px","bottom":"28px","left":"28px"}}}} -->
<div class="wp-block-column is-vertically-aligned-center som-turnover-readiness-board has-white-background-color has-background" style="padding-top:26px;padding-right:28px;padding-bottom:28px;padding-left:28px;flex-basis:48%">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:13px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Host readiness board</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":2,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(30px, 3.2vw, 44px)","lineHeight":"1.05","fontStyle":"normal","fontWeight":"860"},"spacing":{"margin":{"top":"8px","bottom":"14px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:8px;margin-bottom:14px;font-size:clamp(30px, 3.2vw, 44px);font-style:normal;font-weight:860;line-height:1.05">${esc(copy.introTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"16px","lineHeight":"1.48"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-bottom:18px;font-size:16px;line-height:1.48">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
<!-- wp:list {"className":"som-turnover-board-list","style":{"typography":{"fontSize":"16px","lineHeight":"1.52","fontWeight":"650"}}} -->
<ul class="som-turnover-board-list" style="font-size:16px;font-weight:650;line-height:1.52">
${process.map((step) => turnoverBoardListItem(step.title, step.text)).join("\n")}
</ul>
<!-- /wp:list -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div></div>
<!-- /wp:cover -->

<!-- wp:group {"className":"som-host-proof-strip","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"28px","right":"clamp(24px, 5vw, 72px)","bottom":"28px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-host-proof-strip has-cream-background-color has-background" style="padding-top:28px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:28px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"16px"}}}} -->
<div class="wp-block-columns">
${proof.map((item) => turnoverProof(item.stat, item.label)).join("\n")}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Checklist"},"anchor":"checklist","className":"som-turnover-checklist","backgroundColor":"white","style":{"spacing":{"padding":{"top":"clamp(56px, 7vw, 92px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(56px, 7vw, 92px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="checklist" class="wp-block-group som-turnover-checklist has-white-background-color has-background" style="padding-top:clamp(56px, 7vw, 92px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(56px, 7vw, 92px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"bottom","style":{"spacing":{"blockGap":{"left":"clamp(30px, 5vw, 70px)"}}}} -->
<div class="wp-block-columns are-vertically-aligned-bottom">
<!-- wp:column {"verticalAlignment":"bottom","width":"42%"} -->
<div class="wp-block-column is-vertically-aligned-bottom" style="flex-basis:42%">
<!-- wp:heading {"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1","fontStyle":"normal","fontWeight":"860"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:860;line-height:1">${esc(copy.servicesTitle)}</h2>
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
<!-- wp:table {"className":"som-turnover-table"} -->
<figure class="wp-block-table som-turnover-table"><table>${tableCaption("Turnover reset scope")}${tableHead(["Reset zone", "Handoff proof", "Host note"])}<tbody>${turnoverTableRows(services, proof)}</tbody></table></figure>
<!-- /wp:table -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Readiness"},"anchor":"readiness","className":"som-turnover-readiness","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"clamp(56px, 7vw, 90px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(56px, 7vw, 90px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="readiness" class="wp-block-group som-turnover-readiness has-mist-background-color has-background" style="padding-top:clamp(56px, 7vw, 90px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(56px, 7vw, 90px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"top","style":{"spacing":{"blockGap":{"left":"clamp(34px, 5vw, 74px)"}}}} -->
<div class="wp-block-columns are-vertically-aligned-top">
<!-- wp:column {"verticalAlignment":"top","width":"38%"} -->
<div class="wp-block-column is-vertically-aligned-top" style="flex-basis:38%">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.proofTitle)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1.02","fontStyle":"normal","fontWeight":"860"},"spacing":{"margin":{"top":"10px","bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:10px;margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:860;line-height:1.02">${esc(copy.processTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:quote {"className":"som-turnover-quote"} -->
<blockquote class="wp-block-quote som-turnover-quote"><p>${esc(contact.serviceArea)}</p><cite>${esc(spec.businessName)}</cite></blockquote>
<!-- /wp:quote -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"top"} -->
<div class="wp-block-column is-vertically-aligned-top">
${process.map((step, index) => turnoverStep(index + 1, step.title, step.text)).join("\n")}
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
<!-- wp:group {"className":"som-turnover-details","style":{"spacing":{"margin":{"top":"34px"}}},"layout":{"type":"constrained","wideSize":"980px"}} -->
<div class="wp-block-group som-turnover-details" style="margin-top:34px">
${turnoverDetail("What should I send before the first turnover?", spec.serviceDetails?.whatToSend || copy.quoteText)}
${turnoverDetail("How do you handle access and checkout timing?", spec.serviceDetails?.prepNote || process[0]?.text || copy.introText)}
${turnoverDetail("What happens when supplies or damage need attention?", spec.serviceDetails?.objectionAnswer || spec.serviceDetails?.serviceRhythm || copy.introText)}
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Coverage"},"anchor":"quote","className":"som-quote-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"clamp(56px, 7vw, 86px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(56px, 7vw, 86px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"980px"}} -->
<div id="quote" class="wp-block-group som-quote-strip has-deep-green-background-color has-background" style="padding-top:clamp(56px, 7vw, 86px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(56px, 7vw, 86px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:heading {"textAlign":"center","textColor":"white","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1","fontStyle":"normal","fontWeight":"860"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-text-align-center has-white-color has-text-color" style="margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:860;line-height:1">${esc(copy.quoteTitle)}</h2>
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
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-white-background-color has-text-color has-background wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:6px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px;white-space:nowrap">${esc(contact.phoneLabel)}</a></div>
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
<!-- /wp:group -->
`.trim();
}

function turnoverBoardListItem(title, text) {
  return `<!-- wp:list-item --><li><strong>${esc(title)}</strong> ${esc(text)}</li><!-- /wp:list-item -->`;
}

function turnoverProof(stat, label) {
  return `
<!-- wp:column {"className":"som-host-proof"} -->
<div class="wp-block-column som-host-proof">
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"25px","fontStyle":"normal","fontWeight":"860","lineHeight":"1"},"spacing":{"margin":{"bottom":"6px"}}}} -->
<p class="has-deep-green-color has-text-color" style="margin-bottom:6px;font-size:25px;font-style:normal;font-weight:860;line-height:1">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"15px","lineHeight":"1.42","fontStyle":"normal","fontWeight":"700"}}} -->
<p class="has-soil-color has-text-color" style="font-size:15px;font-style:normal;font-weight:700;line-height:1.42">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`;
}

function turnoverTableRows(services, proof) {
  return services.map((service, index) => {
    const proofItem = proof[index] || proof[proof.length - 1] || { stat: "Checked", label: "completion note sent before handoff" };
    return `<tr><td>${esc(service.title)}</td><td>${esc(proofItem.stat)}</td><td>${esc(service.text)} ${esc(proofItem.label)}.</td></tr>`;
  }).join("");
}

function turnoverStep(number, title, text) {
  return `
<!-- wp:group {"className":"som-turnover-step","backgroundColor":"white","style":{"spacing":{"padding":{"top":"20px","right":"22px","bottom":"20px","left":"22px"},"margin":{"bottom":"14px"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group som-turnover-step has-white-background-color has-background" style="margin-bottom:14px;padding-top:20px;padding-right:22px;padding-bottom:20px;padding-left:22px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:13px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Handoff ${number}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"24px","fontStyle":"normal","fontWeight":"860","lineHeight":"1.08"},"spacing":{"margin":{"top":"6px","bottom":"8px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:6px;margin-bottom:8px;font-size:24px;font-style:normal;font-weight:860;line-height:1.08">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"16px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:16px;line-height:1.5">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->`;
}

function turnoverDetail(summary, text) {
  return `
<!-- wp:details {"className":"som-turnover-detail"} -->
<details class="wp-block-details som-turnover-detail"><summary>${esc(summary)}</summary>
<!-- wp:paragraph {"textColor":"soil"} -->
<p class="has-soil-color has-text-color">${esc(text)}</p>
<!-- /wp:paragraph -->
</details>
<!-- /wp:details -->`;
}

function buildServiceReceiptStackPageContent(spec) {
  const { copy, contact } = spec;
  const navLinks = navModelForSpec(spec, ["Scope", "Safety", "Quote"], ["scope", "safety", "quote"]);
  const headerNavigation = spec.pattern?.navigationPrimitive === "section-anchor-strip"
    ? ""
    : `<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"850"}}} -->
${navigationLinkBlocks(navLinks)}
<!-- /wp:navigation -->`;
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
${headerNavigation}
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"190px","className":"som-receipt-header-action"} -->
<div class="wp-block-column is-vertically-aligned-center som-receipt-header-action" style="flex-basis:190px">
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"right"}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"deep-green","textColor":"white","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"12px","right":"18px","bottom":"12px","left":"18px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-white-color has-deep-green-background-color has-text-color has-background wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:6px;padding-top:12px;padding-right:18px;padding-bottom:12px;padding-left:18px;white-space:nowrap">${esc(contact.phoneLabel)}</a></div>
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

${sectionAnchorStripForSpec(spec, navLinks, "Scope path", "som-receipt-anchor-strip")}

<!-- wp:group {"className":"som-receipt-proof-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"28px","right":"clamp(24px, 5vw, 72px)","bottom":"28px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-receipt-proof-strip has-deep-green-background-color has-background" style="padding-top:28px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:28px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"14px"}}}} -->
<div class="wp-block-columns">
${proof.map((item) => receiptProof(item.stat, item.label)).join("\n")}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Scope"},"anchor":"scope","className":"som-receipt-scope","backgroundColor":"white","style":{"spacing":{"padding":{"top":"clamp(56px, 7vw, 92px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(56px, 7vw, 92px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
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

<!-- wp:group {"metadata":{"name":"Safety"},"anchor":"safety","className":"som-receipt-safety","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"clamp(56px, 7vw, 90px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(56px, 7vw, 90px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
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

<!-- wp:group {"metadata":{"name":"Quote"},"anchor":"quote","className":"som-quote-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"clamp(56px, 7vw, 86px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(56px, 7vw, 86px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"980px"}} -->
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
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color has-white-background-color has-text-color has-background wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:6px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px;white-space:nowrap">${esc(contact.phoneLabel)}</a></div>
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
<figure class="wp-block-table som-receipt-table"><table>${tableCaption("Service scope receipt")}${tableHead(["Scope line", "Fit", "Notes"])}<tbody>${rows}</tbody></table></figure>
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
<!-- wp:button {"backgroundColor":"grass","textColor":"cream","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"12px","right":"18px","bottom":"12px","left":"18px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-cream-color has-grass-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:6px;padding-top:12px;padding-right:18px;padding-bottom:12px;padding-left:18px">${esc(copy.primaryCta)}</a></div>
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

<!-- wp:group {"metadata":{"name":"Install"},"anchor":"install","className":"som-urgent-install","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 92px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(50px, 7vw, 86px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
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

<!-- wp:group {"metadata":{"name":"Safety"},"anchor":"safety","className":"som-urgent-safety","backgroundColor":"white","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 90px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 90px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
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

<!-- wp:group {"metadata":{"name":"Quote"},"anchor":"quote","className":"som-quote-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 84px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 84px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"980px"}} -->
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
  const navLinks = navModelForSpec(spec, ["Zones", "Process", "Quote"], ["zones", "process", "quote"]);
  const headerNavigation = spec.pattern?.navigationPrimitive === "section-anchor-strip"
    ? ""
    : `<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"850"}}} -->
${navigationLinkBlocks(navLinks)}
<!-- /wp:navigation -->`;
  const services = spec.services;
  const process = spec.process;
  const proof = spec.proof;
  const isPollinatorSeasonBoard = layoutVariantFor(spec) === "pollinator-season-board";
  const heroCopyColumn = `
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
${isPollinatorSeasonBoard ? pollinatorSeasonPathTable() : zoneMap(proof, spec)}
</div>
<!-- /wp:column -->`.trim();
  const heroImageColumn = `
<!-- wp:column {"verticalAlignment":"center","width":"56%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:56%">
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"full","linkDestination":"none","className":"som-zone-photo"} -->
<figure class="wp-block-image size-full som-zone-photo"><img src="{{hero_url}}" alt="${esc(spec.assetMeta.hero.alt)}" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
</div>
<!-- /wp:column -->`.trim();
  const heroColumns = isPollinatorSeasonBoard
    ? `${heroImageColumn}\n${heroCopyColumn}`
    : `${heroCopyColumn}\n${heroImageColumn}`;

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
${headerNavigation}
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
${heroColumns}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

${sectionAnchorStripForSpec(spec, navLinks, "Plan by zone", "som-zone-anchor-strip")}

<!-- wp:group {"className":"som-zone-proof-strip","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"28px","right":"clamp(24px, 5vw, 72px)","bottom":"28px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-zone-proof-strip has-mist-background-color has-background" style="padding-top:28px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:28px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"16px"}}}} -->
<div class="wp-block-columns">
${proof.map((item) => zoneProof(item.stat, item.label)).join("\n")}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Zones"},"anchor":"zones","className":"som-zone-plans","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 92px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 88px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
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

<!-- wp:group {"metadata":{"name":"Process"},"anchor":"process","className":"som-zone-process","backgroundColor":"white","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 88px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 88px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
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

<!-- wp:group {"metadata":{"name":"Quote"},"anchor":"quote","className":"som-quote-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 84px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 84px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"980px"}} -->
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
  const serviceTable = waterServiceTable(spec);

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

<!-- wp:group {"metadata":{"name":"Water proof"},"anchor":"water","className":"som-water-proof-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"30px","right":"clamp(24px, 5vw, 72px)","bottom":"30px","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="water" class="wp-block-group som-water-proof-strip has-deep-green-background-color has-background" style="padding-top:30px;padding-right:clamp(24px, 5vw, 72px);padding-bottom:30px;padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"16px"}}}} -->
<div class="wp-block-columns">
${proof.map((item) => waterProof(item.stat, item.label)).join("\n")}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Plans"},"anchor":"plans","className":"som-water-plans","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 92px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 88px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
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
${serviceTable}
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Route day"},"anchor":"process","className":"som-water-route","backgroundColor":"white","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 88px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 88px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
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

<!-- wp:group {"metadata":{"name":"Quote"},"anchor":"quote","className":"som-quote-strip","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 84px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 84px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"980px"}} -->
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
  const layoutVariant = layoutVariantFor(spec);
  const isDeckFinishSampleBoard = layoutVariant === "deck-finish-sample-board";
  const isBikeRouteWorkstand = layoutVariant === "bike-route-workstand";
  const isMuralLetteringWorkshop = layoutVariant === "mural-lettering-workshop";
  const scopeTable = corePlanIncludes(spec, "table")
    ? isDeckFinishSampleBoard
      ? deckFinishSampleTable(proof)
      : serviceScopeTable(spec, {
      className: "som-workshop-scope-table",
      headings: ["Scope lane", "Best proof", "Photo note"]
    })
    : "";
  const detailStack = corePlanIncludes(spec, "details")
    ? serviceDetailsBlock(spec, {
      groupClassName: "som-workshop-details",
      detailClassName: "som-workshop-detail",
      fitSummary: "How do you choose the right bench lane?"
    })
    : "";
  const trustQuote = corePlanIncludes(spec, "quote")
    ? serviceTrustQuote(spec, {
      bandClassName: "som-workshop-quote-band",
      className: "som-workshop-quote",
      citation: `${spec.businessName} bench note`
    })
    : "";
  const heroCopyWidth = isBikeRouteWorkstand ? "52%" : isMuralLetteringWorkshop ? "49%" : "43%";
  const heroMediaWidth = isBikeRouteWorkstand ? "48%" : isMuralLetteringWorkshop ? "51%" : "57%";
  const heroHeadingColor = isBikeRouteWorkstand ? "deep-green" : "cream";
  const heroHeadingClass = isBikeRouteWorkstand ? "has-deep-green-color" : "has-cream-color";
  const heroTextColor = isBikeRouteWorkstand ? "soil" : "mist";
  const heroTextClass = isBikeRouteWorkstand ? "has-soil-color" : "has-mist-color";
  const heroGroupBackground = isBikeRouteWorkstand ? "cream" : "deep-green";
  const heroGroupBackgroundClass = isBikeRouteWorkstand ? "has-cream-background-color" : "has-deep-green-background-color";
  const heroPrimaryButtonBackground = isBikeRouteWorkstand ? "leaf" : "sun";
  const heroPrimaryButtonBackgroundClass = isBikeRouteWorkstand ? "has-leaf-background-color" : "has-sun-background-color";
  const heroSecondaryButtonBackground = isBikeRouteWorkstand ? "white" : "cream";
  const heroSecondaryButtonBackgroundClass = isBikeRouteWorkstand ? "has-white-background-color" : "has-cream-background-color";
  const ticketLabel = isBikeRouteWorkstand ? "Route docket" : isMuralLetteringWorkshop ? "Project ticket" : "Bench check";
  const copyTicket = isMuralLetteringWorkshop
    ? `\n${workshopProjectStrip(proof)}`
    : "";
  const mediaTicket = isMuralLetteringWorkshop
    ? ""
    : `\n${workshopTicket(proof, { label: isDeckFinishSampleBoard ? "Finish checks" : ticketLabel, compact: isDeckFinishSampleBoard })}`;
  const heroCopyColumn = `
<!-- wp:column {"verticalAlignment":"center","width":"${heroCopyWidth}"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:${heroCopyWidth}">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-sun-color has-text-color" style="font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"${heroHeadingColor}","style":{"typography":{"fontSize":"var:preset|font-size|hero","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"12px","bottom":"22px"}}}} -->
<h1 class="wp-block-heading ${heroHeadingClass} has-text-color" style="margin-top:12px;margin-bottom:22px;font-size:var(--wp--preset--font-size--hero);font-style:normal;font-weight:900;line-height:1">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"${heroTextColor}","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.5"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<p class="${heroTextClass} has-text-color" style="margin-bottom:28px;font-size:var(--wp--preset--font-size--lead);line-height:1.5">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":{"left":"12px"}}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"${heroPrimaryButtonBackground}","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color ${heroPrimaryButtonBackgroundClass} has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:6px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"backgroundColor":"${heroSecondaryButtonBackground}","textColor":"deep-green","style":{"border":{"radius":"6px"},"spacing":{"padding":{"top":"15px","right":"24px","bottom":"15px","left":"24px"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link has-deep-green-color ${heroSecondaryButtonBackgroundClass} has-text-color has-background wp-element-button" href="#wood" style="border-radius:6px;padding-top:15px;padding-right:24px;padding-bottom:15px;padding-left:24px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
${copyTicket}
  </div>
<!-- /wp:column -->`.trim();
  const heroMediaColumn = `
<!-- wp:column {"verticalAlignment":"center","width":"${heroMediaWidth}"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:${heroMediaWidth}">
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"full","linkDestination":"none","className":"som-workshop-photo"} -->
<figure class="wp-block-image size-full som-workshop-photo"><img src="{{hero_url}}" alt="${esc(spec.assetMeta.hero.alt)}" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
${mediaTicket}
</div>
<!-- /wp:column -->`.trim();
  const heroColumns = isDeckFinishSampleBoard
    ? `${heroMediaColumn}\n${heroCopyColumn}`
    : `${heroCopyColumn}\n${heroMediaColumn}`;

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

<!-- wp:group {"className":"som-workshop-hero","backgroundColor":"${heroGroupBackground}","style":{"spacing":{"padding":{"top":"clamp(42px, 6vw, 78px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(46px, 7vw, 82px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group som-workshop-hero ${heroGroupBackgroundClass} has-background" style="padding-top:clamp(42px, 6vw, 78px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(46px, 7vw, 82px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:columns {"verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"clamp(32px, 5vw, 72px)"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center">
${heroColumns}
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

<!-- wp:group {"metadata":{"name":"Wood scope"},"anchor":"wood","className":"som-wood-scope","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 92px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 88px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
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
${scopeTable}
${trustQuote}
${careNote(copy.introTitle, contact.serviceArea)}
${detailStack}
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Process"},"anchor":"process","className":"som-craft-process","backgroundColor":"white","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 88px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 88px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
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

<!-- wp:group {"metadata":{"name":"Quote"},"anchor":"quote","className":"som-quote-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 84px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 84px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"980px"}} -->
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

function workshopProjectStrip(proof) {
  const items = proof.slice(0, 3).map((item) => item.stat).join(" / ");
  return `
<!-- wp:group {"className":"som-workshop-ticket","backgroundColor":"soil","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"10px","right":"14px","bottom":"10px","left":"14px"},"margin":{"top":"16px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-workshop-ticket has-soil-background-color has-background" style="border-radius:8px;margin-top:16px;padding-top:10px;padding-right:14px;padding-bottom:10px;padding-left:14px">
<!-- wp:paragraph {"textColor":"cream","className":"som-ticket-line","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"850","lineHeight":"1.35"},"spacing":{"margin":{"top":"0","bottom":"0"}}}} -->
<p class="som-ticket-line has-cream-color has-text-color" style="margin-top:0;margin-bottom:0;font-size:13px;font-style:normal;font-weight:850;line-height:1.35"><strong>Project ticket</strong> / ${esc(items)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->`.trim();
}

function buildFixedBottomActionPageContent(spec) {
  const { copy, contact } = spec;
  const navLabels = layoutArchetypeFor(spec).navLabels || ["Packages", "Process", "Quote"];
  const services = spec.services;
  const process = spec.process;
  const proof = spec.proof;
  const packageTable = corePlanIncludes(spec, "table")
    ? serviceScopeTable(spec, {
      className: "som-detail-scope-table",
      headings: ["Package", "Best fit", "Setup note"]
    })
    : "";
  const detailStack = corePlanIncludes(spec, "details")
    ? serviceDetailsBlock(spec, {
      groupClassName: "som-detail-details",
      detailClassName: "som-detail-detail",
      fitSummary: "How do we confirm the right package?"
    })
    : "";
  const packageQuote = corePlanIncludes(spec, "quote")
    ? serviceTrustQuote(spec, {
      bandClassName: "som-detail-quote-band",
      className: "som-detail-quote",
      citation: `${spec.businessName} booking note`
    })
    : "";

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
${detailTicket(proof, spec)}
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

<!-- wp:group {"metadata":{"name":"Packages"},"anchor":"packages","className":"som-detail-packages","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 92px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(52px, 7vw, 84px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="packages" class="wp-block-group som-detail-packages has-cream-background-color has-background" style="padding-top:clamp(54px, 7vw, 92px);padding-right:clamp(24px, 5vw, 72px);padding-bottom:clamp(52px, 7vw, 84px);padding-left:clamp(24px, 5vw, 72px)">
<!-- wp:heading {"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|section-title","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:18px;font-size:var(--wp--preset--font-size--section-title);font-style:normal;font-weight:900;line-height:1">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"var:preset|font-size|lead","lineHeight":"1.55"},"spacing":{"margin":{"bottom":"32px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-bottom:32px;font-size:var(--wp--preset--font-size--lead);line-height:1.55">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"20px"}}}} -->
<div class="wp-block-columns">
${services.map((service, index) => detailPackageCard(index + 1, service.title, service.text, spec)).join("\n")}
</div>
<!-- /wp:columns -->
${packageTable}
${packageQuote}
${detailStack}
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Process"},"anchor":"process","className":"som-detail-route","backgroundColor":"white","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 88px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 88px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
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

<!-- wp:group {"metadata":{"name":"Quote"},"anchor":"quote","className":"som-quote-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 84px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(66px, 8vw, 96px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"980px"}} -->
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
  const packageTable = menuComparisonTable(spec);

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

<!-- wp:group {"metadata":{"name":"Packages"},"anchor":"packages","className":"som-menu-packages","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 92px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 92px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
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
${packageTable}
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Events"},"anchor":"events","className":"som-menu-event","backgroundColor":"white","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 88px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 88px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
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

<!-- wp:group {"metadata":{"name":"Quote"},"anchor":"quote","className":"som-quote-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"clamp(54px, 7vw, 84px)","right":"clamp(24px, 5vw, 72px)","bottom":"clamp(54px, 7vw, 84px)","left":"clamp(24px, 5vw, 72px)"}}},"layout":{"type":"constrained","wideSize":"980px"}} -->
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
  const isEstimateRail = layoutVariantFor(spec) === "side-rail-estimate";
  const navLinks = navModelForSpec(spec, ["We take", "Sort path", "Quote"], ["take", "sort", "quote"]);
  const servicesAnchor = anchorAt(navLinks, 0, "take");
  const processAnchor = anchorAt(navLinks, 1, "sort");
  const quoteAnchor = anchorAt(navLinks, 2, "quote");
  const serviceCardVerb = isEstimateRail ? "Setup" : "Load";
  const services = spec.services.map((item, index) => haulCard(index + 1, item.title, item.text, serviceCardVerb)).join("\n");
  const process = spec.process.map((item, index) => haulStep(index + 1, item.title, item.text)).join("\n");
  const proof = spec.proof.map((item) => haulProof(item.stat, item.label)).join("\n");
  const ticket = haulTicket(spec.proof, isEstimateRail ? "Setup notes" : "Haul ticket");
  const trustQuote = corePlanIncludes(spec, "quote")
    ? serviceTrustQuote(spec, "som-side-rail-quote")
    : "";
  const heroMetadataName = isEstimateRail ? "Consult hero" : "Haul hero";
  const proofMetadataName = isEstimateRail ? "Signal proof" : "Donation proof";
  const servicesMetadataName = isEstimateRail ? "Setup scope" : "Accepted items";
  const processMetadataName = isEstimateRail ? "Setup path" : "Sort path";
  const heroBackground = isEstimateRail ? "mist" : "deep-green";
  const heroHeadingColor = isEstimateRail ? "deep-green" : "white";
  const heroBodyColor = isEstimateRail ? "soil" : "cream";
  const heroOutlineColor = isEstimateRail ? "deep-green" : "white";
  const heroCopyWidth = isEstimateRail ? "53%" : "45%";
  const heroPhotoWidth = isEstimateRail ? "47%" : "55%";
  const heroCopyStyle = isEstimateRail ? `flex-basis:${heroCopyWidth};order:2` : `flex-basis:${heroCopyWidth}`;
  const heroPhotoStyle = isEstimateRail ? `flex-basis:${heroPhotoWidth};order:1` : `flex-basis:${heroPhotoWidth}`;
  const heroColumnGap = isEstimateRail ? "34px" : "42px";
  const proofStripBackground = isEstimateRail ? "mist" : "sun";

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
<!-- wp:group {"metadata":{"name":"${heroMetadataName}"},"className":"som-haul-hero","backgroundColor":"${heroBackground}","style":{"spacing":{"padding":{"top":"62px","right":"42px","bottom":"62px","left":"42px"}}},"layout":{"type":"constrained","wideSize":"1120px"}} -->
<div class="wp-block-group som-haul-hero has-${heroBackground}-background-color has-background" style="padding-top:62px;padding-right:42px;padding-bottom:62px;padding-left:42px">
<!-- wp:columns {"align":"wide","verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"${heroColumnGap}"}}}} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"${heroCopyWidth}"} -->
<div class="wp-block-column is-vertically-aligned-center" style="${heroCopyStyle}">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-sun-color has-text-color" style="font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"${heroHeadingColor}","style":{"typography":{"fontSize":"clamp(44px, 6.6vw, 82px)","lineHeight":"0.96","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"12px","bottom":"22px"}}}} -->
<h1 class="wp-block-heading has-${heroHeadingColor}-color has-text-color" style="margin-top:12px;margin-bottom:22px;font-size:clamp(44px, 6.6vw, 82px);font-style:normal;font-weight:900;line-height:0.96">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"${heroBodyColor}","style":{"typography":{"fontSize":"clamp(19px, 1.9vw, 25px)","lineHeight":"1.45"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<p class="has-${heroBodyColor}-color has-text-color" style="margin-bottom:28px;font-size:clamp(19px, 1.9vw, 25px);line-height:1.45">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"850"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:850"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#${esc(quoteAnchor)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"${heroOutlineColor}","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"850"}}} -->
<div class="wp-block-button is-style-outline" style="font-style:normal;font-weight:850"><a class="wp-block-button__link has-${heroOutlineColor}-color has-text-color wp-element-button" href="#${esc(servicesAnchor)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
${ticket}
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"${heroPhotoWidth}"} -->
<div class="wp-block-column is-vertically-aligned-center" style="${heroPhotoStyle}">
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"full","linkDestination":"none","className":"som-haul-photo"} -->
<figure class="wp-block-image size-full som-haul-photo"><img src="{{hero_url}}" alt="" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"${proofMetadataName}"},"className":"som-donation-strip","backgroundColor":"${proofStripBackground}","style":{"spacing":{"padding":{"top":"30px","right":"42px","bottom":"30px","left":"42px"}}},"layout":{"type":"constrained","wideSize":"1120px"}} -->
<div class="wp-block-group som-donation-strip has-${proofStripBackground}-background-color has-background" style="padding-top:30px;padding-right:42px;padding-bottom:30px;padding-left:42px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"14px"}}}} -->
<div class="wp-block-columns alignwide">
${proof}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->
${trustQuote}

<!-- wp:group {"metadata":{"name":"${servicesMetadataName}"},"anchor":"${esc(servicesAnchor)}","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"72px","right":"42px","bottom":"72px","left":"42px"}}},"layout":{"type":"constrained","wideSize":"1120px"}} -->
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

<!-- wp:group {"metadata":{"name":"${processMetadataName}"},"anchor":"${esc(processAnchor)}","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"72px","right":"42px","bottom":"72px","left":"42px"}}},"layout":{"type":"constrained","wideSize":"1120px"}} -->
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
  const headerNavigation = layoutVariantFor(spec) === "micro-wedding-floral-story"
    ? ""
    : `<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"700"}}} -->
${navigationLinkBlocks(navLinks)}
<!-- /wp:navigation -->`;
  const anchorStrip = layoutVariantFor(spec) === "micro-wedding-floral-story"
    ? floralStoryAnchorStrip(spec, navLinks)
    : "";
  const trustQuote = checklistTrustQuote(spec);
  const details = checklistDetails(spec);

  return `
<!-- wp:group {"align":"full","backgroundColor":"white","style":{"spacing":{"padding":{"top":"18px","right":"24px","bottom":"18px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull has-white-background-color has-background" style="padding-top:18px;padding-right:24px;padding-bottom:18px;padding-left:24px">
<!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide">
<!-- wp:site-logo {"width":230,"shouldSyncIcon":true} /-->
${headerNavigation}
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

${anchorStrip}

<!-- wp:group {"metadata":{"name":"Proof"},"anchor":"proof","align":"full","className":"som-urgency-band","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"44px","right":"24px","bottom":"44px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="proof" class="wp-block-group alignfull som-urgency-band has-deep-green-background-color has-background" style="padding-top:44px;padding-right:24px;padding-bottom:44px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"14px"}}}} -->
<div class="wp-block-columns alignwide">
${proof}
</div>
<!-- /wp:columns -->
${trustQuote}
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
${details}
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

function floralStoryAnchorStrip(spec, navLinks) {
  const { copy } = spec;
  const actionAnchor = anchorAt(navLinks, 0, "checklist");
  const actionLabel = copy.secondaryCta || "View floral paths";

  return `
<!-- wp:group {"metadata":{"name":"Floral anchor strip"},"align":"full","className":"som-story-anchor-strip som-section-anchor-strip","backgroundColor":"white","style":{"spacing":{"padding":{"top":"14px","right":"24px","bottom":"14px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull som-story-anchor-strip som-section-anchor-strip has-white-background-color has-background" style="padding-top:14px;padding-right:24px;padding-bottom:14px;padding-left:24px">
<!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide">
<!-- wp:paragraph {"className":"som-story-anchor-label","textColor":"deep-green","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"850","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="som-story-anchor-label has-deep-green-color has-text-color" style="font-size:14px;font-style:normal;font-weight:850;letter-spacing:0px;text-transform:uppercase">Plan the floral brief</p>
<!-- /wp:paragraph -->
<!-- wp:navigation {"overlayMenu":"never","className":"som-story-anchor-nav som-section-anchor-nav","layout":{"type":"flex","justifyContent":"center"},"style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"780"}}} -->
${navigationLinkBlocks(navLinks)}
<!-- /wp:navigation -->
<!-- wp:buttons {"className":"som-story-anchor-action som-section-anchor-action","style":{"spacing":{"blockGap":"10px"}}} -->
<div class="wp-block-buttons som-story-anchor-action som-section-anchor-action">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"11px","bottom":"11px","left":"18px","right":"18px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#${esc(actionAnchor)}" style="border-radius:999px;padding-top:11px;padding-right:18px;padding-bottom:11px;padding-left:18px">${esc(actionLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->`.trim();
}

function buildSurfaceSeasonalPageContent(spec) {
  const { copy, contact } = spec;
  const services = spec.services.map((item, index) => sealCard(index + 1, item.title, item.text)).join("\n");
  const process = spec.process.map((item, index) => processStep(index + 1, item.title, item.text)).join("\n");
  const proof = spec.proof.map((item) => surfaceBadge(item.stat, item.label)).join("\n");
  const prepTable = corePlanIncludes(spec, "table")
    ? serviceScopeTable(spec, {
      className: "som-surface-scope-table",
      headings: ["Surface read", "Season cue", "Prep note"]
    })
    : "";

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
${prepTable}
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
  const processSteps = spec.process;
  const process = processSteps.map((item, index) => processStep(index + 1, item.title, item.text)).join("\n");
  const proof = spec.proof.map((item) => fabricProof(item.stat, item.label)).join("\n");
  const careDetails = fabricCareDetails(spec);
  const careList = processSteps.slice(0, 3).map(fabricCareListItem).join("\n");

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
<!-- wp:columns {"align":"wide","verticalAlignment":"center","className":"som-fabric-hero-columns","style":{"spacing":{"blockGap":{"left":"48px"}}}} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center som-fabric-hero-columns">
<!-- wp:column {"verticalAlignment":"center","width":"48%","className":"som-fabric-copy"} -->
<div class="wp-block-column is-vertically-aligned-center som-fabric-copy" style="flex-basis:48%">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"760","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:15px;font-style:normal;font-weight:760;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(42px, 5.8vw, 72px)","lineHeight":"1.06","fontStyle":"normal","fontWeight":"660"},"spacing":{"margin":{"top":"12px","bottom":"22px"}}}} -->
<h1 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:12px;margin-bottom:22px;font-size:clamp(42px, 5.8vw, 72px);font-style:normal;font-weight:660;line-height:1.06">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"clamp(19px, 1.9vw, 24px)","lineHeight":"1.5"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-bottom:28px;font-size:clamp(19px, 1.9vw, 24px);line-height:1.5">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"760"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:760"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#quote" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"760"}}} -->
<div class="wp-block-button is-style-outline" style="font-style:normal;font-weight:760"><a class="wp-block-button__link has-deep-green-color has-text-color wp-element-button" href="#stains" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"52%","className":"som-fabric-media"} -->
<div class="wp-block-column is-vertically-aligned-center som-fabric-media" style="flex-basis:52%">
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"full","linkDestination":"none","className":"som-fabric-photo"} -->
<figure class="wp-block-image size-full som-fabric-photo"><img src="{{hero_url}}" alt="" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
<!-- wp:group {"className":"som-care-note","backgroundColor":"white","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"20px","right":"22px","bottom":"20px","left":"22px"},"margin":{"top":"16px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-care-note has-white-background-color has-background" style="border-radius:8px;margin-top:16px;padding-top:20px;padding-right:22px;padding-bottom:20px;padding-left:22px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"760","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<p class="has-grass-color has-text-color" style="margin-bottom:8px;font-size:15px;font-style:normal;font-weight:760;letter-spacing:0px;text-transform:uppercase">${esc(copy.introTitle)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.5","fontStyle":"normal","fontWeight":"620"},"spacing":{"margin":{"bottom":"0"}}}} -->
<p class="has-soil-color has-text-color" style="margin-bottom:0;font-size:17px;font-style:normal;font-weight:620;line-height:1.5">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
<!-- wp:list {"className":"som-fabric-care-list","textColor":"soil","style":{"typography":{"fontSize":"16px","lineHeight":"1.55","fontStyle":"normal","fontWeight":"620"},"spacing":{"padding":{"left":"20px"},"margin":{"top":"14px","bottom":"0"}}}} -->
<ul class="som-fabric-care-list has-soil-color has-text-color" style="margin-top:14px;margin-bottom:0;padding-left:20px;font-size:16px;font-style:normal;font-weight:620;line-height:1.55">
${careList}
</ul>
<!-- /wp:list -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
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
<!-- wp:heading {"level":2,"align":"wide","textColor":"deep-green","style":{"typography":{"fontSize":"clamp(34px, 5vw, 56px)","lineHeight":"1.08","fontStyle":"normal","fontWeight":"660"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading alignwide has-deep-green-color has-text-color" style="margin-bottom:18px;font-size:clamp(34px, 5vw, 56px);font-style:normal;font-weight:660;line-height:1.08">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"align":"wide","textColor":"soil","style":{"typography":{"fontSize":"20px","lineHeight":"1.5"},"spacing":{"margin":{"bottom":"34px"}}}} -->
<p class="alignwide has-soil-color has-text-color" style="margin-bottom:34px;font-size:20px;line-height:1.5">${esc(contact.serviceArea)}</p>
<!-- /wp:paragraph -->
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"22px"}}}} -->
<div class="wp-block-columns alignwide">
${services}
</div>
<!-- /wp:columns -->
${careDetails}
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Drying"},"anchor":"drying","align":"full","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"78px","right":"24px","bottom":"78px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="drying" class="wp-block-group alignfull has-mist-background-color has-background" style="padding-top:78px;padding-right:24px;padding-bottom:78px;padding-left:24px">
<!-- wp:heading {"level":2,"align":"wide","textColor":"deep-green","style":{"typography":{"fontSize":"clamp(34px, 5vw, 56px)","lineHeight":"1.08","fontStyle":"normal","fontWeight":"660"},"spacing":{"margin":{"bottom":"34px"}}}} -->
<h2 class="wp-block-heading alignwide has-deep-green-color has-text-color" style="margin-bottom:34px;font-size:clamp(34px, 5vw, 56px);font-style:normal;font-weight:660;line-height:1.08">${esc(copy.processTitle)}</h2>
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
<!-- wp:heading {"level":2,"textColor":"white","style":{"typography":{"fontSize":"clamp(36px, 5.6vw, 62px)","lineHeight":"1.08","fontStyle":"normal","fontWeight":"660"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-white-color has-text-color" style="margin-bottom:18px;font-size:clamp(36px, 5.6vw, 62px);font-style:normal;font-weight:660;line-height:1.08">${esc(copy.quoteTitle)}</h2>
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

function buildHeadshotProofGalleryPageContent(spec) {
  const { copy, contact } = spec;
  const navLinks = navModelForSpec(spec, ["Sessions", "Prep", "Consult"], ["styles", "process", "quote"]);
  const stylesAnchor = anchorAt(navLinks, 0, "styles");
  const processAnchor = anchorAt(navLinks, 1, "process");
  const quoteAnchor = anchorAt(navLinks, 2, "quote");
  const styles = spec.services.map((item, index) => galleryStyleCard(index + 1, item.title, item.text, { variant: layoutVariantFor(spec) })).join("\n");
  const process = spec.process.map((item, index) => processStep(index + 1, item.title, item.text)).join("\n");
  const proof = spec.proof.map((item) => headshotProofChip(item.stat, item.label)).join("\n");

  return `
<!-- wp:group {"align":"full","backgroundColor":"white","style":{"spacing":{"padding":{"top":"18px","right":"24px","bottom":"18px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull has-white-background-color has-background" style="padding-top:18px;padding-right:24px;padding-bottom:18px;padding-left:24px">
<!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide">
<!-- wp:site-logo {"width":240,"shouldSyncIcon":true} /-->
<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"700"}}} -->
${navigationLinkBlocks(navLinks)}
<!-- /wp:navigation -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->

<!-- wp:cover {"url":"{{hero_url}}","id":{{hero_id}},"dimRatio":58,"overlayColor":"deep-green","isUserOverlayColor":true,"minHeight":690,"minHeightUnit":"px","contentPosition":"center left","align":"full","className":"som-gallery-hero som-headshot-cover-hero","style":{"spacing":{"padding":{"top":"70px","right":"24px","bottom":"70px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-cover alignfull som-gallery-hero som-headshot-cover-hero" style="padding-top:70px;padding-right:24px;padding-bottom:70px;padding-left:24px;min-height:690px"><span aria-hidden="true" class="wp-block-cover__background has-deep-green-background-color has-background-dim-60 has-background-dim"></span><img class="wp-block-cover__image-background wp-image-{{hero_id}}" alt="${esc(spec.assetMeta.hero.alt)}" src="{{hero_url}}" data-object-fit="cover" data-object-position="58% 42%"/><div class="wp-block-cover__inner-container">
<!-- wp:group {"align":"wide","className":"som-gallery-copy","style":{"spacing":{"padding":{"top":"0","right":"0","bottom":"0","left":"0"}}},"layout":{"type":"constrained","contentSize":"690px","justifyContent":"left"}} -->
<div class="wp-block-group alignwide som-gallery-copy" style="padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"780","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-sun-color has-text-color" style="font-size:14px;font-style:normal;font-weight:780;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"white","style":{"typography":{"fontSize":"clamp(44px, 6.4vw, 82px)","lineHeight":"1.04","fontStyle":"normal","fontWeight":"660"},"spacing":{"margin":{"top":"12px","bottom":"20px"}}}} -->
<h1 class="wp-block-heading has-white-color has-text-color" style="margin-top:12px;margin-bottom:20px;font-size:clamp(44px, 6.4vw, 82px);font-style:normal;font-weight:660;line-height:1.04">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"clamp(18px, 1.7vw, 23px)","lineHeight":"1.56"},"spacing":{"margin":{"bottom":"22px"}}}} -->
<p class="has-white-color has-text-color" style="margin-bottom:22px;font-size:clamp(18px, 1.7vw, 23px);line-height:1.56">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":"12px","margin":{"top":"0","bottom":"22px"}}}} -->
<div class="wp-block-buttons" style="margin-top:0;margin-bottom:22px">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"760"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:760"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#${esc(quoteAnchor)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"white","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"700"}}} -->
<div class="wp-block-button is-style-outline" style="font-style:normal;font-weight:700"><a class="wp-block-button__link has-white-color has-text-color wp-element-button" href="#${esc(processAnchor)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
${headshotShotPlan(spec)}
</div>
<!-- /wp:group -->
</div></div>
<!-- /wp:cover -->

${headshotContactSheet(spec)}

<!-- wp:group {"metadata":{"name":"Prep proof strip"},"align":"full","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"28px","right":"24px","bottom":"28px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull has-mist-background-color has-background" style="padding-top:28px;padding-right:24px;padding-bottom:28px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"14px"}}}} -->
<div class="wp-block-columns alignwide">
${proof}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"${esc(navLinks[0]?.label || "Sessions")}"},"anchor":"${esc(stylesAnchor)}","align":"full","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"72px","right":"24px","bottom":"72px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="${esc(stylesAnchor)}" class="wp-block-group alignfull has-cream-background-color has-background" style="padding-top:72px;padding-right:24px;padding-bottom:72px;padding-left:24px">
<!-- wp:heading {"level":2,"align":"wide","textColor":"deep-green","style":{"typography":{"fontSize":"clamp(34px, 5vw, 58px)","lineHeight":"1.06","fontStyle":"normal","fontWeight":"660"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<h2 class="wp-block-heading alignwide has-deep-green-color has-text-color" style="margin-bottom:28px;font-size:clamp(34px, 5vw, 58px);font-style:normal;font-weight:660;line-height:1.06">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"22px"}}}} -->
<div class="wp-block-columns alignwide">
${styles}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"${esc(navLinks[1]?.label || "Prep")}"},"anchor":"${esc(processAnchor)}","align":"full","backgroundColor":"white","style":{"spacing":{"padding":{"top":"72px","right":"24px","bottom":"72px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="${esc(processAnchor)}" class="wp-block-group alignfull has-white-background-color has-background" style="padding-top:72px;padding-right:24px;padding-bottom:72px;padding-left:24px">
<!-- wp:columns {"align":"wide","verticalAlignment":"top","style":{"spacing":{"blockGap":{"left":"42px"}}}} -->
<div class="wp-block-columns alignwide are-vertically-aligned-top">
<!-- wp:column {"verticalAlignment":"top","width":"36%"} -->
<div class="wp-block-column is-vertically-aligned-top" style="flex-basis:36%">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"780","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:14px;font-style:normal;font-weight:780;letter-spacing:0px;text-transform:uppercase">${esc(copy.introTitle)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":2,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(34px, 5vw, 58px)","lineHeight":"1.06","fontStyle":"normal","fontWeight":"660"},"spacing":{"margin":{"top":"10px","bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:10px;margin-bottom:18px;font-size:clamp(34px, 5vw, 58px);font-style:normal;font-weight:660;line-height:1.06">${esc(copy.processTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"18px","lineHeight":"1.58"}}} -->
<p class="has-soil-color has-text-color" style="font-size:18px;line-height:1.58">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"top"} -->
<div class="wp-block-column is-vertically-aligned-top">
${process}
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"${esc(navLinks[2]?.label || "Consult")}"},"anchor":"${esc(quoteAnchor)}","align":"full","className":"som-quote-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"68px","right":"24px","bottom":"34px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="${esc(quoteAnchor)}" class="wp-block-group alignfull som-quote-strip has-deep-green-background-color has-background" style="padding-top:68px;padding-right:24px;padding-bottom:34px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"42px"}}}} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"58%"} -->
<div class="wp-block-column" style="flex-basis:58%">
<!-- wp:heading {"level":2,"textColor":"white","style":{"typography":{"fontSize":"clamp(34px, 5.5vw, 62px)","lineHeight":"1.04","fontStyle":"normal","fontWeight":"660"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-white-color has-text-color" style="margin-bottom:18px;font-size:clamp(34px, 5.5vw, 62px);font-style:normal;font-weight:660;line-height:1.04">${esc(copy.quoteTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"20px","lineHeight":"1.55"}}} -->
<p class="has-white-color has-text-color" style="font-size:20px;line-height:1.55">${esc(copy.quoteText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"42%"} -->
<div class="wp-block-column" style="flex-basis:42%">
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"left"},"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","width":100,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"760"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100" style="font-style:normal;font-weight:760"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"white","width":100,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"700"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100 is-style-outline" style="font-style:normal;font-weight:700"><a class="wp-block-button__link has-white-color has-text-color wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
<!-- wp:separator {"className":"is-style-wide","backgroundColor":"grass","style":{"spacing":{"margin":{"top":"52px","bottom":"28px"}}}} -->
<hr class="wp-block-separator has-text-color has-grass-color has-alpha-channel-opacity has-grass-background-color has-background is-style-wide" style="margin-top:52px;margin-bottom:28px"/>
<!-- /wp:separator -->
<!-- wp:group {"align":"wide","className":"som-footer","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide som-footer">
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"700"}}} -->
<p class="has-white-color has-text-color" style="font-size:16px;font-style:normal;font-weight:700">${esc(spec.businessName)} - ${esc(spec.tagline)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"760"}}} -->
<p class="has-sun-color has-text-color" style="font-size:16px;font-style:normal;font-weight:760">${esc(contact.phoneLabel)} / ${esc(contact.email)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:group -->
`.trim();
}

function buildGalleryLedPageContent(spec) {
  const { copy, contact } = spec;
  const galleryVariant = layoutVariantFor(spec);
  const isPetGallery = galleryVariant === "pet-portrait-gallery";
  const isPicnicGallery = galleryVariant === "picnic-proposal-lookbook";
  const isBalloonGallery = galleryVariant === "balloon-backdrop-gallery";
  const styles = spec.services.map((item, index) => galleryStyleCard(index + 1, item.title, item.text, { variant: galleryVariant })).join("\n");
  const process = spec.process.map((item, index) => processStep(index + 1, item.title, item.text)).join("\n");
  const proof = spec.proof.map((item) => galleryProof(item.stat, item.label, { variant: galleryVariant })).join("\n");
  const navLinks = navModelForSpec(spec, ["Styles", "Process", "Quote"], ["styles", "process", "quote"]);
  const stylesAnchor = anchorAt(navLinks, 0, "styles");
  const processAnchor = anchorAt(navLinks, 1, "process");
  const quoteAnchor = anchorAt(navLinks, 2, "quote");
  const visualProof = galleryVisualProof(spec);
  const heroCopy = isPetGallery
    ? {
      width: "58%",
      radius: "8px",
      paddingTop: "24px",
      paddingBottom: "24px",
      eyebrowSize: "12px",
      eyebrowWeight: "650",
      h1Size: "clamp(36px, 3.9vw, 54px)",
      h1LineHeight: "1.03",
      h1Weight: "620",
      buttonWeight: "760",
      secondaryColor: "soil"
    }
    : isBalloonGallery
      ? {
        width: "60%",
        radius: "8px",
        paddingTop: "24px",
        paddingBottom: "24px",
        eyebrowSize: "12px",
        eyebrowWeight: "700",
        h1Size: "clamp(36px, 4.3vw, 56px)",
        h1LineHeight: "1.04",
        h1Weight: "680",
        buttonWeight: "740",
        secondaryColor: "deep-green"
      }
    : isPicnicGallery
      ? {
        width: "62%",
        radius: "8px",
        paddingTop: "24px",
        paddingBottom: "24px",
        eyebrowSize: "12px",
        eyebrowWeight: "720",
        h1Size: "clamp(36px, 4.2vw, 58px)",
        h1LineHeight: "1.04",
        h1Weight: "680",
        buttonWeight: "760",
        secondaryColor: "deep-green"
      }
    : {
      width: "66%",
      radius: "8px",
      paddingTop: "26px",
      paddingBottom: "26px",
      eyebrowSize: "13px",
      eyebrowWeight: "760",
      h1Size: "clamp(38px, 5vw, 64px)",
      h1LineHeight: "1.04",
      h1Weight: "720",
      buttonWeight: "760",
      secondaryColor: "deep-green"
    };
  const heroNote = isPetGallery
    ? {
      width: "36%",
      radius: "8px",
      backgroundColor: "grass",
      paddingTop: "24px",
      paddingBottom: "24px",
      labelSize: "12px",
      labelWeight: "650",
      textSize: "17px",
      textLineHeight: "1.5"
    }
    : isBalloonGallery
      ? {
        width: "34%",
        radius: "8px",
        backgroundColor: "deep-green",
        paddingTop: "22px",
        paddingBottom: "22px",
        labelSize: "12px",
        labelWeight: "700",
        textSize: "17px",
        textLineHeight: "1.5"
      }
    : isPicnicGallery
      ? {
        width: "38%",
        radius: "8px",
        backgroundColor: "deep-green",
        paddingTop: "22px",
        paddingBottom: "22px",
        labelSize: "12px",
        labelWeight: "720",
        textSize: "17px",
        textLineHeight: "1.48"
      }
    : {
      width: "34%",
      radius: "8px",
      backgroundColor: "deep-green",
      paddingTop: "24px",
      paddingBottom: "24px",
      labelSize: "13px",
      labelWeight: "760",
      textSize: "18px",
      textLineHeight: "1.48"
    };
  const heroParagraphSize = isPetGallery || isBalloonGallery ? "clamp(17px, 1.42vw, 20px)" : "clamp(18px, 1.55vw, 22px)";
  const heroParagraphLineHeight = isPetGallery ? "1.5" : "1.5";
  const heroParagraphMargin = isPetGallery || isBalloonGallery
    ? {
      blockAttr: '"spacing":{"margin":{"top":"18px","bottom":"0"}}',
      htmlStyle: "margin-top:18px;margin-bottom:0"
    }
    : {
      blockAttr: '"spacing":{"margin":{"bottom":"22px"}}',
      htmlStyle: "margin-bottom:22px"
    };
  const heroParagraph = `
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"${heroParagraphSize}","lineHeight":"${heroParagraphLineHeight}"},${heroParagraphMargin.blockAttr}}} -->
<p class="has-soil-color has-text-color" style="${heroParagraphMargin.htmlStyle};font-size:${heroParagraphSize};line-height:${heroParagraphLineHeight}">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->`.trim();
  const heroButtons = `
<!-- wp:buttons {"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"${heroCopy.buttonWeight}"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:${heroCopy.buttonWeight}"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="#${esc(quoteAnchor)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"${heroCopy.secondaryColor}","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"${heroCopy.buttonWeight}"}}} -->
<div class="wp-block-button is-style-outline" style="font-style:normal;font-weight:${heroCopy.buttonWeight}"><a class="wp-block-button__link has-${heroCopy.secondaryColor}-color has-text-color wp-element-button" href="#${esc(stylesAnchor)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->`.trim();
  const heroActionStack = isPetGallery || isBalloonGallery
    ? `${heroButtons}\n${heroParagraph}`
    : `${heroParagraph}\n${heroButtons}`;
  const galleryHeroPaddingTop = isPetGallery ? "34px" : "42px";
  const galleryHeroPaddingBottom = isPetGallery ? "46px" : "58px";

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

<!-- wp:group {"metadata":{"name":"Gallery hero"},"align":"full","className":"som-gallery-hero","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"${galleryHeroPaddingTop}","right":"24px","bottom":"${galleryHeroPaddingBottom}","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull som-gallery-hero has-cream-background-color has-background" style="padding-top:${galleryHeroPaddingTop};padding-right:24px;padding-bottom:${galleryHeroPaddingBottom};padding-left:24px">
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"full","linkDestination":"none","align":"wide","className":"som-gallery-image"} -->
<figure class="wp-block-image alignwide size-full som-gallery-image"><img src="{{hero_url}}" alt="" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
<!-- wp:columns {"align":"wide","className":"som-gallery-copy-row","verticalAlignment":"bottom","style":{"spacing":{"blockGap":{"left":"24px"}}}} -->
<div class="wp-block-columns alignwide are-vertically-aligned-bottom som-gallery-copy-row">
<!-- wp:column {"verticalAlignment":"bottom","width":"${heroCopy.width}","className":"som-gallery-copy","backgroundColor":"white","style":{"border":{"radius":"${heroCopy.radius}"},"spacing":{"padding":{"top":"${heroCopy.paddingTop}","right":"34px","bottom":"${heroCopy.paddingBottom}","left":"34px"}}}} -->
<div class="wp-block-column is-vertically-aligned-bottom som-gallery-copy has-white-background-color has-background" style="border-radius:${heroCopy.radius};padding-top:${heroCopy.paddingTop};padding-right:34px;padding-bottom:${heroCopy.paddingBottom};padding-left:34px;flex-basis:${heroCopy.width}">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"${heroCopy.eyebrowSize}","fontStyle":"normal","fontWeight":"${heroCopy.eyebrowWeight}","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:${heroCopy.eyebrowSize};font-style:normal;font-weight:${heroCopy.eyebrowWeight};letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"deep-green","style":{"typography":{"fontSize":"${heroCopy.h1Size}","lineHeight":"${heroCopy.h1LineHeight}","fontStyle":"normal","fontWeight":"${heroCopy.h1Weight}"},"spacing":{"margin":{"top":"10px","bottom":"18px"}}}} -->
<h1 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:10px;margin-bottom:18px;font-size:${heroCopy.h1Size};font-style:normal;font-weight:${heroCopy.h1Weight};line-height:${heroCopy.h1LineHeight}">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
${heroActionStack}
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"bottom","width":"${heroNote.width}","className":"som-gallery-note","backgroundColor":"${heroNote.backgroundColor}","style":{"border":{"radius":"${heroNote.radius}"},"spacing":{"padding":{"top":"${heroNote.paddingTop}","right":"28px","bottom":"${heroNote.paddingBottom}","left":"28px"}}}} -->
<div class="wp-block-column is-vertically-aligned-bottom som-gallery-note has-${heroNote.backgroundColor}-background-color has-background" style="border-radius:${heroNote.radius};padding-top:${heroNote.paddingTop};padding-right:28px;padding-bottom:${heroNote.paddingBottom};padding-left:28px;flex-basis:${heroNote.width}">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"${heroNote.labelSize}","fontStyle":"normal","fontWeight":"${heroNote.labelWeight}","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-sun-color has-text-color" style="font-size:${heroNote.labelSize};font-style:normal;font-weight:${heroNote.labelWeight};letter-spacing:0px;text-transform:uppercase">${esc(copy.introTitle)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"${heroNote.textSize}","lineHeight":"${heroNote.textLineHeight}"}}} -->
<p class="has-white-color has-text-color" style="font-size:${heroNote.textSize};line-height:${heroNote.textLineHeight}">${esc(copy.introText)}</p>
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

${visualProof}

<!-- wp:group {"metadata":{"name":"${esc(navLinks[0]?.label || "Styles")}"},"anchor":"${esc(stylesAnchor)}","align":"full","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"78px","right":"24px","bottom":"78px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="${esc(stylesAnchor)}" class="wp-block-group alignfull has-cream-background-color has-background" style="padding-top:78px;padding-right:24px;padding-bottom:78px;padding-left:24px">
<!-- wp:heading {"level":2,"align":"wide","textColor":"deep-green","style":{"typography":{"fontSize":"clamp(34px, 4.8vw, 56px)","lineHeight":"1.06","fontStyle":"normal","fontWeight":"720"},"spacing":{"margin":{"bottom":"30px"}}}} -->
<h2 class="wp-block-heading alignwide has-deep-green-color has-text-color" style="margin-bottom:30px;font-size:clamp(34px, 4.8vw, 56px);font-style:normal;font-weight:720;line-height:1.06">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"22px"}}}} -->
<div class="wp-block-columns alignwide">
${styles}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"${esc(navLinks[1]?.label || "Process")}"},"anchor":"${esc(processAnchor)}","align":"full","backgroundColor":"mist","style":{"spacing":{"padding":{"top":"78px","right":"24px","bottom":"78px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="${esc(processAnchor)}" class="wp-block-group alignfull has-mist-background-color has-background" style="padding-top:78px;padding-right:24px;padding-bottom:78px;padding-left:24px">
<!-- wp:heading {"level":2,"align":"wide","textColor":"deep-green","style":{"typography":{"fontSize":"clamp(32px, 4.5vw, 52px)","lineHeight":"1.06","fontStyle":"normal","fontWeight":"720"},"spacing":{"margin":{"bottom":"34px"}}}} -->
<h2 class="wp-block-heading alignwide has-deep-green-color has-text-color" style="margin-bottom:34px;font-size:clamp(32px, 4.5vw, 52px);font-style:normal;font-weight:720;line-height:1.06">${esc(copy.processTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"24px"}}}} -->
<div class="wp-block-columns alignwide">
${process}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"${esc(navLinks[2]?.label || "Quote")}"},"anchor":"${esc(quoteAnchor)}","align":"full","className":"som-quote-strip","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"70px","right":"24px","bottom":"34px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="${esc(quoteAnchor)}" class="wp-block-group alignfull som-quote-strip has-deep-green-background-color has-background" style="padding-top:70px;padding-right:24px;padding-bottom:34px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"42px"}}}} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"58%"} -->
<div class="wp-block-column" style="flex-basis:58%">
<!-- wp:heading {"level":2,"textColor":"white","style":{"typography":{"fontSize":"clamp(34px, 5vw, 58px)","lineHeight":"1.05","fontStyle":"normal","fontWeight":"720"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-white-color has-text-color" style="margin-bottom:18px;font-size:clamp(34px, 5vw, 58px);font-style:normal;font-weight:720;line-height:1.05">${esc(copy.quoteTitle)}</h2>
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
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","width":100,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"760"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100" style="font-style:normal;font-weight:760"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"white","width":100,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"760"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100 is-style-outline" style="font-style:normal;font-weight:760"><a class="wp-block-button__link has-white-color has-text-color wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(contact.phoneLabel)}</a></div>
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
  const heroChecklist = riskHeroChecklist(spec);
  const warnings = spec.services.map((item, index) => warningRow(index + 1, item.title, item.text)).join("\n");
  const plan = spec.process.map((item, index) => riskPlanStep(index + 1, item.title, item.text)).join("\n");
  const proof = spec.proof.map((item) => riskProofStatus(item.stat, item.label)).join("\n");

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

<!-- wp:cover {"url":"{{hero_url}}","id":{{hero_id}},"dimRatio":46,"overlayColor":"deep-green","isUserOverlayColor":true,"minHeight":680,"minHeightUnit":"px","contentPosition":"center center","align":"full","className":"som-risk-hero","style":{"spacing":{"padding":{"top":"72px","right":"24px","bottom":"76px","left":"24px"}}}} -->
<div class="wp-block-cover alignfull som-risk-hero" style="padding-top:72px;padding-right:24px;padding-bottom:76px;padding-left:24px;min-height:680px"><span aria-hidden="true" class="wp-block-cover__background has-deep-green-background-color has-background-dim-50 has-background-dim"></span><img class="wp-block-cover__image-background wp-image-{{hero_id}}" alt="" src="{{hero_url}}" data-object-fit="cover" data-object-position="52% 50%"/><div class="wp-block-cover__inner-container">
<!-- wp:columns {"align":"wide","verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"46px"}}}} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"56%","className":"som-risk-copy"} -->
<div class="wp-block-column is-vertically-aligned-center som-risk-copy" style="flex-basis:56%">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"850","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-sun-color has-text-color" style="font-size:16px;font-style:normal;font-weight:850;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"white","style":{"typography":{"fontSize":"clamp(46px, 6.8vw, 82px)","lineHeight":"0.98","fontStyle":"normal","fontWeight":"850"},"spacing":{"margin":{"top":"12px","bottom":"22px"}}}} -->
<h1 class="wp-block-heading has-white-color has-text-color" style="margin-top:12px;margin-bottom:22px;font-size:clamp(46px, 6.8vw, 82px);font-style:normal;font-weight:850;line-height:0.98">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"clamp(19px, 1.8vw, 24px)","lineHeight":"1.5"},"spacing":{"margin":{"bottom":"28px"}}}} -->
<p class="has-white-color has-text-color" style="margin-bottom:28px;font-size:clamp(19px, 1.8vw, 24px);line-height:1.5">${esc(copy.heroText)}</p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"style":{"spacing":{"blockGap":"12px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"780"}}} -->
<div class="wp-block-button" style="font-style:normal;font-weight:780"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"white","style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"22px","right":"22px"}},"typography":{"fontStyle":"normal","fontWeight":"780"}}} -->
<div class="wp-block-button is-style-outline" style="font-style:normal;font-weight:780"><a class="wp-block-button__link has-white-color has-text-color wp-element-button" href="#signs" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.secondaryCta)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"44%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:44%">
${heroChecklist}
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div></div>
<!-- /wp:cover -->

<!-- wp:group {"metadata":{"name":"Risk proof band"},"align":"full","className":"som-risk-band","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"28px","right":"24px","bottom":"28px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull som-risk-band has-deep-green-background-color has-background" style="padding-top:28px;padding-right:24px;padding-bottom:28px;padding-left:24px">
<!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"left":"12px"}}}} -->
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
<!-- wp:heading {"level":2,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(36px, 5.6vw, 64px)","lineHeight":"1","fontStyle":"normal","fontWeight":"850"},"spacing":{"margin":{"bottom":"18px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:18px;font-size:clamp(36px, 5.6vw, 64px);font-style:normal;font-weight:850;line-height:1">${esc(copy.servicesTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"20px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:20px;line-height:1.55">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
<!-- wp:group {"className":"som-risk-area-note","backgroundColor":"white","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"20px","right":"22px","bottom":"20px","left":"22px"},"margin":{"top":"26px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-risk-area-note has-white-background-color has-background" style="border-radius:8px;margin-top:26px;padding-top:20px;padding-right:22px;padding-bottom:20px;padding-left:22px">
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"800","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<p class="has-deep-green-color has-text-color" style="margin-bottom:8px;font-size:14px;font-style:normal;font-weight:800;letter-spacing:0px;text-transform:uppercase">Service area</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.5"}}} -->
<p class="has-soil-color has-text-color" style="font-size:17px;line-height:1.5">${esc(contact.serviceArea)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
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
  const routeTable = corePlanIncludes(spec, "table")
    ? serviceScopeTable(spec, {
      className: "som-route-plan-table",
      headings: ["Care lane", "Route cue", "Visit note"]
    })
    : "";
  const detailStack = corePlanIncludes(spec, "details")
    ? serviceDetailsBlock(spec, {
      groupClassName: "som-route-plan-details",
      detailClassName: "som-route-plan-detail",
      fitSummary: "How do we choose the right route rhythm?"
    })
    : "";

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

<!-- wp:cover {"url":"{{hero_url}}","id":{{hero_id}},"dimRatio":28,"overlayColor":"deep-green","isUserOverlayColor":true,"minHeight":720,"minHeightUnit":"px","contentPosition":"center left","align":"full","className":"som-route-plan-cover","style":{"spacing":{"padding":{"top":"80px","right":"24px","bottom":"90px","left":"24px"}}}} -->
<div class="wp-block-cover alignfull has-custom-content-position is-position-center-left som-route-plan-cover" style="padding-top:80px;padding-right:24px;padding-bottom:90px;padding-left:24px;min-height:720px"><span aria-hidden="true" class="wp-block-cover__background has-deep-green-background-color has-background-dim-30 has-background-dim"></span><img class="wp-block-cover__image-background wp-image-{{hero_id}}" alt="" src="{{hero_url}}" data-object-fit="cover" data-object-position="68% 50%"/><div class="wp-block-cover__inner-container">
<!-- wp:group {"className":"som-route-hero-panel","backgroundColor":"cream","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"34px","right":"34px","bottom":"30px","left":"34px"}}},"layout":{"type":"constrained","contentSize":"620px","justifyContent":"left"}} -->
<div class="wp-block-group som-route-hero-panel has-cream-background-color has-background" style="border-radius:8px;padding-top:34px;padding-right:34px;padding-bottom:30px;padding-left:34px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"17px","fontStyle":"normal","fontWeight":"800","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:17px;font-style:normal;font-weight:800;letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(44px, 7vw, 92px)","lineHeight":"0.96","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"12px","bottom":"22px"}}}} -->
<h1 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:12px;margin-bottom:22px;font-size:clamp(44px, 7vw, 92px);font-style:normal;font-weight:900;line-height:0.96">${esc(copy.heroTitle)}</h1>
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
<div class="wp-block-button is-style-outline" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-text-color wp-element-button" href="#services" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.secondaryCta)}</a></div>
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
<p class="has-grass-color has-text-color" style="font-size:18px;font-style:normal;font-weight:800">Send plant photos, room light, and watering history. Get a care rhythm before another leaf gets mysterious.</p>
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
${routeTable}
${detailStack}
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
  const layoutVariant = layoutVariantFor(spec);
  const navLinks = navModelForSpec(spec, ["Photo quote", "Surfaces", "Method"], ["quote", "surfaces", "method"]);
  const transformationCopy = transformationCopyModel(spec);
  const methodLabels = transformationMethodLabels(spec);
  const surfaces = spec.services
    .map((item, index) => surfaceRow(index + 1, item.title, item.text, methodLabels[index] || "Custom plan"))
    .join("\n");
  const timeline = spec.process
    .map((item, index) => timelineStep(index + 1, item.title, item.text))
    .join("\n");
  const proof = spec.proof
    .map((item) => compactProof(item.stat, item.label))
    .join("\n");
  const methodTable = transformationMethodTable(spec);
  const prepDetails = transformationPrepDetails(spec);
  const heroTextColumn = beforeAfterHeroTextColumn(spec, transformationCopy);
  const heroMediaColumn = beforeAfterHeroMediaColumn(spec, transformationCopy);
  const isWindowScope = layoutVariant === "window-scope-ledger";
  const isFurnitureProof = layoutVariant === "furniture-refinish-proof";
  const imageFirstHero = ["furniture-refinish-proof", "window-scope-ledger"].includes(layoutVariant);
  const heroClassName = isWindowScope
    ? "som-split-hero som-window-split-hero"
    : "som-split-hero";
  const heroWrapClassName = isWindowScope
    ? ',"className":"som-window-hero-wrap"'
    : "";
  const heroWrapHtmlClass = isWindowScope
    ? "wp-block-group alignfull som-window-hero-wrap has-cream-background-color has-background"
    : "wp-block-group alignfull has-cream-background-color has-background";
  const heroPaddingTop = isWindowScope ? "50px" : isFurnitureProof ? "46px" : "64px";
  const heroPaddingBottom = isWindowScope ? "58px" : isFurnitureProof ? "54px" : "74px";
  const heroColumns = imageFirstHero
    ? `${heroMediaColumn}\n${heroTextColumn}`
    : `${heroTextColumn}\n${heroMediaColumn}`;
  const heroEvidenceBand = "";

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

<!-- wp:group {"metadata":{"name":"Before/after hero"},"align":"full"${heroWrapClassName},"backgroundColor":"cream","style":{"spacing":{"padding":{"top":"${heroPaddingTop}","right":"24px","bottom":"${heroPaddingBottom}","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="${heroWrapHtmlClass}" style="padding-top:${heroPaddingTop};padding-right:24px;padding-bottom:${heroPaddingBottom};padding-left:24px">
<!-- wp:columns {"align":"wide","className":"${heroClassName}","style":{"spacing":{"blockGap":{"left":"52px"}}}} -->
<div class="wp-block-columns alignwide ${heroClassName}">
${heroColumns}
</div>
<!-- /wp:columns -->
${heroEvidenceBand}
</div>
<!-- /wp:group -->

${floatingProofActionPanel(spec)}

<!-- wp:group {"metadata":{"name":"Photo quote"},"anchor":"quote","align":"full","backgroundColor":"deep-green","style":{"spacing":{"padding":{"top":"42px","right":"24px","bottom":"42px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div id="quote" class="wp-block-group alignfull has-deep-green-background-color has-background" style="padding-top:42px;padding-right:24px;padding-bottom:42px;padding-left:24px">
<!-- wp:columns {"align":"wide","className":"som-quote-strip","style":{"spacing":{"blockGap":{"left":"34px"}}}} -->
<div class="wp-block-columns alignwide som-quote-strip">
<!-- wp:column {"width":"40%"} -->
<div class="wp-block-column" style="flex-basis:40%">
<!-- wp:heading {"level":2,"textColor":"white","style":{"typography":{"fontSize":"clamp(34px, 5vw, 58px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"12px"}}}} -->
<h2 class="wp-block-heading has-white-color has-text-color" style="margin-bottom:12px;font-size:clamp(34px, 5vw, 58px);font-style:normal;font-weight:900;line-height:1">${esc(transformationCopy.quoteTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"19px","lineHeight":"1.45"}}} -->
<p class="has-white-color has-text-color" style="font-size:19px;line-height:1.45">${esc(transformationCopy.quoteIntro)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"36%"} -->
<div class="wp-block-column" style="flex-basis:36%">
<!-- wp:list {"textColor":"white","className":"som-check-list","style":{"typography":{"fontSize":"18px","lineHeight":"1.55","fontStyle":"normal","fontWeight":"700"}}} -->
<ul class="som-check-list has-white-color has-text-color" style="font-size:18px;font-style:normal;font-weight:700;line-height:1.55">${transformationCopy.quoteItems.map((item) => `<!-- wp:list-item --><li>${esc(item)}</li><!-- /wp:list-item -->`).join("")}</ul>
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
<p class="has-text-align-center has-soil-color has-text-color" style="margin-bottom:38px;font-size:20px;line-height:1.5">${esc(transformationCopy.surfacesIntro)}</p>
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
<p class="has-grass-color has-text-color" style="font-size:16px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(transformationCopy.methodEyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":2,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(36px, 5.8vw, 66px)","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"10px","bottom":"20px"}}}} -->
<h2 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:10px;margin-bottom:20px;font-size:clamp(36px, 5.8vw, 66px);font-style:normal;font-weight:900;line-height:1">${esc(transformationCopy.methodTitle)}</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"20px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:20px;line-height:1.55">${esc(copy.introText)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"52%","backgroundColor":"white","style":{"border":{"radius":"24px"},"spacing":{"padding":{"top":"34px","right":"34px","bottom":"34px","left":"34px"}}}} -->
<div class="wp-block-column has-white-background-color has-background" style="border-radius:24px;padding-top:34px;padding-right:34px;padding-bottom:34px;padding-left:34px;flex-basis:52%">
${methodTable}
${prepDetails}
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

function beforeAfterHeroTextColumn(spec, transformationCopy) {
  const { copy } = spec;
  const isWindow = layoutVariantFor(spec) === "window-scope-ledger";
  const isFurniture = layoutVariantFor(spec) === "furniture-refinish-proof";
  const columnClassName = isWindow
    ? ',"className":"som-window-hero-copy-column"'
    : isFurniture
      ? ',"className":"som-furniture-hero-copy-column"'
      : "";
  const columnHtmlClass = isWindow
    ? "wp-block-column som-window-hero-copy-column"
    : isFurniture
      ? "wp-block-column som-furniture-hero-copy-column"
      : "wp-block-column";
  const eyebrowSize = isWindow ? "13px" : "17px";
  const eyebrowWeight = isWindow ? "680" : "900";
  const heroTextColor = isWindow ? "deep-green" : "soil";
  const heroTextSize = isWindow ? "clamp(17px, 1.45vw, 21px)" : "clamp(20px, 2vw, 27px)";
  const heroTextLineHeight = isWindow ? "1.5" : "1.45";
  return `
<!-- wp:column {"width":"47%"${columnClassName},"style":{"spacing":{"padding":{"top":"24px","bottom":"24px"}}}} -->
<div class="${columnHtmlClass}" style="padding-top:24px;padding-bottom:24px;flex-basis:47%">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"${eyebrowSize}","fontStyle":"normal","fontWeight":"${eyebrowWeight}","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:${eyebrowSize};font-style:normal;font-weight:${eyebrowWeight};letter-spacing:0px;text-transform:uppercase">${esc(copy.eyebrow)}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textColor":"deep-green","style":{"typography":{"fontSize":"clamp(50px, 7.4vw, 98px)","lineHeight":"0.92","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"top":"12px","bottom":"22px"}}}} -->
<h1 class="wp-block-heading has-deep-green-color has-text-color" style="margin-top:12px;margin-bottom:22px;font-size:clamp(50px, 7.4vw, 98px);font-style:normal;font-weight:900;line-height:0.92">${esc(copy.heroTitle)}</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"${heroTextColor}","style":{"typography":{"fontSize":"${heroTextSize}","lineHeight":"${heroTextLineHeight}"},"spacing":{"margin":{"bottom":"30px"}}}} -->
<p class="has-${heroTextColor}-color has-text-color" style="margin-bottom:30px;font-size:${heroTextSize};line-height:${heroTextLineHeight}">${esc(copy.heroText)}</p>
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
${transformationCopy.chips.map((chip) => `
<!-- wp:paragraph {"className":"som-chip","backgroundColor":"mist","textColor":"deep-green","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900"},"spacing":{"padding":{"top":"10px","right":"14px","bottom":"10px","left":"14px"}}}} -->
<p class="som-chip has-deep-green-color has-mist-background-color has-text-color has-background" style="padding-top:10px;padding-right:14px;padding-bottom:10px;padding-left:14px;font-size:15px;font-style:normal;font-weight:900">${esc(chip)}</p>
<!-- /wp:paragraph -->`.trim()).join("\n")}
</div>
<!-- /wp:group -->
</div>
<!-- /wp:column -->`.trim();
}

function beforeAfterHeroMediaColumn(spec, transformationCopy) {
  const isWindow = layoutVariantFor(spec) === "window-scope-ledger";
  const isFurniture = layoutVariantFor(spec) === "furniture-refinish-proof";
  const columnClassName = isWindow
    ? ',"className":"som-window-hero-media-column"'
    : isFurniture
      ? ',"className":"som-furniture-hero-media-column"'
      : "";
  const columnHtmlClass = isWindow
    ? "wp-block-column som-window-hero-media-column"
    : isFurniture
      ? "wp-block-column som-furniture-hero-media-column"
      : "wp-block-column";
  const evidenceCards = beforeAfterEvidenceColumns(transformationCopy, spec);
  return `
<!-- wp:column {"width":"53%"${columnClassName}} -->
<div class="${columnHtmlClass}" style="flex-basis:53%">
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"full","linkDestination":"none","className":"som-hero-photo"} -->
<figure class="wp-block-image size-full som-hero-photo"><img src="{{hero_url}}" alt="" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
${evidenceCards}
</div>
<!-- /wp:column -->`.trim();
}

function beforeAfterEvidenceColumns(transformationCopy, spec) {
  const isWindow = layoutVariantFor(spec) === "window-scope-ledger";
  const textWeight = isWindow ? "680" : null;
  return `
<!-- wp:columns {"className":"som-before-after","style":{"spacing":{"blockGap":{"left":"12px"},"margin":{"top":"12px"}}}} -->
<div class="wp-block-columns som-before-after" style="margin-top:12px">
${beforeAfterEvidenceCard("Before", "deep-green", "sun", "white", transformationCopy.beforeText, textWeight || "800")}
${beforeAfterEvidenceCard("After", "leaf", "deep-green", "deep-green", transformationCopy.afterText, textWeight || "900")}
</div>
<!-- /wp:columns -->`.trim();
}

function beforeAfterEvidenceCard(label, backgroundColor, labelColor, textColor, text, textWeight) {
  return `
<!-- wp:column {"className":"som-evidence-card","backgroundColor":"${backgroundColor}","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"18px","right":"20px","bottom":"18px","left":"20px"}}}} -->
<div class="wp-block-column som-evidence-card has-${backgroundColor}-background-color has-background" style="border-radius:8px;padding-top:18px;padding-right:20px;padding-bottom:18px;padding-left:20px">
<!-- wp:paragraph {"textColor":"${labelColor}","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-${labelColor}-color has-text-color" style="font-size:14px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(label)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"${textColor}","style":{"typography":{"fontSize":"18px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"${textWeight}"}}} -->
<p class="has-${textColor}-color has-text-color" style="font-size:18px;font-style:normal;font-weight:${textWeight};line-height:1.45">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function floatingProofActionPanel(spec) {
  const { contact, copy } = spec;
  const proof = spec.proof.slice(0, 2);
  const firstProof = proof[0] || { stat: "Photo", label: "send the surface and stain" };
  const secondProof = proof[1] || { stat: "Plan", label: "clear method before arrival" };

  return `
<!-- wp:group {"metadata":{"name":"Floating proof action"},"align":"full","className":"som-floating-proof-action-wrap","backgroundColor":"cream","style":{"spacing":{"padding":{"top":"0","right":"24px","bottom":"0","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull som-floating-proof-action-wrap has-cream-background-color has-background" style="padding-top:0;padding-right:24px;padding-bottom:0;padding-left:24px">
<!-- wp:columns {"align":"wide","verticalAlignment":"center","className":"som-floating-proof-action","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"18px","right":"22px","bottom":"18px","left":"22px"},"blockGap":{"left":"18px"}}}} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center som-floating-proof-action" style="border-radius:8px;padding-top:18px;padding-right:22px;padding-bottom:18px;padding-left:22px">
<!-- wp:column {"verticalAlignment":"center","width":"36%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:36%">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="has-grass-color has-text-color" style="font-size:13px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">Proof before pricing</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"18px","lineHeight":"1.5","fontStyle":"normal","fontWeight":"760"},"spacing":{"margin":{"top":"5px","bottom":"0"}}}} -->
<p class="has-deep-green-color has-text-color" style="margin-top:5px;margin-bottom:0;font-size:18px;font-style:normal;font-weight:760;line-height:1.5">${esc(copy.secondaryCta)} with the surface, access, and worst spot in frame.</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"36%","className":"som-floating-proof-stats"} -->
<div class="wp-block-column is-vertically-aligned-center som-floating-proof-stats" style="flex-basis:36%">
<!-- wp:columns {"isStackedOnMobile":false,"style":{"spacing":{"blockGap":{"left":"10px"}}}} -->
<div class="wp-block-columns is-not-stacked-on-mobile">
${floatingProofCell(firstProof.stat, firstProof.label)}
${floatingProofCell(secondProof.stat, secondProof.label)}
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center","width":"28%","className":"som-floating-proof-buttons"} -->
<div class="wp-block-column is-vertically-aligned-center som-floating-proof-buttons" style="flex-basis:28%">
<!-- wp:buttons {"style":{"spacing":{"blockGap":"10px"}}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"sun","textColor":"deep-green","width":100,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"12px","bottom":"12px","left":"18px","right":"18px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-sun-background-color has-text-color has-background wp-element-button" href="${esc(contact.emailHref)}" style="border-radius:999px;padding-top:12px;padding-right:18px;padding-bottom:12px;padding-left:18px">${esc(copy.primaryCta)}</a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline","textColor":"deep-green","width":100,"style":{"border":{"radius":"999px"},"spacing":{"padding":{"top":"12px","bottom":"12px","left":"18px","right":"18px"}},"typography":{"fontStyle":"normal","fontWeight":"800"}}} -->
<div class="wp-block-button has-custom-width wp-block-button__width-100 is-style-outline" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-text-color wp-element-button" href="${esc(contact.phoneHref)}" style="border-radius:999px;padding-top:12px;padding-right:18px;padding-bottom:12px;padding-left:18px">${esc(contact.phoneLabel)}</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->`.trim();
}

function floatingProofCell(stat, label) {
  return `
<!-- wp:column {"className":"som-floating-proof-cell"} -->
<div class="wp-block-column som-floating-proof-cell">
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"24px","lineHeight":"1","fontStyle":"normal","fontWeight":"900"},"spacing":{"margin":{"bottom":"5px"}}}} -->
<p class="has-deep-green-color has-text-color" style="margin-bottom:5px;font-size:24px;font-style:normal;font-weight:900;line-height:1">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"14px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"750"}}} -->
<p class="has-soil-color has-text-color" style="font-size:14px;font-style:normal;font-weight:750;line-height:1.45">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function zoneMap(proof, spec) {
  const items = proof.slice(0, 3);
  const cells = layoutVariantFor(spec) === "pollinator-season-board"
    ? [
      ["Sun", "sun"],
      ["Soil", "grass"],
      ["Bloom", "cream"],
      ["Edge", "leaf"]
    ]
    : [
      ["Tools", "sun"],
      ["Sports", "grass"],
      ["Seasonal", "cream"],
      ["Overflow", "leaf"]
    ];
  const mapLabel = layoutVariantFor(spec) === "pollinator-season-board" ? "Bloom board" : "Zone map";

  return `
<!-- wp:group {"className":"som-zone-map","backgroundColor":"soil","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"18px","right":"18px","bottom":"16px","left":"18px"},"margin":{"top":"26px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-zone-map has-soil-background-color has-background" style="border-radius:8px;margin-top:26px;padding-top:18px;padding-right:18px;padding-bottom:16px;padding-left:18px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"12px"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:12px;font-size:13px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(mapLabel)}</p>
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

function pollinatorSeasonPathTable() {
  const rows = [
    ["Spring", "Edit tired growth, open the edge, and place early color where the bed wakes up first."],
    ["Summer", "Layer native blooms and soft grasses so the bed carries color without swallowing the walk."],
    ["Fall", "Keep seed heads, texture, and tidy mulch notes so habitat still looks neighborly."]
  ];
  return `
<!-- wp:table {"className":"som-zone-map som-pollinator-map som-pollinator-season-table"} -->
<figure class="wp-block-table som-zone-map som-pollinator-map som-pollinator-season-table"><table>${tableCaption("Season path notes")}<colgroup><col style="width:112px"><col></colgroup>${tableHead(["When", "Field note"])}<tbody>${rows.map(([season, note]) => `<tr><td>${esc(season)}</td><td>${esc(note)}</td></tr>`).join("")}</tbody></table></figure>
<!-- /wp:table -->`.trim();
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

function deckFinishSampleTable(proof) {
  const [weather, application, photos] = proof;
  const rows = [
    ["Surface", photos?.label || "board photos, peeling spots, rails, gates, and shade patterns"],
    ["Method", application?.label || "brush, pad, or controlled spray around edges and rail detail"],
    ["Window", weather?.label || "dry-weather timing before stain day"]
  ];
  return `
<!-- wp:table {"className":"som-workshop-scope-table som-finish-sample-table"} -->
<figure class="wp-block-table som-workshop-scope-table som-finish-sample-table"><table>${tableCaption("Finish sample checks")}<colgroup><col style="width:108px"><col></colgroup>${tableHead(["Sample", "What we check"])}<tbody>${rows.map(([label, note]) => `<tr><td>${esc(label)}</td><td>${esc(note)}</td></tr>`).join("")}</tbody></table></figure>
<!-- /wp:table -->`.trim();
}

function workshopTicket(proof, options = {}) {
  const label = options.label || "Bench check";
  const items = proof.slice(0, 3);
  const compact = Boolean(options.compact);
  const marginTop = compact ? "18px" : "28px";
  const padding = compact
    ? { top: "14px", right: "16px", bottom: "14px", left: "16px" }
    : { top: "18px", right: "20px", bottom: "18px", left: "20px" };
  const labelSize = compact ? "13px" : "14px";
  const labelMargin = compact ? "8px" : "10px";
  const rowSize = compact ? "14px" : "15px";
  const rowLineHeight = compact ? "1.38" : "1.45";
  const rowMargin = compact ? "5px" : "7px";
  return `
<!-- wp:group {"className":"som-workshop-ticket","backgroundColor":"soil","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"${padding.top}","right":"${padding.right}","bottom":"${padding.bottom}","left":"${padding.left}"},"margin":{"top":"${marginTop}"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-workshop-ticket has-soil-background-color has-background" style="border-radius:8px;margin-top:${marginTop};padding-top:${padding.top};padding-right:${padding.right};padding-bottom:${padding.bottom};padding-left:${padding.left}">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"${labelSize}","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"${labelMargin}"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:${labelMargin};font-size:${labelSize};font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(label)}</p>
<!-- /wp:paragraph -->
${items.map((item) => `
<!-- wp:paragraph {"textColor":"cream","className":"som-ticket-line","style":{"typography":{"fontSize":"${rowSize}","fontStyle":"normal","fontWeight":"850","lineHeight":"${rowLineHeight}"},"spacing":{"margin":{"bottom":"${rowMargin}"}}}} -->
<p class="som-ticket-line has-cream-color has-text-color" style="margin-bottom:${rowMargin};font-size:${rowSize};font-style:normal;font-weight:850;line-height:${rowLineHeight}"><strong>${esc(item.stat)}</strong> / ${esc(item.label)}</p>
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

function detailTicket(items, spec) {
  const rows = items.slice(0, 3).map((item) => `
<!-- wp:paragraph {"className":"som-ticket-line","textColor":"mist","style":{"typography":{"fontSize":"14px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"800"},"spacing":{"margin":{"top":"0","bottom":"8px"}}}} -->
<p class="som-ticket-line has-mist-color has-text-color" style="margin-top:0;margin-bottom:8px;font-size:14px;font-style:normal;font-weight:800;line-height:1.45"><strong>${esc(item.stat)}</strong> / ${esc(item.label)}</p>
<!-- /wp:paragraph -->`).join("\n");

  const label = layoutVariantFor(spec) === "pet-portrait-booking-dock"
    ? "Session kit"
    : layoutVariantFor(spec) === "photo-booth-strip-packages"
      ? "Event kit"
      : "Detail kit";

  return `
<!-- wp:group {"className":"som-detail-ticket","backgroundColor":"grass","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"18px","right":"18px","bottom":"10px","left":"18px"},"margin":{"top":"20px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-detail-ticket has-grass-background-color has-background" style="border-radius:18px;margin-top:20px;padding-top:18px;padding-right:18px;padding-bottom:10px;padding-left:18px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"10px"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:10px;font-size:13px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(label)}</p>
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

function detailPackageCard(number, title, text, spec) {
  const label = layoutVariantFor(spec) === "pet-portrait-booking-dock"
    ? "Session"
    : layoutVariantFor(spec) === "photo-booth-strip-packages"
      ? "Booth"
      : "Detail";
  return `
<!-- wp:column {"className":"som-detail-package","backgroundColor":"white","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"30px","right":"28px","bottom":"30px","left":"28px"}}}} -->
<div class="wp-block-column som-detail-package has-white-background-color has-background" style="border-radius:18px;padding-top:30px;padding-right:28px;padding-bottom:30px;padding-left:28px">
<!-- wp:paragraph {"textColor":"leaf","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<p class="has-leaf-color has-text-color" style="margin-bottom:14px;font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(label)} ${number}</p>
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
  const ticketLineColor = layoutVariantFor(spec) === "mocktail-cart-menu" ? "soil" : "mist";
  const rows = spec.services.slice(0, 3).map((item) => `
<!-- wp:paragraph {"className":"som-ticket-line","textColor":"${ticketLineColor}","style":{"typography":{"fontSize":"14px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"800"},"spacing":{"margin":{"top":"0","bottom":"8px"}}}} -->
<p class="som-ticket-line has-${ticketLineColor}-color has-text-color" style="margin-top:0;margin-bottom:8px;font-size:14px;font-style:normal;font-weight:800;line-height:1.45"><strong>${esc(item.title)}</strong> / ${esc(item.text)}</p>
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
<!-- wp:group {"className":"som-warning-row","backgroundColor":"white","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"22px","right":"24px","bottom":"22px","left":"24px"},"margin":{"bottom":"14px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-warning-row has-white-background-color has-background" style="border-radius:8px;margin-bottom:14px;padding-top:22px;padding-right:24px;padding-bottom:22px;padding-left:24px">
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

function riskHeroChecklist(spec) {
  const items = spec.services
    .slice(0, 3)
    .map((service) => `<!-- wp:list-item --><li>${esc(service.title)}</li><!-- /wp:list-item -->`)
    .join("");

  return `
<!-- wp:group {"className":"som-risk-panel","backgroundColor":"cream","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"24px","right":"26px","bottom":"24px","left":"26px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-risk-panel has-cream-background-color has-background" style="border-radius:8px;padding-top:24px;padding-right:26px;padding-bottom:24px;padding-left:26px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"800","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"10px"}}}} -->
<p class="has-grass-color has-text-color" style="margin-bottom:10px;font-size:14px;font-style:normal;font-weight:800;letter-spacing:0px;text-transform:uppercase">Check before the next storm</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"22px","lineHeight":"1.18","fontStyle":"normal","fontWeight":"780"},"spacing":{"margin":{"bottom":"16px"}}}} -->
<p class="has-deep-green-color has-text-color" style="margin-bottom:16px;font-size:22px;font-style:normal;font-weight:780;line-height:1.18">${esc(spec.copy.introTitle)}</p>
<!-- /wp:paragraph -->
<!-- wp:list {"textColor":"soil","className":"som-risk-checklist","style":{"typography":{"fontSize":"17px","lineHeight":"1.55","fontStyle":"normal","fontWeight":"650"},"spacing":{"padding":{"left":"20px"},"margin":{"bottom":"0"}}}} -->
<ul class="som-risk-checklist has-soil-color has-text-color" style="margin-bottom:0;padding-left:20px;font-size:17px;font-style:normal;font-weight:650;line-height:1.55">${items}</ul>
<!-- /wp:list -->
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

function headshotShotPlan(spec) {
  const rows = spec.proof.slice(0, 3);
  return `
<!-- wp:group {"className":"som-gallery-note som-headshot-shot-plan","backgroundColor":"white","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"16px","right":"18px","bottom":"16px","left":"18px"},"margin":{"top":"4px"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group som-gallery-note som-headshot-shot-plan has-white-background-color has-background" style="border-radius:8px;margin-top:4px;padding-top:16px;padding-right:18px;padding-bottom:16px;padding-left:18px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"12px","fontStyle":"normal","fontWeight":"760","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<p class="has-grass-color has-text-color" style="margin-bottom:8px;font-size:12px;font-style:normal;font-weight:760;letter-spacing:0px;text-transform:uppercase">Portrait-session prep strip</p>
<!-- /wp:paragraph -->
<!-- wp:list {"className":"som-headshot-shot-list","textColor":"soil","style":{"typography":{"fontSize":"15px","lineHeight":"1.45"}}} -->
<ul class="som-headshot-shot-list has-soil-color has-text-color" style="font-size:15px;line-height:1.45">${rows.map((item) => `<li><strong>${esc(item.stat)}</strong>: ${esc(item.label)}</li>`).join("")}</ul>
<!-- /wp:list -->
</div>
<!-- /wp:group -->`.trim();
}

function headshotContactSheet(spec) {
  const imageAlt = spec.assetMeta?.hero?.alt || `${spec.businessName} studio portrait session`;
  const proof = spec.proof[0] || {};
  const quote = proof.label ? `${proof.stat}: ${proof.label}.` : spec.copy.introText;

  return `
<!-- wp:group {"metadata":{"name":"Contact sheet proof"},"align":"full","backgroundColor":"white","style":{"spacing":{"padding":{"top":"46px","right":"24px","bottom":"46px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1040px"}} -->
<div class="wp-block-group alignfull has-white-background-color has-background" style="padding-top:46px;padding-right:24px;padding-bottom:46px;padding-left:24px">
<!-- wp:gallery {"linkTo":"none","columns":3,"imageCrop":true,"className":"som-proof-gallery som-contact-sheet som-gallery-image"} -->
<figure class="wp-block-gallery has-nested-images columns-3 is-cropped som-proof-gallery som-contact-sheet som-gallery-image">
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"large","linkDestination":"none","className":"som-contact-crop som-contact-crop-wide"} -->
<figure class="wp-block-image size-large som-contact-crop som-contact-crop-wide"><img src="{{hero_url}}" alt="${esc(imageAlt)} wide studio proof crop" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"large","linkDestination":"none","className":"som-contact-crop som-contact-crop-portrait"} -->
<figure class="wp-block-image size-large som-contact-crop som-contact-crop-portrait"><img src="{{hero_url}}" alt="${esc(imageAlt)} portrait expression proof crop" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"large","linkDestination":"none","className":"som-contact-crop som-contact-crop-studio"} -->
<figure class="wp-block-image size-large som-contact-crop som-contact-crop-studio"><img src="{{hero_url}}" alt="${esc(imageAlt)} lighting and setup proof crop" class="wp-image-{{hero_id}}"/></figure>
<!-- /wp:image -->
</figure>
<!-- /wp:gallery -->
<!-- wp:quote {"className":"som-gallery-quote"} -->
<blockquote class="wp-block-quote som-gallery-quote"><p>${esc(quote)}</p><cite>${esc(spec.businessName)} proofing note</cite></blockquote>
<!-- /wp:quote -->
</div>
<!-- /wp:group -->`.trim();
}

function headshotProofChip(stat, label) {
  return `
<!-- wp:column {"className":"som-gallery-proof","backgroundColor":"white","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"18px","right":"18px","bottom":"18px","left":"18px"}}}} -->
<div class="wp-block-column som-gallery-proof has-white-background-color has-background" style="border-radius:8px;padding-top:18px;padding-right:18px;padding-bottom:18px;padding-left:18px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"14px","lineHeight":"1.15","fontStyle":"normal","fontWeight":"760","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"6px"}}}} -->
<p class="has-grass-color has-text-color" style="margin-bottom:6px;font-size:14px;font-style:normal;font-weight:760;letter-spacing:0px;line-height:1.15;text-transform:uppercase">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"15px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"650"}}} -->
<p class="has-soil-color has-text-color" style="font-size:15px;font-style:normal;font-weight:650;line-height:1.45">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function galleryVisualProof(spec) {
  const proof = spec.proof[0] || {};
  const imageAlt = spec.assetMeta?.hero?.alt || `${spec.businessName} service proof image`;
  const caption = spec.pattern?.imageEvidence || spec.copy.introTitle;
  const quote = proof.label ? `${proof.stat}: ${proof.label}.` : spec.copy.introText;

  return `
<!-- wp:group {"metadata":{"name":"Visual proof"},"align":"full","backgroundColor":"white","style":{"spacing":{"padding":{"top":"54px","right":"24px","bottom":"54px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"980px"}} -->
<div class="wp-block-group alignfull has-white-background-color has-background" style="padding-top:54px;padding-right:24px;padding-bottom:54px;padding-left:24px">
<!-- wp:gallery {"linkTo":"none","columns":1,"imageCrop":false,"className":"som-proof-gallery"} -->
<figure class="wp-block-gallery has-nested-images columns-1 som-proof-gallery">
<!-- wp:image {"id":{{hero_id}},"sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full"><img src="{{hero_url}}" alt="${esc(imageAlt)}" class="wp-image-{{hero_id}}"/><figcaption>${esc(caption)}</figcaption></figure>
<!-- /wp:image -->
</figure>
<!-- /wp:gallery -->
<!-- wp:quote {"className":"som-gallery-quote"} -->
<blockquote class="wp-block-quote som-gallery-quote"><p>${esc(quote)}</p><cite>${esc(spec.businessName)}</cite></blockquote>
<!-- /wp:quote -->
</div>
<!-- /wp:group -->`.trim();
}

function checklistTrustQuote(spec) {
  const proof = spec.proof[0] || {};
  const quote = proof.label ? `${proof.stat}: ${proof.label}.` : spec.copy.introText;

  return `
<!-- wp:quote {"className":"som-check-quote"} -->
<blockquote class="wp-block-quote som-check-quote"><p>${esc(quote)}</p><cite>${esc(spec.businessName)}</cite></blockquote>
<!-- /wp:quote -->`.trim();
}

function checklistDetails(spec) {
  const { contact, copy } = spec;
  const rows = [
    {
      summary: "What should I send first?",
      text: copy.quoteText
    },
    {
      summary: "How does scheduling work?",
      text: spec.process[0]?.text || "Send the basics, we confirm the fit, then we hold a clear service window before anything is booked."
    },
    {
      summary: "Where do you work?",
      text: contact.serviceArea
    }
  ];

  return `
<!-- wp:group {"className":"som-check-details","style":{"spacing":{"margin":{"top":"18px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-check-details" style="margin-top:18px">
${rows.map(({ summary, text }) => `
<!-- wp:details {"className":"som-check-detail"} -->
<details class="wp-block-details som-check-detail"><summary>${esc(summary)}</summary>
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.58"},"spacing":{"margin":{"top":"12px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-top:12px;font-size:17px;line-height:1.58">${esc(text)}</p>
<!-- /wp:paragraph -->
</details>
<!-- /wp:details -->`.trim()).join("\n")}
</div>
<!-- /wp:group -->`.trim();
}

function menuComparisonTable(spec) {
  const rows = spec.services.map((service, index) => {
    const process = spec.process[index] || spec.process[0] || {};
    return `<tr><td>${esc(service.title)}</td><td>${esc(service.text)}</td><td>${esc(process.title || "Date fit")} - ${esc(process.text || spec.copy.quoteText)}</td></tr>`;
  }).join("");

  return `
<!-- wp:table {"className":"som-menu-table"} -->
<figure class="wp-block-table som-menu-table"><table>${tableCaption("Package comparison")}${tableHead(["Package", "Best fit", "Planning note"])}<tbody>${rows}</tbody></table></figure>
<!-- /wp:table -->`.trim();
}

function waterServiceTable(spec) {
  const rows = spec.services.map((service, index) => {
    const proof = spec.proof[index] || spec.proof[0] || {};
    const process = spec.process[index] || spec.process[0] || {};
    return `<tr><td>${esc(service.title)}</td><td>${esc(proof.stat || "Route check")}</td><td>${esc(process.text || service.text)}</td></tr>`;
  }).join("");

  return `
<!-- wp:table {"className":"som-water-table"} -->
<figure class="wp-block-table som-water-table"><table>${tableCaption("Water care lanes")}${tableHead(["Care lane", "Proof cue", "Visit note"])}<tbody>${rows}</tbody></table></figure>
<!-- /wp:table -->`.trim();
}

function fabricCareListItem(item) {
  return `<li><strong>${esc(item.title)}</strong>: ${esc(item.text)}</li>`;
}

function fabricCareDetails(spec) {
  const { copy } = spec;
  const dryingStep = spec.process.find((item) => /dry/i.test(`${item.title} ${item.text}`)) || spec.process[2] || spec.process[0];
  const stainService = spec.services.find((item) => /spot|stain|rug|area/i.test(`${item.title} ${item.text}`)) || spec.services[2] || spec.services[0];
  const rows = [
    {
      summary: "What should I send for a fabric estimate?",
      text: copy.quoteText
    },
    {
      summary: "How do you avoid over-wetting cushions?",
      text: dryingStep?.text || "We match extraction passes, cleaner strength, and airflow notes to the fabric so the room can get back to normal."
    },
    {
      summary: "Can older stains still be treated?",
      text: `${stainService?.title || "Problem spots"} get a fiber check first, then a clear note on what should lift, what may soften, and what needs another plan.`
    }
  ];

  return `
<!-- wp:group {"align":"wide","className":"som-fabric-detail-grid","style":{"spacing":{"margin":{"top":"28px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignwide som-fabric-detail-grid" style="margin-top:28px">
${rows.map(({ summary, text }) => `
<!-- wp:details {"className":"som-fabric-detail"} -->
<details class="wp-block-details som-fabric-detail"><summary>${esc(summary)}</summary>
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.58"},"spacing":{"margin":{"top":"12px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-top:12px;font-size:17px;line-height:1.58">${esc(text)}</p>
<!-- /wp:paragraph -->
</details>
<!-- /wp:details -->`.trim()).join("\n")}
</div>
<!-- /wp:group -->`.trim();
}

function transformationMethodTable(spec) {
  const methods = transformationMethodLabels(spec);
  const rows = spec.services.map((item, index) => {
    const method = methods[index] || "Custom plan";
    const note = spec.process[index]?.text || item.text;
    return `<tr><td>${esc(item.title)}</td><td>${esc(method)}</td><td>${esc(note)}</td></tr>`;
  }).join("");

  return `
<!-- wp:table {"className":"som-method-table"} -->
<figure class="wp-block-table som-method-table"><table>${tableCaption("Service method comparison")}${tableHead(["Surface", "Method", "Quote note"])}<tbody>${rows}</tbody></table></figure>
<!-- /wp:table -->`.trim();
}

function transformationPrepDetails(spec) {
  const { contact, copy } = spec;
  const accessNote = spec.process[0]?.text || "Send a clear photo, the address, and any access or timing constraints before the visit.";
  const objectionAnswer = spec.serviceDetails?.objectionAnswer;

  return `
<!-- wp:details {"className":"som-method-detail"} -->
<details class="wp-block-details som-method-detail"><summary>What makes the quote accurate?</summary>
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.58"},"spacing":{"margin":{"top":"12px","bottom":"10px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-top:12px;margin-bottom:10px;font-size:17px;line-height:1.58">${esc(accessNote)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.58"}}} -->
<p class="has-soil-color has-text-color" style="font-size:17px;line-height:1.58">${esc(copy.quoteText)} Service area: ${esc(contact.serviceArea)}.</p>
<!-- /wp:paragraph -->
</details>
<!-- /wp:details -->
${objectionAnswer ? `
<!-- wp:details {"className":"som-method-detail"} -->
<details class="wp-block-details som-method-detail"><summary>What can change the quote or date?</summary>
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.58"},"spacing":{"margin":{"top":"12px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-top:12px;font-size:17px;line-height:1.58">${esc(objectionAnswer)}</p>
<!-- /wp:paragraph -->
</details>
<!-- /wp:details -->`.trim() : ""}`.trim();
}

function serviceScopeTable(spec, options = {}) {
  const className = options.className || "som-service-scope-table";
  const headings = options.headings || ["Service lane", "Proof cue", "Visit note"];
  const rows = spec.services.map((service, index) => {
    const proof = spec.proof[index] || spec.proof[0] || {};
    const process = spec.process[index] || spec.process[0] || {};
    const proofText = [proof.stat, proof.label].filter(Boolean).join(" - ") || spec.copy.proofTitle;
    const note = process.text || service.text || spec.copy.quoteText;
    return `<tr><td>${esc(service.title)}</td><td>${esc(proofText)}</td><td>${esc(note)}</td></tr>`;
  }).join("");

  return `
<!-- wp:table {"className":"${esc(className)}"} -->
<figure class="wp-block-table ${esc(className)}"><table>${tableCaption(options.caption || "Service scope comparison")}${tableHead(headings)}<tbody>${rows}</tbody></table></figure>
<!-- /wp:table -->`.trim();
}

function serviceDetailsBlock(spec, options = {}) {
  const groupClassName = options.groupClassName || "som-service-details";
  const detailClassName = options.detailClassName || "som-service-detail";
  const rows = [
    {
      summary: options.fitSummary || "How do we confirm the right fit?",
      text: spec.process[0]?.text || spec.copy.introText
    },
    {
      summary: "What should I send first?",
      text: spec.copy.quoteText
    },
    {
      summary: "Where do you work?",
      text: spec.contact.serviceArea
    }
  ];

  if (spec.serviceDetails?.objectionAnswer) {
    rows.push({
      summary: options.objectionSummary || "What can change the quote or date?",
      text: spec.serviceDetails.objectionAnswer
    });
  }

  return `
<!-- wp:group {"className":"${esc(groupClassName)}","style":{"spacing":{"margin":{"top":"24px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group ${esc(groupClassName)}" style="margin-top:24px">
${rows.map(({ summary, text }) => `
<!-- wp:details {"className":"${esc(detailClassName)}"} -->
<details class="wp-block-details ${esc(detailClassName)}"><summary>${esc(summary)}</summary>
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.58"},"spacing":{"margin":{"top":"12px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-top:12px;font-size:17px;line-height:1.58">${esc(text)}</p>
<!-- /wp:paragraph -->
</details>
<!-- /wp:details -->`.trim()).join("\n")}
</div>
<!-- /wp:group -->`.trim();
}

function serviceTrustQuote(spec, options = {}) {
  const className = typeof options === "string" ? options : options.className || "som-service-quote";
  const bandClassName = typeof options === "string" ? "som-side-rail-quote-band" : options.bandClassName || "som-service-quote-band";
  const citation = typeof options === "string"
    ? `${spec.businessName} planning note`
    : options.citation || `${spec.businessName} planning note`;
  const proof = spec.proof[0] || {};
  const proofText = proof.label ? `${proof.stat}: ${proof.label}.` : spec.copy.introText;

  return `
<!-- wp:group {"metadata":{"name":"Trust quote"},"className":"${esc(bandClassName)}","backgroundColor":"white","style":{"spacing":{"padding":{"top":"38px","right":"42px","bottom":"38px","left":"42px"},"margin":{"top":"28px"}}},"layout":{"type":"constrained","wideSize":"1120px"}} -->
<div class="wp-block-group ${esc(bandClassName)} has-white-background-color has-background" style="margin-top:28px;padding-top:38px;padding-right:42px;padding-bottom:38px;padding-left:42px">
<!-- wp:quote {"className":"${esc(className)}"} -->
<blockquote class="wp-block-quote ${esc(className)}"><p>${esc(proofText)}</p><cite>${esc(citation)}</cite></blockquote>
<!-- /wp:quote -->
</div>
<!-- /wp:group -->`.trim();
}

function stainCard(number, title, text) {
  return `
<!-- wp:column {"className":"som-stain-card","backgroundColor":"white","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"30px","right":"28px","bottom":"30px","left":"28px"}}}} -->
<div class="wp-block-column som-stain-card has-white-background-color has-background" style="border-radius:8px;padding-top:30px;padding-right:28px;padding-bottom:30px;padding-left:28px">
<!-- wp:paragraph {"textColor":"leaf","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"760","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<p class="has-leaf-color has-text-color" style="margin-bottom:14px;font-size:15px;font-style:normal;font-weight:760;letter-spacing:0px;text-transform:uppercase">Care ${number}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"28px","lineHeight":"1.12","fontStyle":"normal","fontWeight":"660"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:14px;font-size:28px;font-style:normal;font-weight:660;line-height:1.12">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"18px","lineHeight":"1.55"}}} -->
<p class="has-soil-color has-text-color" style="font-size:18px;line-height:1.55">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function fabricProof(stat, label) {
  return `
<!-- wp:column {"className":"som-fabric-proof","backgroundColor":"white","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"24px","right":"20px","bottom":"24px","left":"20px"}}}} -->
<div class="wp-block-column som-fabric-proof has-white-background-color has-background" style="border-radius:8px;padding-top:24px;padding-right:20px;padding-bottom:24px;padding-left:20px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"clamp(24px, 3.2vw, 34px)","lineHeight":"1.04","fontStyle":"normal","fontWeight":"660"},"spacing":{"margin":{"bottom":"10px"}}}} -->
<p class="has-grass-color has-text-color" style="margin-bottom:10px;font-size:clamp(24px, 3.2vw, 34px);font-style:normal;font-weight:660;line-height:1.04">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"16px","lineHeight":"1.48","fontStyle":"normal","fontWeight":"650"}}} -->
<p class="has-soil-color has-text-color" style="font-size:16px;font-style:normal;font-weight:650;line-height:1.48">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function storySupportCard(number, title, text) {
  return `
<!-- wp:column {"className":"som-check-card","backgroundColor":"white","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"28px","right":"26px","bottom":"28px","left":"26px"}}}} -->
<div class="wp-block-column som-check-card has-white-background-color has-background" style="border-radius:8px;padding-top:28px;padding-right:26px;padding-bottom:28px;padding-left:26px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"820","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"12px"}}}} -->
<p class="has-grass-color has-text-color" style="margin-bottom:12px;font-size:14px;font-style:normal;font-weight:820;letter-spacing:0px;text-transform:uppercase">Support ${String(number).padStart(2, "0")}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"var:preset|font-size|card-title","lineHeight":"1.12","fontStyle":"normal","fontWeight":"640"},"spacing":{"margin":{"bottom":"12px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:12px;font-size:var(--wp--preset--font-size--card-title);font-style:normal;font-weight:640;line-height:1.12">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.56"}}} -->
<p class="has-soil-color has-text-color" style="font-size:17px;line-height:1.56">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function storyProofCard(stat, label) {
  return `
<!-- wp:column {"className":"som-proof-card","backgroundColor":"mist","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"22px","right":"20px","bottom":"22px","left":"20px"}}}} -->
<div class="wp-block-column som-proof-card has-mist-background-color has-background" style="border-radius:8px;padding-top:22px;padding-right:20px;padding-bottom:22px;padding-left:20px">
<!-- wp:paragraph {"textColor":"leaf","style":{"typography":{"fontSize":"clamp(24px, 3vw, 34px)","lineHeight":"1","fontStyle":"normal","fontWeight":"760"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<p class="has-leaf-color has-text-color" style="margin-bottom:8px;font-size:clamp(24px, 3vw, 34px);font-style:normal;font-weight:760;line-height:1">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"15px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"760"}}} -->
<p class="has-deep-green-color has-text-color" style="font-size:15px;font-style:normal;font-weight:760;line-height:1.45">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function storyProcessStep(number, title, text) {
  return `
<!-- wp:group {"className":"som-story-process-step","backgroundColor":"white","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"22px","right":"24px","bottom":"22px","left":"24px"},"margin":{"bottom":"14px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-story-process-step has-white-background-color has-background" style="border-radius:8px;margin-bottom:14px;padding-top:22px;padding-right:24px;padding-bottom:22px;padding-left:24px">
<!-- wp:columns {"verticalAlignment":"center","style":{"spacing":{"blockGap":{"left":"18px"}}}} -->
<div class="wp-block-columns are-vertically-aligned-center">
<!-- wp:column {"verticalAlignment":"center","width":"60px"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:60px">
<!-- wp:paragraph {"align":"center","backgroundColor":"sun","textColor":"deep-green","className":"som-story-step-number","style":{"typography":{"fontSize":"18px","lineHeight":"1","fontStyle":"normal","fontWeight":"780"},"spacing":{"padding":{"top":"12px","bottom":"12px"}}}} -->
<p class="has-text-align-center som-story-step-number has-deep-green-color has-sun-background-color has-text-color has-background" style="padding-top:12px;padding-bottom:12px;font-size:18px;font-style:normal;font-weight:780;line-height:1">${number}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
<!-- wp:column {"verticalAlignment":"center"} -->
<div class="wp-block-column is-vertically-aligned-center">
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"24px","lineHeight":"1.12","fontStyle":"normal","fontWeight":"640"},"spacing":{"margin":{"bottom":"7px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:7px;font-size:24px;font-style:normal;font-weight:640;line-height:1.12">${esc(title)}</h3>
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

function storyConsultQuote(spec) {
  return `
<!-- wp:quote {"className":"som-check-quote"} -->
<blockquote class="wp-block-quote som-check-quote"><p>${esc(spec.copy.introText)}</p><cite>${esc(storyConsultCite(spec))} from ${esc(spec.businessName)}</cite></blockquote>
<!-- /wp:quote -->`.trim();
}

function storyConsultDetails(spec) {
  if (spec.slug === "plant-care") {
    return storyDetailGroup([
      {
        summary: "What should I send before the plant consult?",
        text: spec.serviceDetails?.whatToSend || spec.copy.quoteText
      },
      {
        summary: "Can you help if the plant already looks rough?",
        text: spec.serviceDetails?.objectionAnswer || "Yes. We look at light, moisture, drainage, pests, leaf color, and recent watering before changing the care rhythm."
      },
      {
        summary: "Where do you help?",
        text: spec.contact.serviceArea
      }
    ]);
  }

  const rows = [
    {
      summary: "What should we share before the consult?",
      text: spec.serviceDetails?.whatToSend || spec.copy.quoteText
    },
    {
      summary: "Can family members weigh in remotely?",
      text: "Yes. We can collect photo notes, decision prompts, and pickup questions so the room keeps moving without rushing anyone."
    },
    {
      summary: "Where do you help?",
      text: spec.contact.serviceArea
    }
  ];

  return storyDetailGroup(rows);
}

function storyDetailGroup(rows) {
  return `
<!-- wp:group {"className":"som-check-details","style":{"spacing":{"margin":{"top":"18px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-check-details" style="margin-top:18px">
${rows.map(({ summary, text }) => `
<!-- wp:details {"className":"som-check-detail"} -->
<details class="wp-block-details som-check-detail"><summary>${esc(summary)}</summary>
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.58"},"spacing":{"margin":{"top":"12px"}}}} -->
<p class="has-soil-color has-text-color" style="margin-top:12px;font-size:17px;line-height:1.58">${esc(text)}</p>
<!-- /wp:paragraph -->
</details>
<!-- /wp:details -->`.trim()).join("\n")}
</div>
<!-- /wp:group -->`.trim();
}

function storyHeroBullets(spec) {
  if (spec.slug === "plant-care") {
    return [
      "Light, soil feel, drainage, and yellow leaves get read together.",
      "Care notes explain what changed before the next watering decision."
    ];
  }

  return [
    "One room at a time, with keep, gift, donate, pack, and unsure labels.",
    "Family questions get written down before sensitive items leave the house."
  ];
}

function storyConsultCite(spec) {
  return spec.slug === "plant-care" ? "Care note" : "Family note";
}

function storyFinalEmailLabel(spec) {
  return spec.slug === "plant-care" ? "Email plant photos" : "Email timeline details";
}

function storyProofSectionName(spec) {
  return spec.slug === "plant-care" ? "Plant proof" : "Family proof";
}

function storyNavWeight(spec) {
  return spec.slug === "plant-care" ? "660" : "720";
}

function storyActionWeight(spec) {
  return spec.slug === "plant-care" ? "700" : "780";
}

function storyHeroListWeight(spec) {
  return spec.slug === "plant-care" ? "610" : "650";
}

function storyPhoneLineWeight(spec) {
  return spec.slug === "plant-care" ? "620" : "680";
}

function galleryStyleCard(number, title, text, options = {}) {
  const isPet = options.variant === "pet-portrait-gallery";
  const isHeadshot = options.variant === "headshot-proof-gallery";
  const isDessert = options.variant === "dessert-table-gallery";
  const label = isHeadshot ? "Cue" : isDessert ? "Table" : "Style";
  const padding = isPet || isHeadshot ? "24px" : "26px";
  const labelWeight = isPet ? "650" : "760";
  const headingWeight = isPet || isHeadshot ? "660" : "720";
  const headingSize = isPet ? "25px" : isHeadshot ? "24px" : "26px";
  const paragraphSize = isPet || isHeadshot ? "17px" : "18px";
  return `
<!-- wp:column {"className":"som-style-card","backgroundColor":"white","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"${padding}","right":"26px","bottom":"${padding}","left":"26px"}}}} -->
<div class="wp-block-column som-style-card has-white-background-color has-background" style="border-radius:8px;padding-top:${padding};padding-right:26px;padding-bottom:${padding};padding-left:26px">
<!-- wp:paragraph {"textColor":"grass","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"${labelWeight}","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"12px"}}}} -->
<p class="has-grass-color has-text-color" style="margin-bottom:12px;font-size:13px;font-style:normal;font-weight:${labelWeight};letter-spacing:0px;text-transform:uppercase">${label} ${number}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3,"textColor":"deep-green","style":{"typography":{"fontSize":"${headingSize}","lineHeight":"1.1","fontStyle":"normal","fontWeight":"${headingWeight}"},"spacing":{"margin":{"bottom":"12px"}}}} -->
<h3 class="wp-block-heading has-deep-green-color has-text-color" style="margin-bottom:12px;font-size:${headingSize};font-style:normal;font-weight:${headingWeight};line-height:1.1">${esc(title)}</h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"${paragraphSize}","lineHeight":"1.56"}}} -->
<p class="has-soil-color has-text-color" style="font-size:${paragraphSize};line-height:1.56">${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function galleryProof(stat, label, options = {}) {
  const isPet = options.variant === "pet-portrait-gallery";
  const isBalloon = options.variant === "balloon-backdrop-gallery";
  const statSize = isPet ? "clamp(24px, 3.2vw, 34px)" : isBalloon ? "clamp(22px, 2.5vw, 30px)" : "clamp(25px, 3.6vw, 36px)";
  const statWeight = isPet ? "680" : isBalloon ? "680" : "760";
  const labelWeight = isPet ? "640" : isBalloon ? "640" : "700";
  const backgroundColor = isBalloon ? "white" : "grass";
  const statColor = isBalloon ? "deep-green" : "sun";
  const labelColor = isBalloon ? "soil" : "white";
  return `
<!-- wp:column {"className":"som-gallery-proof","backgroundColor":"${backgroundColor}","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"22px","right":"20px","bottom":"22px","left":"20px"}}}} -->
<div class="wp-block-column som-gallery-proof has-${backgroundColor}-background-color has-background" style="border-radius:8px;padding-top:22px;padding-right:20px;padding-bottom:22px;padding-left:20px">
<!-- wp:paragraph {"textColor":"${statColor}","style":{"typography":{"fontSize":"${statSize}","lineHeight":"1.04","fontStyle":"normal","fontWeight":"${statWeight}"},"spacing":{"margin":{"bottom":"9px"}}}} -->
<p class="has-${statColor}-color has-text-color" style="margin-bottom:9px;font-size:${statSize};font-style:normal;font-weight:${statWeight};line-height:1.04">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"${labelColor}","style":{"typography":{"fontSize":"15px","lineHeight":"1.42","fontStyle":"normal","fontWeight":"${labelWeight}"}}} -->
<p class="has-${labelColor}-color has-text-color" style="font-size:15px;font-style:normal;font-weight:${labelWeight};line-height:1.42">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function dessertMenuBoardItem(number, stat, label) {
  const itemNumber = String(number).padStart(2, "0");
  return `
<!-- wp:group {"className":"som-dessert-menu-line","style":{"border":{"top":{"color":"var:preset|color|leaf","style":"solid","width":"1px"}},"spacing":{"padding":{"top":"10px","bottom":"10px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-dessert-menu-line" style="border-top-color:var(--wp--preset--color--leaf);border-top-style:solid;border-top-width:1px;padding-top:10px;padding-bottom:10px">
<!-- wp:paragraph {"className":"som-dessert-menu-number","textColor":"grass","style":{"typography":{"fontSize":"12px","fontStyle":"normal","fontWeight":"850","textTransform":"uppercase","letterSpacing":"0px"}}} -->
<p class="som-dessert-menu-number has-grass-color has-text-color" style="font-size:12px;font-style:normal;font-weight:850;letter-spacing:0px;text-transform:uppercase">${itemNumber}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"deep-green","style":{"typography":{"fontSize":"18px","lineHeight":"1.12","fontStyle":"normal","fontWeight":"760"},"spacing":{"margin":{"top":"2px","bottom":"2px"}}}} -->
<p class="has-deep-green-color has-text-color" style="margin-top:2px;margin-bottom:2px;font-size:18px;font-style:normal;font-weight:760;line-height:1.12">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"14px","lineHeight":"1.35"}}} -->
<p class="has-soil-color has-text-color" style="font-size:14px;line-height:1.35">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->`.trim();
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

function haulCard(number, title, text, label = "Load") {
  return `
<!-- wp:column {"className":"som-haul-card","backgroundColor":"white","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"30px","right":"28px","bottom":"30px","left":"28px"}}}} -->
<div class="wp-block-column som-haul-card has-white-background-color has-background" style="border-radius:18px;padding-top:30px;padding-right:28px;padding-bottom:30px;padding-left:28px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"15px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:14px;font-size:15px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(label)} ${number}</p>
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

function haulTicket(items, label = "Haul ticket") {
  const rows = items.slice(0, 3).map((item) => `
<!-- wp:paragraph {"className":"som-ticket-line","textColor":"cream","style":{"typography":{"fontSize":"14px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"800"},"spacing":{"margin":{"top":"0","bottom":"8px"}}}} -->
<p class="som-ticket-line has-cream-color has-text-color" style="margin-top:0;margin-bottom:8px;font-size:14px;font-style:normal;font-weight:800;line-height:1.45"><strong>${esc(item.stat)}</strong> / ${esc(item.label)}</p>
<!-- /wp:paragraph -->`).join("\n");

  return `
<!-- wp:group {"className":"som-haul-ticket","backgroundColor":"grass","style":{"border":{"radius":"18px"},"spacing":{"padding":{"top":"18px","right":"18px","bottom":"10px","left":"18px"},"margin":{"top":"28px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-haul-ticket has-grass-background-color has-background" style="border-radius:18px;margin-top:28px;padding-top:18px;padding-right:18px;padding-bottom:10px;padding-left:18px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"900","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"10px"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:10px;font-size:13px;font-style:normal;font-weight:900;letter-spacing:0px;text-transform:uppercase">${esc(label)}</p>
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
<!-- wp:column {"className":"som-plan-step","backgroundColor":"white","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"30px","right":"28px","bottom":"30px","left":"28px"}}}} -->
<div class="wp-block-column som-plan-step has-white-background-color has-background" style="border-radius:8px;padding-top:30px;padding-right:28px;padding-bottom:30px;padding-left:28px">
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

function riskProofStatus(stat, label) {
  return `
<!-- wp:column {"className":"som-proof-card som-risk-status","backgroundColor":"grass","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"18px","right":"18px","bottom":"18px","left":"18px"}}}} -->
<div class="wp-block-column som-proof-card som-risk-status has-grass-background-color has-background" style="border-radius:8px;padding-top:18px;padding-right:18px;padding-bottom:18px;padding-left:18px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"clamp(18px, 2.2vw, 24px)","lineHeight":"1.08","fontStyle":"normal","fontWeight":"800"},"spacing":{"margin":{"bottom":"8px"}}}} -->
<p class="has-sun-color has-text-color" style="margin-bottom:8px;font-size:clamp(18px, 2.2vw, 24px);font-style:normal;font-weight:800;line-height:1.08">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"15px","lineHeight":"1.38","fontStyle":"normal","fontWeight":"700"}}} -->
<p class="has-white-color has-text-color" style="font-size:15px;font-style:normal;font-weight:700;line-height:1.38">${esc(label)}</p>
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

function transformationCopyModel(spec) {
  const identity = [
    spec.slug,
    spec.niche,
    spec.businessName,
    spec.pattern?.imageEvidence,
    spec.copy?.heroTitle
  ].filter(Boolean).join(" ").toLowerCase();

  if (/\b(furniture|refinish|repair|wood|grain|finish)\b/.test(identity)) {
    return {
      chips: ["Photo-first repair path", "Wood-grain proof", "Finish notes"],
      beforeText: "Worn finish, loose joints, and mystery damage notes.",
      afterText: "Stable joinery, revived grain, and care notes.",
      quoteTitle: "Repair path in clear photos.",
      quoteIntro: "Send the whole piece, the damage close-up, and finish goals so the first reply separates repair, refresh, and refinish.",
      surfacesIntro: "Each piece gets scoped by wood, joinery, finish history, and how much original character should stay.",
      methodEyebrow: "Repair, finish, and care",
      methodTitle: "Stabilize what moves. Refresh what still belongs.",
      quoteItems: [
        "Whole piece in natural light",
        "Close-up of damage or loose joints",
        "Dimensions, finish goals, and pickup needs"
      ]
    };
  }

  if (/\b(window|glass|pane|squeegee|screen|track|storefront)\b/.test(identity)) {
    return {
      chips: ["Pane-count quote", "Inside/outside scope", "Edge-check proof"],
      beforeText: "Smudges, pollen film, screen dust, and tall panes hiding the view.",
      afterText: "Clear edges, brighter rooms, and a scope note for every tricky pane.",
      quoteTitle: "Shine quote from pane photos.",
      quoteIntro: "Send the window count, tall-glass photos, and inside/outside scope so the first reply prices the actual glass.",
      surfacesIntro: "Every pane gets scoped by access, height, screen condition, track buildup, and whether the work is inside, outside, or both.",
      methodEyebrow: "Pane count, access, edge check",
      methodTitle: "Clean glass starts with a clear count.",
      quoteItems: [
        "Exterior photo with the full window run",
        "Tall, tucked-away, or ladder-access panes",
        "Inside/outside, screens, tracks, and timing needs"
      ]
    };
  }

  return {
    chips: ["Photo-first estimates", "Surface-safe method", "Prep checklist"],
    beforeText: "Streaks, buildup, and trouble spots still calling attention.",
    afterText: "Cleaner edges, clearer finish, and a result that reads from the curb.",
    quoteTitle: "Quote in three photos.",
    quoteIntro: "No appointment just to price the obvious stuff. Send the wide view, the worst spot, and the access notes.",
    surfacesIntro: "Different surfaces need different pressure. That is the whole trick.",
    methodEyebrow: "Method, not muscle",
    methodTitle: "Pressure when it helps. Soft wash when it matters.",
    quoteItems: [
      "Wide shot of the whole area",
      "Close-up of the worst spot",
      "Access, water, power, or pickup notes"
    ]
  };
}

function transformationMethodLabels(spec) {
  const identity = [spec.slug, spec.niche, spec.businessName].filter(Boolean).join(" ").toLowerCase();
  if (/\b(furniture|refinish|repair|wood)\b/.test(identity)) {
    return ["Refresh", "Repair", "Refinish"];
  }
  if (/\b(window|glass|pane|squeegee|screen|track|storefront)\b/.test(identity)) {
    return ["Exterior", "Interior", "Screens/tracks"];
  }
  if (/\b(pressure|washing|soft wash|driveway|siding)\b/.test(identity)) {
    return ["Pressure wash", "Soft wash", "Detail rinse"];
  }
  return spec.services.map((service, index) => service.title || `Plan ${index + 1}`);
}

function processStep(number, title, text) {
  return `
<!-- wp:column {"className":"som-process-card","backgroundColor":"grass","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"30px","right":"28px","bottom":"30px","left":"28px"}}}} -->
<div class="wp-block-column som-process-card has-grass-background-color has-background" style="border-radius:8px;padding-top:30px;padding-right:28px;padding-bottom:30px;padding-left:28px">
<!-- wp:paragraph {"textColor":"sun","style":{"typography":{"fontSize":"17px","fontStyle":"normal","fontWeight":"760"}}} -->
<p class="has-sun-color has-text-color" style="font-size:17px;font-style:normal;font-weight:760">Step ${number}</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3,"textColor":"white","style":{"typography":{"fontSize":"28px","lineHeight":"1.12","fontStyle":"normal","fontWeight":"720"},"spacing":{"margin":{"bottom":"14px"}}}} -->
<h3 class="wp-block-heading has-white-color has-text-color" style="margin-bottom:14px;font-size:28px;font-style:normal;font-weight:720;line-height:1.12">${esc(title)}</h3>
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

function isPlantRouteSpec(spec) {
  return /\bplant|leaf|greenery|houseplant|office plant\b/i.test(`${spec.slug} ${spec.niche} ${spec.businessName}`);
}

function routeLedScheduleTone(spec) {
  if (!isPlantRouteSpec(spec)) {
    return {
      navLabels: ["Routes", "Visit notes", "Join"],
      anchorOrder: ["routes", "notes", "quote"],
      pageBackground: "cream",
      heroBackground: "cream",
      heroPaddingTop: "clamp(42px, 6vw, 74px)",
      heroPaddingBottom: "clamp(44px, 6vw, 76px)",
      heroGap: "clamp(34px, 5vw, 70px)",
      copyWidth: "47%",
      mediaWidth: "53%",
      heroTextLineHeight: "1.48",
      statusBackground: "deep-green",
      statusAccentColor: "sun",
      statusTextColor: "white",
      statusMutedColor: "mist",
      statusMarginTop: "-74px",
      statusMarginX: "28px",
      plansBackground: "mist",
      notesBackground: "cream",
      proofBackground: "deep-green",
      planLabel: "Lane",
      processLabel: "Route note",
      tableNoteLabel: "Route note"
    };
  }

  return {
    navLabels: ["Care routes", "Plant notes", "Plan"],
    anchorOrder: ["routes", "notes", "quote"],
    pageBackground: "white",
    heroBackground: "white",
    heroPaddingTop: "clamp(50px, 7vw, 92px)",
    heroPaddingBottom: "clamp(52px, 7vw, 86px)",
    heroGap: "clamp(28px, 4vw, 52px)",
    copyWidth: "56%",
    mediaWidth: "44%",
    heroTextLineHeight: "1.6",
    statusBackground: "grass",
    statusAccentColor: "sun",
    statusTextColor: "white",
    statusMutedColor: "cream",
    statusMarginTop: "16px",
    statusMarginX: "0",
    plansBackground: "cream",
    notesBackground: "white",
    proofBackground: "grass",
    planLabel: "Care path",
    processLabel: "Care note",
    tableNoteLabel: "Care note"
  };
}

function routeBoardLabel(spec) {
  return isPlantRouteSpec(spec)
    ? "Care route board"
    : "Route board";
}

function routeDetailQuestion(spec) {
  return isPlantRouteSpec(spec)
    ? "What should I send for a care route?"
    : "What should I send for a route quote?";
}

function routeStatusBoardColumns(spec, tone = routeLedScheduleTone(spec)) {
  const fallbackItems = [
    { stat: "Route fit", label: "cadence and access checked first" },
    { stat: "Visit notes", label: "changes tracked each stop" },
    { stat: "Fast reply", label: "weekday plan follow-up" }
  ];
  const items = [...(spec.proof || []), ...fallbackItems].slice(0, 3);
  return items.map((item) => routeStatusBoardColumn(item.stat, item.label, tone)).join("\n");
}

function routeStatusBoardColumn(stat, label, tone = {}) {
  const textColor = tone.statusTextColor || "white";
  const mutedColor = tone.statusMutedColor || "mist";
  return `
<!-- wp:column -->
<div class="wp-block-column">
<!-- wp:paragraph {"className":"som-route-status-stat","textColor":"${textColor}","style":{"typography":{"fontSize":"24px","lineHeight":"1.08","fontStyle":"normal","fontWeight":"700"},"spacing":{"margin":{"bottom":"6px"}}}} -->
<p class="som-route-status-stat has-${textColor}-color has-text-color" style="margin-bottom:6px;font-size:24px;font-style:normal;font-weight:700;line-height:1.08">${esc(stat)}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"className":"som-route-status-label","textColor":"${mutedColor}","style":{"typography":{"fontSize":"14px","lineHeight":"1.45","fontStyle":"normal","fontWeight":"700"}}} -->
<p class="som-route-status-label has-${mutedColor}-color has-text-color" style="font-size:14px;font-style:normal;font-weight:700;line-height:1.45">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function routePlanCard(number, title, text, tone = {}) {
  const label = tone.planLabel || "Lane";
  return `
<!-- wp:column {"className":"som-route-plan-card","backgroundColor":"white","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"24px","right":"22px","bottom":"24px","left":"22px"}}}} -->
<div class="wp-block-column som-route-plan-card has-white-background-color has-background" style="border-radius:8px;padding-top:24px;padding-right:22px;padding-bottom:24px;padding-left:22px">
<!-- wp:paragraph {"className":"som-route-card-number","textColor":"grass","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"700","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"16px"}}}} -->
<p class="som-route-card-number has-grass-color has-text-color" style="margin-bottom:16px;font-size:13px;font-style:normal;font-weight:700;letter-spacing:0px;text-transform:uppercase">${esc(label)} ${number}</p>
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

function routeProcessCard(number, title, text, tone = {}) {
  const label = tone.processLabel || "Route note";
  return `
<!-- wp:group {"className":"som-route-process-card","backgroundColor":"mist","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"18px","right":"18px","bottom":"18px","left":"18px"},"margin":{"top":"14px"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group som-route-process-card has-mist-background-color has-background" style="border-radius:8px;margin-top:14px;padding-top:18px;padding-right:18px;padding-bottom:18px;padding-left:18px">
<!-- wp:paragraph {"className":"som-route-process-label","textColor":"grass","style":{"typography":{"fontSize":"13px","fontStyle":"normal","fontWeight":"700","textTransform":"uppercase","letterSpacing":"0px"},"spacing":{"margin":{"bottom":"7px"}}}} -->
<p class="som-route-process-label has-grass-color has-text-color" style="margin-bottom:7px;font-size:13px;font-style:normal;font-weight:700;letter-spacing:0px;text-transform:uppercase">${esc(label)} ${number}</p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"className":"som-route-process-copy","textColor":"deep-green","style":{"typography":{"fontSize":"17px","lineHeight":"1.5","fontStyle":"normal","fontWeight":"700"}}} -->
<p class="som-route-process-copy has-deep-green-color has-text-color" style="font-size:17px;font-style:normal;font-weight:700;line-height:1.5">${esc(title)}: ${esc(text)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->`.trim();
}

function routeTableRow(number, title, text) {
  return `<tr><td>${number}</td><td>${esc(title)}</td><td>${esc(text)}</td></tr>`;
}

function routeProofCard(stat, label) {
  return `
<!-- wp:column {"className":"som-proof-card som-route-proof-card","backgroundColor":"white","style":{"border":{"radius":"8px"},"spacing":{"padding":{"top":"24px","right":"22px","bottom":"24px","left":"22px"}}}} -->
<div class="wp-block-column som-proof-card som-route-proof-card has-white-background-color has-background" style="border-radius:8px;padding-top:24px;padding-right:22px;padding-bottom:24px;padding-left:22px">
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

function tableCaption(value) {
  return `<caption class="som-table-caption">${esc(value)}</caption>`;
}

function tableHead(headings) {
  return `<thead><tr>${headings.map((heading) => `<th scope="col">${esc(heading)}</th>`).join("")}</tr></thead>`;
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
