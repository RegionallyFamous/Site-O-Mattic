import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
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
const catalogFaviconSource = path.join("assets", "demo", "site-o-mattic-catalog-favicon.png");
const catalogFaviconIcoSource = path.join("assets", "demo", "site-o-mattic-catalog-favicon.ico");
const catalogAppleTouchIconSource = path.join("assets", "demo", "site-o-mattic-catalog-apple-touch-icon.png");
const requestedFeaturedSlug = process.env.SITE_O_MATTIC_FEATURED_SLUG || "";
const previewSweepDir = process.env.SITE_O_MATTIC_PREVIEW_SWEEP_DIR || path.join("qa", "reports", "visual-sweep");
const reviewEvidence = await readJsonIfExists(path.join("qa", "reports", "visual-sweep", "review-evidence.json"));

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
    updatedAtMs
  });
}

await fs.mkdir("docs", { recursive: true });
await fs.writeFile(path.join("docs", ".nojekyll"), "");
const featuredCard = requestedFeaturedSlug
  ? cards.find((item) => item.slug === requestedFeaturedSlug) || latestCard(cards)
  : latestCard(cards);
await prepareCatalogAssets(cards);
const pitchHeroUrl = await preparePitchHeroAsset();
const catalogIcons = await prepareCatalogIconAssets();
await prepareFeaturedPreview(featuredCard);
const pageHtml = renderPage(cards, featuredCard, pitchHeroUrl, catalogIcons);
assertNoDotTestUrls(pageHtml);
await fs.writeFile(pagePath, pageHtml);

console.log(`Wrote ${pagePath} with ${cards.length} Blueprint links.`);

