import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { imageInfo } from "./image-size.mjs";
import {
  buildLayoutSignature,
  layoutVariantFor
} from "./layout-archetypes.mjs";

const execFileAsync = promisify(execFile);

const BLUEPRINT_SCHEMA = "https://playground.wordpress.net/blueprint-schema.json";

const ROOT = process.cwd();
const BLUEPRINT_OUTPUT_ROOT = path.join(ROOT, "public", "blueprints");

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

  throw new Error(`Unsupported layoutVariant: ${variant}`);
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
        fontFamilies: [
          {
            fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Inter, Roboto, Arial, sans-serif",
            name: "System Sans",
            slug: "system-sans"
          }
        ],
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
          shadow: tokens.shadows
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
        fontFamily: "var:preset|font-family|system-sans",
        fontSize: "var:preset|font-size|body",
        lineHeight: "1.5"
      },
      elements: {
        link: {
          color: {
            text: p.grass
          },
          typography: {
            textDecoration: "none",
            fontWeight: "800"
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
            fontWeight: "800"
          }
        }
      },
      blocks: {
        "core/button": {
          typography: {
            fontWeight: "800"
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
            fontWeight: "900",
            lineHeight: "1.05"
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
            fontSize: "var:preset|font-size|small",
            fontWeight: "800"
          }
        }
      }
    }
  };
}

function buildDesignTokens(spec) {
  const p = spec.palette;
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
        gradient: `linear-gradient(135deg, ${p.deepGreen} 0%, ${p.grass} 56%, ${p.leaf} 100%)`
      },
      {
        slug: "warm-flash",
        name: "Warm Flash",
        gradient: `linear-gradient(135deg, ${p.sun} 0%, ${p.cream} 100%)`
      }
    ],
    fontSizes: [
      { slug: "small", name: "Small", size: "0.94rem", fluid: { min: "0.88rem", max: "0.98rem" } },
      { slug: "body", name: "Body", size: "1.06rem", fluid: { min: "1rem", max: "1.12rem" } },
      { slug: "lead", name: "Lead", size: "1.28rem", fluid: { min: "1.12rem", max: "1.42rem" } },
      { slug: "card-title", name: "Card Title", size: "1.65rem", fluid: { min: "1.35rem", max: "1.85rem" } },
      { slug: "section-title", name: "Section Title", size: "3.25rem", fluid: { min: "2.25rem", max: "4.25rem" } },
      { slug: "hero", name: "Hero", size: "5.6rem", fluid: { min: "3.1rem", max: "6.25rem" } }
    ],
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
    ]
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
  const customVariables = [
    "  --wp--custom--som--measure--tight: 52ch;",
    "  --wp--custom--som--measure--copy: 66ch;",
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
${customVariables}
}
body{
  background:${p.cream};
}
.wp-site-blocks{
  padding-top:0;
  padding-bottom:0;
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
  if (spec.layoutVariant !== "before-after-quote") {
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
  await execFileAsync("zip", ["-qr", bundlePath, "blueprint.json", "asset-manifest.json", "assets"], { cwd: outDir });
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
