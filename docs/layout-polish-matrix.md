# Layout And Polish Matrix

This matrix turns the research pass into production rules. Every Site-O-Mattic spec should combine a visible layout silhouette, a style family, a navigation primitive, and a polish contract before copy, assets, colors, or typography are finalized.

The code source of truth is `src/production-polish-matrix.mjs`; this document is the reviewer-facing summary.

## Layout Silhouettes

| Silhouette | Conversion job | Signature move | Strong core blocks |
| --- | --- | --- | --- |
| `viewport-safe-conversion-shell` | Show brand, service promise, proof cue, CTA, and media immediately. | First-screen conversion shell | `Cover`, `Columns`, `Image`, `Buttons`, `List` |
| `editorial-proof-stage` | Let service evidence sell before claims do. | Evidence-led hero or gallery | `Cover`, `Gallery`, `Image`, `Quote`, `Media & Text` |
| `split-quote-board` | Move estimate-heavy visitors to action. | High-contrast quote/action board | `Columns`, `List`, `Buttons`, `Table` |
| `receipt-scope-stack` | Make scope, prep, and quote expectations concrete. | Receipt, ledger, or scope stack | `Media & Text`, `Table`, `Details`, `Quote`, `List` |
| `operator-console` | Make technical or recurring work feel controlled. | Console, board, or status panel | `Columns`, `Navigation`, `Table`, `List`, `Buttons` |
| `side-rail-service-story` | Break top-header sameness and keep long flows navigable. | Persistent side rail with proof/action | `Navigation`, `Columns`, `Image`, `List`, `Buttons` |
| `gallery-mosaic-proof` | Show breadth, craft, and visual fit. | Mosaic or lookbook proof system | `Gallery`, `Image`, `Cover`, `Quote`, `Buttons` |
| `checklist-urgency-gate` | Help visitors self-diagnose timing or risk. | Checklist or warning gate | `List`, `Details`, `Columns`, `Buttons` |
| `route-status-board` | Prove service-area timing and route reliability. | Route, status, or visit-note board | `Table`, `Details`, `Columns`, `List`, `Buttons` |
| `package-menu-board` | Help visitors compare packages quickly. | Readable package or menu board | `Table`, `Columns`, `List`, `Separator`, `Buttons` |
| `consultation-story-flow` | Build trust for high-consideration services. | Guided consult story flow | `Media & Text`, `Quote`, `Details`, `List`, `Buttons` |
| `mobile-action-dock` | Keep phone-first conversion thumb-ready. | Fixed mobile action dock | `Buttons`, `Columns`, `List`, `Image`, `Navigation` |
| `floating-proof-sidecar` | Keep proof/contact visible beside dense copy. | Sticky proof/action sidecar | `Columns`, `Quote`, `List`, `Buttons`, `Details` |

## Style Families

| Family | Type voice | Surface behavior | Restraint |
| --- | --- | --- | --- |
| `quiet-utility-grid` | Compact system sans | Flat or outlined repeaters | Useful density, not decoration |
| `humanist-local-calm` | Humanist body with soft display contrast | Quiet tonal cards | Friendly without getting cute |
| `editorial-proof-stage` | Serif/bookish display plus readable body | Fewer cards, more image proof | Let the image do the proving |
| `operator-console` | Condensed/sturdy display with mono labels | Rails, boards, status rows | Dense but not cramped |
| `material-workbench` | Sturdy display, humanist body, mono labels | Inset borders and bench/ticket surfaces | Tactile, not rustic-cliche |
| `mobile-action-gloss` | System UI with bold action labels | Mobile dock gets strongest elevation | The dock is loud; the rest is controlled |
| `risk-control-alert` | Sturdy/condensed sans | Checklist gates and risk rows | No exaggerated scare copy |
| `receipt-ledger` | System body with mono accent | Receipts, tables, ledgers, details | Rows stay readable on mobile |
| `hospitality-menu` | Commercial/menu display with readable body | Menu tickets and package panels | Expressive menu; scannable packages |
| `clear-status-dashboard` | Clean dashboard sans with mono/status accents | Boards, rails, status strips | Only one floating board dominates |

