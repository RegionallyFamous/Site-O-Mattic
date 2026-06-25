function withPrefixedClasses(baseClasses, prefix, classSuffixes, markerSuffixes = classSuffixes) {
  return {
    componentClassesExpected: baseClasses.flatMap((baseClass, index) => [
      baseClass,
      `som-${prefix}-${classSuffixes[index]}`
    ]),
    layoutMarkers: markerSuffixes.map((suffix) => `som-${prefix}-${suffix}`)
  };
}

function galleryAlias(config) {
  const classes = withPrefixedClasses(
    ["som-gallery-hero", "som-gallery-image", "som-gallery-copy", "som-gallery-note", "som-style-card", "som-gallery-proof", "som-process-card", "som-quote-strip"],
    config.prefix,
    ["gallery-hero", "gallery-image", "gallery-copy", "gallery-note", "style-card", "gallery-proof", "process-card", "quote-strip"],
    ["gallery-hero", "gallery-image", "style-card", "gallery-proof", "quote-strip"]
  );
  return { ...config, ...classes };
}

function menuAlias(config) {
  const classes = withPrefixedClasses(
    ["som-menu-page", "som-menu-header", "som-menu-hero", "som-menu-photo", "som-menu-ticket", "som-menu-proof", "som-menu-package", "som-menu-event", "som-menu-step", "som-quote-strip"],
    config.prefix,
    ["menu-page", "menu-header", "menu-hero", "menu-photo", "menu-ticket", "menu-proof", "menu-package", "menu-event", "menu-step", "quote-strip"],
    ["menu-page", "menu-header", "menu-hero", "menu-photo", "menu-ticket", "menu-package", "menu-event", "quote-strip"]
  );
  return { ...config, ...classes };
}

function storyAlias(config) {
  const classes = withPrefixedClasses(
    ["som-checklist-hero", "som-urgency-band", "som-check-card", "som-proof-card", "som-quote-strip"],
    config.prefix,
    ["story-hero", "proof-band", "support-card", "proof-card", "consult-strip"],
    ["story-hero", "proof-band", "support-card", "consult-strip"]
  );
  return { ...config, ...classes };
}

function fixedActionAlias(config) {
  const classes = withPrefixedClasses(
    ["som-fixed-page", "som-fixed-header", "som-fixed-hero", "som-detail-photo", "som-detail-ticket", "som-detail-proof", "som-detail-package", "som-detail-step", "som-mobile-action-bar", "som-quote-strip"],
    config.prefix,
    ["page", "header", "hero", "photo", "ticket", "proof", "package", "step", "action-dock", "quote-strip"],
    ["page", "header", "hero", "photo", "ticket", "package", "action-dock", "quote-strip"]
  );
  return { ...config, ...classes };
}

function sideRailAlias(config) {
  const classes = withPrefixedClasses(
    ["som-side-rail-shell", "som-side-rail", "som-side-main", "som-haul-hero", "som-haul-photo", "som-haul-ticket", "som-donation-strip", "som-haul-card", "som-haul-step", "som-quote-strip"],
    config.prefix,
    ["rail-shell", "rail", "main", "hero", "photo", "ticket", "proof-strip", "card", "step", "quote-strip"],
    ["rail-shell", "rail", "hero", "photo", "ticket", "proof-strip", "card", "quote-strip"]
  );
  return { ...config, ...classes };
}

function workshopAlias(config) {
  const classes = withPrefixedClasses(
    ["som-workshop-page", "som-workshop-header", "som-workshop-hero", "som-workshop-photo", "som-workshop-ticket", "som-material-proof", "som-wood-card", "som-care-note", "som-craft-step", "som-quote-strip"],
    config.prefix,
    ["page", "header", "hero", "photo", "ticket", "proof", "card", "care-note", "step", "quote-strip"],
    ["page", "header", "hero", "photo", "ticket", "proof", "card", "quote-strip"]
  );
  return { ...config, ...classes };
}

function beforeAfterAlias(config) {
  const classes = withPrefixedClasses(
    ["som-split-hero", "som-hero-photo", "som-before-after", "som-evidence-card", "som-quote-strip", "som-surface-row", "som-method-pill", "som-timeline-step", "som-proof-grid", "som-proof-card"],
    config.prefix,
    ["split-hero", "hero-photo", "before-after", "evidence-card", "quote-strip", "surface-row", "method-pill", "timeline-step", "proof-grid", "proof-card"],
    ["split-hero", "hero-photo", "before-after", "surface-row", "quote-strip"]
  );
  return { ...config, ...classes };
}

