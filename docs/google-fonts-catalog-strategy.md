# Google Fonts Catalog Strategy

Do not rely on memory or a handwritten list for Google Fonts. The catalog changes. Use a live source, cache a normalized snapshot, and choose fonts by role.

## Sources

- Google Fonts Developer API: https://developers.google.com/fonts/docs/developer_api
- Google Fonts CSS2 API: https://developers.google.com/fonts/docs/css2
- Google Fonts FAQ and licensing: https://developers.google.com/fonts/faq
- Google Fonts privacy FAQ: https://developers.google.com/fonts/faq/privacy
- Google Fonts GitHub repository: https://github.com/google/fonts
- Google Fonts `METADATA.pb` guide: https://googlefonts.github.io/gf-guide/metadata.html
- WordPress theme typography and `fontFace`: https://developer.wordpress.org/themes/global-settings-and-styles/settings/typography/

## Refresh Commands

Use the documented API when a key is available:

```bash
GOOGLE_FONTS_API_KEY=... npm run fonts:catalog
```

Use the keyless Google Fonts metadata fallback when a key is not available:

```bash
npm run fonts:catalog
```

Preview counts without writing a snapshot:

```bash
npm run fonts:catalog -- --summary-only
```

The script writes `data/google-fonts-catalog.json` by default. Treat this as a snapshot, not eternal truth.

## What The Catalog Knows

The Developer API provides served-family metadata: family, category, variants, subsets, version, last modified date, files, menu file, kind, and with capabilities, variable axes, WOFF2 files, and family tags.

The keyless `fonts.google.com/metadata/fonts` endpoint currently provides family metadata, category, subsets, style keys, axes, designers, date added, last modified, popularity/trending ranks, Noto/open-source flags, languages, and an axis registry. It is useful, but not the documented stable API contract.

The `google/fonts` repository provides license and file provenance, including family directories, font binaries, license files, and `METADATA.pb`.

## Blueprint Policy

Site-O-Mattic Blueprints stay self-contained by default. That means no remote Google Fonts CSS in production Blueprints with `features.networking:false`.

Use these options in order:

1. System/local stacks for normal Site-O-Mattic output.
2. Self-hosted Google Font files only when the Blueprint explicitly owns the font files, license text, and `fontFace` or `@font-face` registration.
3. Remote Google Fonts CSS only for quick opt-in previews, never for default production Blueprints.

If bundling Google Fonts, include the family license, prefer WOFF2, keep family count low, and avoid modifying OFL fonts unless Reserved Font Name rules are understood.

## Typography Selection Lanes

Use the full catalog for discovery, but steer choices through these roles:

| Lane | Good for | Display candidates | Body/UI candidates | Accent candidates |
| --- | --- | --- | --- | --- |
| Quiet utility grid | Cleaning, repair, logistics. | Inter Tight, Archivo | Inter, Source Sans 3 | IBM Plex Mono |
| Humanist local calm | Pet care, wellness, tutoring. | Figtree, Nunito Sans | Atkinson Hyperlegible, Lato | Noto Sans |
| Editorial proof stage | Landscaping, interiors, proof-heavy services. | Fraunces, Newsreader | Source Serif 4, Literata | Work Sans |
| Operator console | HVAC, inspection, route services. | Barlow Condensed, Roboto Condensed | IBM Plex Sans, Public Sans | IBM Plex Mono |
| Material workbench | Repair, craft, restoration. | Zilla Slab, Roboto Slab, Bitter | Source Sans 3, IBM Plex Sans | Space Mono |
| Hospitality menu board | Catering, events, party services. | Bebas Neue, Oswald | DM Sans, Instrument Sans | Roboto Mono |
| Premium soft service | Floral, styling, staging, boutique home. | DM Serif Display, Marcellus, Playfair Display | Manrope, Figtree | Cormorant Garamond |
| Risk/control alert | Emergency, mitigation, safety. | Archivo, Space Grotesk | Public Sans, Roboto Flex | IBM Plex Mono |
| Receipt ledger | Quote-heavy trades and estimates. | IBM Plex Sans Condensed | IBM Plex Sans, Inter | Space Mono |
| Visual-first gallery | Portfolios and transformations. | Fraunces, Cormorant Garamond | Work Sans, Libre Franklin | Lora |

Ship at most two font families per Blueprint unless a mono accent is part of the conversion pattern. Vary size, weight, line height, letter case, button type, nav density, and proof label type along with the family choice.
