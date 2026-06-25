import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { imageInfo } from "./image-size.mjs";
import {
  buildLayoutSignature,
  layoutArchetypeFor,
  layoutVariantFor
} from "./layout-archetypes.mjs";

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
];

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
  const pageContent = buildPageContent(spec);
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

function buildPageContent(spec) {
  const variant = layoutVariantFor(spec);

  if (variant === "before-after-quote") {
    return buildBeforeAfterQuotePageContent(spec);
  }
  if (variant === "route-plan") {
    return buildRoutePlanPageContent(spec);
  }
  if (variant === "checklist-urgency") {
    return buildChecklistUrgencyPageContent(spec);
  }
  if (variant === "risk-prevention") {
    return buildRiskPreventionPageContent(spec);
  }
  if (variant === "gallery-led") {
    return buildGalleryLedPageContent(spec);
  }
  if (variant === "surface-seasonal") {
    return buildSurfaceSeasonalPageContent(spec);
  }
  if (variant === "stain-care") {
    return buildStainCarePageContent(spec);
  }

  throw new Error(`Unsupported layoutVariant: ${variant}`);
}

function buildChecklistUrgencyPageContent(spec) {
  const { copy, contact } = spec;
  const services = spec.services.map((item) => checkCard(item.title, item.text)).join("\n");
  const process = spec.process.map((item, index) => processStep(index + 1, item.title, item.text)).join("\n");
  const proof = spec.proof.map((item) => compactProof(item.stat, item.label)).join("\n");

  return `
<!-- wp:group {"align":"full","backgroundColor":"white","style":{"spacing":{"padding":{"top":"18px","right":"24px","bottom":"18px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull has-white-background-color has-background" style="padding-top:18px;padding-right:24px;padding-bottom:18px;padding-left:24px">
<!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide">
<!-- wp:site-logo {"width":230,"shouldSyncIcon":true} /-->
<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"700"}}} -->
<!-- wp:navigation-link {"label":"Checklist","url":"#checklist","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"Proof","url":"#proof","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"Quote","url":"#quote","kind":"custom","isTopLevelLink":true} /-->
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
<div class="wp-block-button is-style-outline" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-text-color wp-element-button" href="#checklist" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.secondaryCta)}</a></div>
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

  return `
<!-- wp:group {"align":"full","backgroundColor":"white","style":{"spacing":{"padding":{"top":"18px","right":"24px","bottom":"18px","left":"24px"}}},"layout":{"type":"constrained","wideSize":"1180px"}} -->
<div class="wp-block-group alignfull has-white-background-color has-background" style="padding-top:18px;padding-right:24px;padding-bottom:18px;padding-left:24px">
<!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide">
<!-- wp:site-logo {"width":230,"shouldSyncIcon":true} /-->
<!-- wp:navigation {"overlayMenu":"mobile","layout":{"type":"flex","justifyContent":"right"},"style":{"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"700"}}} -->
<!-- wp:navigation-link {"label":"Styles","url":"#styles","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"Process","url":"#process","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"Quote","url":"#quote","kind":"custom","isTopLevelLink":true} /-->
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
<div class="wp-block-button is-style-outline" style="font-style:normal;font-weight:800"><a class="wp-block-button__link has-deep-green-color has-text-color wp-element-button" href="#styles" style="border-radius:999px;padding-top:14px;padding-right:22px;padding-bottom:14px;padding-left:22px">${esc(copy.secondaryCta)}</a></div>
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
<!-- wp:navigation-link {"label":"Services","url":"#services","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"How it works","url":"#process","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"Quote","url":"#quote","kind":"custom","isTopLevelLink":true} /-->
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
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"22px","lineHeight":"1.35"}}} -->
<p class="has-soil-color has-text-color" style="font-size:22px;line-height:1.35">${esc(contact.serviceArea)}</p>
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
<!-- wp:navigation-link {"label":"Photo quote","url":"#quote","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"Surfaces","url":"#surfaces","kind":"custom","isTopLevelLink":true} /-->
<!-- wp:navigation-link {"label":"Method","url":"#method","kind":"custom","isTopLevelLink":true} /-->
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
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"15px","lineHeight":"1.35","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-white-color has-text-color" style="font-size:15px;font-style:normal;font-weight:800;line-height:1.35">${esc(label)}</p>
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
<!-- wp:paragraph {"textColor":"soil","style":{"typography":{"fontSize":"16px","lineHeight":"1.35","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-soil-color has-text-color" style="font-size:16px;font-style:normal;font-weight:800;line-height:1.35">${esc(label)}</p>
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
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"16px","lineHeight":"1.35","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-white-color has-text-color" style="font-size:16px;font-style:normal;font-weight:800;line-height:1.35">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
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
<!-- wp:paragraph {"textColor":"white","style":{"typography":{"fontSize":"16px","lineHeight":"1.35","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-white-color has-text-color" style="font-size:16px;font-style:normal;font-weight:800;line-height:1.35">${esc(label)}</p>
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
<!-- wp:paragraph {"align":"center","textColor":"soil","style":{"typography":{"fontSize":"17px","lineHeight":"1.35","fontStyle":"normal","fontWeight":"800"}}} -->
<p class="has-text-align-center has-soil-color has-text-color" style="font-size:17px;font-style:normal;font-weight:800;line-height:1.35">${esc(label)}</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->`.trim();
}

function buildGlobalStyles(spec) {
  const tokens = buildDesignTokens(spec);
  const p = spec.palette;

  return {
    version: 3,
    isGlobalStylesUserThemeJSON: true,
    settings: {
      appearanceTools: true,
      useRootPaddingAwareAlignments: true,
      border: {
        color: true,
        radius: true,
        style: true,
        width: true
      },
      color: {
        custom: false,
        customDuotone: false,
        customGradient: true,
        defaultGradients: false,
        defaultPalette: false,
        gradients: tokens.gradients,
        link: true,
        palette: tokens.palette
      },
      layout: {
        contentSize: "760px",
        wideSize: "1180px"
      },
      spacing: {
        blockGap: true,
        customSpacingSize: false,
        defaultSpacingSizes: false,
        spacingSizes: tokens.spacingSizes,
        units: ["px", "rem", "%", "vw", "vh"]
      },
      shadow: {
        defaultPresets: false,
        presets: tokens.shadowPresets
      },
      typography: {
        customFontSize: false,
        fluid: true,
        fontFamilies: tokens.fontFamilies,
        fontSizes: tokens.fontSizes,
        fontStyle: true,
        fontWeight: true,
        letterSpacing: true,
        lineHeight: true,
        textDecoration: true,
        textTransform: true
      },
      custom: {
        som: {
          measure: {
            tight: "52ch",
            copy: "66ch"
          },
          radius: tokens.radii,
          shadow: tokens.shadows,
          colorStrategy: tokens.colorStrategy,
          type: tokens.typography.custom
        }
      }
    },
    styles: {
      color: {
        background: p.cream,
        text: p.deepGreen
      },
      css: buildSharedPolishCss(spec),
      spacing: {
        blockGap: "var:preset|spacing|40"
      },
      typography: {
        fontFamily: `var:preset|font-family|${tokens.typography.bodyFontSlug}`,
        fontSize: "var:preset|font-size|body",
        lineHeight: tokens.typography.bodyLineHeight
      },
      elements: {
        link: {
          color: {
            text: p.grass
          },
          typography: {
            textDecoration: "none",
            fontFamily: `var:preset|font-family|${tokens.typography.accentFontSlug}`,
            fontWeight: tokens.typography.linkWeight
          },
          ":hover": {
            color: {
              text: p.deepGreen
            },
            typography: {
              textDecoration: "underline"
            }
          },
          ":focus": {
            outline: {
              color: p.sun,
              offset: "4px",
              style: "solid",
              width: "3px"
            }
          }
        },
        button: {
          border: {
            radius: "999px"
          },
          color: {
            background: p.sun,
            text: p.deepGreen
          },
          typography: {
            fontFamily: `var:preset|font-family|${tokens.typography.accentFontSlug}`,
            fontWeight: tokens.typography.actionWeight
          }
        }
      },
      blocks: {
        "core/button": {
          typography: {
            fontFamily: `var:preset|font-family|${tokens.typography.accentFontSlug}`,
            fontWeight: tokens.typography.actionWeight
          }
        },
        "core/buttons": {
          spacing: {
            blockGap: "var:preset|spacing|30"
          }
        },
        "core/columns": {
          spacing: {
            blockGap: "var:preset|spacing|50"
          }
        },
        "core/group": {
          spacing: {
            blockGap: "var:preset|spacing|40"
          }
        },
        "core/heading": {
          typography: {
            fontFamily: `var:preset|font-family|${tokens.typography.displayFontSlug}`,
            fontWeight: tokens.typography.headingWeight,
            lineHeight: tokens.typography.headingLineHeight
          }
        },
        "core/image": {
          border: {
            radius: "var(--wp--custom--som--radius--image)"
          }
        },
        "core/list": {
          spacing: {
            padding: {
              left: "1.25em"
            }
          }
        },
        "core/navigation": {
          typography: {
            fontFamily: `var:preset|font-family|${tokens.typography.accentFontSlug}`,
            fontSize: "var:preset|font-size|small",
            fontWeight: tokens.typography.navWeight
          }
        }
      }
    }
  };
}

function buildDesignTokens(spec) {
  const p = spec.palette;
  const typography = buildTypographyTokens(spec);
  const colorStrategy = buildColorStrategyTokens(spec);
  return {
    palette: [
      ["grass", "Grass", p.grass],
      ["deep-green", "Deep Green", p.deepGreen],
      ["leaf", "Leaf", p.leaf],
      ["sun", "Sun", p.sun],
      ["cream", "Cream", p.cream],
      ["mist", "Mist", p.mist],
      ["soil", "Soil", p.soil],
      ["white", "White", p.white]
    ].map(([slug, name, color]) => ({ slug, name, color })),
    gradients: [
      {
        slug: "brand-sheen",
        name: "Brand Sheen",
        gradient: colorStrategy.brandGradient
      },
      {
        slug: "warm-flash",
        name: "Warm Flash",
        gradient: colorStrategy.highlightGradient
      }
    ],
    fontFamilies: typography.fontFamilies,
    fontSizes: typography.fontSizes,
    spacingSizes: [
      { slug: "20", name: "2XS", size: "0.5rem" },
      { slug: "30", name: "XS", size: "0.75rem" },
      { slug: "40", name: "S", size: "1rem" },
      { slug: "50", name: "M", size: "1.5rem" },
      { slug: "60", name: "L", size: "2.25rem" },
      { slug: "70", name: "XL", size: "3.5rem" },
      { slug: "80", name: "2XL", size: "5rem" }
    ],
    radii: {
      chip: "999px",
      card: "18px",
      panel: "24px",
      image: "28px"
    },
    shadows: {
      card: "0 16px 50px rgba(5,45,63,.08)",
      lift: "0 28px 80px rgba(5,45,63,.18)",
      button: "0 10px 24px rgba(5,45,63,.14)"
    },
    shadowPresets: [
      { slug: "card", name: "Card", shadow: "0 16px 50px rgba(5,45,63,.08)" },
      { slug: "lift", name: "Lift", shadow: "0 28px 80px rgba(5,45,63,.18)" },
      { slug: "button", name: "Button", shadow: "0 10px 24px rgba(5,45,63,.14)" }
    ],
    typography,
    colorStrategy: {
      name: layoutArchetypeFor(spec).colorStrategy,
      brandGradient: colorStrategy.brandGradient,
      highlightGradient: colorStrategy.highlightGradient
    }
  };
}

function buildTypographyTokens(spec) {
  const archetype = layoutArchetypeFor(spec);
  const treatment = archetype.typographyTreatment || "friendly-bold-route-sans";
  const stacks = {
    system: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Inter, Roboto, Arial, sans-serif",
    rounded: "\"Arial Rounded MT Bold\", \"Avenir Next\", Avenir, \"Segoe UI\", Arial, sans-serif",
    humanist: "\"Avenir Next\", Avenir, \"Trebuchet MS\", \"Segoe UI\", Arial, sans-serif",
    editorial: "Georgia, Cambria, \"Times New Roman\", serif",
    condensed: "\"Arial Narrow\", \"Roboto Condensed\", \"Aptos Narrow\", Arial, sans-serif",
    sturdy: "\"Arial Black\", \"Segoe UI Black\", Impact, Arial, sans-serif",
    mono: "\"SFMono-Regular\", Consolas, \"Liberation Mono\", Menlo, monospace"
  };
  const treatments = {
    "friendly-bold-route-sans": {
      body: stacks.system,
      display: stacks.rounded,
      accent: stacks.system,
      scale: "generous",
      headingWeight: "900",
      actionWeight: "800",
      navWeight: "800",
      linkWeight: "800",
      headingLineHeight: "1.03",
      bodyLineHeight: "1.52"
    },
    "confident-transform-grotesk": {
      body: stacks.system,
      display: stacks.sturdy,
      accent: stacks.condensed,
      scale: "bold",
      headingWeight: "900",
      actionWeight: "850",
      navWeight: "850",
      linkWeight: "850",
      headingLineHeight: "0.98",
      bodyLineHeight: "1.48"
    },
    "crisp-checklist-ui-sans": {
      body: stacks.system,
      display: stacks.humanist,
      accent: stacks.system,
      scale: "compact",
      headingWeight: "850",
      actionWeight: "850",
      navWeight: "800",
      linkWeight: "800",
      headingLineHeight: "1.04",
      bodyLineHeight: "1.5"
    },
    "sturdy-safety-sans": {
      body: stacks.system,
      display: stacks.condensed,
      accent: stacks.sturdy,
      scale: "bold",
      headingWeight: "900",
      actionWeight: "900",
      navWeight: "850",
      linkWeight: "850",
      headingLineHeight: "1",
      bodyLineHeight: "1.48"
    },
    "industrial-seasonal-condensed": {
      body: stacks.system,
      display: stacks.condensed,
      accent: stacks.condensed,
      scale: "wide",
      headingWeight: "900",
      actionWeight: "850",
      navWeight: "850",
      linkWeight: "800",
      headingLineHeight: "0.98",
      bodyLineHeight: "1.48"
    },
    "soft-domestic-humanist": {
      body: stacks.humanist,
      display: stacks.humanist,
      accent: stacks.system,
      scale: "soft",
      headingWeight: "800",
      actionWeight: "800",
      navWeight: "750",
      linkWeight: "750",
      headingLineHeight: "1.06",
      bodyLineHeight: "1.58"
    },
    "editorial-gallery-serif-display": {
      body: stacks.humanist,
      display: stacks.editorial,
      accent: stacks.system,
      scale: "editorial",
      headingWeight: "700",
      actionWeight: "800",
      navWeight: "750",
      linkWeight: "750",
      headingLineHeight: "1.02",
      bodyLineHeight: "1.58"
    }
  };
  const voice = treatments[treatment] || treatments["friendly-bold-route-sans"];

  return {
    treatment,
    bodyFontSlug: "body",
    displayFontSlug: "display",
    accentFontSlug: "accent",
    bodyLineHeight: voice.bodyLineHeight,
    headingLineHeight: voice.headingLineHeight,
    headingWeight: voice.headingWeight,
    actionWeight: voice.actionWeight,
    navWeight: voice.navWeight,
    linkWeight: voice.linkWeight,
    fontFamilies: [
      { slug: "body", name: "Body", fontFamily: voice.body },
      { slug: "display", name: "Display", fontFamily: voice.display },
      { slug: "accent", name: "Accent", fontFamily: voice.accent }
    ],
    fontSizes: buildFluidFontSizes(voice.scale),
    custom: {
      treatment,
      bodyFont: voice.body,
      displayFont: voice.display,
      accentFont: voice.accent,
      headingWeight: voice.headingWeight,
      actionWeight: voice.actionWeight,
      navWeight: voice.navWeight,
      headingLineHeight: voice.headingLineHeight,
      bodyLineHeight: voice.bodyLineHeight
    }
  };
}

function buildFluidFontSizes(scaleName) {
  const scales = {
    compact: {
      small: ["0.9rem", "0.86rem", "0.96rem"],
      body: ["1.02rem", "0.98rem", "1.08rem"],
      lead: ["1.2rem", "1.08rem", "1.34rem"],
      card: ["1.52rem", "1.28rem", "1.76rem"],
      section: ["3rem", "2.1rem", "3.8rem"],
      hero: ["5.1rem", "2.9rem", "5.8rem"]
    },
    soft: {
      small: ["0.94rem", "0.88rem", "1rem"],
      body: ["1.08rem", "1rem", "1.16rem"],
      lead: ["1.26rem", "1.12rem", "1.42rem"],
      card: ["1.58rem", "1.32rem", "1.78rem"],
      section: ["3.1rem", "2.18rem", "4rem"],
      hero: ["5.25rem", "2.95rem", "5.95rem"]
    },
    editorial: {
      small: ["0.95rem", "0.88rem", "1rem"],
      body: ["1.09rem", "1rem", "1.17rem"],
      lead: ["1.35rem", "1.14rem", "1.52rem"],
      card: ["1.7rem", "1.38rem", "1.94rem"],
      section: ["3.55rem", "2.35rem", "4.7rem"],
      hero: ["5.85rem", "3rem", "6.65rem"]
    },
    bold: {
      small: ["0.93rem", "0.87rem", "0.99rem"],
      body: ["1.05rem", "1rem", "1.12rem"],
      lead: ["1.3rem", "1.12rem", "1.48rem"],
      card: ["1.72rem", "1.38rem", "1.98rem"],
      section: ["3.45rem", "2.35rem", "4.5rem"],
      hero: ["5.9rem", "3.1rem", "6.65rem"]
    },
    wide: {
      small: ["0.92rem", "0.87rem", "0.98rem"],
      body: ["1.04rem", "0.98rem", "1.1rem"],
      lead: ["1.28rem", "1.1rem", "1.44rem"],
      card: ["1.68rem", "1.35rem", "1.9rem"],
      section: ["3.35rem", "2.25rem", "4.35rem"],
      hero: ["5.7rem", "3rem", "6.45rem"]
    },
    generous: {
      small: ["0.94rem", "0.88rem", "0.98rem"],
      body: ["1.06rem", "1rem", "1.12rem"],
      lead: ["1.28rem", "1.12rem", "1.42rem"],
      card: ["1.65rem", "1.35rem", "1.85rem"],
      section: ["3.25rem", "2.25rem", "4.25rem"],
      hero: ["5.6rem", "3.1rem", "6.25rem"]
    }
  };
  const scale = scales[scaleName] || scales.generous;
  return [
    { slug: "small", name: "Small", size: scale.small[0], fluid: { min: scale.small[1], max: scale.small[2] } },
    { slug: "body", name: "Body", size: scale.body[0], fluid: { min: scale.body[1], max: scale.body[2] } },
    { slug: "lead", name: "Lead", size: scale.lead[0], fluid: { min: scale.lead[1], max: scale.lead[2] } },
    { slug: "card-title", name: "Card Title", size: scale.card[0], fluid: { min: scale.card[1], max: scale.card[2] } },
    { slug: "section-title", name: "Section Title", size: scale.section[0], fluid: { min: scale.section[1], max: scale.section[2] } },
    { slug: "hero", name: "Hero", size: scale.hero[0], fluid: { min: scale.hero[1], max: scale.hero[2] } }
  ];
}

function buildColorStrategyTokens(spec) {
  const p = spec.palette;
  const variant = layoutVariantFor(spec);
  const strategies = {
    "route-plan": {
      brandGradient: `linear-gradient(135deg, ${p.deepGreen} 0%, ${p.grass} 56%, ${p.leaf} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.sun} 0%, ${p.cream} 100%)`
    },
    "before-after-quote": {
      brandGradient: `linear-gradient(135deg, ${p.deepGreen} 0%, ${p.soil} 48%, ${p.grass} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.white} 0%, ${p.mist} 48%, ${p.sun} 100%)`
    },
    "checklist-urgency": {
      brandGradient: `linear-gradient(135deg, ${p.white} 0%, ${p.mist} 46%, ${p.leaf} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.sun} 0%, ${p.white} 100%)`
    },
    "risk-prevention": {
      brandGradient: `linear-gradient(135deg, ${p.deepGreen} 0%, ${p.soil} 62%, ${p.grass} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.sun} 0%, ${p.leaf} 100%)`
    },
    "surface-seasonal": {
      brandGradient: `linear-gradient(135deg, ${p.deepGreen} 0%, ${p.soil} 58%, ${p.sun} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.sun} 0%, ${p.mist} 100%)`
    },
    "stain-care": {
      brandGradient: `linear-gradient(135deg, ${p.deepGreen} 0%, ${p.grass} 54%, ${p.mist} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.white} 0%, ${p.cream} 42%, ${p.sun} 100%)`
    },
    "gallery-led": {
      brandGradient: `linear-gradient(135deg, ${p.cream} 0%, ${p.mist} 46%, ${p.sun} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.grass} 0%, ${p.leaf} 100%)`
    }
  };

  return strategies[variant] || {
    brandGradient: `linear-gradient(135deg, ${p.deepGreen} 0%, ${p.grass} 56%, ${p.leaf} 100%)`,
    highlightGradient: `linear-gradient(135deg, ${p.sun} 0%, ${p.cream} 100%)`
  };
}

function buildCustomCss(spec) {
  const tokens = buildDesignTokens(spec);
  const p = spec.palette;
  const colorClasses = [
    ["grass", p.grass],
    ["deep-green", p.deepGreen],
    ["leaf", p.leaf],
    ["sun", p.sun],
    ["cream", p.cream],
    ["mist", p.mist],
    ["soil", p.soil],
    ["white", p.white]
  ];
  const variables = colorClasses
    .map(([slug, color]) => `  --wp--preset--color--${slug}: ${color};`)
    .join("\n");
  const spacingVariables = tokens.spacingSizes
    .map((item) => `  --wp--preset--spacing--${item.slug}: ${item.size};`)
    .join("\n");
  const fontSizeVariables = tokens.fontSizes
    .map((item) => `  --wp--preset--font-size--${item.slug}: ${item.size};`)
    .join("\n");
  const fontFamilyVariables = tokens.fontFamilies
    .map((item) => `  --wp--preset--font-family--${item.slug}: ${item.fontFamily};`)
    .join("\n");
  const customVariables = [
    "  --wp--custom--som--measure--tight: 52ch;",
    "  --wp--custom--som--measure--copy: 66ch;",
    `  --wp--custom--som--type--heading-weight: ${tokens.typography.headingWeight};`,
    `  --wp--custom--som--type--action-weight: ${tokens.typography.actionWeight};`,
    `  --wp--custom--som--type--nav-weight: ${tokens.typography.navWeight};`,
    `  --wp--custom--som--type--heading-line-height: ${tokens.typography.headingLineHeight};`,
    `  --wp--custom--som--type--body-line-height: ${tokens.typography.bodyLineHeight};`,
    ...Object.entries(tokens.radii).map(([slug, value]) => `  --wp--custom--som--radius--${slug}: ${value};`),
    ...Object.entries(tokens.shadows).map(([slug, value]) => `  --wp--custom--som--shadow--${slug}: ${value};`)
  ].join("\n");
  const colorUtilities = colorClasses
    .map(([slug, color]) => `.has-${slug}-color{color:${color}!important}.has-${slug}-background-color{background-color:${color}!important}`)
    .join("\n");
  const shadowUtilities = tokens.shadowPresets
    .map((item) => `.has-${item.slug}-box-shadow{box-shadow:${item.shadow}!important}`)
    .join("\n");
  const variantCss = buildVariantCustomCss(spec);
  const variantCssBlock = variantCss ? `${variantCss}\n` : "";

  return `
:root{
${variables}
${spacingVariables}
${fontSizeVariables}
${fontFamilyVariables}
${customVariables}
}
body{
  background:${p.cream};
  font-family:var(--wp--preset--font-family--body);
  line-height:var(--wp--custom--som--type--body-line-height);
}
.wp-site-blocks{
  padding-top:0;
  padding-bottom:0;
}
.wp-block-heading{
  font-family:var(--wp--preset--font-family--display);
  font-weight:var(--wp--custom--som--type--heading-weight);
  line-height:var(--wp--custom--som--type--heading-line-height);
}
.wp-block-navigation a,
.wp-block-button__link{
  font-family:var(--wp--preset--font-family--accent);
}
.wp-block-navigation a{
  font-weight:var(--wp--custom--som--type--nav-weight);
}
.wp-block-button__link{
  font-weight:var(--wp--custom--som--type--action-weight);
}
${colorUtilities}
${shadowUtilities}
${buildSharedPolishCss(spec)}
.wp-block-cover .wp-block-cover__inner-container{
  position:relative;
  z-index:1;
}
.wp-block-site-logo img{
  height:auto;
  max-width:min(230px, 62vw);
}
${variantCssBlock}@media (max-width:700px){
  .wp-block-cover{
    min-height:620px!important;
  }
  .wp-block-cover .wp-block-cover__image-background{
    object-position:62% 50%!important;
  }
  .wp-block-navigation__responsive-container-open{
    min-width:44px;
    min-height:44px;
  }
}
`.trim();
}

function buildSharedPolishCss(spec) {
  const p = spec.palette;

  return `
html{
  scroll-behavior:smooth;
}
body{
  text-rendering:optimizeLegibility;
}
.wp-site-blocks :where(h1,h2,h3){
  text-wrap:balance;
}
.wp-site-blocks :where(p,li){
  text-wrap:pretty;
}
.wp-block-button__link{
  box-shadow:var(--wp--custom--som--shadow--button);
  transition:transform .18s ease, box-shadow .18s ease, background-color .18s ease, color .18s ease;
}
.wp-block-button__link:hover{
  transform:translateY(-1px);
  box-shadow:var(--wp--custom--som--shadow--card);
}
.wp-block-button__link:focus-visible,
.wp-block-navigation a:focus-visible{
  outline:3px solid ${p.sun};
  outline-offset:4px;
}
.wp-block-navigation a:hover{
  text-decoration:underline;
  text-decoration-thickness:2px;
  text-underline-offset:.25em;
}
.som-card,
.som-process-card,
.som-proof-card,
.som-quote-card,
.som-evidence-card{
  box-shadow:var(--wp--custom--som--shadow--card);
  border-radius:var(--wp--custom--som--radius--card);
}
.som-card,
.som-process-card,
.som-proof-card{
  min-height:100%;
}
.som-quote-card{
  border-radius:var(--wp--custom--som--radius--panel);
  box-shadow:var(--wp--custom--som--shadow--lift);
}
.som-footer{
  font-size:var(--wp--preset--font-size--small);
}
.som-chip,
.som-method-pill{
  box-shadow:inset 0 0 0 1px color-mix(in srgb, ${p.deepGreen} 12%, transparent);
}
.wp-block-image img{
  max-width:100%;
}
@media (max-width:700px){
  .wp-block-button,
  .wp-block-button__link{
    width:100%;
  }
  .wp-block-columns{
    gap:var(--wp--preset--spacing--50);
  }
  .wp-site-blocks :where(h1,h2){
    overflow-wrap:anywhere;
  }
}
`.trim();
}

function buildVariantCustomCss(spec) {
  const variant = layoutVariantFor(spec);

  if (variant === "checklist-urgency") {
    return `
.som-checklist-hero .som-hero-photo img{
  width:100%;
  min-height:520px;
  aspect-ratio:4/3;
  object-fit:cover;
  border-radius:28px;
  box-shadow:0 28px 80px rgba(5,45,63,.18);
}
.som-check-card,
.som-urgency-band .som-proof-card{
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-check-card{
  border-left:6px solid ${spec.palette.sun};
}
@media (max-width:700px){
  .som-checklist-hero .som-hero-photo img{
    min-height:340px;
    aspect-ratio:1/1;
  }
}
`.trim();
  }

  if (variant === "risk-prevention") {
    return `
.som-risk-hero .som-hero-photo img{
  width:100%;
  min-height:560px;
  aspect-ratio:4/3;
  object-fit:cover;
  object-position:center center;
  border-radius:28px;
  box-shadow:0 28px 80px rgba(5,45,63,.18);
}
.som-risk-panel,
.som-warning-row,
.som-plan-step,
.som-risk-band .som-proof-card{
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-warning-row{
  border-left:6px solid ${spec.palette.sun};
}
.som-warning-number{
  display:flex;
  align-items:center;
  justify-content:center;
  width:56px;
  height:56px;
  box-sizing:border-box;
  border-radius:999px;
  margin:0!important;
  padding:0!important;
  white-space:nowrap;
}
.som-plan-step{
  min-height:100%;
}
@media (max-width:700px){
  .som-risk-hero .som-hero-photo img{
    min-height:340px;
    aspect-ratio:1/1;
  }
}
`.trim();
  }

  if (variant === "surface-seasonal") {
    return `
.som-surface-photo img{
  width:100%;
  min-height:500px;
  aspect-ratio:4/3;
  object-fit:cover;
  object-position:center center;
  border-radius:30px;
  box-shadow:0 28px 80px rgba(0,0,0,.26);
}
.som-surface-hero{
  background-image:linear-gradient(135deg, rgba(255,209,102,.08), rgba(255,255,255,0));
}
.som-surface-band{
  box-shadow:inset 0 -1px 0 rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.18);
}
.som-surface-badge,
.som-seal-card,
.som-season-note,
.som-surface-hero .som-surface-photo{
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-seal-card{
  border-bottom:8px solid ${spec.palette.sun};
  min-height:100%;
}
.som-season-note{
  box-shadow:var(--wp--custom--som--shadow--lift);
}
@media (max-width:700px){
  .som-surface-hero{
    padding-top:40px!important;
    padding-bottom:46px!important;
  }
  .som-surface-photo img{
    min-height:230px;
    aspect-ratio:16/10;
    border-radius:24px;
  }
  .som-surface-hero h1{
    font-size:clamp(42px, 12vw, 54px)!important;
  }
  .som-season-note{
    padding:26px!important;
  }
}
`.trim();
  }

  if (variant === "stain-care") {
    return `
.som-fabric-hero{
  background-image:linear-gradient(135deg, rgba(51,182,166,.12), rgba(255,255,255,0));
}
.som-fabric-photo img{
  width:100%;
  min-height:500px;
  aspect-ratio:4/3;
  object-fit:cover;
  object-position:center center;
  border-radius:30px;
  box-shadow:0 28px 80px rgba(5,45,63,.18);
}
.som-care-note,
.som-fabric-proof,
.som-stain-card{
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-care-note{
  border-left:6px solid ${spec.palette.leaf};
}
.som-stain-card{
  border-top:8px solid ${spec.palette.sun};
  min-height:100%;
}
.som-fabric-proof{
  min-height:100%;
}
@media (max-width:700px){
  .som-fabric-hero{
    padding-top:42px!important;
    padding-bottom:48px!important;
  }
  .som-fabric-photo img{
    min-height:300px;
    aspect-ratio:1/1;
    border-radius:24px;
  }
  .som-fabric-hero h1{
    font-size:clamp(40px, 11vw, 54px)!important;
  }
  .som-care-note{
    padding:22px!important;
  }
}
`.trim();
  }

  if (variant === "gallery-led") {
    return `
.som-gallery-image img{
  width:100%;
  min-height:350px;
  aspect-ratio:16/5.2;
  object-fit:cover;
  border-radius:30px;
  box-shadow:0 28px 80px rgba(5,45,63,.18);
}
.som-gallery-copy-row{
  position:relative;
  z-index:2;
  margin-top:-86px!important;
}
.som-gallery-copy,
.som-gallery-note,
.som-style-card,
.som-gallery-proof{
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-style-card{
  border-top:8px solid ${spec.palette.sun};
  min-height:100%;
}
.som-gallery-note{
  box-shadow:var(--wp--custom--som--shadow--lift);
}
@media (max-width:700px){
  .som-gallery-image img{
    min-height:240px;
    aspect-ratio:16/10;
    border-radius:24px;
  }
  .som-gallery-copy-row{
    margin-top:20px!important;
  }
  .som-gallery-copy,
  .som-gallery-note{
    padding:24px!important;
  }
  .som-gallery-copy h1{
    font-size:clamp(38px, 12vw, 48px)!important;
    line-height:.98!important;
  }
}
`.trim();
  }

  if (variant !== "before-after-quote") {
    return "";
  }

  return `
.som-hero-photo img{
  width:100%;
  min-height:520px;
  aspect-ratio:4/3;
  object-fit:cover;
  border-radius:28px;
  box-shadow:0 28px 80px rgba(5,45,63,.18);
}
.som-chip,
.som-row-number,
.som-method-pill,
.som-timeline-number{
  border-radius:999px;
}
.som-row-number,
.som-timeline-number{
  display:flex;
  align-items:center;
  justify-content:center;
  box-sizing:border-box;
  margin:0!important;
  white-space:nowrap;
}
.som-row-number{
  width:56px;
  height:56px;
  padding:0!important;
}
.som-timeline-number{
  width:72px;
  height:72px;
  padding:0!important;
}
.som-before-after .wp-block-column,
.som-surface-row,
.som-timeline-step{
  box-shadow:0 16px 50px rgba(5,45,63,.08);
}
.som-timeline-step{
  border-bottom:1px solid rgba(5,45,63,.14);
}
.som-check-list,
.som-method-list{
  padding-left:1.25em;
}
.som-check-list li,
.som-method-list li{
  margin-bottom:.55em;
}
@media (max-width:700px){
  .som-hero-photo img{
    min-height:360px;
    aspect-ratio:1/1;
  }
  .som-before-after{
    gap:12px;
  }
  .som-quote-strip .wp-block-button__link{
    width:100%;
  }
}
`.trim();
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
