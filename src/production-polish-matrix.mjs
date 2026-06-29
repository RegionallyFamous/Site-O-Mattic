export const POLISH_REVIEW_VERSION = 3;

export const RICH_CORE_BLOCKS = [
  "media-text",
  "gallery",
  "table",
  "details",
  "quote",
  "pullquote"
];

export const STRUCTURAL_CORE_BLOCKS = [
  "cover",
  "media-text",
  "gallery",
  "table",
  "details",
  "quote",
  "pullquote",
  "list"
];

export const SILHOUETTE_MATRIX = {
  "viewport-safe-conversion-shell": {
    job: "Guarantee brand, literal service promise, proof cue, CTA, and service media in the first viewport.",
    signatureMove: "First-screen conversion shell",
    preferredNavigation: ["compact-header", "split-nav-action-header", "viewport-safe-hero-shell"],
    strongBlocks: ["cover", "columns", "image", "buttons", "list"],
    risks: ["CTA below first viewport", "hero media crowds mobile copy", "text brand too small"]
  },
  "editorial-proof-stage": {
    job: "Let outcome or process imagery prove the service before claims do.",
    signatureMove: "Evidence-led hero or gallery",
    preferredNavigation: ["compact-header", "section-anchor-strip", "viewport-safe-hero-shell"],
    strongBlocks: ["cover", "gallery", "image", "quote", "media-text"],
    risks: ["CTA disappears under image drama", "image feels stock", "contrast over media fails"]
  },
  "split-quote-board": {
    job: "Move estimate-heavy visitors from interest to a specific quote action.",
    signatureMove: "High-contrast quote/action board",
    preferredNavigation: ["compact-header", "split-nav-action-header", "floating-proof-action"],
    strongBlocks: ["columns", "list", "buttons", "table"],
    risks: ["fake form impression", "quote board crowds mobile", "too many CTA styles"]
  },
  "receipt-scope-stack": {
    job: "Make scope, prep, add-ons, and quote expectations concrete.",
    signatureMove: "Receipt, ledger, or scope stack",
    preferredNavigation: ["compact-header", "section-anchor-strip", "floating-proof-action"],
    strongBlocks: ["media-text", "table", "details", "quote", "list"],
    risks: ["tables overflow", "receipt becomes decoration", "details focus state missing"]
  },
  "operator-console": {
    job: "Make recurring or technical work feel controlled and operational.",
    signatureMove: "Console, board, or status panel",
    preferredNavigation: ["split-nav-action-header", "split-side-top-hybrid", "desktop-side-rail"],
    strongBlocks: ["columns", "navigation", "table", "list", "buttons"],
    risks: ["overdense panels", "dark contrast issues", "mobile collapse gets cramped"]
  },
  "side-rail-service-story": {
    job: "Keep long service flows navigable while giving the site a strong desktop silhouette.",
    signatureMove: "Persistent side rail with proof and action",
    preferredNavigation: ["desktop-side-rail", "floating-proof-action"],
    strongBlocks: ["navigation", "columns", "image", "list", "buttons"],
    risks: ["rail steals width", "mobile focus order is odd", "anchor offsets hide headings"]
  },
  "gallery-mosaic-proof": {
    job: "Show breadth, craft, and visual fit before asking visitors to inquire.",
    signatureMove: "Mosaic or lookbook proof system",
    preferredNavigation: ["compact-header", "section-anchor-strip", "viewport-safe-hero-shell"],
    strongBlocks: ["gallery", "image", "cover", "quote", "buttons"],
    risks: ["heavy image payload", "uneven crops", "service clarity gets soft"]
  },
  "checklist-urgency-gate": {
    job: "Help visitors self-diagnose timing, risk, or readiness without alarmist copy.",
    signatureMove: "Checklist or warning gate",
    preferredNavigation: ["compact-header", "viewport-safe-hero-shell", "fixed-bottom-mobile-cta"],
    strongBlocks: ["list", "details", "columns", "buttons"],
    risks: ["warning color overuse", "crowded hero", "generic urgency"]
  },
  "route-status-board": {
    job: "Prove service-area timing, route reliability, and recurring-care fit.",
    signatureMove: "Route, status, or visit-note board",
    preferredNavigation: ["compact-header", "split-nav-action-header", "split-side-top-hybrid", "section-anchor-strip"],
    strongBlocks: ["table", "details", "columns", "list", "buttons"],
    risks: ["false precision", "table overflow", "too many place names"]
  },
  "package-menu-board": {
    job: "Help visitors compare packages, event fit, and add-ons quickly.",
    signatureMove: "Readable package or menu board",
    preferredNavigation: ["menu-utility-header", "split-nav-action-header", "section-anchor-strip"],
    strongBlocks: ["table", "columns", "list", "separator", "buttons"],
    risks: ["tiny package rows", "menu styling overpowers action", "date CTA unclear"]
  },
  "consultation-story-flow": {
    job: "Build trust for sensitive, aesthetic, or high-consideration service decisions.",
    signatureMove: "Guided consult story flow",
    preferredNavigation: ["compact-header", "split-nav-action-header", "section-anchor-strip", "floating-proof-action"],
    strongBlocks: ["media-text", "quote", "details", "list", "buttons"],
    risks: ["too soft", "long prose", "CTA becomes vague"]
  },
  "mobile-action-dock": {
    job: "Keep the primary conversion action thumb-ready for phone-first services.",
    signatureMove: "Fixed mobile action dock",
    preferredNavigation: ["fixed-bottom-mobile-cta", "split-nav-action-header"],
    strongBlocks: ["buttons", "columns", "list", "image", "navigation"],
    risks: ["footer overlap", "duplicate CTAs", "safe-area padding missing"]
  },
  "floating-proof-sidecar": {
    job: "Keep proof and contact visible beside a dense content column.",
    signatureMove: "Sticky proof/action sidecar",
    preferredNavigation: ["floating-proof-action", "desktop-side-rail", "section-anchor-strip"],
    strongBlocks: ["columns", "quote", "list", "buttons", "details"],
    risks: ["sidecar too tall", "overlap with media", "keyboard order feels strange"]
  }
};

