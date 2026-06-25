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
    navigationTreatment: "top-horizontal-header",
    typographyTreatment: "friendly-bold-route-sans",
    colorStrategy: "verdant-local-service-with-warm-sun-accent",
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
    navigationTreatment: "top-horizontal-header-with-early-photo-quote-anchor",
    typographyTreatment: "confident-transform-grotesk",
    colorStrategy: "high-contrast-clean-surface-with-electric-accent",
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
    navigationTreatment: "top-horizontal-header-with-checklist-anchors",
    typographyTreatment: "crisp-checklist-ui-sans",
    colorStrategy: "bright-glass-clarity-with-cool-utility-contrast",
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
    navigationTreatment: "top-horizontal-header-with-risk-anchors",
    typographyTreatment: "sturdy-safety-sans",
    colorStrategy: "deep-protection-contrast-with-warning-accent",
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
    navigationTreatment: "top-horizontal-header-with-seasonal-anchors",
    typographyTreatment: "industrial-seasonal-condensed",
    colorStrategy: "asphalt-charcoal-with-gold-seasonal-signal",
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
    navigationTreatment: "top-horizontal-header-with-fabric-care-anchors",
    typographyTreatment: "soft-domestic-humanist",
    colorStrategy: "fresh-fabric-teal-with-quiet-cream-air",
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
    navigationTreatment: "menu-style-top-header-with-date-check-anchor",
    typographyTreatment: "event-menu-board-sans",
    colorStrategy: "lively-event-contrast-with-booking-accent",
    guidance: "Lead with event fit, package columns, add-ons, date-check CTAs, and easy package selection."
  },
  "side-rail-service": {
    label: "Side rail service console",
    bestFor: ["junk removal", "garage organization", "closet organization", "senior downsizing", "smart home setup"],
    archetype: "Operational side-rail haul-away service console",
    hero: "desktop-side-rail-with-haul-away-action-hero",
    sectionOrder: [
      "side-rail-navigation",
      "haul-away-hero",
      "donation-proof-strip",
      "accepted-items-grid",
      "sort-path-process",
      "quote-footer"
    ],
    navigationTreatment: "desktop-left-side-rail-collapsing-to-mobile-top-header",
    typographyTreatment: "compact-operator-console",
    colorStrategy: "grounded-utility-neutrals-with-high-visibility-accent",
    servicePresentation: "accepted-items-grid-with-donation-route-note",
    proofTreatment: "donation-sorting-proof-strip-after-hero",
    ctaRhythm: "persistent-rail-photo-cta-plus-final-haul-plan",
    navLabels: ["We take", "Sort path", "Quote"],
    anchorOrder: ["take", "sort", "quote"],
    componentClassesExpected: [
      "som-side-rail-shell",
      "som-side-rail",
      "som-side-main",
      "som-haul-hero",
      "som-haul-photo",
      "som-haul-ticket",
      "som-donation-strip",
      "som-haul-card",
      "som-haul-step",
      "som-quote-strip",
      "som-footer"
    ],
    layoutMarkers: ["som-side-rail-shell", "som-side-rail", "som-haul-hero", "som-haul-photo", "som-haul-ticket", "som-donation-strip", "som-haul-card", "som-haul-step", "som-quote-strip"],
    guidance: "Use a persistent desktop side rail with logo, section anchors, and a quote CTA, then collapse to a compact top header on mobile. Best for operational, checklist-heavy services where the page should feel like a useful service console."
  },
  "fixed-bottom-action": {
    label: "Fixed bottom action bar",
    bestFor: ["mobile detailing", "photo booth rental", "DJ service", "holiday light installation", "coffee cart", "mocktail cart"],
    archetype: "Mobile-first fixed action detail service",
    hero: "split-detail-hero-with-mobile-fixed-action-bar",
    sectionOrder: [
      "compact-action-header",
      "detail-hero",
      "mobile-proof-strip",
      "detail-package-cards",
      "add-on-route-process",
      "final-quote-panel",
      "mobile-fixed-action-bar"
    ],
    navigationTreatment: "desktop-top-header-plus-mobile-fixed-bottom-cta-bar",
    typographyTreatment: "mobile-action-ui-sans",
    colorStrategy: "thumb-friendly-contrast-with-clear-action-color",
    servicePresentation: "package-cards-with-mobile-sticky-action",
    proofTreatment: "compact-mobile-proof-strip-after-hero",
    ctaRhythm: "desktop-hero-quote-plus-mobile-fixed-quote-call-bar",
    navLabels: ["Packages", "Process", "Quote"],
    anchorOrder: ["packages", "process", "quote"],
    componentClassesExpected: [
      "som-fixed-page",
      "som-fixed-header",
      "som-fixed-hero",
      "som-detail-photo",
      "som-detail-ticket",
      "som-detail-proof",
      "som-detail-package",
      "som-detail-step",
      "som-mobile-action-bar",
      "som-quote-strip",
      "som-footer"
    ],
    layoutMarkers: ["som-fixed-page", "som-fixed-header", "som-fixed-hero", "som-detail-photo", "som-detail-ticket", "som-detail-package", "som-detail-step", "som-mobile-action-bar", "som-quote-strip"],
    guidance: "Use a normal desktop header, but make mobile action sticky at the bottom with quote/call/date-check buttons. Keep content padding clear of the bar and make the bar part of the layout signature."
  },
  "side-rail-estimate": {
    label: "Side rail estimate",
    bestFor: ["smart home setup", "senior downsizing", "interior color consulting", "furniture refinishing"],
    navigationTreatment: "desktop-fixed-left-rail-with-phone-cta-collapsing-to-mobile-top-header",
    typographyTreatment: "polished-consultant-editorial-sans",
    colorStrategy: "calm-consulting-neutrals-with-assured-accent",
    guidance: "Use a full-height desktop rail for logo, anchors, and phone/estimate CTA, paired with a right-side hero image and consult steps. Mobile should collapse to a compact header."
  },
  "bottom-dock-booking": {
    label: "Bottom dock booking",
    bestFor: ["mobile auto detailing", "mobile bicycle repair", "knife sharpening", "pool cleaning"],
    navigationTreatment: "mobile-fixed-bottom-dock-with-three-anchors-and-quote-button",
    typographyTreatment: "app-like-booking-ui",
    colorStrategy: "clean-dashboard-contrast-with-active-booking-color",
    guidance: "Build an app-like service dashboard with a mobile bottom action dock, route/service area blocks, package cards, and safe bottom padding so the dock never covers content."
  },
  "split-proof-transform": {
    label: "Split proof transform",
    bestFor: ["junk removal", "garage organization", "carpet cleaning", "deck staining"],
    navigationTreatment: "minimal-top-logo-plus-send-photo-button",
    typographyTreatment: "bold-proof-before-after",
    colorStrategy: "transformation-before-after-contrast-with-bright-proof-accent",
    guidance: "Lead with a split before/after transformation story, then move through what gets fixed, process, proof, and a photo-submit CTA without relying on JavaScript sliders."
  },
  "portfolio-first-mosaic": {
    label: "Portfolio first mosaic",
    bestFor: ["pet photography", "headshots", "murals", "florals", "dessert tables"],
    navigationTreatment: "simple-top-gallery-nav",
    typographyTreatment: "portfolio-editorial-display",
    colorStrategy: "gallery-neutral-stage-with-artful-accent-color",
    guidance: "Use a mosaic-style image grid in the hero, compact headline copy, style/package sections, and date-check CTAs after the gallery and final inquiry block."
  },
  "route-led-schedule": {
    label: "Route led schedule",
    bestFor: ["lawn care", "plant care", "pool cleaning", "knife sharpening", "mobile bicycle repair"],
    navigationTreatment: "horizontal-route-header-with-services-route-plans-anchors",
    typographyTreatment: "schedule-board-service-sans",
    colorStrategy: "route-map-colors-with-readable-plan-contrast",
    guidance: "Lead with route days and schedule confidence, show a CSS-styled service-area panel instead of an external map, then use plan and proof sections around a join-the-route CTA."
  },
  "package-menu-board": {
    label: "Package menu board",
    bestFor: ["photo booth rental", "DJ service", "coffee cart", "mocktail cart", "pizza catering", "taco catering"],
    archetype: "Hospitality package menu board",
    hero: "split-hero-with-live-service-photo-and-menu-ticket",
    sectionOrder: [
      "menu-header",
      "package-menu-hero",
      "host-proof-strip",
      "package-board",
      "event-fit-and-booking-flow",
      "date-check-footer"
    ],
    navigationTreatment: "menu-board-top-nav-with-packages-events-date-anchors",
    typographyTreatment: "menu-board-display-sans",
    colorStrategy: "hospitality-menu-contrast-with-flavor-accent",
    servicePresentation: "package-board-cards-with-menu-ticket",
    proofTreatment: "host-detail-proof-strip-under-hero",
    ctaRhythm: "hero-date-check-plus-package-selection-plus-final-date-cta",
    navLabels: ["Packages", "Events", "Date"],
    anchorOrder: ["packages", "events", "quote"],
    componentClassesExpected: [
      "som-menu-header",
      "som-menu-hero",
      "som-menu-photo",
      "som-menu-ticket",
      "som-menu-proof",
      "som-menu-package",
      "som-menu-event",
      "som-menu-step",
      "som-quote-strip",
      "som-footer"
    ],
    layoutMarkers: ["som-menu-header", "som-menu-hero", "som-menu-photo", "som-menu-ticket", "som-menu-package", "som-menu-event", "som-menu-step", "som-quote-strip"],
    guidance: "Present event packages like a readable menu board, include add-ons and event-fit sections, and frame the primary action as checking the date."
  },
  "urgent-checklist": {
    label: "Urgent checklist",
    bestFor: ["gutter cleaning", "holiday light installation", "vacation rental turnover", "solar panel cleaning"],
    navigationTreatment: "utility-header-with-urgent-cta-and-short-anchors",
    typographyTreatment: "urgent-utility-checklist",
    colorStrategy: "alert-ready-contrast-with-controlled-warning-color",
    guidance: "Use a problem checklist beside the service image, then warning signs, packages, safety proof, service area, and repeated availability CTAs."
  },
  "story-card-consult": {
    label: "Story card consult",
    bestFor: ["senior downsizing", "interior color consulting", "home organization", "micro-wedding florals"],
    navigationTreatment: "calm-top-header-with-low-pressure-consult-action",
    typographyTreatment: "warm-story-card-serif-sans",
    colorStrategy: "gentle-human-neutrals-with-small-confident-accent",
    guidance: "Use warmer editorial pacing: what happens next, support cards, packages, proof, and gentle consult CTAs at the hero, midpoint, and close."
  },
  "service-receipt-stack": {
    label: "Service receipt stack",
    bestFor: ["window cleaning", "carpet cleaning", "mobile detailing", "vacation rental turnover"],
    navigationTreatment: "compact-top-nav-with-phone-button",
    typographyTreatment: "receipt-scope-mono-accent",
    colorStrategy: "clean-paper-receipt-with-service-color-stamps",
    guidance: "Frame the hero around a receipt-style scope summary, then included services, add-ons, process, proof, and a build-my-estimate CTA."
  },
  "workshop-bench": {
    label: "Workshop bench",
    bestFor: ["furniture refinishing", "knife sharpening", "mobile bicycle repair", "mural painting", "window lettering"],
    navigationTreatment: "side-top-hybrid-with-craft-forward-work-method-quote-labels",
    typographyTreatment: "craft-bench-sturdy-serif-sans",
    colorStrategy: "workshop-material-tones-with-tool-accent",
    guidance: "Use close-up craft imagery, materials/process chips, a stacked timeline, gallery/proof, care notes, and send-a-photo CTAs."
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
    navigationTreatment: "top-horizontal-header-with-gallery-anchors",
    typographyTreatment: "editorial-gallery-serif-display",
    colorStrategy: "botanical-gallery-color-with-soft-cream-stage",
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
    navigationTreatment: "calm-top-header-with-consult-anchor",
    typographyTreatment: "quiet-trust-consulting-sans",
    colorStrategy: "restrained-consulting-palette-with-one-clear-action-color",
    guidance: "Lead with trust, what to expect, consult steps, supportive language, and a low-friction first call."
  }
};

export function layoutVariantFor(spec) {
  return spec.layoutVariant || "route-plan";
}

export function layoutVariantSlugs() {
  return Object.keys(LAYOUT_ARCHETYPES);
}

export function implementedLayoutVariantSlugs() {
  return Object.entries(LAYOUT_ARCHETYPES)
    .filter(([, archetype]) => Boolean(archetype.archetype))
    .map(([slug]) => slug);
}

export function layoutArchetypeFor(spec) {
  const variant = layoutVariantFor(spec);
  const archetype = LAYOUT_ARCHETYPES[variant];

  if (!archetype) {
    throw new Error(`Unsupported layoutVariant: ${variant}`);
  }

  return archetype;
}

export function buildLayoutSignature(spec) {
  const variant = layoutVariantFor(spec);
  const archetype = layoutArchetypeFor(spec);

  if (!archetype.archetype) {
    throw new Error(`Layout variant is cataloged but not implemented yet: ${variant}`);
  }

  return {
    version: 1,
    variant,
    archetype: archetype.archetype,
    hero: archetype.hero,
    navigationTreatment: archetype.navigationTreatment,
    typographyTreatment: archetype.typographyTreatment,
    colorStrategy: archetype.colorStrategy,
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
