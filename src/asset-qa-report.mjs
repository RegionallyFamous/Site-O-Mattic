import fs from "node:fs/promises";
import path from "node:path";
import { extractPageContent, getRunPhpStep, readBlueprint } from "./blueprint-inspect.mjs";
import { imageInfo } from "./image-size.mjs";
import { blueprintPathForSpec, readSpec, specTargets } from "./spec-utils.mjs";

const targets = await specTargets(process.argv.slice(2));
let hasFailures = false;

for (const target of targets) {
  const spec = await readSpec(target);
  const report = await inspectAssets(spec);
  printReport(target, report);
  if (report.checks.some((check) => !check.passed)) {
    hasFailures = true;
  }
}

if (hasFailures) {
  process.exit(1);
}

async function inspectAssets(spec) {
  const checks = [];
  const hero = await imageInfo(spec.assets.hero);
  const logo = await imageInfo(spec.assets.logo);
  const favicon = await imageInfo(spec.assets.favicon);
  const promptPath = path.join(path.dirname(spec.assets.hero), "hero-prompt.md");
  const prompt = await fs.readFile(promptPath, "utf8").catch(() => "");
  const blueprint = await readBlueprint(blueprintPathForSpec(spec)).catch(() => null);
  const phpStep = blueprint ? getRunPhpStep(blueprint) : null;
  const pageContent = phpStep ? extractPageContent(phpStep.code) : "";
  const siteLogoWidth = siteLogoWidthFromMarkup(pageContent);

  add(checks, "hero landscape crop", hero.width / hero.height >= 1.45 && hero.width / hero.height <= 2.2, `${hero.width}x${hero.height}`);
  add(checks, "hero proves niche", heroProofPass(spec, prompt), spec.pattern?.imageEvidence || spec.assetMeta?.hero?.alt || "missing image proof");
  add(checks, "hero alt specificity", specificText(spec.assetMeta?.hero?.alt, 70), spec.assetMeta?.hero?.alt || "missing alt text");
  add(checks, "hero prompt specificity", specificText(prompt, 180), `${promptPath} (${prompt.length} chars)`);
  add(checks, "logo wide wordmark scale", logo.width >= 900 && logo.height >= 180 && logo.width / logo.height >= 3, `${logo.width}x${logo.height}`);
  add(checks, "site-logo rendered width", siteLogoWidth >= 220 && siteLogoWidth <= 260, siteLogoWidth ? `${siteLogoWidth}px` : "missing site-logo width");
  add(checks, "logo no tagline cue", !/\b(tagline|slogan|secondary text|small caption)\b/i.test(prompt), "Prompt should not ask for tagline-like logo text.");
  add(checks, "favicon square mark", favicon.width === favicon.height && favicon.width >= 256, `${favicon.width}x${favicon.height}`);
  add(checks, "favicon is not wordmark ratio", favicon.width / favicon.height <= 1.1, `${favicon.width}x${favicon.height}`);
  add(checks, "asset formats", [hero.extension, logo.extension, favicon.extension].every((extension) => [".jpg", ".jpeg", ".png"].includes(extension)), `${hero.extension}, ${logo.extension}, ${favicon.extension}`);

  return { checks };
}

function heroProofPass(spec, prompt) {
  const evidence = `${spec.pattern?.imageEvidence || ""} ${spec.assetMeta?.hero?.alt || ""} ${prompt}`;
  const nicheWords = significantWords(spec.niche);
  return specificText(evidence, 90)
    && nicheWords.some((word) => evidence.toLowerCase().includes(word));
}

function specificText(value, minLength) {
  const text = String(value || "");
  return text.trim().length >= minLength && significantWords(text).length >= 8;
}

function siteLogoWidthFromMarkup(markup) {
  const match = markup.match(/<!-- wp:site-logo \{"width":([0-9]+)/);
  return match ? Number(match[1]) : NaN;
}

function significantWords(value) {
  const stop = new Set(["with", "that", "this", "from", "your", "into", "real", "proof", "service", "image", "evidence", "hero", "logo", "favicon"]);
  return String(value || "")
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.filter((word) => word.length > 3 && !stop.has(word)) || [];
}

function add(checks, name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), detail });
}

function printReport(target, report) {
  console.log(`\nAsset QA for ${target}`);
  for (const check of report.checks) {
    console.log(`- ${check.passed ? "OK" : "FAIL"} ${check.name}: ${check.detail}`);
  }
}