export const STYLE_FAMILY_MATRIX = {
  "quiet-utility-grid": {
    typeVoice: "compact system sans with useful hierarchy",
    colorBehavior: "neutral paper/field split, 1px lines, restrained action color",
    surfaceBehavior: "flat or outlined repeaters",
    imageDirection: "clear work evidence in square or 4:3 crops",
    restraint: "premium comes from useful density, not decoration"
  },
  "humanist-local-calm": {
    typeVoice: "readable humanist body with soft display contrast",
    colorBehavior: "warm paper, muted fields, one confident action color",
    surfaceBehavior: "quiet tonal cards and soft proof panels",
    imageDirection: "people, place, finished outcome, or supportive service context",
    restraint: "friendly without getting cute"
  },
  "editorial-proof-stage": {
    typeVoice: "serif or bookish display paired with readable sans body",
    colorBehavior: "paper/ink stage with one artful accent",
    surfaceBehavior: "fewer cards, more image-led proof",
    imageDirection: "large evidence-led hero, gallery, or lookbook crop",
    restraint: "let the image do the proving"
  },
  "operator-console": {
    typeVoice: "condensed or sturdy display with mono/accent labels",
    colorBehavior: "neutral or dark field with high-visibility action",
    surfaceBehavior: "rails, boards, status rows, precise cards",
    imageDirection: "gear, route, sorted outcome, or working status evidence",
    restraint: "dense but not cramped"
  },
  "material-workbench": {
    typeVoice: "bookish material display with humanist body and sturdy shop labels",
    colorBehavior: "material tones with one tool/action accent",
    surfaceBehavior: "inset borders, modest media lift, bench/ticket surfaces",
    imageDirection: "process closeups and material detail",
    restraint: "tactile, not rustic-cliche"
  },
  "mobile-action-gloss": {
    typeVoice: "system UI with bold commercial display and strong action labels",
    colorBehavior: "high contrast with one electric action color",
    surfaceBehavior: "mobile dock gets the strongest elevation",
    imageDirection: "current, glossy, inspection-ready service moment",
    restraint: "the dock is loud; the rest stays controlled"
  },
  "risk-control-alert": {
    typeVoice: "sturdy or condensed sans with tight labels",
    colorBehavior: "protective neutrals; warning only for real risk/action",
    surfaceBehavior: "rows and checklist gates beat generic cards",
    imageDirection: "visible risk, mitigation, or seasonal work evidence",
    restraint: "no exaggerated scare copy"
  },
  "receipt-ledger": {
    typeVoice: "system body with mono accent and compact display",
    colorBehavior: "paper/ink/muted-line system with stamped action/proof color",
    surfaceBehavior: "tables, receipts, ledgers, and details",
    imageDirection: "estimate confidence, scope, safety, or service proof",
    restraint: "receipt rows must stay readable on mobile"
  },
  "hospitality-menu": {
    typeVoice: "condensed or commercial display with readable menu body",
    colorBehavior: "warm dark/paper contrast with flavor action color",
    surfaceBehavior: "menu tickets, package cards, event-fit panels",
    imageDirection: "candid service moment with real event scale",
    restraint: "expressive menu; scannable packages"
  },
  "clear-status-dashboard": {
    typeVoice: "clean dashboard sans with mono/status accents",
    colorBehavior: "cool paper/field, status chips, bright test/action color",
    surfaceBehavior: "boards, rails, status strips, restrained shadows",
    imageDirection: "measurable state or outcome in clean light",
    restraint: "only one floating board should dominate"
  }
};

