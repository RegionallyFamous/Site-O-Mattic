import {
  layoutArchetypeFor,
  layoutVariantFor,
  renderFamilyForVariant
} from "./layout-archetypes.mjs";

function renderVariantForSpec(spec) {
  return renderFamilyForVariant(layoutVariantFor(spec));
}

export function buildGlobalStyles(spec) {
  const tokens = buildDesignTokens(spec);
  const p = spec.palette;

  return {
    version: 3,
    isGlobalStylesUserThemeJSON: true,
    settings: {
      appearanceTools: true,
      useRootPaddingAwareAlignments: true,
      border: {
        color: true,
        radius: true,
        style: true,
        width: true
      },
      color: {
        custom: false,
        customDuotone: false,
        customGradient: true,
        defaultGradients: false,
        defaultPalette: false,
        gradients: tokens.gradients,
        link: true,
        palette: tokens.palette
      },
      layout: {
        contentSize: "760px",
        wideSize: "1180px"
      },
      spacing: {
        blockGap: true,
        customSpacingSize: false,
        defaultSpacingSizes: false,
        spacingSizes: tokens.spacingSizes,
        units: ["px", "rem", "%", "vw", "vh"]
      },
      shadow: {
        defaultPresets: false,
        presets: tokens.shadowPresets
      },
      typography: {
        customFontSize: false,
        fluid: true,
        fontFamilies: tokens.fontFamilies,
        fontSizes: tokens.fontSizes,
        fontStyle: true,
        fontWeight: true,
        letterSpacing: true,
        lineHeight: true,
        textDecoration: true,
        textTransform: true
      },
      custom: {
        som: {
          measure: {
            tight: "52ch",
            copy: "66ch"
          },
          radius: tokens.radii,
          shadow: tokens.shadows,
          colorStrategy: tokens.colorStrategy,
          pattern: spec.pattern,
          type: tokens.typography.custom
        }
      }
    },
    styles: {
      color: {
        background: p.cream,
        text: p.deepGreen
      },
      css: buildSharedPolishCss(spec),
      spacing: {
        blockGap: "var:preset|spacing|40"
      },
      typography: {
        fontFamily: `var:preset|font-family|${tokens.typography.bodyFontSlug}`,
        fontSize: "var:preset|font-size|body",
        lineHeight: tokens.typography.bodyLineHeight
      },
      elements: {
        link: {
          color: {
            text: p.grass
          },
          typography: {
            textDecoration: "none",
            fontFamily: `var:preset|font-family|${tokens.typography.accentFontSlug}`,
            fontWeight: tokens.typography.linkWeight
          },
          ":hover": {
            color: {
              text: p.deepGreen
            },
            typography: {
              textDecoration: "underline"
            }
          },
          ":focus": {
            outline: {
              color: p.sun,
              offset: "4px",
              style: "solid",
              width: "3px"
            }
          }
        },
        button: {
          border: {
            radius: "999px"
          },
          color: {
            background: p.sun,
            text: p.deepGreen
          },
          typography: {
            fontFamily: `var:preset|font-family|${tokens.typography.accentFontSlug}`,
            fontWeight: tokens.typography.actionWeight
          }
        }
      },
      blocks: {
        "core/button": {
          typography: {
            fontFamily: `var:preset|font-family|${tokens.typography.accentFontSlug}`,
            fontWeight: tokens.typography.actionWeight
          }
        },
        "core/buttons": {
          spacing: {
            blockGap: "var:preset|spacing|30"
          }
        },
        "core/columns": {
          spacing: {
            blockGap: "var:preset|spacing|50"
          }
        },
        "core/details": {
          border: {
            color: p.mist,
            radius: "var:preset|spacing|20",
            width: "1px"
          },
          spacing: {
            padding: {
              top: "var:preset|spacing|40",
              right: "var:preset|spacing|40",
              bottom: "var:preset|spacing|40",
              left: "var:preset|spacing|40"
            }
          }
        },
        "core/gallery": {
          spacing: {
            blockGap: "var:preset|spacing|30"
          }
        },
        "core/group": {
          spacing: {
            blockGap: "var:preset|spacing|40"
          }
        },
        "core/heading": {
          typography: {
            fontFamily: `var:preset|font-family|${tokens.typography.displayFontSlug}`,
            fontWeight: tokens.typography.headingWeight,
            lineHeight: tokens.typography.headingLineHeight
          }
        },
        "core/image": {
          border: {
            radius: "var(--wp--custom--som--radius--image)"
          }
        },
        "core/list": {
          spacing: {
            padding: {
              left: "1.25em"
            }
          }
        },
        "core/media-text": {
          spacing: {
            blockGap: "var:preset|spacing|60"
          }
        },
        "core/navigation": {
          typography: {
            fontFamily: `var:preset|font-family|${tokens.typography.accentFontSlug}`,
            fontSize: "var:preset|font-size|small",
            fontWeight: tokens.typography.navWeight
          }
        },
        "core/pullquote": {
          border: {
            color: p.sun,
            style: "solid",
            width: "0 0 0 6px"
          },
          typography: {
            fontFamily: `var:preset|font-family|${tokens.typography.displayFontSlug}`
          }
        },
        "core/quote": {
          border: {
            color: p.sun,
            style: "solid",
            width: "0 0 0 5px"
          },
          spacing: {
            padding: {
              left: "var:preset|spacing|40"
            }
          }
        },
        "core/table": {
          typography: {
            fontSize: "var:preset|font-size|small"
          }
        }
      }
    }
  };
}

export function buildDesignTokens(spec) {
  const p = spec.palette;
  const typography = buildTypographyTokens(spec);
  const colorStrategy = buildColorStrategyTokens(spec);
  return {
    palette: [
      ["grass", "Grass", p.grass],
      ["deep-green", "Deep Green", p.deepGreen],
      ["leaf", "Leaf", p.leaf],
      ["sun", "Sun", p.sun],
      ["cream", "Cream", p.cream],
      ["mist", "Mist", p.mist],
      ["soil", "Soil", p.soil],
      ["white", "White", p.white]
    ].map(([slug, name, color]) => ({ slug, name, color })),
    gradients: [
      {
        slug: "brand-sheen",
        name: "Brand Sheen",
        gradient: colorStrategy.brandGradient
      },
      {
        slug: "warm-flash",
        name: "Warm Flash",
        gradient: colorStrategy.highlightGradient
      }
    ],
    fontFamilies: typography.fontFamilies,
    fontSizes: typography.fontSizes,
    spacingSizes: [
      { slug: "20", name: "2XS", size: "0.5rem" },
      { slug: "30", name: "XS", size: "0.75rem" },
      { slug: "40", name: "S", size: "1rem" },
      { slug: "50", name: "M", size: "1.5rem" },
      { slug: "60", name: "L", size: "2.25rem" },
      { slug: "70", name: "XL", size: "3.5rem" },
      { slug: "80", name: "2XL", size: "5rem" }
    ],
    radii: {
      chip: "999px",
      card: "18px",
      panel: "24px",
      image: "28px"
    },
    shadows: {
      card: "0 16px 50px rgba(5,45,63,.08)",
      lift: "0 28px 80px rgba(5,45,63,.18)",
      button: "0 10px 24px rgba(5,45,63,.14)"
    },
    shadowPresets: [
      { slug: "card", name: "Card", shadow: "0 16px 50px rgba(5,45,63,.08)" },
      { slug: "lift", name: "Lift", shadow: "0 28px 80px rgba(5,45,63,.18)" },
      { slug: "button", name: "Button", shadow: "0 10px 24px rgba(5,45,63,.14)" }
    ],
    typography,
    colorStrategy: {
      name: layoutArchetypeFor(spec).colorStrategy,
      brandGradient: colorStrategy.brandGradient,
      highlightGradient: colorStrategy.highlightGradient
    }
  };
}

