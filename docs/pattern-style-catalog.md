# Pattern And Style Catalog

Site-O-Mattic patterns are selected by conversion job, not by niche. A niche can share a broad category with another site while still feeling distinct when the hero, navigation, proof, service presentation, CTA rhythm, typography, color, and surface model are different.

Use this catalog before creating more specs or implementing more archetypes. Do not generate additional niche Blueprints until the chosen pattern family, style voice, and signature move are named.

## Core Block Boundary

Stay inside core WordPress blocks and global styles:

- `Group`, `Cover`, `Media & Text`, `Columns`, `Row`, `Stack`, `Image`, `Gallery`, `Buttons`, `Navigation`, `List`, `Table`, `Details`, `Separator`, `Quote`, `Pullquote`, `Spacer`, and `Site Logo`.
- WordPress core has no complete native lead-form workflow. Treat form-like patterns as quote/contact panels with real `tel:` and `mailto:` actions unless another approved core-only contact path exists.
- Use theme/global styles and scoped custom CSS for fixed mobile action bars, side rails, responsive art direction, and repeated component polish.

## Pattern Families

| Pattern | Conversion job | Typical structure | Core-block translation |
| --- | --- | --- | --- |
| Decision Filter Hero | Help visitors decide quickly: nearby, relevant, trustworthy, easy next step. | Service/location headline, outcome promise, primary CTA, small proof row, specific work image. | `Columns` or `Cover`, `Heading`, `Paragraph`, `Buttons`, `Image`, `Group`. |
| Hero Quote Panel | Move estimate-heavy visitors from interest to quote/contact. | Split hero with copy plus high-contrast quote/call panel, trust badges, minimal contact fields as display copy only. | `Columns`, nested `Group`, `Buttons`, `List`, optional `Table`. |
| Proof Bar Under Hero | Put trust where hesitation begins. | 3-5 chips: response time, local proof, warranty, insured, rating, years served. | `Row`, `Columns`, `Group`, `Paragraph`, `Image`. |
| Service Path Tiles | Let visitors self-select the right path. | 3-4 action tiles such as urgent help, planned service, estimate, maintenance, date check. | `Columns`, `Group`, `Heading`, `Paragraph`, `Buttons`. |
| Process Reassurance Timeline | Reduce anxiety around what happens after contact. | 3-4 steps: send/request, review/inspect, clear plan, service complete. | `Columns`, `Group`, `List`, `Separator`, numbered badges. |
| Authentic Work Proof Gallery | Prove the service with visible work or outcome. | Project/team/truck/tool/result imagery before testimonials; avoid generic atmosphere. | `Image`, `Gallery`, `Media & Text`, `Columns`. |
| Package / Menu Board | Help users compare event/package options. | Tier cards or menu rows with title, fit, inclusions, starting point, and date/check CTA. | `Columns`, `Group`, `List`, `Table`, `Buttons`, `Separator`. |
| Editorial Collage / Portfolio Proof | Make visual services feel curated and high-touch. | Large hero shot, narrow crops, alternating image/text panels, category cards, testimonial proof. | `Cover`, `Columns`, `Image`, `Gallery`, `Group`, `Quote`. |
| Desktop Side Rail | Keep long one-page flows navigable without top-header sameness. | Sticky desktop rail with logo, local anchors, CTA, proof or ticket; mobile collapses to compact top header. | `Group` or `Columns`, `Navigation`, `Buttons`, responsive custom CSS. |
| Mobile Fixed Action Bar | Keep the primary action thumb-friendly. | One dominant mobile CTA, optional secondary call/text action, safe-area padding, no full nav dock unless app-like. | `Group`, `Row`, `Buttons`, custom CSS. |
| Service Area Confidence Strip | Reinforce local relevance and response scope. | Towns/neighborhoods, route note, availability cue, local proof. | `Group`, `Columns`, `List`, `Paragraph`, `Buttons`. |
| FAQ / Objection Accordion | Resolve late-stage objections without bloating the page. | 4-6 concise objections: pricing, timing, prep, warranty, service area, what happens next. | `Details`, `Heading`, `Paragraph`. |

## Implemented Archetype Coverage

