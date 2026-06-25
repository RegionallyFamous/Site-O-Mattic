# WordPress Block And Theme JSON Capability Matrix

Use this reference before adding new Site-O-Mattic layout variants, rich sections, or polish tokens. It is a distilled map for one-page Blueprint production; the official references remain the source of truth.

## Official Sources

- Core Blocks Reference: https://developer.wordpress.org/block-editor/reference-guides/core-blocks/
- Block Supports: https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/
- Theme JSON v3 Reference: https://developer.wordpress.org/block-editor/reference-guides/theme-json-reference/theme-json-living/
- Global Settings And Styles: https://developer.wordpress.org/block-editor/how-to-guides/themes/global-settings-and-styles/
- Theme typography settings and `fontFace`: https://developer.wordpress.org/themes/global-settings-and-styles/settings/typography/
- Live Theme JSON schema: https://schemas.wp.org/trunk/theme.json
- Playground Blueprint data format: https://wordpress.github.io/wordpress-playground/blueprints/data-format/

Refresh exact theme.json keys with:

```bash
curl -L --silent https://schemas.wp.org/trunk/theme.json | python3 -m json.tool
```

## Theme JSON Surface To Exploit

Use `wp_global_styles` as the canonical token layer for Blueprints. It can carry `settings`, `styles`, and `title`; it cannot replace template posts, theme files, asset imports, or PHP registrations.

| Area | Production use |
| --- | --- |
| `settings.appearanceTools` | Enable common background, border, color, dimension, sticky position, spacing, and line-height controls. |
| `settings.color` | Define role-based palettes, gradients, duotone presets, and custom/default toggles. Palette presets create color, background, and border utility classes. |
| `settings.typography` | Define fluid type, font sizes, font families, line-height, weight, style, decoration, transform, drop cap, writing mode, and related controls. |
| `settings.typography.fontFamilies` | Use system stacks by default. If using Google Fonts, ensure files are actually bundled or written locally and include `fontFace` or explicit `@font-face`. |
| `settings.spacing` | Define units, spacing scale, spacing sizes, block gap, margin, and padding support. |
| `settings.layout` | Define `contentSize`, `wideSize`, and root padding-aware alignments. |
| `settings.border` | Enable radius/color/style/width and define radius presets where useful. |
| `settings.shadow` | Define named shadow presets for surface roles. |
| `settings.dimensions` | Use aspect ratios, width, height, min-height, min-width, and dimension presets for stable media and boards. |
| `settings.blocks` | Enable or limit controls per core block. Remember unsupported block features do not appear just because a setting is enabled. |
| `settings.custom` | Store Site-O-Mattic tokens: color roles, radius scale, shadow tints, type rhythm, pattern metadata, and QA hints. |
| `styles` root | Apply body text, background, block gap, and root color/typography. |
| `styles.elements` | Style `link`, `button`, `caption`, `heading`, and `h1` through `h6`; use pseudo states for links where supported. |
| `styles.blocks` | Apply defaults for core blocks actually used: Group, Cover, Columns, Button, Navigation, Heading, Paragraph, Image, Gallery, Media & Text, List, Table, Details, Quote, Pullquote. |
| `styles.css` | Use as a scoped escape hatch. Keep it smaller than custom CSS and use it for token-connected polish, not complex layout. |

Use `wp_update_custom_css_post()` for fixed mobile action bars, side rails, object-fit crops, responsive table handling, focus-visible reliability, anchor offsets, safe-area padding, first-render preset fallbacks, and logo sizing.

## Core Block Matrix

| Block family | Use it for | Capabilities to exploit | Guardrails |
| --- | --- | --- | --- |
| `core/group` | Sections, cards, panels, rails, sticky shells. | Full/wide align, anchor, `tagName`, layout, background, gradient, spacing, dimensions, border, shadow, sticky position. | Use semantic `section` where possible. Avoid card-inside-card page structure. |
| `core/cover` | Hero gates, proof bands, final CTA images. | Uploaded image/video, focal point, overlay color/gradient, duotone, min-height, content position, inner layout. | Keep proof inspectable; verify CTA in first viewport. |
| `core/columns` / `core/column` | Service lanes, packages, proof rows. | Width ratios, stacking, vertical alignment, block gap, spacing, borders. | QA mobile stacking and overflow. |
| `core/media-text` | Editorial proof, consultation stories, before/after process. | Media position, media width, image fill, focal point, mobile stack, inner blocks. | Make media real evidence, not filler. |
| `core/image` | Hero/proof/logo-adjacent visuals. | Attachment ID, alt, aspect ratio, scale/object-fit, size slug, border, shadow, duotone. | Always set alt and crop intentionally. |
| `core/gallery` | Visual proof mosaics and portfolio strips. | Columns, image crop, fixed height/aspect ratio, gap, attachment metadata. | Use `linkTo:"none"` unless links matter; verify mobile. |
| `core/navigation` | Header nav, side rail nav, section anchor strips. | Overlay behavior, orientation, justification, typography, anchor links. | Nav is for movement; use Buttons for action docks. Anchors must exist. |
| `core/site-logo` | Brand signal. | Uploaded logo attachment, width, link behavior. | Wordmark width usually needs 220-260px plus CSS max-width. No tagline in art. |
| `core/buttons` / `core/button` | Calls, email, quote, anchor actions. | Layout, wrapping, width, colors, gradients, border, shadow, typography, spacing. | Use real `tel:`, `mailto:`, or real anchors. No `#` placeholders. |
| `core/details` | FAQ, objections, prep notes. | Summary/content structure, spacing, border, color, typography, keyboard-native disclosure. | Keep summaries concise and useful near conversion points. |
| `core/table` | Scope, pricing bands, route days, quote prep. | Header/footer, caption, typography, color, border, spacing. | Add scoped CSS for mobile overflow/card behavior. |
| `core/quote` / `core/pullquote` | Trust, testimonials, proof claims. | Typography, border, color, citation, spacing, alignment. | Avoid fake reviews or unsupported claims. |
| `core/list` | Checklists, service inclusions, prep steps. | Spacing, typography, marker styling through CSS when needed. | Prefer concrete nouns over generic bullet soup. |
| `core/separator` / `core/spacer` | Rhythm, ledgers, receipt lines. | Preset sizes, color, spacing. | Keep mobile heights controlled. |
| `core/query` and post blocks | Seeded recent work or updates. | Query Loop, Post Template, Featured Image, Title, Excerpt, Date, Terms. | Only use with real seeded posts. Empty loops fail polish. |

Avoid experimental blocks for production Blueprints unless the target WordPress version is pinned and verified. Keep forms, maps, embeds, plugin blocks, remote assets, and external scripts out of the default Site-O-Mattic path.

## Production Rules

- Structured theme.json first, block attributes second, scoped CSS third.
- Every spec `coreBlockPlan` must appear in actual page markup when it names a rich block.
- Color roles should resolve into real tokens, not only metadata.
- Geometry choices should resolve into radius, border, shadow, media crop, and spacing tokens.
- Screenshot QA is the authority for first viewport CTA, logo size, mobile overflow, sticky/fixed overlap, and table/gallery behavior.
