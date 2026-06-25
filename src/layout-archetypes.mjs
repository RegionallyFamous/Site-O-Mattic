export const LAYOUT_ARCHETYPES = {
  "route-plan": {
    label: "Route or recurring plan",
    bestFor: ["lawn care", "pool cleaning", "plant care", "knife sharpening", "mobile bicycle repair"],
    archetype: "Recurring route service plan",
    hero: "cover-left-copy-full-bleed",
    sectionOrder: [
      "navigation",
      "cover-hero",
      "intro-service-area",
      "services-cards",
      "process-cards",
      "proof-stat-cards",
      "centered-quote-card",
      "footer"
    ],
    servicePresentation: "three-equal-service-cards",
    proofTreatment: "large-stat-cards-on-mist",
    ctaRhythm: "hero-buttons-plus-centered-final-quote-card",
    navLabels: ["Services", "How it works", "Quote"],
    anchorOrder: ["services", "process", "quote"],
    componentClassesExpected: ["som-card", "som-process-card", "som-proof-card", "som-quote-card", "som-footer"],
    layoutMarkers: ["wp:cover", "som-card", "som-process-card", "som-quote-card"]
  },
  "before-after-quote": {
    label: "Before/after photo quote",
    bestFor: ["pressure washing", "driveway sealing", "carpet cleaning", "junk removal", "furniture refinishing"],
    archetype: "Photo quote before-and-after service story",
    hero: "split-copy-with-hero-photo-and-evidence-cards",
    sectionOrder: [
      "navigation",
      "split-editorial-hero",
      "photo-quote-strip",
      "surface-rows",
      "method-panel",
      "timeline",
      "proof-grid-footer"
    ],
    servicePresentation: "numbered-surface-rows-with-method-pills",
    proofTreatment: "compact-proof-grid-inside-final-cta",
    ctaRhythm: "early-photo-quote-strip-plus-final-proof-cta",
    navLabels: ["Photo quote", "Surfaces", "Method"],
    anchorOrder: ["quote", "surfaces", "method"],
    componentClassesExpected: [
      "som-split-hero",
      "som-hero-photo",
      "som-before-after",
      "som-evidence-card",
      "som-quote-strip",
      "som-surface-row",
      "som-method-pill",
      "som-timeline-step",
      "som-proof-grid",
      "som-proof-card",
      "som-footer"
    ],
    layoutMarkers: ["som-split-hero", "som-before-after", "som-quote-strip", "som-surface-row", "som-method-list", "som-timeline-step", "som-proof-grid"]
  },
  "checklist-urgency": {
    label: "Checklist and urgency",
    bestFor: ["window cleaning", "vacation rental turnover", "holiday lights", "move prep"],
    archetype: "Checklist-first service with urgency band",
    hero: "stacked-hero-with-checklist-panel",
    sectionOrder: [
      "navigation",
      "checklist-hero",
      "urgency-proof-band",
      "service-checklist",
      "process-steps",
      "quote-footer"
    ],
    servicePresentation: "checklist-cards-with-service-area-panel",
    proofTreatment: "compact-proof-strip-before-services",
    ctaRhythm: "hero-buttons-plus-midpage-urgency-band",
    navLabels: ["Checklist", "Proof", "Quote"],
    anchorOrder: ["checklist", "proof", "quote"],
    componentClassesExpected: ["som-checklist-hero", "som-urgency-band", "som-check-card", "som-proof-card", "som-quote-strip", "som-footer"],
    layoutMarkers: ["som-checklist-hero", "som-urgency-band", "som-check-card", "som-quote-strip"]
  },
  "risk-prevention": {
    label: "Risk prevention",
    bestFor: ["gutter cleaning", "roof moss removal", "dryer vent cleaning", "chimney sweeping"],
    archetype: "Warning-sign risk prevention service",
    hero: "roofline-photo-left-with-risk-copy-panel",
    sectionOrder: [
      "navigation",
      "risk-hero",
      "risk-proof-band",
      "warning-sign-rows",
      "prevention-plan",
      "quote-footer"
    ],
    servicePresentation: "warning-sign-rows-with-home-risk-panel",
    proofTreatment: "prevention-badges-before-plan",
    ctaRhythm: "hero-phone-plus-seasonal-risk-band",
    navLabels: ["Warning signs", "Plan", "Quote"],
    anchorOrder: ["signs", "plan", "quote"],
    componentClassesExpected: ["som-risk-hero", "som-risk-band", "som-warning-row", "som-plan-step", "som-proof-card", "som-quote-strip", "som-footer"],
    layoutMarkers: ["som-risk-hero", "som-risk-band", "som-warning-row", "som-plan-step", "som-quote-strip"]
  },
  "surface-seasonal": {
    label: "Seasonal surface restoration",
    bestFor: ["driveway sealcoating", "deck staining", "fence staining", "asphalt repair"],
    archetype: "Seasonal surface restoration quote",
    hero: "dark-copy-left-wide-driveway-action-photo",
    sectionOrder: [
      "navigation",
      "surface-hero",
      "seasonal-readiness-band",
      "prep-scope-cards",
      "sealcoat-process",
      "quote-footer"
    ],
    servicePresentation: "prep-and-scope-cards-with-season-note",
    proofTreatment: "seasonal-readiness-badges-under-hero",
    ctaRhythm: "hero-estimate-buttons-plus-final-photo-quote",
    navLabels: ["Timing", "Prep", "Quote"],
    anchorOrder: ["timing", "prep", "quote"],
    componentClassesExpected: ["som-surface-hero", "som-surface-photo", "som-surface-badge", "som-seal-card", "som-season-note", "som-process-card", "som-quote-strip", "som-footer"],
    layoutMarkers: ["som-surface-hero", "som-surface-photo", "som-surface-badge", "som-seal-card", "som-season-note", "som-quote-strip"]
  },
  "stain-care": {
    label: "Stain treatment fabric care",
    bestFor: ["carpet cleaning", "upholstery cleaning", "area rug cleaning", "mattress cleaning"],
    archetype: "Indoor stain treatment care plan",
    hero: "soft-home-hero-with-fabric-service-photo",
    sectionOrder: [
      "navigation",
      "fabric-hero",
      "trust-proof-band",
      "stain-treatment-cards",
      "drying-process",
      "quote-footer"
    ],
    servicePresentation: "stain-and-fabric-care-cards-with-care-note",
    proofTreatment: "trust-proof-badges-after-hero",
    ctaRhythm: "hero-estimate-buttons-plus-final-fabric-quote",
    navLabels: ["Stains", "Drying", "Quote"],
    anchorOrder: ["stains", "drying", "quote"],
    componentClassesExpected: ["som-fabric-hero", "som-fabric-photo", "som-fabric-proof", "som-stain-card", "som-care-note", "som-process-card", "som-quote-strip", "som-footer"],
    layoutMarkers: ["som-fabric-hero", "som-fabric-photo", "som-fabric-proof", "som-stain-card", "som-care-note", "som-quote-strip"]
  },
  "package-comparison": {
    label: "Package comparison",
    bestFor: ["mobile detailing", "photo booth rental", "DJ service", "coffee cart", "mocktail cart", "catering"],
    guidance: "Lead with event fit, package columns, add-ons, date-check CTAs, and easy package selection."
  },
  "gallery-led": {
    label: "Gallery or portfolio led",
    bestFor: ["pollinator gardens", "photography", "murals", "florals", "balloon styling", "dessert tables", "color consulting"],
    archetype: "Visual style gallery lead generator",
    hero: "editorial-image-header-with-overlapping-copy",
    sectionOrder: [
      "navigation",
      "gallery-hero",
      "style-proof-strip",
      "style-gallery-cards",
      "process-panel",
      "quote-footer"
    ],
    servicePresentation: "visual-style-cards-with-caption-panel",
    proofTreatment: "testimonial-style-proof-strip-before-gallery",
    ctaRhythm: "hero-consult-button-plus-final-style-brief",
    navLabels: ["Styles", "Process", "Quote"],
    anchorOrder: ["styles", "process", "quote"],
    componentClassesExpected: ["som-gallery-hero", "som-gallery-image", "som-style-card", "som-gallery-proof", "som-process-card", "som-quote-strip", "som-footer"],
    layoutMarkers: ["som-gallery-hero", "som-gallery-image", "som-style-card", "som-gallery-proof", "som-quote-strip"]
  },
  "consultation-led": {
    label: "Consultation led",
    bestFor: ["smart home setup", "senior downsizing", "home organization", "micro-wedding florals", "interior color consulting"],
    guidance: "Lead with trust, what to expect, consult steps, supportive language, and a low-friction first call."
  }
};

export function layoutVariantFor(spec) {
  return spec.layoutVariant || "route-plan";
}

export function layoutVariantSlugs() {
  return Object.keys(LAYOUT_ARCHETYPES);
}

export function buildLayoutSignature(spec) {
  const variant = layoutVariantFor(spec);
  const archetype = LAYOUT_ARCHETYPES[variant];

  if (!archetype) {
    throw new Error(`Unsupported layoutVariant: ${variant}`);
  }
  if (!archetype.archetype) {
    throw new Error(`Layout variant is cataloged but not implemented yet: ${variant}`);
  }

  return {
    version: 1,
    variant,
    archetype: archetype.archetype,
    hero: archetype.hero,
    sectionOrder: archetype.sectionOrder,
    servicePresentation: archetype.servicePresentation,
    proofTreatment: archetype.proofTreatment,
    ctaRhythm: archetype.ctaRhythm,
    navLabels: archetype.navLabels,
    anchorOrder: archetype.anchorOrder,
    componentClassesExpected: archetype.componentClassesExpected,
    layoutMarkers: archetype.layoutMarkers
  };
}