export const PREMIUM_POLISH_GUARDRAILS = {
  firstViewport: ["brand", "literal service promise", "proof cue", "primary CTA", "service media"],
  typography: {
    bodyLineHeight: [1.52, 1.66],
    headingLineHeight: [1.04, 1.12],
    copyMeasureCh: [58, 72],
    displayConcentrationMax: 0.25,
    exactTripletConcentrationMax: 0.16
  },
  colorRoles: ["ink", "paper", "field", "line", "primary", "action", "proof", "muted", "warning", "shadowTint"],
  richCoreBlocks: "When a rich-block combination reaches its uniqueness budget, add or reuse a truthful core-block alternative in the shared archetype builder and update spec coreBlockPlan values; do not only rename metadata or loosen thresholds.",
  elevation: "Use borders and tonal fields for ordinary surfaces; reserve shadows for hero media, one proof/contact board, or a mobile dock.",
  cta: "CTA labels must name the action and avoid generic Get started/Learn more/Submit language.",
  navigation: "One-page nav is local; sticky/fixed patterns require anchor offsets, focus checks, safe-area padding, and footer overlap checks."
};

export function silhouetteContract(slug) {
  return SILHOUETTE_MATRIX[slug] || null;
}

export function styleFamilyContract(slug) {
  return STYLE_FAMILY_MATRIX[slug] || null;
}

export function strongestCoreBlock(plan = []) {
  const normalized = normalizeCoreBlockPlan(plan);
  for (const block of RICH_CORE_BLOCKS) {
    if (normalized.includes(block)) {
      return block;
    }
  }
  for (const block of STRUCTURAL_CORE_BLOCKS) {
    if (normalized.includes(block)) {
      return block;
    }
  }
  return "group/columns/buttons";
}

export function richCoreSignature(plan = []) {
  const normalized = normalizeCoreBlockPlan(plan);
  const richBlocks = RICH_CORE_BLOCKS.filter((block) => normalized.includes(block));
  return richBlocks.length ? richBlocks.join("+") : "group/columns/buttons";
}

export function hasRichCoreBlock(plan = []) {
  const normalized = normalizeCoreBlockPlan(plan);
  return RICH_CORE_BLOCKS.some((block) => normalized.includes(block));
}

export function normalizeCoreBlockPlan(plan = []) {
  return plan.map((item) => String(item).toLowerCase().replace(/^core\//, "").replace(/\s*&\s*/g, "-"));
}

export function radiusPxFromScale(radiusScale) {
  const values = [...String(radiusScale || "").matchAll(/(?:^|[^0-9])([0-9]+(?:\.[0-9]+)?)(?:px)?(?:[^0-9]|$)/g)]
    .map((match) => Number(match[1]))
    .filter(Number.isFinite);
  if (!values.length) {
    return NaN;
  }
  return Math.max(...values);
}

export function componentRadiusPx(pattern) {
  const fromScale = radiusPxFromScale(pattern?.geometry?.radiusScale);
  if (Number.isFinite(fromScale)) {
    return Math.min(Math.max(fromScale, 2), 8);
  }
  return 8;
}

export function validatePatternMatrixFit(pattern) {
  const errors = [];
  if (!pattern || typeof pattern !== "object") {
    return ["pattern matrix fit requires pattern object."];
  }

  const silhouette = silhouetteContract(pattern.silhouette);
  const styleFamily = styleFamilyContract(pattern.styleFamily);
  const radius = radiusPxFromScale(pattern.geometry?.radiusScale);

  if (!silhouette) {
    errors.push(`pattern.silhouette has no production matrix contract: ${pattern.silhouette || "missing"}.`);
  }
  if (!styleFamily) {
    errors.push(`pattern.styleFamily has no production matrix contract: ${pattern.styleFamily || "missing"}.`);
  }
  if (silhouette && !silhouette.preferredNavigation.includes(pattern.navigationPrimitive)) {
    errors.push(`pattern.navigationPrimitive ${pattern.navigationPrimitive} is weak for ${pattern.silhouette}; preferred: ${silhouette.preferredNavigation.join(", ")}.`);
  }
  if (Number.isFinite(radius) && radius > 8) {
    errors.push(`pattern.geometry.radiusScale should keep card/panel radius at 8px or less; found ${pattern.geometry.radiusScale}.`);
  }
  if (/\b(all|every|everything|heavy|floating cards)\b/i.test(pattern.geometry?.shadowRole || "")) {
    errors.push("pattern.geometry.shadowRole should reserve elevation for one or two important surfaces.");
  }
  if (Array.isArray(pattern.coreBlockPlan)) {
    const normalized = normalizeCoreBlockPlan(pattern.coreBlockPlan);
    const unknown = normalized.filter((block) => !new Set([...STRUCTURAL_CORE_BLOCKS, "buttons", "columns", "image", "navigation", "separator"]).has(block));
    if (unknown.length) {
      errors.push(`pattern.coreBlockPlan contains unsupported matrix block families: ${unknown.join(", ")}.`);
    }
    if (silhouette) {
      const overlap = silhouette.strongBlocks.filter((block) => normalized.includes(block));
      if (!overlap.length) {
        errors.push(`pattern.coreBlockPlan should include at least one block that carries ${pattern.silhouette}: ${silhouette.strongBlocks.join(", ")}.`);
      }
    }
  }

  return errors;
}
