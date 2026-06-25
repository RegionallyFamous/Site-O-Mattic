# Pattern And Style Catalog

Site-O-Mattic patterns are selected by conversion job, not by niche. A niche can share a broad category with another site while still feeling distinct when the hero, navigation, proof, service presentation, CTA rhythm, typography, color, and surface model are different.

Use this catalog before creating more specs or implementing more archetypes. Do not generate additional niche Blueprints until the chosen pattern family, style voice, and signature move are named.

## Production Pattern Grammar

Every Blueprint should be assigned as a pattern recipe before copy, imagery, or markup is generated. The recipe is not a niche idea; it is the production contract that keeps a one-page site from becoming a recolored clone.

Record or be able to state these choices for each generated site:

- `primaryPattern`: the conversion job that drives the page, such as package comparison, consultation, photo quote, route schedule, risk prevention, or portfolio proof.
- `secondaryPattern`: the support pattern that solves the next hesitation, such as FAQ objections, proof strip, service area confidence, or process reassurance.
- `navigationPrimitive`: the movement/action pattern, such as compact header, desktop side rail, split nav/action bar, section anchor strip, or mobile fixed action bar.
- `styleContract`: one sentence in the shape `mood + trust cue + image evidence + accent behavior + signature move`.
- `imageRole`: work in progress, finished result, process closeup, local context, or proof collage.
- `ctaRhythm`: call-first, quote-first, photo-first, date-check, package-select, consult, or route-join.
- `surfaceModel`: mostly flat, outlined repeaters, single elevated proof, dark panel, receipt stack, or ticket/menu board.
- `knownRisks`: first-viewport CTA, logo scale, mobile overlap, sticky anchor offset, readable package/table rows, or gallery hero height.

Before shipping, run the squint test against the previous two Blueprints. If the page silhouette, navigation pattern, CTA placement, proof rhythm, and surface geometry look the same before reading the business name, the pattern assignment failed.

## Core Block Boundary

Stay inside core WordPress blocks and global styles:

- `Group`, `Cover`, `Media & Text`, `Columns`, `Row`, `Stack`, `Image`, `Gallery`, `Buttons`, `Navigation`, `List`, `Table`, `Details`, `Separator`, `Quote`, `Pullquote`, `Spacer`, and `Site Logo`.
- WordPress core has no complete native lead-form workflow. Treat form-like patterns as quote/contact panels with real `tel:` and `mailto:` actions unless another approved core-only contact path exists.
- Use theme/global styles and scoped custom CSS for fixed mobile action bars, side rails, responsive art direction, and repeated component polish.

Prefer `wp_global_styles` and `theme.json` tokens for the reusable design system: palette, gradients, fluid typography, spacing scale, shadows, radius, root padding, block defaults, link states, and button states. Use scoped custom CSS for what block supports cannot reliably express: fixed bars, side rails, advanced grids, object-fit crops, focus-visible polish, preset utility fallbacks, logo sizing, and Playground first-render reliability.

Do not depend on remote fonts, remote images, plugin blocks, maps, embeds, forms, external scripts, or networking. The Studio-ready Blueprint must stay self-contained.

## Conversion Spine

Use this as the underlying lead-generation rhythm, then vary the visible layout, section order, and components by archetype:

| Stage | Job | Pattern notes |
| --- | --- | --- |
| Utility header | Brand, local relevance, phone/quote path. | Logo readable at actual header size, service area cue, one primary action. |
| Hero / action gate | Resolve visitor intent fast. | H1 names the service outcome and local context; include proof cue plus primary and secondary CTA. |
| Proof strip | Put trust near hesitation. | Use operational proof for demos: response time, process, warranty, service-area familiarity, insured/safe handling. Avoid fake platform review counts. |
| Offer / scope | Show exactly what is included. | Cards, receipt-style list, package board, checklist rows, before/after surfaces, or add-on matrix. |
| Process reassurance | Reduce anxiety about what happens next. | Usually 3-4 steps: send/call, estimate, schedule, service complete. |
| Service area / timing | Make the site feel local and real. | Towns, route days, seasonal windows, mobile service cues, arrival notes, or prep timing. |
| FAQ / objections | Resolve late-stage doubts without bloating the page. | Use `Details` for pricing, prep, timing, quote accuracy, radius, payment, and access notes. |
| Final contact | Repeat the action with useful instructions. | Tell visitors what to send, expected response time, phone/email, and privacy/no-pressure cue. |

CTA rhythm should be deliberate, not noisy: header, hero, after proof or offer, after process, and final contact. On mobile-heavy patterns, a bottom bar may replace some repeated inline CTAs, but it must never cover footer or final contact content.


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
| Receipt / Scope Summary | Make quote-based services feel concrete before contact. | A structured "included / add-ons / timing / what to send" ticket or receipt. | `Group`, `Columns`, `List`, `Table`, `Buttons`. |
| Consultation Story Flow | Make high-trust services feel calm and supportive. | Warm hero, what to expect, consult steps, proof, service area, gentle final CTA. | `Group`, `Media & Text`, `Quote`, `List`, `Buttons`. |
| Workshop / Craft Bench | Make hands-on skilled services feel tangible. | Process closeups, materials chips, timeline, care notes, send-photo CTA. | `Image`, `Columns`, `Group`, `List`, `Separator`. |
| Route / Schedule Board | Make recurring mobile services feel operational. | Route days, areas served, plan cadence, service menu, join-route action. | `Group`, `Table`, `Columns`, `List`, `Buttons`. |

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
| `fixed-bottom-action` | Mobile Fixed Action Bar, Decision Filter Hero, Proof Bar. | Strong for phone-first/mobile services; verify the fixed bar does not cover footer content or compete with desktop CTAs. |

