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
const pitchHeroSource = path.join("assets", "demo", "site-o-mattic-riso-pitch-wall.jpg");
const pitchHeroTargetName = "site-o-mattic-riso-pitch-wall.jpg";
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
const pitchHeroUrl = await preparePitchHeroAsset();
await prepareFeaturedPreview(featuredCard);
await fs.writeFile(pagePath, renderPage(cards, featuredCard, pitchHeroUrl));

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

async function preparePitchHeroAsset() {
  const targetDir = path.join("docs", "catalog-assets");
  const target = path.join(targetDir, pitchHeroTargetName);
  try {
    await fs.copyFile(pitchHeroSource, target);
    return `catalog-assets/${pitchHeroTargetName}`;
  } catch {
    return "";
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

function renderPage(items, featured, pitchHeroUrl = "") {
  const generatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const approvedCount = items.filter((item) => item.status === "approved").length;
  const sweepPassed = reviewEvidence ? Math.max(0, reviewEvidence.total - reviewEvidence.failed) : null;
  const sweepStat = reviewEvidence ? `${sweepPassed}/${reviewEvidence.total}` : "n/a";
  const layoutCount = new Set(items.map((item) => item.variant)).size;
  const featuredImage = featured.desktopPreview || featured.heroUrl;
  const featuredMobile = featured.mobilePreview || "";
  const heroIllustration = pitchHeroUrl || featuredImage;
  const heroShelf = renderHeroShelf(items, featured);
  const tasteQueue = renderTasteQueue(items);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Site-O-Mattic Demo Catalog</title>
  <meta name="description" content="A bold riso-style internal sales catalog for Playground-ready WordPress Blueprint demos.">
  <style>
    :root {
      color-scheme: light;
      --paper: #ffe65a;
      --page: #f7f1df;
      --surface: #fffdf4;
      --ink: #111628;
      --muted: #4e5366;
      --line: #171b2b;
      --blue: #1646f5;
      --blue-dark: #08277f;
      --pink: #ef6259;
      --pink-dark: #9d2f38;
      --mint: #20c8a2;
      --orange: #f07a3f;
      --scarlet: #ef6259;
      --violet: #1646f5;
      --shadow-blue: rgba(17, 22, 40, .14);
      --shadow-hard: 8px 8px 0 var(--ink);
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      background: linear-gradient(180deg, #fff4ca 0, var(--page) 440px);
      color: var(--ink);
      font-family: "Avenir Next", Avenir, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }
    body::before {
      position: fixed;
      z-index: -1;
      inset: 0;
      background: radial-gradient(circle at 1px 1px, rgba(17, 22, 40, .055) 1px, transparent 0) 0 0 / 22px 22px;
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
      width: min(1420px, calc(100% - 32px));
      margin: 0 auto;
      padding: 28px 0 60px;
    }
    .masthead {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
      gap: clamp(22px, 4vw, 44px);
      position: relative;
      overflow: hidden;
      min-height: clamp(560px, 74vh, 780px);
      align-items: end;
      border: 2px solid var(--ink);
      background: var(--paper);
      box-shadow: var(--shadow-hard);
      isolation: isolate;
      padding: clamp(22px, 5vw, 72px);
    }
    .masthead::before {
      position: absolute;
      inset: 0;
      z-index: 1;
      background: linear-gradient(90deg, rgba(255, 230, 90, .98) 0 38%, rgba(255, 230, 90, .68) 56%, rgba(255, 230, 90, .14) 76%, transparent 100%);
      content: "";
    }
    .masthead::after {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 1px 1px, rgba(22, 15, 42, .24) 1px, transparent 0) 0 0 / 12px 12px;
      content: "";
      mix-blend-mode: multiply;
      opacity: .1;
      pointer-events: none;
    }
    .hero-bg {
      position: absolute;
      inset: 0;
      z-index: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center center;
      filter: saturate(1.03) contrast(1.02);
    }
    .hero-copy {
      position: relative;
      z-index: 2;
      max-width: 760px;
    }
    .hero-ticket {
      position: relative;
      z-index: 2;
      align-self: center;
      max-width: 380px;
      border: 2px solid var(--ink);
      background: rgba(255, 253, 244, .92);
      box-shadow: 6px 6px 0 var(--ink);
      padding: clamp(14px, 1.7vw, 20px);
    }
    .hero-ticket::before {
      position: absolute;
      inset: 10px;
      border: 1px dashed rgba(22, 15, 42, .18);
      content: "";
      pointer-events: none;
    }
    .hero-ticket > * {
      position: relative;
      z-index: 1;
    }
    .hero-ticket h2 {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(24px, 2.2vw, 34px);
      font-weight: 800;
      line-height: 1;
      text-wrap: balance;
    }
    .ticket-shot {
      display: block;
      width: 100%;
      aspect-ratio: 16 / 9;
      margin: 14px 0 12px;
      border: 1px solid var(--ink);
      background: var(--blue);
      object-fit: cover;
      object-position: top center;
      filter: saturate(1.15) contrast(1.05);
    }
    .ticket-list {
      display: grid;
      gap: 7px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .ticket-list li {
      display: grid;
      grid-template-columns: 28px 1fr;
      gap: 9px;
      align-items: start;
      color: var(--muted);
      font-size: 13px;
      font-weight: 680;
      line-height: 1.3;
    }
    .ticket-list strong {
      display: inline-grid;
      min-height: 28px;
      place-items: center;
      border: 1px solid var(--ink);
      background: var(--mint);
      color: var(--ink);
      font-size: 12px;
      line-height: 1;
    }
    .ticket-ask {
      margin: 14px 0 0;
      padding: 10px;
      background: var(--ink);
      color: #ffffff;
      font-size: 13px;
      font-weight: 780;
      line-height: 1.28;
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      min-height: 30px;
      margin: 0 0 10px;
      padding: 5px 9px;
      border: 1px solid var(--ink);
      background: var(--mint);
      color: var(--ink);
      font-size: 12px;
      font-weight: 850;
      letter-spacing: 0;
      text-transform: uppercase;
    }
    .hero-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 16px 0 0;
      padding: 0;
      list-style: none;
    }
    .hero-badges li {
      display: inline-flex;
      align-items: center;
      min-height: 32px;
      padding: 6px 10px;
      border: 1px solid var(--ink);
      background: var(--surface);
      color: var(--ink);
      font-size: 13px;
      font-weight: 820;
      line-height: 1;
    }
    .hero-badges li:nth-child(2) {
      background: var(--surface);
    }
    .hero-badges li:nth-child(3) {
      background: var(--mint);
    }
    h1 {
      max-width: 850px;
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(46px, 5.1vw, 82px);
      font-weight: 800;
      line-height: .94;
      letter-spacing: 0;
      text-wrap: balance;
    }
    .lede {
      max-width: 720px;
      margin: 14px 0 0;
      color: #241c38;
      font-size: clamp(17px, 1.5vw, 21px);
      font-weight: 680;
    }
    .hero-note {
      display: block;
      max-width: 680px;
      margin-top: 16px;
      padding: 10px 12px 10px 14px;
      border-left: 5px solid var(--blue);
      background: rgba(255, 253, 244, .86);
      color: var(--blue-dark);
      font-size: 14px;
      font-weight: 760;
    }
    .hero-shelf {
      position: relative;
      z-index: 2;
      display: grid;
      grid-column: 1 / -1;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 10px;
      align-self: end;
      margin-top: clamp(8px, 2vw, 18px);
    }
    .hero-shelf a {
      position: relative;
      overflow: hidden;
      display: block;
      min-height: 118px;
      border: 2px solid var(--ink);
      background: var(--surface);
      color: var(--ink);
      text-decoration: none;
      box-shadow: 4px 4px 0 var(--ink);
    }
    .hero-shelf a:nth-child(2n) {
      transform: translateY(-8px);
    }
    .hero-shelf a:nth-child(3n) {
      box-shadow: 4px 4px 0 var(--pink-dark);
    }
    .hero-shelf img {
      display: block;
      width: 100%;
      height: 92px;
      object-fit: cover;
      object-position: top center;
      border-bottom: 2px solid var(--ink);
      filter: saturate(1.08) contrast(1.04);
    }
    .hero-shelf span {
      display: block;
      padding: 7px 8px 8px;
      background: rgba(255, 253, 244, .96);
      font-size: 11px;
      font-weight: 860;
      line-height: 1.12;
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
      border: 2px solid var(--ink);
      background: var(--surface);
      box-shadow: 5px 5px 0 var(--ink);
    }
    .stat:nth-child(2) {
      box-shadow: 5px 5px 0 var(--pink-dark);
    }
    .stat:nth-child(3) {
      box-shadow: 5px 5px 0 #11866d;
    }
    .stat:nth-child(4) {
      box-shadow: 5px 5px 0 var(--blue-dark);
    }
    .stat dd {
      order: 1;
      display: block;
      margin: 0;
      color: var(--pink-dark);
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(31px, 3.6vw, 56px);
      font-weight: 800;
      line-height: .9;
    }
    .stat dt {
      order: 2;
      display: block;
      margin-top: 10px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 850;
      text-transform: uppercase;
    }
    .proof-strip {
      display: grid;
      grid-template-columns: minmax(0, 1.25fr) repeat(3, minmax(0, .75fr));
      gap: 0;
      overflow: hidden;
      margin: 0 0 22px;
      border: 2px solid var(--ink);
      background: var(--surface);
      color: var(--ink);
      box-shadow: var(--shadow-hard);
    }
    .closing-board {
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr);
      gap: 14px;
      align-items: stretch;
      margin: 24px 0;
    }
    .closing-board > div,
    .closing-board article {
      border: 2px solid var(--ink);
      background: var(--surface);
      box-shadow: 5px 5px 0 var(--ink);
      padding: clamp(16px, 2vw, 24px);
    }
    .closing-board > div {
      background: var(--ink);
      color: #ffffff;
      box-shadow: 6px 6px 0 var(--blue);
    }
    .closing-board > div .eyebrow {
      background: var(--mint);
      color: var(--ink);
    }
    .closing-board h2,
    .closing-board h3,
    .closing-board p {
      margin: 0;
    }
    .closing-board h2 {
      max-width: 760px;
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(31px, 4vw, 62px);
      line-height: .96;
      text-wrap: balance;
    }
    .closing-board p {
      margin-top: 12px;
      color: inherit;
      font-weight: 760;
    }
    .closing-points {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }
    .closing-points article:nth-child(1) {
      background: var(--paper);
    }
    .closing-points article:nth-child(2) {
      background: var(--mint);
    }
    .closing-points article:nth-child(3) {
      background: #ffd4cd;
    }
    .closing-points article:nth-child(4) {
      background: #dce6ff;
    }
    .closing-board h3 {
      font-size: 18px;
      line-height: 1;
      text-transform: uppercase;
    }
    .closing-points p {
      color: var(--ink);
      font-size: 14px;
      line-height: 1.35;
    }
    .proof-strip > * {
      min-width: 0;
      padding: 17px;
      border-right: 2px solid var(--ink);
      background: var(--surface);
    }
    .proof-strip > :first-child {
      background: var(--ink);
      color: #ffffff;
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
      font-weight: 800;
      text-wrap: balance;
    }
    .proof-strip h3 {
      color: var(--blue);
      font-size: 14px;
      text-transform: uppercase;
    }
    .proof-strip p {
      margin-top: 8px;
      font-size: 14px;
      font-weight: 720;
    }
    .latest {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(300px, .64fr);
      gap: 22px;
      align-items: center;
      margin: 22px 0 26px;
      padding: 16px;
      border: 2px solid var(--ink);
      background: var(--surface);
      box-shadow: var(--shadow-hard);
    }
    .latest-preview {
      position: relative;
      overflow: hidden;
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(96px, 18%);
      gap: 10px;
      align-items: end;
      border: 2px solid var(--ink);
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
      font-weight: 560;
    }
    .card-kicker {
      color: var(--pink-dark)!important;
      font-size: 13px;
      font-weight: 860!important;
      line-height: 1.15;
      text-transform: uppercase;
    }
    .card-summary strong {
      color: var(--ink);
      font-weight: 850;
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
      font-weight: 820;
      line-height: 1.1;
      text-decoration: none;
      box-shadow: 0 4px 0 var(--ink);
      transition: transform .18s ease, box-shadow .18s ease;
    }
    .button.primary {
      background: var(--blue);
      color: #ffffff;
    }
    .button:hover,
    .links a:hover {
      transform: translate(-1px, -1px);
      box-shadow: 0 5px 0 var(--ink);
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
      border: 2px solid var(--ink);
      background: var(--surface);
      box-shadow: 0 10px 24px var(--shadow-blue);
    }
    .pitch-points article:nth-child(2) {
      box-shadow: 0 10px 24px rgba(241, 78, 131, .14);
    }
    .pitch-points article:nth-child(3) {
      box-shadow: 0 10px 24px rgba(32, 200, 162, .14);
    }
    .pitch-points span {
      display: inline-flex;
      min-width: 44px;
      min-height: 34px;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--ink);
      background: var(--pink);
      font-weight: 850;
    }
    .pitch-points article:nth-child(2) span {
      background: var(--mint);
    }
    .pitch-points article:nth-child(3) span {
      background: var(--paper);
    }
    .pitch-points h2 {
      margin: 12px 0 0;
      font-size: clamp(24px, 3vw, 42px);
      line-height: 1.05;
    }
    .pitch-points p {
      color: var(--muted);
      font-weight: 560;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
      margin: 34px 0 16px;
      scroll-margin-top: 18px;
    }
    .toolbar h2 {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(28px, 3.6vw, 54px);
      line-height: 1;
      font-weight: 800;
      text-wrap: balance;
    }
    .toolbar a {
      color: var(--muted);
      font-size: 14px;
      font-weight: 760;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
    }
    .card {
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
      border: 2px solid var(--ink);
      background: var(--surface);
      box-shadow: 0 10px 24px var(--shadow-blue);
    }
    .card:nth-child(3n+1) {
      box-shadow: 0 10px 24px rgba(241, 78, 131, .12);
    }
    .card:nth-child(3n+2) {
      box-shadow: 0 10px 24px rgba(32, 200, 162, .12);
    }
    .card:nth-child(3n+3) {
      box-shadow: 0 10px 24px rgba(69, 50, 216, .12);
    }
    .card-preview {
      position: relative;
      display: block;
      overflow: hidden;
      aspect-ratio: 16 / 10;
      border-bottom: 2px solid var(--ink);
      background: var(--blue);
      background-position: top center;
      background-repeat: no-repeat;
      background-size: cover;
      text-decoration: none;
    }
    .card-preview::before {
      display: inline-flex;
      position: absolute;
      z-index: 1;
      top: 10px;
      left: 10px;
      padding: 5px 8px;
      border: 1px solid var(--ink);
      background: var(--paper);
      color: var(--ink);
      content: "LIVE SCREENSHOT";
      font-size: 11px;
      font-weight: 850;
      line-height: 1;
    }
    .card-number {
      position: absolute;
      z-index: 2;
      right: 10px;
      bottom: 10px;
      padding: 5px 8px;
      border: 1px solid var(--ink);
      background: var(--mint);
      color: var(--ink);
      font-size: 11px;
      font-weight: 850;
      line-height: 1;
    }
    .card-preview img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top center;
      opacity: 1;
      transition: transform .18s ease;
    }
    .card-preview:hover img {
      transform: scale(1.018);
    }
    .content {
      display: flex;
      flex: 1;
      flex-direction: column;
      padding: 16px;
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
      border: 1px solid var(--ink);
      background: #eefaf6;
      color: var(--ink);
      font-size: 12px;
      font-weight: 760;
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
      border: 1px solid rgba(23, 27, 43, .42);
      color: var(--muted);
      font-size: 11px;
      font-weight: 720;
      line-height: 1.1;
    }
    .taste-queue {
      margin: 26px 0 8px;
    }
    .review-notes {
      padding: 12px;
      border: 2px solid var(--line);
      background: var(--surface);
      box-shadow: 0 10px 24px var(--shadow-blue);
    }
    .review-notes summary {
      cursor: pointer;
      font-weight: 850;
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
      padding: 10px 10px;
      border: 1px solid var(--line);
      color: var(--ink);
      font-size: 13px;
      font-weight: 760;
      text-align: center;
      text-decoration: none;
      transition: transform .18s ease, box-shadow .18s ease;
    }
    .links a:first-child {
      grid-column: 1 / -1;
      background: var(--scarlet);
      color: var(--ink);
      font-weight: 880;
    }
    .card:nth-child(3n+2) .links a:first-child {
      background: var(--blue);
      color: #ffffff;
    }
    .card:nth-child(3n+3) .links a:first-child {
      background: var(--pink-dark);
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
      .hero-shelf {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .pitch-points {
        grid-template-columns: 1fr;
      }
      .closing-board {
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
        border-bottom: 2px solid var(--ink);
      }
      .proof-strip > :last-child {
        border-bottom: 0;
      }
      .masthead {
        grid-template-columns: 1fr;
        min-height: 620px;
        gap: 22px;
        padding: 20px;
      }
      .hero-copy {
        order: 1;
      }
      .hero-shelf {
        order: 2;
      }
      .hero-ticket {
        order: 3;
      }
      .masthead::before {
        background: linear-gradient(180deg, rgba(255, 241, 95, .98) 0 56%, rgba(255, 241, 95, .62) 76%, rgba(255, 241, 95, .12) 100%);
      }
      .hero-bg {
        object-position: 58% center;
      }
      h1 {
        font-size: clamp(35px, 10.8vw, 52px);
        line-height: .98;
      }
      .hero-badges li {
        font-size: 12px;
      }
      .latest {
        padding: 12px;
      }
      .hero-ticket {
        padding: 16px;
        transform: none;
      }
      .hero-ticket h2 {
        font-size: clamp(23px, 7.1vw, 30px);
        line-height: 1.04;
      }
      .hero-shelf {
        grid-template-columns: 1fr 1fr;
        gap: 9px;
      }
      .hero-shelf a {
        min-height: 104px;
      }
      .hero-shelf a:nth-child(n+5) {
        display: none;
      }
      .hero-shelf img {
        height: 74px;
      }
      .hero-shelf span {
        padding: 6px 7px;
        font-size: 10px;
      }
      .ticket-list {
        gap: 10px;
      }
      .ticket-list li {
        grid-template-columns: 28px 1fr;
        font-size: 13px;
        font-weight: 680;
      }
      .ticket-list strong {
        min-height: 26px;
      }
      .ticket-ask {
        padding: 11px;
        font-size: 13px;
      }
      .closing-points {
        grid-template-columns: 1fr;
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
        border: 2px solid var(--ink);
        box-shadow: 0 10px 22px rgba(17, 22, 40, .16);
      }
      .logo-row {
        align-items: flex-start;
        flex-direction: column;
        min-height: 0;
      }
      .logo-row img {
        display: none;
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
      <img class="hero-bg" src="${escapeAttr(heroIllustration)}" alt="" loading="eager">
      <div class="hero-copy">
        <p class="eyebrow">Site-O-Mattic sales wall</p>
        <h1>Sell the idea with live WordPress.</h1>
        <p class="lede">${items.length} inspectable niche demos with ImageGen-made brand energy, screenshot proof on every card, and one-click Playground launches for the room.</p>
        <ul class="hero-badges" aria-label="Demo proof points">
          <li>ImageGen-led</li>
          <li>Screenshot-first</li>
          <li>Playground-ready</li>
        </ul>
        <p class="hero-note">Use it like a meeting artifact: point at a niche, launch the live site, show the proof trail, and ask for the next production lane.</p>
        <div class="actions">
          <a class="button primary" href="${escapeAttr(featured.playgroundUrl)}">Open featured demo</a>
          <a class="button" href="#catalog">Browse screenshot wall</a>
        </div>
      </div>
      <aside class="hero-ticket" aria-label="90-second meeting script">
        <p class="eyebrow">90-second room script</p>
        <h2>Open the site. Show the receipts. Close the lane.</h2>
        <img class="ticket-shot" src="${escapeAttr(featuredImage)}" alt="" loading="eager">
        <ol class="ticket-list">
          <li><strong>1</strong><span>Pick a niche the room understands instantly.</span></li>
          <li><strong>2</strong><span>Launch the live Playground site.</span></li>
          <li><strong>3</strong><span>Show the screenshot, JSON, and spec.</span></li>
          <li><strong>4</strong><span>Ask for the next production lane.</span></li>
        </ol>
        <p class="ticket-ask">Ask: approve the next lane of inspectable WordPress sales demos.</p>
      </aside>
      ${heroShelf}
    </header>

    <dl class="stats" aria-label="Catalog counts">
      <div class="stat"><dt>Live demo links</dt><dd>${items.length}</dd></div>
      <div class="stat"><dt>Approved proofs</dt><dd>${approvedCount}</dd></div>
      <div class="stat"><dt>Layout lanes</dt><dd>${layoutCount}</dd></div>
      <div class="stat"><dt>Visual sweep</dt><dd>${escapeHtml(sweepStat)}</dd></div>
    </dl>

    <section class="proof-strip" aria-labelledby="proof-heading">
      <div>
        <h2 id="proof-heading">Bring the room a product, not a promise.</h2>
      </div>
      <article><h3>Launch</h3><p>Every niche opens as a real WordPress site from a hosted Blueprint.</p></article>
      <article><h3>Inspect</h3><p>Screenshots, specs, assets, JSON, and ZIPs keep the artifact accountable.</p></article>
      <article><h3>Scale</h3><p>One lean block foundation carries many brands, layouts, and service stories.</p></article>
    </section>

    <section class="latest" aria-labelledby="featured-heading">
      <a class="latest-preview" href="${escapeAttr(featured.playgroundUrl)}" aria-label="Open ${escapeAttr(featured.name)} in WordPress Playground">
        <img class="desktop-shot" src="${escapeAttr(featuredImage)}" alt="${escapeAttr(featured.name)} desktop preview" loading="eager">
        ${featuredMobile ? `<img class="mobile-shot" src="${escapeAttr(featuredMobile)}" alt="${escapeAttr(featured.name)} mobile preview" loading="eager">` : ""}
      </a>
      <div>
        <p class="eyebrow">Featured proof</p>
        <h2 id="featured-heading">${escapeHtml(featured.name)}</h2>
        <p>${escapeHtml(featured.summary)}</p>
        <div class="actions">
          <a class="button primary" href="${escapeAttr(featured.playgroundUrl)}" aria-label="Launch ${escapeAttr(featured.name)} in WordPress Playground">Launch in Playground</a>
          <a class="button" href="${escapeAttr(featured.blueprintUrl)}" aria-label="Open ${escapeAttr(featured.name)} Blueprint JSON">Blueprint JSON</a>
          <a class="button" href="${escapeAttr(featured.zipUrl)}" aria-label="Download ${escapeAttr(featured.name)} Blueprint ZIP">Download ZIP</a>
        </div>
      </div>
    </section>

    <section class="closing-board" aria-labelledby="closing-heading">
      <div>
        <p class="eyebrow">What you are really selling</p>
        <h2 id="closing-heading">A repeatable WordPress demo factory with taste in the loop.</h2>
        <p>The ImageGen pitch wall brings the spark. The proof underneath is practical: core blocks, theme settings, screenshots, accessibility checks, and Playground links that make the concept inspectable.</p>
      </div>
      <div class="closing-points">
        <article><h3>Fast to see</h3><p>People can understand the opportunity before they read the repo.</p></article>
        <article><h3>Easy to trust</h3><p>Every card leads with a screenshot and carries the live site, JSON, ZIP, and spec.</p></article>
        <article><h3>Built to govern</h3><p>Block-first output keeps the demos close to WordPress, not a fragile one-off.</p></article>
        <article><h3>Ready to fund</h3><p>The catalog turns the next step into a concrete production lane.</p></article>
      </div>
    </section>

    <section class="pitch-points" aria-label="Sales talking points">
      <article><span aria-hidden="true">01</span><h2>Make it tangible</h2><p>Start with the featured demo, then jump across niches without leaving the browser.</p></article>
      <article><span aria-hidden="true">02</span><h2>Show range</h2><p>One lean WordPress foundation, many business stories, layouts, palettes, and generated logos.</p></article>
      <article><span aria-hidden="true">03</span><h2>Close cleanly</h2><p>Leadership sees the artifact, the guardrails, and the obvious next investment.</p></article>
    </section>

    <section class="toolbar" id="catalog" aria-labelledby="catalog-heading">
      <h2 id="catalog-heading">Demo wall: screenshot first, live WordPress one click away.</h2>
      <a href="${escapeAttr(repoBase)}">GitHub repository</a>
    </section>

    <section class="grid" aria-label="Demo catalog cards">
${items.map((item, index) => renderCard(item, index)).join("\n")}
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

function renderHeroShelf(items, featured) {
  const preferredSlugs = [
    featured.slug,
    "garage-organization",
    "mobile-auto-detailing",
    "holiday-light-installation",
    "pool-cleaning",
    "wood-fired-pizza-taco-catering"
  ];
  const bySlug = new Map(items.map((item) => [item.slug, item]));
  const seen = new Set();
  const shelfItems = [...preferredSlugs.map((slug) => bySlug.get(slug)), ...items]
    .filter((item) => {
      if (!item || seen.has(item.slug)) {
        return false;
      }
      seen.add(item.slug);
      return Boolean(item.screenshotUrl && item.playgroundUrl);
    })
    .slice(0, 6);

  if (!shelfItems.length) {
    return "";
  }

  return `<nav class="hero-shelf" aria-label="Featured live demo screenshots">
${shelfItems.map((item) => `        <a href="${escapeAttr(item.playgroundUrl)}" aria-label="Open ${escapeAttr(item.name)} live demo in WordPress Playground">
          <img src="${escapeAttr(item.screenshotUrl)}" alt="" loading="eager">
          <span>${escapeHtml(item.name)}</span>
        </a>`).join("\n")}
      </nav>`;
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

function renderCard(item, index = 0) {
  const signals = item.reviewSignals.length
    ? `<div class="signals">${item.reviewSignals.map((signal) => `<span class="signal">${escapeHtml(signal)}</span>`).join("")}</div>`
    : "";
  return `      <article class="card" aria-labelledby="card-${escapeAttr(item.slug)}-title">
        <a class="card-preview" href="${escapeAttr(item.playgroundUrl)}" aria-label="Open ${escapeAttr(item.name)} in WordPress Playground" style="background-image: url('${escapeAttr(item.screenshotUrl)}')">
          <img src="${escapeAttr(item.screenshotUrl)}" alt="Screenshot preview of the ${escapeAttr(item.name)} demo site" loading="lazy" decoding="async">
          <span class="card-number">Demo ${String(index + 1).padStart(2, "0")}</span>
        </a>
        <div class="content">
          <div class="logo-row">
            <img src="${escapeAttr(item.logoUrl)}" alt="${escapeAttr(item.name)} logo" loading="lazy" decoding="async">
            <div class="meta">
              <span class="pill">Status: ${escapeHtml(labelText(item.status))}</span>
              <span class="pill">Pattern: ${escapeHtml(item.patternLabel)}</span>
            </div>
          </div>
          ${signals}
          <h2 id="card-${escapeAttr(item.slug)}-title">${escapeHtml(item.name)}</h2>
          <p class="card-kicker">${escapeHtml(item.niche)} sales demo</p>
          <p class="card-summary"><strong>Pitch angle:</strong> ${escapeHtml(item.summary)}</p>
          <div class="links" role="group" aria-label="${escapeAttr(item.name)} links">
            <a href="${escapeAttr(item.playgroundUrl)}" aria-label="Launch ${escapeAttr(item.name)} in WordPress Playground">Launch Playground</a>
            <a href="${escapeAttr(item.blueprintUrl)}" aria-label="Open ${escapeAttr(item.name)} Blueprint JSON">JSON</a>
            <a href="${escapeAttr(item.zipUrl)}" aria-label="Download ${escapeAttr(item.name)} Blueprint ZIP">ZIP</a>
            <a href="${escapeAttr(item.specUrl)}" aria-label="Open ${escapeAttr(item.name)} production spec">Spec</a>
            <a href="${escapeAttr(item.readmeUrl)}" aria-label="Open ${escapeAttr(item.name)} README">README</a>
          </div>
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
