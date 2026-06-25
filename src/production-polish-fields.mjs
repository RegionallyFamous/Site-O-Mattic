import fs from "node:fs/promises";
import { renderFamilyForVariant } from "./layout-archetypes.mjs";
import { readSpec, specTargets } from "./spec-utils.mjs";

const REQUIRED_BRAND_BRIEF_FIELDS = [
  "mood",
  "trustCue",
  "accentBehavior",
  "imageProof",
  "signatureMove",
  "avoidLookingLike"
];

const REQUIRED_SERVICE_DETAIL_FIELDS = [
  "turnaround",
  "whatToSend",
  "prepNote",
  "serviceRhythm",
  "objectionAnswer"
];

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const targetArgs = args.filter((arg) => arg !== "--write");
  const targets = await specTargets(targetArgs);
  let hasFailures = false;

  for (const target of targets) {
    const spec = await readSpec(target);
    if (write) {
      spec.brandBrief = buildBrandBrief(spec);
      spec.serviceDetails = buildServiceDetails(spec);
      await fs.writeFile(target, `${JSON.stringify(spec, null, 2)}\n`);
      console.log(`Updated production polish fields for ${target}`);
      continue;
    }

    const errors = validateProductionPolishFields(spec);
    if (errors.length) {
      hasFailures = true;
      console.log(`Production polish fields failed for ${target}`);
      for (const error of errors) {
        console.log(`- ${error}`);
      }
    } else {
      console.log(`Production polish fields OK for ${target}`);
    }
  }

  if (hasFailures) {
    process.exit(1);
  }
}

export function buildBrandBrief(spec) {
  const styleContract = spec.pattern?.styleContract || "";
  const [moodFragment, afterWith = ""] = styleContract.split(/\s+with\s+/i);
  const signatureMove = extractSignatureMove(styleContract) || humanize(spec.pattern?.surfaceModel || spec.layoutVariant);
  const trustCue = firstClause(afterWith) || humanize(spec.pattern?.secondaryPattern || "specific service proof");
  const actionRole = spec.pattern?.colorRoles?.action || "action";

  return {
    mood: sentence(moodFragment || humanize(spec.pattern?.styleFamily || spec.niche)),
    trustCue: sentence(trustCue),
    accentBehavior: sentence(`${humanize(actionRole)} stays reserved for ${spec.copy?.primaryCta || "the primary action"}, active proof cues, and key booking moments`),
    imageProof: sentence(spec.pattern?.imageEvidence || spec.assetMeta?.hero?.alt || `real ${spec.niche} evidence`),
    signatureMove: sentence(signatureMove),
    avoidLookingLike: sentence(`Avoid a generic ${renderFamilyForVariant(spec.layoutVariant)} recolor; do not repeat stock hero framing, copied card rhythm, or vague local-service claims`)
  };
}

export function buildServiceDetails(spec) {
  const quoteInstruction = sentence(spec.copy?.quoteText || spec.process?.[0]?.text || "");
  const firstProof = spec.proof?.[0] ? `${spec.proof[0].stat}: ${spec.proof[0].label}` : "";
  const rhythm = spec.pattern?.ctaRhythm || spec.pattern?.primaryPattern || "service flow";

  return {
    turnaround: sentence(firstProof || `Reply path is set by ${spec.copy?.primaryCta || "the first contact"}`),
    whatToSend: quoteInstruction,
    prepNote: sentence(spec.process?.[0]?.text || spec.copy?.introText || ""),
    serviceRhythm: sentence(`${humanize(rhythm)} for ${spec.contact?.serviceArea || spec.niche}`),
    objectionAnswer: sentence(`Scope, access, timing, and fit are confirmed before booking so the next step is clear and low-pressure`)
  };
}

export function validateProductionPolishFields(spec) {
  const errors = [];

  validateTextObject(spec.brandBrief, "brandBrief", REQUIRED_BRAND_BRIEF_FIELDS, 18, errors, {
    mood: 12,
    trustCue: 10,
    signatureMove: 10
  });
  validateTextObject(spec.serviceDetails, "serviceDetails", REQUIRED_SERVICE_DETAIL_FIELDS, 28, errors);

  if (spec.brandBrief?.signatureMove && !/signature|board|rail|dock|menu|receipt|gallery|proof|ticket|timeline|flow|cards?|bench|strip|map|grid|console|panel|sidecar|shell|planner|stage|stack|note|checklist|table|swatch|palette|rows?|bar/i.test(spec.brandBrief.signatureMove)) {
    errors.push("brandBrief.signatureMove should name a visible layout feature.");
  }
  if (spec.brandBrief?.imageProof && !hasAnySharedWord(spec.brandBrief.imageProof, `${spec.pattern?.imageEvidence || ""} ${spec.assetMeta?.hero?.alt || ""}`)) {
    errors.push("brandBrief.imageProof should align with pattern.imageEvidence or hero alt text.");
  }
  if (spec.serviceDetails?.whatToSend && !/\b(send|share|tell|include|date|photo|call|email|venue|access|size|window|photos|scope|count|guest|guests|palette|timing|checkout|lock|laundry|menu|headcount|event|surface|project|bike|vehicle|yard|home|room|address)\b/i.test(spec.serviceDetails.whatToSend)) {
    errors.push("serviceDetails.whatToSend should include a concrete visitor instruction.");
  }

  return errors;
}

export function requiredBrandBriefFields() {
  return [...REQUIRED_BRAND_BRIEF_FIELDS];
}

export function requiredServiceDetailFields() {
  return [...REQUIRED_SERVICE_DETAIL_FIELDS];
}

function validateTextObject(value, name, fields, minLength, errors, minimums = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${name} is required.`);
    return;
  }
  for (const field of fields) {
    const text = value[field];
    if (typeof text !== "string" || text.trim().length < (minimums[field] || minLength)) {
      errors.push(`${name}.${field} must be a useful sentence.`);
    }
  }
}

function extractSignatureMove(styleContract) {
  const match = String(styleContract).match(/,\s*and\s+(.+?)\s+as the signature move/i);
  return match?.[1] || "";
}

function firstClause(value) {
  return String(value || "").split(",")[0].trim();
}

function sentence(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) {
    return "";
  }
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function humanize(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAnySharedWord(left, right) {
  const rightWords = new Set(significantWords(right));
  return significantWords(left).some((word) => rightWords.has(word));
}

function significantWords(value) {
  const stop = new Set(["with", "that", "this", "from", "your", "into", "real", "proof", "service", "image", "evidence"]);
  return String(value || "")
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.filter((word) => word.length > 3 && !stop.has(word)) || [];
}
