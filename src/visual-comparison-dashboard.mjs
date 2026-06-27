import fs from "node:fs/promises";
import path from "node:path";
import {
  extractGlobalStyles,
  extractLayoutSignature,
  getRunPhpStep,
  readBlueprint
} from "./blueprint-inspect.mjs";
import { blueprintDirForSpec, blueprintPathForSpec, readSpec, specTargets } from "./spec-utils.mjs";

const args = process.argv.slice(2);
const input = valueAfter(args, "--input") || process.env.VISUAL_SWEEP_REPORT || "";
const outputDir = valueAfter(args, "--out") || "qa/reports";
const targets = await specTargets(args.filter((arg, index) => !["--input", "--out"].includes(arg) && !["--input", "--out"].includes(args[index - 1])));

await fs.mkdir(outputDir, { recursive: true });

const sweep = input ? await readJsonIfExists(input) : null;
const reports = await Promise.all(targets.map((target) => inspectSpec(target, sweep)));
const nearest = nearestByStructure(reports);
const dashboard = {
  version: 1,
  total: reports.length,
  source: sweep ? input : "structural-blueprint-signatures",
  nearest,
  reports: reports.map((report) => ({
    slug: report.slug,
    name: report.name,
    layoutVariant: report.layoutVariant,
    signature: report.signature,
    notes: report.notes,
    tasteWarnings: report.tasteWarnings,
    nearest: nearest.filter((item) => item.left === report.slug || item.right === report.slug).slice(0, 3)
  }))
};

await fs.writeFile(path.join(outputDir, "visual-comparison-dashboard.json"), `${JSON.stringify(dashboard, null, 2)}\n`);
await fs.writeFile(path.join(outputDir, "visual-comparison-dashboard.html"), buildHtml(reports, nearest, sweep));

console.log(`Visual comparison dashboard written to ${path.join(outputDir, "visual-comparison-dashboard.html")}`);
console.log(`Visual comparison data written to ${path.join(outputDir, "visual-comparison-dashboard.json")}`);

async function inspectSpec(target, sweep) {
  const spec = await readSpec(target);
  const blueprint = await readBlueprint(blueprintPathForSpec(spec));
  const phpStep = getRunPhpStep(blueprint);
  const signature = phpStep ? extractLayoutSignature(phpStep.code) : {};
  const globalStyles = phpStep ? extractGlobalStyles(phpStep.code) : {};
  const sweepReport = sweep?.reports?.find((report) => report.slug === spec.slug);
  const manifest = await readJsonIfExists(path.join(blueprintDirForSpec(spec), "asset-manifest.json"));

  return {
    slug: spec.slug,
    name: spec.businessName,
    niche: spec.niche,
    specPath: target,
    layoutVariant: spec.layoutVariant,
    signature,
    palette: paletteFingerprint(globalStyles),
    heroImage: screenshotOrAsset(spec, sweepReport, "desktop", manifest),
    mobileImage: screenshotOrAsset(spec, sweepReport, "mobile-390", manifest),
    notes: buildVisualNotes(spec, signature, sweepReport),
    failures: sweepReport?.failures || [],
    tasteWarnings: sweepReport?.tasteWarnings || []
  };
}

function screenshotOrAsset(spec, sweepReport, scenarioName, manifest) {
  const scenario = sweepReport?.scenarios?.find((item) => item.name === scenarioName);
  if (scenario?.screenshot) {
    return path.relative("qa/reports", scenario.screenshot);
  }
  const assetPath = path.join("public", "blueprints", spec.slug, manifest?.assets?.hero?.outputPath || "/assets/hero.jpg");
  return path.relative("qa/reports", assetPath);
}

function nearestByStructure(reports) {
  const pairs = [];
  for (let left = 0; left < reports.length; left += 1) {
    for (let right = left + 1; right < reports.length; right += 1) {
      pairs.push({
        left: reports[left].slug,
        right: reports[right].slug,
        distance: structuralDistance(reports[left], reports[right])
      });
    }
  }
  return pairs.sort((left, right) => left.distance - right.distance).slice(0, Math.min(60, pairs.length));
}

function structuralDistance(left, right) {
  let distance = 0;
  const fields = [
    "renderFamily",
    "hero",
    "navigationTreatment",
    "typographyTreatment",
    "colorStrategy",
    "silhouette",
    "navigationPrimitive",
    "mobileActionPattern",
    "imageRole",
    "surfaceFamily",
    "styleFamily",
    "density",
    "servicePresentation",
    "proofTreatment",
    "ctaRhythm"
  ];
  for (const field of fields) {
    distance += left.signature?.[field] === right.signature?.[field] ? 0 : 18;
  }
  distance += left.palette === right.palette ? 0 : 24;
  distance += Math.round((1 - jaccard(left.signature?.sectionOrder || [], right.signature?.sectionOrder || [])) * 60);
  distance += Math.round((1 - jaccard(left.signature?.componentClassesExpected || [], right.signature?.componentClassesExpected || [])) * 60);
  return distance;
}

