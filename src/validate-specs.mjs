import fs from "node:fs/promises";
import path from "node:path";
import { implementedLayoutVariantSlugs } from "./layout-archetypes.mjs";
import { validatePatternContract } from "./pattern-contracts.mjs";
import { POLISH_REVIEW_VERSION } from "./production-polish-matrix.mjs";
import { validateProductionPolishFields } from "./production-polish-fields.mjs";
import { readSpec, specTargets } from "./spec-utils.mjs";

const targets = await specTargets();
const allowedLayoutVariants = new Set(implementedLayoutVariantSlugs());
let hasFailures = false;

for (const target of targets) {
  const spec = await readSpec(target);
  const errors = await validateSpec(spec, target);

  if (errors.length) {
    hasFailures = true;
    console.log(`Spec validation failed for ${target}`);
    for (const error of errors) {
      console.log(`- ${error}`);
    }
  } else {
    console.log(`Spec validation OK for ${target}`);
  }
}

if (hasFailures) {
  process.exit(1);
}

async function validateSpec(spec, target) {
  const errors = [];
  const required = [
    "slug",
    "businessName",
    "niche",
    "layoutVariant",
    "pattern",
    "tagline",
    "themeSlug",
    "landingPage",
    "palette",
    "assets",
    "assetMeta",
    "contact",
    "copy",
    "services",
    "process",
    "proof",
    "brandBrief",
    "serviceDetails",
    "release"
  ];

  for (const field of required) {
    if (spec[field] === undefined) {
      errors.push(`Missing required field: ${field}.`);
    }
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(spec.slug || "")) {
    errors.push("slug must be kebab-case with lowercase letters and numbers.");
  }
  if (!allowedLayoutVariants.has(spec.layoutVariant)) {
    errors.push(`layoutVariant must be one of: ${[...allowedLayoutVariants].join(", ")}.`);
  }
  if (!String(spec.landingPage || "").startsWith("/")) {
    errors.push("landingPage must start with /.");
  }

  validatePalette(spec.palette, errors);
  validatePattern(spec.pattern, errors);
  validateColorRoleResolution(spec, errors);
  await validateAssets(spec.assets, errors);
  validateAssetMeta(spec.assetMeta, errors);
  validateContact(spec.contact, spec.businessName, errors);
  validateCopy(spec.copy, errors);
  validateCards(spec.services, "services", errors);
  validateCards(spec.process, "process", errors);
  validateProof(spec.proof, errors);
  validateProductionPolish(spec, errors);
  validateRelease(spec.release, errors);

  if (path.basename(target) !== `${spec.slug}.json`) {
    errors.push(`Spec filename should match slug: specs/${spec.slug}.json.`);
  }

  return errors;
}

function validatePattern(pattern, errors) {
  errors.push(...validatePatternContract(pattern));
}

function validateColorRoleResolution(spec, errors) {
  const paletteKeys = new Set(Object.keys(spec.palette || {}));
  for (const [role, token] of Object.entries(spec.pattern?.colorRoles || {})) {
    if (!paletteKeys.has(token)) {
      errors.push(`pattern.colorRoles.${role} references missing palette token: ${token}.`);
    }
  }
}

function validatePalette(palette, errors) {
  const colors = ["grass", "deepGreen", "leaf", "sun", "cream", "mist", "soil", "white"];
  for (const color of colors) {
    if (!/^#[0-9a-fA-F]{6}$/.test(palette?.[color] || "")) {
      errors.push(`palette.${color} must be a 6-digit hex color.`);
    }
  }
}

async function validateAssets(assets, errors) {
  for (const key of ["hero", "favicon"]) {
    const source = assets?.[key];
    if (!source) {
      errors.push(`assets.${key} is required.`);
      continue;
    }

    try {
      await fs.access(source);
    } catch {
      errors.push(`assets.${key} file does not exist: ${source}.`);
    }
  }
}

function validateAssetMeta(assetMeta, errors) {
  if (!assetMeta?.hero?.title || assetMeta.hero.title.length < 8) {
    errors.push("assetMeta.hero.title must be descriptive.");
  }
  if (!assetMeta?.hero?.alt || assetMeta.hero.alt.length < 20) {
    errors.push("assetMeta.hero.alt must describe the generated hero image.");
  }
}

