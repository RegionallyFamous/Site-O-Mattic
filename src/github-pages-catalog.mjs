import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { blueprintDirForSpec, blueprintPathForSpec, readSpec, specTargets } from "./spec-utils.mjs";

const repository = process.env.GITHUB_REPOSITORY || "RegionallyFamous/Site-O-Mattic";
const [owner, repo] = repository.split("/");
const branch = process.env.GITHUB_REF_NAME || currentBranch() || "main";
const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`;
const sourceBase = `https://github.com/${owner}/${repo}/blob/${branch}`;
const repoBase = `https://github.com/${owner}/${repo}`;
const pagePath = path.join("docs", "index.html");
const requestedFeaturedSlug = process.env.SITE_O_MATTIC_FEATURED_SLUG || "";
const previewSweepDir = process.env.SITE_O_MATTIC_PREVIEW_SWEEP_DIR || path.join("qa", "reports", "visual-sweep");
const reviewEvidence = await readJsonIfExists(path.join("qa", "reports", "visual-sweep", "review-evidence.json"));
const comparisonDashboard = await readJsonIfExists(path.join("qa", "reports", "visual-sweep", "dashboard", "visual-comparison-dashboard.json"));
const reviewItemsBySlug = new Map((reviewEvidence?.items || []).map((item) => [item.slug, item]));

const specEntries = [];
for (const target of await specTargets([])) {
  specEntries.push({
    target,
    spec: await readSpec(target),
    updatedAtMs: await modifiedTimeMs(target)
  });
}
specEntries.sort((a, b) => a.spec.slug.localeCompare(b.spec.slug));

const cards = [];
for (const { spec, updatedAtMs } of specEntries) {
  const dir = blueprintDirForSpec(spec);
  const manifest = JSON.parse(await fs.readFile(path.join(dir, "asset-manifest.json"), "utf8"));
  const blueprintPath = blueprintPathForSpec(spec);
  await fs.access(blueprintPath);
  await fs.access(path.join(dir, `${spec.slug}-blueprint.zip`));

  const blueprintUrl = `${rawBase}/public/blueprints/${spec.slug}/blueprint.json`;
  const playgroundUrl = `https://playground.wordpress.net/?blueprint-url=${encodeURIComponent(blueprintUrl)}`;
  const heroUrl = `${rawBase}/public/blueprints/${spec.slug}${manifest.assets.hero.outputPath}`;
  const logoUrl = `${rawBase}/public/blueprints/${spec.slug}${manifest.assets.logo.outputPath}`;
  const screenshotUrl = await screenshotUrlFor(spec.slug, heroUrl);
  const reviewItem = reviewItemsBySlug.get(spec.slug);

  cards.push({
    slug: spec.slug,
    name: spec.businessName,
    niche: titleCase(spec.niche),
    summary: summarize(spec.copy?.heroText || ""),
    status: spec.release?.status || "draft",
    variant: spec.layoutVariant,
    patternLabel: labelText(spec.pattern?.silhouette || spec.layoutVariant),
    heroUrl,
    logoUrl,
    screenshotUrl,
    heroAlt: spec.assetMeta?.hero?.alt || `${spec.businessName} preview image`,
    playgroundUrl,
    blueprintUrl,
    zipUrl: `${rawBase}/public/blueprints/${spec.slug}/${spec.slug}-blueprint.zip`,
    readmeUrl: `${sourceBase}/public/blueprints/${spec.slug}/README.md`,
    specUrl: `${sourceBase}/specs/${spec.slug}.json`,
    updatedAtMs,
    reviewSignals: reviewSignalsFor(spec, reviewItem)
  });
}

await fs.mkdir("docs", { recursive: true });
await fs.writeFile(path.join("docs", ".nojekyll"), "");
const featuredCard = requestedFeaturedSlug
  ? cards.find((item) => item.slug === requestedFeaturedSlug) || latestCard(cards)
  : latestCard(cards);
await prepareCatalogAssets(cards);
await prepareFeaturedPreview(featuredCard);
await fs.writeFile(pagePath, renderPage(cards, featuredCard));