function buildTypographyTokens(spec) {
  const archetype = layoutArchetypeFor(spec);
  const treatment = archetype.typographyTreatment || "friendly-bold-route-sans";
  const stacks = {
    system: "Aptos, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Arial, sans-serif",
    humanist: "\"Avenir Next\", Avenir, \"Segoe UI\", \"Helvetica Neue\", Arial, sans-serif",
    warmHumanist: "Optima, Candara, \"Segoe UI\", Arial, sans-serif",
    friendly: "\"Gill Sans\", \"Trebuchet MS\", Calibri, Arial, sans-serif",
    editorial: "\"Hoefler Text\", \"Iowan Old Style\", \"Palatino Linotype\", Palatino, Georgia, serif",
    book: "Charter, \"Bitstream Charter\", \"Sitka Text\", Cambria, Georgia, serif",
    fashion: "Didot, \"Bodoni 72\", \"Bodoni MT\", Baskerville, Georgia, serif",
    slab: "Rockwell, \"American Typewriter\", Georgia, serif",
    typewriter: "\"American Typewriter\", Rockwell, Georgia, serif",
    geometric: "Futura, \"Century Gothic\", \"Avenir Next\", Arial, sans-serif",
    condensed: "\"DIN Alternate\", \"Aptos Narrow\", \"Arial Narrow\", \"Roboto Condensed\", Arial, sans-serif",
    sturdy: "\"Franklin Gothic Medium\", \"Aptos Display\", \"Segoe UI\", Arial, sans-serif",
    mono: "\"IBM Plex Mono\", \"SFMono-Regular\", Consolas, \"Liberation Mono\", Menlo, monospace",
    receipt: "\"Courier New\", \"SFMono-Regular\", Consolas, monospace"
  };
  const treatments = {
    "friendly-bold-route-sans": {
      body: stacks.system,
      display: stacks.geometric,
      accent: stacks.sturdy,
      scale: "generous",
      headingWeight: "780",
      actionWeight: "800",
      navWeight: "800",
      linkWeight: "800",
      headingLineHeight: "1.03",
      bodyLineHeight: "1.52"
    },
    "confident-transform-grotesk": {
      body: stacks.warmHumanist,
      display: stacks.sturdy,
      accent: stacks.condensed,
      scale: "bold",
      headingWeight: "820",
      actionWeight: "820",
      navWeight: "800",
      linkWeight: "800",
      headingLineHeight: "0.98",
      bodyLineHeight: "1.48"
    },
    "crisp-checklist-ui-sans": {
      body: stacks.system,
      display: stacks.sturdy,
      accent: stacks.mono,
      scale: "compact",
      headingWeight: "820",
      actionWeight: "800",
      navWeight: "800",
      linkWeight: "800",
      headingLineHeight: "1.04",
      bodyLineHeight: "1.5"
    },
    "sturdy-safety-sans": {
      body: stacks.system,
      display: stacks.condensed,
      accent: stacks.sturdy,
      scale: "bold",
      headingWeight: "820",
      actionWeight: "820",
      navWeight: "800",
      linkWeight: "800",
      headingLineHeight: "1",
      bodyLineHeight: "1.48"
    },
    "industrial-seasonal-condensed": {
      body: stacks.humanist,
      display: stacks.condensed,
      accent: stacks.mono,
      scale: "wide",
      headingWeight: "820",
      actionWeight: "800",
      navWeight: "800",
      linkWeight: "800",
      headingLineHeight: "0.98",
      bodyLineHeight: "1.48"
    },
    "soft-domestic-humanist": {
      body: stacks.warmHumanist,
      display: stacks.editorial,
      accent: stacks.friendly,
      scale: "soft",
      headingWeight: "660",
      actionWeight: "800",
      navWeight: "750",
      linkWeight: "750",
      headingLineHeight: "1.06",
      bodyLineHeight: "1.58"
    },
    "editorial-gallery-serif-display": {
      body: stacks.humanist,
      display: stacks.editorial,
      accent: stacks.sturdy,
      scale: "editorial",
      headingWeight: "660",
      actionWeight: "800",
      navWeight: "750",
      linkWeight: "750",
      headingLineHeight: "1.02",
      bodyLineHeight: "1.58"
    },
    "compact-operator-console": {
      body: stacks.system,
      display: stacks.condensed,
      accent: stacks.mono,
      scale: "compact",
      headingWeight: "820",
      actionWeight: "800",
      navWeight: "800",
      linkWeight: "800",
      headingLineHeight: "0.99",
      bodyLineHeight: "1.48"
    },
    "menu-board-display-sans": {
      body: stacks.humanist,
      display: stacks.geometric,
      accent: stacks.receipt,
      scale: "wide",
      headingWeight: "780",
      actionWeight: "800",
      navWeight: "800",
      linkWeight: "800",
      headingLineHeight: "0.98",
      bodyLineHeight: "1.52"
    },
    "mobile-action-ui-sans": {
      body: stacks.system,
      display: stacks.geometric,
      accent: stacks.sturdy,
      scale: "bold",
      headingWeight: "780",
      actionWeight: "820",
      navWeight: "800",
      linkWeight: "800",
      headingLineHeight: "0.98",
      bodyLineHeight: "1.48"
    },
    "clean-water-dashboard-sans": {
      body: stacks.system,
      display: stacks.geometric,
      accent: stacks.mono,
      scale: "generous",
      headingWeight: "760",
      actionWeight: "800",
      navWeight: "800",
      linkWeight: "800",
      headingLineHeight: "0.99",
      bodyLineHeight: "1.5"
    },
    "organized-grid-humanist-sans": {
      body: stacks.humanist,
      display: stacks.sturdy,
      accent: stacks.mono,
      scale: "compact",
      headingWeight: "780",
      actionWeight: "800",
      navWeight: "800",
      linkWeight: "800",
      headingLineHeight: "1",
      bodyLineHeight: "1.52"
    },
    "urgent-utility-checklist": {
      body: stacks.system,
      display: stacks.condensed,
      accent: stacks.mono,
      scale: "bold",
      headingWeight: "820",
      actionWeight: "820",
      navWeight: "800",
      linkWeight: "800",
      headingLineHeight: "0.99",
      bodyLineHeight: "1.5"
    },
    "craft-bench-sturdy-serif-sans": {
      body: stacks.warmHumanist,
      display: stacks.slab,
      accent: stacks.mono,
      scale: "compact",
      headingWeight: "700",
      actionWeight: "800",
      navWeight: "800",
      linkWeight: "800",
      headingLineHeight: "1",
      bodyLineHeight: "1.52"
    },
    "receipt-scope-mono-accent": {
      body: stacks.system,
      display: stacks.condensed,
      accent: stacks.receipt,
      scale: "compact",
      headingWeight: "800",
      actionWeight: "800",
      navWeight: "800",
      linkWeight: "800",
      headingLineHeight: "1.02",
      bodyLineHeight: "1.54"
    }
  };
  treatments["polished-consultant-editorial-sans"] = {
    body: stacks.warmHumanist,
    display: stacks.editorial,
    accent: stacks.mono,
    scale: "soft",
    headingWeight: "660",
    actionWeight: "800",
    navWeight: "800",
    linkWeight: "800",
    headingLineHeight: "1.03",
    bodyLineHeight: "1.58"
  };
  treatments["app-like-booking-ui"] = {
    body: stacks.system,
    display: stacks.geometric,
    accent: stacks.sturdy,
    scale: "bold",
    headingWeight: "780",
    actionWeight: "820",
    navWeight: "800",
    linkWeight: "800",
    headingLineHeight: "0.98",
    bodyLineHeight: "1.48"
  };
  treatments["sharp-craft-route-serif-sans"] = {
    body: stacks.humanist,
    display: stacks.slab,
    accent: stacks.mono,
    scale: "compact",
    headingWeight: "700",
    actionWeight: "800",
    navWeight: "800",
    linkWeight: "800",
    headingLineHeight: "1",
    bodyLineHeight: "1.52"
  };
  treatments["soft-systems-humanist-sans"] = {
    body: stacks.warmHumanist,
    display: stacks.geometric,
    accent: stacks.mono,
    scale: "soft",
    headingWeight: "760",
    actionWeight: "800",
    navWeight: "800",
    linkWeight: "800",
    headingLineHeight: "1.04",
    bodyLineHeight: "1.56"
  };
  treatments["schedule-board-service-sans"] = {
    body: stacks.system,
    display: stacks.condensed,
    accent: stacks.mono,
    scale: "generous",
    headingWeight: "800",
    actionWeight: "800",
    navWeight: "800",
    linkWeight: "800",
    headingLineHeight: "1",
    bodyLineHeight: "1.5"
  };
  treatments["warm-story-card-serif-sans"] = {
    body: stacks.warmHumanist,
    display: stacks.book,
    accent: stacks.friendly,
    scale: "editorial",
    headingWeight: "660",
    actionWeight: "800",
    navWeight: "750",
    linkWeight: "750",
    headingLineHeight: "1.04",
    bodyLineHeight: "1.62"
  };
  treatments["hospitality-receipt-mono-accent"] = {
    body: stacks.humanist,
    display: stacks.geometric,
    accent: stacks.receipt,
    scale: "compact",
    headingWeight: "780",
    actionWeight: "800",
    navWeight: "800",
    linkWeight: "800",
    headingLineHeight: "1.02",
    bodyLineHeight: "1.54"
  };
  treatments["playful-event-display-with-utility-sans"] = {
    body: stacks.friendly,
    display: stacks.geometric,
    accent: stacks.sturdy,
    scale: "soft",
    headingWeight: "780",
    actionWeight: "800",
    navWeight: "800",
    linkWeight: "800",
    headingLineHeight: "1",
    bodyLineHeight: "1.56"
  };
  treatments["bakery-editorial-serif-with-clean-menu-labels"] = {
    body: stacks.warmHumanist,
    display: stacks.fashion,
    accent: stacks.friendly,
    scale: "editorial",
    headingWeight: "620",
    actionWeight: "760",
    navWeight: "720",
    linkWeight: "720",
    headingLineHeight: "1.08",
    bodyLineHeight: "1.58"
  };
  treatments["restoration-craft-serif-with-shop-sans"] = {
    body: stacks.warmHumanist,
    display: stacks.typewriter,
    accent: stacks.mono,
    scale: "compact",
    headingWeight: "700",
    actionWeight: "800",
    navWeight: "800",
    linkWeight: "800",
    headingLineHeight: "1.02",
    bodyLineHeight: "1.54"
  };
  treatments["polished-brand-editorial-sans"] = {
    body: stacks.system,
    display: stacks.book,
    accent: stacks.condensed,
    scale: "soft",
    headingWeight: "660",
    actionWeight: "800",
    navWeight: "760",
    linkWeight: "760",
    headingLineHeight: "1.05",
    bodyLineHeight: "1.58"
  };
  treatments["interior-editorial-serif-with-architectural-sans"] = {
    body: stacks.warmHumanist,
    display: stacks.fashion,
    accent: stacks.condensed,
    scale: "editorial",
    headingWeight: "620",
    actionWeight: "740",
    navWeight: "700",
    linkWeight: "700",
    headingLineHeight: "1.08",
    bodyLineHeight: "1.58"
  };
  treatments["clear-route-dashboard-sans"] = {
    body: stacks.system,
    display: stacks.condensed,
    accent: stacks.mono,
    scale: "generous",
    headingWeight: "800",
    actionWeight: "800",
    navWeight: "800",
    linkWeight: "800",
    headingLineHeight: "1",
    bodyLineHeight: "1.5"
  };
  treatments["romantic-editorial-serif-with-calm-planning-sans"] = {
    body: stacks.warmHumanist,
    display: stacks.fashion,
    accent: stacks.friendly,
    scale: "editorial",
    headingWeight: "620",
    actionWeight: "780",
    navWeight: "740",
    linkWeight: "740",
    headingLineHeight: "1.05",
    bodyLineHeight: "1.62"
  };
  treatments["technical-bike-service-sans-with-compact-utility-labels"] = {
    body: stacks.system,
    display: stacks.sturdy,
    accent: stacks.mono,
    scale: "compact",
    headingWeight: "800",
    actionWeight: "760",
    navWeight: "740",
    linkWeight: "740",
    headingLineHeight: "1.05",
    bodyLineHeight: "1.56"
  };
  treatments["fresh-hospitality-menu-sans-with-script-like-display"] = {
    body: stacks.humanist,
    display: stacks.friendly,
    accent: stacks.receipt,
    scale: "soft",
    headingWeight: "780",
    actionWeight: "800",
    navWeight: "800",
    linkWeight: "800",
    headingLineHeight: "1.01",
    bodyLineHeight: "1.56"
  };
  treatments["handcrafted-lettering-display-with-clean-shop-sans"] = {
    body: stacks.humanist,
    display: stacks.typewriter,
    accent: stacks.condensed,
    scale: "wide",
    headingWeight: "700",
    actionWeight: "800",
    navWeight: "800",
    linkWeight: "800",
    headingLineHeight: "1",
    bodyLineHeight: "1.54"
  };
  treatments["warm-portrait-serif-with-playful-labels"] = {
    body: stacks.warmHumanist,
    display: stacks.book,
    accent: stacks.friendly,
    scale: "editorial",
    headingWeight: "640",
    actionWeight: "800",
    navWeight: "760",
    linkWeight: "760",
    headingLineHeight: "1.05",
    bodyLineHeight: "1.6"
  };
  treatments["flash-card-event-ui-sans"] = {
    body: stacks.system,
    display: stacks.geometric,
    accent: stacks.condensed,
    scale: "bold",
    headingWeight: "780",
    actionWeight: "820",
    navWeight: "800",
    linkWeight: "800",
    headingLineHeight: "0.98",
    bodyLineHeight: "1.48"
  };
  treatments["airy-romantic-display-with-practical-sans"] = {
    body: stacks.warmHumanist,
    display: stacks.fashion,
    accent: stacks.friendly,
    scale: "editorial",
    headingWeight: "600",
    actionWeight: "780",
    navWeight: "740",
    linkWeight: "740",
    headingLineHeight: "1.07",
    bodyLineHeight: "1.62"
  };
  treatments["rhythmic-event-console-sans-with-mono-cues"] = {
    body: stacks.system,
    display: stacks.condensed,
    accent: stacks.mono,
    scale: "wide",
    headingWeight: "820",
    actionWeight: "800",
    navWeight: "800",
    linkWeight: "800",
    headingLineHeight: "0.98",
    bodyLineHeight: "1.48"
  };
  treatments["bold-street-food-display-with-readable-menu-body"] = {
    body: stacks.humanist,
    display: stacks.sturdy,
    accent: stacks.receipt,
    scale: "bold",
    headingWeight: "820",
    actionWeight: "820",
    navWeight: "800",
    linkWeight: "800",
    headingLineHeight: "0.98",
    bodyLineHeight: "1.5"
  };
  treatments["quiet-trust-consulting-sans"] = {
    body: stacks.warmHumanist,
    display: stacks.book,
    accent: stacks.friendly,
    scale: "soft",
    headingWeight: "660",
    actionWeight: "780",
    navWeight: "740",
    linkWeight: "740",
    headingLineHeight: "1.05",
    bodyLineHeight: "1.62"
  };
  treatments["portfolio-editorial-display"] = treatments["editorial-gallery-serif-display"];
  treatments["bold-proof-before-after"] = treatments["confident-transform-grotesk"];
  treatments["event-menu-board-sans"] = treatments["menu-board-display-sans"];
  const voice = normalizeTypographyVoice(treatments[treatment] || treatments["friendly-bold-route-sans"]);

  return {
    treatment,
    bodyFontSlug: "body",
    displayFontSlug: "display",
    accentFontSlug: "accent",
    bodyLineHeight: voice.bodyLineHeight,
    headingLineHeight: voice.headingLineHeight,
    headingWeight: voice.headingWeight,
    actionWeight: voice.actionWeight,
    navWeight: voice.navWeight,
    linkWeight: voice.linkWeight,
    fontFamilies: [
      { slug: "body", name: "Body", fontFamily: voice.body },
      { slug: "display", name: "Display", fontFamily: voice.display },
      { slug: "accent", name: "Accent", fontFamily: voice.accent }
    ],
    fontSizes: buildFluidFontSizes(voice.scale),
    custom: {
      treatment,
      bodyFont: voice.body,
      displayFont: voice.display,
      accentFont: voice.accent,
      headingWeight: voice.headingWeight,
      actionWeight: voice.actionWeight,
      navWeight: voice.navWeight,
      headingLineHeight: voice.headingLineHeight,
      bodyLineHeight: voice.bodyLineHeight
    }
  };
}

function normalizeTypographyVoice(rawVoice) {
  const body = safeFontStack(rawVoice.body, "body");
  const display = safeFontStack(rawVoice.display, "display");
  const accent = safeFontStack(rawVoice.accent, "accent");
  const serifDisplay = isSerifStack(display);

  return {
    ...rawVoice,
    body,
    display,
    accent,
    headingWeight: String(clampNumber(numericToken(rawVoice.headingWeight, serifDisplay ? 660 : 760), serifDisplay ? 600 : 620, serifDisplay ? 720 : 820)),
    actionWeight: String(clampNumber(numericToken(rawVoice.actionWeight, 760), 650, 820)),
    navWeight: String(clampNumber(numericToken(rawVoice.navWeight, 740), 650, 800)),
    linkWeight: String(clampNumber(numericToken(rawVoice.linkWeight, 740), 650, 800)),
    headingLineHeight: String(clampNumber(numericToken(rawVoice.headingLineHeight, serifDisplay ? 1.06 : 1.04), serifDisplay ? 1.04 : 1.02, serifDisplay ? 1.12 : 1.08)),
    bodyLineHeight: String(clampNumber(numericToken(rawVoice.bodyLineHeight, 1.58), 1.52, 1.66))
  };
}

function safeFontStack(stack, role) {
  const fallback = {
    body: "Aptos, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Arial, sans-serif",
    display: "\"Aptos Display\", \"Segoe UI\", \"Helvetica Neue\", Arial, sans-serif",
    accent: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Arial, sans-serif"
  }[role];
  const value = String(stack || fallback);
  const banned = /\b(Impact|Arial Black|Segoe UI Black|Comic Sans|Papyrus|Brush Script|Curlz|Jokerman|Chiller|Cooper Black|Arial Rounded MT Bold|Chalkboard|Marker Felt|Noteworthy|Herculanum|Zapfino|Snell Roundhand|Mistral|Bradley Hand|Hobo|Party LET)\b/i;
  const bodyUnsafe = role === "body" && /\b(monospace|Mono|Consolas|Menlo|Arial Narrow|Roboto Condensed|Aptos Narrow)\b/i.test(value);
  return banned.test(value) || bodyUnsafe ? fallback : value;
}

function isSerifStack(stack) {
  const value = String(stack || "").replace(/\bsans-serif\b/gi, "");
  return /\b(serif|Georgia|Cambria|Iowan|Palatino|Rockwell|Slab|Didot|Bodoni|Baskerville|Hoefler|Charter|American Typewriter|Times)\b/i.test(value);
}

