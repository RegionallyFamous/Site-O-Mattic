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
  const favicon = await imageInfo(spec.assets.favicon);
  const promptPath = path.join(path.dirname(spec.assets.hero), "hero-prompt.md");
  const prompt = await fs.readFile(promptPath, "utf8").catch(() => "");
  const artPrompt = promptWithoutSharedContract(prompt);
  const blueprint = await readBlueprint(blueprintPathForSpec(spec)).catch(() => null);
  const phpStep = blueprint ? getRunPhpStep(blueprint) : null;
  const pageContent = phpStep ? extractPageContent(phpStep.code) : "";
  const hasTextBrand = textBrandPresentFromMarkup(pageContent, spec);

  add(checks, "hero landscape crop", hero.width / hero.height >= 1.45 && hero.width / hero.height <= 2.2, `${hero.width}x${hero.height}`);
  add(checks, "hero proves niche", heroProofPass(spec, prompt), spec.pattern?.imageEvidence || spec.assetMeta?.hero?.alt || "missing image proof");
  add(checks, "hero alt specificity", specificText(spec.assetMeta?.hero?.alt, 70), spec.assetMeta?.hero?.alt || "missing alt text");
  add(checks, "hero prompt specificity", specificText(artPrompt, 180), `${promptPath} (${artPrompt.length} unique chars)`);
  add(checks, "hero prompt art direction", heroArtDirectionPass(artPrompt), heroArtDirectionDetail(artPrompt));
  add(checks, "hero image style contract", heroImageStyleContractPass(prompt), heroImageStyleContractDetail(prompt));
  add(checks, "hero role/evidence alignment", heroRoleAlignmentPass(spec, prompt), `${spec.pattern?.imageRole || "missing role"} / ${spec.pattern?.imageEvidence || "missing evidence"}`);
  add(checks, "hero anti-artifact prompts", heroAntiArtifactPass(prompt), heroAntiArtifactDetail(prompt));
  add(checks, "text brand rendered", hasTextBrand, hasTextBrand ? spec.businessName : "Missing som-text-logo brand text.");
  add(checks, "no site-logo block", !pageContent.includes("wp:site-logo"), "Generated page should not contain core/site-logo.");
  add(checks, "no logo payload", !phpStep?.code.includes("\"logo\":"), "Generated Blueprint should not embed an unused logo asset.");
  add(checks, "favicon square mark", favicon.width === favicon.height && favicon.width >= 256, `${favicon.width}x${favicon.height}`);
  add(checks, "favicon is not wordmark ratio", favicon.width / favicon.height <= 1.1, `${favicon.width}x${favicon.height}`);
  add(checks, "asset formats", [hero.extension, favicon.extension].every((extension) => [".jpg", ".jpeg", ".png"].includes(extension)), `${hero.extension}, ${favicon.extension}`);

  return { checks };
}

function heroProofPass(spec, prompt) {
  const evidence = `${spec.pattern?.imageEvidence || ""} ${spec.assetMeta?.hero?.alt || ""} ${prompt}`;
  const nicheWords = significantWords(spec.niche);
  return specificText(evidence, 90)
    && nicheWords.some((word) => evidence.toLowerCase().includes(word));
}

