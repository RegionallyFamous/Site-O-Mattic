import { validatePatternMatrixFit } from "./production-polish-matrix.mjs";

export const PRIMARY_PATTERNS = [
  "decision-filter-route-plan",
  "route-schedule-board",
  "photo-quote-transformation",
  "checklist-urgency-gate",
  "risk-prevention-warning-path",
  "seasonal-readiness-estimate",
  "date-window-reservation",
  "soft-care-trust-plan",
  "operational-side-rail-console",
  "package-menu-board",
  "mobile-fixed-action-flow",
  "workshop-bench-photo-quote",
  "water-test-board-route",
  "zone-grid-planner",
  "gallery-led-portfolio-proof",
  "service-receipt-stack",
  "consultation-story-flow",
  "objection-led-faq-close"
];

export const NAVIGATION_PRIMITIVES = [
  "compact-header",
  "split-nav-action-header",
  "menu-utility-header",
  "desktop-side-rail",
  "split-side-top-hybrid",
  "section-anchor-strip",
  "fixed-bottom-mobile-cta",
  "floating-proof-action",
  "viewport-safe-hero-shell"
];

export const SILHOUETTES = [
  "viewport-safe-conversion-shell",
  "editorial-proof-stage",
  "split-quote-board",
  "receipt-scope-stack",
  "operator-console",
  "side-rail-service-story",
  "gallery-mosaic-proof",
  "checklist-urgency-gate",
  "route-status-board",
  "package-menu-board",
  "consultation-story-flow",
  "mobile-action-dock",
  "floating-proof-sidecar"
];

export const IMAGE_ROLES = [
  "work-in-progress",
  "finished-outcome",
  "process-closeup",
  "local-context",
  "proof-collage",
  "operator-or-founder",
  "environment-context"
];

export const CTA_RHYTHMS = [
  "call-first",
  "quote-first",
  "photo-first",
  "date-check",
  "package-select",
  "consult-first",
  "route-join",
  "book-first",
  "start-service",
  "photo-plan"
];

export const STYLE_FAMILIES = [
  "quiet-utility-grid",
  "humanist-local-calm",
  "editorial-proof-stage",
  "operator-console",
  "material-workbench",
  "mobile-action-gloss",
  "risk-control-alert",
  "receipt-ledger",
  "hospitality-menu",
  "clear-status-dashboard"
];

export const SURFACE_FAMILIES = [
  "mostly-flat",
  "outlined-repeaters",
  "single-elevated-proof",
  "dark-panel",
  "receipt-stack",
  "ticket-menu-board",
  "grid-board",
  "gallery-mosaic",
  "mobile-dock",
  "side-rail",
  "status-board"
];

export const DENSITIES = [
  "compact-leadgen",
  "balanced-editorial",
  "visual-first"
];

export const CORE_BLOCK_PLAN = [
  "buttons",
  "columns",
  "cover",
  "details",
  "gallery",
  "image",
  "list",
  "media-text",
  "navigation",
  "quote",
  "pullquote",
  "table"
];

export const COLOR_ROLE_FIELDS = [
  "ink",
  "paper",
  "field",
  "line",
  "primary",
  "action",
  "proof",
  "muted",
  "warning",
  "shadowTint"
];

export const GEOMETRY_FIELDS = [
  "radiusScale",
  "borderRole",
  "shadowRole",
  "mediaCrop"
];

export const PATTERN_CONTRACT_STRING_FIELDS = [
  "primaryPattern",
  "secondaryPattern",
  "silhouette",
  "navigationPrimitive",
  "mobileActionPattern",
  "imageRole",
  "imageEvidence",
  "ctaRhythm",
  "surfaceFamily",
  "surfaceModel",
  "styleFamily",
  "density",
  "styleContract"
];