function numericToken(value, fallback) {
  const number = Number.parseFloat(String(value));
  return Number.isFinite(number) ? number : fallback;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildFluidFontSizes(scaleName) {
  const scales = {
    compact: {
      small: ["0.9rem", "0.86rem", "0.96rem"],
      body: ["1.02rem", "0.98rem", "1.08rem"],
      lead: ["1.2rem", "1.08rem", "1.34rem"],
      card: ["1.52rem", "1.28rem", "1.76rem"],
      section: ["2.85rem", "2rem", "3.35rem"],
      hero: ["4.25rem", "2.55rem", "4.85rem"]
    },
    soft: {
      small: ["0.94rem", "0.88rem", "1rem"],
      body: ["1.08rem", "1rem", "1.16rem"],
      lead: ["1.26rem", "1.12rem", "1.42rem"],
      card: ["1.58rem", "1.32rem", "1.78rem"],
      section: ["2.95rem", "2.05rem", "3.45rem"],
      hero: ["4.35rem", "2.58rem", "4.95rem"]
    },
    editorial: {
      small: ["0.95rem", "0.88rem", "1rem"],
      body: ["1.09rem", "1rem", "1.17rem"],
      lead: ["1.35rem", "1.14rem", "1.52rem"],
      card: ["1.7rem", "1.38rem", "1.94rem"],
      section: ["3.2rem", "2.18rem", "3.8rem"],
      hero: ["4.75rem", "2.65rem", "5.25rem"]
    },
    bold: {
      small: ["0.93rem", "0.87rem", "0.99rem"],
      body: ["1.05rem", "1rem", "1.12rem"],
      lead: ["1.3rem", "1.12rem", "1.48rem"],
      card: ["1.72rem", "1.38rem", "1.98rem"],
      section: ["3.05rem", "2.15rem", "3.55rem"],
      hero: ["4.55rem", "2.65rem", "5.05rem"]
    },
    wide: {
      small: ["0.92rem", "0.87rem", "0.98rem"],
      body: ["1.04rem", "0.98rem", "1.1rem"],
      lead: ["1.28rem", "1.1rem", "1.44rem"],
      card: ["1.68rem", "1.35rem", "1.9rem"],
      section: ["3rem", "2.08rem", "3.5rem"],
      hero: ["4.45rem", "2.6rem", "5rem"]
    },
    generous: {
      small: ["0.94rem", "0.88rem", "0.98rem"],
      body: ["1.06rem", "1rem", "1.12rem"],
      lead: ["1.28rem", "1.12rem", "1.42rem"],
      card: ["1.65rem", "1.35rem", "1.85rem"],
      section: ["3rem", "2.12rem", "3.5rem"],
      hero: ["4.5rem", "2.7rem", "5rem"]
    }
  };
  const scale = scales[scaleName] || scales.generous;
  return [
    { slug: "small", name: "Small", size: scale.small[0], fluid: { min: scale.small[1], max: scale.small[2] } },
    { slug: "body", name: "Body", size: scale.body[0], fluid: { min: scale.body[1], max: scale.body[2] } },
    { slug: "lead", name: "Lead", size: scale.lead[0], fluid: { min: scale.lead[1], max: scale.lead[2] } },
    { slug: "card-title", name: "Card Title", size: scale.card[0], fluid: { min: scale.card[1], max: scale.card[2] } },
    { slug: "section-title", name: "Section Title", size: scale.section[0], fluid: { min: scale.section[1], max: scale.section[2] } },
    { slug: "hero", name: "Hero", size: scale.hero[0], fluid: { min: scale.hero[1], max: scale.hero[2] } }
  ];
}

function buildColorStrategyTokens(spec) {
  const p = spec.palette;
  const variant = renderVariantForSpec(spec);
  const strategies = {
    "route-plan": {
      brandGradient: `linear-gradient(135deg, ${p.deepGreen} 0%, ${p.grass} 56%, ${p.leaf} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.sun} 0%, ${p.cream} 100%)`
    },
    "lawn-route-status-board": {
      brandGradient: `linear-gradient(135deg, ${p.deepGreen} 0%, ${p.grass} 48%, ${p.leaf} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.sun} 0%, ${p.white} 54%, ${p.mist} 100%)`
    },
    "before-after-quote": {
      brandGradient: `linear-gradient(135deg, ${p.deepGreen} 0%, ${p.soil} 48%, ${p.grass} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.white} 0%, ${p.mist} 48%, ${p.sun} 100%)`
    },
    "checklist-urgency": {
      brandGradient: `linear-gradient(135deg, ${p.white} 0%, ${p.mist} 46%, ${p.leaf} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.sun} 0%, ${p.white} 100%)`
    },
    "risk-prevention": {
      brandGradient: `linear-gradient(135deg, ${p.deepGreen} 0%, ${p.soil} 62%, ${p.grass} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.sun} 0%, ${p.leaf} 100%)`
    },
    "surface-seasonal": {
      brandGradient: `linear-gradient(135deg, ${p.deepGreen} 0%, ${p.soil} 58%, ${p.sun} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.sun} 0%, ${p.mist} 100%)`
    },
    "stain-care": {
      brandGradient: `linear-gradient(135deg, ${p.deepGreen} 0%, ${p.grass} 54%, ${p.mist} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.white} 0%, ${p.cream} 42%, ${p.sun} 100%)`
    },
    "gallery-led": {
      brandGradient: `linear-gradient(135deg, ${p.cream} 0%, ${p.mist} 46%, ${p.sun} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.grass} 0%, ${p.leaf} 100%)`
    },
    "side-rail-service": {
      brandGradient: `linear-gradient(135deg, ${p.deepGreen} 0%, ${p.soil} 54%, ${p.grass} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.sun} 0%, ${p.leaf} 100%)`
    },
    "package-menu-board": {
      brandGradient: `linear-gradient(135deg, ${p.deepGreen} 0%, ${p.soil} 52%, ${p.sun} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.cream} 0%, ${p.mist} 52%, ${p.leaf} 100%)`
    },
    "fixed-bottom-action": {
      brandGradient: `linear-gradient(135deg, ${p.deepGreen} 0%, ${p.grass} 58%, ${p.leaf} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.sun} 0%, ${p.white} 100%)`
    },
    "water-test-board": {
      brandGradient: `linear-gradient(135deg, ${p.deepGreen} 0%, ${p.grass} 52%, ${p.leaf} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.white} 0%, ${p.mist} 48%, ${p.sun} 100%)`
    },
    "zone-grid-planner": {
      brandGradient: `linear-gradient(135deg, ${p.deepGreen} 0%, ${p.soil} 50%, ${p.grass} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.sun} 0%, ${p.cream} 48%, ${p.leaf} 100%)`
    },
    "urgent-checklist": {
      brandGradient: `linear-gradient(135deg, ${p.deepGreen} 0%, ${p.soil} 58%, ${p.grass} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.sun} 0%, ${p.white} 54%, ${p.mist} 100%)`
    },
    "workshop-bench": {
      brandGradient: `linear-gradient(135deg, ${p.deepGreen} 0%, ${p.soil} 54%, ${p.leaf} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.cream} 0%, ${p.mist} 52%, ${p.sun} 100%)`
    },
    "service-receipt-stack": {
      brandGradient: `linear-gradient(135deg, ${p.white} 0%, ${p.mist} 48%, ${p.leaf} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.sun} 0%, ${p.cream} 52%, ${p.white} 100%)`
    }
  };

  return strategies[variant] || {
    brandGradient: `linear-gradient(135deg, ${p.deepGreen} 0%, ${p.grass} 56%, ${p.leaf} 100%)`,
    highlightGradient: `linear-gradient(135deg, ${p.sun} 0%, ${p.cream} 100%)`
  };
}

export function buildCustomCss(spec) {
  const tokens = buildDesignTokens(spec);
  const p = spec.palette;
  const colorClasses = [
    ["grass", p.grass],
    ["deep-green", p.deepGreen],
    ["leaf", p.leaf],
    ["sun", p.sun],
    ["cream", p.cream],
    ["mist", p.mist],
    ["soil", p.soil],
    ["white", p.white]
  ];
  const variables = colorClasses
    .map(([slug, color]) => `  --wp--preset--color--${slug}: ${color};`)
    .join("\n");
  const spacingVariables = tokens.spacingSizes
    .map((item) => `  --wp--preset--spacing--${item.slug}: ${item.size};`)
    .join("\n");
  const fontSizeVariables = tokens.fontSizes
    .map((item) => `  --wp--preset--font-size--${item.slug}: ${item.size};`)
    .join("\n");
  const fontFamilyVariables = tokens.fontFamilies
    .map((item) => `  --wp--preset--font-family--${item.slug}: ${item.fontFamily};`)
    .join("\n");
  const customVariables = [
    "  --wp--custom--som--measure--tight: 52ch;",
    "  --wp--custom--som--measure--copy: 66ch;",
    `  --wp--custom--som--type--heading-weight: ${tokens.typography.headingWeight};`,
    `  --wp--custom--som--type--action-weight: ${tokens.typography.actionWeight};`,
    `  --wp--custom--som--type--nav-weight: ${tokens.typography.navWeight};`,
    `  --wp--custom--som--type--heading-line-height: ${tokens.typography.headingLineHeight};`,
    `  --wp--custom--som--type--body-line-height: ${tokens.typography.bodyLineHeight};`,
    ...Object.entries(tokens.radii).map(([slug, value]) => `  --wp--custom--som--radius--${slug}: ${value};`),
    ...Object.entries(tokens.shadows).map(([slug, value]) => `  --wp--custom--som--shadow--${slug}: ${value};`)
  ].join("\n");
  const colorUtilities = colorClasses
    .map(([slug, color]) => `.has-${slug}-color{color:${color}!important}.has-${slug}-background-color{background-color:${color}!important}`)
    .join("\n");
  const shadowUtilities = tokens.shadowPresets
    .map((item) => `.has-${item.slug}-box-shadow{box-shadow:${item.shadow}!important}`)
    .join("\n");
  const variantCss = [buildVariantCustomCss(spec), buildAliasVisualCss(spec)].filter(Boolean).join("\n");
  const variantCssBlock = variantCss ? `${variantCss}\n` : "";

  return `
:root{
${variables}
${spacingVariables}
${fontSizeVariables}
${fontFamilyVariables}
${customVariables}
}
body{
  background:${p.cream};
  font-family:var(--wp--preset--font-family--body);
  line-height:var(--wp--custom--som--type--body-line-height);
}
.wp-site-blocks{
  padding-top:0;
  padding-bottom:0;
}
.wp-block-heading{
  font-family:var(--wp--preset--font-family--display)!important;
  font-weight:var(--wp--custom--som--type--heading-weight)!important;
  line-height:var(--wp--custom--som--type--heading-line-height)!important;
}
.wp-site-blocks :where(h1,h2,h3){
  font-family:var(--wp--preset--font-family--display)!important;
  font-weight:var(--wp--custom--som--type--heading-weight)!important;
  line-height:var(--wp--custom--som--type--heading-line-height)!important;
}
.wp-site-blocks h1.wp-block-heading{
  font-size:clamp(2.25rem, 5vw, var(--wp--preset--font-size--hero))!important;
}
.wp-site-blocks h2.wp-block-heading{
  font-size:clamp(1.95rem, 4vw, var(--wp--preset--font-size--section-title))!important;
}
.wp-site-blocks h3.wp-block-heading{
  font-size:clamp(1.25rem, 2vw, var(--wp--preset--font-size--card-title))!important;
}
.wp-block-navigation a,
.wp-block-button__link{
  font-family:var(--wp--preset--font-family--accent)!important;
}
.wp-block-navigation a{
  font-weight:var(--wp--custom--som--type--nav-weight)!important;
}
.wp-block-button__link{
  font-weight:var(--wp--custom--som--type--action-weight)!important;
}
.wp-site-blocks :where(p,li,summary,td,th){
  font-family:var(--wp--preset--font-family--body);
}
.wp-site-blocks :where(.som-chip,.som-method-pill,.som-ticket-line,.som-rail-note,.som-date-cell,.som-ticket-line span,.som-ticket-line strong){
  font-family:var(--wp--preset--font-family--accent)!important;
}
${colorUtilities}
${shadowUtilities}
${buildSharedPolishCss(spec)}
.wp-block-cover .wp-block-cover__inner-container{
  position:relative;
  z-index:1;
}
.wp-block-site-logo img{
  height:auto;
  max-width:min(230px, 62vw);
}
${variantCssBlock}@media (max-width:700px){
  .wp-site-blocks :where(.som-proof-card,.som-route-proof-card,[class*="-proof-card"]){
    grid-template-rows:auto auto;
    row-gap:14px;
  }
  .wp-block-cover{
    min-height:620px!important;
  }
  .wp-block-cover .wp-block-cover__image-background{
    object-position:62% 50%!important;
  }
  .wp-block-navigation__responsive-container-open{
    min-width:44px;
    min-height:44px;
  }
}
`.trim();
}

function buildSharedPolishCss(spec) {
  const p = spec.palette;

  return `
html{
  scroll-behavior:smooth;
}
body{
  text-rendering:optimizeLegibility;
}
.wp-site-blocks :where(h1,h2,h3){
  text-wrap:balance;
}
.wp-site-blocks :where(p,li){
  text-wrap:pretty;
}
.wp-site-blocks p{
  max-inline-size:var(--wp--custom--som--measure--copy);
}
.wp-site-blocks p.has-text-align-center{
  margin-left:auto;
  margin-right:auto;
}
.wp-site-blocks :where(.som-chip,.som-method-pill,.som-ticket-line,.som-rail-note,.som-date-cell,.som-route-card-number,.som-haul-number,.som-timeline-number,.som-water-step-number,.som-zone-step-number,.som-craft-step-number,.som-row-number,.som-detail-step-number,.som-menu-step-number,.som-warning-number,.som-urgent-step-number){
  max-inline-size:none;
}
.wp-block-button__link{
  box-shadow:var(--wp--custom--som--shadow--button);
  transition:transform .18s ease, box-shadow .18s ease, background-color .18s ease, color .18s ease;
}
.wp-block-button__link:hover{
  transform:translateY(-1px);
  box-shadow:var(--wp--custom--som--shadow--card);
}
.wp-block-button__link:focus-visible,
.wp-block-navigation a:focus-visible{
  outline:3px solid ${p.sun};
  outline-offset:4px;
}
.wp-block-navigation a:hover{
  text-decoration:underline;
  text-decoration-thickness:2px;
  text-underline-offset:.25em;
}
.som-card,
.som-process-card,
.som-proof-card,
.som-quote-card,
.som-evidence-card{
  box-shadow:var(--wp--custom--som--shadow--card);
  border-radius:var(--wp--custom--som--radius--card);
}
.som-card,
.som-process-card,
.som-proof-card{
  min-height:100%;
}
.wp-site-blocks :where(.som-proof-card,.som-route-proof-card,[class*="-proof-card"]){
  display:grid;
  grid-template-rows:minmax(2.1em, auto) auto;
  align-content:space-between;
  row-gap:clamp(14px, 2vw, 24px);
}
.wp-site-blocks :where(.som-proof-card,.som-route-proof-card,[class*="-proof-card"]) > :first-child{
  align-self:start;
  min-block-size:1.02em;
  margin-top:0!important;
  margin-bottom:0!important;
  font-family:var(--wp--preset--font-family--display)!important;
  line-height:1!important;
  text-wrap:balance;
}
.wp-site-blocks :where(.som-proof-card,.som-route-proof-card,[class*="-proof-card"]) > :last-child{
  align-self:end;
  max-inline-size:28ch;
  margin-top:0!important;
  margin-bottom:0!important;
  font-family:var(--wp--preset--font-family--accent)!important;
  line-height:1.26!important;
}
.wp-site-blocks :where(.som-proof-card,.som-route-proof-card,[class*="-proof-card"]) > :only-child{
  align-self:start;
}
.som-quote-card{
  border-radius:var(--wp--custom--som--radius--panel);
  box-shadow:var(--wp--custom--som--shadow--lift);
}
.som-footer{
  font-size:var(--wp--preset--font-size--small);
}
.som-chip,
.som-method-pill{
  box-shadow:inset 0 0 0 1px color-mix(in srgb, ${p.deepGreen} 12%, transparent);
}
.wp-block-image img{
  max-width:100%;
}
.wp-block-media-text .wp-block-media-text__media img,
.wp-block-gallery img{
  border-radius:var(--wp--custom--som--radius--image);
}
.wp-block-details{
  border:1px solid color-mix(in srgb, ${p.deepGreen} 12%, transparent);
  border-radius:var(--wp--custom--som--radius--card);
  background:color-mix(in srgb, ${p.white} 86%, ${p.mist});
}
.wp-block-details summary{
  cursor:pointer;
  font-family:var(--wp--preset--font-family--accent);
  font-weight:var(--wp--custom--som--type--action-weight);
}
.wp-block-details summary:focus-visible{
  outline:3px solid ${p.sun};
  outline-offset:4px;
}
.wp-block-table table{
  border-collapse:collapse;
  width:100%;
}
.wp-block-table :where(th,td){
  border-bottom:1px solid color-mix(in srgb, ${p.deepGreen} 14%, transparent);
  padding:.9rem 1rem;
  text-align:left;
  vertical-align:top;
}
.wp-block-table thead{
  background:color-mix(in srgb, ${p.sun} 20%, ${p.white});
}
.wp-block-quote,
.wp-block-pullquote{
  border-color:${p.sun};
  color:${p.deepGreen};
}
@media (max-width:700px){
  .wp-block-button,
  .wp-block-button__link{
    width:100%;
  }
  .wp-block-columns{
    gap:var(--wp--preset--spacing--50);
  }
  .wp-site-blocks :where(h1,h2){
    hyphens:manual;
    overflow-wrap:break-word;
  }
}
`.trim();
}

function buildVariantCustomCss(spec) {
  const variant = renderVariantForSpec(spec);

  if (variant === "lawn-route-status-board") {
    return `
.som-route-page{
  background:${spec.palette.cream};
}
.som-route-header{
  position:sticky;
  top:0;
  z-index:10;
  border-bottom:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 10%, transparent);
}
.som-route-header .wp-block-site-logo img{
  max-width:min(245px, 62vw);
}
.som-route-header .wp-block-navigation a{
  border-radius:6px;
  padding:8px 11px;
}
.som-route-header .wp-block-navigation a:hover{
  background:color-mix(in srgb, ${spec.palette.leaf} 16%, transparent);
  text-decoration:none;
}
#routes,
#notes,
#proof,
#quote{
  scroll-margin-top:128px;
}
.som-route-hero-shell{
  background-image:radial-gradient(circle at 72% 10%, color-mix(in srgb, ${spec.palette.leaf} 18%, transparent), transparent 32%);
}
.som-route-hero-photo{
  margin:0;
}
.som-route-hero-photo img{
  width:100%;
  min-height:540px;
  aspect-ratio:16/10;
  object-fit:cover;
  object-position:58% 50%;
  border-radius:8px;
  box-shadow:0 28px 82px rgba(0,0,0,.18);
}
.som-route-status-board{
  position:relative;
  border:1px solid color-mix(in srgb, ${spec.palette.sun} 42%, transparent);
  box-shadow:0 24px 70px rgba(0,0,0,.2);
}
.som-route-board-row{
  gap:14px!important;
}
.som-route-board-row .wp-block-column{
  border-left:3px solid ${spec.palette.sun};
  padding-left:12px;
}
.som-route-plan-card,
.som-route-process-card,
.som-route-proof-card,
.som-route-quote-card{
  border:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 12%, transparent);
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-route-plan-card{
  min-height:100%;
  border-top:7px solid ${spec.palette.leaf};
}
.som-route-plan-card:nth-child(2){
  border-top-color:${spec.palette.sun};
}
.som-route-plan-card:nth-child(3){
  border-top-color:${spec.palette.grass};
}
.som-route-card-number{
  display:inline-flex;
  width:auto;
  border-bottom:3px solid ${spec.palette.sun};
  padding-bottom:5px;
}
.som-route-process-card{
  border-left:5px solid ${spec.palette.leaf};
}
.som-route-proof-card{
  min-height:100%;
  border-bottom:6px solid ${spec.palette.leaf};
}
.som-route-proof-card:nth-child(2){
  border-bottom-color:${spec.palette.sun};
}
.som-route-proof-card:nth-child(3){
  border-bottom-color:${spec.palette.grass};
}
.som-route-table{
  border:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 14%, transparent);
  border-radius:8px;
  overflow:hidden;
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-route-table table{
  margin:0;
}
.som-route-table th{
  color:${spec.palette.deepGreen};
  font-family:var(--wp--preset--font-family--accent);
  font-size:13px;
  font-weight:900;
  text-transform:uppercase;
}
.som-route-table td:first-child{
  color:${spec.palette.grass};
  font-family:var(--wp--preset--font-family--accent);
  font-size:20px;
  font-weight:900;
  width:72px;
}
.som-route-detail{
  margin-top:18px;
  padding:18px 20px;
}
.som-route-quote-card{
  border-top:8px solid ${spec.palette.sun};
  box-shadow:var(--wp--custom--som--shadow--lift);
}
@media (max-width:900px){
  .som-route-header-action{
    display:none;
  }
  .som-route-hero-photo img{
    min-height:430px;
  }
  .som-route-status-board{
    margin-right:16px!important;
    margin-left:16px!important;
  }
}
@media (max-width:700px){
  .som-route-header{
    position:relative;
  }
  .som-route-header .wp-block-columns{
    gap:10px!important;
  }
  .som-route-header .wp-block-site-logo img{
    max-width:min(220px, 68vw);
  }
  #routes,
  #notes,
  #proof,
  #quote{
    scroll-margin-top:28px;
  }
  .som-route-hero-shell{
    padding-top:38px!important;
    padding-right:24px!important;
    padding-left:24px!important;
  }
  .som-route-hero h1{
    font-size:clamp(38px, 11vw, 52px)!important;
  }
  .som-route-hero-photo img{
    min-height:300px;
    aspect-ratio:1/1;
  }
  .som-route-status-board{
    margin-top:16px!important;
    margin-right:0!important;
    margin-left:0!important;
  }
  .som-route-board-row .wp-block-column{
    margin-bottom:10px;
  }
  .som-route-plans,
  .som-route-notes,
  .som-route-proof-board,
  .som-route-join{
    padding-right:24px!important;
    padding-left:24px!important;
  }
  .som-route-table{
    overflow:hidden;
  }
  .som-route-table table,
  .som-route-table tbody,
  .som-route-table tr,
  .som-route-table td{
    display:block;
    width:100%;
  }
  .som-route-table thead{
    display:none;
  }
  .som-route-table tr{
    border-bottom:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 14%, transparent);
    padding:12px 0;
  }
  .som-route-table tr:last-child{
    border-bottom:0;
  }
  .som-route-table td{
    border:0;
    box-sizing:border-box;
    padding:5px 16px;
  }
  .som-route-table td:first-child{
    width:auto;
  }
  .som-route-quote-card{
    padding:28px 22px!important;
  }
}
`.trim();
  }

  if (variant === "urgent-checklist") {
    return `
.som-urgent-page{
  background:${spec.palette.cream};
}
.som-urgent-header{
  position:relative;
  z-index:5;
  border-bottom:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 12%, transparent);
}
.som-urgent-header .wp-block-site-logo img{
  max-width:min(235px, 58vw);
}
.som-urgent-header .wp-block-navigation a{
  color:${spec.palette.deepGreen};
}
.som-urgent-header .wp-block-navigation a:hover{
  color:${spec.palette.grass};
}
.som-urgent-hero{
  background:
    radial-gradient(circle at 10% 12%, color-mix(in srgb, ${spec.palette.sun} 18%, transparent), transparent 30%),
    linear-gradient(135deg, ${spec.palette.deepGreen}, color-mix(in srgb, ${spec.palette.deepGreen} 72%, ${spec.palette.grass}) 100%);
}
.som-urgent-photo{
  margin:0;
}
.som-urgent-photo img{
  width:100%;
  min-height:520px;
  aspect-ratio:16/10;
  object-fit:cover;
  object-position:58% 50%;
  border-radius:26px;
  box-shadow:0 28px 80px rgba(0,0,0,.28);
}
.som-date-board{
  width:min(520px, 88%);
  margin:-58px 28px 0 auto;
  position:relative;
  border:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 14%, transparent);
  border-radius:18px;
  box-shadow:0 22px 60px rgba(0,0,0,.2);
}
.som-date-cell{
  border-left:4px solid ${spec.palette.sun};
  padding-left:12px;
}
.som-urgent-proof{
  border-left:4px solid ${spec.palette.sun};
  padding:4px 0 4px 14px;
}
.som-urgent-card{
  padding:26px;
  border:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 12%, transparent);
  border-radius:18px;
  background:${spec.palette.white};
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-urgent-step{
  border-top:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 12%, transparent);
}
.som-urgent-step-number{
  display:flex;
  align-items:center;
  justify-content:center;
  width:48px;
  height:48px;
  border-radius:50%;
  color:${spec.palette.deepGreen};
  background:${spec.palette.sun};
}
.som-urgent-detail{
  margin-top:14px;
}
.som-urgent-detail p{
  color:${spec.palette.soil};
  line-height:1.55;
}
#install,
#safety,
#quote{
  scroll-margin-top:128px;
}
@media (max-width:800px){
  .som-urgent-header-action{
    display:none;
  }
  .som-urgent-hero > .wp-block-columns{
    display:flex;
    flex-direction:column;
  }
  .som-urgent-photo img{
    min-height:280px;
    aspect-ratio:16/11;
    object-position:62% 50%;
  }
  .som-date-board{
    width:100%;
    margin:14px 0 0;
  }
  .som-urgent-hero h1{
    font-size:clamp(2.8rem, 13vw, 4rem)!important;
  }
}
`.trim();
  }

  if (variant === "checklist-urgency") {
    return `
.som-checklist-hero .som-hero-photo img{
  width:100%;
  min-height:520px;
  aspect-ratio:4/3;
  object-fit:cover;
  border-radius:28px;
  box-shadow:0 28px 80px rgba(5,45,63,.18);
}
.som-check-card,
.som-urgency-band .som-proof-card{
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-check-card{
  border-left:6px solid ${spec.palette.sun};
}
@media (max-width:700px){
  .som-checklist-hero .som-hero-photo img{
    min-height:340px;
    aspect-ratio:1/1;
  }
}
`.trim();
  }

  if (variant === "risk-prevention") {
    return `
.som-risk-hero .som-hero-photo img{
  width:100%;
  min-height:560px;
  aspect-ratio:4/3;
  object-fit:cover;
  object-position:center center;
  border-radius:28px;
  box-shadow:0 28px 80px rgba(5,45,63,.18);
}
.som-risk-panel,
.som-warning-row,
.som-plan-step,
.som-risk-band .som-proof-card{
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-warning-row{
  border-left:6px solid ${spec.palette.sun};
}
.som-warning-number{
  display:flex;
  align-items:center;
  justify-content:center;
  width:56px;
  height:56px;
  box-sizing:border-box;
  border-radius:999px;
  margin:0!important;
  padding:0!important;
  white-space:nowrap;
}
.som-plan-step{
  min-height:100%;
}
@media (max-width:700px){
  .som-risk-hero{
    padding-top:24px!important;
    padding-bottom:34px!important;
  }
  .som-risk-hero .wp-block-columns{
    gap:18px!important;
  }
  .som-risk-hero .som-hero-photo img{
    min-height:170px;
    aspect-ratio:16/8;
    border-radius:22px;
  }
  .som-risk-hero h1{
    font-size:clamp(34px, 10vw, 44px)!important;
    line-height:1.04!important;
    margin-top:8px!important;
    margin-bottom:12px!important;
  }
  .som-risk-hero p{
    font-size:16px!important;
    line-height:1.48!important;
  }
  .som-risk-hero .wp-block-buttons{
    gap:10px!important;
  }
  .som-risk-hero .wp-block-button__link{
    padding-top:12px!important;
    padding-bottom:12px!important;
  }
}
`.trim();
  }

  if (variant === "surface-seasonal") {
    return `
.som-surface-photo img{
  width:100%;
  min-height:500px;
  aspect-ratio:4/3;
  object-fit:cover;
  object-position:center center;
  border-radius:30px;
  box-shadow:0 28px 80px rgba(0,0,0,.26);
}
.som-surface-hero{
  background-image:linear-gradient(135deg, rgba(255,209,102,.08), rgba(255,255,255,0));
}
.som-surface-band{
  box-shadow:inset 0 -1px 0 rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.18);
}
.som-surface-badge,
.som-seal-card,
.som-season-note,
.som-surface-hero .som-surface-photo{
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-seal-card{
  border-bottom:8px solid ${spec.palette.sun};
  min-height:100%;
}
.som-season-note{
  box-shadow:var(--wp--custom--som--shadow--lift);
}
@media (max-width:700px){
  .som-surface-hero{
    padding-top:40px!important;
    padding-bottom:46px!important;
  }
  .som-surface-photo img{
    min-height:230px;
    aspect-ratio:16/10;
    border-radius:24px;
  }
  .som-surface-hero h1{
    font-size:clamp(42px, 12vw, 54px)!important;
  }
  .som-season-note{
    padding:26px!important;
  }
}
`.trim();
  }

  if (variant === "stain-care") {
    return `
.som-fabric-hero{
  background-image:linear-gradient(135deg, rgba(51,182,166,.12), rgba(255,255,255,0));
}
.som-fabric-photo img{
  width:100%;
  min-height:500px;
  aspect-ratio:4/3;
  object-fit:cover;
  object-position:center center;
  border-radius:30px;
  box-shadow:0 28px 80px rgba(5,45,63,.18);
}
.som-care-note,
.som-fabric-proof,
.som-stain-card{
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-care-note{
  border-left:6px solid ${spec.palette.leaf};
}
.som-stain-card{
  border-top:8px solid ${spec.palette.sun};
  min-height:100%;
}
.som-fabric-proof{
  min-height:100%;
}
@media (max-width:700px){
  .som-fabric-hero{
    padding-top:42px!important;
    padding-bottom:48px!important;
  }
  .som-fabric-photo img{
    min-height:300px;
    aspect-ratio:1/1;
    border-radius:24px;
  }
  .som-fabric-hero h1{
    font-size:clamp(40px, 11vw, 54px)!important;
  }
  .som-care-note{
    padding:22px!important;
  }
}
`.trim();
  }

  if (variant === "side-rail-service") {
    return `
.som-side-rail-shell{
  display:grid;
  grid-template-columns:minmax(250px, 300px) minmax(0, 1fr);
  align-items:start;
  min-height:100vh;
}
.som-side-rail{
  position:sticky;
  top:0;
  z-index:5;
  min-height:100vh;
  box-sizing:border-box;
  border-right:1px solid rgba(32,38,45,.12);
  box-shadow:0 18px 60px rgba(32,38,45,.08);
}
.som-side-rail .wp-block-site-logo{
  margin-bottom:0;
}
.som-side-rail .wp-block-navigation__container{
  align-items:flex-start;
  gap:8px;
}
.som-side-rail .wp-block-navigation a{
  border-radius:999px;
  padding:8px 12px;
}
.som-side-rail .wp-block-navigation a:hover{
  background:color-mix(in srgb, ${spec.palette.sun} 22%, transparent);
  text-decoration:none;
}
.som-side-main{
  min-width:0;
}
.som-haul-hero{
  background-image:linear-gradient(135deg, rgba(255,191,63,.1), rgba(255,255,255,0));
}
.som-haul-photo img{
  width:100%;
  min-height:500px;
  aspect-ratio:4/3;
  object-fit:cover;
  object-position:center center;
  border-radius:30px;
  box-shadow:0 28px 80px rgba(0,0,0,.24);
}
.som-donation-strip{
  box-shadow:inset 0 -1px 0 rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.22);
}
.som-haul-ticket{
  border:1px solid color-mix(in srgb, ${spec.palette.sun} 34%, transparent);
  box-shadow:0 18px 44px rgba(0,0,0,.14);
}
.som-haul-ticket strong{
  color:${spec.palette.sun};
  font-weight:900;
}
.som-ticket-line:last-child{
  margin-bottom:0!important;
}
.som-haul-card,
.som-haul-proof,
.som-haul-step,
.som-clearance-zone{
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-haul-card{
  border-top:8px solid ${spec.palette.sun};
  min-height:100%;
}
.som-haul-proof{
  min-height:100%;
}
.som-clearance-zone{
  box-shadow:var(--wp--custom--som--shadow--lift);
}
.som-haul-step{
  border-left:6px solid ${spec.palette.leaf};
}
.som-haul-number{
  display:flex;
  align-items:center;
  justify-content:center;
  width:54px;
  height:54px;
  box-sizing:border-box;
  border-radius:999px;
  margin:0!important;
  padding:0!important;
  white-space:nowrap;
}
@media (max-width:900px){
  .som-side-rail-shell{
    display:block;
  }
  .som-side-rail{
    position:relative;
    min-height:auto;
    border-right:0;
    border-bottom:1px solid rgba(32,38,45,.12);
    box-shadow:0 12px 36px rgba(32,38,45,.06);
  }
  .som-side-rail{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:16px;
  }
  .som-rail-note,
  .som-rail-actions{
    display:none!important;
  }
  .som-side-rail .wp-block-site-logo{
    flex:0 1 auto;
  }
  .som-side-rail .wp-block-navigation{
    flex:0 0 auto;
  }
  .som-haul-hero{
    padding-top:42px!important;
    padding-right:24px!important;
    padding-bottom:48px!important;
    padding-left:24px!important;
  }
  .som-haul-hero > .wp-block-columns{
    display:flex!important;
    flex-direction:column;
    gap:18px!important;
  }
  .som-haul-hero > .wp-block-columns > .wp-block-column:nth-child(2){
    order:-1;
  }
  .som-donation-strip,
  #take,
  #sort,
  #services,
  #process,
  #quote{
    padding-right:24px!important;
    padding-left:24px!important;
  }
  .som-haul-photo img{
    min-height:172px;
    aspect-ratio:16/8;
    border-radius:20px;
  }
  .som-haul-hero h1{
    font-size:clamp(32px, 9vw, 44px)!important;
    line-height:1.04!important;
    margin-top:8px!important;
    margin-bottom:12px!important;
  }
  .som-haul-hero p{
    font-size:16px!important;
    line-height:1.48!important;
  }
  .som-haul-hero .wp-block-buttons{
    gap:10px!important;
  }
  .som-haul-hero .wp-block-button__link{
    padding-top:12px!important;
    padding-bottom:12px!important;
  }
  .som-haul-ticket{
    display:none!important;
  }
  .som-clearance-zone{
    padding:24px!important;
  }
}
`.trim();
  }

  if (variant === "package-menu-board") {
    return `
.som-menu-header{
  position:relative;
  z-index:4;
  border-bottom:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 10%, transparent);
}
.som-menu-header .wp-block-site-logo img{
  max-width:min(230px, 58vw);
}
.som-menu-header .wp-block-navigation a{
  border-radius:999px;
  padding:8px 12px;
}
.som-menu-header .wp-block-navigation a:hover{
  background:color-mix(in srgb, ${spec.palette.sun} 18%, transparent);
  text-decoration:none;
}
.som-menu-hero{
  background-image:radial-gradient(circle at 78% 18%, color-mix(in srgb, ${spec.palette.sun} 24%, transparent), transparent 34%), linear-gradient(135deg, rgba(255,255,255,.04), rgba(255,255,255,0));
}
.som-menu-photo img{
  width:100%;
  min-height:440px;
  aspect-ratio:4/3;
  object-fit:cover;
  object-position:center center;
  border-radius:30px;
  box-shadow:0 28px 80px rgba(0,0,0,.28);
}
.som-menu-ticket{
  border:1px solid color-mix(in srgb, ${spec.palette.sun} 36%, transparent);
  box-shadow:0 18px 44px rgba(0,0,0,.18);
}
.som-menu-ticket strong{
  color:${spec.palette.sun};
  font-weight:900;
}
.som-menu-proof,
.som-menu-package,
.som-menu-step{
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-menu-package{
  border-top:8px solid ${spec.palette.sun};
  min-height:100%;
}
.som-menu-package:nth-child(2){
  border-top-color:${spec.palette.leaf};
}
.som-menu-package:nth-child(3){
  border-top-color:${spec.palette.grass};
}
.som-menu-event{
  box-shadow:inset 0 1px 0 color-mix(in srgb, ${spec.palette.deepGreen} 8%, transparent);
}
.som-menu-step{
  border-left:6px solid ${spec.palette.sun};
}
.som-menu-step-number{
  display:flex;
  align-items:center;
  justify-content:center;
  width:54px;
  height:54px;
  box-sizing:border-box;
  border-radius:999px;
  margin:0!important;
  padding:0!important;
  white-space:nowrap;
}
@media (max-width:900px){
  .som-menu-header{
    padding-right:24px!important;
    padding-left:24px!important;
  }
  .som-menu-header-action{
    display:none;
  }
}
@media (max-width:700px){
  .som-menu-header .wp-block-columns{
    gap:12px!important;
  }
  .som-menu-hero .wp-block-columns{
    display:flex!important;
    flex-direction:column;
    min-width:0!important;
    max-width:100%!important;
    overflow-x:hidden;
  }
  .som-menu-hero .wp-block-column{
    flex-basis:auto!important;
    min-width:0!important;
    max-width:100%!important;
  }
  .som-menu-hero{
    padding-top:42px!important;
    padding-right:24px!important;
    padding-bottom:48px!important;
    padding-left:24px!important;
  }
  .som-menu-photo img{
    min-height:300px;
    aspect-ratio:1/1;
    border-radius:24px;
  }
  .som-menu-hero h1{
    font-size:clamp(38px, 11vw, 52px)!important;
  }
  .som-menu-ticket{
    padding:16px!important;
  }
  .som-menu-proof-strip,
  .som-menu-packages,
  .som-menu-event,
  .som-quote-strip{
    padding-right:24px!important;
    padding-left:24px!important;
  }
}
`.trim();
  }

  if (variant === "fixed-bottom-action") {
    return `
.som-fixed-page{
  position:relative;
}
.som-fixed-header{
  border-bottom:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 10%, transparent);
}
.som-fixed-header .wp-block-site-logo img{
  max-width:min(235px, 62vw);
}
.som-fixed-header .wp-block-navigation a{
  border-radius:999px;
  padding:8px 12px;
}
.som-fixed-header .wp-block-navigation a:hover{
  background:color-mix(in srgb, ${spec.palette.leaf} 18%, transparent);
  text-decoration:none;
}
.som-fixed-hero{
  background-image:radial-gradient(circle at 82% 16%, color-mix(in srgb, ${spec.palette.leaf} 24%, transparent), transparent 34%), linear-gradient(135deg, rgba(255,255,255,.06), rgba(255,255,255,0));
}
.som-detail-photo img{
  width:100%;
  min-height:460px;
  aspect-ratio:4/3;
  object-fit:cover;
  object-position:center center;
  border-radius:30px;
  box-shadow:0 28px 80px rgba(0,0,0,.28);
}
.som-detail-ticket{
  border:1px solid color-mix(in srgb, ${spec.palette.leaf} 40%, transparent);
  box-shadow:0 18px 44px rgba(0,0,0,.18);
}
.som-detail-ticket strong{
  color:${spec.palette.sun};
  font-weight:900;
}
.som-detail-proof,
.som-detail-package,
.som-detail-step{
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-detail-package{
  border-top:8px solid ${spec.palette.leaf};
  min-height:100%;
}
.som-detail-package:nth-child(2){
  border-top-color:${spec.palette.sun};
}
.som-detail-package:nth-child(3){
  border-top-color:${spec.palette.grass};
}
.som-detail-route{
  box-shadow:inset 0 1px 0 color-mix(in srgb, ${spec.palette.deepGreen} 8%, transparent);
}
.som-detail-step{
  border-left:6px solid ${spec.palette.leaf};
}
.som-detail-step-number{
  display:flex;
  align-items:center;
  justify-content:center;
  width:54px;
  height:54px;
  box-sizing:border-box;
  border-radius:999px;
  margin:0!important;
  padding:0!important;
  white-space:nowrap;
}
.som-mobile-action-bar{
  display:none;
}
@media (max-width:900px){
  .som-fixed-header{
    padding-right:24px!important;
    padding-left:24px!important;
  }
  .som-fixed-header-action{
    display:none;
  }
}
@media (max-width:700px){
  .som-fixed-page{
    --som-mobile-action-reserve:calc(126px + env(safe-area-inset-bottom));
    padding-bottom:var(--som-mobile-action-reserve)!important;
  }
  .som-fixed-hero{
    padding-top:42px!important;
    padding-right:24px!important;
    padding-bottom:46px!important;
    padding-left:24px!important;
  }
  .som-detail-photo img{
    min-height:300px;
    aspect-ratio:1/1;
    border-radius:24px;
  }
  .som-fixed-hero h1{
    font-size:clamp(38px, 11vw, 52px)!important;
  }
  .som-detail-ticket{
    padding:16px!important;
  }
  .som-detail-proof-strip,
  .som-detail-packages,
  .som-detail-route,
  .som-quote-strip{
    padding-right:24px!important;
    padding-left:24px!important;
  }
  .som-mobile-action-bar{
    display:block;
    position:fixed;
    right:10px;
    bottom:max(10px, env(safe-area-inset-bottom));
    left:10px;
    z-index:50;
    border-radius:24px;
    box-shadow:0 18px 44px rgba(0,0,0,.28);
  }
  .som-mobile-action-bar .wp-block-buttons{
    width:100%;
    gap:8px!important;
  }
  .som-mobile-action-bar .wp-block-button{
    margin:0!important;
  }
  .som-mobile-action-bar .wp-block-button__link{
    min-height:44px;
    display:flex;
    align-items:center;
    justify-content:center;
    white-space:nowrap;
    font-size:14px;
  }
  .som-footer{
    margin-bottom:var(--som-mobile-action-reserve)!important;
    padding-bottom:96px!important;
  }
}
`.trim();
  }

  if (variant === "water-test-board") {
    return `
.som-water-header{
  position:relative;
  z-index:4;
  border-bottom:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 10%, transparent);
}
.som-water-header .wp-block-site-logo img{
  max-width:min(235px, 62vw);
}
.som-water-header .wp-block-navigation a{
  border-radius:999px;
  padding:8px 12px;
}
.som-water-header .wp-block-navigation a:hover{
  background:color-mix(in srgb, ${spec.palette.leaf} 18%, transparent);
  text-decoration:none;
}
.som-water-hero{
  overflow:hidden;
}
.som-water-hero .wp-block-cover__background{
  background:linear-gradient(90deg, color-mix(in srgb, ${spec.palette.deepGreen} 26%, transparent), color-mix(in srgb, ${spec.palette.deepGreen} 4%, transparent))!important;
}
.som-water-board{
  border:1px solid color-mix(in srgb, ${spec.palette.leaf} 30%, transparent);
  box-shadow:0 28px 80px rgba(7,35,61,.22);
}
.som-water-mini-board,
.som-water-note{
  box-shadow:0 18px 44px rgba(7,35,61,.14);
}
.som-water-mini-board{
  border:1px solid color-mix(in srgb, ${spec.palette.leaf} 28%, transparent);
}
.som-water-mini-board strong{
  color:${spec.palette.grass};
  font-weight:900;
}
.som-water-note{
  border:1px solid color-mix(in srgb, ${spec.palette.sun} 32%, transparent);
}
.som-water-proof,
.som-water-plan,
.som-water-route-step{
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-water-proof{
  border-bottom:7px solid ${spec.palette.leaf};
  min-height:100%;
}
.som-water-proof:nth-child(2){
  border-bottom-color:${spec.palette.sun};
}
.som-water-proof:nth-child(3){
  border-bottom-color:${spec.palette.grass};
}
.som-water-plan{
  border-top:8px solid ${spec.palette.leaf};
  min-height:100%;
}
.som-water-plan:nth-child(2){
  border-top-color:${spec.palette.sun};
}
.som-water-plan:nth-child(3){
  border-top-color:${spec.palette.grass};
}
.som-water-route{
  box-shadow:inset 0 1px 0 color-mix(in srgb, ${spec.palette.deepGreen} 8%, transparent);
}
.som-water-route-step{
  border-left:7px solid ${spec.palette.leaf};
}
.som-water-route-step:nth-child(2){
  border-left-color:${spec.palette.sun};
}
.som-water-route-step:nth-child(3){
  border-left-color:${spec.palette.grass};
}
.som-water-step-number{
  display:flex;
  align-items:center;
  justify-content:center;
  width:54px;
  height:54px;
  box-sizing:border-box;
  border-radius:999px;
  margin:0!important;
  padding:0!important;
  white-space:nowrap;
}
@media (max-width:900px){
  .som-water-header{
    padding-right:24px!important;
    padding-left:24px!important;
  }
  .som-water-header-action{
    display:none;
  }
  .som-water-note{
    display:none;
  }
}
@media (max-width:700px){
  .som-water-header .wp-block-columns{
    gap:12px!important;
  }
  .som-water-hero{
    min-height:690px!important;
    padding-top:32px!important;
    padding-right:20px!important;
    padding-bottom:36px!important;
    padding-left:20px!important;
  }
  .som-water-hero .wp-block-cover__image-background{
    object-position:58% 50%!important;
  }
  .som-water-board{
    padding:24px!important;
    border-radius:20px!important;
  }
  .som-water-board h1{
    font-size:clamp(38px, 10.6vw, 52px)!important;
  }
  .som-water-mini-board{
    display:none;
  }
  .som-water-proof-strip,
  .som-water-plans,
  .som-water-route,
  .som-quote-strip{
    padding-right:24px!important;
    padding-left:24px!important;
  }
}
`.trim();
  }

  if (variant === "zone-grid-planner") {
    return `
.som-zone-header{
  border-bottom:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 12%, transparent);
}
.som-zone-header .wp-block-site-logo img{
  max-width:min(235px, 62vw);
}
.som-zone-header .wp-block-navigation a{
  border-radius:6px;
  padding:8px 12px;
}
.som-zone-header .wp-block-navigation a:hover{
  background:color-mix(in srgb, ${spec.palette.sun} 18%, transparent);
  text-decoration:none;
}
.som-zone-hero{
  background-image:linear-gradient(90deg, color-mix(in srgb, ${spec.palette.sun} 8%, transparent) 1px, transparent 1px), linear-gradient(0deg, color-mix(in srgb, ${spec.palette.white} 7%, transparent) 1px, transparent 1px);
  background-size:34px 34px;
}
.som-zone-photo img{
  width:100%;
  min-height:560px;
  aspect-ratio:4/3;
  object-fit:cover;
  object-position:center center;
  border-radius:8px;
  box-shadow:0 28px 80px rgba(0,0,0,.28);
}
.som-zone-map{
  border:1px solid color-mix(in srgb, ${spec.palette.sun} 36%, transparent);
  box-shadow:0 18px 44px rgba(0,0,0,.18);
}
.som-zone-map-grid{
  display:grid!important;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:8px!important;
  margin-bottom:12px!important;
}
.som-zone-map-grid .wp-block-column{
  min-width:0;
}
.som-zone-map strong{
  color:${spec.palette.sun};
  font-weight:900;
}
.som-zone-proof,
.som-zone-card,
.som-zone-step,
.som-zone-note{
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-zone-proof{
  border-bottom:7px solid ${spec.palette.sun};
  min-height:100%;
}
.som-zone-proof:nth-child(2){
  border-bottom-color:${spec.palette.leaf};
}
.som-zone-proof:nth-child(3){
  border-bottom-color:${spec.palette.grass};
}
.som-zone-card{
  border-top:8px solid ${spec.palette.sun};
  min-height:100%;
}
.som-zone-card:nth-child(2){
  border-top-color:${spec.palette.grass};
}
.som-zone-card:nth-child(3){
  border-top-color:${spec.palette.leaf};
}
.som-zone-note{
  border-left:7px solid ${spec.palette.sun};
}
.som-zone-process{
  box-shadow:inset 0 1px 0 color-mix(in srgb, ${spec.palette.deepGreen} 8%, transparent);
}
.som-zone-step{
  border-left:7px solid ${spec.palette.sun};
}
.som-zone-step:nth-child(2){
  border-left-color:${spec.palette.grass};
}
.som-zone-step:nth-child(3){
  border-left-color:${spec.palette.leaf};
}
.som-zone-step-number{
  display:flex;
  align-items:center;
  justify-content:center;
  width:54px;
  height:54px;
  box-sizing:border-box;
  border-radius:6px;
  margin:0!important;
  padding:0!important;
  white-space:nowrap;
}
#zones,
#process,
#quote{
  scroll-margin-top:128px;
}
@media (max-width:900px){
  .som-zone-header{
    padding-right:24px!important;
    padding-left:24px!important;
  }
  .som-zone-header-action{
    display:none;
  }
}
@media (max-width:700px){
  .som-zone-header .wp-block-columns{
    gap:12px!important;
  }
  .som-zone-hero{
    padding-top:28px!important;
    padding-right:24px!important;
    padding-bottom:44px!important;
    padding-left:24px!important;
  }
  .som-zone-hero > .wp-block-columns{
    display:flex!important;
    flex-direction:column-reverse;
    gap:24px!important;
  }
  .som-zone-photo img{
    min-height:220px;
    aspect-ratio:16/10;
    border-radius:8px;
  }
  .som-zone-hero h1{
    font-size:clamp(38px, 10.5vw, 50px)!important;
  }
  .som-zone-map{
    display:none;
  }
  .som-zone-proof-strip,
  .som-zone-plans,
  .som-zone-process,
  .som-quote-strip{
    padding-right:24px!important;
    padding-left:24px!important;
  }
  .som-zone-note{
    padding:22px!important;
  }
}
`.trim();
  }

  if (variant === "workshop-bench") {
    return `
.som-workshop-header{
  border-bottom:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 12%, transparent);
}
.som-workshop-header .wp-block-site-logo img{
  max-width:min(235px, 62vw);
}
.som-workshop-header .wp-block-navigation a{
  border-radius:6px;
  padding:8px 12px;
}
.som-workshop-header .wp-block-navigation a:hover{
  background:color-mix(in srgb, ${spec.palette.leaf} 16%, transparent);
  text-decoration:none;
}
.som-workshop-hero{
  background-image:radial-gradient(circle at 78% 18%, color-mix(in srgb, ${spec.palette.leaf} 20%, transparent), transparent 34%), linear-gradient(135deg, rgba(255,255,255,.05), rgba(255,255,255,0));
}
.som-workshop-photo img{
  width:100%;
  min-height:520px;
  aspect-ratio:16/10;
  object-fit:cover;
  object-position:center center;
  border-radius:8px;
  box-shadow:0 28px 80px rgba(0,0,0,.28);
}
.som-workshop-ticket{
  border:1px solid color-mix(in srgb, ${spec.palette.sun} 38%, transparent);
  box-shadow:0 16px 42px rgba(0,0,0,.18);
}
.som-workshop-ticket strong{
  color:${spec.palette.sun};
  font-weight:900;
}
.som-ticket-line:last-child{
  margin-bottom:0!important;
}
.som-material-proof,
.som-wood-card,
.som-care-note,
.som-craft-step{
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-material-proof{
  border-bottom:6px solid ${spec.palette.leaf};
  min-height:100%;
}
.som-wood-card{
  border-top:8px solid ${spec.palette.leaf};
  min-height:100%;
}
.som-wood-card:nth-child(2){
  border-top-color:${spec.palette.sun};
}
.som-wood-card:nth-child(3){
  border-top-color:${spec.palette.grass};
}
.som-care-note{
  border-left:7px solid ${spec.palette.leaf};
}
.som-craft-process{
  box-shadow:inset 0 1px 0 color-mix(in srgb, ${spec.palette.deepGreen} 8%, transparent);
}
.som-craft-step{
  border-left:7px solid ${spec.palette.sun};
}
.som-craft-step-number{
  display:flex;
  align-items:center;
  justify-content:center;
  width:50px;
  height:50px;
  box-sizing:border-box;
  border-radius:6px;
  margin:0!important;
  padding:0!important;
  white-space:nowrap;
}
@media (max-width:900px){
  .som-workshop-header{
    padding-right:24px!important;
    padding-left:24px!important;
  }
  .som-workshop-header-action{
    display:none;
  }
}
@media (max-width:700px){
  .som-workshop-header .wp-block-columns{
    gap:12px!important;
  }
  .som-workshop-hero{
    padding-top:42px!important;
    padding-right:24px!important;
    padding-bottom:48px!important;
    padding-left:24px!important;
  }
  .som-workshop-photo img{
    min-height:300px;
    aspect-ratio:1/1;
    border-radius:8px;
  }
  .som-workshop-hero h1{
    font-size:clamp(38px, 10.8vw, 52px)!important;
  }
  .som-workshop-ticket{
    padding:16px!important;
  }
  .som-material-proof-rail,
  .som-wood-scope,
  .som-craft-process,
  .som-quote-strip{
    padding-right:24px!important;
    padding-left:24px!important;
  }
  .som-care-note{
    padding:22px!important;
  }
}
`.trim();
  }

  if (variant === "gallery-led") {
    return `
.som-gallery-image img{
  width:100%;
  min-height:350px;
  aspect-ratio:16/5.2;
  object-fit:cover;
  border-radius:30px;
  box-shadow:0 28px 80px rgba(5,45,63,.18);
}
.som-gallery-copy-row{
  position:relative;
  z-index:2;
  margin-top:-86px!important;
}
.som-gallery-copy,
.som-gallery-note,
.som-style-card,
.som-gallery-proof{
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-style-card{
  border-top:8px solid ${spec.palette.sun};
  min-height:100%;
}
.som-gallery-note{
  box-shadow:var(--wp--custom--som--shadow--lift);
}
@media (max-width:700px){
  .som-gallery-image img{
    min-height:190px;
    aspect-ratio:16/10;
    border-radius:24px;
  }
  .som-gallery-copy-row{
    margin-top:14px!important;
    gap:14px!important;
  }
  .som-gallery-copy,
  .som-gallery-note{
    padding:19px!important;
  }
  .som-gallery-copy h1{
    font-size:clamp(30px, 8.8vw, 40px)!important;
    line-height:1.04!important;
    margin-top:7px!important;
    margin-bottom:11px!important;
  }
  .som-gallery-copy p{
    font-size:16px!important;
    line-height:1.48!important;
  }
  .som-gallery-copy .wp-block-buttons{
    gap:9px!important;
  }
  .som-gallery-copy .wp-block-button__link{
    padding-top:12px!important;
    padding-bottom:12px!important;
  }
}
`.trim();
  }

  if (variant === "service-receipt-stack") {
    return `
.som-receipt-page{
  background:${spec.palette.cream};
}
.som-receipt-header{
  border-bottom:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 12%, transparent);
  position:sticky;
  top:0;
  z-index:10;
}
.som-receipt-header .wp-block-site-logo img{
  max-width:min(238px, 58vw);
}
.som-receipt-hero-shell,
.som-receipt-scope,
.som-receipt-safety,
.som-quote-strip{
  scroll-margin-top:128px;
}
.som-receipt-hero{
  background:${spec.palette.white};
  border:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 12%, transparent);
  border-radius:8px;
  box-shadow:var(--wp--custom--som--shadow--lift);
  overflow:hidden;
}
.som-receipt-hero .wp-block-media-text__content{
  padding:clamp(28px, 4vw, 56px);
}
.som-receipt-hero .wp-block-media-text__media{
  min-height:620px;
  background-position:50% 62%!important;
}
.som-receipt-card,
.som-receipt-step,
.som-receipt-detail{
  border:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 14%, transparent);
  border-radius:8px;
  box-shadow:none;
}
.som-receipt-card::before,
.som-receipt-step::before{
  content:"";
  display:block;
  height:4px;
  background:${spec.palette.sun};
  border-radius:999px;
  margin-bottom:14px;
}
.som-ticket-line{
  border-top:1px dashed color-mix(in srgb, ${spec.palette.deepGreen} 22%, transparent);
  display:flex;
  gap:16px;
  justify-content:space-between;
  padding:12px 0 0;
  margin-top:12px;
  font-family:var(--wp--preset--font-family--accent);
  font-size:13px;
}
.som-ticket-line span{
  color:${spec.palette.grass};
  font-weight:900;
  text-transform:uppercase;
}
.som-ticket-line strong{
  color:${spec.palette.deepGreen};
  text-align:right;
}
.som-receipt-proof{
  border-left:4px solid ${spec.palette.sun};
  padding-left:18px;
}
.som-receipt-table{
  background:${spec.palette.white};
  border:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 14%, transparent);
  border-radius:8px;
  margin-top:28px;
  overflow:hidden;
  width:100%;
  max-width:100%;
  box-sizing:border-box;
}
.som-receipt-table table{
  margin:0;
  width:100%;
  max-width:100%;
  table-layout:fixed;
}
.som-receipt-table th{
  color:${spec.palette.deepGreen};
  font-family:var(--wp--preset--font-family--accent);
  text-transform:uppercase;
  letter-spacing:0;
}
.som-receipt-table td:first-child{
  color:${spec.palette.deepGreen};
  font-weight:850;
}
.som-receipt-quote{
  background:${spec.palette.white};
  border-left:6px solid ${spec.palette.sun};
  border-radius:8px;
  margin:0;
  padding:20px 22px;
}
.som-receipt-quote p{
  color:${spec.palette.deepGreen};
  font-size:18px;
  font-weight:750;
  line-height:1.5;
}
.som-receipt-quote cite{
  color:${spec.palette.grass};
  font-family:var(--wp--preset--font-family--accent);
  font-size:13px;
  font-style:normal;
  font-weight:900;
  text-transform:uppercase;
}
.som-receipt-details{
  display:grid;
  gap:12px;
}
.som-receipt-detail{
  background:${spec.palette.white};
}
.som-receipt-detail summary{
  color:${spec.palette.deepGreen};
}
@media (max-width:860px){
  .som-receipt-header{
    position:relative;
  }
  .som-receipt-header-action{
    display:none;
  }
  .som-receipt-hero-shell{
    padding-top:22px!important;
    padding-right:24px!important;
    padding-left:24px!important;
  }
  .som-receipt-hero{
    display:block;
  }
  .som-receipt-hero .wp-block-media-text__content{
    padding:20px 22px 22px!important;
  }
  .som-receipt-hero .wp-block-media-text__media{
    min-height:144px;
    background-position:50% 52%!important;
  }
  .som-receipt-hero h1{
    font-size:clamp(34px, 9.4vw, 40px)!important;
    line-height:1.04!important;
    margin-top:10px!important;
    margin-bottom:12px!important;
  }
  .som-receipt-hero p{
    font-size:16px!important;
    line-height:1.48!important;
    margin-bottom:14px!important;
  }
  .som-receipt-hero .wp-block-buttons{
    gap:10px;
  }
  .som-receipt-hero .wp-block-button__link{
    padding-top:13px!important;
    padding-bottom:13px!important;
  }
  .som-receipt-card{
    display:none;
  }
  .som-receipt-table table,
  .som-receipt-table thead,
  .som-receipt-table tbody,
  .som-receipt-table tr,
  .som-receipt-table th,
  .som-receipt-table td{
    display:block;
    width:100%;
    max-width:100%;
    box-sizing:border-box;
  }
  .som-receipt-table thead{
    display:none;
  }
  .som-receipt-table tr{
    border-top:1px dashed color-mix(in srgb, ${spec.palette.deepGreen} 18%, transparent);
    padding:12px 0;
  }
  .som-receipt-table tr:first-child{
    border-top:0;
  }
  .som-receipt-table td{
    border:0;
    display:grid;
    grid-template-columns:minmax(82px, 32%) minmax(0, 1fr);
    gap:12px;
    padding:6px 14px;
    overflow-wrap:break-word;
  }
  .som-receipt-table td::before{
    color:${spec.palette.grass};
    content:"";
    font-family:var(--wp--preset--font-family--accent);
    font-size:12px;
    font-weight:900;
    text-transform:uppercase;
  }
  .som-receipt-table td:nth-child(1)::before{
    content:"Scope";
  }
  .som-receipt-table td:nth-child(2)::before{
    content:"Fit";
  }
  .som-receipt-table td:nth-child(3)::before{
    content:"Notes";
  }
}
`.trim();
  }

  if (variant !== "before-after-quote") {
    return "";
  }

  return `
.som-hero-photo img{
  width:100%;
  min-height:520px;
  aspect-ratio:4/3;
  object-fit:cover;
  border-radius:28px;
  box-shadow:0 28px 80px rgba(5,45,63,.18);
}
.som-chip,
.som-row-number,
.som-method-pill,
.som-timeline-number{
  border-radius:999px;
}
.som-row-number,
.som-timeline-number{
  display:flex;
  align-items:center;
  justify-content:center;
  box-sizing:border-box;
  margin:0!important;
  white-space:nowrap;
}
.som-row-number{
  width:56px;
  height:56px;
  padding:0!important;
}
.som-timeline-number{
  width:72px;
  height:72px;
  padding:0!important;
}
.som-before-after .wp-block-column,
.som-surface-row,
.som-timeline-step{
  box-shadow:0 16px 50px rgba(5,45,63,.08);
}
.som-timeline-step{
  border-bottom:1px solid rgba(5,45,63,.14);
}
.som-check-list,
.som-method-list{
  padding-left:1.25em;
}
.som-check-list li,
.som-method-list li{
  margin-bottom:.55em;
}
@media (max-width:700px){
  .som-split-hero{
    display:flex!important;
    flex-direction:column;
    gap:18px!important;
  }
  .som-split-hero > .wp-block-column:nth-child(2){
    order:-1;
  }
  .som-split-hero > .wp-block-column:first-child{
    padding-top:0!important;
    padding-bottom:0!important;
  }
  .som-hero-photo img{
    min-height:176px;
    aspect-ratio:16/8;
    border-radius:22px;
  }
  .som-split-hero h1{
    font-size:clamp(34px, 9.6vw, 46px)!important;
    line-height:1.04!important;
    margin-top:8px!important;
    margin-bottom:12px!important;
  }
  .som-split-hero p{
    font-size:16px!important;
    line-height:1.48!important;
  }
  .som-split-hero .wp-block-buttons{
    gap:10px!important;
  }
  .som-split-hero .wp-block-button__link{
    padding-top:12px!important;
    padding-bottom:12px!important;
  }
  .som-chip-row{
    display:none!important;
  }
  .som-before-after{
    gap:12px;
  }
  .som-quote-strip .wp-block-button__link{
    width:100%;
  }
}
`.trim();
}

function buildAliasVisualCss(spec) {
  const variant = layoutVariantFor(spec);
  const p = spec.palette;

  const galleryAliases = {
    "pet-portrait-gallery": `
.som-pet-gallery-hero{
  background:
    radial-gradient(circle at 12% 8%, color-mix(in srgb, ${p.sun} 24%, transparent), transparent 28%),
    linear-gradient(180deg, ${p.cream}, color-mix(in srgb, ${p.leaf} 10%, ${p.cream}));
}
.wp-block-image.som-pet-gallery-image{
  margin-right:auto;
  margin-left:auto;
  width:min(410px, 52%)!important;
}
.wp-block-image.som-pet-gallery-image img{
  aspect-ratio:auto;
  display:block;
  height:330px!important;
  min-height:0;
  object-position:50% 42%;
  width:100%!important;
  border-radius:999px 999px 34px 34px;
}
.som-pet-gallery-hero .som-gallery-copy-row{
  margin-top:-112px!important;
}
.som-pet-gallery-copy{
  flex-basis:58%!important;
  border-radius:34px!important;
  padding-top:24px!important;
  padding-bottom:24px!important;
}
.som-pet-gallery-copy h1{
  font-size:clamp(36px, 4vw, 52px)!important;
  line-height:1.02!important;
}
.som-pet-gallery-note{
  flex-basis:42%!important;
  transform:rotate(-1.2deg);
}
.som-pet-style-card{
  border-top:0!important;
  border-left:8px solid ${p.sun};
  border-radius:24px!important;
}
@media (max-width:700px){
  .wp-block-image.som-pet-gallery-image{
    width:100%!important;
  }
  .wp-block-image.som-pet-gallery-image img{
    height:190px!important;
    min-height:0;
    width:100%!important;
    aspect-ratio:16/11;
  }
  .som-pet-gallery-hero .som-gallery-copy-row{
    margin-top:12px!important;
  }
  .som-pet-gallery-copy{
    padding:20px!important;
  }
  .som-pet-gallery-copy h1{
    font-size:clamp(29px, 8vw, 36px)!important;
    line-height:1.04!important;
  }
  .som-pet-gallery-note{
    transform:none;
  }
}`.trim(),
    "dessert-table-gallery": `
.som-dessert-gallery-hero{
  background:${p.deepGreen};
  overflow:hidden;
}
.som-dessert-gallery-hero .wp-block-cover__image-background{
  border-radius:0!important;
  box-shadow:none!important;
  filter:saturate(1.08) contrast(1.04);
  min-height:100%!important;
  object-position:50% 52%!important;
}
.som-dessert-gallery-hero .som-gallery-copy-row{
  align-items:flex-end!important;
  margin-top:0!important;
  min-height:560px;
}
.som-dessert-gallery-note{
  border-radius:8px 34px 8px 34px!important;
  border:1px solid color-mix(in srgb, ${p.sun} 42%, transparent);
}
.som-dessert-gallery-copy{
  border-radius:34px 8px 34px 8px!important;
  border:1px solid color-mix(in srgb, ${p.white} 70%, transparent);
}
.som-dessert-gallery-copy h1{
  font-size:clamp(36px, 4.4vw, 58px)!important;
}
.som-dessert-gallery-proof{
  background:color-mix(in srgb, ${p.white} 8%, transparent)!important;
  border:1px solid color-mix(in srgb, ${p.sun} 28%, transparent);
  border-radius:8px 24px!important;
}
.som-dessert-proof-gallery{
  gap:12px!important;
}
.som-dessert-gallery-crop img{
  border:1px solid color-mix(in srgb, ${p.deepGreen} 12%, transparent);
  border-radius:8px!important;
  box-shadow:var(--wp--custom--som--shadow--lift);
  min-height:270px!important;
  object-fit:cover;
  width:100%;
}
.som-dessert-crop-wide img{
  object-position:50% 40%;
}
.som-dessert-crop-flavor img{
  object-position:22% 60%;
}
.som-dessert-crop-room img{
  object-position:76% 56%;
}
.som-dessert-client-quote{
  border-left:6px solid ${p.sun};
  color:${p.deepGreen};
  margin-top:22px!important;
  padding-left:18px;
}
.som-dessert-style-card{
  border-top:0!important;
  border-bottom:5px solid ${p.sun};
  border-radius:8px!important;
  box-shadow:none;
}
@media (max-width:700px){
  .som-dessert-gallery-hero{
    box-sizing:border-box;
    min-height:auto!important;
    max-width:100vw!important;
    padding-top:118px!important;
    width:100vw!important;
  }
  .som-dessert-gallery-hero *{
    box-sizing:border-box;
  }
  .som-dessert-gallery-hero .wp-block-cover__inner-container{
    max-width:100%!important;
    overflow:hidden;
  }
  .som-dessert-gallery-hero .som-gallery-copy-row{
    min-height:0;
    gap:12px!important;
    margin-left:0!important;
    margin-right:0!important;
    max-width:100%!important;
    width:100%!important;
  }
  .som-dessert-gallery-copy,
  .som-dessert-gallery-note{
    flex-basis:100%!important;
    max-width:calc(100vw - 32px)!important;
    padding:16px!important;
    width:100%!important;
  }
  .som-dessert-gallery-note{
    border-radius:8px 24px!important;
  }
  .som-dessert-gallery-copy h1{
    font-size:clamp(28px, 7.2vw, 34px)!important;
    hyphens:none;
    line-height:1.08!important;
    overflow-wrap:break-word;
    word-break:normal;
  }
  .som-dessert-gallery-copy p{
    font-size:15px!important;
    line-height:1.46!important;
  }
  .som-dessert-gallery-copy p:first-child{
    font-size:12px!important;
    line-height:1.25!important;
  }
  .som-dessert-gallery-copy .wp-block-buttons{
    margin-top:10px!important;
  }
  .som-dessert-proof-gallery{
    grid-template-columns:1fr!important;
  }
  .som-dessert-gallery-crop img{
    min-height:180px!important;
  }
}`.trim(),
    "balloon-backdrop-gallery": `
.som-balloon-gallery-hero{
  background:
    radial-gradient(circle at 12% 12%, color-mix(in srgb, ${p.sun} 30%, transparent), transparent 18%),
    radial-gradient(circle at 88% 18%, color-mix(in srgb, ${p.leaf} 28%, transparent), transparent 22%),
    linear-gradient(135deg, ${p.cream}, ${p.white});
}
.som-balloon-gallery-image img{
  aspect-ratio:16/6;
  height:300px!important;
  min-height:0;
  object-position:50% 44%;
  border-radius:80px 8px 80px 8px;
}
.som-balloon-gallery-copy,
.som-balloon-gallery-note,
.som-balloon-style-card{
  border-radius:32px 8px!important;
}
.som-balloon-gallery-hero .som-gallery-copy-row{
  margin-top:-118px!important;
  transform:rotate(-.45deg);
}
.som-balloon-gallery-copy{
  padding-top:24px!important;
  padding-bottom:24px!important;
}
.som-balloon-gallery-copy h1{
  font-size:clamp(34px, 3.9vw, 48px)!important;
  line-height:1.02!important;
}
.som-balloon-style-card:nth-child(odd){
  transform:translateY(14px);
}
@media (max-width:700px){
  .som-balloon-gallery-image img{
    min-height:176px;
    aspect-ratio:16/9;
    border-radius:34px 8px;
  }
  .som-balloon-gallery-hero .som-gallery-copy-row,
  .som-balloon-style-card:nth-child(odd){
    transform:none;
  }
  .som-balloon-gallery-copy h1{
    font-size:clamp(30px, 8.4vw, 38px)!important;
  }
}`.trim(),
    "picnic-proposal-lookbook": `
.som-picnic-gallery-hero{
  background:
    linear-gradient(90deg, ${p.cream} 0 64%, color-mix(in srgb, ${p.sun} 18%, ${p.white}) 64% 100%);
}
.wp-block-image.som-picnic-gallery-image{
  width:min(760px, 72%)!important;
  margin-right:0!important;
  margin-left:auto!important;
}
.som-picnic-gallery-image img{
  aspect-ratio:3/2;
  display:block;
  min-height:500px;
  object-position:50% 58%;
  width:100%!important;
  border-radius:8px;
}
.som-picnic-gallery-hero .som-gallery-copy-row{
  margin-top:-340px!important;
  margin-left:0!important;
  max-width:560px;
}
.som-picnic-gallery-copy,
.som-picnic-gallery-note{
  flex-basis:100%!important;
  width:100%!important;
  border-radius:8px!important;
}
.som-picnic-gallery-note{
  margin-top:16px!important;
}
.som-picnic-gallery-copy h1{
  font-size:clamp(38px, 4.7vw, 60px)!important;
}
.som-picnic-style-card{
  border-top:0!important;
  border-left:5px solid ${p.sun};
  border-radius:8px!important;
}
@media (max-width:900px){
  .wp-block-image.som-picnic-gallery-image{
    width:100%!important;
  }
  .som-picnic-gallery-image img{
    width:100%;
    min-height:180px;
    aspect-ratio:16/9;
    object-position:50% 58%;
  }
  .som-picnic-gallery-hero .som-gallery-copy-row{
    margin-top:14px!important;
    max-width:none;
  }
  .som-picnic-gallery-copy h1{
    font-size:clamp(30px, 8.4vw, 38px)!important;
  }
}`.trim(),
    "headshot-proof-gallery": `
.som-headshot-gallery-hero{
  background:${p.deepGreen};
}
.som-headshot-gallery-image img{
  aspect-ratio:21/9;
  height:250px!important;
  min-height:0;
  object-position:50% 38%;
  border-radius:4px;
  filter:saturate(.88) contrast(1.05);
}
.som-headshot-gallery-hero .som-gallery-copy-row{
  margin-top:-96px!important;
}
.som-headshot-gallery-copy,
.som-headshot-gallery-note,
.som-headshot-style-card{
  border-radius:4px!important;
}
.som-headshot-gallery-copy{
  box-shadow:none;
  padding-top:24px!important;
  padding-bottom:24px!important;
}
.som-headshot-gallery-copy h1{
  font-size:clamp(34px, 3.6vw, 46px)!important;
  line-height:1.02!important;
}
.som-headshot-style-card{
  border:1px solid color-mix(in srgb, ${p.deepGreen} 14%, transparent);
  border-top:0!important;
  box-shadow:none;
}
.som-headshot-gallery-proof{
  border-left:4px solid ${p.sun};
  box-shadow:none;
}
@media (max-width:700px){
  .som-headshot-gallery-image img{
    min-height:176px;
    aspect-ratio:16/9;
  }
  .som-headshot-gallery-copy h1{
    font-size:clamp(30px, 8.2vw, 37px)!important;
  }
}`.trim()
  };

  const menuAliases = {
    "street-food-menu-board": `
.som-streetfood-menu-hero{
  background:
    radial-gradient(circle at 78% 14%, color-mix(in srgb, ${p.sun} 28%, transparent), transparent 26%),
    linear-gradient(135deg, color-mix(in srgb, ${p.deepGreen} 92%, #000), ${p.deepGreen});
}
.som-streetfood-menu-photo img{
  aspect-ratio:16/9;
  min-height:390px;
  border-radius:4px;
  transform:rotate(.7deg);
}
.som-streetfood-menu-ticket{
  margin-top:-44px!important;
  margin-left:34px!important;
  border-radius:4px!important;
  transform:rotate(-.7deg);
}
.som-streetfood-menu-package{
  border-top:0!important;
  border-left:8px solid ${p.sun};
  border-radius:4px!important;
}
@media (max-width:700px){
  .som-streetfood-menu-photo img{
    transform:none;
  }
  .som-streetfood-menu-ticket{
    margin-left:0!important;
    transform:none;
  }
}`.trim(),
    "mocktail-cart-menu": `
.som-mocktail-menu-hero{
  background:
    radial-gradient(circle at 82% 12%, color-mix(in srgb, ${p.leaf} 34%, transparent), transparent 28%),
    linear-gradient(135deg, ${p.deepGreen}, color-mix(in srgb, ${p.grass} 52%, ${p.deepGreen}));
}
.som-mocktail-menu-photo img{
  aspect-ratio:3/4;
  display:block;
  margin-right:auto;
  margin-left:auto;
  min-height:560px;
  width:min(430px, 100%);
  border-radius:999px 999px 18px 18px;
}
.som-mocktail-menu-ticket{
  transform:translateY(-24px);
  border-radius:999px!important;
  background:${p.white}!important;
}
.som-mocktail-menu-package{
  border-top:0!important;
  border-bottom:8px solid ${p.leaf};
  border-radius:22px!important;
}
@media (max-width:700px){
  .som-mocktail-menu-photo img{
    min-height:320px;
    width:100%;
  }
  .som-mocktail-menu-ticket{
    transform:none;
    border-radius:22px!important;
  }
}`.trim()
  };

  const workshopAliases = {
    "sharp-route-bench": `
.som-sharp-hero{
  background:
    linear-gradient(90deg, color-mix(in srgb, ${p.deepGreen} 96%, #000), ${p.deepGreen});
}
.som-sharp-photo img{
  aspect-ratio:16/7;
  min-height:365px;
  object-position:50% 48%;
  border-radius:2px;
  filter:contrast(1.06) saturate(.92);
}
.som-edge-ticket{
  margin-top:-48px!important;
  width:min(82%, 560px);
  border-radius:2px!important;
}
.som-sharp-card{
  border-top:0!important;
  border-left:7px solid ${p.sun};
  border-radius:2px!important;
}
.som-edge-care-note{
  border-left-color:${p.sun}!important;
}`.trim(),
    "bike-route-workstand": `
.som-bike-hero{
  background:
    linear-gradient(90deg, color-mix(in srgb, ${p.leaf} 10%, transparent) 1px, transparent 1px),
    linear-gradient(0deg, color-mix(in srgb, ${p.white} 6%, transparent) 1px, transparent 1px),
    ${p.deepGreen};
  background-size:28px 28px;
}
.som-bike-hero h1{
  font-size:clamp(2.55rem, 4.6vw, 4.7rem)!important;
}
.som-workstand-photo img{
  aspect-ratio:16/11;
  min-height:520px;
  object-position:50% 44%;
  border-radius:8px;
  box-shadow:0 24px 70px rgba(0,0,0,.22);
}
.som-route-ticket{
  margin-left:auto!important;
  margin-right:24px!important;
  transform:translateY(-34px);
  width:min(86%, 560px);
  border-radius:8px!important;
}
.som-tune-card{
  border-top:0!important;
  border-bottom:8px solid ${p.leaf};
  border-radius:8px!important;
}
@media (max-width:700px){
  .som-bike-hero h1{
    font-size:clamp(2.15rem, 10vw, 2.85rem)!important;
  }
  .som-workstand-photo img{
    min-height:260px;
    aspect-ratio:16/10;
  }
  .som-route-ticket{
    margin-right:0!important;
    transform:none;
    width:auto;
  }
}`.trim(),
    "mural-lettering-workshop": `
.som-mural-hero{
  background:
    linear-gradient(135deg, ${p.deepGreen}, color-mix(in srgb, ${p.deepGreen} 82%, ${p.sun}));
}
.som-mural-photo img{
  aspect-ratio:16/8;
  min-height:420px;
  object-position:50% 45%;
  border-radius:0;
  box-shadow:18px 18px 0 color-mix(in srgb, ${p.sun} 72%, transparent);
}
.som-mural-ticket{
  border-left:8px solid ${p.sun};
  border-radius:0!important;
}
.som-mural-card{
  border-top:0!important;
  border-bottom:4px solid ${p.sun};
  border-radius:0!important;
}
.som-mural-care-note{
  border-radius:0!important;
}`.trim()
  };

  const storyAliases = {
    "micro-wedding-floral-story": `
.som-floral-story-hero{
  background:
    radial-gradient(circle at 12% 12%, color-mix(in srgb, ${p.sun} 18%, transparent), transparent 28%),
    radial-gradient(circle at 88% 0%, color-mix(in srgb, ${p.leaf} 18%, transparent), transparent 24%),
    linear-gradient(180deg, ${p.cream}, ${p.white});
}
.som-floral-story-hero .som-hero-photo img{
  min-height:440px;
  object-position:50% 58%;
  border-radius:120px 120px 8px 8px;
}
.som-floral-story-hero h1{
  font-size:clamp(40px, 4.6vw, 62px)!important;
  line-height:1.08!important;
}
.som-floral-support-card{
  border-left:0!important;
  border-top:5px solid ${p.leaf};
  border-radius:26px!important;
}
.som-floral-proof-band{
  background:color-mix(in srgb, ${p.leaf} 18%, ${p.cream})!important;
}
.som-floral-proof-card{
  background:color-mix(in srgb, ${p.white} 88%, ${p.cream})!important;
  border:1px solid color-mix(in srgb, ${p.leaf} 34%, transparent);
  border-radius:8px!important;
  box-shadow:none!important;
}
.som-floral-proof-card p:first-child{
  color:${p.deepGreen}!important;
  font-size:clamp(1.15rem, 2vw, 1.55rem)!important;
  line-height:1.08!important;
}
.som-floral-proof-card p:last-child{
  color:${p.soil}!important;
  font-size:1rem!important;
  font-weight:650!important;
}
.som-floral-consult-strip{
  background:linear-gradient(135deg, ${p.deepGreen}, color-mix(in srgb, ${p.deepGreen} 82%, ${p.leaf}))!important;
}
@media (max-width:700px){
  .som-floral-story-hero{
    padding-top:24px!important;
    padding-bottom:36px!important;
  }
  .som-floral-story-hero .wp-block-columns{
    gap:16px!important;
  }
  .som-floral-story-hero .som-hero-photo img{
    min-height:174px;
    aspect-ratio:16/8;
    border-radius:42px 42px 8px 8px;
  }
  .som-floral-story-hero h1{
    font-size:clamp(30px, 8.8vw, 39px)!important;
    margin-top:8px!important;
    margin-bottom:12px!important;
  }
  .som-floral-story-hero p{
    font-size:16px!important;
    line-height:1.45!important;
  }
  .som-floral-story-hero .wp-block-button__link{
    padding-top:12px!important;
    padding-bottom:12px!important;
  }
}`.trim(),
    "story-card-consult": `
.som-story-hero .som-hero-photo img{
  object-position:50% 50%;
}
.som-story-hero h1{
  font-size:clamp(42px, 4.8vw, 68px)!important;
  line-height:1.03!important;
}
@media (max-width:700px){
  .som-story-hero{
    padding-top:24px!important;
    padding-bottom:36px!important;
  }
  .som-story-hero .wp-block-columns{
    gap:16px!important;
  }
  .som-story-hero .som-hero-photo img{
    min-height:174px;
    aspect-ratio:16/8;
    border-radius:22px;
  }
  .som-story-hero h1{
    font-size:clamp(31px, 9vw, 40px)!important;
    line-height:1.04!important;
    margin-top:8px!important;
    margin-bottom:12px!important;
  }
  .som-story-hero p{
    font-size:16px!important;
    line-height:1.45!important;
  }
}`.trim(),
    "color-consult-story": `
.som-color-story-hero{
  background:
    linear-gradient(90deg, color-mix(in srgb, ${p.sun} 18%, transparent) 1px, transparent 1px),
    linear-gradient(0deg, color-mix(in srgb, ${p.deepGreen} 7%, transparent) 1px, transparent 1px),
    ${p.cream};
  background-size:42px 42px;
}
.som-color-story-hero.wp-block-media-text{
  border-top:1px solid color-mix(in srgb, ${p.deepGreen} 12%, transparent);
  border-bottom:1px solid color-mix(in srgb, ${p.deepGreen} 12%, transparent);
  column-gap:clamp(24px, 4vw, 58px);
  grid-template-columns:minmax(0, 1fr) minmax(0, 48%)!important;
  overflow:hidden;
}
.som-color-story-hero,
.som-color-story-hero *,
.som-color-support-card,
.som-color-proof-card,
.som-color-process-step{
  box-sizing:border-box;
  min-width:0;
}
.som-color-story-hero .wp-block-media-text__content{
  max-width:700px;
  padding:clamp(24px, 5vw, 64px) clamp(18px, 3vw, 44px) clamp(24px, 5vw, 64px) clamp(24px, 5vw, 72px);
}
.som-color-story-hero .wp-block-media-text__media{
  align-self:stretch;
  background-size:cover;
  min-height:620px;
  overflow:hidden;
}
.som-color-story-hero .wp-block-media-text__media img{
  border-left:12px solid ${p.white};
  box-shadow:none;
  filter:saturate(.96) contrast(1.03);
  min-height:620px;
  object-fit:cover;
  object-position:50% 52%;
  width:100%;
}
.som-color-room-list{
  display:grid;
  gap:10px;
  list-style:none;
  padding-left:0!important;
}
.som-color-room-list li{
  background:${p.white};
  border-left:5px solid ${p.sun};
  border-radius:6px;
  padding:12px 14px;
}
.som-color-support-card{
  background:${p.white};
  border-left:12px solid ${p.sun}!important;
  border-radius:6px!important;
  box-shadow:none;
}
.som-color-proof-card{
  background:${p.cream}!important;
  border-bottom:6px solid ${p.sun};
  border-radius:6px!important;
  box-shadow:none;
}
.som-color-process-step{
  background:${p.white};
  border:1px solid color-mix(in srgb, ${p.deepGreen} 12%, transparent);
  border-radius:6px;
  padding:20px 22px;
}
.som-color-process-step .wp-block-columns{
  flex-wrap:nowrap!important;
  overflow:hidden;
}
.som-color-process-step .wp-block-column{
  min-width:0;
  overflow-wrap:break-word;
}
.som-color-process-step .wp-block-column:first-child{
  flex:0 0 60px!important;
  max-width:60px;
  overflow:hidden;
}
.som-color-step-number{
  align-items:center;
  border-radius:50%;
  display:flex;
  height:44px;
  justify-content:center;
  margin:0!important;
  padding:0!important;
  width:44px;
}
.som-color-process-step + .som-color-process-step{
  margin-top:14px!important;
}
.som-color-consult-quote{
  border-left:6px solid ${p.leaf};
  color:${p.deepGreen};
  padding-left:18px;
}
.som-color-detail{
  background:color-mix(in srgb, ${p.white} 78%, transparent);
  border:1px solid color-mix(in srgb, ${p.deepGreen} 12%, transparent);
  border-radius:6px;
  margin-top:14px;
  padding:16px 18px;
}
.som-color-detail summary{
  color:${p.deepGreen};
  cursor:pointer;
  font-family:var(--wp--preset--font-family--accent);
  font-weight:850;
}
.som-color-consult-strip{
  background:${p.white}!important;
}
@media (max-width:900px){
  .som-color-story-hero.wp-block-media-text{
    display:flex!important;
    flex-direction:column-reverse;
    gap:0;
    padding-top:0!important;
    padding-bottom:0!important;
  }
  .som-color-story-hero .wp-block-media-text__content{
    max-width:none;
    padding:22px 0 30px!important;
  }
  .som-color-story-hero .wp-block-media-text__media,
  .som-color-story-hero .wp-block-media-text__media img{
    min-height:170px;
  }
  .som-color-story-hero .wp-block-media-text__media{
    width:100%;
  }
  .som-color-story-hero .wp-block-media-text__media img{
    border-left:0;
    border-top:10px solid ${p.white};
    max-height:220px;
  }
}
@media (max-width:700px){
  .som-color-story-hero h1{
    font-size:clamp(30px, 7.8vw, 36px)!important;
    line-height:1.04!important;
    margin-top:8px!important;
    margin-bottom:12px!important;
  }
  .som-color-story-hero p{
    font-size:16px!important;
    line-height:1.48!important;
    margin-bottom:14px!important;
  }
  .som-color-room-list li{
    padding:10px 12px;
  }
}`.trim()
  };

  const miscAliases = {
    "soundcheck-console": `
.som-sound-rail{
  background:
    linear-gradient(180deg, ${p.deepGreen}, color-mix(in srgb, ${p.deepGreen} 88%, #000))!important;
}
.som-sound-hero{
  background:
    radial-gradient(circle at 70% 14%, color-mix(in srgb, ${p.leaf} 28%, transparent), transparent 28%),
    ${p.deepGreen};
}
.som-sound-photo img{
  aspect-ratio:16/9;
  min-height:420px;
  border-radius:4px;
}
.som-sound-ticket{
  border-radius:4px!important;
  box-shadow:0 0 0 1px color-mix(in srgb, ${p.leaf} 38%, transparent), 0 18px 44px rgba(0,0,0,.2);
}
.som-sound-card{
  border-top:0!important;
  border-left:6px solid ${p.leaf};
  border-radius:4px!important;
}
@media (max-width:900px){
  .som-sound-photo img{
    min-height:160px;
    aspect-ratio:16/8;
  }
}`.trim(),
    "photo-booth-strip-packages": `
.som-booth-hero{
  background:
    repeating-linear-gradient(90deg, color-mix(in srgb, ${p.white} 8%, transparent) 0 18px, transparent 18px 36px),
    ${p.deepGreen};
}
.som-booth-photo img{
  aspect-ratio:3/4;
  min-height:560px;
  border-radius:4px;
  box-shadow:12px 12px 0 ${p.white}, 0 28px 80px rgba(0,0,0,.24);
}
.som-booth-ticket{
  border-radius:4px!important;
  transform:rotate(-1deg);
}
.som-booth-package{
  border-top:0!important;
  border-left:10px solid ${p.sun};
  border-radius:4px!important;
}
@media (max-width:700px){
  .som-booth-photo img{
    min-height:320px;
  }
  .som-booth-ticket{
    transform:none;
  }
}`.trim(),
    "bottom-dock-booking": `
.som-booking-hero{
  background:
    linear-gradient(90deg, color-mix(in srgb, ${p.leaf} 12%, transparent) 1px, transparent 1px),
    linear-gradient(0deg, color-mix(in srgb, ${p.white} 8%, transparent) 1px, transparent 1px),
    ${p.deepGreen};
  background-size:32px 32px;
}
.som-booking-photo img{
  aspect-ratio:16/10;
  min-height:430px;
  border-radius:22px;
}
.som-booking-ticket{
  margin-top:-30px!important;
  border-radius:18px!important;
}
.som-tune-package{
  border-top:0!important;
  border-bottom:8px solid ${p.leaf};
}`.trim(),
    "organizing-zone-board": `
.som-organizing-hero{
  background:
    linear-gradient(90deg, color-mix(in srgb, ${p.sun} 12%, transparent) 1px, transparent 1px),
    linear-gradient(0deg, color-mix(in srgb, ${p.deepGreen} 6%, transparent) 1px, transparent 1px),
    ${p.cream};
  background-size:26px 26px;
}
.som-organizing-photo img{
  aspect-ratio:3/4;
  min-height:610px;
  object-position:50% 48%;
  border-radius:44px 44px 8px 8px;
}
.som-shelf-map{
  border-radius:22px!important;
  transform:translateY(-18px);
}
.som-shelf-card{
  border-top:0!important;
  border-left:8px solid ${p.sun};
  border-radius:18px!important;
}
@media (max-width:700px){
  .som-organizing-photo img{
    min-height:230px;
    aspect-ratio:16/10;
  }
  .som-shelf-map{
    transform:none;
  }
}`.trim(),
    "turnover-receipt-board": `
.som-turnover-header{
  border-bottom-style:dashed;
}
.som-turnover-hero .wp-block-media-text__media{
  min-height:540px;
}
.som-turnover-card{
  transform:rotate(-.45deg);
}
.som-turnover-card:nth-child(even){
  transform:rotate(.45deg);
}
.som-host-proof-strip{
  background:color-mix(in srgb, ${p.leaf} 12%, ${p.cream})!important;
}
.som-turnover-table th{
  background:color-mix(in srgb, ${p.sun} 18%, ${p.white});
}
@media (max-width:700px){
  .som-turnover-hero-shell{
    padding-top:18px!important;
    padding-right:24px!important;
    padding-left:24px!important;
  }
  .som-turnover-hero .wp-block-media-text__content{
    padding:16px 22px 18px!important;
  }
  .som-turnover-hero .wp-block-media-text__media{
    min-height:165px!important;
  }
  .som-turnover-hero h1{
    font-size:clamp(28px, 7.8vw, 34px)!important;
    line-height:1.04!important;
    margin-top:8px!important;
    margin-bottom:10px!important;
  }
  .som-turnover-hero p{
    font-size:15px!important;
    line-height:1.42!important;
    margin-bottom:10px!important;
  }
  .som-turnover-hero .wp-block-buttons{
    gap:8px!important;
    margin-top:8px!important;
  }
  .som-turnover-hero .wp-block-button__link{
    padding-top:10px!important;
    padding-bottom:10px!important;
  }
}
@media (max-width:860px){
  .som-turnover-card,
  .som-turnover-card:nth-child(even){
    transform:none;
  }
}`.trim(),
    "furniture-refinish-proof": `
.som-furniture-hero-photo img{
  aspect-ratio:16/9;
  min-height:455px;
  object-position:50% 52%;
  border-radius:8px;
}
.som-furniture-split-hero h1{
  font-size:clamp(42px, 5.8vw, 76px)!important;
}
.som-furniture-before-after .wp-block-column{
  border:1px solid color-mix(in srgb, ${p.deepGreen} 14%, transparent);
  box-shadow:none;
}
.som-furniture-surface-row{
  border-left:8px solid ${p.sun};
  border-radius:8px!important;
}
.som-furniture-evidence-card{
  border-radius:8px!important;
}
.som-furniture-quote-strip{
  background:linear-gradient(135deg, ${p.deepGreen}, color-mix(in srgb, ${p.soil} 24%, ${p.deepGreen}))!important;
}
@media (max-width:700px){
  .som-furniture-hero-photo img{
    min-height:170px;
    aspect-ratio:16/8;
  }
}`.trim()
  };

  return galleryAliases[variant]
    || menuAliases[variant]
    || workshopAliases[variant]
    || storyAliases[variant]
    || miscAliases[variant]
    || "";
}