function assertNoDotTestUrls(html) {
  const matches = [
    ...html.matchAll(/\b(?:href|src)=["']([^"']*\.test(?:[/?#:][^"']*)?)["']/gi),
    ...html.matchAll(/\bhttps?:\/\/[^\s"'<>)]*\.test(?:[/?#:][^\s"'<>)]*)?/gi)
  ].map((match) => match[1] || match[0]);
  const uniqueMatches = [...new Set(matches)];
  if (uniqueMatches.length) {
    throw new Error(`Catalog must not publish .test URLs: ${uniqueMatches.slice(0, 8).join(", ")}`);
  }
}

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

async function prepareCatalogIconAssets() {
  const iconTarget = path.join("docs", "favicon.png");
  const icoTarget = path.join("docs", "favicon.ico");
  const appleTarget = path.join("docs", "apple-touch-icon.png");
  const icons = {};

  try {
    await fs.copyFile(catalogFaviconIcoSource, icoTarget);
    icons.faviconIco = await cacheBustedAssetHref(icoTarget, "favicon.ico");
  } catch {
    // Keep the PNG favicon path as the canonical generated icon if ICO is absent.
  }

  try {
    await fs.copyFile(catalogFaviconSource, iconTarget);
    icons.favicon = await cacheBustedAssetHref(iconTarget, "favicon.png");
  } catch {
    // Keep the catalog usable if the optional generated icon is missing.
  }

  try {
    await fs.copyFile(catalogAppleTouchIconSource, appleTarget);
    icons.appleTouchIcon = await cacheBustedAssetHref(appleTarget, "apple-touch-icon.png");
  } catch {
    // Keep the catalog usable if the optional generated icon is missing.
  }

  return icons;
}

async function cacheBustedAssetHref(filePath, publicPath) {
  const digest = crypto
    .createHash("sha256")
    .update(await fs.readFile(filePath))
    .digest("hex")
    .slice(0, 12);
  return `${publicPath}?v=${digest}`;
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

function renderPage(items, featured, pitchHeroUrl = "", catalogIcons = {}) {
  const generatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const approvedCount = items.filter((item) => item.status === "approved").length;
  const sweepPassed = reviewEvidence ? Math.max(0, reviewEvidence.total - reviewEvidence.failed) : null;
  const sweepStat = reviewEvidence ? `${sweepPassed}/${reviewEvidence.total}` : "n/a";
  const featuredImage = featured.desktopPreview || featured.heroUrl;
  const heroIllustration = pitchHeroUrl || featuredImage;
  const faviconTags = [
    catalogIcons.faviconIco ? `<link rel="icon" sizes="any" href="${escapeAttr(catalogIcons.faviconIco)}">` : "",
    catalogIcons.favicon ? `<link rel="icon" type="image/png" sizes="256x256" href="${escapeAttr(catalogIcons.favicon)}">` : "",
    catalogIcons.appleTouchIcon ? `<link rel="apple-touch-icon" sizes="180x180" href="${escapeAttr(catalogIcons.appleTouchIcon)}">` : ""
  ].filter(Boolean).join("\n  ");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Site-O-Mattic Demo Catalog</title>
  <meta name="description" content="A riso-bright internal pitch catalog for live, Playground-ready WordPress Blueprint demos.">
  ${faviconTags}
  <style>
    :root {
      color-scheme: light;
      --paper: #fff06a;
      --page: #f4f8ff;
      --surface: #fffdf7;
      --ink: #101626;
      --muted: #34394d;
      --line: #171b2b;
      --blue: #1646f5;
      --blue-dark: #08277f;
      --pink: #ef6259;
      --pink-dark: #9d2f38;
      --mint: #20c8a2;
      --orange: #f07a3f;
      --scarlet: #ef6259;
      --violet: #1646f5;
      --shadow-blue: rgba(17, 22, 40, .1);
      --shadow-hard: 4px 4px 0 var(--ink);
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      background:
        linear-gradient(180deg, rgba(255, 240, 106, .6) 0, rgba(255, 240, 106, .18) 300px, var(--page) 680px),
        var(--page);
      color: var(--ink);
      font-family: "Avenir Next", Avenir, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }
    body::before {
      position: fixed;
      z-index: -1;
      inset: 0;
      background: radial-gradient(circle at 1px 1px, rgba(17, 22, 40, .045) 1px, transparent 0) 0 0 / 26px 26px;
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
      width: min(1160px, calc(100% - 28px));
      margin: 0 auto;
      padding: 24px 0 68px;
    }
    .masthead {
      display: grid;
      grid-template-columns: minmax(0, 1.18fr) minmax(300px, .82fr);
      gap: clamp(18px, 3vw, 34px);
      position: relative;
      overflow: hidden;
      min-height: clamp(360px, 48vh, 520px);
      align-items: center;
      border: 2px solid var(--ink);
      background: var(--paper);
      box-shadow: 4px 4px 0 var(--ink);
      isolation: isolate;
      padding: clamp(22px, 3.6vw, 46px);
    }
    .masthead::before {
      position: absolute;
      inset: 0;
      z-index: 1;
      background:
        linear-gradient(90deg, rgba(255, 240, 106, .97) 0 53%, rgba(255, 253, 247, .82) 100%),
        linear-gradient(180deg, rgba(255, 253, 247, .08), rgba(255, 253, 247, .42));
      content: "";
    }
    .masthead::after {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 1px 1px, rgba(22, 15, 42, .24) 1px, transparent 0) 0 0 / 12px 12px;
      content: "";
      mix-blend-mode: multiply;
      opacity: .045;
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
      filter: saturate(1.04) contrast(1.02);
      mix-blend-mode: multiply;
      opacity: .16;
    }
    .hero-copy {
      position: relative;
      z-index: 2;
      max-width: 680px;
    }
    .hero-ticket {
      position: relative;
      z-index: 2;
      align-self: stretch;
      border: 1px solid var(--ink);
      background: rgba(255, 253, 247, .98);
      box-shadow: 0 14px 28px rgba(17, 22, 40, .12);
      padding: clamp(12px, 1.6vw, 18px);
    }
    .hero-ticket::before {
      position: absolute;
      inset: 10px;
      content: none;
      pointer-events: none;
    }
    .hero-ticket > * {
      position: relative;
      z-index: 1;
    }
    .hero-ticket h2 {
      margin: 0;
      font-family: Charter, "Iowan Old Style", Georgia, "Times New Roman", serif;
      font-size: clamp(22px, 2.1vw, 32px);
      font-weight: 720;
      line-height: 1.04;
      text-wrap: balance;
    }
    .hero-ticket p {
      margin: 10px 0 0;
      color: var(--muted);
      font-size: 1rem;
      font-weight: 480;
      line-height: 1.45;
    }
    .ticket-shot {
      display: block;
      width: 100%;
      aspect-ratio: 16 / 9;
      margin: 0 0 14px;
      border: 1px solid var(--ink);
      background: var(--blue);
      object-fit: cover;
      object-position: top center;
      filter: saturate(1.15) contrast(1.05);
    }
    .ticket-shot-link {
      display: block;
      color: inherit;
      text-decoration: none;
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      margin: 0 0 8px;
      color: var(--blue-dark);
      font-size: .95rem;
      font-weight: 720;
      letter-spacing: 0;
      text-transform: uppercase;
    }
    .hero-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 18px 0 0;
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
      font-size: 14px;
      font-weight: 560;
      line-height: 1.2;
    }
    .hero-badges li:nth-child(2) {
      background: var(--surface);
    }
    .hero-badges li:nth-child(3) {
      background: var(--mint);
    }
    h1 {
      max-width: 720px;
      margin: 0;
      font-family: Charter, "Iowan Old Style", Georgia, "Times New Roman", serif;
      font-size: clamp(40px, 3.9vw, 62px);
      font-weight: 720;
      line-height: 1.01;
      letter-spacing: 0;
      text-wrap: balance;
    }
    .lede {
      max-width: 680px;
      margin: 12px 0 0;
      color: #20243d;
      font-size: clamp(17px, 1.22vw, 19px);
      font-weight: 500;
      line-height: 1.48;
    }
    .proof-strip {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0;
      overflow: hidden;
      margin: 18px 0 24px;
      border: 1px solid rgba(16, 22, 38, .42);
      background: var(--surface);
      color: var(--ink);
      box-shadow: 0 10px 24px rgba(17, 22, 40, .07);
    }
    .proof-strip > * {
      min-width: 0;
      padding: clamp(14px, 1.5vw, 18px);
      border-right: 1px solid rgba(16, 22, 38, .22);
      background: var(--surface);
    }
    .proof-strip > :last-child {
      border-right: 0;
    }
    .proof-strip h2,
    .proof-strip h3,
    .proof-strip p {
      margin: 0;
    }
    .proof-strip h2,
    .proof-strip h3 {
      color: var(--blue);
      font-size: 1rem;
      font-weight: 720;
      line-height: 1.25;
      text-transform: uppercase;
    }
    .proof-strip p {
      max-width: 32ch;
      margin-top: 6px;
      font-size: 1rem;
      font-weight: 440;
      line-height: 1.48;
    }
    .card h2 {
      margin: 0;
      font-size: clamp(22px, 1.7vw, 25px);
      font-weight: 640;
      line-height: 1.14;
      letter-spacing: 0;
      text-wrap: balance;
    }
    .card p {
      margin: 10px 0 0;
      color: var(--muted);
      font-size: 1rem;
      font-weight: 440;
      line-height: 1.46;
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
      font-size: 1rem;
      font-weight: 680;
      line-height: 1.16;
      text-decoration: none;
      box-shadow: 0 3px 0 var(--ink);
      transition: transform .18s ease, box-shadow .18s ease;
    }
    .button.primary {
      background: var(--blue);
      color: #ffffff;
    }
    .button:hover,
    .card-launch:hover,
    .links a:hover {
      transform: translate(-1px, -1px);
      box-shadow: 0 4px 0 var(--ink);
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: end;
      justify-content: space-between;
      margin: 24px 0 16px;
      scroll-margin-top: 18px;
    }
    .toolbar h2 {
      margin: 0;
      font-family: Charter, "Iowan Old Style", Georgia, "Times New Roman", serif;
      max-width: 780px;
      font-size: clamp(30px, 3.25vw, 48px);
      line-height: 1.02;
      font-weight: 740;
      text-wrap: balance;
    }
    .toolbar a {
      display: inline-flex;
      align-items: center;
      min-height: 40px;
      padding: 8px 12px;
      border: 1px solid rgba(16, 22, 38, .34);
      background: var(--surface);
      color: var(--ink);
      font-size: 1rem;
      font-weight: 650;
      text-decoration: none;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
      gap: 16px;
    }
    .card {
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
      border: 1px solid rgba(16, 22, 38, .34);
      background: var(--surface);
      box-shadow: 0 10px 24px rgba(17, 22, 40, .07);
    }
    .card-preview {
      position: relative;
      display: block;
      overflow: hidden;
      aspect-ratio: 16 / 10;
      border-bottom: 1px solid rgba(16, 22, 38, .32);
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
      flex-direction: column;
      min-height: 44px;
      align-items: flex-start;
      justify-content: flex-start;
      gap: 10px;
      margin-bottom: 8px;
    }
    .logo-row img {
      display: block;
      width: min(190px, 70%);
      max-height: 42px;
      object-fit: contain;
      object-position: left center;
    }
    .card-meta {
      margin: 0 0 8px;
      color: var(--blue-dark);
      font-size: .95rem;
      font-weight: 560;
      line-height: 1.35;
    }
    .card-summary {
      display: -webkit-box;
      overflow: hidden;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-height: 1.46;
    }
    .card-launch {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 40px;
      margin-top: 16px;
      padding: 10px 12px;
      border: 1px solid var(--ink);
      background: var(--blue);
      color: #ffffff;
      font-size: 1rem;
      font-weight: 660;
      line-height: 1.15;
      text-decoration: none;
      box-shadow: 0 3px 0 var(--ink);
      transition: transform .18s ease, box-shadow .18s ease;
    }
    .artifact-links {
      margin-top: 10px;
      border-top: 1px solid rgba(16, 22, 38, .16);
      padding-top: 10px;
    }
    .artifact-links summary {
      display: flex;
      min-height: 36px;
      align-items: center;
      cursor: pointer;
      color: var(--muted);
      font-size: .95rem;
      font-weight: 560;
    }
    .links {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 7px;
      margin-top: 9px;
    }
    .links a {
      min-height: 34px;
      padding: 8px 7px;
      border: 1px solid rgba(16, 22, 38, .34);
      color: var(--ink);
      font-size: .95rem;
      font-weight: 560;
      text-align: center;
      text-decoration: none;
      transition: transform .18s ease, box-shadow .18s ease;
    }
    footer {
      margin-top: 32px;
      padding-top: 20px;
      border-top: 3px solid var(--line);
      color: var(--muted);
      font-size: 14px;
    }
    @media (max-width: 920px) {
      .masthead {
        grid-template-columns: 1fr;
      }
      .proof-strip {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    @media (min-width: 621px) and (max-width: 920px) {
      .proof-strip > * {
        border-right: 1px solid rgba(16, 22, 38, .22);
        border-bottom: 0;
      }
      .proof-strip > :last-child {
        border-right: 0;
      }
    }
    @media (max-width: 620px) {
      .page {
        width: min(100% - 24px, 1360px);
        padding-top: 24px;
      }
      .proof-strip,
      .grid {
        grid-template-columns: 1fr;
      }
      .proof-strip > * {
        border-right: 0;
        border-bottom: 1px solid rgba(16, 22, 38, .22);
      }
      .proof-strip > :last-child {
        border-bottom: 0;
      }
      .masthead {
        grid-template-columns: 1fr;
        min-height: auto;
        gap: 16px;
        padding: 18px;
      }
      .hero-copy {
        order: 1;
      }
      .hero-ticket {
        order: 2;
      }
      .masthead::before {
        background: linear-gradient(180deg, rgba(255, 241, 95, .9) 0 42%, rgba(255, 241, 95, .7) 64%, rgba(255, 241, 95, .22) 100%);
      }
      .hero-bg {
        object-position: 72% top;
        opacity: .1;
      }
      h1 {
        font-size: clamp(32px, 9.2vw, 44px);
        line-height: 1.02;
      }
      .lede {
        font-size: clamp(15px, 4.35vw, 18px);
        line-height: 1.36;
        margin-top: 12px;
      }
      .hero-ticket h2 {
        font-size: clamp(23px, 7.1vw, 30px);
        line-height: 1.04;
      }
      .hero-ticket p:not(.eyebrow) {
        display: none;
      }
      .hero-ticket .actions {
        margin-top: 12px;
      }
      .links {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .logo-row {
        align-items: flex-start;
        flex-direction: column;
        min-height: 0;
      }
      .logo-row img {
        display: none;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        scroll-behavior: auto;
        transition-duration: .001ms;
      }
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="masthead">
      <img class="hero-bg" src="${escapeAttr(heroIllustration)}" alt="" loading="eager">
      <div class="hero-copy">
        <p class="eyebrow">Site-O-Mattic demo catalog</p>
        <h1>Real WordPress demos, ready to launch.</h1>
        <p class="lede">Pick a niche, open the live site, and show the Blueprint behind it.</p>
        <div class="actions">
          <a class="button primary" href="${escapeAttr(featured.playgroundUrl)}" aria-label="Open ${escapeAttr(featured.name)} in WordPress Playground">Open featured demo</a>
          <a class="button" href="#catalog">Browse demos</a>
        </div>
      </div>
      <aside class="hero-ticket" aria-label="Featured demo">
        <a class="ticket-shot-link" href="${escapeAttr(featured.playgroundUrl)}" aria-label="Open ${escapeAttr(featured.name)} in WordPress Playground">
          <img class="ticket-shot" src="${escapeAttr(featuredImage)}" alt="Screenshot of the featured ${escapeAttr(featured.name)} demo" loading="eager">
        </a>
        <p class="eyebrow">Featured demo</p>
        <h2>${escapeHtml(featured.name)}</h2>
        <p>${escapeHtml(featured.summary)}</p>
        <div class="actions">
          <a class="button primary" href="${escapeAttr(featured.playgroundUrl)}" aria-label="Launch ${escapeAttr(featured.name)} in WordPress Playground">Launch Playground</a>
        </div>
      </aside>
    </header>

    <section class="proof-strip" aria-labelledby="proof-heading">
      <article><h2 id="proof-heading">${items.length} demos</h2><p>Every card starts with the rendered site.</p></article>
      <article><h3>${approvedCount} approved</h3><p>Specs and downloads are tucked behind each card.</p></article>
      <article><h3>${escapeHtml(sweepStat)} sweep</h3><p>Visual, accessibility, and editor checks stay in the loop.</p></article>
    </section>

    <section class="toolbar" id="catalog" aria-labelledby="catalog-heading">
      <h2 id="catalog-heading">Choose a demo.</h2>
      <a href="${escapeAttr(repoBase)}">Repository</a>
    </section>

    <section class="grid" aria-label="Demo catalog cards">
${items.map((item, index) => renderCard(item, index)).join("\n")}
    </section>
    <footer>
      Generated ${escapeHtml(generatedAt)} from ${escapeHtml(repository)} on ${escapeHtml(branch)}.
    </footer>
  </main>
</body>
</html>
`;
}

function renderCard(item) {
  return `      <article class="card" aria-labelledby="card-${escapeAttr(item.slug)}-title">
        <a class="card-preview" href="${escapeAttr(item.playgroundUrl)}" aria-label="Open ${escapeAttr(item.name)} in WordPress Playground" style="background-image: url('${escapeAttr(item.screenshotUrl)}')">
          <img src="${escapeAttr(item.screenshotUrl)}" alt="Screenshot preview of the ${escapeAttr(item.name)} demo site" loading="lazy" decoding="async">
        </a>
        <div class="content">
          <div class="logo-row">
            <img src="${escapeAttr(item.logoUrl)}" alt="${escapeAttr(item.name)} logo" loading="lazy" decoding="async">
          </div>
          <p class="card-meta">${escapeHtml(item.niche)} demo</p>
          <h2 id="card-${escapeAttr(item.slug)}-title">${escapeHtml(item.name)}</h2>
          <p class="card-summary">${escapeHtml(item.summary)}</p>
          <a class="card-launch" href="${escapeAttr(item.playgroundUrl)}" aria-label="Launch ${escapeAttr(item.name)} in WordPress Playground">Launch Playground</a>
          <details class="artifact-links">
            <summary>Specs and downloads</summary>
            <div class="links" role="group" aria-label="${escapeAttr(item.name)} artifacts">
              <a href="${escapeAttr(item.blueprintUrl)}" aria-label="Open ${escapeAttr(item.name)} Blueprint JSON">JSON</a>
              <a href="${escapeAttr(item.zipUrl)}" aria-label="Download ${escapeAttr(item.name)} Blueprint ZIP">ZIP</a>
              <a href="${escapeAttr(item.specUrl)}" aria-label="Open ${escapeAttr(item.name)} production spec">Spec</a>
              <a href="${escapeAttr(item.readmeUrl)}" aria-label="Open ${escapeAttr(item.name)} README">README</a>
            </div>
          </details>
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