function buildVisualNotes(spec, signature, sweepReport) {
  const failures = sweepReport?.failures || [];
  const tasteWarnings = sweepReport?.tasteWarnings || [];
  const notes = [
    `Works: ${signature?.visualDifferentiator || spec.brandBrief?.signatureMove || "signature move"} should separate this from nearby patterns.`,
    `Proof: ${spec.brandBrief?.imageProof || spec.pattern?.imageEvidence || "hero evidence"} carries the niche-specific read.`,
    `Watch: compare ${signature?.renderFamily || spec.layoutVariant} neighbors for hero geometry, CTA rhythm, and proof treatment.`
  ];
  if (failures.length) {
    notes.push(`Fix next: ${failures.join("; ")}`);
  } else if (tasteWarnings.length) {
    notes.push(`Taste next: ${tasteWarnings.join("; ")}`);
  } else {
    notes.push("Fix next: no mechanical visual-sweep failures; judge taste from first viewport screenshots.");
  }
  return notes;
}

function buildHtml(reports, nearest, sweep) {
  const cards = reports.map((report) => {
    const near = nearest
      .filter((item) => item.left === report.slug || item.right === report.slug)
      .slice(0, 3)
      .map((item) => {
        const other = item.left === report.slug ? item.right : item.left;
        return `<li><strong>${escapeHtml(other)}</strong><span>${item.distance}</span></li>`;
      }).join("");
    return `
      <article>
        <header>
          <div>
            <p>${escapeHtml(report.layoutVariant)}</p>
            <h2>${escapeHtml(report.name)}</h2>
          </div>
          <span>${report.failures.length ? "Review" : report.tasteWarnings.length ? "Taste" : "OK"}</span>
        </header>
        <div class="shots">
          <img src="${escapeHtml(report.heroImage)}" alt="${escapeHtml(report.name)} desktop or hero">
          <img src="${escapeHtml(report.mobileImage)}" alt="${escapeHtml(report.name)} mobile or hero">
        </div>
        <section class="notes">
          ${report.notes.map((note) => `<p>${escapeHtml(note)}</p>`).join("")}
        </section>
        <section>
          <h3>Nearest structural neighbors</h3>
          <ul>${near}</ul>
        </section>
      </article>`;
  }).join("\n");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Site-O-Mattic Visual Comparison Dashboard</title>
  <style>
    *{box-sizing:border-box}
    body{margin:0;background:#111315;color:#f4f1ea;font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    main{padding:28px}
    h1{margin:0 0 6px;font-size:34px}
    .meta{margin:0 0 24px;color:#aeb6b2}
    .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
    article{background:#1b1f21;border:1px solid #333a3d;border-radius:8px;overflow:hidden}
    header{display:flex;justify-content:space-between;gap:16px;align-items:start;padding:16px 18px;border-bottom:1px solid #333a3d}
    header p{margin:0 0 4px;color:#aeb6b2;font-size:12px;text-transform:uppercase;font-weight:800}
    h2{margin:0;font-size:22px}
    header span{background:#27332c;color:#8ff0a4;border-radius:999px;padding:4px 10px;font-weight:800}
    .shots{display:grid;grid-template-columns:1.4fr .7fr;gap:10px;padding:10px;background:#101214}
    img{width:100%;height:250px;object-fit:cover;object-position:top center;border-radius:6px;background:#050606}
    .shots img + img{height:250px}
    section{padding:14px 18px;border-top:1px solid #333a3d}
    .notes p{margin:0 0 8px;color:#e6e1d8}
    h3{margin:0 0 10px;font-size:13px;text-transform:uppercase;color:#aeb6b2}
    ul{display:grid;gap:7px;margin:0;padding:0;list-style:none}
    li{display:flex;justify-content:space-between;gap:12px;color:#dad4ca}
    li span{color:#f4bf5f;font-weight:800}
  </style>
</head>
<body>
  <main>
    <h1>Site-O-Mattic Visual Comparison Dashboard</h1>
    <p class="meta">Source: ${escapeHtml(sweep ? "visual sweep screenshots" : "structural blueprint signatures")}.</p>
    <section class="grid">${cards}</section>
  </main>
</body>
</html>
`;
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

function paletteFingerprint(globalStyles) {
  return (globalStyles?.settings?.color?.palette || [])
    .map((item) => `${item.slug}:${String(item.color).toLowerCase()}`)
    .join("|") || "missing";
}

function jaccard(left, right) {
  const a = new Set(left);
  const b = new Set(right);
  const union = new Set([...a, ...b]);
  if (!union.size) {
    return 1;
  }
  let intersection = 0;
  for (const value of a) {
    if (b.has(value)) {
      intersection += 1;
    }
  }
  return intersection / union.size;
}

function valueAfter(args, flag) {
  const index = args.indexOf(flag);
  return index === -1 ? "" : args[index + 1] || "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
