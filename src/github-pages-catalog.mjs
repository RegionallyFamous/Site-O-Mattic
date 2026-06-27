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
  const reviewItem = reviewItemsBySlug.get(spec.slug);

  cards.push({
    slug: spec.slug,
    name: spec.businessName,
    niche: titleCase(spec.niche),
    summary: summarize(spec.copy?.heroText || ""),
    status: spec.release?.status || "draft",
    variant: spec.layoutVariant,
    heroUrl,
    logoUrl,
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
  const tasteQueue = renderTasteQueue();

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
      --ink: #151916;
      --muted: #56635b;
      --paper: #f5f7f2;
      --surface: #ffffff;
      --line: #d7dfd3;
      --field: #e8efe5;
      --action: #e79005;
      --action-ink: #1b1208;
      --green: #1f6b4a;
      --shadow: 0 18px 45px rgba(27, 54, 38, .12);
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      background: var(--paper);
      color: var(--ink);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }
    a {
      color: inherit;
    }
    .page {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
      padding: 34px 0 52px;
    }
    .masthead {
      display: grid;
      gap: 18px;
      grid-template-columns: minmax(0, 1.1fr) minmax(280px, .9fr);
      align-items: end;
      padding: 0 0 28px;
      border-bottom: 1px solid var(--line);
    }
    .eyebrow {
      margin: 0 0 8px;
      color: var(--green);
      font-size: 13px;
      font-weight: 800;
      letter-spacing: .04em;
      text-transform: uppercase;
    }
    h1 {
      max-width: 760px;
      margin: 0;
      font-size: clamp(34px, 5vw, 64px);
      line-height: .96;
      letter-spacing: 0;
    }
    .lede {
      max-width: 720px;
      margin: 18px 0 0;
      color: var(--muted);
      font-size: 18px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    .stat {
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(255, 255, 255, .48);
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
      margin: 28px 0;
      padding: 18px;
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
      font-size: 24px;
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
      border-radius: 999px;
      background: var(--surface);
      color: var(--ink);
      font-size: 14px;
      font-weight: 800;
      line-height: 1.1;
      text-decoration: none;
    }
    .button.primary {
      border-color: transparent;
      background: var(--action);
      color: var(--action-ink);
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
      margin: 28px 0 16px;
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
      gap: 12px;
    }
    .card {
      display: flex;
      flex-direction: column;
      min-width: 0;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
    }
    .content {
      display: flex;
      flex: 1;
      flex-direction: column;
      padding: 16px;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 10px;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 4px 8px;
      border-radius: 999px;
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
      border-radius: 999px;
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
      background: var(--ink);
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
      .grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 620px) {
      .page {
        width: min(100% - 24px, 1180px);
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
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="masthead">
      <div>
        <p class="eyebrow">Site-O-Mattic</p>
        <h1>Blueprint previews for local service site experiments.</h1>
        <p class="lede">A quick catalog of the latest generated WordPress Playground Blueprints, with preview images, source JSON, ZIP downloads, and spec links.</p>
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
      <h2>All Blueprint Links</h2>
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

function renderTasteQueue() {
  const warnings = (reviewEvidence?.items || [])
    .filter((item) => item.tasteWarnings?.length)
    .slice(0, 3);
  const nearest = (comparisonDashboard?.nearest || reviewEvidence?.nearestNeighbors || [])
    .slice(0, warnings.length ? 3 : 5);
  const warningCount = Number(reviewEvidence?.tasteWarningCount || 0);
  const signals = [
    { text: "Taste queue" },
    { text: `${warningCount} warnings` },
    ...warnings.map((item) => ({
      text: `${shortSlug(item.slug)} ${tasteSignalFor(item.tasteWarnings)}`,
      title: (item.tasteWarnings || []).map((warning) => typeof warning === "string" ? warning : warning?.message || warning?.reason || "").filter(Boolean).join(" | ")
    })),
    ...nearest.map((pair) => ({
      text: `${shortSlug(pair.left)} <-> ${shortSlug(pair.right)} ${pair.distance}`,
      title: pairTasteTitle(pair)
    }))
  ].filter((item) => item.text);

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
        <div class="content">
          <div class="meta">
            <span class="pill">${escapeHtml(item.status)}</span>
            <span class="pill">${escapeHtml(item.variant)}</span>
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

function shortSlug(value) {
  return shortSignal(String(value || "").replace(/-/g, " "), 24);
}

function reviewSignalsFor(spec, reviewItem) {
  const signals = [];
  if (reviewItem) {
    signals.push(reviewItem.status === "ok" ? "OK sweep" : `${reviewItem.failures?.length || 1} issues`);
    if (reviewItem.tasteWarnings?.length) {
      signals.push(tasteSignalFor(reviewItem.tasteWarnings));
    }
    const scenario = reviewItem.scenarios?.find((item) => item.name === "desktop")
      || reviewItem.scenarios?.find((item) => item.name?.startsWith("mobile"))
      || reviewItem.scenarios?.[0];
    const ctaSignal = spec.copy?.primaryCta || scenario?.firstViewportExpectedCtaText || scenario?.firstViewportCtaText;
    if (ctaSignal) {
      signals.push(`CTA: ${shortSignal(ctaSignal, 22)}`);
    }
  } else {
    signals.push("No sweep");
  }
  signals.push(shortSignal(reviewItem?.silhouette || spec.pattern?.silhouette || spec.layoutVariant, 28));
  const nearest = nearestNeighborFor(spec.slug);
  if (nearest) {
    signals.push(`Near ${shortSignal(nearest.slug, 18)} ${nearest.distance}`);
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

function nearestNeighborFor(slug) {
  const dashboardReport = comparisonDashboard?.reports?.find((item) => item.slug === slug);
  const dashboardNearest = dashboardReport?.nearest?.[0];
  if (dashboardNearest) {
    const other = dashboardNearest.left === slug ? dashboardNearest.right : dashboardNearest.left;
    return { slug: other, distance: dashboardNearest.distance };
  }
  const sweepNearest = reviewEvidence?.nearestNeighbors?.find((item) => item.left === slug || item.right === slug);
  if (!sweepNearest) {
    return null;
  }
  return {
    slug: sweepNearest.left === slug ? sweepNearest.right : sweepNearest.left,
    distance: sweepNearest.distance
  };
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