const RENDER_FAMILY_BY_LAYOUT = {
  "side-rail-estimate": "side-rail-service",
  "bottom-dock-booking": "fixed-bottom-action",
  "sharp-route-bench": "workshop-bench",
  "bike-route-workstand": "workshop-bench",
  "organizing-zone-board": "zone-grid-planner",
  "route-led-schedule": "route-plan",
  "story-card-consult": "checklist-urgency",
  "turnover-receipt-board": "service-receipt-stack",
  "pet-portrait-gallery": "gallery-led",
  "street-food-menu-board": "package-menu-board",
  "dessert-table-gallery": "gallery-led",
  "balloon-backdrop-gallery": "gallery-led",
  "micro-wedding-floral-story": "checklist-urgency",
  "photo-booth-strip-packages": "fixed-bottom-action",
  "soundcheck-console": "side-rail-service",
  "picnic-proposal-lookbook": "gallery-led",
  "mocktail-cart-menu": "package-menu-board",
  "headshot-proof-gallery": "gallery-led",
  "mural-lettering-workshop": "workshop-bench",
  "color-consult-story": "checklist-urgency",
  "furniture-refinish-proof": "before-after-quote"
};

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
  "zone-grid-planner": {
    label: "Zone grid planner",
    bestFor: ["garage organization", "closet organization", "pantry organization", "mudroom organization"],
    archetype: "Garage zone planning and install",
    hero: "split-copy-with-garage-photo-and-zone-map",
    sectionOrder: [
      "split-action-header",
      "zone-grid-hero",
      "zone-proof-strip",
      "zone-plan-cards",
      "install-process-board",
      "photo-plan-quote",
      "footer"
    ],
    navigationTreatment: "split-nav-action-header-with-zone-process-quote-anchors",
    typographyTreatment: "organized-grid-humanist-sans",
    colorStrategy: "garage-charcoal-grid-with-safety-yellow-action",
    servicePresentation: "zone-plan-cards-with-grid-map-note",
    proofTreatment: "floor-first-proof-strip-with-zone-metrics",
    ctaRhythm: "hero-design-garage-plus-final-photo-plan-quote",
    navLabels: ["Zones", "Process", "Quote"],
    anchorOrder: ["zones", "process", "quote"],
    componentClassesExpected: [
      "som-zone-page",
      "som-zone-header",
      "som-zone-hero",
      "som-zone-photo",
      "som-zone-map",
      "som-zone-proof",
      "som-zone-card",
      "som-zone-step",
      "som-zone-note",
      "som-quote-strip",
      "som-footer"
    ],
    layoutMarkers: ["som-zone-page", "som-zone-header", "som-zone-hero", "som-zone-photo", "som-zone-map", "som-zone-proof", "som-zone-card", "som-zone-step", "som-zone-note", "som-quote-strip"],
    guidance: "Use a crisp split hero with a real organized garage photo, a simple zone-map board, proof about floor/parking lanes, and package-like zone cards."
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
    archetype: "Consultative side-rail estimate console",
    hero: "desktop-side-rail-with-consult-action-hero",
    sectionOrder: [
      "desktop-estimate-rail",
      "consult-hero",
      "trust-proof-strip",
      "scope-cards",
      "setup-path-process",
      "estimate-footer"
    ],
    navigationTreatment: "desktop-fixed-left-rail-with-phone-cta-collapsing-to-mobile-top-header",
    typographyTreatment: "polished-consultant-editorial-sans",
    colorStrategy: "calm-consulting-neutrals-with-assured-accent",
    servicePresentation: "consult-scope-cards-with-setup-path-note",
    proofTreatment: "quiet-proof-strip-under-consult-hero",
    ctaRhythm: "persistent-rail-consult-cta-plus-final-estimate",
    navLabels: ["Scope", "Setup path", "Quote"],
    anchorOrder: ["take", "sort", "quote"],
    componentClassesExpected: [
      "som-side-rail-shell",
      "som-estimate-rail-shell",
      "som-side-rail",
      "som-estimate-rail",
      "som-side-main",
      "som-estimate-main",
      "som-haul-hero",
      "som-consult-hero",
      "som-haul-photo",
      "som-consult-photo",
      "som-haul-ticket",
      "som-consult-ticket",
      "som-donation-strip",
      "som-consult-proof-strip",
      "som-haul-card",
      "som-consult-card",
      "som-haul-step",
      "som-consult-step",
      "som-quote-strip",
      "som-footer"
    ],
    layoutMarkers: ["som-estimate-rail-shell", "som-estimate-rail", "som-consult-hero", "som-consult-photo", "som-consult-ticket", "som-consult-proof-strip", "som-consult-card", "som-consult-step", "som-quote-strip"],
    guidance: "Use a full-height desktop rail for logo, anchors, and phone/estimate CTA, paired with a right-side hero image and consult steps. Mobile should collapse to a compact header."
  },
  "bottom-dock-booking": {
    label: "Bottom dock booking",
    bestFor: ["mobile auto detailing", "mobile bicycle repair", "knife sharpening", "pool cleaning"],
    archetype: "Route booking dashboard with mobile action dock",
    hero: "split-service-hero-with-bottom-booking-dock",
    sectionOrder: [
      "compact-booking-header",
      "route-service-hero",
      "route-proof-strip",
      "package-cards",
      "mobile-process-board",
      "final-booking-panel",
      "mobile-bottom-dock"
    ],
    navigationTreatment: "mobile-fixed-bottom-dock-with-three-anchors-and-quote-button",
    typographyTreatment: "app-like-booking-ui",
    colorStrategy: "clean-dashboard-contrast-with-active-booking-color",
    servicePresentation: "route-package-cards-with-mobile-booking-dock",
    proofTreatment: "compact-route-proof-strip-after-hero",
    ctaRhythm: "hero-booking-plus-mobile-fixed-quote-call-dock",
    navLabels: ["Tune menu", "Route stop", "Book"],
    anchorOrder: ["packages", "process", "quote"],
    componentClassesExpected: [
      "som-fixed-page",
      "som-booking-page",
      "som-fixed-header",
      "som-booking-header",
      "som-fixed-hero",
      "som-booking-hero",
      "som-detail-photo",
      "som-booking-photo",
      "som-detail-ticket",
      "som-booking-ticket",
      "som-detail-proof",
      "som-route-proof",
      "som-detail-package",
      "som-tune-package",
      "som-detail-step",
      "som-route-step",
      "som-mobile-action-bar",
      "som-booking-dock",
      "som-quote-strip",
      "som-footer"
    ],
    layoutMarkers: ["som-booking-page", "som-booking-header", "som-booking-hero", "som-booking-photo", "som-booking-ticket", "som-route-proof", "som-tune-package", "som-route-step", "som-booking-dock", "som-quote-strip"],
    guidance: "Build an app-like service dashboard with a mobile bottom action dock, route/service area blocks, package cards, and safe bottom padding so the dock never covers content."
  },
  "sharp-route-bench": {
    label: "Sharp route bench",
    bestFor: ["mobile knife sharpening", "tool sharpening", "scissor sharpening"],
    archetype: "Route-day sharpening bench service",
    hero: "craft-bench-hero-with-route-ticket",
    sectionOrder: [
      "compact-bench-header",
      "route-bench-hero",
      "edge-proof-rail",
      "sharpening-scope-bench",
      "care-process-stack",
      "route-day-quote",
      "footer"
    ],
    navigationTreatment: "side-top-hybrid-with-route-bench-method-quote-labels",
    typographyTreatment: "sharp-craft-route-serif-sans",
    colorStrategy: "steel-bench-neutrals-with-honed-edge-accent",
    servicePresentation: "sharpening-scope-cards-with-bench-note",
    proofTreatment: "edge-proof-rail-with-route-day-stats",
    ctaRhythm: "hero-route-join-plus-final-care-note-quote",
    navLabels: ["Bench", "Process", "Quote"],
    anchorOrder: ["wood", "process", "quote"],
    componentClassesExpected: [
      "som-workshop-page",
      "som-sharp-page",
      "som-workshop-header",
      "som-sharp-header",
      "som-workshop-hero",
      "som-sharp-hero",
      "som-workshop-photo",
      "som-sharp-photo",
      "som-workshop-ticket",
      "som-edge-ticket",
      "som-material-proof",
      "som-edge-proof",
      "som-wood-card",
      "som-sharp-card",
      "som-care-note",
      "som-edge-care-note",
      "som-craft-step",
      "som-sharp-step",
      "som-quote-strip",
      "som-footer"
    ],
    layoutMarkers: ["som-sharp-page", "som-sharp-header", "som-sharp-hero", "som-sharp-photo", "som-edge-ticket", "som-edge-proof", "som-sharp-card", "som-edge-care-note", "som-sharp-step", "som-quote-strip"],
    guidance: "Use craft-bench imagery, route-day proof, item-scope cards, care notes, and join-the-next-route CTAs."
  },
  "bike-route-workstand": {
    label: "Bike route workstand",
    bestFor: ["mobile bicycle repair", "commuter bike tune-ups", "bike room service days"],
    archetype: "Curbside bike workstand and route stop",
    hero: "curbside-workstand-photo-with-route-ticket-and-ride-check",
    sectionOrder: [
      "compact-workstand-header",
      "curbside-bike-hero",
      "ride-readiness-proof-rail",
      "tune-lane-service-bench",
      "route-stop-process-stack",
      "booking-note-quote",
      "footer"
    ],
    navigationTreatment: "side-top-hybrid-with-tune-route-booking-labels",
    typographyTreatment: "technical-bike-service-sans-with-compact-utility-labels",
    colorStrategy: "commuter-teal-cream-with-chain-lube-yellow-action",
    servicePresentation: "tune-lane-cards-with-ride-readiness-note",
    proofTreatment: "ride-readiness-proof-rail-with-route-day-stats",
    ctaRhythm: "hero-book-tune-plus-final-route-note-quote",
    navLabels: ["Tune lanes", "Route stop", "Book"],
    anchorOrder: ["wood", "process", "quote"],
    componentClassesExpected: [
      "som-workshop-page",
      "som-bike-page",
      "som-workshop-header",
      "som-bike-header",
      "som-workshop-hero",
      "som-bike-hero",
      "som-workshop-photo",
      "som-workstand-photo",
      "som-workshop-ticket",
      "som-route-ticket",
      "som-material-proof",
      "som-ride-proof",
      "som-wood-card",
      "som-tune-card",
      "som-care-note",
      "som-ride-care-note",
      "som-craft-step",
      "som-bike-route-step",
      "som-quote-strip",
      "som-bike-booking-strip",
      "som-footer"
    ],
    layoutMarkers: ["som-bike-page", "som-bike-header", "som-bike-hero", "som-workstand-photo", "som-route-ticket", "som-ride-proof", "som-tune-card", "som-ride-care-note", "som-bike-route-step", "som-bike-booking-strip"],
    guidance: "Use the portable stand as the visual anchor, pair route-day proof with tune-lane cards, and keep booking language focused on bike photos, tire size, symptoms, and a clean curbside handoff."
  },
  "organizing-zone-board": {
    label: "Organizing zone board",
    bestFor: ["closet organization", "pantry organization", "mudroom organization"],
    archetype: "Home storage zone board and reset plan",
    hero: "split-copy-with-organized-shelf-photo-and-zone-board",
    sectionOrder: [
      "split-action-header",
      "storage-zone-hero",
      "reset-proof-strip",
      "zone-plan-cards",
      "install-process-board",
      "photo-plan-quote",
      "footer"
    ],
    navigationTreatment: "split-nav-action-header-with-zone-reset-quote-anchors",
    typographyTreatment: "soft-systems-humanist-sans",
    colorStrategy: "warm-home-order-with-clear-label-accent",
    servicePresentation: "storage-zone-cards-with-grid-map-note",
    proofTreatment: "everyday-use-proof-strip-with-zone-metrics",
    ctaRhythm: "hero-start-reset-plus-final-photo-plan-quote",
    navLabels: ["Shelves", "Reset", "Plan"],
    anchorOrder: ["zones", "process", "quote"],
    componentClassesExpected: [
      "som-zone-page",
      "som-organizing-page",
      "som-zone-header",
      "som-organizing-header",
      "som-zone-hero",
      "som-organizing-hero",
      "som-zone-photo",
      "som-organizing-photo",
      "som-zone-map",
      "som-shelf-map",
      "som-zone-proof",
      "som-reset-proof",
      "som-zone-card",
      "som-shelf-card",
      "som-zone-step",
      "som-reset-step",
      "som-zone-note",
      "som-shelf-note",
      "som-quote-strip",
      "som-footer"
    ],
    layoutMarkers: ["som-organizing-page", "som-organizing-header", "som-organizing-hero", "som-organizing-photo", "som-shelf-map", "som-reset-proof", "som-shelf-card", "som-reset-step", "som-shelf-note", "som-quote-strip"],
    guidance: "Use a split hero with a real organized shelf photo, zone-board proof, home-use package cards, and photo-plan quote flow."
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
    archetype: "Recurring care route schedule board",
    hero: "cover-left-copy-with-route-status-board",
    sectionOrder: [
      "route-header",
      "route-hero",
      "care-area-panel",
      "service-plan-cards",
      "route-process",
      "proof-board",
      "join-route-quote"
    ],
    navigationTreatment: "horizontal-route-header-with-care-routes-notes-plan-anchors",
    typographyTreatment: "schedule-board-service-sans",
    colorStrategy: "route-map-colors-with-readable-plan-contrast",
    servicePresentation: "plan-cards-with-route-area-note",
    proofTreatment: "route-proof-cards-on-status-field",
    ctaRhythm: "hero-join-route-plus-centered-final-route-card",
    navLabels: ["Care routes", "Plant notes", "Plan"],
    anchorOrder: ["services", "process", "quote"],
    componentClassesExpected: [
      "som-card",
      "som-route-plan-card",
      "som-process-card",
      "som-route-process-card",
      "som-proof-card",
      "som-route-proof-card",
      "som-quote-card",
      "som-route-quote-card",
      "som-footer",
      "som-route-footer"
    ],
    layoutMarkers: ["wp:cover", "som-route-plan-card", "som-route-process-card", "som-route-proof-card", "som-route-quote-card"],
    guidance: "Lead with route days and schedule confidence, show a CSS-styled service-area panel instead of an external map, then use plan and proof sections around a join-the-route CTA."
  },
  "lawn-route-status-board": {
    label: "Lawn route status board",
    bestFor: ["lawn care"],
    archetype: "Lawn-specific route status board",
    hero: "split-copy-photo-with-floating-route-status-board",
    sectionOrder: [
      "route-header",
      "route-hero",
      "route-plan-area-panel",
      "service-plan-cards",
      "visit-notes-table",
      "proof-board",
      "join-route-quote"
    ],
    navigationTreatment: "sticky-route-utility-header-with-phone-action",
    typographyTreatment: "clear-route-dashboard-sans",
    colorStrategy: "field-board-neutrals-with-sun-action-and-status-greens",
    servicePresentation: "lawn-plan-cards-with-route-area-note",
    proofTreatment: "lawn-route-proof-cards-on-dark-status-field",
    ctaRhythm: "hero-join-lawn-route-plus-centered-final-route-card",
    navLabels: ["Routes", "Visit notes", "Join"],
    anchorOrder: ["routes", "notes", "quote"],
    componentClassesExpected: [
      "som-route-page",
      "som-route-header",
      "som-route-hero",
      "som-route-hero-photo",
      "som-route-status-board",
      "som-route-plan-card",
      "som-route-process-card",
      "som-route-proof-card",
      "som-route-table",
      "som-route-detail",
      "som-route-quote-card",
      "som-route-footer"
    ],
    layoutMarkers: ["som-route-hero", "som-route-status-board", "wp:table", "som-route-table", "wp:details", "som-route-plan-card", "som-route-process-card", "som-route-proof-card", "som-route-quote-card"],
    guidance: "Use for the refreshed lawn care page: lead with a real finished lawn image, a floating route board, service lane cards, visit-note table, and a join-the-route CTA."
  },
  "water-test-board": {
    label: "Water test board",
    bestFor: ["pool cleaning", "spa care", "fountain maintenance"],
    archetype: "Recurring water care test board",
    hero: "cover-photo-with-floating-water-test-board",
    sectionOrder: [
      "split-action-header",
      "pool-cover-hero",
      "chemistry-proof-strip",
      "service-lane-plans",
      "route-day-board",
      "final-water-check-quote",
      "footer"
    ],
    navigationTreatment: "split-nav-action-header-with-route-and-water-anchors",
    typographyTreatment: "clean-water-dashboard-sans",
    colorStrategy: "clear-water-aqua-with-sun-test-strip-accent",
    servicePresentation: "service-lane-plan-cards-with-water-status-bars",
    proofTreatment: "chemistry-test-strip-proof-rail",
    ctaRhythm: "hero-start-service-plus-route-day-final-quote",
    navLabels: ["Plans", "Water", "Quote"],
    anchorOrder: ["plans", "water", "quote"],
    componentClassesExpected: [
      "som-water-page",
      "som-water-header",
      "som-water-hero",
      "som-water-board",
      "som-water-mini-board",
      "som-water-proof",
      "som-water-plan",
      "som-water-route-step",
      "som-water-note",
      "som-quote-strip",
      "som-footer"
    ],
    layoutMarkers: ["som-water-page", "som-water-header", "som-water-hero", "som-water-board", "som-water-mini-board", "som-water-proof", "som-water-plan", "som-water-route-step", "som-water-note", "som-quote-strip"],
    guidance: "Use a pool-photo cover hero with a floating water test board, chemistry proof strip, recurring service lanes, route-day notes, and a start-weekly-service CTA."
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
    archetype: "Seasonal checklist service with date pressure",
    hero: "dusk-install-photo-with-reserve-date-board",
    sectionOrder: [
      "utility-action-header",
      "urgent-install-hero",
      "seasonal-proof-strip",
      "install-scope-checklist",
      "safety-process-board",
      "objection-details",
      "reserve-date-footer"
    ],
    navigationTreatment: "utility-header-with-urgent-cta-and-short-anchors",
    typographyTreatment: "urgent-utility-checklist",
    colorStrategy: "alert-ready-contrast-with-controlled-warning-color",
    servicePresentation: "install-checklist-cards-with-reserve-date-board",
    proofTreatment: "seasonal-safety-proof-strip-before-scope",
    ctaRhythm: "hero-reserve-date-plus-final-removal-plan-quote",
    navLabels: ["Install", "Safety", "Dates"],
    anchorOrder: ["install", "safety", "quote"],
    componentClassesExpected: [
      "som-urgent-page",
      "som-urgent-header",
      "som-urgent-hero",
      "som-urgent-photo",
      "som-date-board",
      "som-urgent-proof",
      "som-urgent-card",
      "som-urgent-step",
      "som-urgent-faq",
      "som-quote-strip",
      "som-footer"
    ],
    layoutMarkers: ["som-urgent-page", "som-urgent-header", "som-urgent-hero", "som-urgent-photo", "som-date-board", "som-urgent-proof", "som-urgent-card", "som-urgent-step", "som-urgent-faq", "som-quote-strip"],
    guidance: "Use a problem checklist beside the service image, then warning signs, packages, safety proof, service area, and repeated availability CTAs."
  },
  "story-card-consult": {
    label: "Story card consult",
    bestFor: ["senior downsizing", "interior color consulting", "home organization", "micro-wedding florals"],
    archetype: "Warm consultation story card flow",
    hero: "stacked-trust-hero-with-story-checklist-panel",
    sectionOrder: [
      "calm-consult-header",
      "story-card-hero",
      "trust-proof-band",
      "support-checklist",
      "gentle-process-steps",
      "consult-footer"
    ],
    navigationTreatment: "calm-top-header-with-low-pressure-consult-action",
    typographyTreatment: "warm-story-card-serif-sans",
    colorStrategy: "gentle-human-neutrals-with-small-confident-accent",
    servicePresentation: "support-checklist-cards-with-family-notes",
    proofTreatment: "trust-proof-strip-before-support-cards",
    ctaRhythm: "hero-consult-plus-midpage-trust-band",
    navLabels: ["Checklist", "Proof", "Quote"],
    anchorOrder: ["checklist", "proof", "quote"],
    componentClassesExpected: ["som-checklist-hero", "som-story-hero", "som-urgency-band", "som-story-proof-band", "som-check-card", "som-support-card", "som-proof-card", "som-family-proof-card", "som-quote-strip", "som-consult-quote-strip", "som-footer"],
    layoutMarkers: ["som-story-hero", "som-story-proof-band", "som-support-card", "som-consult-quote-strip"],
    guidance: "Use warmer editorial pacing: what happens next, support cards, packages, proof, and gentle consult CTAs at the hero, midpoint, and close."
  },
  "turnover-receipt-board": {
    label: "Turnover receipt board",
    bestFor: ["vacation rental turnover", "move-out cleaning", "rental reset"],
    archetype: "Hospitality turnover scope receipt",
    hero: "media-text-hero-with-turnover-receipt-stack",
    sectionOrder: [
      "receipt-action-header",
      "turnover-receipt-hero",
      "hospitality-proof-ledger",
      "scope-table-and-reset-cards",
      "linen-process-with-quote",
      "details-objection-stack",
      "coverage-instructions"
    ],
    navigationTreatment: "compact-top-nav-with-coverage-phone-button",
    typographyTreatment: "hospitality-receipt-mono-accent",
    colorStrategy: "clean-linen-receipt-with-ready-room-stamps",
    servicePresentation: "turnover-receipt-cards-plus-readable-scope-table",
    proofTreatment: "ledger-proof-strip-and-cleaning-quote",
    ctaRhythm: "hero-get-coverage-plus-phone-header-and-final-instructions",
    navLabels: ["Checklist", "Readiness", "Coverage"],
    anchorOrder: ["scope", "safety", "quote"],
    componentClassesExpected: [
      "som-receipt-page",
      "som-turnover-page",
      "som-receipt-header",
      "som-turnover-header",
      "som-turnover-header-action",
      "som-turnover-hero-shell",
      "som-receipt-hero",
      "som-turnover-hero",
      "som-receipt-card",
      "som-turnover-card",
      "som-host-proof-strip",
      "som-receipt-proof",
      "som-host-proof",
      "som-receipt-scope",
      "som-turnover-scope",
      "som-receipt-table",
      "som-turnover-table",
      "som-turnover-safety",
      "som-receipt-step",
      "som-turnover-step",
      "som-turnover-details",
      "som-receipt-detail",
      "som-turnover-detail",
      "som-quote-strip",
      "som-footer"
    ],
    layoutMarkers: ["som-turnover-page", "som-turnover-header", "som-turnover-hero-shell", "wp:media-text", "som-turnover-hero", "som-turnover-card", "som-host-proof-strip", "wp:table", "som-turnover-table", "wp:quote", "wp:details", "som-turnover-detail", "som-quote-strip"],
    guidance: "Frame rental turnover as a receipt-style coverage board with linens, restock notes, host proof, and coverage CTAs."
  },
  "service-receipt-stack": {
    label: "Service receipt stack",
    bestFor: ["solar panel cleaning", "window cleaning", "carpet cleaning", "mobile detailing", "vacation rental turnover"],
    archetype: "Receipt-led service scope and safety plan",
    hero: "media-text-hero-with-estimate-receipt-stack",
    sectionOrder: [
      "receipt-action-header",
      "media-text-receipt-hero",
      "proof-ledger-strip",
      "scope-table-and-receipts",
      "safety-process-with-quote",
      "details-objection-stack",
      "final-estimate-instructions"
    ],
    navigationTreatment: "compact-top-nav-with-phone-button",
    typographyTreatment: "receipt-scope-mono-accent",
    colorStrategy: "clean-paper-receipt-with-service-color-stamps",
    servicePresentation: "receipt-cards-plus-readable-scope-table",
    proofTreatment: "ledger-proof-strip-and-safety-quote",
    ctaRhythm: "hero-build-estimate-plus-phone-header-and-final-instructions",
    navLabels: ["Scope", "Safety", "Quote"],
    anchorOrder: ["scope", "safety", "quote"],
    componentClassesExpected: [
      "som-receipt-page",
      "som-receipt-header",
      "som-receipt-hero",
      "som-receipt-card",
      "som-receipt-proof",
      "som-receipt-scope",
      "som-receipt-table",
      "som-receipt-step",
      "som-receipt-detail",
      "som-quote-strip",
      "som-footer"
    ],
    layoutMarkers: ["som-receipt-page", "som-receipt-header", "wp:media-text", "som-receipt-hero", "som-receipt-card", "wp:table", "som-receipt-table", "wp:quote", "wp:details", "som-receipt-detail", "som-quote-strip"],
    guidance: "Frame the hero around a receipt-style scope summary, then included services, add-ons, process, proof, and a build-my-estimate CTA."
  },
  "workshop-bench": {
    label: "Workshop bench",
    bestFor: ["deck staining", "fence staining", "furniture refinishing", "knife sharpening", "mobile bicycle repair", "mural painting", "window lettering"],
    archetype: "Craft-forward workshop bench service",
    hero: "wide-craft-photo-with-bench-ticket-and-side-labels",
    sectionOrder: [
      "compact-workshop-header",
      "craft-bench-hero",
      "material-proof-rail",
      "wood-scope-bench",
      "craft-process-stack",
      "care-note-quote",
      "footer"
    ],
    navigationTreatment: "side-top-hybrid-with-craft-forward-work-method-quote-labels",
    typographyTreatment: "craft-bench-sturdy-serif-sans",
    colorStrategy: "workshop-material-tones-with-tool-accent",
    servicePresentation: "wood-scope-cards-with-material-bench-note",
    proofTreatment: "material-proof-rail-with-craft-stats",
    ctaRhythm: "hero-send-photo-plus-final-care-note-quote",
    navLabels: ["Wood", "Process", "Quote"],
    anchorOrder: ["wood", "process", "quote"],
    componentClassesExpected: [
      "som-workshop-page",
      "som-workshop-header",
      "som-workshop-hero",
      "som-workshop-photo",
      "som-workshop-ticket",
      "som-material-proof",
      "som-wood-card",
      "som-care-note",
      "som-craft-step",
      "som-quote-strip",
      "som-footer"
    ],
    layoutMarkers: ["som-workshop-page", "som-workshop-header", "som-workshop-hero", "som-workshop-photo", "som-workshop-ticket", "som-material-proof", "som-wood-card", "som-care-note", "som-craft-step", "som-quote-strip"],
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
  "pet-portrait-gallery": galleryAlias({
    prefix: "pet",
    label: "Pet portrait gallery",
    bestFor: ["pet portrait photography", "animal studio portraits"],
    archetype: "Pet portrait proof gallery",
    hero: "studio-pet-portrait-hero-with-gallery-proof-card",
    sectionOrder: ["portrait-header", "pet-gallery-hero", "personality-proof-strip", "session-style-cards", "pet-day-process", "portrait-inquiry-footer"],
    navigationTreatment: "minimal-gallery-nav-with-session-and-date-anchors",
    typographyTreatment: "warm-portrait-serif-with-playful-labels",
    colorStrategy: "studio-paper-neutrals-with-collar-color-action",
    servicePresentation: "session-style-cards-with-personality-captions",
    proofTreatment: "portrait-proof-strip-with-pet-comfort-cues",
    ctaRhythm: "hero-plan-portrait-plus-final-session-inquiry",
    navLabels: ["Sessions", "Prep", "Date"],
    anchorOrder: ["styles", "process", "quote"],
    guidance: "Use a portrait-led gallery hero, personality-based session cards, pet-comfort proof, prep steps, and a plan-a-portrait-day CTA."
  }),
  "street-food-menu-board": menuAlias({
    prefix: "streetfood",
    label: "Street food menu board",
    bestFor: ["wood-fired pizza catering", "taco pop-up catering"],
    archetype: "Live-fire catering menu board",
    hero: "live-fire-service-photo-with-event-menu-ticket",
    sectionOrder: ["flame-menu-header", "live-catering-hero", "host-proof-strip", "menu-sample-board", "event-fit-flow", "feed-the-event-footer"],
    navigationTreatment: "menu-utility-header-with-menu-events-date-anchors",
    typographyTreatment: "bold-street-food-display-with-readable-menu-body",
    colorStrategy: "charcoal-paper-with-flame-and-citrus-action",
    servicePresentation: "sample-menu-cards-with-setup-ticket",
    proofTreatment: "event-host-proof-strip-under-live-service-hero",
    ctaRhythm: "hero-feed-event-plus-menu-selection-and-date-check",
    navLabels: ["Menu", "Events", "Date"],
    anchorOrder: ["packages", "events", "quote"],
    guidance: "Frame catering around a live setup photo, menu samples, service footprint, guest-count notes, and date-check CTAs."
  }),
  "dessert-table-gallery": galleryAlias({
    prefix: "dessert",
    label: "Dessert table gallery",
    bestFor: ["dessert table catering", "bakery catering"],
    archetype: "Celebration dessert table gallery",
    hero: "dessert-table-proof-hero-with-flavor-gallery-note",
    sectionOrder: ["sweet-gallery-header", "dessert-gallery-hero", "flavor-proof-strip", "table-style-cards", "design-process-panel", "dessert-inquiry-footer"],
    navigationTreatment: "soft-gallery-nav-with-flavors-process-date-anchors",
    typographyTreatment: "bakery-editorial-serif-with-clean-menu-labels",
    colorStrategy: "frosted-paper-with-berry-and-gold-action",
    servicePresentation: "dessert-style-cards-with-flavor-caption-panel",
    proofTreatment: "celebration-proof-strip-before-style-cards",
    ctaRhythm: "hero-design-table-plus-final-flavor-brief",
    navLabels: ["Styles", "Flavors", "Date"],
    anchorOrder: ["styles", "process", "quote"],
    guidance: "Use the dessert table as the first proof moment, then flavor/style cards, design steps, serving notes, and a date inquiry."
  }),
  "balloon-backdrop-gallery": galleryAlias({
    prefix: "balloon",
    label: "Balloon backdrop gallery",
    bestFor: ["balloon garland styling", "party backdrop styling"],
    archetype: "Party backdrop gallery proof",
    hero: "colorful-backdrop-hero-with-install-proof-card",
    sectionOrder: ["party-gallery-header", "backdrop-gallery-hero", "install-proof-strip", "backdrop-package-cards", "setup-process-panel", "party-date-footer"],
    navigationTreatment: "gallery-nav-with-backdrops-packages-date-anchors",
    typographyTreatment: "playful-event-display-with-utility-sans",
    colorStrategy: "confetti-pastel-field-with-bold-party-action",
    servicePresentation: "backdrop-package-cards-with-color-plan-captions",
    proofTreatment: "install-proof-strip-with-teardown-and-space-cues",
    ctaRhythm: "hero-style-party-plus-final-date-check",
    navLabels: ["Backdrops", "Setup", "Date"],
    anchorOrder: ["styles", "process", "quote"],
    guidance: "Lead with a joyful backdrop image, show packages by scale, include setup/teardown proof, and ask for date, venue, and color notes."
  }),
  "micro-wedding-floral-story": storyAlias({
    prefix: "floral",
    label: "Micro-wedding floral story",
    bestFor: ["micro-wedding florals", "small wedding flowers"],
    archetype: "Intimate floral consultation flow",
    hero: "romantic-floral-story-hero-with-date-checklist",
    sectionOrder: ["quiet-floral-header", "floral-story-hero", "date-trust-proof-band", "bouquet-support-cards", "floral-process-steps", "date-consult-footer"],
    navigationTreatment: "quiet-top-header-with-floral-date-action",
    typographyTreatment: "romantic-editorial-serif-with-calm-planning-sans",
    colorStrategy: "soft-petal-neutrals-with-stem-green-and-coral-action",
    servicePresentation: "bouquet-and-installation-cards-with-date-notes",
    proofTreatment: "date-and-style-proof-strip-before-packages",
    ctaRhythm: "hero-ask-date-plus-midpage-style-proof",
    navLabels: ["Florals", "Process", "Date"],
    anchorOrder: ["checklist", "proof", "quote"],
    guidance: "Use a calm consult flow for bouquets, personals, and small installations with date, palette, venue, and setup proof."
  }),
  "photo-booth-strip-packages": fixedActionAlias({
    prefix: "booth",
    label: "Photo booth strip packages",
    bestFor: ["photo booth rental", "event photo strips"],
    archetype: "Event booth booking dashboard",
    hero: "photo-strip-hero-with-mobile-booking-dock",
    sectionOrder: ["booth-booking-header", "photo-strip-hero", "guest-proof-strip", "booth-package-cards", "setup-route-board", "reserve-booth-footer", "mobile-booth-dock"],
    navigationTreatment: "desktop-package-nav-with-mobile-reserve-booth-dock",
    typographyTreatment: "flash-card-event-ui-sans",
    colorStrategy: "black-white-photo-strip-with-flash-color-action",
    servicePresentation: "booth-package-cards-with-prop-and-print-notes",
    proofTreatment: "guest-flow-proof-strip-after-hero",
    ctaRhythm: "hero-reserve-booth-plus-mobile-fixed-date-call-dock",
    navLabels: ["Booths", "Setup", "Reserve"],
    anchorOrder: ["packages", "process", "quote"],
    guidance: "Make the mobile action dock feel like a reserve-date tool while desktop emphasizes packages, props, setup needs, and guest flow."
  }),
  "soundcheck-console": sideRailAlias({
    prefix: "sound",
    label: "Soundcheck console",
    bestFor: ["small-event DJ", "event sound service"],
    archetype: "Small-event sound side-rail console",
    hero: "desktop-side-rail-with-soundcheck-action-hero",
    sectionOrder: ["sound-rail", "soundcheck-hero", "event-vibe-proof-strip", "sound-package-cards", "setup-process-console", "date-check-footer"],
    navigationTreatment: "desktop-dj-side-rail-with-vibe-setup-date-anchors",
    typographyTreatment: "rhythmic-event-console-sans-with-mono-cues",
    colorStrategy: "night-console-neutrals-with-signal-lime-action",
    servicePresentation: "sound-package-cards-with-setup-footprint-note",
    proofTreatment: "event-vibe-proof-strip-under-sound-hero",
    ctaRhythm: "persistent-date-check-rail-plus-final-sound-plan",
    navLabels: ["Vibe", "Setup", "Date"],
    anchorOrder: ["services", "process", "quote"],
    guidance: "Use a side rail like a sound console, then show event fit, setup footprint, playlist tone, reviews, and date-check actions."
  }),
  "picnic-proposal-lookbook": galleryAlias({
    prefix: "picnic",
    label: "Picnic proposal lookbook",
    bestFor: ["picnic setup", "proposal setup"],
    archetype: "Styled picnic lookbook lead flow",
    hero: "styled-picnic-hero-with-occasion-proof-card",
    sectionOrder: ["lookbook-header", "picnic-gallery-hero", "occasion-proof-strip", "setup-style-cards", "arrival-process-panel", "proposal-plan-footer"],
    navigationTreatment: "lookbook-top-nav-with-occasions-setup-date-anchors",
    typographyTreatment: "airy-romantic-display-with-practical-sans",
    colorStrategy: "sunset-linen-neutrals-with-rose-action",
    servicePresentation: "occasion-style-cards-with-add-on-captions",
    proofTreatment: "arrival-and-weather-proof-strip-before-packages",
    ctaRhythm: "hero-plan-setup-plus-final-date-location-brief",
    navLabels: ["Looks", "Setup", "Date"],
    anchorOrder: ["styles", "process", "quote"],
    guidance: "Treat the layout like a lookbook, then ground it with access, weather, timing, and what to send for the proposal plan."
  }),
  "mocktail-cart-menu": menuAlias({
    prefix: "mocktail",
    label: "Mocktail cart menu",
    bestFor: ["mocktail cart", "beverage cart events"],
    archetype: "Beverage cart menu board",
    hero: "citrus-cart-hero-with-drink-menu-ticket",
    sectionOrder: ["beverage-menu-header", "mocktail-cart-hero", "sip-proof-strip", "drink-package-board", "event-service-flow", "build-bar-footer"],
    navigationTreatment: "menu-header-with-drinks-events-date-anchors",
    typographyTreatment: "fresh-hospitality-menu-sans-with-script-like-display",
    colorStrategy: "citrus-cream-with-mint-and-tonic-action",
    servicePresentation: "drink-package-cards-with-garnish-and-glassware-notes",
    proofTreatment: "guest-service-proof-strip-under-cart-hero",
    ctaRhythm: "hero-build-bar-plus-drink-package-and-date-check",
    navLabels: ["Drinks", "Events", "Date"],
    anchorOrder: ["packages", "events", "quote"],
    guidance: "Make the cart, citrus, garnish, and guest flow visible, then use drink package cards and a date/build-my-bar CTA."
  }),
  "headshot-proof-gallery": galleryAlias({
    prefix: "headshot",
    label: "Headshot proof gallery",
    bestFor: ["headshot photography", "brand photography"],
    archetype: "Professional headshot proof gallery",
    hero: "studio-headshot-hero-with-brand-proof-card",
    sectionOrder: ["studio-proof-header", "headshot-gallery-hero", "confidence-proof-strip", "session-package-cards", "prep-process-panel", "consult-footer"],
    navigationTreatment: "studio-gallery-nav-with-sessions-prep-consult-anchors",
    typographyTreatment: "polished-brand-editorial-sans",
    colorStrategy: "studio-neutral-paper-with-camera-blue-action",
    servicePresentation: "session-package-cards-with-usage-captions",
    proofTreatment: "confidence-proof-strip-before-prep",
    ctaRhythm: "hero-book-consult-plus-final-session-prep",
    navLabels: ["Sessions", "Prep", "Consult"],
    anchorOrder: ["styles", "process", "quote"],
    guidance: "Lead with credible studio portrait proof, then packages, usage cases, prep notes, and a consult booking CTA."
  }),
  "mural-lettering-workshop": workshopAlias({
    prefix: "mural",
    label: "Mural lettering workshop",
    bestFor: ["mural artist", "window lettering artist"],
    archetype: "Paint-and-lettering workshop proof",
    hero: "storefront-lettering-hero-with-project-ticket",
    sectionOrder: ["lettering-workshop-header", "paint-proof-hero", "surface-proof-rail", "wall-window-scope-bench", "install-process-stack", "project-photo-quote", "footer"],
    navigationTreatment: "side-top-hybrid-with-surfaces-process-project-anchors",
    typographyTreatment: "handcrafted-lettering-display-with-clean-shop-sans",
    colorStrategy: "paint-shop-neutrals-with-signmaker-red-action",
    servicePresentation: "surface-scope-cards-with-project-ticket-note",
    proofTreatment: "surface-proof-rail-with-visibility-stats",
    ctaRhythm: "hero-start-wall-window-plus-final-photo-quote",
    navLabels: ["Surfaces", "Process", "Project"],
    anchorOrder: ["wood", "process", "quote"],
    guidance: "Use a craft-bench structure for paint surfaces, storefront constraints, sketch-to-install steps, and photo/project CTAs."
  }),
  "color-consult-story": storyAlias({
    prefix: "color",
    label: "Color consult story",
    bestFor: ["interior color consultant", "paint palette consultant"],
    archetype: "Interior palette consultation flow",
    hero: "palette-consult-hero-with-room-story-checklist",
    sectionOrder: ["palette-consult-header", "color-story-hero", "room-proof-band", "palette-support-cards", "sample-process-steps", "palette-footer"],
    navigationTreatment: "calm-top-header-with-room-palette-consult-action",
    typographyTreatment: "interior-editorial-serif-with-architectural-sans",
    colorStrategy: "warm-room-neutrals-with-swatch-accent-action",
    servicePresentation: "palette-support-cards-with-room-use-notes",
    proofTreatment: "room-proof-strip-before-consult-steps",
    ctaRhythm: "hero-choose-palette-plus-final-room-brief",
    navLabels: ["Rooms", "Process", "Palette"],
    anchorOrder: ["checklist", "proof", "quote"],
    guidance: "Use a calm story flow around rooms, light, samples, finishes, and what the client should send before a palette consult."
  }),
  "furniture-refinish-proof": beforeAfterAlias({
    prefix: "furniture",
    label: "Furniture refinish proof",
    bestFor: ["furniture refinishing", "furniture repair"],
    archetype: "Furniture restoration before-and-after proof",
    hero: "split-restoration-hero-with-detail-photo-and-estimate-card",
    sectionOrder: ["restoration-header", "split-restoration-hero", "send-photo-estimate-strip", "repair-surface-rows", "finish-method-panel", "care-timeline", "restoration-proof-footer"],
    navigationTreatment: "top-header-with-send-photo-and-finish-method-anchors",
    typographyTreatment: "restoration-craft-serif-with-shop-sans",
    colorStrategy: "warm-wood-neutrals-with-brass-repair-action",
    servicePresentation: "repair-and-finish-rows-with-material-pills",
    proofTreatment: "detail-proof-grid-inside-final-restoration-cta",
    ctaRhythm: "early-send-photo-strip-plus-final-care-proof-quote",
    navLabels: ["Photo quote", "Repairs", "Finish"],
    anchorOrder: ["quote", "surfaces", "method"],
    guidance: "Use before/after proof for worn pieces, then repair rows, finish methods, care notes, and a send-a-furniture-photo CTA."
  }),
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

export function renderFamilyForVariant(variant) {
  return RENDER_FAMILY_BY_LAYOUT[variant] || variant;
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
  const pattern = spec.pattern || {};
  const visualDifferentiator = archetype.visualDifferentiator
    || archetype.signatureMove
    || archetype.guidance
    || `${archetype.hero}; ${archetype.servicePresentation}; ${archetype.proofTreatment}`;

  if (!archetype.archetype) {
    throw new Error(`Layout variant is cataloged but not implemented yet: ${variant}`);
  }

  return {
    version: 1,
    variant,
    renderFamily: renderFamilyForVariant(variant),
    visualDifferentiator,
    archetype: archetype.archetype,
    hero: archetype.hero,
    navigationTreatment: archetype.navigationTreatment,
    typographyTreatment: archetype.typographyTreatment,
    colorStrategy: archetype.colorStrategy,
    primaryPattern: pattern.primaryPattern,
    secondaryPattern: pattern.secondaryPattern,
    silhouette: pattern.silhouette,
    navigationPrimitive: pattern.navigationPrimitive,
    mobileActionPattern: pattern.mobileActionPattern,
    imageRole: pattern.imageRole,
    imageEvidence: pattern.imageEvidence,
    ctaRhythmPattern: pattern.ctaRhythm,
    surfaceFamily: pattern.surfaceFamily,
    surfaceModel: pattern.surfaceModel,
    styleFamily: pattern.styleFamily,
    density: pattern.density,
    colorRoles: pattern.colorRoles,
    geometry: pattern.geometry,
    coreBlockPlan: pattern.coreBlockPlan,
    styleContract: pattern.styleContract,
    knownRisks: pattern.knownRisks,
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
