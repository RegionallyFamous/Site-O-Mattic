import {
  layoutArchetypeFor,
  layoutVariantFor,
  renderFamilyForVariant
} from "./layout-archetypes.mjs";
import { componentRadiusPx } from "./production-polish-matrix.mjs";

function renderVariantForSpec(spec) {
  return renderFamilyForVariant(layoutVariantFor(spec));
}

export function buildGlobalStyles(spec) {
  const tokens = buildDesignTokens(spec);
  const colorRoles = tokens.colorRoles;

  return {
    version: 3,
    isGlobalStylesUserThemeJSON: true,
    settings: {
      appearanceTools: true,
      useRootPaddingAwareAlignments: true,
      border: {
        color: true,
        radius: true,
        radiusSizes: tokens.radiusSizes,
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
      dimensions: {
        aspectRatios: tokens.aspectRatios,
        minHeight: true
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
          colorRoles,
          colorStrategy: tokens.colorStrategy,
          pattern: spec.pattern,
          type: tokens.typography.custom
        }
      }
    },
    styles: {
      color: {
        background: colorRoles.paper.color,
        text: colorRoles.ink.color
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
            text: colorRoles.primary.color
          },
          typography: {
            textDecoration: "none",
            fontFamily: `var:preset|font-family|${tokens.typography.accentFontSlug}`,
            fontWeight: tokens.typography.linkWeight
          },
          ":hover": {
            color: {
              text: colorRoles.ink.color
            },
            typography: {
              textDecoration: "underline"
            }
          },
          ":focus": {
            outline: {
              color: colorRoles.action.color,
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
            background: colorRoles.action.color,
            text: colorRoles.ink.color
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
        "core/column": {
          spacing: {
            blockGap: "var:preset|spacing|40"
          }
        },
        "core/columns": {
          spacing: {
            blockGap: "var:preset|spacing|50"
          }
        },
        "core/cover": {
          spacing: {
            padding: {
              top: "var:preset|spacing|70",
              right: "var:preset|spacing|50",
              bottom: "var:preset|spacing|70",
              left: "var:preset|spacing|50"
            }
          }
        },
        "core/details": {
          border: {
            color: colorRoles.line.color,
            radius: "var(--wp--custom--som--radius--card)",
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
        "core/paragraph": {
          typography: {
            lineHeight: tokens.typography.bodyLineHeight
          }
        },
        "core/pullquote": {
          border: {
            color: colorRoles.proof.color,
            style: "solid",
            width: "0 0 0 6px"
          },
          typography: {
            fontFamily: `var:preset|font-family|${tokens.typography.displayFontSlug}`
          }
        },
        "core/quote": {
          border: {
            color: colorRoles.proof.color,
            style: "solid",
            width: "0 0 0 5px"
          },
          spacing: {
            padding: {
            left: "var:preset|spacing|40"
            }
          }
        },
        "core/separator": {
          color: {
            background: colorRoles.line.color
          }
        },
        "core/spacer": {
          spacing: {
            margin: {
              top: "0",
              bottom: "0"
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
  const colorRoles = buildColorRoleTokens(spec);
  const geometry = buildGeometryTokens(spec);
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
    radii: geometry.radii,
    radiusSizes: [
      { slug: "som-card", name: "SOM Card", size: geometry.radii.card },
      { slug: "som-panel", name: "SOM Panel", size: geometry.radii.panel },
      { slug: "som-image", name: "SOM Image", size: geometry.radii.image },
      { slug: "som-pill", name: "SOM Pill", size: geometry.radii.chip }
    ],
    aspectRatios: [
      { slug: "som-square", name: "SOM Square", ratio: "1" },
      { slug: "som-landscape", name: "SOM Landscape", ratio: "4/3" },
      { slug: "som-wide", name: "SOM Wide", ratio: "16/9" },
      { slug: "som-portrait", name: "SOM Portrait", ratio: "3/4" }
    ],
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
    colorRoles,
    colorStrategy: {
      name: layoutArchetypeFor(spec).colorStrategy,
      brandGradient: colorStrategy.brandGradient,
      highlightGradient: colorStrategy.highlightGradient
    }
  };
}

function buildColorRoleTokens(spec) {
  const fallbackRoles = {
    ink: "deepGreen",
    paper: "cream",
    field: "mist",
    line: "leaf",
    primary: "grass",
    action: "sun",
    proof: "leaf",
    muted: "soil",
    warning: "sun",
    shadowTint: "deepGreen"
  };
  const declaredRoles = spec.pattern?.colorRoles || {};
  return Object.fromEntries(Object.entries(fallbackRoles).map(([role, fallbackToken]) => {
    const token = declaredRoles[role] || fallbackToken;
    return [role, {
      token,
      color: paletteTokenColor(spec.palette, token) || paletteTokenColor(spec.palette, fallbackToken)
    }];
  }));
}

function paletteTokenColor(palette, token) {
  const key = String(token || "").replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
  return palette[key];
}

function cssRoleName(role) {
  return String(role).replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function buildGeometryTokens(spec) {
  const radius = componentRadiusPx(spec.pattern);
  return {
    radii: {
      chip: "999px",
      card: `${radius}px`,
      panel: `${Math.min(radius, 8)}px`,
      image: `${Math.min(radius, 8)}px`
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
      headingLineHeight: "1.04",
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
      headingLineHeight: "1.04",
      bodyLineHeight: "1.52"
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
      bodyLineHeight: "1.52"
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
      headingLineHeight: "1.04",
      bodyLineHeight: "1.52"
    },
    "industrial-seasonal-condensed": {
      body: stacks.humanist,
      display: stacks.sturdy,
      accent: stacks.receipt,
      scale: "wide",
      headingWeight: "820",
      actionWeight: "800",
      navWeight: "800",
      linkWeight: "800",
      headingLineHeight: "1.04",
      bodyLineHeight: "1.52"
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
      headingLineHeight: "1.04",
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
      headingLineHeight: "1.04",
      bodyLineHeight: "1.52"
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
      headingLineHeight: "1.04",
      bodyLineHeight: "1.52"
    },
    "mobile-action-ui-sans": {
      body: stacks.system,
      display: stacks.geometric,
      accent: stacks.sturdy,
      scale: "bold",
      headingWeight: "780",
      actionWeight: "780",
      navWeight: "760",
      linkWeight: "760",
      headingLineHeight: "1.04",
      bodyLineHeight: "1.52"
    },
    "clean-water-dashboard-sans": {
      body: stacks.system,
      display: stacks.geometric,
      accent: stacks.mono,
      scale: "generous",
      headingWeight: "740",
      actionWeight: "760",
      navWeight: "760",
      linkWeight: "760",
      headingLineHeight: "1.04",
      bodyLineHeight: "1.52"
    },
    "organized-grid-humanist-sans": {
      body: stacks.humanist,
      display: stacks.sturdy,
      accent: stacks.mono,
      scale: "compact",
      headingWeight: "760",
      actionWeight: "760",
      navWeight: "760",
      linkWeight: "760",
      headingLineHeight: "1.04",
      bodyLineHeight: "1.52"
    },
    "urgent-utility-checklist": {
      body: stacks.system,
      display: stacks.sturdy,
      accent: stacks.condensed,
      scale: "bold",
      headingWeight: "820",
      actionWeight: "820",
      navWeight: "800",
      linkWeight: "800",
      headingLineHeight: "1.04",
      bodyLineHeight: "1.52"
    },
    "craft-bench-sturdy-serif-sans": {
      body: stacks.humanist,
      display: stacks.book,
      accent: stacks.sturdy,
      scale: "soft",
      headingWeight: "660",
      actionWeight: "740",
      navWeight: "720",
      linkWeight: "720",
      headingLineHeight: "1.06",
      bodyLineHeight: "1.58"
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
      headingLineHeight: "1.04",
      bodyLineHeight: "1.54"
    }
  };
  treatments["polished-consultant-editorial-sans"] = {
    body: stacks.warmHumanist,
    display: stacks.editorial,
    accent: stacks.humanist,
    scale: "soft",
    headingWeight: "660",
    actionWeight: "800",
    navWeight: "800",
    linkWeight: "800",
    headingLineHeight: "1.04",
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
    headingLineHeight: "1.04",
    bodyLineHeight: "1.52"
  };
  treatments["sharp-craft-route-serif-sans"] = {
    body: stacks.humanist,
    display: stacks.book,
    accent: stacks.condensed,
    scale: "compact",
    headingWeight: "660",
    actionWeight: "740",
    navWeight: "720",
    linkWeight: "720",
    headingLineHeight: "1.06",
    bodyLineHeight: "1.56"
  };
  treatments["soft-systems-humanist-sans"] = {
    body: stacks.warmHumanist,
    display: stacks.friendly,
    accent: stacks.humanist,
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
    display: stacks.geometric,
    accent: stacks.humanist,
    scale: "generous",
    headingWeight: "800",
    actionWeight: "800",
    navWeight: "800",
    linkWeight: "800",
    headingLineHeight: "1.04",
    bodyLineHeight: "1.52"
  };
  treatments["living-route-humanist-field-guide"] = {
    body: stacks.system,
    display: stacks.warmHumanist,
    accent: stacks.friendly,
    scale: "soft",
    headingWeight: "700",
    actionWeight: "800",
    navWeight: "760",
    linkWeight: "760",
    labelWeight: "760",
    headingLineHeight: "1.07",
    bodyLineHeight: "1.6"
  };
  treatments["warm-story-card-serif-sans"] = {
    body: stacks.warmHumanist,
    display: stacks.book,
    accent: stacks.humanist,
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
    headingLineHeight: "1.04",
    bodyLineHeight: "1.54"
  };
  treatments["host-readiness-board-humanist-accent"] = {
    body: stacks.humanist,
    display: stacks.warmHumanist,
    accent: stacks.sturdy,
    scale: "compact",
    headingWeight: "760",
    actionWeight: "800",
    navWeight: "780",
    linkWeight: "780",
    labelWeight: "780",
    headingLineHeight: "1.05",
    bodyLineHeight: "1.56"
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
    headingLineHeight: "1.04",
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
    body: stacks.humanist,
    display: stacks.editorial,
    accent: stacks.sturdy,
    scale: "soft",
    headingWeight: "640",
    actionWeight: "700",
    navWeight: "680",
    linkWeight: "680",
    labelWeight: "700",
    headingLineHeight: "1.07",
    bodyLineHeight: "1.58"
  };
  treatments["polished-brand-editorial-sans"] = {
    body: stacks.system,
    display: stacks.geometric,
    accent: stacks.condensed,
    scale: "soft",
    headingWeight: "760",
    actionWeight: "800",
    navWeight: "760",
    linkWeight: "760",
    headingLineHeight: "1.04",
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
    actionWeight: "760",
    navWeight: "760",
    linkWeight: "760",
    headingLineHeight: "1.04",
    bodyLineHeight: "1.52"
  };
  treatments["romantic-editorial-serif-with-calm-planning-sans"] = {
    body: stacks.warmHumanist,
    display: stacks.fashion,
    accent: stacks.humanist,
    scale: "editorial",
    headingWeight: "620",
    actionWeight: "700",
    navWeight: "680",
    linkWeight: "680",
    labelWeight: "680",
    headingLineHeight: "1.08",
    bodyLineHeight: "1.62"
  };
  treatments["holiday-editorial-proof-serif-with-date-sans"] = {
    body: stacks.warmHumanist,
    display: stacks.fashion,
    accent: stacks.humanist,
    scale: "editorial",
    headingWeight: "640",
    actionWeight: "720",
    navWeight: "700",
    linkWeight: "700",
    labelWeight: "700",
    headingLineHeight: "1.06",
    bodyLineHeight: "1.6"
  };
  treatments["technical-bike-service-sans-with-compact-utility-labels"] = {
    body: stacks.system,
    display: stacks.condensed,
    accent: stacks.receipt,
    scale: "compact",
    headingWeight: "780",
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
    headingLineHeight: "1.04",
    bodyLineHeight: "1.56"
  };
  treatments["handcrafted-lettering-display-with-clean-shop-sans"] = {
    body: stacks.humanist,
    display: stacks.sturdy,
    accent: stacks.condensed,
    scale: "wide",
    headingWeight: "800",
    actionWeight: "740",
    navWeight: "720",
    linkWeight: "720",
    headingLineHeight: "1.06",
    bodyLineHeight: "1.54"
  };
  treatments["warm-portrait-serif-with-playful-labels"] = {
    body: stacks.warmHumanist,
    display: stacks.book,
    accent: stacks.humanist,
    scale: "editorial",
    headingWeight: "620",
    actionWeight: "700",
    navWeight: "680",
    linkWeight: "680",
    labelWeight: "680",
    headingLineHeight: "1.05",
    bodyLineHeight: "1.6"
  };
  treatments["pet-editorial-dock-serif-with-friendly-labels"] = {
    body: stacks.warmHumanist,
    display: stacks.book,
    accent: stacks.friendly,
    scale: "editorial",
    headingWeight: "640",
    actionWeight: "780",
    navWeight: "760",
    linkWeight: "760",
    headingLineHeight: "1.06",
    bodyLineHeight: "1.6"
  };
  treatments["botanical-field-guide-serif-with-utility-labels"] = {
    body: stacks.humanist,
    display: stacks.editorial,
    accent: stacks.typewriter,
    scale: "soft",
    headingWeight: "660",
    actionWeight: "780",
    navWeight: "760",
    linkWeight: "760",
    headingLineHeight: "1.07",
    bodyLineHeight: "1.58"
  };
  treatments["headshot-ledger-condensed-with-bookish-display"] = {
    body: stacks.system,
    display: stacks.book,
    accent: stacks.condensed,
    scale: "soft",
    headingWeight: "660",
    actionWeight: "740",
    navWeight: "720",
    linkWeight: "720",
    headingLineHeight: "1.06",
    bodyLineHeight: "1.58"
  };
  treatments["glass-count-ledger-humanist-accent"] = {
    body: stacks.system,
    display: stacks.book,
    accent: stacks.condensed,
    scale: "generous",
    headingWeight: "660",
    actionWeight: "740",
    navWeight: "720",
    linkWeight: "720",
    headingLineHeight: "1.06",
    bodyLineHeight: "1.56"
  };
  treatments["glass-proof-humanist-photo-quote"] = {
    body: stacks.humanist,
    display: stacks.warmHumanist,
    accent: stacks.sturdy,
    scale: "soft",
    headingWeight: "700",
    actionWeight: "760",
    navWeight: "740",
    linkWeight: "740",
    labelWeight: "720",
    headingLineHeight: "1.06",
    bodyLineHeight: "1.58"
  };
  treatments["glass-light-utility-sans"] = {
    body: stacks.system,
    display: stacks.humanist,
    accent: stacks.condensed,
    scale: "compact",
    headingWeight: "640",
    actionWeight: "700",
    navWeight: "700",
    linkWeight: "700",
    labelWeight: "680",
    headingLineHeight: "1.08",
    bodyLineHeight: "1.56"
  };
  treatments["flash-card-event-ui-sans"] = {
    body: stacks.system,
    display: stacks.geometric,
    accent: stacks.condensed,
    scale: "bold",
    headingWeight: "780",
    actionWeight: "780",
    navWeight: "760",
    linkWeight: "760",
    headingLineHeight: "1.04",
    bodyLineHeight: "1.52"
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
    headingWeight: "800",
    actionWeight: "760",
    navWeight: "760",
    linkWeight: "760",
    headingLineHeight: "1.04",
    bodyLineHeight: "1.52"
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
    headingLineHeight: "1.04",
    bodyLineHeight: "1.52"
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
  treatments["cool-portrait-serif-with-friendly-labels"] = treatments["warm-portrait-serif-with-playful-labels"];
  const treatmentVoice = treatments[treatment];
  const voice = normalizeTypographyVoice(treatmentVoice || treatments["friendly-bold-route-sans"]);

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
    labelWeight: voice.labelWeight,
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
      labelWeight: voice.labelWeight,
      headingLineHeight: voice.headingLineHeight,
      bodyLineHeight: voice.bodyLineHeight,
      fallbackTreatment: treatmentVoice ? "" : "friendly-bold-route-sans"
    }
  };
}

function normalizeTypographyVoice(rawVoice) {
  const body = safeFontStack(rawVoice.body, "body");
  const display = safeFontStack(rawVoice.display, "display");
  const accent = safeFontStack(rawVoice.accent, "accent");
  const serifDisplay = isSerifStack(display);
  const actionWeight = clampNumber(numericToken(rawVoice.actionWeight, 740), 620, 780);
  const navWeight = clampNumber(numericToken(rawVoice.navWeight, 720), 620, 760);
  const linkWeight = clampNumber(numericToken(rawVoice.linkWeight, 720), 620, 760);

  return {
    ...rawVoice,
    body,
    display,
    accent,
    headingWeight: String(clampNumber(numericToken(rawVoice.headingWeight, serifDisplay ? 660 : 760), serifDisplay ? 600 : 620, serifDisplay ? 720 : 820)),
    actionWeight: String(actionWeight),
    navWeight: String(navWeight),
    linkWeight: String(linkWeight),
    labelWeight: String(clampNumber(numericToken(rawVoice.labelWeight, Math.min(actionWeight, 720)), 600, 740)),
    headingLineHeight: String(clampNumber(numericToken(rawVoice.headingLineHeight, serifDisplay ? 1.06 : 1.04), 1.04, serifDisplay ? 1.12 : 1.08)),
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
      small: ["1rem", "0.98rem", "1.04rem"],
      body: ["1.02rem", "0.98rem", "1.08rem"],
      lead: ["1.2rem", "1.08rem", "1.34rem"],
      card: ["1.52rem", "1.28rem", "1.76rem"],
      section: ["2.85rem", "2rem", "3.35rem"],
      hero: ["4.25rem", "2.55rem", "4.85rem"]
    },
    soft: {
      small: ["1rem", "0.98rem", "1.05rem"],
      body: ["1.08rem", "1rem", "1.16rem"],
      lead: ["1.26rem", "1.12rem", "1.42rem"],
      card: ["1.58rem", "1.32rem", "1.78rem"],
      section: ["2.95rem", "2.05rem", "3.45rem"],
      hero: ["4.35rem", "2.58rem", "4.95rem"]
    },
    editorial: {
      small: ["1rem", "0.98rem", "1.05rem"],
      body: ["1.09rem", "1rem", "1.17rem"],
      lead: ["1.35rem", "1.14rem", "1.52rem"],
      card: ["1.7rem", "1.38rem", "1.94rem"],
      section: ["3.2rem", "2.18rem", "3.8rem"],
      hero: ["4.75rem", "2.65rem", "5.25rem"]
    },
    bold: {
      small: ["1rem", "0.98rem", "1.05rem"],
      body: ["1.05rem", "1rem", "1.12rem"],
      lead: ["1.3rem", "1.12rem", "1.48rem"],
      card: ["1.72rem", "1.38rem", "1.98rem"],
      section: ["3.05rem", "2.15rem", "3.55rem"],
      hero: ["4.55rem", "2.65rem", "5.05rem"]
    },
    wide: {
      small: ["1rem", "0.98rem", "1.04rem"],
      body: ["1.04rem", "0.98rem", "1.1rem"],
      lead: ["1.28rem", "1.1rem", "1.44rem"],
      card: ["1.68rem", "1.35rem", "1.9rem"],
      section: ["3rem", "2.08rem", "3.5rem"],
      hero: ["4.45rem", "2.6rem", "5rem"]
    },
    generous: {
      small: ["1rem", "0.98rem", "1.04rem"],
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
    "turnover-receipt-board": {
      brandGradient: `linear-gradient(135deg, ${p.deepGreen} 0%, ${p.grass} 54%, ${p.leaf} 100%)`,
      highlightGradient: `linear-gradient(135deg, ${p.sun} 0%, ${p.white} 58%, ${p.cream} 100%)`
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
    `  --wp--custom--som--type--label-weight: ${tokens.typography.labelWeight};`,
    `  --wp--custom--som--type--heading-line-height: ${tokens.typography.headingLineHeight};`,
    `  --wp--custom--som--type--body-line-height: ${tokens.typography.bodyLineHeight};`,
    ...Object.entries(tokens.colorRoles).map(([role, value]) => `  --wp--custom--som--color--${cssRoleName(role)}: ${value.color};`),
    ...Object.entries(tokens.radii).map(([slug, value]) => `  --wp--custom--som--radius--${slug}: ${value};`),
    ...Object.entries(tokens.shadows).map(([slug, value]) => `  --wp--custom--som--shadow--${slug}: ${value};`)
  ].join("\n");
  const colorUtilities = colorClasses
    .map(([slug, color]) => `.has-${slug}-color{color:${color}}.has-${slug}-background-color{background-color:${color}}`)
    .join("\n");
  const shadowUtilities = tokens.shadowPresets
    .map((item) => `.has-${item.slug}-box-shadow{box-shadow:${item.shadow}}`)
    .join("\n");
  const variantCss = [buildVariantCustomCss(spec), buildAliasVisualCss(spec)].filter(Boolean).join("\n");
  const variantCssBlock = variantCss ? `${variantCss}\n` : "";
  const coverMobileCss = usesCoverBlock(spec)
    ? `  .wp-block-cover{
    min-height:620px;
  }
  .wp-block-cover .wp-block-cover__image-background{
    object-position:62% 50%;
  }`
    : "";

  return normalizeReadableCssTypography(`
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
.wp-site-blocks :where(h1,h2,h3){
  font-family:var(--wp--preset--font-family--display);
  font-weight:var(--wp--custom--som--type--heading-weight);
  line-height:var(--wp--custom--som--type--heading-line-height);
}
.wp-site-blocks h1.wp-block-heading{
  font-size:clamp(2.25rem, 5vw, var(--wp--preset--font-size--hero));
}
.wp-site-blocks h2.wp-block-heading{
  font-size:clamp(1.95rem, 4vw, var(--wp--preset--font-size--section-title));
}
.wp-site-blocks h3.wp-block-heading{
  font-size:clamp(1.25rem, 2vw, var(--wp--preset--font-size--card-title));
}
.wp-block-navigation a,
.wp-block-button__link{
  font-family:var(--wp--preset--font-family--accent);
}
.wp-block-navigation a{
  font-weight:var(--wp--custom--som--type--nav-weight);
}
.wp-block-button__link{
  font-weight:var(--wp--custom--som--type--action-weight);
}
.wp-site-blocks :where(p,li,summary,td,th){
  font-family:var(--wp--preset--font-family--body);
}
.wp-site-blocks :where(.som-chip,.som-method-pill,.som-ticket-line,.som-rail-note,.som-ticket-line span,.som-ticket-line strong){
  font-family:var(--wp--preset--font-family--accent);
  font-weight:var(--wp--custom--som--type--label-weight);
}
${colorUtilities}
${shadowUtilities}
${buildSharedPolishCss(spec)}
.wp-block-cover .wp-block-cover__inner-container{
  position:relative;
  z-index:1;
}
.som-text-logo{
  color:var(--wp--custom--som--color--ink);
  font-family:var(--wp--preset--font-family--display);
  font-size:clamp(20px, 2vw, 28px);
  font-style:normal;
  font-weight:760;
  line-height:1.05;
  letter-spacing:0;
  margin:0;
  max-inline-size:min(24ch, 64vw);
  overflow-wrap:normal;
  text-wrap:balance;
}
.has-deep-green-background-color .som-text-logo,
.has-grass-background-color .som-text-logo,
.has-soil-background-color .som-text-logo,
.som-side-rail .som-text-logo,
.som-sound-rail .som-text-logo{
  color:var(--wp--preset--color--white);
}
${variantCssBlock}@media (max-width:700px){
  .wp-site-blocks :where(.som-proof-card,.som-route-proof-card){
    grid-template-rows:auto auto;
    row-gap:14px;
  }
${coverMobileCss}
  .wp-block-navigation__responsive-container-open{
    min-width:44px;
    min-height:44px;
  }
}
`.trim(), tokens.typography);
}

function normalizeReadableCssTypography(css, typography = {}) {
  const labelWeight = String(Math.min(Number.parseInt(typography.labelWeight || typography.actionWeight || "740", 10) || 740, 740));

  return css.replace(/([^{}]+)\{([^{}]*)\}/g, (match, selector, body) => {
    const fontSize = body.match(/font-size:\s*([^;]+);/i)?.[1];
    if (!cssFontSizeIsBelowOneRem(fontSize)) {
      return match;
    }

    const weight = Number.parseInt(body.match(/font-weight:\s*([0-9]+)/i)?.[1] || "", 10);
    const isHeavy = Number.isFinite(weight) && weight >= 760;
    const isUtility = /text-transform:\s*uppercase/i.test(body)
      || /\b(?:som-|wp-block-navigation|wp-block-button|caption|summary)\b/i.test(selector);
    if (!isUtility && !isHeavy) {
      return match;
    }

    let nextBody = body.replace(/font-size:\s*[^;]+;/i, "font-size:1rem;");
    if (isHeavy) {
      nextBody = nextBody.replace(/font-weight:\s*[0-9]+;/i, `font-weight:${labelWeight};`);
    }

    return `${selector}{${nextBody}}`;
  });
}

function cssFontSizeIsBelowOneRem(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const px = normalized.match(/^([0-9.]+)px$/);
  if (px) {
    return Number(px[1]) < 16;
  }
  const rem = normalized.match(/^([0-9.]+)rem$/);
  if (rem) {
    return Number(rem[1]) < 1;
  }
  return false;
}

function buildSharedPolishCss(spec) {
  const p = spec.palette;
  const includeSectionAnchor = needsSectionAnchorSupport(spec);
  const tableSupportClasses = scopedTableSupportClasses(spec);
  const includeDetailGrid = detailGridSupportClasses(spec).length > 0;
  const sectionAnchorCss = includeSectionAnchor ? buildSectionAnchorSupportCss(p) : "";
  const detailGridCss = includeDetailGrid ? buildDetailGridSupportCss() : "";
  const scopedTableCss = tableSupportClasses.length ? buildScopedTableSupportCss(p, tableSupportClasses) : "";
  const mobileSupportCss = buildSharedMobileSupportCss(p, {
    includeSectionAnchor,
    includeDetailGrid,
    tableSupportClasses
  });
  const accessibleHiddenTableHeadCss = buildAccessibleHiddenTableHeadCss();

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
.wp-site-blocks :where(.som-chip,.som-method-pill,.som-ticket-line,.som-rail-note,.som-route-card-number,.som-haul-number,.som-timeline-number,.som-water-step-number,.som-zone-step-number,.som-craft-step-number,.som-row-number,.som-detail-step-number,.som-menu-step-number,.som-warning-number,.som-urgent-step-number){
  max-inline-size:none;
  font-weight:var(--wp--custom--som--type--label-weight);
}
.wp-site-blocks :where(.som-chip,.som-method-pill,.som-ticket-line,.som-ticket-list,.som-rail-note,.som-route-status-label,.som-route-card-number,.som-route-process-label,.som-story-phone-line){
  font-size:var(--wp--preset--font-size--small);
  line-height:1.45;
}
.wp-block-button__link{
  box-shadow:var(--wp--custom--som--shadow--button);
  transition:box-shadow .18s ease, background-color .18s ease, color .18s ease;
}
.wp-block-button__link[href^="tel:"]{
  white-space:nowrap;
}
.wp-block-button__link:hover{
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
@media (prefers-reduced-motion: reduce){
  html{
    scroll-behavior:auto;
  }
  .wp-block-button__link{
    transition:none;
  }
}
${sectionAnchorCss}
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
.wp-site-blocks :where(.som-proof-card,.som-route-proof-card){
  display:grid;
  grid-template-rows:minmax(2.1em, auto) auto;
  align-content:space-between;
  row-gap:clamp(14px, 2vw, 24px);
}
.wp-site-blocks :where(.som-proof-card,.som-route-proof-card) > :first-child{
  align-self:start;
  min-block-size:1.02em;
  margin-top:0;
  margin-bottom:0;
  font-family:var(--wp--preset--font-family--display);
  line-height:1;
  text-wrap:balance;
}
.wp-site-blocks :where(.som-proof-card,.som-route-proof-card) > :last-child{
  align-self:end;
  max-inline-size:28ch;
  margin-top:0;
  margin-bottom:0;
  font-family:var(--wp--preset--font-family--accent);
  font-size:var(--wp--preset--font-size--small);
  font-weight:var(--wp--custom--som--type--label-weight);
  line-height:1.42;
}
.wp-site-blocks :where(.som-proof-card,.som-route-proof-card) > :only-child{
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
.wp-block-columns > .wp-block-column{
  min-width:0;
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
  display:list-item;
  font-family:var(--wp--preset--font-family--accent);
  font-weight:var(--wp--custom--som--type--action-weight);
  min-block-size:44px;
  padding-block:8px;
}
.wp-block-details summary:focus-visible{
  outline:3px solid ${p.sun};
  outline-offset:4px;
}
${detailGridCss}
.som-side-rail-quote-band,
.som-workshop-quote-band,
.som-detail-quote-band,
.som-service-quote-band{
  border-bottom:1px solid color-mix(in srgb, ${p.deepGreen} 10%, transparent);
  border-radius:var(--wp--custom--som--radius--card);
  box-shadow:var(--wp--preset--shadow--card);
}
.som-side-rail-quote,
.som-workshop-quote,
.som-detail-quote,
.som-service-quote{
  margin:0;
  max-width:820px;
}
.wp-block-table table{
  border-collapse:collapse;
  width:100%;
}
.wp-block-table caption{
  color:${p.soil};
  caption-side:top;
  font-family:var(--wp--preset--font-family--accent);
  font-size:.78rem;
  font-weight:760;
  letter-spacing:0;
  padding:0 0 .55rem;
  text-align:left;
  text-transform:uppercase;
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
${scopedTableCss}
.som-section-intro{
  max-inline-size:760px;
  margin-left:0;
  margin-right:auto;
}
.som-section-intro > :where(h1,h2,h3,p){
  margin-left:0;
  margin-right:0;
}
.som-section-intro > p{
  max-inline-size:760px;
}
.wp-block-quote,
.wp-block-pullquote{
  border-color:${p.sun};
  color:${p.deepGreen};
}
@media (max-width:700px){
  .wp-block-button__link{
    box-sizing:border-box;
    max-width:100%;
  }
${mobileSupportCss}
  .wp-block-columns{
    gap:var(--wp--preset--spacing--50);
  }
  .wp-block-columns > .wp-block-column{
    max-width:100%;
  }
  .wp-site-blocks :where(h1,h2){
    hyphens:manual;
    overflow-wrap:break-word;
  }
}
${accessibleHiddenTableHeadCss}
`.trim();
}

function needsSectionAnchorSupport(spec) {
  return spec.pattern?.navigationPrimitive === "section-anchor-strip";
}

function usesCoverBlock(spec) {
  return ["dessert-table-gallery", "water-test-board", "turnover-receipt-board"].includes(layoutVariantFor(spec));
}

function detailGridSupportClasses(spec) {
  const variant = renderVariantForSpec(spec);
  const classes = [];
  if (["workshop-bench", "deck-finish-sample-board", "mural-lettering-workshop", "sharp-route-bench", "bike-route-workstand"].includes(variant)) {
    classes.push("som-workshop-details", "som-workshop-detail");
  }
  if (["fixed-bottom-action", "pet-portrait-booking-dock", "photo-booth-strip-packages"].includes(variant)) {
    classes.push("som-detail-details", "som-detail-detail");
  }
  if (variant === "route-plan") {
    classes.push("som-route-plan-details", "som-route-plan-detail");
  }
  if (variant === "lawn-route-status-board") {
    classes.push("som-route-detail");
  }
  return classes;
}

function scopedTableSupportClasses(spec) {
  const variant = renderVariantForSpec(spec);
  const classes = [];
  if (["workshop-bench", "deck-finish-sample-board", "mural-lettering-workshop", "sharp-route-bench", "bike-route-workstand"].includes(variant)) {
    classes.push("som-workshop-scope-table");
  }
  if (["fixed-bottom-action", "pet-portrait-booking-dock", "photo-booth-strip-packages"].includes(variant)) {
    classes.push("som-detail-scope-table");
  }
  if (["before-after-quote", "furniture-refinish-proof"].includes(variant)) {
    classes.push("som-surface-scope-table");
  }
  if (variant === "route-plan") {
    classes.push("som-route-plan-table");
  }
  if (variant === "lawn-route-status-board") {
    classes.push("som-route-table");
  }
  return classes;
}

function buildSectionAnchorSupportCss(p) {
  return `
.som-section-anchor-strip{
  border-top:1px solid color-mix(in srgb, ${p.deepGreen} 10%, transparent);
  border-bottom:1px solid color-mix(in srgb, ${p.deepGreen} 10%, transparent);
}
.som-section-anchor-strip .wp-block-group.alignwide{
  gap:14px 22px;
  min-height:54px;
}
.som-section-anchor-label{
  flex:0 0 auto;
  margin:0;
}
.som-section-anchor-nav .wp-block-navigation__container{
  gap:8px 10px;
}
.som-section-anchor-nav .wp-block-navigation-item__content{
  border:1px solid color-mix(in srgb, ${p.deepGreen} 14%, transparent);
  border-radius:999px;
  padding:8px 12px;
  text-decoration:none;
}
.som-section-anchor-nav .wp-block-navigation-item__content:hover,
.som-section-anchor-nav .wp-block-navigation-item__content:focus-visible{
  background:color-mix(in srgb, ${p.sun} 14%, ${p.white});
  text-decoration:none;
}
.som-section-anchor-action{
  flex:0 0 auto;
}`.trim();
}

function buildDetailGridSupportCss() {
  return `
.som-workshop-details,
.som-detail-details,
.som-route-plan-details{
  display:grid;
  grid-template-columns:repeat(3, minmax(0, 1fr));
  gap:14px;
}
.som-workshop-detail,
.som-detail-detail,
.som-route-plan-detail{
  box-sizing:border-box;
  min-height:100%;
  padding:20px 22px;
}`.trim();
}

function buildScopedTableSupportCss(p, classNames) {
  const selectors = classNames.map((className) => `.${className}`).join(",\n");
  const tableSelectors = classNames.map((className) => `.${className} table`).join(",\n");
  const firstCellSelectors = classNames.map((className) => `.${className} tbody th[scope="row"], .${className} td:first-child`).join(",\n");

  return `
${selectors}{
  margin-top:28px;
  overflow-x:auto;
}
${tableSelectors}{
  table-layout:fixed;
}
${firstCellSelectors}{
  color:${p.deepGreen};
  font-family:var(--wp--preset--font-family--accent);
  font-weight:800;
}`.trim();
}

function buildAccessibleHiddenTableHeadCss() {
  const tableClasses = [
    "som-workshop-scope-table",
    "som-detail-scope-table",
    "som-surface-scope-table",
    "som-route-plan-table",
    "som-route-table",
    "som-menu-table",
    "som-water-table",
    "som-receipt-table",
    "som-method-table",
    "som-turnover-table"
  ];
  const headSelectors = tableClasses.map((className) => `.${className} thead`).join(",\n");
  const childSelectors = tableClasses.flatMap((className) => [
    `.${className} thead tr`,
    `.${className} thead th`
  ]).join(",\n");
  return `
@media (max-width:900px){
${headSelectors}{
  border:0;
  clip:rect(0 0 0 0);
  clip-path:inset(50%);
  height:1px;
  margin:-1px;
  max-height:1px;
  max-width:1px;
  overflow:hidden;
  padding:0;
  position:absolute;
  white-space:nowrap;
  width:1px;
}
${childSelectors}{
  border:0;
  box-sizing:border-box;
  display:block;
  height:1px;
  line-height:1;
  margin:0;
  max-height:1px;
  max-width:1px;
  overflow:hidden;
  padding:0;
  white-space:nowrap;
  width:1px;
}
}`.trim();
}

function buildSharedMobileSupportCss(p, options) {
  const chunks = [];
  if (options.includeSectionAnchor) {
    chunks.push(`
  .som-section-anchor-strip{
    padding-top:12px;
    padding-bottom:12px;
  }
  .som-section-anchor-strip .wp-block-group.alignwide{
    align-items:flex-start;
    gap:10px;
  }
  .som-section-anchor-label{
    inline-size:100%;
  }
  .som-section-anchor-nav{
    overflow-x:auto;
    max-width:100%;
    padding-bottom:2px;
  }
  .som-section-anchor-nav .wp-block-navigation__container{
    flex-wrap:nowrap;
    justify-content:flex-start;
  }
  .som-section-anchor-nav .wp-block-navigation-item__content{
    white-space:nowrap;
    padding:8px 10px;
  }
  .som-section-anchor-action{
    inline-size:100%;
  }
  .som-section-anchor-action .wp-block-button,
  .som-section-anchor-action .wp-block-button__link{
    inline-size:100%;
    text-align:center;
  }`.trim());
  }
  if (options.includeDetailGrid) {
    chunks.push(`
  .som-workshop-details,
  .som-detail-details,
  .som-route-plan-details{
    grid-template-columns:1fr;
  }`.trim());
  }
  if (options.tableSupportClasses.length) {
    const tableParts = options.tableSupportClasses.flatMap((className) => [
      `  .${className} table`,
      `  .${className} thead`,
      `  .${className} tbody`,
      `  .${className} tr`,
      `  .${className} th`,
      `  .${className} td`
    ]).join(",\n");
    const headParts = options.tableSupportClasses.map((className) => `  .${className} thead`).join(",\n");
    const rowParts = options.tableSupportClasses.map((className) => `  .${className} tr`).join(",\n");
    const cellParts = options.tableSupportClasses.map((className) => `  .${className} td`).join(",\n");
    const lastCellParts = options.tableSupportClasses.map((className) => `  .${className} td:last-child`).join(",\n");
    chunks.push(`
${tableParts}{
    display:block;
  }
${headParts}{
    border:0;
    clip:rect(0 0 0 0);
    clip-path:inset(50%);
    height:1px;
    margin:-1px;
    overflow:hidden;
    padding:0;
    position:absolute;
    white-space:nowrap;
    width:1px;
  }
${rowParts}{
    border:1px solid color-mix(in srgb, ${p.deepGreen} 12%, transparent);
    border-radius:var(--wp--custom--som--radius--card);
    margin-bottom:12px;
    overflow:hidden;
  }
${cellParts}{
    border-bottom:1px solid color-mix(in srgb, ${p.deepGreen} 10%, transparent);
  }
${lastCellParts}{
    border-bottom:0;
  }`.trim());
  }
  return chunks.join("\n");
}

function buildVariantCustomCss(spec) {
  const variant = renderVariantForSpec(spec);

  if (variant === "gallery-led" && layoutVariantFor(spec) === "dessert-table-gallery") {
    return "";
  }

  if (variant === "route-plan") {
    return `
.som-route-plan-cover{
  overflow:hidden;
}
.som-route-plan-cover .wp-block-cover__background{
  background:linear-gradient(90deg, color-mix(in srgb, var(--wp--custom--som--color--ink) 18%, transparent), color-mix(in srgb, var(--wp--custom--som--color--ink) 4%, transparent));
}
.som-route-hero-panel{
  border:1px solid color-mix(in srgb, var(--wp--custom--som--color--proof) 28%, transparent);
  box-shadow:0 24px 70px color-mix(in srgb, var(--wp--custom--som--color--shadow-tint) 18%, transparent);
}
.som-route-hero-panel .is-style-outline .wp-block-button__link{
  background:color-mix(in srgb, var(--wp--custom--som--color--field) 54%, var(--wp--custom--som--color--paper));
}
@media (max-width:700px){
  .som-route-plan-cover{
    padding-top:32px;
    padding-right:20px;
    padding-bottom:36px;
    padding-left:20px;
  }
  .som-route-hero-panel{
    padding:24px;
  }
}
`.trim();
  }

  if (variant === "lawn-route-status-board") {
    return `
.som-route-page{
  background:${spec.palette.cream};
}
.som-route-header{
  position:sticky;
  top:0;
  z-index:10;
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
  gap:14px;
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
.som-route-table tbody th[scope="row"]{
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
    margin-right:16px;
    margin-left:16px;
  }
}
@media (max-width:700px){
  .som-route-header{
    position:relative;
  }
  .som-route-header .wp-block-columns{
    gap:10px;
  }
  #routes,
  #notes,
  #proof,
  #quote{
    scroll-margin-top:28px;
  }
  .som-route-hero-shell{
    padding-top:38px;
    padding-right:24px;
    padding-left:24px;
  }
  .som-route-hero h1{
    font-size:clamp(38px, 11vw, 52px);
  }
  .som-route-hero-photo img{
    min-height:300px;
    aspect-ratio:1/1;
  }
  .som-route-status-board{
    margin-top:16px;
    margin-right:0;
    margin-left:0;
  }
  .som-route-board-row .wp-block-column{
    margin-bottom:10px;
  }
  .som-route-plans,
  .som-route-notes,
  .som-route-proof-board,
  .som-route-join{
    padding-right:24px;
    padding-left:24px;
  }
  .som-route-table{
    overflow:hidden;
  }
  .som-route-table table,
  .som-route-table tbody,
  .som-route-table tr,
  .som-route-table th,
  .som-route-table td{
    display:block;
    width:100%;
  }
  .som-route-table thead{
    border:0;
    clip:rect(0 0 0 0);
    clip-path:inset(50%);
    height:1px;
    margin:-1px;
    overflow:hidden;
    padding:0;
    position:absolute;
    white-space:nowrap;
    width:1px;
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
  .som-route-table tbody th[scope="row"]{
    width:auto;
  }
  .som-route-quote-card{
    padding:28px 22px;
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
  background-color:${spec.palette.deepGreen};
}
.som-urgent-photo{
  margin:0;
}
.som-urgent-photo img{
  width:100%;
  min-height:500px;
  aspect-ratio:4/5;
  object-fit:cover;
  object-position:58% 50%;
  border-radius:8px;
  box-shadow:0 28px 80px rgba(0,0,0,.28);
}
.som-date-board{
  width:100%;
  margin:0;
  border:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 14%, transparent);
  border-radius:8px;
  box-shadow:0 22px 60px rgba(0,0,0,.2);
}
.som-date-table{
  margin-top:14px;
}
.som-date-table table{
  margin:0;
}
.som-date-table caption{
  color:${spec.palette.soil};
}
.som-date-table thead{
  display:block;
}
.som-date-table thead tr{
  display:grid;
  grid-template-columns:minmax(0, .42fr) minmax(0, 1fr);
  border-top:0;
  padding:0 0 10px;
}
.som-date-table thead th{
  color:${spec.palette.soil};
  display:block;
  font-family:var(--wp--preset--font-family--accent);
  font-size:.72rem;
  letter-spacing:0;
  line-height:1.1;
  text-transform:uppercase;
}
.som-date-table tr{
  display:block;
  border-top:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 12%, transparent);
  padding:12px 0;
}
.som-date-table tr:first-child{
  border-top:0;
}
.som-date-table th,
.som-date-table td{
  display:block;
  border:0;
  padding:0;
}
.som-date-table th[scope="row"]{
  color:${spec.palette.deepGreen};
  font-family:var(--wp--preset--font-family--display);
  font-size:clamp(1.35rem, 2.5vw, 1.8rem);
  line-height:1;
}
.som-date-table td{
  color:${spec.palette.soil};
  font-size:.93rem;
  line-height:1.42;
  padding-top:6px;
}
.som-urgent-card{
  padding:26px;
  border:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 12%, transparent);
  border-radius:8px;
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
    font-size:clamp(2.8rem, 13vw, 4rem);
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
  border-radius:8px;
  box-shadow:0 28px 80px rgba(5,45,63,.18);
}
.som-check-card,
.som-check-detail,
.som-check-quote,
.som-urgency-band .som-proof-card{
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-check-card{
  border-left:6px solid ${spec.palette.sun};
}
.som-check-detail{
  padding:20px 22px;
}
.som-check-quote{
  margin-top:28px;
  max-width:760px;
  color:${spec.palette.white};
}
.som-check-quote cite{
  color:${spec.palette.sun};
  font-family:var(--wp--preset--font-family--accent);
  font-weight:850;
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
.som-risk-hero .wp-block-cover__inner-container{
  width:min(1180px,100%);
}
.som-risk-hero .wp-block-cover__background{
  background:linear-gradient(90deg, color-mix(in srgb, ${spec.palette.deepGreen} 88%, transparent), color-mix(in srgb, ${spec.palette.deepGreen} 62%, transparent) 48%, color-mix(in srgb, ${spec.palette.deepGreen} 42%, transparent));
  opacity:1;
}
.som-risk-hero .wp-block-cover__image-background{
  object-position:52% 50%;
}
.som-risk-copy{
  text-shadow:0 2px 18px rgba(0,0,0,.32);
}
.som-risk-panel,
.som-risk-area-note,
.som-warning-row,
.som-plan-step,
.som-risk-band .som-proof-card{
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-risk-panel,
.som-risk-area-note{
  border:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 10%, transparent);
}
.som-risk-checklist li + li{
  margin-top:8px;
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
  margin:0;
  padding:0;
  white-space:nowrap;
}
.som-plan-step{
  min-height:100%;
}
@media (max-width:700px){
  .som-risk-hero{
    min-height:760px;
    padding-top:42px;
    padding-bottom:42px;
  }
  .som-risk-hero .wp-block-columns{
    gap:18px;
  }
  .som-risk-hero h1{
    font-size:clamp(34px, 10vw, 44px);
    line-height:1.04;
    margin-top:8px;
    margin-bottom:12px;
  }
  .som-risk-copy > p{
    font-size:16px;
    line-height:1.48;
  }
  .som-risk-panel{
    padding:20px;
  }
  .som-risk-hero .wp-block-buttons{
    gap:10px;
  }
  .som-risk-hero .wp-block-button__link{
    padding-top:12px;
    padding-bottom:12px;
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
    padding-top:40px;
    padding-bottom:46px;
  }
  .som-surface-photo img{
    min-height:230px;
    aspect-ratio:16/10;
    border-radius:24px;
  }
  .som-surface-hero h1{
    font-size:clamp(42px, 12vw, 54px);
  }
  .som-season-note{
    padding:26px;
  }
}
`.trim();
  }

  if (variant === "stain-care") {
    return `
.som-fabric-hero{
  background-image:linear-gradient(135deg, rgba(51,182,166,.12), rgba(255,255,255,0));
}
@media (min-width:900px){
  .som-fabric-copy{
    order:2;
  }
  .som-fabric-media{
    order:1;
  }
}
.som-fabric-photo img{
  width:100%;
  min-height:420px;
  aspect-ratio:4/3;
  object-fit:cover;
  object-position:center center;
  border-radius:8px;
  box-shadow:0 28px 80px rgba(5,45,63,.18);
}
.som-care-note,
.som-fabric-proof,
.som-stain-card,
.som-fabric-detail{
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-care-note{
  border-left:6px solid ${spec.palette.leaf};
}
.som-fabric-care-list li + li{
  margin-top:8px;
}
.som-fabric-care-list strong,
.som-fabric-care-list li::marker{
  color:${spec.palette.deepGreen};
}
.som-stain-card{
  border-top:8px solid ${spec.palette.sun};
  min-height:100%;
}
.som-fabric-proof{
  min-height:100%;
}
.som-fabric-detail-grid{
  display:grid;
  grid-template-columns:repeat(3, minmax(0, 1fr));
  gap:14px;
}
.som-fabric-detail{
  box-sizing:border-box;
  min-height:100%;
  padding:20px 22px;
}
.som-fabric-detail summary{
  color:${spec.palette.deepGreen};
}
@media (max-width:700px){
  .som-fabric-hero{
    padding-top:42px;
    padding-bottom:48px;
  }
  .som-fabric-photo img{
    min-height:300px;
    aspect-ratio:1/1;
    border-radius:8px;
  }
  .som-fabric-hero h1{
    font-size:clamp(40px, 11vw, 54px);
  }
  .som-care-note{
    padding:22px;
  }
  .som-fabric-detail-grid{
    grid-template-columns:1fr;
  }
}
`.trim();
  }

  if (variant === "side-rail-service") {
    return `
.som-side-rail-shell{
  display:grid;
  grid-template-columns:minmax(250px, 280px) minmax(0, 1fr);
  align-items:start;
  max-width:100%;
  min-height:100vh;
  overflow-x:hidden;
}
.som-side-rail{
  position:sticky;
  top:0;
  z-index:5;
  width:100%;
  max-width:100%;
  min-height:100vh;
  box-sizing:border-box;
  border-right:1px solid rgba(32,38,45,.12);
  box-shadow:0 18px 60px rgba(32,38,45,.08);
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
.som-rail-actions .wp-block-button__link{
  font-size:15px;
  white-space:nowrap;
}
.som-side-main{
  min-width:0;
}
.som-haul-hero{
  background-image:linear-gradient(135deg, rgba(255,191,63,.1), rgba(255,255,255,0));
}
.som-haul-photo img{
  width:100%;
  min-height:520px;
  aspect-ratio:16/11;
  object-fit:cover;
  object-position:center center;
  border-radius:8px;
  box-shadow:0 28px 80px rgba(0,0,0,.24);
}
.som-donation-strip{
  box-shadow:inset 0 -1px 0 rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.22);
}
.som-haul-ticket{
  border:1px solid color-mix(in srgb, ${spec.palette.sun} 34%, transparent);
  box-shadow:0 18px 44px rgba(0,0,0,.14);
}
.som-haul-ticket:not(.som-sound-ticket) strong{
  color:${spec.palette.sun};
  font-weight:900;
}
.som-consult-hero{
  background-image:
    linear-gradient(180deg, color-mix(in srgb, ${spec.palette.white} 56%, transparent), color-mix(in srgb, ${spec.palette.mist} 68%, ${spec.palette.white})),
    linear-gradient(90deg, color-mix(in srgb, ${spec.palette.deepGreen} 6%, transparent) 1px, transparent 1px);
  background-size:auto, 36px 36px;
}
.som-consult-photo img{
  aspect-ratio:16/10;
  box-shadow:0 18px 48px rgba(23,34,53,.16);
  min-height:430px;
  object-position:58% 50%;
}
.som-consult-ticket{
  background:color-mix(in srgb, ${spec.palette.deepGreen} 94%, ${spec.palette.grass});
  border-color:color-mix(in srgb, ${spec.palette.sun} 42%, transparent);
  box-shadow:none;
  margin-top:22px;
  max-width:520px;
}
.som-consult-proof-strip{
  background:color-mix(in srgb, ${spec.palette.mist} 68%, ${spec.palette.white});
  border-bottom:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 12%, transparent);
  border-top:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 10%, transparent);
  box-shadow:none;
}
.som-consult-proof-strip .som-haul-proof{
  border:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 14%, transparent);
  border-left:5px solid ${spec.palette.leaf};
  box-shadow:none;
}
.som-ticket-line:last-child{
  margin-bottom:0;
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
  margin:0;
  padding:0;
  white-space:nowrap;
}
@media (max-width:900px){
  .som-side-rail-shell{
    display:block;
  }
  .som-side-rail{
    position:relative;
    width:100%;
    max-width:100%;
    min-height:auto;
    padding-right:24px;
    padding-left:24px;
    border-right:0;
    border-bottom:1px solid rgba(32,38,45,.12);
    box-shadow:0 12px 36px rgba(32,38,45,.06);
    overflow-x:hidden;
  }
  .som-side-rail{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:14px;
  }
  .som-rail-note,
  .som-rail-actions,
  .som-side-rail > .som-rail-actions,
  .som-side-rail .wp-block-buttons.som-rail-actions,
  .wp-site-blocks .som-side-rail .wp-block-buttons.som-rail-actions,
  .wp-site-blocks .som-side-rail .wp-block-buttons.som-rail-actions.is-layout-flex{
    display:none;
    width:0;
    height:0;
    margin:0;
    overflow:hidden;
  }
  .som-side-rail .wp-block-navigation{
    flex:0 0 44px;
    margin-left:auto;
  }
  .som-haul-hero{
    padding-top:42px;
    padding-right:24px;
    padding-bottom:48px;
    padding-left:24px;
  }
  .som-haul-hero > .wp-block-columns{
    display:flex;
    flex-direction:column;
    gap:18px;
  }
  .som-haul-hero .som-haul-media-column{
    order:-1;
  }
  .som-haul-hero .som-haul-copy-column{
    order:0;
  }
  .som-donation-strip,
  #take,
  #sort,
  #services,
  #process,
  #quote{
    padding-right:24px;
    padding-left:24px;
  }
  .som-haul-photo img{
    min-height:156px;
    aspect-ratio:16/7.5;
    border-radius:20px;
  }
  .som-haul-hero h1{
    font-size:clamp(32px, 9vw, 44px);
    line-height:1.04;
    margin-top:8px;
    margin-bottom:12px;
  }
  .som-haul-hero p{
    font-size:16px;
    line-height:1.48;
  }
  .som-haul-hero .wp-block-buttons{
    gap:10px;
  }
  .som-haul-hero .wp-block-button__link{
    padding-top:12px;
    padding-bottom:12px;
  }
  .som-haul-ticket{
    display:none;
  }
  .som-clearance-zone{
    padding:24px;
  }
}
`.trim();
  }

  if (variant === "package-menu-board") {
    return `
.som-menu-header{
  position:relative;
  z-index:4;
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
  background-color:${spec.palette.deepGreen};
  background-image:radial-gradient(circle at 78% 18%, color-mix(in srgb, ${spec.palette.sun} 24%, transparent), transparent 34%), linear-gradient(135deg, rgba(255,255,255,.04), rgba(255,255,255,0));
}
.som-menu-photo img{
  width:100%;
  min-height:440px;
  aspect-ratio:4/3;
  object-fit:cover;
  object-position:center center;
  border-radius:8px;
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
.som-menu-table,
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
  margin:0;
  padding:0;
  white-space:nowrap;
}
.som-menu-table{
  margin-top:24px;
  overflow:hidden;
}
.som-menu-table table{
  min-width:0;
  table-layout:fixed;
  width:100%;
}
.som-menu-table th{
  color:${spec.palette.deepGreen};
  font-family:var(--wp--preset--font-family--accent);
  font-size:13px;
  font-weight:900;
  letter-spacing:0;
  text-transform:uppercase;
}
.som-menu-table tbody th[scope="row"]{
  color:${spec.palette.deepGreen};
  font-weight:900;
}
.som-menu-table :where(th,td){
  overflow-wrap:anywhere;
}
@media (max-width:900px){
  .som-menu-header{
    padding-right:24px;
    padding-left:24px;
  }
  .som-menu-header-action{
    display:none;
  }
}
@media (max-width:700px){
  .som-menu-header .wp-block-columns{
    gap:12px;
  }
  .som-menu-hero .wp-block-columns{
    display:flex;
    flex-direction:column;
    min-width:0;
    max-width:100%;
    overflow-x:hidden;
  }
  .som-menu-hero .wp-block-column{
    flex-basis:auto;
    min-width:0;
    max-width:100%;
  }
  .som-menu-hero{
    padding-top:42px;
    padding-right:24px;
    padding-bottom:48px;
    padding-left:24px;
  }
  .som-menu-photo img{
    min-height:300px;
    aspect-ratio:1/1;
    border-radius:8px;
  }
  .som-menu-hero h1{
    font-size:clamp(38px, 11vw, 52px);
  }
  .som-menu-ticket{
    padding:16px;
  }
  .som-menu-table table,
  .som-menu-table thead,
  .som-menu-table tbody,
  .som-menu-table tr,
  .som-menu-table th,
  .som-menu-table td{
    display:block;
  }
  .som-menu-table thead{
    border:0;
    clip:rect(0 0 0 0);
    clip-path:inset(50%);
    height:1px;
    margin:-1px;
    overflow:hidden;
    padding:0;
    position:absolute;
    white-space:nowrap;
    width:1px;
  }
  .som-menu-table tr{
    border:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 12%, transparent);
    border-radius:var(--wp--custom--som--radius--card);
    margin-bottom:12px;
    overflow:hidden;
  }
  .som-menu-table :where(th[scope="row"],td){
    border-bottom:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 10%, transparent);
  }
  .som-menu-table td:last-child{
    border-bottom:0;
  }
  .som-menu-proof-strip,
  .som-menu-packages,
  .som-menu-event,
  .som-quote-strip{
    padding-right:24px;
    padding-left:24px;
  }
}
`.trim();
  }

  if (variant === "fixed-bottom-action") {
    return `
.som-fixed-page{
  position:relative;
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
  margin:0;
  padding:0;
  white-space:nowrap;
}
.som-mobile-action-bar{
  display:none;
}
@media (max-width:900px){
  .som-fixed-header{
    padding-right:24px;
    padding-left:24px;
  }
  .som-fixed-header-action{
    display:none;
  }
}
@media (max-width:700px){
  .som-fixed-page{
    --som-mobile-action-reserve:calc(126px + env(safe-area-inset-bottom));
    padding-bottom:var(--som-mobile-action-reserve);
  }
  .som-fixed-hero{
    padding-top:42px;
    padding-right:24px;
    padding-bottom:46px;
    padding-left:24px;
  }
  .som-detail-photo img{
    min-height:300px;
    aspect-ratio:1/1;
    border-radius:24px;
  }
  .som-fixed-hero h1{
    font-size:clamp(38px, 11vw, 52px);
  }
  .som-detail-ticket{
    padding:16px;
  }
  .som-detail-proof-strip,
  .som-detail-packages,
  .som-detail-route,
  .som-quote-strip{
    padding-right:24px;
    padding-left:24px;
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
    box-sizing:border-box;
    display:flex;
    flex-wrap:nowrap;
    width:100%;
    gap:8px;
    max-width:100%;
    overflow:hidden;
  }
  .som-mobile-action-bar .wp-block-button{
    flex:1 1 0;
    margin:0;
    min-width:0;
    width:auto;
  }
  .som-mobile-action-bar .wp-block-button.has-custom-width{
    flex-basis:0;
  }
  .som-mobile-action-bar .wp-block-button:first-child{
    flex:1 1 58%;
  }
  .som-mobile-action-bar .wp-block-button:last-child{
    flex:0 1 38%;
  }
  .som-mobile-action-bar .wp-block-button__link{
    min-height:44px;
    display:flex;
    align-items:center;
    justify-content:center;
    box-sizing:border-box;
    max-width:100%;
    padding-right:12px;
    padding-left:12px;
    white-space:nowrap;
    font-size:13px;
  }
  .som-footer{
    margin-bottom:var(--som-mobile-action-reserve);
    padding-bottom:96px;
  }
}
`.trim();
  }

  if (variant === "water-test-board") {
    return `
.som-water-header{
  position:relative;
  z-index:4;
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
  background:linear-gradient(90deg, color-mix(in srgb, ${spec.palette.deepGreen} 26%, transparent), color-mix(in srgb, ${spec.palette.deepGreen} 4%, transparent));
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
.som-water-table,
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
  margin:0;
  padding:0;
  white-space:nowrap;
}
.som-water-table{
  margin-top:24px;
  overflow:hidden;
}
.som-water-table table{
  min-width:0;
  table-layout:fixed;
  width:100%;
}
.som-water-table th{
  color:${spec.palette.deepGreen};
  font-family:var(--wp--preset--font-family--accent);
  font-size:13px;
  font-weight:900;
  letter-spacing:0;
  text-transform:uppercase;
}
.som-water-table tbody th[scope="row"]{
  color:${spec.palette.deepGreen};
  font-weight:900;
}
.som-water-table :where(th,td){
  overflow-wrap:anywhere;
}
@media (max-width:900px){
  .som-water-header{
    padding-right:24px;
    padding-left:24px;
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
    gap:12px;
  }
  .som-water-hero{
    min-height:690px;
    padding-top:32px;
    padding-right:20px;
    padding-bottom:36px;
    padding-left:20px;
  }
  .som-water-hero .wp-block-cover__image-background{
    object-position:58% 50%;
  }
  .som-water-board{
    padding:24px;
    border-radius:8px;
  }
  .som-water-board h1{
    font-size:clamp(38px, 10.6vw, 52px);
  }
  .som-water-mini-board{
    display:none;
  }
  .som-water-table table,
  .som-water-table thead,
  .som-water-table tbody,
  .som-water-table tr,
  .som-water-table th,
  .som-water-table td{
    display:block;
  }
  .som-water-table thead{
    border:0;
    clip:rect(0 0 0 0);
    clip-path:inset(50%);
    height:1px;
    margin:-1px;
    overflow:hidden;
    padding:0;
    position:absolute;
    white-space:nowrap;
    width:1px;
  }
  .som-water-table tr{
    border:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 12%, transparent);
    border-radius:var(--wp--custom--som--radius--card);
    margin-bottom:12px;
    overflow:hidden;
  }
  .som-water-table :where(th[scope="row"],td){
    border-bottom:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 10%, transparent);
  }
  .som-water-table td:last-child{
    border-bottom:0;
  }
  .som-water-proof-strip,
  .som-water-plans,
  .som-water-route,
  .som-quote-strip{
    padding-right:24px;
    padding-left:24px;
  }
}
`.trim();
  }

  if (variant === "zone-grid-planner") {
    return `
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
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:8px;
  margin-bottom:12px;
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
  margin:0;
  padding:0;
  white-space:nowrap;
}
#zones,
#process,
#quote{
  scroll-margin-top:128px;
}
@media (max-width:900px){
  .som-zone-header{
    padding-right:24px;
    padding-left:24px;
  }
  .som-zone-header-action{
    display:none;
  }
}
@media (max-width:700px){
  .som-zone-header .wp-block-columns{
    gap:12px;
  }
  .som-zone-hero{
    padding-top:28px;
    padding-right:24px;
    padding-bottom:44px;
    padding-left:24px;
  }
  .som-zone-hero > .wp-block-columns{
    display:flex;
    flex-direction:column-reverse;
    gap:24px;
  }
  .som-zone-photo img{
    min-height:220px;
    aspect-ratio:16/10;
    border-radius:8px;
  }
  .som-zone-hero h1{
    font-size:clamp(38px, 10.5vw, 50px);
  }
  .som-zone-map{
    display:none;
  }
  .som-zone-proof-strip,
  .som-zone-plans,
  .som-zone-process,
  .som-quote-strip{
    padding-right:24px;
    padding-left:24px;
  }
  .som-zone-note{
    padding:22px;
  }
}
`.trim();
  }

  if (variant === "workshop-bench") {
    return `
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
  margin-bottom:0;
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
  margin:0;
  padding:0;
  white-space:nowrap;
}
@media (max-width:900px){
  .som-workshop-header{
    padding-right:24px;
    padding-left:24px;
  }
  .som-workshop-header-action{
    display:none;
  }
}
@media (max-width:700px){
  .som-workshop-header .wp-block-columns{
    gap:12px;
  }
  .som-workshop-hero{
    padding-top:42px;
    padding-right:24px;
    padding-bottom:48px;
    padding-left:24px;
  }
  .som-workshop-photo img{
    min-height:300px;
    aspect-ratio:1/1;
    border-radius:8px;
  }
  .som-workshop-hero h1{
    font-size:clamp(38px, 10.8vw, 52px);
  }
  .som-workshop-ticket{
    padding:16px;
  }
  .som-material-proof-rail,
  .som-wood-scope,
  .som-craft-process,
  .som-quote-strip{
    padding-right:24px;
    padding-left:24px;
  }
  .som-care-note{
    padding:22px;
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
  border-radius:8px;
  box-shadow:0 28px 80px rgba(5,45,63,.18);
}
.som-gallery-copy-row{
  position:relative;
  z-index:2;
  margin-top:-86px;
}
.som-gallery-copy,
.som-gallery-note,
.som-style-card,
.som-proof-gallery,
.som-gallery-quote,
.som-gallery-proof{
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-proof-gallery{
  margin-bottom:24px;
}
.som-proof-gallery img{
  width:100%;
  max-height:520px;
  object-fit:cover;
  border-radius:8px;
}
.som-proof-gallery figcaption{
  color:${spec.palette.soil};
  font-family:var(--wp--preset--font-family--accent);
  font-weight:760;
}
.som-gallery-quote{
  margin-top:20px;
  padding:22px 26px;
  background:color-mix(in srgb, ${spec.palette.mist} 62%, ${spec.palette.white});
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
    border-radius:8px;
  }
  .som-gallery-copy-row{
    margin-top:14px;
    gap:14px;
  }
  .som-gallery-copy,
  .som-gallery-note{
    padding:19px;
  }
  .som-gallery-copy h1{
    font-size:clamp(30px, 8.8vw, 40px);
    line-height:1.04;
    margin-top:7px;
    margin-bottom:11px;
  }
  .som-gallery-copy p{
    font-size:16px;
    line-height:1.48;
  }
  .som-gallery-copy .wp-block-buttons{
    flex-wrap:wrap;
    gap:9px;
  }
  .som-gallery-copy .wp-block-button__link{
    padding-top:12px;
    padding-bottom:12px;
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
  position:sticky;
  top:0;
  z-index:10;
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
  align-self:stretch;
  min-height:0;
}
.som-receipt-hero .wp-block-media-text__media img{
  aspect-ratio:4/5;
  border-radius:0;
  display:block;
  height:100%;
  min-height:clamp(500px, 45vw, 620px);
  object-fit:cover;
  object-position:70% 50%;
  width:100%;
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
.som-receipt-table tbody th[scope="row"]{
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
    padding-top:22px;
    padding-right:24px;
    padding-left:24px;
  }
  .som-receipt-hero{
    display:block;
  }
  .som-receipt-hero .wp-block-media-text__content{
    padding:20px 22px 22px;
  }
  .som-receipt-hero .wp-block-media-text__media{
    min-height:0;
  }
  .som-receipt-hero .wp-block-media-text__media img{
    aspect-ratio:16/9;
    height:clamp(168px, 46vw, 240px);
    min-height:0;
    object-position:54% 50%;
  }
  .som-receipt-hero h1{
    font-size:clamp(34px, 9.4vw, 40px);
    line-height:1.04;
    margin-top:10px;
    margin-bottom:12px;
  }
  .som-receipt-hero p{
    font-size:16px;
    line-height:1.48;
    margin-bottom:14px;
  }
  .som-receipt-hero .wp-block-buttons{
    gap:10px;
  }
  .som-receipt-hero .wp-block-button__link{
    padding-top:13px;
    padding-bottom:13px;
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
    border:0;
    clip:rect(0 0 0 0);
    clip-path:inset(50%);
    height:1px;
    margin:-1px;
    overflow:hidden;
    padding:0;
    position:absolute;
    white-space:nowrap;
    width:1px;
  }
  .som-receipt-table tr{
    border-top:1px dashed color-mix(in srgb, ${spec.palette.deepGreen} 18%, transparent);
    padding:12px 0;
  }
  .som-receipt-table tr:first-child{
    border-top:0;
  }
  .som-receipt-table tbody th[scope="row"],
  .som-receipt-table td{
    border:0;
    display:grid;
    grid-template-columns:minmax(86px, 28%) minmax(0, 1fr);
    gap:12px;
    padding:6px 14px;
    overflow-wrap:break-word;
  }
  .som-receipt-table tbody th[scope="row"]::before,
  .som-receipt-table td::before{
    color:${spec.palette.grass};
    content:"";
    display:inline-block;
    font-family:var(--wp--preset--font-family--accent);
    font-size:1rem;
    font-weight:700;
    margin-right:12px;
    min-width:86px;
    text-transform:uppercase;
    white-space:nowrap;
  }
  .som-receipt-table tbody th[scope="row"]::before{
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
  border-radius:8px;
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
  margin:0;
  white-space:nowrap;
}
.som-row-number{
  width:56px;
  height:56px;
  padding:0;
}
.som-timeline-number{
  width:72px;
  height:72px;
  padding:0;
}
.som-before-after .wp-block-column,
.som-surface-row,
.som-timeline-step{
  box-shadow:0 16px 50px rgba(5,45,63,.08);
}
.som-floating-proof-action-wrap{
  position:relative;
  z-index:4;
  margin-top:-38px;
  margin-bottom:34px;
}
.som-floating-proof-action{
  background:${spec.palette.white};
  border:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 14%, transparent);
  box-shadow:0 24px 70px rgba(5,45,63,.16);
}
.som-floating-proof-cell{
  border-left:3px solid ${spec.palette.sun};
  padding-left:12px;
}
.som-floating-proof-buttons .wp-block-buttons{
  width:100%;
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
.som-method-table{
  margin:0;
  overflow:hidden;
}
.som-method-table table{
  min-width:0;
  table-layout:fixed;
  width:100%;
}
.som-method-table th{
  color:${spec.palette.deepGreen};
  font-family:var(--wp--preset--font-family--accent);
  font-size:13px;
  font-weight:900;
  letter-spacing:0;
  text-transform:uppercase;
}
.som-method-table tbody th[scope="row"]{
  color:${spec.palette.deepGreen};
  font-weight:900;
}
.som-method-table :where(th,td){
  overflow-wrap:anywhere;
}
.som-method-detail{
  margin-top:16px;
  padding:20px 22px;
}
.som-method-detail summary{
  color:${spec.palette.deepGreen};
}
@media (max-width:700px){
  .som-before-after-hero-wrap{
    --som-before-after-h1-size:clamp(30px, 8.4vw, 40px);
    --som-before-after-h1-line-height:1.06;
    --som-before-after-copy-size:16px;
    --som-before-after-copy-line-height:1.44;
    --som-before-after-copy-margin-bottom:18px;
    padding-top:32px;
    padding-bottom:44px;
  }
  .som-window-hero-wrap{
    --som-before-after-h1-size:clamp(32px, 8.8vw, 40px);
    --som-before-after-h1-line-height:1.08;
    padding-top:32px;
    padding-bottom:48px;
  }
  .som-split-hero{
    display:flex;
    flex-direction:column;
    gap:14px;
  }
  .som-before-after-hero-media-column{
    order:-1;
  }
  .som-before-after-hero-copy-column{
    order:0;
  }
  .som-window-hero-copy-column{
    order:0;
  }
  .som-window-hero-media-column{
    order:-1;
  }
  .som-split-hero > .wp-block-column:first-child{
    padding-top:0;
    padding-bottom:0;
  }
  .som-hero-photo img{
    min-height:176px;
    aspect-ratio:16/8;
    border-radius:8px;
  }
  .som-split-hero h1{
    margin-top:8px;
    margin-bottom:12px;
  }
  .som-window-hero-copy-column > p:first-child{
    font-size:13px;
    line-height:1.42;
  }
  .som-split-hero p{
    margin-bottom:18px;
  }
  .som-split-hero .wp-block-buttons{
    gap:8px;
  }
  .som-split-hero .wp-block-button__link{
    padding-top:11px;
    padding-bottom:11px;
  }
  .som-split-hero .som-chip-row{
    display:none;
  }
  .som-split-hero .som-before-after{
    display:none;
  }
  .som-before-after{
    gap:12px;
  }
  .som-method-table table,
  .som-method-table thead,
  .som-method-table tbody,
  .som-method-table tr,
  .som-method-table th,
  .som-method-table td{
    display:block;
  }
  .som-method-table thead{
    border:0;
    clip:rect(0 0 0 0);
    clip-path:inset(50%);
    height:1px;
    margin:-1px;
    overflow:hidden;
    padding:0;
    position:absolute;
    white-space:nowrap;
    width:1px;
  }
  .som-method-table tr{
    border:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 12%, transparent);
    border-radius:var(--wp--custom--som--radius--card);
    margin-bottom:12px;
    overflow:hidden;
  }
  .som-method-table :where(th[scope="row"],td){
    border-bottom:1px solid color-mix(in srgb, ${spec.palette.deepGreen} 10%, transparent);
  }
  .som-method-table caption{
    box-sizing:border-box;
    display:block;
    width:100%;
  }
  .som-method-table td:last-child{
    border-bottom:0;
  }
  .som-floating-proof-action-wrap{
    margin-top:0;
    margin-bottom:18px;
    padding-top:18px;
  }
  .som-floating-proof-action{
    display:flex;
    flex-direction:column;
    gap:14px;
    padding:18px;
  }
  .som-floating-proof-action .wp-block-column{
    flex-basis:auto;
    width:100%;
  }
  .som-floating-proof-stats .wp-block-columns{
    gap:10px;
  }
  .som-floating-proof-cell p:first-child{
    font-size:22px;
  }
  .som-quote-strip .wp-block-button__link{
    width:100%;
  }
}
@media (min-width:701px) and (max-width:899px){
  .som-window-hero-wrap{
    padding-top:38px;
    padding-bottom:56px;
  }
  .som-window-split-hero{
    display:flex;
    flex-direction:column;
    gap:22px;
  }
  .som-window-split-hero .som-chip-row{
    display:none;
  }
  .som-window-hero-copy-column,
  .som-window-hero-media-column{
    flex-basis:auto;
    width:100%;
  }
  .som-window-hero-copy-column{
    order:-1;
  }
  .som-window-hero-media-column{
    order:0;
  }
  .som-window-split-hero .som-window-hero-photo img{
    min-height:300px;
    aspect-ratio:16/8;
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
    radial-gradient(circle at 14% 12%, color-mix(in srgb, ${p.sun} 16%, transparent), transparent 30%),
    linear-gradient(180deg, color-mix(in srgb, ${p.cream} 88%, ${p.white}), color-mix(in srgb, ${p.leaf} 8%, ${p.cream}));
}
.wp-block-image.som-pet-gallery-image{
  margin:0;
}
.wp-block-image.som-pet-gallery-image img{
  aspect-ratio:4/3;
  display:block;
  height:clamp(360px, 34vw, 520px);
  min-height:0;
  object-position:58% 47%;
  width:100%;
  border-radius:8px;
}
.som-pet-gallery-note{
  box-shadow:var(--wp--custom--som--shadow--card);
}
.som-pet-style-card{
  border-top:0;
  border-left:8px solid ${p.sun};
}
@media (max-width:700px){
  .wp-block-image.som-pet-gallery-image img{
    height:auto;
    min-height:0;
    width:100%;
    aspect-ratio:4/3;
    object-position:50% 48%;
  }
  .som-pet-gallery-copy{
    padding:20px;
    border-radius:8px;
  }
  .som-pet-gallery-copy h1{
    font-size:clamp(30px, 8.4vw, 38px);
    line-height:1.04;
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
  border-radius:0;
  box-shadow:none;
  filter:saturate(1.08) contrast(1.04);
  min-height:100%;
  object-position:50% 52%;
}
.som-dessert-gallery-hero .som-gallery-copy-row{
  align-items:flex-end;
  margin-top:0;
  min-height:560px;
}
.som-dessert-gallery-note{
  background:color-mix(in srgb, ${p.cream} 92%, ${p.white});
  border:1px solid color-mix(in srgb, ${p.leaf} 46%, transparent);
  border-radius:8px;
  box-shadow:0 18px 52px rgba(42,31,38,.14);
}
.som-dessert-gallery-copy{
  border-radius:8px;
  border:1px solid color-mix(in srgb, ${p.white} 70%, transparent);
}
.som-dessert-gallery-copy .is-style-outline .wp-block-button__link{
  background:${p.white};
  border-color:${p.deepGreen};
  color:${p.deepGreen};
}
.som-dessert-gallery-copy h1{
  font-size:clamp(36px, 4.4vw, 58px);
}
.som-dessert-menu-line{
  margin-block-start:0;
}
.som-dessert-menu-line p{
  margin-block-start:0;
  margin-block-end:0;
}
.som-dessert-proof-gallery{
  gap:12px;
}
.som-dessert-gallery-crop img{
  border:1px solid color-mix(in srgb, ${p.deepGreen} 12%, transparent);
  border-radius:8px;
  box-shadow:var(--wp--custom--som--shadow--lift);
  min-height:270px;
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
  margin-top:22px;
  padding-left:18px;
}
.som-dessert-style-card{
  border-top:0;
  border-bottom:5px solid ${p.sun};
  border-radius:8px;
  box-shadow:none;
}
@media (max-width:700px){
  .som-dessert-gallery-hero{
    --som-dessert-h1-size:clamp(24px, 6.2vw, 31px);
    --som-dessert-h1-line-height:1.07;
    box-sizing:border-box;
    min-height:auto;
    max-width:100vw;
    padding-top:118px;
    width:100vw;
  }
  .som-dessert-gallery-hero *{
    box-sizing:border-box;
  }
  .som-dessert-gallery-hero .wp-block-cover__inner-container{
    max-width:100%;
    overflow:hidden;
  }
  .som-dessert-gallery-hero .som-gallery-copy-row{
    min-height:0;
    gap:12px;
    margin-left:0;
    margin-right:0;
    max-width:100%;
    width:100%;
  }
  .som-dessert-gallery-copy,
  .som-dessert-gallery-note{
    flex-basis:100%;
    max-width:calc(100vw - 32px);
    padding:16px;
    width:100%;
  }
  .som-dessert-gallery-note{
    border-radius:8px;
  }
  .som-dessert-gallery-copy h1{
    font-size:clamp(28px, 7.2vw, 34px);
    hyphens:none;
    line-height:1.08;
    overflow-wrap:break-word;
    word-break:normal;
  }
  .som-dessert-gallery-copy p{
    font-size:1rem;
    line-height:1.5;
  }
  .som-dessert-gallery-copy p:first-child{
    font-size:1rem;
    line-height:1.35;
  }
  .som-dessert-gallery-copy .wp-block-buttons{
    margin-top:10px;
  }
  .som-dessert-proof-gallery{
    grid-template-columns:1fr;
  }
  .som-dessert-gallery-crop img{
    min-height:180px;
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
  aspect-ratio:16/6.4;
  height:330px;
  min-height:0;
  object-position:50% 42%;
  border-radius:8px;
}
.som-balloon-gallery-copy,
.som-balloon-gallery-note,
.som-balloon-style-card{
  border-radius:8px;
}
.som-balloon-gallery-hero .som-gallery-copy-row{
  margin-top:-96px;
}
.som-balloon-gallery-copy{
  padding-top:24px;
  padding-bottom:24px;
}
.som-balloon-gallery-copy h1{
  font-size:clamp(34px, 3.7vw, 52px);
  line-height:1.04;
  max-width:11ch;
}
.som-balloon-gallery-proof{
  border-top:6px solid ${p.sun};
}
@media (max-width:700px){
  .som-balloon-gallery-image img{
    min-height:176px;
    aspect-ratio:16/9;
    border-radius:8px;
  }
  .som-balloon-gallery-hero .som-gallery-copy-row{
    margin-top:14px;
  }
  .som-balloon-gallery-copy h1{
    font-size:clamp(30px, 8.4vw, 38px);
  }
}`.trim(),
    "picnic-proposal-lookbook": `
.som-picnic-gallery-hero{
  background:
    linear-gradient(90deg, ${p.cream} 0 64%, color-mix(in srgb, ${p.sun} 18%, ${p.white}) 64% 100%);
}
.wp-block-image.som-picnic-gallery-image{
  width:min(760px, 72%);
  margin-right:0;
  margin-left:auto;
}
.som-picnic-gallery-image img{
  aspect-ratio:3/2;
  display:block;
  min-height:500px;
  object-position:50% 58%;
  width:100%;
  border-radius:8px;
}
.som-picnic-gallery-hero .som-gallery-copy-row{
  margin-top:-340px;
  margin-left:0;
  max-width:560px;
}
.som-picnic-gallery-copy,
.som-picnic-gallery-note{
  flex-basis:100%;
  width:100%;
}
.som-picnic-gallery-note{
  margin-top:16px;
}
.som-picnic-gallery-copy h1{
  font-size:clamp(38px, 4.7vw, 60px);
}
.som-picnic-style-card{
  border-top:0;
  border-left:5px solid ${p.sun};
}
@media (max-width:900px){
  .wp-block-image.som-picnic-gallery-image{
    width:100%;
  }
  .som-picnic-gallery-image img{
    width:100%;
    min-height:180px;
    aspect-ratio:16/9;
    object-position:50% 58%;
  }
  .som-picnic-gallery-hero .som-gallery-copy-row{
    margin-top:14px;
    max-width:none;
  }
  .som-picnic-gallery-copy h1{
    font-size:clamp(30px, 8.4vw, 38px);
  }
}`.trim(),
    "headshot-proof-gallery": `
.som-headshot-cover-hero .wp-block-cover__background{
  background:linear-gradient(90deg, rgba(24,34,51,.86) 0%, rgba(24,34,51,.62) 44%, rgba(24,34,51,.12) 100%);
}
.som-headshot-cover-hero .wp-block-cover__image-background{
  object-position:58% 42%;
  filter:saturate(.9) contrast(1.04);
}
.som-headshot-cover-hero .som-headshot-gallery-copy{
  box-shadow:none;
}
.som-headshot-shot-plan{
  max-width:560px;
  box-shadow:none;
}
.som-headshot-shot-list{
  display:grid;
  gap:6px;
  margin-bottom:0;
  padding-left:18px;
}
.som-contact-sheet{
  gap:10px;
}
.som-contact-sheet img{
  aspect-ratio:4/3;
  min-height:0;
  max-height:none;
  object-fit:cover;
  border-radius:6px;
  box-shadow:none;
}
.som-contact-crop-wide img{
  object-position:34% 48%;
}
.som-contact-crop-portrait img{
  object-position:58% 42%;
}
.som-contact-crop-studio img{
  object-position:84% 44%;
}
.som-headshot-style-card{
  border:1px solid color-mix(in srgb, ${p.deepGreen} 14%, transparent);
  border-top:0;
  box-shadow:none;
}
.som-headshot-gallery-proof{
  border-left:4px solid ${p.sun};
  box-shadow:none;
}
@media (max-width:700px){
  .som-headshot-cover-hero{
    min-height:640px;
    padding-top:42px;
    padding-bottom:42px;
  }
  .som-headshot-cover-hero .wp-block-cover__image-background{
    object-position:58% 42%;
  }
  .som-headshot-cover-hero h1{
    font-size:clamp(33px, 9.4vw, 44px);
    line-height:1.05;
    margin-top:8px;
    margin-bottom:12px;
  }
  .som-headshot-cover-hero p{
    font-size:16px;
    line-height:1.48;
  }
  .som-headshot-shot-plan{
    padding:14px;
  }
  .som-contact-sheet{
    grid-template-columns:1fr;
  }
}`.trim()
  };

  const menuAliases = {
    "street-food-menu-board": `
.som-streetfood-menu-hero{
  background:
    radial-gradient(circle at 78% 14%, color-mix(in srgb, ${p.sun} 28%, transparent), transparent 26%),
    linear-gradient(135deg, color-mix(in srgb, ${p.deepGreen} 92%, #000), ${p.deepGreen});
  background-color:${p.deepGreen};
}
.som-streetfood-menu-photo img{
  aspect-ratio:16/9;
  min-height:390px;
  border-radius:4px;
}
.som-streetfood-menu-ticket{
  margin-top:-44px;
  border-radius:4px;
}
.som-streetfood-menu-package{
  border-top:0;
  border-left:8px solid ${p.sun};
  border-radius:4px;
}
@media (max-width:700px){
  .som-streetfood-menu-ticket{
    margin-top:-28px;
  }
}`.trim(),
    "mocktail-cart-menu": `
.som-mocktail-menu-hero{
  background:
    radial-gradient(circle at 82% 12%, color-mix(in srgb, ${p.leaf} 34%, transparent), transparent 28%),
    linear-gradient(135deg, ${p.deepGreen}, color-mix(in srgb, ${p.grass} 52%, ${p.deepGreen}));
  background-color:${p.deepGreen};
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
  border-radius:999px;
  background:${p.white};
}
.som-mocktail-menu-package{
  border-top:0;
  border-bottom:8px solid ${p.leaf};
  border-radius:22px;
}
@media (max-width:700px){
  .som-mocktail-menu-photo img{
    min-height:320px;
    width:100%;
  }
  .som-mocktail-menu-ticket{
    transform:none;
    border-radius:22px;
  }
}`.trim()
  };

  const workshopAliases = {
    "deck-finish-sample-board": `
.som-deck-hero .som-finish-sample-table{
  background:${p.cream};
  color:${p.deepGreen};
}
.som-deck-hero .som-finish-sample-table table{
  background:${p.cream};
  color:${p.deepGreen};
}
.som-deck-hero .som-finish-sample-table th,
.som-deck-hero .som-finish-sample-table td{
  border-color:color-mix(in srgb, ${p.deepGreen} 28%, transparent);
  color:${p.deepGreen};
}
@media (max-width:900px){
  .som-deck-hero .wp-block-columns{
    display:flex;
    flex-direction:column-reverse;
  }
}`.trim(),
    "sharp-route-bench": `
.som-sharp-hero{
  background:
    linear-gradient(90deg, color-mix(in srgb, ${p.deepGreen} 96%, #000), ${p.deepGreen});
  background-color:${p.deepGreen};
}
.som-sharp-photo img{
  aspect-ratio:16/7;
  min-height:365px;
  object-position:50% 48%;
  border-radius:2px;
  filter:contrast(1.06) saturate(.92);
}
.som-edge-ticket{
  margin-top:-48px;
  width:min(82%, 560px);
  border-radius:2px;
}
.som-sharp-card{
  border-top:0;
  border-left:7px solid ${p.sun};
  border-radius:2px;
}
.som-edge-care-note{
  border-left-color:${p.sun};
}`.trim(),
    "bike-route-workstand": `
.som-bike-hero{
  background:
    linear-gradient(90deg, color-mix(in srgb, ${p.grass} 10%, transparent) 1px, transparent 1px),
    linear-gradient(0deg, color-mix(in srgb, ${p.soil} 8%, transparent) 1px, transparent 1px),
    linear-gradient(135deg, ${p.cream}, ${p.mist});
  background-size:28px 28px, 28px 28px, auto;
}
.som-bike-hero h1{
  font-size:clamp(2.55rem, 4.6vw, 4.7rem);
}
.som-workstand-photo img{
  aspect-ratio:16/11;
  min-height:520px;
  object-position:50% 44%;
  border-radius:8px;
  box-shadow:0 24px 70px rgba(0,0,0,.22);
}
.som-route-ticket{
  margin-left:auto;
  margin-right:0;
  width:min(100%, 540px);
  border-radius:8px;
}
.som-tune-card{
  border-top:0;
  border-bottom:8px solid ${p.leaf};
  border-radius:8px;
}
@media (max-width:700px){
  .som-bike-hero h1{
    font-size:clamp(2.15rem, 10vw, 2.85rem);
  }
  .som-workstand-photo img{
    min-height:260px;
    aspect-ratio:16/10;
  }
  .som-route-ticket{
    margin-right:0;
    width:auto;
  }
}`.trim(),
    "mural-lettering-workshop": `
.som-mural-hero{
  background:
    linear-gradient(135deg, ${p.deepGreen}, color-mix(in srgb, ${p.deepGreen} 82%, ${p.sun}));
  background-color:${p.deepGreen};
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
  border-radius:0;
}
.som-mural-card{
  border-top:0;
  border-bottom:4px solid ${p.sun};
  border-radius:0;
}
.som-mural-care-note{
  border-radius:0;
}`.trim()
  };

  const storyAliases = {
    "micro-wedding-floral-story": `
.som-floral-story-hero{
  background:
    radial-gradient(circle at 12% 12%, color-mix(in srgb, ${p.sun} 18%, transparent), transparent 28%),
    radial-gradient(circle at 88% 0%, color-mix(in srgb, ${p.leaf} 18%, transparent), transparent 24%),
    linear-gradient(180deg, ${p.mist}, ${p.white});
}
.som-floral-story-hero .som-hero-photo img{
  min-height:440px;
  object-position:50% 58%;
  border-radius:120px 120px 8px 8px;
}
.som-floral-anchor-strip{
  border-top:1px solid color-mix(in srgb, ${p.leaf} 26%, transparent);
  border-bottom:1px solid color-mix(in srgb, ${p.leaf} 26%, transparent);
}
.som-floral-anchor-strip .wp-block-group.alignwide{
  gap:16px 24px;
  min-height:56px;
}
.som-floral-anchor-label{
  flex:0 0 auto;
}
.som-floral-anchor-nav .wp-block-navigation__container{
  gap:8px 10px;
}
.som-floral-anchor-nav .wp-block-navigation-item__content{
  border:1px solid color-mix(in srgb, ${p.leaf} 40%, transparent);
  border-radius:999px;
  color:${p.deepGreen};
  padding:8px 12px;
  text-decoration:none;
}
.som-floral-anchor-nav .wp-block-navigation-item__content:hover,
.som-floral-anchor-nav .wp-block-navigation-item__content:focus-visible{
  background:color-mix(in srgb, ${p.leaf} 14%, ${p.white});
  text-decoration:none;
}
.som-floral-anchor-action{
  flex:0 0 auto;
}
.som-floral-support-card{
  border-left:0;
  border-top:5px solid ${p.leaf};
  box-shadow:none;
  outline:1px solid color-mix(in srgb, ${p.leaf} 20%, transparent);
}
.som-floral-proof-card{
  border:1px solid color-mix(in srgb, ${p.leaf} 34%, transparent);
  box-shadow:none;
}
@media (max-width:700px){
  .som-floral-story-hero .wp-block-columns{
    gap:16px;
  }
  .som-floral-story-hero .som-hero-photo img{
    min-height:174px;
    aspect-ratio:16/8;
    border-radius:42px 42px 8px 8px;
  }
  .som-floral-anchor-strip .wp-block-group.alignwide{
    align-items:flex-start;
    gap:10px;
  }
  .som-floral-anchor-label{
    inline-size:100%;
  }
  .som-floral-anchor-nav{
    overflow-x:auto;
    max-width:100%;
    padding-bottom:2px;
  }
  .som-floral-anchor-nav .wp-block-navigation__container{
    flex-wrap:nowrap;
    justify-content:flex-start;
  }
  .som-floral-anchor-nav .wp-block-navigation-item__content{
    white-space:nowrap;
    padding:8px 10px;
  }
  .som-floral-anchor-action{
    inline-size:100%;
  }
  .som-floral-anchor-action .wp-block-button,
  .som-floral-anchor-action .wp-block-button__link{
    inline-size:100%;
    text-align:center;
  }
}`.trim(),
    "story-card-consult": `
.som-story-hero{
  background:linear-gradient(180deg, ${p.cream}, color-mix(in srgb, ${p.leaf} 10%, ${p.cream}));
  border-top:1px solid color-mix(in srgb, ${p.deepGreen} 10%, transparent);
  border-bottom:1px solid color-mix(in srgb, ${p.deepGreen} 10%, transparent);
}
.som-story-hero.wp-block-media-text{
  column-gap:clamp(24px, 4vw, 58px);
  grid-template-columns:minmax(0, 44%) minmax(0, 1fr);
  overflow:hidden;
}
.som-story-hero,
.som-story-hero *,
.som-support-card,
.som-family-proof-card,
.som-story-process-step{
  box-sizing:border-box;
  min-width:0;
}
.som-story-hero .wp-block-media-text__content{
  max-width:690px;
  padding:clamp(28px, 5vw, 68px) clamp(24px, 5vw, 70px) clamp(28px, 5vw, 68px) clamp(18px, 3vw, 44px);
}
.som-story-hero .wp-block-media-text__media{
  align-self:stretch;
  background-size:cover;
  min-height:600px;
  overflow:hidden;
}
.som-story-hero .wp-block-media-text__media img{
  border-right:12px solid ${p.white};
  box-shadow:none;
  display:block;
  filter:saturate(.96) contrast(1.02);
  height:100%;
  min-height:600px;
  object-fit:cover;
  object-position:50% 50%;
  width:100%;
}
.som-story-phone-line a{
  color:${p.deepGreen};
  font-weight:820;
  text-decoration-thickness:2px;
  text-underline-offset:4px;
}
.som-story-check-list{
  display:grid;
  gap:10px;
  list-style:none;
  padding-left:0;
}
.som-story-check-list li{
  background:${p.white};
  border-left:5px solid ${p.sun};
  border-radius:6px;
  padding:12px 14px;
}
.som-support-card{
  border-left:10px solid ${p.leaf};
  border-radius:6px;
  box-shadow:none;
}
.som-family-proof-card{
  align-content:start;
  background:${p.white};
  border:1px solid color-mix(in srgb, ${p.deepGreen} 13%, transparent);
  border-left:6px solid ${p.grass};
  border-radius:6px;
  box-shadow:none;
  display:grid;
  gap:8px;
}
.som-family-proof-card p:first-child{
  color:${p.deepGreen};
  font-weight:800;
}
.som-family-proof-card p:last-child{
  color:${p.soil};
  font-weight:680;
}
.som-story-process-step{
  background:${p.white};
  border:1px solid color-mix(in srgb, ${p.deepGreen} 12%, transparent);
  border-radius:6px;
  padding:20px 22px;
}
.som-story-process-step .wp-block-columns{
  flex-wrap:nowrap;
  overflow:hidden;
}
.som-story-process-step .wp-block-column{
  min-width:0;
  overflow-wrap:break-word;
}
.som-story-process-step .wp-block-column:first-child{
  flex:0 0 60px;
  max-width:60px;
}
.som-story-process-grid{
  display:grid;
  grid-template-columns:60px minmax(0, 1fr);
  align-items:center;
  gap:18px;
  max-width:100%;
}
.som-story-process-copy{
  min-width:0;
}
.som-story-step-number{
  align-items:center;
  border-radius:50%;
  display:flex;
  height:44px;
  justify-content:center;
  margin:0;
  padding:0;
  width:44px;
}
.som-check-quote{
  border-left:6px solid ${p.leaf};
  color:${p.deepGreen};
  margin-top:0;
  padding-left:18px;
}
.som-check-quote cite{
  color:${p.grass};
}
.som-check-detail{
  background:color-mix(in srgb, ${p.white} 78%, transparent);
  border:1px solid color-mix(in srgb, ${p.deepGreen} 12%, transparent);
  border-radius:6px;
  box-shadow:none;
  margin-top:14px;
  padding:16px 18px;
}
.som-check-detail summary{
  color:${p.deepGreen};
  cursor:pointer;
  font-family:var(--wp--preset--font-family--accent);
  font-weight:820;
}
.som-consult-quote-strip{
  background:${p.white};
}
.som-consult-quote-strip .wp-block-button__link{
  box-shadow:none;
}
@media (max-width:900px){
  .som-story-hero.wp-block-media-text{
    display:flex;
    flex-direction:column;
    gap:0;
    padding-top:0;
    padding-bottom:0;
  }
  .som-story-hero .wp-block-media-text__content{
    max-width:none;
    padding:24px 0 30px;
  }
  .som-story-hero .wp-block-media-text__media,
  .som-story-hero .wp-block-media-text__media img{
    min-height:180px;
  }
  .som-story-hero .wp-block-media-text__media{
    width:100%;
  }
  .som-story-hero .wp-block-media-text__media img{
    border-right:0;
    border-top:10px solid ${p.white};
    height:clamp(180px, 48vw, 230px);
    max-height:230px;
  }
}
@media (max-width:700px){
  .som-story-hero h1{
    font-size:clamp(30px, 7.8vw, 38px);
    line-height:1.05;
    margin-top:8px;
    margin-bottom:12px;
  }
  .som-story-hero p,
  .som-story-check-list{
    font-size:16px;
    line-height:1.45;
  }
  .som-story-check-list{
    display:none;
  }
}`.trim(),
    "plant-care-story": `
.som-plant-story-hero{
  background:linear-gradient(180deg, ${p.white}, color-mix(in srgb, ${p.mist} 46%, ${p.white}));
}
.som-plant-story-hero .wp-block-media-text__media{
  align-self:center;
  background-position:58% 50%;
  overflow:hidden;
}
.som-plant-story-hero .wp-block-media-text__media img{
  aspect-ratio:4/3;
  display:block;
  filter:saturate(1.02) contrast(1.03);
  height:clamp(360px, 34vw, 500px);
  object-fit:cover;
  object-position:58% 50%;
  width:100%;
}
.som-plant-story-hero p.has-soil-color,
.som-plant-story-hero .som-story-check-list{
  color:color-mix(in srgb, ${p.soil} 72%, ${p.deepGreen});
  font-weight:430;
}
.som-plant-story-hero .wp-block-button__link{
  background:color-mix(in srgb, ${p.sun} 86%, ${p.white});
  box-shadow:none;
}
.som-plant-support-card{
  background:${p.white};
  border:1px solid color-mix(in srgb, ${p.grass} 18%, transparent);
  border-left:8px solid ${p.grass};
  box-shadow:none;
}
.som-plant-proof-band{
  background:${p.white};
  border-bottom:1px solid color-mix(in srgb, ${p.deepGreen} 10%, transparent);
  border-top:1px solid color-mix(in srgb, ${p.deepGreen} 10%, transparent);
}
.som-plant-proof-band .wp-block-columns,
.som-plant-proof-band .som-plant-proof-grid{
  display:grid;
  grid-template-columns:repeat(3, minmax(0, 1fr));
  gap:16px;
  width:100%;
  max-width:100%;
  margin-right:0;
  margin-left:0;
}
.wp-site-blocks .som-plant-proof-band .wp-block-columns.alignwide.is-layout-flex,
.wp-site-blocks .som-plant-proof-band .som-plant-proof-grid{
  display:grid;
  grid-template-columns:repeat(3, minmax(0, 1fr));
  gap:16px;
  width:100%;
  max-width:100%;
  margin-right:0;
  margin-left:0;
}
.som-plant-proof-band .wp-block-column{
  width:100%;
  min-width:0;
  max-width:100%;
}
.som-plant-proof-card{
  align-content:space-between;
  background:
    linear-gradient(90deg, ${p.leaf} 0 6px, transparent 6px),
    ${p.white};
  border:1px solid color-mix(in srgb, ${p.leaf} 34%, transparent);
  border-radius:6px;
  min-height:132px;
  row-gap:10px;
  box-shadow:none;
}
.som-plant-proof-card p:first-child{
  color:${p.grass};
  font-size:clamp(1.2rem, 2vw, 1.65rem);
  line-height:1.06;
  min-block-size:auto;
}
.som-plant-proof-card p:last-child{
  align-self:start;
  color:${p.soil};
  font-weight:620;
  min-block-size:auto;
}
.som-plant-process-step .wp-block-column:first-child{
  flex:0 0 86px;
  max-width:86px;
}
.som-plant-quote{
  border-left-color:${p.leaf};
  color:${p.deepGreen};
}
.som-plant-quote cite{
  color:${p.grass};
}
.som-plant-consult-strip{
  background:linear-gradient(135deg, ${p.white}, color-mix(in srgb, ${p.mist} 76%, ${p.white}));
}
.som-plant-consult-strip .wp-block-column{
  min-width:0;
}
.som-plant-consult-strip .wp-block-button__link{
  box-sizing:border-box;
  white-space:normal;
}
@media (min-width:701px) and (max-width:900px){
  .som-plant-story-hero .wp-block-media-text__media{
    background-position:74% 50%;
  }
  .som-plant-story-hero .wp-block-media-text__media img{
    object-position:74% 50%;
  }
}
@media (max-width:700px){
  .som-plant-proof-band .wp-block-columns,
  .som-plant-proof-band .som-plant-proof-grid,
  .wp-site-blocks .som-plant-proof-band .wp-block-columns.alignwide.is-layout-flex,
  .wp-site-blocks .som-plant-proof-band .som-plant-proof-grid{
    grid-template-columns:1fr;
  }
  .som-plant-story-hero .wp-block-media-text__content{
    padding-top:18px;
    padding-bottom:24px;
  }
  .som-plant-story-hero .wp-block-media-text__media,
  .som-plant-story-hero .wp-block-media-text__media img{
    height:clamp(168px, 48vw, 210px);
    max-height:210px;
    min-height:168px;
  }
  .som-plant-story-hero .wp-block-media-text__media img{
    object-position:50% 46%;
  }
  .som-plant-story-hero h1{
    font-size:clamp(29px, 7.6vw, 35px);
  }
}`.trim(),
    "color-consult-story": `
.som-color-header-action .wp-block-button__link{
  box-shadow:none;
}
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
  grid-template-columns:minmax(0, 1fr) minmax(0, 48%);
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
  min-height:0;
  overflow:hidden;
}
.som-color-story-hero .wp-block-media-text__media img{
  border-left:12px solid ${p.white};
  border-radius:0;
  box-shadow:none;
  display:block;
  filter:saturate(.96) contrast(1.03);
  height:100%;
  min-height:620px;
  object-fit:cover;
  object-position:56% 52%;
  width:100%;
}
.som-color-room-list{
  display:grid;
  gap:10px;
  list-style:none;
  padding-left:0;
}
.som-color-room-list li{
  background:${p.white};
  border-left:5px solid ${p.sun};
  border-radius:6px;
  padding:12px 14px;
}
.som-color-support-card{
  background:${p.white};
  border-left:12px solid ${p.sun};
  border-radius:6px;
  box-shadow:none;
}
.som-color-proof-card{
  background:${p.cream};
  border-bottom:6px solid ${p.sun};
  border-radius:6px;
  box-shadow:none;
}
.som-color-process-step{
  background:${p.white};
  border:1px solid color-mix(in srgb, ${p.deepGreen} 12%, transparent);
  border-radius:6px;
  padding:20px 22px;
}
.som-color-process-step .wp-block-columns{
  flex-wrap:nowrap;
  overflow:hidden;
}
.som-color-process-step .wp-block-column{
  min-width:0;
  overflow-wrap:break-word;
}
.som-color-process-step .wp-block-column:first-child{
  flex:0 0 60px;
  max-width:60px;
  overflow:hidden;
}
.som-color-step-number{
  align-items:center;
  border-radius:50%;
  display:flex;
  height:44px;
  justify-content:center;
  margin:0;
  padding:0;
  width:44px;
}
.som-color-process-step + .som-color-process-step{
  margin-top:14px;
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
  background:${p.white};
}
@media (max-width:900px){
  .som-color-header-action{
    display:none;
  }
  .som-color-story-hero.wp-block-media-text{
    display:flex;
    flex-direction:column-reverse;
    gap:0;
    padding-top:0;
    padding-bottom:0;
  }
  .som-color-story-hero .wp-block-media-text__content{
    max-width:none;
    padding:22px 0 30px;
  }
  .som-color-story-hero .wp-block-media-text__media,
  .som-color-story-hero .wp-block-media-text__media img{
    min-height:0;
  }
  .som-color-story-hero .wp-block-media-text__media{
    width:100%;
  }
  .som-color-story-hero .wp-block-media-text__media img{
    border-left:0;
    border-top:10px solid ${p.white};
    height:250px;
    max-height:none;
    object-position:54% 50%;
  }
}
@media (max-width:700px){
  .som-color-story-hero h1{
    font-size:clamp(30px, 7.8vw, 36px);
    line-height:1.04;
    margin-top:8px;
    margin-bottom:12px;
  }
  .som-color-story-hero p{
    font-size:16px;
    line-height:1.48;
    margin-bottom:14px;
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
    linear-gradient(180deg, ${p.deepGreen}, color-mix(in srgb, ${p.deepGreen} 88%, #000));
}
.som-sound-hero{
  background:
    radial-gradient(circle at 70% 14%, color-mix(in srgb, ${p.leaf} 28%, transparent), transparent 28%),
    ${p.deepGreen};
}
.som-sound-photo img{
  aspect-ratio:16/9;
  min-height:455px;
  border-radius:4px;
}
.som-sound-ticket{
  border-radius:4px;
  box-shadow:0 0 0 1px color-mix(in srgb, ${p.leaf} 38%, transparent), 0 18px 44px rgba(0,0,0,.2);
}
.som-sound-card{
  border-top:0;
  border-left:6px solid ${p.leaf};
  border-radius:4px;
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
    radial-gradient(circle at 78% 14%, color-mix(in srgb, ${p.leaf} 16%, transparent), transparent 30%),
    repeating-linear-gradient(90deg, color-mix(in srgb, ${p.white} 6%, transparent) 0 14px, transparent 14px 32px),
    ${p.deepGreen};
}
.som-booth-photo img{
  aspect-ratio:4/3;
  min-height:520px;
  object-position:68% 50%;
  border-radius:6px;
  box-shadow:8px 8px 0 ${p.white}, 0 28px 80px rgba(0,0,0,.24);
}
.som-booth-package{
  border-top:0;
  border-left:10px solid ${p.sun};
}
.som-booth-package:nth-child(2){
  border-left-color:${p.leaf};
}
.som-booth-package:nth-child(3){
  border-left-color:${p.grass};
}
@media (max-width:700px){
  .som-booth-page{
    --som-mobile-action-reserve:calc(104px + env(safe-area-inset-bottom));
  }
  .som-booth-photo img{
    aspect-ratio:16/9;
    min-height:210px;
    max-height:260px;
    object-position:70% 50%;
    box-shadow:6px 6px 0 ${p.white}, 0 18px 44px rgba(0,0,0,.22);
  }
  .som-booth-action-dock{
    right:14px;
    left:14px;
  }
}`.trim(),
    "pet-portrait-booking-dock": `
.som-pet-hero{
  background:
    radial-gradient(circle at 10% 12%, color-mix(in srgb, ${p.sun} 22%, transparent), transparent 26%),
    linear-gradient(135deg, color-mix(in srgb, ${p.deepGreen} 92%, ${p.soil}), ${p.deepGreen});
}
.som-pet-photo img{
  aspect-ratio:4/3;
  min-height:520px;
  object-position:50% 42%;
  border-radius:999px 999px 8px 8px;
  box-shadow:0 28px 80px rgba(0,0,0,.22);
}
.som-pet-ticket{
  background:color-mix(in srgb, ${p.white} 92%, ${p.cream});
  border:1px solid color-mix(in srgb, ${p.sun} 42%, transparent);
  border-radius:8px;
  margin-top:-18px;
}
.som-pet-proof{
  border-bottom:5px solid ${p.sun};
  border-radius:8px;
}
.som-pet-package{
  border-top:0;
  border-left:7px solid ${p.leaf};
  border-radius:8px;
}
.som-pet-step{
  border-radius:8px;
}
.som-pet-action-dock{
  box-shadow:0 -18px 44px rgba(0,0,0,.2);
}
@media (max-width:700px){
  .som-pet-photo img{
    min-height:255px;
    aspect-ratio:16/11;
    border-radius:72px 72px 8px 8px;
  }
  .som-pet-ticket{
    margin-top:12px;
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
  margin-top:-30px;
  border-radius:18px;
}
.som-tune-package{
  border-top:0;
  border-bottom:8px solid ${p.leaf};
}`.trim(),
    "organizing-zone-board": `
.som-organizing-hero{
  background:
    linear-gradient(90deg, color-mix(in srgb, ${p.sun} 12%, transparent) 1px, transparent 1px),
    linear-gradient(0deg, color-mix(in srgb, ${p.deepGreen} 6%, transparent) 1px, transparent 1px),
    ${p.cream};
  background-color:${p.cream};
  background-size:26px 26px;
}
.som-organizing-photo img{
  aspect-ratio:3/4;
  min-height:610px;
  object-position:50% 48%;
  border-radius:44px 44px 8px 8px;
}
.som-shelf-map{
  border-radius:22px;
  transform:translateY(-18px);
}
.som-shelf-card{
  border-top:0;
  border-left:8px solid ${p.sun};
  border-radius:18px;
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
    "pollinator-season-board": `
.som-pollinator-hero{
  background:
    linear-gradient(90deg, color-mix(in srgb, ${p.deepGreen} 9%, transparent) 1px, transparent 1px),
    linear-gradient(0deg, color-mix(in srgb, ${p.deepGreen} 6%, transparent) 1px, transparent 1px),
    linear-gradient(135deg, color-mix(in srgb, ${p.white} 82%, ${p.cream}), color-mix(in srgb, ${p.leaf} 12%, ${p.white}));
  background-size:32px 32px, 32px 32px, auto;
  background-color:${p.cream};
}
.som-pollinator-hero h1{
  color:${p.deepGreen};
  font-size:clamp(40px, 5vw, 66px);
  line-height:1.04;
  text-shadow:none;
}
.som-pollinator-hero p.has-mist-color{
  color:${p.grass};
}
.som-pollinator-photo img{
  aspect-ratio:4/3;
  min-height:470px;
  object-position:50% 54%;
  border-radius:8px 8px 58px 8px;
  box-shadow:0 22px 64px rgba(36,20,61,.16);
}
.som-pollinator-season-pills{
  gap:10px;
}
.som-pollinator-season-pill{
  background:color-mix(in srgb, ${p.white} 84%, ${p.mist});
  border:1px solid color-mix(in srgb, ${p.deepGreen} 14%, transparent);
  border-radius:8px;
  flex:1 1 142px;
}
.som-pollinator-map{
  background:${p.white};
  border-color:color-mix(in srgb, ${p.deepGreen} 58%, transparent);
  margin-top:28px;
  box-shadow:none;
}
.som-pollinator-map th,
.som-pollinator-map td{
  border-color:color-mix(in srgb, ${p.deepGreen} 28%, transparent);
}
.som-pollinator-anchor-strip{
  border-top:1px solid color-mix(in srgb, ${p.deepGreen} 12%, transparent);
  border-bottom:1px solid color-mix(in srgb, ${p.deepGreen} 12%, transparent);
}
.som-pollinator-anchor-nav .wp-block-navigation-item__content{
  border-radius:999px;
  padding:8px 12px;
}
.som-pollinator-proof{
  border-bottom-color:${p.leaf};
  box-shadow:none;
}
.som-pollinator-card{
  border-top:6px solid ${p.sun};
  border-radius:8px;
  box-shadow:none;
}
.som-pollinator-card:nth-child(2){
  border-top-color:${p.leaf};
}
.som-pollinator-card:nth-child(3){
  border-top-color:${p.grass};
}
.som-pollinator-step,
.som-pollinator-note{
  border:1px solid color-mix(in srgb, ${p.deepGreen} 12%, transparent);
  box-shadow:none;
}
@media (max-width:700px){
  .som-pollinator-hero > .wp-block-columns{
    flex-direction:column;
  }
  .som-pollinator-hero h1{
    font-size:clamp(31px, 8.4vw, 39px);
  }
  .som-pollinator-photo img{
    min-height:210px;
    aspect-ratio:16/9;
    border-radius:8px 8px 42px 8px;
  }
  .som-pollinator-season-pill{
    flex-basis:100%;
  }
}`.trim(),
    "turnover-receipt-board": `
.som-turnover-header{
  position:sticky;
  top:0;
  z-index:10;
}
.som-turnover-hero{
  overflow:hidden;
}
.som-turnover-hero .wp-block-cover__image-background{
  object-position:50% 54%;
}
.som-turnover-hero .wp-block-cover__background{
  background:
    linear-gradient(90deg, color-mix(in srgb, ${p.deepGreen} 78%, transparent), color-mix(in srgb, ${p.deepGreen} 34%, transparent));
}
.som-turnover-hero-copy{
  text-shadow:0 2px 22px color-mix(in srgb, ${p.deepGreen} 34%, transparent);
}
.som-turnover-readiness-board{
  border:1px solid color-mix(in srgb, ${p.deepGreen} 14%, transparent);
  border-radius:8px;
  box-shadow:0 28px 80px color-mix(in srgb, ${p.deepGreen} 22%, transparent);
  text-shadow:none;
}
.som-turnover-board-list{
  color:${p.soil};
  margin-bottom:0;
  padding-left:1.2rem;
}
.som-turnover-board-list li{
  border-top:1px dashed color-mix(in srgb, ${p.deepGreen} 16%, transparent);
  padding-top:12px;
  margin-top:12px;
}
.som-turnover-board-list strong{
  color:${p.deepGreen};
  display:block;
  font-family:var(--wp--preset--font-family--accent);
  margin-bottom:2px;
}
.som-host-proof-strip{
  background:color-mix(in srgb, ${p.leaf} 12%, ${p.cream});
}
.som-host-proof{
  border-left:4px solid ${p.sun};
  padding:4px 0 4px 16px;
}
.som-turnover-checklist,
.som-turnover-readiness,
.som-quote-strip{
  scroll-margin-top:128px;
}
.som-turnover-table{
  background:${p.white};
  border:1px solid color-mix(in srgb, ${p.deepGreen} 14%, transparent);
  border-radius:8px;
  margin-top:8px;
  overflow:hidden;
  width:100%;
  max-width:100%;
  box-sizing:border-box;
}
.som-turnover-table table{
  margin:0;
  table-layout:fixed;
  width:100%;
}
.som-turnover-table th{
  background:color-mix(in srgb, ${p.sun} 18%, ${p.white});
  color:${p.deepGreen};
  font-family:var(--wp--preset--font-family--accent);
  letter-spacing:0;
  text-transform:uppercase;
}
.som-turnover-table tbody th[scope="row"]{
  color:${p.deepGreen};
  font-weight:850;
}
.som-turnover-step,
.som-turnover-detail{
  border:1px solid color-mix(in srgb, ${p.deepGreen} 12%, transparent);
  border-radius:8px;
  box-shadow:none;
}
.som-turnover-step{
  border-left:6px solid ${p.sun};
}
.som-turnover-quote{
  background:${p.white};
  border-left:6px solid ${p.sun};
  border-radius:8px;
  margin:0;
  padding:20px 22px;
}
.som-turnover-quote p{
  color:${p.deepGreen};
  font-size:18px;
  font-weight:750;
  line-height:1.5;
}
.som-turnover-quote cite{
  color:${p.grass};
  font-family:var(--wp--preset--font-family--accent);
  font-size:13px;
  font-style:normal;
  font-weight:900;
  text-transform:uppercase;
}
.som-turnover-details{
  display:grid;
  gap:12px;
}
.som-turnover-detail{
  background:${p.white};
}
.som-turnover-detail summary{
  color:${p.deepGreen};
}
@media (max-width:860px){
  .som-turnover-header{
    position:relative;
  }
  .som-turnover-header-action{
    display:none;
  }
  .som-turnover-hero{
    min-height:0;
  }
  .som-turnover-hero .wp-block-cover__inner-container > .wp-block-columns{
    flex-direction:column;
  }
  .som-turnover-hero-copy,
  .som-turnover-readiness-board{
    flex-basis:auto;
    width:100%;
  }
  .som-turnover-readiness-board{
    padding:22px;
  }
}
@media (max-width:700px){
  .som-turnover-hero{
    padding-top:38px;
    padding-right:22px;
    padding-bottom:38px;
    padding-left:22px;
  }
  .wp-block-cover.som-turnover-hero .wp-block-cover__image-background{
    object-position:22% 50%;
  }
  .som-turnover-hero h1{
    font-size:clamp(34px, 9.8vw, 43px);
    line-height:1.04;
    margin-top:10px;
    margin-bottom:14px;
  }
  .som-turnover-hero p{
    font-size:16px;
    line-height:1.48;
    margin-bottom:16px;
  }
  .som-turnover-hero .wp-block-buttons{
    gap:10px;
  }
  .som-turnover-hero .wp-block-button__link{
    padding-top:12px;
    padding-bottom:12px;
  }
  .som-turnover-board-list{
    font-size:15px;
  }
  .som-turnover-table table,
  .som-turnover-table thead,
  .som-turnover-table tbody,
  .som-turnover-table tr,
  .som-turnover-table th,
  .som-turnover-table td{
    display:block;
    width:100%;
    max-width:100%;
    box-sizing:border-box;
  }
  .som-turnover-table thead{
    border:0;
    clip:rect(0 0 0 0);
    clip-path:inset(50%);
    height:1px;
    margin:-1px;
    overflow:hidden;
    padding:0;
    position:absolute;
    white-space:nowrap;
    width:1px;
  }
  .som-turnover-table tr{
    border-top:1px dashed color-mix(in srgb, ${p.deepGreen} 18%, transparent);
    padding:12px 0;
  }
  .som-turnover-table tr:first-child{
    border-top:0;
  }
  .som-turnover-table tbody th[scope="row"],
  .som-turnover-table td{
    border:0;
    display:grid;
    grid-template-columns:minmax(86px, 28%) minmax(0, 1fr);
    gap:12px;
    padding:6px 14px;
    overflow-wrap:break-word;
  }
  .som-turnover-table tbody th[scope="row"]::before{
    content:"Zone";
  }
  .som-turnover-table td:nth-child(2)::before{
    content:"Proof";
  }
  .som-turnover-table td:nth-child(3)::before{
    content:"Host note";
  }
  .som-turnover-table tbody th[scope="row"]::before,
  .som-turnover-table td::before{
    color:${p.grass};
    display:inline-block;
    font-family:var(--wp--preset--font-family--accent);
    font-size:1rem;
    font-weight:700;
    margin-right:12px;
    min-width:86px;
    text-transform:uppercase;
    white-space:nowrap;
  }
}
`.trim(),
    "headshot-prep-ledger": `
.som-headshot-hero-shell{
  background:
    linear-gradient(90deg, color-mix(in srgb, ${p.deepGreen} 7%, transparent) 1px, transparent 1px),
    linear-gradient(0deg, color-mix(in srgb, ${p.deepGreen} 5%, transparent) 1px, transparent 1px),
    ${p.cream};
  background-size:32px 32px;
}
.som-headshot-hero .wp-block-media-text__content{
  padding-top:34px;
  padding-bottom:34px;
}
.som-headshot-hero .wp-block-media-text__media{
  background-position:50% 38%;
  border-radius:8px;
  min-height:500px;
}
.som-headshot-card{
  border-radius:8px;
  box-shadow:none;
}
.som-headshot-hero .som-headshot-card{
  transform:rotate(-.6deg);
}
.som-headshot-proof-strip{
  background:${p.deepGreen};
}
.som-headshot-scope{
  background:${p.white};
}
.som-headshot-table{
  box-shadow:none;
}
.som-headshot-table th{
  background:color-mix(in srgb, ${p.sun} 20%, ${p.white});
}
.som-headshot-step,
.som-headshot-detail{
  border:1px solid color-mix(in srgb, ${p.deepGreen} 12%, transparent);
  border-radius:8px;
  box-shadow:none;
}
.som-headshot-anchor-strip{
  border-bottom:1px solid color-mix(in srgb, ${p.deepGreen} 12%, transparent);
}
.som-headshot-anchor-nav .wp-block-navigation-item__content{
  border-radius:6px;
  padding:8px 11px;
}
@media (max-width:860px){
  .som-headshot-hero .som-headshot-card{
    transform:none;
  }
}
@media (max-width:700px){
  .som-headshot-hero-shell{
    padding-top:24px;
  }
  .som-headshot-hero .wp-block-media-text__content{
    padding-top:20px;
    padding-bottom:22px;
  }
  .som-headshot-hero .wp-block-media-text__media{
    height:170px;
    min-height:0;
  }
  .som-headshot-hero .wp-block-media-text__media img{
    height:100%;
    min-height:0;
    object-fit:cover;
  }
  .som-headshot-hero h1{
    font-size:clamp(30px, 8.2vw, 38px);
    margin-top:8px;
    margin-bottom:14px;
  }
  .som-headshot-hero p{
    font-size:16px;
    line-height:1.45;
  }
  .som-headshot-hero .wp-block-buttons{
    gap:10px;
  }
  .som-headshot-hero .wp-block-button__link{
    padding-top:12px;
    padding-bottom:12px;
  }
}`.trim(),
    "furniture-refinish-proof": `
.som-furniture-hero-photo img{
  aspect-ratio:16/9;
  min-height:455px;
  object-position:50% 52%;
  border-radius:8px;
}
.som-furniture-before-after .wp-block-column{
  border:1px solid color-mix(in srgb, ${p.deepGreen} 14%, transparent);
  box-shadow:none;
}
.som-furniture-hero-media-column .som-furniture-before-after{
  margin-top:14px;
}
.som-furniture-hero-media-column .som-furniture-evidence-card{
  min-height:112px;
}
.som-furniture-surface-row{
  border-left:8px solid ${p.sun};
  border-radius:8px;
}
.som-furniture-evidence-card{
  border-radius:8px;
}
.som-furniture-quote-strip{
  background:linear-gradient(135deg, ${p.deepGreen}, color-mix(in srgb, ${p.soil} 24%, ${p.deepGreen}));
}
@media (max-width:781px){
  .som-furniture-split-hero{
    --som-before-after-h1-size:clamp(30px, 8vw, 38px);
    --som-before-after-h1-line-height:1.08;
    display:flex;
    flex-direction:column;
    gap:20px;
  }
  .som-furniture-hero-copy-column{
    order:-1;
    padding-top:0;
    padding-bottom:0;
  }
  .som-furniture-hero-media-column{
    order:0;
  }
  .som-furniture-hero-photo img{
    min-height:240px;
    aspect-ratio:16/8;
  }
  .som-furniture-before-after{
    display:grid;
    grid-template-columns:repeat(2, minmax(0, 1fr));
    gap:12px;
  }
  .som-furniture-hero-media-column .som-furniture-evidence-card{
    min-height:0;
    padding-top:16px;
    padding-bottom:16px;
  }
}
@media (max-width:700px){
  .som-furniture-split-hero{
    gap:18px;
  }
  .som-furniture-hero-copy-column{
    order:0;
  }
  .som-furniture-hero-media-column{
    order:-1;
  }
  .som-furniture-hero-photo img{
    min-height:170px;
  }
  .som-furniture-before-after{
    grid-template-columns:1fr;
    gap:10px;
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