console.log(`Wrote ${pagePath} with ${cards.length} Blueprint links.`);

async function prepareCatalogAssets(items) {
  const targetDir = path.join("docs", "catalog-assets");
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(targetDir, { recursive: true });

  for (const item of items) {
    const screenshotSource = path.join("public", "blueprints", item.slug, "assets", "screenshot.png");
    const screenshotTargetName = `${item.slug}-screenshot.jpg`;
    try {
      await writeCatalogScreenshotThumbnail(screenshotSource, path.join(targetDir, screenshotTargetName));
      item.screenshotUrl = `catalog-assets/${screenshotTargetName}`;
    } catch {
      const fallbackTargetName = `${item.slug}-screenshot.png`;
      try {
        await fs.copyFile(screenshotSource, path.join(targetDir, fallbackTargetName));
        item.screenshotUrl = `catalog-assets/${fallbackTargetName}`;
      } catch {
        // Keep the hosted fallback for older builds without a captured screenshot.
      }
    }

    const logoSource = path.join("public", "blueprints", item.slug, "assets", "logo.png");
    const logoTargetName = `${item.slug}-logo.png`;
    try {
      await fs.copyFile(logoSource, path.join(targetDir, logoTargetName));
      item.logoUrl = `catalog-assets/${logoTargetName}`;
    } catch {
      // Keep the hosted fallback for older builds without a copied logo.
    }
  }
}

async function writeCatalogScreenshotThumbnail(source, target) {
  execFileSync("sips", [
    "-s",
    "format",
    "jpeg",
    "-s",
    "formatOptions",
    "78",
    "-Z",
    "760",
    source,
    "--out",
    target
  ], { stdio: "ignore" });
  await fs.access(target);
}

async function prepareFeaturedPreview(item) {
  await fs.rm(path.join("docs", "previews"), { recursive: true, force: true });
  await fs.mkdir(path.join("docs", "previews"), { recursive: true });

  for (const viewport of ["desktop", "mobile-390"]) {
    const source = path.join(previewSweepDir, item.slug, `${viewport}.png`);
    const targetName = `${item.slug}-${viewport}.png`;
    const target = path.join("docs", "previews", targetName);
    try {
      await fs.copyFile(source, target);
      item[viewport === "desktop" ? "desktopPreview" : "mobilePreview"] = `previews/${targetName}`;
    } catch {
      item[viewport === "desktop" ? "desktopPreview" : "mobilePreview"] = "";
    }
  }
}