function promptWithoutSharedContract(prompt) {
  return String(prompt || "").split(/##\s+Site-O-Mattic Image Style Contract/i)[0].trim();
}

function heroArtDirectionPass(prompt) {
  return heroArtDirectionGroups(prompt).every((group) => group.present);
}

function heroArtDirectionDetail(prompt) {
  const groups = heroArtDirectionGroups(prompt);
  const present = groups.filter((group) => group.present).length;
  const missing = groups.filter((group) => !group.present).map((group) => group.label);
  return missing.length ? `${present}/${groups.length} ingredients; missing ${missing.join(", ")}` : "specific scene, proof, crop, light, materials, and negatives present";
}

function heroArtDirectionGroups(prompt) {
  const text = normalize(prompt);
  return [
    {
      label: "service moment",
      present: hasAny(text, ["service", "technician", "specialist", "attendant", "stylist", "consultant", "photographer", "florist", "mechanic", "cleaner", "installer", "artist", "operator", "caterer", "barista", "working", "arranging", "cleaning", "installing", "preparing", "painting", "tuning", "using"])
    },
    {
      label: "visible proof/outcome",
      present: hasAny(text, ["visible", "proof", "outcome", "finished", "clean", "before-and-after", "organized", "guest-ready", "setup", "result", "contrast", "evidence", "in use"])
    },
    {
      label: "believable environment",
      present: hasAny(text, ["home", "house", "driveway", "garage", "room", "kitchen", "studio", "workshop", "event", "venue", "backyard", "street", "neighborhood", "suburban", "office", "outdoor", "garden", "pool", "roofline", "cart"])
    },
    {
      label: "composition/crop",
      present: hasAny(text, ["16:9", "wide", "landscape", "composition", "framing", "crop", "hero", "left", "right", "foreground", "background", "camera angle"])
    },
    {
      label: "copy-safe negative space",
      present: hasAny(text, ["negative space", "copy", "headline", "overlay", "readable space", "empty space"])
    },
    {
      label: "lighting/mood",
      present: hasAny(text, ["natural light", "morning light", "window light", "golden hour", "bright", "soft light", "warm", "crisp", "airy", "sunny", "ring light"])
    },
    {
      label: "tools/materials/textures",
      present: hasAny(text, ["tool", "tools", "materials", "textures", "hose", "wand", "ladder", "brush", "swatches", "fan deck", "props", "kiosk", "mixer", "speakers", "cart", "glassware", "flowers", "concrete", "wood", "fabric", "equipment", "toppings", "cable", "surface"])
    },
    {
      label: "artifact negatives",
      present: hasAny(text, ["no readable text", "no text", "no logos", "no logo", "no brand", "no watermark", "avoid readable text", "avoid logos"])
    }
  ];
}

function heroImageStyleContractPass(prompt) {
  const text = normalize(prompt);
  return hasAny(text, ["photorealistic", "realistic editorial", "editorial service photography", "documentary service photography"])
    && hasAny(text, ["premium local-service website hero", "polished local-business feel", "local-service website hero"])
    && hasAny(text, ["actual service", "real service moment", "visible outcome", "service evidence", "proof of the niche"])
    && hasAny(text, ["16:9", "wide horizontal", "landscape"])
    && hasAny(text, ["negative space", "copy-friendly", "headline overlay"]);
}

function heroImageStyleContractDetail(prompt) {
  const text = normalize(prompt);
  const missing = [];
  if (!hasAny(text, ["photorealistic", "realistic editorial", "editorial service photography", "documentary service photography"])) {
    missing.push("photographic style");
  }
  if (!hasAny(text, ["premium local-service website hero", "polished local-business feel", "local-service website hero"])) {
    missing.push("premium local-service use case");
  }
  if (!hasAny(text, ["actual service", "real service moment", "visible outcome", "service evidence", "proof of the niche"])) {
    missing.push("service proof");
  }
  if (!hasAny(text, ["16:9", "wide horizontal", "landscape"])) {
    missing.push("wide hero crop");
  }
  if (!hasAny(text, ["negative space", "copy-friendly", "headline overlay"])) {
    missing.push("copy-safe composition");
  }
  return missing.length ? `missing ${missing.join(", ")}` : "premium service-photo prompt contract present";
}

function heroRoleAlignmentPass(spec, prompt) {
  const role = spec.pattern?.imageRole;
  const evidence = normalize(`${spec.pattern?.imageEvidence || ""} ${spec.assetMeta?.hero?.alt || ""} ${prompt}`);
  const roleTerms = {
    "work-in-progress": ["work in progress", "working", "installing", "preparing", "cleaning", "tuning", "applying", "service moment", "adjusting", "garnishing", "painting", "soundcheck", "running", "using"],
    "finished-outcome": ["finished outcome", "finished result", "finished", "completed", "guest-ready", "clean result", "clean", "styled", "organized", "ready"],
    "process-closeup": ["process closeup", "close-up", "closeup", "hands", "tool", "bench", "materials", "detail"],
    "local-context": ["local context", "neighborhood", "suburban", "street", "curbside", "route", "home exterior"],
    "proof-collage": ["proof collage", "mosaic", "gallery", "multiple", "lookbook", "collage"],
    "operator-or-founder": ["operator", "founder", "consultant", "specialist", "owner", "technician", "photographer", "coach", "stylist"],
    "environment-context": ["environment context", "event room", "event space", "event station", "event corner", "venue", "outdoor", "outdoor station", "suburban home", "roofline", "guests", "setup visible", "service setup"]
  };

  return Array.isArray(roleTerms[role]) && hasAny(evidence, roleTerms[role]);
}

function heroAntiArtifactPass(prompt) {
  const text = normalize(prompt);
  return hasAny(text, ["no readable text", "no readable words"])
    && hasAny(text, ["no fake signage", "no extra signs with text", "no signage"])
    && hasAny(text, ["no visible brand names", "no brand logos", "no logos"])
    && hasAny(text, ["no watermarks", "no watermark"])
    && hasAny(text, ["no distorted hands", "natural hands", "clean anatomy"]);
}

function heroAntiArtifactDetail(prompt) {
  const text = normalize(prompt);
  const missing = [];
  if (!hasAny(text, ["no readable text", "no readable words"])) missing.push("no readable text");
  if (!hasAny(text, ["no fake signage", "no extra signs with text", "no signage"])) missing.push("no fake signage");
  if (!hasAny(text, ["no visible brand names", "no brand logos", "no logos"])) missing.push("no brand marks");
  if (!hasAny(text, ["no watermarks", "no watermark"])) missing.push("no watermarks");
  if (!hasAny(text, ["no distorted hands", "natural hands", "clean anatomy"])) missing.push("hands/anatomy guardrail");
  return missing.length ? `missing ${missing.join(", ")}` : "artifact and fake-text negatives present";
}

function specificText(value, minLength) {
  const text = String(value || "");
  return text.trim().length >= minLength && significantWords(text).length >= 8;
}

function textBrandPresentFromMarkup(markup, spec) {
  return String(markup || "").includes("som-text-logo")
    && String(markup || "").includes(escapeHtml(spec.businessName));
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function significantWords(value) {
  const stop = new Set(["with", "that", "this", "from", "your", "into", "real", "proof", "service", "image", "evidence", "hero", "logo", "favicon"]);
  return String(value || "")
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.filter((word) => word.length > 3 && !stop.has(word)) || [];
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[–—]/g, "-");
}

function hasAny(text, terms) {
  return terms.some((term) => text.includes(term));
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