## Production Guardrails

- First viewport: brand, literal service promise, proof cue, primary CTA, and real service media.
- Typography: body line-height `1.52-1.66`, heading line-height `1.04-1.12`, running copy `58-72ch`.
- Typography roles: body for paragraphs, display for headings/major numerals, accent for nav/labels/buttons/proof chips.
- Typography distribution: track actual rendered display and accent font families across the catalog. Unique treatment names are not enough if pages keep resolving to the same few local/system faces.
- Render family: track the shared builder family as well as `layoutVariant`; alias variants should differ in hero geometry, proof placement, section order, rich-block mix, or CTA placement.
- Hero image prompts: the unique prompt body must name service moment, visible proof/outcome, believable environment, composition/crop, negative space, lighting, tools/materials/textures, and artifact negatives.
- Copy rhythm: quote instructions, objection answers, secondary CTAs, and service-area endings should vary by conversion rhythm and niche-specific visitor instructions.
- Color roles: define `ink`, `paper`, `field`, `line`, `primary`, `action`, `proof`, `muted`, `warning`, and `shadowTint`.
- Radius: card, panel, and image radii should resolve to `8px` or less. Pill shapes are reserved for actions and compact labels.
- Elevation: ordinary surfaces use borders or tonal fields. Shadows are reserved for hero media, one proof/contact board, or a mobile dock.
- CTA copy: name the action. Avoid generic "Get started", "Learn more", "Submit", and bare "Call".
- Navigation: one-page nav is local. Sticky/fixed UI needs anchor offsets, focus-visible checks, safe-area padding, and footer-overlap QA.
- Core blocks: use richer core blocks when they carry the pattern: `Media & Text`, `Gallery`, `Table`, `Details`, `Quote`, and `Pullquote`.
- Core-block plans must be bidirectional: if `coreBlockPlan` names a rich block, the generated markup must include that exact core block; if the markup includes `Media & Text`, `Gallery`, `Table`, `Details`, `Quote`, or `Pullquote`, the spec must declare it. This keeps pattern metadata from drifting away from real WordPress output.
- Core-block variety is budgeted by rich-block combinations, not just the first matching block. A full catalog should avoid overusing `basic-structure`, `table`, or `table+details`; choose `details`, `quote`, `gallery+quote`, `media-text+details+quote`, or other truthful combinations when the conversion job fits.
- When a rich-block combination hits its budget, solve it in the generator: add real support for another core-block combination in the shared archetype builder, update the candidate specs, then rerun build/validation/manifest/uniqueness. Do not loosen the budget or only change metadata.
- WordPress-native polish should live in `wp_global_styles` first: `theme.json` v3, `appearanceTools`, root-padding-aware alignments, palette/gradients, fluid type, spacing scale, shadows, `border.radiusSizes`, `dimensions.aspectRatios`, `settings.custom.som`, and block defaults for all allowed blocks. CSS remains the fallback for fixed docks, rails, object-fit crops, safe-area padding, anchor offsets, first-render preset utilities, focus-visible, and mobile table/detail behavior.
- Track block-support richness, not only block names: aspect ratios, focal points, captions, semantic `section` groups, grouped `Details`, mobile table ledgers, sticky-safe groups, and restrained duotone/media treatments are premium signals when they are used deliberately.
- Package, scope, route, receipt, and prep comparisons should use actual `core/table` blocks with mobile card-style fallback. Objections, prep notes, and quote-fit questions should use actual `core/details`. Trust/proof moments should use actual `core/quote` or `core/pullquote`, not styled paragraphs pretending to be quotes.
- Visual QA should record first-viewport proof/action evidence: logo, H1, proof cue, primary CTA, service media, next-section peek, fixed dock/footer overlap, and proof-card alignment. Add 360px, 390px, 430px, 768px, 1024px, and desktop checks when sticky, side-rail, table, or mobile dock patterns are active.