function validateContact(contact, businessName, errors) {
  if (!/^tel:\+?[0-9]+/.test(contact?.phoneHref || "")) {
    errors.push("contact.phoneHref must be a tel: link.");
  }
  if (!/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact?.emailHref || "")) {
    errors.push("contact.emailHref must be a mailto: email link.");
  }
  if (contact?.email && contact.emailHref !== `mailto:${contact.email}`) {
    errors.push("contact.emailHref must match contact.email.");
  }
  const expectedDomain = domainForBusinessName(businessName);
  const emailDomain = String(contact?.email || "").split("@").at(1) || "";
  if (emailDomain !== expectedDomain) {
    errors.push(`contact email must use the business-name .com domain: ${expectedDomain}.`);
  }
  const reservedExampleDomain = ["example", "com"].join("\\.");
  const reservedDomainPattern = new RegExp(`(?:${reservedExampleDomain}|\\.test)(?:$|[/?#:])`, "i");
  if ([contact?.email, contact?.emailHref].some((value) => reservedDomainPattern.test(String(value || "")))) {
    errors.push("contact email fields must not use reserved placeholder domains.");
  }
  if (!contact?.serviceArea || contact.serviceArea.length < 20) {
    errors.push("contact.serviceArea should be specific enough to feel local.");
  }
}

function domainForBusinessName(businessName) {
  const root = String(businessName || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  return root ? `${root}.com` : "";
}

function validateCopy(copy, errors) {
  const fields = [
    "eyebrow",
    "heroTitle",
    "heroText",
    "primaryCta",
    "secondaryCta",
    "introTitle",
    "introText",
    "servicesTitle",
    "processTitle",
    "proofTitle",
    "quoteTitle",
    "quoteText"
  ];

  for (const field of fields) {
    if (!copy?.[field] || copy[field].length < 3) {
      errors.push(`copy.${field} is required.`);
    }
  }
  if ((copy?.heroText || "").length < 70) {
    errors.push("copy.heroText should be specific enough for the first viewport.");
  }
}

function validateCards(items, field, errors) {
  if (!Array.isArray(items) || items.length < 3) {
    errors.push(`${field} must include at least three items.`);
    return;
  }

  items.forEach((item, index) => {
    if (!item.title || item.title.length < 3) {
      errors.push(`${field}[${index}].title is required.`);
    }
    if (!item.text || item.text.length < 20) {
      errors.push(`${field}[${index}].text should be more specific.`);
    }
  });
}

function validateProof(items, errors) {
  if (!Array.isArray(items) || items.length < 3) {
    errors.push("proof must include at least three items.");
    return;
  }

  items.forEach((item, index) => {
    if (!item.stat || item.stat.length < 2) {
      errors.push(`proof[${index}].stat is required.`);
    }
    if (!item.label || item.label.length < 8) {
      errors.push(`proof[${index}].label should be more specific.`);
    }
  });
}

function validateProductionPolish(spec, errors) {
  errors.push(...validateProductionPolishFields(spec));
}

function validateRelease(release, errors) {
  const statuses = new Set(["draft", "approved", "published"]);
  if (!statuses.has(release?.status)) {
    errors.push("release.status must be draft, approved, or published.");
  }
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(release?.reviewedAt || "")) {
    errors.push("release.reviewedAt must use YYYY-MM-DD.");
  }
  if (!["pending", "approved"].includes(release?.visualBaseline)) {
    errors.push("release.visualBaseline must be pending or approved.");
  }

  const checklist = release?.reviewChecklist || {};
  const requiredChecks = [
    "firstViewportClear",
    "textBrandReadable",
    "layoutDistinct",
    "ctaClear",
    "copySpecific",
    "noImageArtifacts",
    "heroArtDirected",
    "hierarchyDistinct",
    "signatureMove",
    "restrainedComposition",
    "screenshotCompared"
  ];
  for (const key of requiredChecks) {
    if (typeof checklist[key] !== "boolean") {
      errors.push(`release.reviewChecklist.${key} must be boolean.`);
    } else if (release?.status !== "draft" && checklist[key] !== true) {
      errors.push(`release.reviewChecklist.${key} must be true before approval.`);
    }
  }

  const premium = release?.premiumReview;
  if (!premium || typeof premium !== "object") {
    errors.push("release.premiumReview is required.");
    return;
  }
  if (premium.version !== POLISH_REVIEW_VERSION) {
    errors.push(`release.premiumReview.version must be ${POLISH_REVIEW_VERSION}.`);
  }
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(premium.reviewedAt || "")) {
    errors.push("release.premiumReview.reviewedAt must use YYYY-MM-DD.");
  }
  if (!Number.isFinite(premium.score) || premium.score < 90 || premium.score > 100) {
    errors.push("release.premiumReview.score must be between 90 and 100.");
  }
  const categories = [
    "firstViewport",
    "brandText",
    "typography",
    "polishContract",
    "imageProof",
    "ctaClarity",
    "mobilePolish",
    "layoutDistinctness",
    "copySpecificity",
    "assetQa",
    "brandBrief"
  ];
  for (const category of categories) {
    if (premium.categories?.[category] !== true) {
      errors.push(`release.premiumReview.categories.${category} must be true.`);
    }
  }
  if (!Array.isArray(premium.notes) || premium.notes.length < 3) {
    errors.push("release.premiumReview.notes must include at least three notes.");
  }
}