| Current archetype | Pattern coverage | Notes before reuse |
| --- | --- | --- |
| `route-plan` | Decision Filter Hero, Service Area Confidence Strip, Process Reassurance Timeline. | Add stronger route-board/service-area signature before repeating too often. |
| `before-after-quote` | Hero Quote Panel, Authentic Work Proof Gallery, Process Reassurance Timeline. | Good for transformation services; keep before/after proof visually specific. |
| `checklist-urgency` | Proof Bar Under Hero, Service Path Tiles, FAQ/Objection shape. | Good for checklist/risk services; avoid overusing top-header layout. |
| `risk-prevention` | Decision Filter Hero, Proof Bar, Process Reassurance Timeline. | Strong for prevention; vary from checklist by using warning rows and seasonal proof. |
| `gallery-led` | Editorial Collage / Portfolio Proof, Authentic Work Proof Gallery. | Needs CTA-in-first-viewport guardrails every time. |
| `surface-seasonal` | Hero Quote Panel, Proof Bar, Process Timeline. | Good seasonal urgency; vary surface/card rhythm if reused. |
| `stain-care` | Decision Filter Hero, Proof Bar, Service Path Tiles. | Good softer trust pattern; add more distinctive proof if reused. |
| `side-rail-service` | Desktop Side Rail, Hero Quote Panel, Proof Bar, Process Timeline. | Strong operational silhouette; mobile collapse and logo scale must be checked. |
| `package-menu-board` | Package / Menu Board, Proof Bar, Process Reassurance Timeline. | Strong for event and catering services; keep menu ticket and package comparison readable on mobile. |

## Style Dimensions

Record these in the layout signature where practical, and verify them in screenshots:

- `typographyTreatment`: `single-system-weighted`, `editorial-serif-display`, `warm-humanist-sans`, `industrial-condensed-display`, `dark-neo-grotesque`, plus existing repo treatments.
- `fontPairingRule`: use no more than two text families in normal sites; reserve mono for small metrics, tickets, receipts, or labels.
- `typeScale`: hero 56-84px desktop and 40-52px mobile; section heads 32-44px; card/list heads 20-26px; body 16-18px with 1.5-1.65 line-height.
- `colorStrategy`: `quiet-neutral-plus-accent`, `dark-editorial-plus-bright-cta`, `image-led-muted-palette`, `two-tone-corporate-grid`, `high-contrast-action`.
- `surfaceModel`: `mostly-flat`, `outlined-repeaters`, `single-elevated-proof`, `dark-panels`. Do not put cards inside cards.
- `density`: `compact-leadgen`, `balanced-editorial`, or `visual-first`. Most one-page service sites should stay within 6-8 sections and 3-5 anchors.
- `imageDirection`: `operator-or-founder`, `finished-outcome`, `process-closeup`, `environment-context`, or `proof-collage`. The image must prove the service or result.
- `brandSignal`: first viewport should include logo, literal service promise, CTA, and image/proof cue.
- `ctaRhythm`: hero CTA, repeated proof/process CTA, final CTA. Use one visually dominant action color.

## Navigation Rules

- One-page navigation should stay local. Avoid full site navigation that creates exit paths.
- Anchor links must map to clear section headings and use short, specific labels.
- Desktop side rails are useful for longer one-page flows, but they consume space; collapse them cleanly on mobile.
- Mobile fixed action bars should usually contain one primary action and at most one secondary action.
- Touch targets must be visibly thumb-friendly, with enough spacing that buttons do not feel cramped.
- CTA copy should name the action: send photos, check date, request quote, call, plan consult, join route.

## Production Implications

Before resuming full-scale blueprint generation:

- Pick a primary pattern family and one secondary support pattern for each remaining niche.
- Implement enough archetypes that 35 sites do not overuse the current eight silhouettes.
- Move hardcoded CTA labels from archetype builders into specs before broad reuse.
- Split `src/build-blueprint.mjs` by archetype/shared components before the file becomes unsafe to review.
- Keep JSON schema, JS validation, polish reports, and variety reports aligned as pattern fields evolve.
- Add a compact variety summary before 35 sites create unreadably large pairwise output.

## Source Trail

- WordPress core blocks: https://developer.wordpress.org/block-editor/reference-guides/core-blocks/
- WordPress page jumps/anchors: https://wordpress.org/documentation/article/page-jumps/
- WordPress sticky block support: https://make.wordpress.org/core/2023/03/07/sticky-position-block-support/
- NN/g in-page links: https://www.nngroup.com/articles/in-page-links-content-navigation/
- NN/g table of contents and side rails: https://www.nngroup.com/articles/table-of-contents/
- NN/g mobile navigation patterns: https://www.nngroup.com/articles/mobile-navigation-patterns/
- NN/g type pairing: https://www.nngroup.com/articles/pairing-typefaces/
- WCAG target size minimum: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Baymard button design: https://baymard.com/learn/button-design
- Modern Font Stacks: https://modernfontstacks.com/
- Atlassian spacing: https://atlassian.design/foundations/spacing
- Atlassian elevation: https://atlassian.design/foundations/elevation
