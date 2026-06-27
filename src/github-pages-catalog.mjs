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
await prepareFeaturedPreview(featuredCard);
await fs.writeFile(pagePath, renderPage(cards, featuredCard));

console.log(`Wrote ${pagePath} with ${cards.length} Blueprint links.`);

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
  const featuredImage = featured.desktopPreview || featured.heroUrl;
  const featuredMobile = featured.mobilePreview || "";
  const tasteQueue = renderTasteQueue(items);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Site-O-Mattic Blueprint Catalog</title>
  <meta name="description" content="Latest Site-O-Mattic Blueprint previews, Playground links, JSON files, and ZIP downloads.">
  <style>
    :root {
      color-scheme: light;
      --ink: #172129;
      --muted: #60707a;
      --paper: #f7f4ee;
      --surface: #fffdf8;
      --line: #ddd5c8;
      --field: #e8efe9;
      --action: #d98032;
      --action-ink: #fffaf1;
      --green: #176f77;
      --plum: #463350;
      --shadow: 0 16px 38px rgba(23, 33, 41, .11);
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      background:
        linear-gradient(180deg, rgba(232, 239, 233, .92), rgba(247, 244, 238, 0) 340px),
        var(--paper);
      color: var(--ink);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }
    a {
      color: inherit;
    }
    .page {
      width: min(1360px, calc(100% - 32px));
      margin: 0 auto;
      padding: 24px 0 46px;
    }
    .masthead {
      display: grid;
      gap: 20px;
      grid-template-columns: minmax(0, 1fr) minmax(300px, .72fr);
      align-items: center;
      padding: 0 0 18px;
      border-bottom: 1px solid rgba(23, 33, 41, .14);
    }
    .eyebrow {
      margin: 0 0 8px;
      color: #8f4218;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0;
      text-transform: uppercase;
    }
    h1 {
      max-width: 720px;
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(32px, 4.5vw, 58px);
      font-weight: 650;
      line-height: 1.01;
      letter-spacing: 0;
    }
    .lede {
      max-width: 720px;
      margin: 14px 0 0;
      color: var(--muted);
      font-size: 17px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    .stat {
      padding: 12px;
      border: 1px solid rgba(23, 33, 41, .14);
      border-radius: 8px;
      background: rgba(255, 253, 248, .68);
    }
    .stat strong {
      display: block;
      font-size: 28px;
      line-height: 1;
    }
    .stat span {
      display: block;
      margin-top: 6px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .latest {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(300px, .64fr);
      gap: 22px;
      align-items: center;
      margin: 22px 0;
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      box-shadow: var(--shadow);
    }
    .latest-preview {
      position: relative;
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(96px, 18%);
      gap: 10px;
      align-items: end;
      text-decoration: none;
    }
    .latest-preview img {
      display: block;
      width: 100%;
      object-fit: cover;
      border-radius: 6px;
      background: var(--field);
    }
    .desktop-shot {
      aspect-ratio: 16 / 9;
      object-position: top center;
    }
    .mobile-shot {
      aspect-ratio: 9 / 16;
      object-position: top center;
      border: 1px solid var(--line);
      box-shadow: 0 12px 30px rgba(0, 0, 0, .14);
    }
    .latest h2,
    .card h2 {
      margin: 0;
      font-size: 23px;
      line-height: 1.08;
      letter-spacing: 0;
    }
    .latest p,
    .card p {
      margin: 10px 0 0;
      color: var(--muted);
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
      min-height: 40px;
      padding: 10px 14px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--surface);
      color: var(--ink);
      font-size: 14px;
      font-weight: 800;
      line-height: 1.1;
      text-decoration: none;
    }
    .button.primary {
      border-color: transparent;
      background: var(--ink);
      color: var(--surface);
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
      font-size: 22px;
    }
    .toolbar a {
      color: var(--muted);
      font-size: 14px;
      font-weight: 700;
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
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      box-shadow: 0 10px 28px rgba(23, 33, 41, .08);
    }
    .card-preview {
      display: block;
      overflow: hidden;
      aspect-ratio: 36 / 25;
      border-bottom: 1px solid rgba(23, 33, 41, .12);
      background: var(--field);
      text-decoration: none;
    }
    .card-preview img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top center;
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
      border-radius: 6px;
      background: var(--field);
      color: var(--muted);
      font-size: 12px;
      font-weight: 800;
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
      border: 1px solid var(--line);
      border-radius: 6px;
      color: var(--muted);
      font-size: 11px;
      font-weight: 800;
      line-height: 1.1;
    }
    .taste-queue {
      margin: 18px 0 8px;
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
      border: 1px solid var(--line);
      border-radius: 6px;
      color: var(--ink);
      font-size: 13px;
      font-weight: 800;
      text-align: center;
      text-decoration: none;
    }
    .links a:first-child {
      grid-column: 1 / -1;
      border-color: transparent;
      background: var(--green);
      color: var(--surface);
    }
    footer {
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid var(--line);
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
      .grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 620px) {
      .page {
        width: min(100% - 24px, 1360px);
        padding-top: 24px;
      }
      .stats,
      .grid {
        grid-template-columns: 1fr;
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
        display: none!important;
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
  </style>
</head>
<body>
  <main class="page">
    <header class="masthead">
      <div>
        <p class="eyebrow">Site-O-Mattic</p>
        <h1>${items.length} Playground-ready local service sites.</h1>
        <p class="lede">Browse the latest Site-O-Mattic previews, open each Blueprint in WordPress Playground, or inspect the JSON, ZIP, and production spec behind it.</p>
      </div>
      <div class="stats" aria-label="Catalog counts">
        <div class="stat"><strong>${items.length}</strong><span>Blueprints</span></div>
        <div class="stat"><strong>${approvedCount}</strong><span>Approved</span></div>
        <div class="stat"><strong>${escapeHtml(sweepStat)}</strong><span>Sweep OK</span></div>
        <div class="stat"><strong>${escapeHtml(branch)}</strong><span>Branch</span></div>
      </div>
    </header>

    ${tasteQueue}

    <section class="latest" aria-labelledby="featured-heading">
      <a class="latest-preview" href="${escapeAttr(featured.playgroundUrl)}" aria-label="Open ${escapeAttr(featured.name)} in WordPress Playground">
        <img class="desktop-shot" src="${escapeAttr(featuredImage)}" alt="${escapeAttr(featured.name)} desktop preview" loading="eager">
        ${featuredMobile ? `<img class="mobile-shot" src="${escapeAttr(featuredMobile)}" alt="${escapeAttr(featured.name)} mobile preview" loading="eager">` : ""}
      </a>
      <div>
        <p class="eyebrow">Latest checked preview</p>
        <h2 id="featured-heading">${escapeHtml(featured.name)}</h2>
        <p>${escapeHtml(featured.summary)}</p>
        <div class="actions">
          <a class="button primary" href="${escapeAttr(featured.playgroundUrl)}">Open Playground</a>
          <a class="button" href="${escapeAttr(featured.blueprintUrl)}">Blueprint JSON</a>
          <a class="button" href="${escapeAttr(featured.zipUrl)}">Download ZIP</a>
        </div>
      </div>
    </section>

    <div class="toolbar">
      <h2>Blueprints</h2>
      <a href="${escapeAttr(repoBase)}">GitHub repository</a>
    </div>

    <section class="grid" aria-label="Blueprint catalog">
${items.map(renderCard).join("\n")}
    </section>

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

  return `<section class="signals taste-queue" aria-label="Taste queue">
${signals.map(renderSignal).join("\n")}
    </section>`;
}

function renderSignal(signal) {
  const title = signal.title ? ` title="${escapeAttr(signal.title)}"` : "";
  return `      <span class="signal"${title}>${escapeHtml(signal.text)}</span>`;
}

function renderCard(item) {
  const signals = item.reviewSignals.length
    ? `<div class="signals">${item.reviewSignals.map((signal) => `<span class="signal">${escapeHtml(signal)}</span>`).join("")}</div>`
    : "";
  return `      <article class="card">
        <a class="card-preview" href="${escapeAttr(item.playgroundUrl)}" aria-label="Open ${escapeAttr(item.name)} in WordPress Playground">
          <img src="${escapeAttr(item.screenshotUrl)}" alt="${escapeAttr(item.name)} screenshot preview" loading="lazy">
        </a>
        <div class="content">
          <div class="logo-row">
            <img src="${escapeAttr(item.logoUrl)}" alt="${escapeAttr(item.name)} logo" loading="lazy">
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
            <a href="${escapeAttr(item.playgroundUrl)}">Playground</a>
            <a href="${escapeAttr(item.blueprintUrl)}">JSON</a>
            <a href="${escapeAttr(item.zipUrl)}">ZIP</a>
            <a href="${escapeAttr(item.specUrl)}">Spec</a>
            <a href="${escapeAttr(item.readmeUrl)}">README</a>
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