## Style Dimensions

Record these in the layout signature where practical, and verify them in screenshots:

- `styleContract`: one sentence naming mood, trust cue, image evidence, accent behavior, and signature move.
- `typographyTreatment`: `single-system-weighted`, `editorial-serif-display`, `warm-humanist-sans`, `industrial-condensed-display`, `dark-neo-grotesque`, plus existing repo treatments.
- `fontPairingRule`: use no more than two text families in normal sites; reserve mono for small metrics, tickets, receipts, or labels.
- `typeScale`: hero 56-84px desktop and 40-52px mobile; section heads 32-44px; card/list heads 20-26px; body 16-18px with 1.5-1.65 line-height.
- `colorStrategy`: `quiet-neutral-plus-accent`, `dark-editorial-plus-bright-cta`, `image-led-muted-palette`, `two-tone-corporate-grid`, `high-contrast-action`.
- `colorRoles`: name how `ink`, `paper`, `field`, `line`, `primary`, `action`, `proof`, `muted`, `warning`, and `shadow-tint` behave. Avoid one-note palettes where every surface is a tint of the same hue.
- `surfaceModel`: `mostly-flat`, `outlined-repeaters`, `single-elevated-proof`, `dark-panels`, `receipt-stack`, or `ticket-menu-board`. Do not put cards inside cards.
- `density`: `compact-leadgen`, `balanced-editorial`, or `visual-first`. Most one-page service sites should stay within 6-8 sections and 3-5 anchors.
- `imageDirection`: `operator-or-founder`, `finished-outcome`, `work-in-progress`, `process-closeup`, `environment-context`, or `proof-collage`. The image must prove the service or result.
- `brandSignal`: first viewport should include logo, literal service promise, CTA, and image/proof cue.
- `ctaRhythm`: call-first, quote-first, photo-first, date-check, package-select, consult, route-join, or final-only-soft-close. Use one visually dominant action color.
- `cardGeometry`: card radius stays at 8px or less; use 2px for precise, 4px for utilitarian, 6px for friendly, and 8px for premium-soft. Pills are for compact labels and CTA affordances, not whole sections.
- `shadowRole`: use borders and tonal fields for ordinary surfaces; reserve shadows for hero media, key proof, and CTA/callout surfaces.

## Navigation Rules

- One-page navigation should stay local. Avoid full site navigation that creates exit paths.
- Anchor links must map to clear section headings and use short, specific labels.
- Desktop side rails are useful for longer one-page flows, but they consume space; collapse them cleanly on mobile.
- Mobile fixed action bars should usually contain one primary action and at most one secondary action.
- Touch targets must be visibly thumb-friendly, with enough spacing that buttons do not feel cramped.
- CTA copy should name the action: send photos, check date, request quote, call, plan consult, join route.
- Add `scroll-margin-top` for anchored sections when sticky headers or rails are present.
- Mobile fixed bars need safe-area padding and page bottom padding, for example `env(safe-area-inset-bottom)`, so they do not cover footer or final CTA content.
- Do not use a second `Navigation` block as a mobile action dock. Use `Buttons` for quote/call/date actions and keep the navigation semantic.
- Keep mobile nav labels short and verify at 360px, 390px, 430px, 768px, 1024px, and desktop widths during visual QA when the layout uses sticky or fixed navigation.

## Navigation Primitives

| Primitive | Desktop behavior | Mobile behavior | QA risks |
| --- | --- | --- | --- |
| `compact-header` | Sticky top header with logo, short anchors, one CTA. | Logo plus compact nav or action button. | Logo scale, wrapped nav labels, anchor offset. |
| `split-nav-action-bar` | Logo left, anchors center, action buttons right. | Actions move to fixed bottom bar or stacked buttons. | Duplicate CTA focus order, crowded header. |
| `desktop-side-header` | Sticky/fixed side rail with logo, vertical anchors, primary CTA. | Side rail hidden, compact top header appears. | Main content offset, mobile collapse, rail z-index. |
| `section-anchor-strip` | Thin sticky in-page anchor strip after hero or in rail. | Horizontal scroll strip or omitted in favor of CTA bar. | Hidden anchor targets, cramped labels. |
| `fixed-bottom-mobile-cta` | Hidden or reduced to normal desktop CTA. | One dominant action plus optional call/text action. | Footer coverage, safe-area padding, overlay conflicts. |
| `floating-proof-action` | Sticky proof/contact group inside split layouts. | Inline proof group or hidden if it crowds the viewport. | Overlap with media, confusing keyboard order. |
| `viewport-safe-hero-shell` | First viewport includes headline, proof cue, and CTA. | Uses `svh`/`dvh` fallback and reduced media height. | CTA below fold, mobile browser chrome changes. |

## Production Implications

Before resuming full-scale blueprint generation:

- Pick a primary pattern family and one secondary support pattern for each remaining niche.
- Implement enough archetypes that 35 sites do not overuse the current ten silhouettes, especially top-horizontal-header variants.
- Move hardcoded CTA labels from archetype builders into specs before broad reuse.
- Split `src/build-blueprint.mjs` by archetype/shared components before the file becomes unsafe to review.
- Keep JSON schema, JS validation, polish reports, and variety reports aligned as pattern fields evolve.
- Add a compact variety summary before 35 sites create unreadably large pairwise output.
- Track use of underused core blocks such as `Details`, `Table`, `Gallery`, `Quote`, `Pullquote`, and `Media & Text` so production has real structural variety, not just different component class names.

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