export function validatePatternContract(pattern) {
  const errors = [];

  if (!pattern || typeof pattern !== "object" || Array.isArray(pattern)) {
    return ["pattern must be an object."];
  }

  for (const field of PATTERN_CONTRACT_STRING_FIELDS) {
    if (!pattern[field] || typeof pattern[field] !== "string" || pattern[field].length < 3) {
      errors.push(`pattern.${field} is required.`);
    }
  }

  if (!PRIMARY_PATTERNS.includes(pattern.primaryPattern)) {
    errors.push(`pattern.primaryPattern must be one of: ${PRIMARY_PATTERNS.join(", ")}.`);
  }
  if (!SILHOUETTES.includes(pattern.silhouette)) {
    errors.push(`pattern.silhouette must be one of: ${SILHOUETTES.join(", ")}.`);
  }
  if (!NAVIGATION_PRIMITIVES.includes(pattern.navigationPrimitive)) {
    errors.push(`pattern.navigationPrimitive must be one of: ${NAVIGATION_PRIMITIVES.join(", ")}.`);
  }
  if (!IMAGE_ROLES.includes(pattern.imageRole)) {
    errors.push(`pattern.imageRole must be one of: ${IMAGE_ROLES.join(", ")}.`);
  }
  if (!CTA_RHYTHMS.includes(pattern.ctaRhythm)) {
    errors.push(`pattern.ctaRhythm must be one of: ${CTA_RHYTHMS.join(", ")}.`);
  }
  if (!SURFACE_FAMILIES.includes(pattern.surfaceFamily)) {
    errors.push(`pattern.surfaceFamily must be one of: ${SURFACE_FAMILIES.join(", ")}.`);
  }
  if (!STYLE_FAMILIES.includes(pattern.styleFamily)) {
    errors.push(`pattern.styleFamily must be one of: ${STYLE_FAMILIES.join(", ")}.`);
  }
  if (!DENSITIES.includes(pattern.density)) {
    errors.push(`pattern.density must be one of: ${DENSITIES.join(", ")}.`);
  }
  validateColorRoles(pattern.colorRoles, errors);
  validateGeometry(pattern.geometry, errors);
  validateCoreBlockPlan(pattern.coreBlockPlan, errors);
  errors.push(...validatePatternMatrixFit(pattern));
  if (!Array.isArray(pattern.knownRisks) || pattern.knownRisks.length < 2) {
    errors.push("pattern.knownRisks must include at least two risks.");
  } else {
    pattern.knownRisks.forEach((risk, index) => {
      if (typeof risk !== "string" || risk.length < 4) {
        errors.push(`pattern.knownRisks[${index}] should be a short risk label.`);
      }
    });
  }
  validateStyleContract(pattern.styleContract, errors);

  return errors;
}

function validateColorRoles(colorRoles, errors) {
  if (!colorRoles || typeof colorRoles !== "object" || Array.isArray(colorRoles)) {
    errors.push("pattern.colorRoles must be an object.");
    return;
  }

  for (const field of COLOR_ROLE_FIELDS) {
    if (!colorRoles[field] || typeof colorRoles[field] !== "string" || colorRoles[field].length < 3) {
      errors.push(`pattern.colorRoles.${field} is required.`);
    }
  }
}

function validateGeometry(geometry, errors) {
  if (!geometry || typeof geometry !== "object" || Array.isArray(geometry)) {
    errors.push("pattern.geometry must be an object.");
    return;
  }

  for (const field of GEOMETRY_FIELDS) {
    if (!geometry[field] || typeof geometry[field] !== "string" || geometry[field].length < 3) {
      errors.push(`pattern.geometry.${field} is required.`);
    }
  }
}

function validateCoreBlockPlan(coreBlockPlan, errors) {
  if (!Array.isArray(coreBlockPlan) || coreBlockPlan.length < 3) {
    errors.push("pattern.coreBlockPlan must include at least three planned core block families.");
    return;
  }

  for (const block of coreBlockPlan) {
    if (!CORE_BLOCK_PLAN.includes(block)) {
      errors.push(`pattern.coreBlockPlan contains unsupported block family: ${block}.`);
    }
  }
}

function validateStyleContract(styleContract, errors) {
  const contract = styleContract || "";
  if (contract.split(/[.!?]/).filter(Boolean).length !== 1) {
    errors.push("pattern.styleContract should be exactly one sentence.");
  }
  for (const fragment of [" with ", "proof", "accent", "signature move"]) {
    if (!contract.toLowerCase().includes(fragment)) {
      errors.push(`pattern.styleContract should include ${fragment.trim()} as part of mood, trust cue, accent behavior, and signature move.`);
    }
  }
}