function renderPage(items, featured) {
  const generatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const approvedCount = items.filter((item) => item.status === "approved").length;
  const sweepPassed = reviewEvidence ? Math.max(0, reviewEvidence.total - reviewEvidence.failed) : null;
  const sweepStat = reviewEvidence ? `${sweepPassed}/${reviewEvidence.total}` : "n/a";
  const layoutCount = new Set(items.map((item) => item.variant)).size;
  const featuredImage = featured.desktopPreview || featured.heroUrl;
  const featuredMobile = featured.mobilePreview || "";
  const tasteQueue = renderTasteQueue(items);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Site-O-Mattic Demo Catalog</title>
  <meta name="description" content="A riso-style sales demo for Playground-ready WordPress Blueprint sites.">
  <style>
    :root {
      color-scheme: light;
      --paper: #fff35f;
      --surface: #fffef4;
      --ink: #181225;
      --muted: #4d4762;
      --line: #181225;
      --blue: #1757ff;
      --blue-dark: #08277f;
      --pink: #ff4f87;
      --pink-dark: #9f1747;
      --mint: #55f0b7;
      --scarlet: #ff3b2f;
      --shadow-blue: rgba(23, 87, 255, .42);
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      background:
        radial-gradient(circle at 1px 1px, rgba(24, 18, 37, .18) 1px, transparent 0) 0 0 / 18px 18px,
        linear-gradient(135deg, rgba(255, 79, 135, .2), transparent 32%),
        linear-gradient(315deg, rgba(23, 87, 255, .16), transparent 34%),
        var(--paper);
      color: var(--ink);
      font-family: "Avenir Next", Avenir, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }
    body::before {
      position: fixed;
      z-index: -1;
      inset: 0;
      background: repeating-linear-gradient(-5deg, rgba(255,255,255,.18) 0, rgba(255,255,255,.18) 2px, transparent 2px, transparent 10px);
      content: "";
      pointer-events: none;
    }
    a {
      color: inherit;
    }
    a:focus-visible {
      outline: 4px solid var(--ink);
      outline-offset: 5px;
      box-shadow: 0 0 0 8px var(--mint);
    }
    .page {
      width: min(1480px, calc(100% - 28px));
      margin: 0 auto;
      padding: 24px 0 56px;
    }
    .masthead {
      display: grid;
      position: relative;
      overflow: hidden;
      min-height: clamp(560px, 70vh, 790px);
      align-items: end;
      border: 3px solid var(--ink);
      background: var(--blue);
      box-shadow: 10px 10px 0 var(--pink);
      isolation: isolate;
      padding: clamp(22px, 5vw, 72px);
    }
    .masthead::before {
      position: absolute;
      inset: 0;
      z-index: 0;
      background:
        linear-gradient(90deg, rgba(255, 243, 95, .97) 0 42%, rgba(255, 243, 95, .72) 55%, rgba(23, 87, 255, .48)),
        linear-gradient(135deg, transparent 0 52%, rgba(255, 79, 135, .62) 52% 65%, transparent 65%),
        linear-gradient(26deg, transparent 0 68%, rgba(85, 240, 183, .56) 68% 80%, transparent 80%);
      content: "";
    }
    .masthead::after,
    .latest-preview::after,
    .card-preview::after {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 1px 1px, rgba(24, 18, 37, .24) 1px, transparent 0) 0 0 / 12px 12px;
      content: "";
      mix-blend-mode: multiply;
      opacity: .42;
      pointer-events: none;
    }
    .hero-bg {
      position: absolute;
      inset: 0;
      z-index: -1;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top center;
      filter: saturate(1.18) contrast(1.04);
      mix-blend-mode: multiply;
    }
    .hero-copy {
      position: relative;
      z-index: 1;
      max-width: 830px;
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      min-height: 30px;
      margin: 0 0 10px;
      padding: 5px 9px;
      border: 2px solid var(--ink);
      background: var(--mint);
      color: var(--ink);
      font-size: 12px;
      font-weight: 1000;
      letter-spacing: 0;
      text-transform: uppercase;
      transform: rotate(-1deg);
    }
    h1 {
      max-width: 930px;
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(42px, 6.7vw, 106px);
      font-weight: 900;
      line-height: .9;
      letter-spacing: 0;
      text-wrap: balance;
    }
    .lede {
      max-width: 720px;
      margin: 14px 0 0;
      color: #241c38;
      font-size: clamp(17px, 1.5vw, 21px);
      font-weight: 760;
    }
    .hero-note {
      display: inline-flex;
      max-width: 680px;
      margin-top: 16px;
      padding: 10px 12px;
      border: 3px solid var(--ink);
      background: var(--surface);
      color: var(--blue-dark);
      font-size: 14px;
      font-weight: 1000;
      box-shadow: 5px 5px 0 var(--pink);
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin: 22px 0 16px;
    }
    .stats dl,
    .stats dd {
      margin: 0;
    }
    .stat {
      display: flex;
      flex-direction: column;
      padding: 18px;
      border: 3px solid var(--ink);
      background: var(--surface);
      box-shadow: 6px 6px 0 var(--shadow-blue);
    }
    .stat dd {
      order: 1;
      display: block;
      margin: 0;
      color: var(--pink-dark);
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(31px, 4vw, 62px);
      font-weight: 900;
      line-height: .9;
    }
    .stat dt {
      order: 2;
      display: block;
      margin-top: 10px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 1000;
      text-transform: uppercase;
    }
    .proof-strip {
      display: grid;
      grid-template-columns: minmax(0, 1.25fr) repeat(3, minmax(0, .75fr));
      gap: 0;
      overflow: hidden;
      margin: 0 0 22px;
      border: 3px solid var(--ink);
      background: var(--ink);
      color: #ffffff;
      box-shadow: -8px 8px 0 var(--mint);
    }
    .proof-strip > * {
      min-width: 0;
      padding: 17px;
      border-right: 3px solid var(--ink);
      background: var(--blue);
    }
    .proof-strip > :first-child {
      background: var(--scarlet);
    }
    .proof-strip > :last-child {
      border-right: 0;
    }
    .proof-strip h2,
    .proof-strip h3,
    .proof-strip p {
      margin: 0;
    }
    .proof-strip h2 {
      max-width: 680px;
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(25px, 3vw, 47px);
      line-height: .98;
      text-wrap: balance;
    }
    .proof-strip h3 {
      color: var(--paper);
      font-size: 14px;
      text-transform: uppercase;
    }
    .proof-strip p {
      margin-top: 8px;
      font-size: 14px;
      font-weight: 800;
    }
    .latest {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(300px, .64fr);
      gap: 22px;
      align-items: center;
      margin: 22px 0 26px;
      padding: 16px;
      border: 3px solid var(--ink);
      background: var(--surface);
      box-shadow: -8px 8px 0 var(--pink), 8px -8px 0 var(--mint);
    }
    .latest-preview {
      position: relative;
      overflow: hidden;
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(96px, 18%);
      gap: 10px;
      align-items: end;
      border: 3px solid var(--ink);
      background: var(--blue);
      text-decoration: none;
    }
    .latest-preview img {
      display: block;
      width: 100%;
      object-fit: cover;
      background: var(--blue);
    }
    .desktop-shot {
      aspect-ratio: 16 / 9;
      object-position: top center;
    }
    .mobile-shot {
      aspect-ratio: 9 / 16;
      object-position: top center;
      border-left: 3px solid var(--ink);
    }
    .latest h2,
    .card h2 {
      margin: 0;
      font-size: 25px;
      line-height: 1.03;
      letter-spacing: 0;
      text-wrap: balance;
    }
    .latest p,
    .card p {
      margin: 10px 0 0;
      color: var(--muted);
      font-weight: 650;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 18px;
    }
    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      padding: 10px 14px;
      border: 2px solid var(--ink);
      background: var(--surface);
      color: var(--ink);
      font-size: 14px;
      font-weight: 900;
      line-height: 1.1;
      text-decoration: none;
      box-shadow: 4px 4px 0 var(--ink);
      transition: transform .18s ease, box-shadow .18s ease;
    }
    .button.primary {
      background: var(--scarlet);
      color: #ffffff;
    }
    .button:hover,
    .links a:hover {
      transform: translate(-1px, -1px);
      box-shadow: 5px 5px 0 var(--ink);
    }
    .pitch-points {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin: 20px 0;
    }
    .pitch-points article {
      min-height: 160px;
      padding: 18px;
      border: 3px solid var(--ink);
      background: var(--surface);
      box-shadow: 6px 6px 0 var(--shadow-blue);
    }
    .pitch-points span {
      display: inline-flex;
      min-width: 44px;
      min-height: 34px;
      align-items: center;
      justify-content: center;
      border: 3px solid var(--ink);
      background: var(--pink);
      font-weight: 1000;
      transform: rotate(-2deg);
    }
    .pitch-points h2 {
      margin: 12px 0 0;
      font-size: clamp(24px, 3vw, 42px);
      line-height: 1;
    }
    .pitch-points p {
      color: var(--muted);
      font-weight: 650;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
      margin: 26px 0 14px;
    }
    .toolbar h2 {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(28px, 3.6vw, 54px);
      line-height: .98;
      text-wrap: balance;
    }
    .toolbar a {
      color: var(--muted);
      font-size: 14px;
      font-weight: 900;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }
    .card {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
      border: 3px solid var(--ink);
      background: var(--surface);
      box-shadow: 6px 6px 0 var(--shadow-blue);
    }
    .card-preview {
      position: relative;
      display: block;
      overflow: hidden;
      aspect-ratio: 36 / 25;
      border-bottom: 3px solid var(--ink);
      background: var(--blue);
      background-position: top center;
      background-repeat: no-repeat;
      background-size: cover;
      text-decoration: none;
    }
    .card-preview img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top center;
      opacity: 0;
      transition: transform .18s ease;
    }
    .card-preview:hover img {
      transform: scale(1.018);
    }
    .content {
      display: flex;
      flex: 1;
      flex-direction: column;
      padding: 14px;
    }
    .logo-row {
      display: flex;
      min-height: 50px;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 10px;
    }
    .logo-row img {
      display: block;
      width: min(210px, 62%);
      max-height: 48px;
      object-fit: contain;
      object-position: left center;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: flex-end;
      margin: 0 0 0 auto;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 4px 8px;
      border: 2px solid var(--ink);
      background: var(--mint);
      color: var(--ink);
      font-size: 12px;
      font-weight: 900;
    }
    .signals {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 0 0 12px;
    }
    .signal {
      display: inline-flex;
      align-items: center;
      min-height: 22px;
      padding: 3px 7px;
      border: 2px solid var(--line);
      color: var(--muted);
      font-size: 11px;
      font-weight: 900;
      line-height: 1.1;
    }
    .taste-queue {
      margin: 26px 0 8px;
    }
    .review-notes {
      padding: 12px;
      border: 3px solid var(--line);
      background: var(--surface);
      box-shadow: 6px 6px 0 var(--shadow-blue);
    }
    .review-notes summary {
      cursor: pointer;
      font-weight: 1000;
    }
    .review-notes .signals {
      margin: 12px 0 0;
    }
    .links {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      margin-top: auto;
      padding-top: 16px;
    }
    .links a {
      min-height: 38px;
      padding: 9px 10px;
      border: 2px solid var(--line);
      color: var(--ink);
      font-size: 13px;
      font-weight: 900;
      text-align: center;
      text-decoration: none;
      transition: transform .18s ease, box-shadow .18s ease;
    }
    .links a:first-child {
      grid-column: 1 / -1;
      background: var(--blue);
      color: #ffffff;
    }
    footer {
      margin-top: 32px;
      padding-top: 20px;
      border-top: 3px solid var(--line);
      color: var(--muted);
      font-size: 14px;
    }
    @media (max-width: 920px) {
      .masthead,
      .latest {
        grid-template-columns: 1fr;
      }
      .stats {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .proof-strip {
        grid-template-columns: 1fr 1fr;
      }
      .proof-strip > :first-child {
        grid-column: 1 / -1;
      }
      .grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .pitch-points {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 620px) {
      .page {
        width: min(100% - 24px, 1360px);
        padding-top: 24px;
      }
      .stats,
      .proof-strip,
      .grid {
        grid-template-columns: 1fr;
      }
      .proof-strip > * {
        border-right: 0;
        border-bottom: 3px solid var(--ink);
      }
      .proof-strip > :last-child {
        border-bottom: 0;
      }
      .masthead {
        min-height: 620px;
        padding: 18px;
      }
      .masthead::before {
        background:
          linear-gradient(180deg, rgba(255, 243, 95, .98) 0 62%, rgba(255, 243, 95, .74)),
          linear-gradient(135deg, transparent 0 48%, rgba(255, 79, 135, .62) 48% 63%, transparent 63%),
          linear-gradient(26deg, transparent 0 68%, rgba(85, 240, 183, .56) 68% 80%, transparent 80%);
      }
      h1 {
        font-size: clamp(39px, 13vw, 64px);
      }
      .latest {
        padding: 12px;
      }
      .links {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .latest-preview {
        grid-template-columns: 1fr;
      }
      .mobile-shot {
        width: min(220px, 62%)!important;
        margin: -34px 14px 14px auto;
        border: 3px solid var(--ink);
        box-shadow: 6px 6px 0 var(--pink);
      }
      .logo-row {
        align-items: flex-start;
        flex-direction: column;
      }
      .logo-row img {
        width: min(240px, 100%);
      }
      .meta {
        justify-content: flex-start;
        margin-left: 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        scroll-behavior: auto!important;
        transition-duration: .001ms!important;
      }
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="masthead">
      <img class="hero-bg" src="${escapeAttr(featuredImage)}" alt="" loading="eager">
      <div class="hero-copy">
        <p class="eyebrow">Riso proof kit</p>
        <h1>Sell the idea with live WordPress demos, not another slide.</h1>
        <p class="lede">Site-O-Mattic turns narrow local-service niches into polished, Playground-ready block themes with logos, screenshots, accessibility checks, and one-click proof.</p>
        <p class="hero-note">Open any card and the pitch becomes a real WordPress site in the browser.</p>
        <div class="actions">
          <a class="button primary" href="${escapeAttr(featured.playgroundUrl)}">Launch featured demo</a>
          <a class="button" href="#catalog">Browse the catalog</a>
        </div>
      </div>
    </header>

    <dl class="stats" aria-label="Catalog counts">
      <div class="stat"><dt>Live demos</dt><dd>${items.length}</dd></div>
      <div class="stat"><dt>Approved builds</dt><dd>${approvedCount}</dd></div>
      <div class="stat"><dt>Distinct layouts</dt><dd>${layoutCount}</dd></div>
      <div class="stat"><dt>Screenshot QA</dt><dd>${escapeHtml(sweepStat)}</dd></div>
    </dl>

    <section class="proof-strip" aria-labelledby="proof-heading">
      <div>
        <h2 id="proof-heading">The concept is clickable, inspectable, and already packaged.</h2>
      </div>
      <article><h3>Launch</h3><p>Each niche opens in WordPress Playground from a hosted Blueprint.</p></article>
      <article><h3>Inspect</h3><p>Specs, screenshots, assets, JSON, and ZIPs stay visible.</p></article>
      <article><h3>Trust</h3><p>Visual sweep, accessibility, and production checks travel with the demo.</p></article>
    </section>

    <section class="latest" aria-labelledby="featured-heading">
      <a class="latest-preview" href="${escapeAttr(featured.playgroundUrl)}" aria-label="Open ${escapeAttr(featured.name)} in WordPress Playground">
        <img class="desktop-shot" src="${escapeAttr(featuredImage)}" alt="${escapeAttr(featured.name)} desktop preview" loading="eager">
        ${featuredMobile ? `<img class="mobile-shot" src="${escapeAttr(featuredMobile)}" alt="${escapeAttr(featured.name)} mobile preview" loading="eager">` : ""}
      </a>
      <div>
        <p class="eyebrow">Live proof, not a deck</p>
        <h2 id="featured-heading">${escapeHtml(featured.name)}</h2>
        <p>${escapeHtml(featured.summary)}</p>
        <div class="actions">
          <a class="button primary" href="${escapeAttr(featured.playgroundUrl)}" aria-label="Open ${escapeAttr(featured.name)} live WordPress demo">Open live demo</a>
          <a class="button" href="${escapeAttr(featured.blueprintUrl)}" aria-label="Open ${escapeAttr(featured.name)} Blueprint JSON">Blueprint JSON</a>
          <a class="button" href="${escapeAttr(featured.zipUrl)}" aria-label="Download ${escapeAttr(featured.name)} Blueprint ZIP">Download ZIP</a>
        </div>
      </div>
    </section>

    <section class="pitch-points" aria-label="Sales talking points">
      <article><span aria-hidden="true">01</span><h2>Demo fast</h2><p>Start with a niche, click Playground, and watch the site appear.</p></article>
      <article><span aria-hidden="true">02</span><h2>Scale taste</h2><p>Use block themes, global settings, and visual review to keep quality high.</p></article>
      <article><span aria-hidden="true">03</span><h2>Sell proof</h2><p>Bring leadership a working catalog instead of a promise.</p></article>
    </section>

    <section class="toolbar" id="catalog" aria-labelledby="catalog-heading">
      <h2 id="catalog-heading">Pick a niche. Open the site. Feel the pitch click.</h2>
      <a href="${escapeAttr(repoBase)}">GitHub repository</a>
    </section>

    <section class="grid" aria-labelledby="catalog-heading">
${items.map(renderCard).join("\n")}
    </section>

    ${tasteQueue}

    <footer>
      Generated ${escapeHtml(generatedAt)} from ${escapeHtml(repository)} on ${escapeHtml(branch)}.
    </footer>
  </main>
</body>
</html>
`;
}

function renderTasteQueue(items) {
  const nameBySlug = new Map(items.map((item) => [item.slug, item.name]));
  const warnings = (reviewEvidence?.items || [])
    .filter((item) => item.tasteWarnings?.length)
    .slice(0, 3);
  const nearest = (comparisonDashboard?.nearest || reviewEvidence?.nearestNeighbors || [])
    .slice(0, warnings.length ? 3 : 5);
  const warningCount = Number(reviewEvidence?.tasteWarningCount || 0);
  const signals = [
    { text: warnings.length ? "Visual review queue" : "Closest visual neighbors" },
    warnings.length ? { text: `${warningCount} warnings` } : null,
    ...warnings.map((item) => ({
      text: `${nameBySlug.get(item.slug) || labelText(item.slug)}: ${tasteSignalFor(item.tasteWarnings)}`,
      title: (item.tasteWarnings || []).map((warning) => typeof warning === "string" ? warning : warning?.message || warning?.reason || "").filter(Boolean).join(" | ")
    })),
    ...nearest.map((pair) => ({
      text: `Watch ${nameBySlug.get(pair.left) || labelText(pair.left)} + ${nameBySlug.get(pair.right) || labelText(pair.right)}`,
      title: [pair.distance ? `Distance ${pair.distance}` : "", pairTasteTitle(pair)].filter(Boolean).join(" | ")
    }))
  ].filter((item) => item?.text);

  if (signals.length <= 2 && !nearest.length) {
    return "";
  }

  return `<details class="review-notes taste-queue">
      <summary>Design review notes</summary>
      <div class="signals" aria-label="Design review notes">
${signals.map(renderSignal).join("\n")}
      </div>
    </details>`;
}

function renderSignal(signal) {
  return `        <span class="signal">${escapeHtml(signal.text)}</span>`;
}

function renderCard(item) {
  const signals = item.reviewSignals.length
    ? `<div class="signals">${item.reviewSignals.map((signal) => `<span class="signal">${escapeHtml(signal)}</span>`).join("")}</div>`
    : "";
  return `      <article class="card">
        <a class="card-preview" href="${escapeAttr(item.playgroundUrl)}" aria-label="Open ${escapeAttr(item.name)} in WordPress Playground" style="background-image: url('${escapeAttr(item.screenshotUrl)}')">
          <img src="${escapeAttr(item.screenshotUrl)}" alt="Live site preview for ${escapeAttr(item.name)}" loading="eager" decoding="async">
        </a>
        <div class="content">
          <div class="logo-row">
            <img src="${escapeAttr(item.logoUrl)}" alt="${escapeAttr(item.name)} logo" loading="eager" decoding="async">
            <div class="meta">
              <span class="pill">Status: ${escapeHtml(labelText(item.status))}</span>
              <span class="pill">Pattern: ${escapeHtml(item.patternLabel)}</span>
            </div>
          </div>
          ${signals}
          <h2>${escapeHtml(item.name)}</h2>
          <p>${escapeHtml(item.niche)}</p>
          <p>${escapeHtml(item.summary)}</p>
          <nav class="links" aria-label="${escapeAttr(item.name)} links">
            <a href="${escapeAttr(item.playgroundUrl)}" aria-label="Open ${escapeAttr(item.name)} live WordPress demo">Open live demo</a>
            <a href="${escapeAttr(item.blueprintUrl)}" aria-label="Open ${escapeAttr(item.name)} Blueprint JSON">JSON</a>
            <a href="${escapeAttr(item.zipUrl)}" aria-label="Download ${escapeAttr(item.name)} Blueprint ZIP">ZIP</a>
            <a href="${escapeAttr(item.specUrl)}" aria-label="Open ${escapeAttr(item.name)} production spec">Spec</a>
            <a href="${escapeAttr(item.readmeUrl)}" aria-label="Open ${escapeAttr(item.name)} README">README</a>
          </nav>
        </div>
      </article>`;
}

async function screenshotUrlFor(slug, fallback) {
  const screenshotPath = path.join("public", "blueprints", slug, "assets", "screenshot.png");
  try {
    await fs.access(screenshotPath);
    return `${rawBase}/public/blueprints/${slug}/assets/screenshot.png`;
  } catch {
    return fallback;
  }
}

function pairTasteTitle(pair) {
  const left = comparisonDashboard?.reports?.find((item) => item.slug === pair.left)?.signature;
  const right = comparisonDashboard?.reports?.find((item) => item.slug === pair.right)?.signature;
  if (!left || !right) {
    return "";
  }
  return [
    `${pair.left}: ${left.silhouette} / ${left.navigationPrimitive} / ${left.styleFamily}`,
    `${pair.right}: ${right.silhouette} / ${right.navigationPrimitive} / ${right.styleFamily}`
  ].join(" | ");
}

function reviewSignalsFor(spec, reviewItem) {
  const signals = [];
  if (reviewItem) {
    signals.push(reviewItem.status === "ok" ? "Visual sweep OK" : `Review ${reviewItem.failures?.length || 1} issues`);
    if (reviewItem.tasteWarnings?.length) {
      signals.push(`Taste: ${tasteSignalFor(reviewItem.tasteWarnings)}`);
    }
    const scenario = reviewItem.scenarios?.find((item) => item.name === "desktop")
      || reviewItem.scenarios?.find((item) => item.name?.startsWith("mobile"))
      || reviewItem.scenarios?.[0];
    const ctaSignal = spec.copy?.primaryCta || scenario?.firstViewportExpectedCtaText || scenario?.firstViewportCtaText;
    if (ctaSignal) {
      signals.push(`CTA: ${shortSignal(ctaSignal, 22)}`);
    }
  } else {
    signals.push("Visual sweep pending");
  }
  return signals.filter(Boolean).slice(0, 5);
}

function tasteSignalFor(warnings) {
  const reasons = [...new Set(warnings.map(tasteWarningReason).filter(Boolean))];
  if (!reasons.length) {
    return `${warnings.length} taste`;
  }
  const [firstReason] = reasons;
  return reasons.length === 1 ? firstReason : `${firstReason} +${reasons.length - 1}`;
}

function tasteWarningReason(warning) {
  const text = typeof warning === "string"
    ? warning
    : warning?.message || warning?.reason || JSON.stringify(warning);
  if (/media proof/i.test(text)) {
    return "mobile proof thin";
  }
  if (/contrast/i.test(text)) {
    return "contrast check";
  }
  if (/cta/i.test(text)) {
    return /wrap/i.test(text) ? "CTA wrap" : "CTA timing";
  }
  if (/nearest-neighbor|too close/i.test(text)) {
    return "near neighbor";
  }
  return "taste check";
}

function latestCard(items) {
  return [...items].sort((a, b) => {
    const timeDelta = (b.updatedAtMs || 0) - (a.updatedAtMs || 0);
    return timeDelta || a.slug.localeCompare(b.slug);
  })[0] || items[0];
}

async function modifiedTimeMs(filePath) {
  try {
    return (await fs.stat(filePath)).mtimeMs;
  } catch {
    return 0;
  }
}

function currentBranch() {
  try {
    return execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function summarize(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= 180) {
    return text;
  }
  return `${text.slice(0, 177).replace(/\s+\S*$/, "")}...`;
}

function titleCase(value) {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function labelText(value) {
  return titleCase(String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim());
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

function shortSignal(value, maxLength) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1).replace(/\s+\S*$/, "")}...`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
