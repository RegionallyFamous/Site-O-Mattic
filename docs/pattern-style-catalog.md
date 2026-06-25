# Pattern And Style Catalog

Site-O-Mattic patterns are selected by conversion job, not by niche. A niche can share a broad category with another site while still feeling distinct when the hero, navigation, proof, service presentation, CTA rhythm, typography, color, and surface model are different.

Use this catalog before creating more specs or implementing more archetypes. Do not generate additional niche Blueprints until the chosen pattern family, style voice, and signature move are named.

## Research Synthesis

The research pass split pattern work into six lanes: conversion patterns, navigation primitives, style systems, WordPress/core-block capabilities, current repo coverage, and scale QA. The result is a production atlas, not a niche backlog. New niches should not be generated from this document directly; they should first choose a pattern recipe from it.

The big takeaways:

- The current technical architecture is strong: self-contained Playground/Studio Blueprints, `runPHP`, embedded media, `wp_global_styles`, a custom CSS fallback, a front-page `core/post-content` template, and quality gates are the right foundation.
- The visual variety risk is not `layoutVariant`; the current set already uses many implemented variants. The risk is repeated primitives: top headers, work-in-progress imagery, repeated CTA rhythms, and overly broad surface labels can still hide clone-like pages.
- The generated pages are underusing the richer core-block grammar already allowed by the builder. Use `Media & Text`, `Gallery`, `Table`, `Quote`, `Pullquote`, `Details`, `List`, and stronger `Cover` compositions when the pattern asks for them.
- `surfaceModel` is useful but too free-form to police scale on its own. Pair it with the stricter `surfaceFamily`, plus style, density, geometry, and core-block-plan fields before any new production spec is approved.
- Visual distinctness needs measurable evidence: signature fields, first-viewport metrics, logo metrics, block usage, sticky/fixed overlap checks, focus walks, and nearest-neighbor screenshot comparisons.

## Production Pattern Grammar

Every Blueprint should be assigned as a pattern recipe before copy, imagery, or markup is generated. The recipe is not a niche idea; it is the production contract that keeps a one-page site from becoming a recolored clone.

Record or be able to state these choices for each generated site:

- `primaryPattern`: the conversion job that drives the page, such as package comparison, consultation, photo quote, route schedule, date-window reservation, risk prevention, or portfolio proof.
- `secondaryPattern`: the support pattern that solves the next hesitation, such as FAQ objections, proof strip, service area confidence, or process reassurance.
- `silhouette`: the visible page shape, such as viewport-safe shell, split quote board, receipt stack, operator console, gallery proof, side rail, package menu, mobile dock, or floating proof sidecar.
- `navigationPrimitive`: the movement/action pattern, such as compact header, desktop side rail, split nav/action bar, section anchor strip, or mobile fixed action bar.
- `mobileActionPattern`: the mobile-specific action behavior, such as inline hero actions, fixed bottom CTA, date-check action, send-photo action, or section-anchor plus inline phone.
- `styleContract`: one sentence in the shape `mood + trust cue + image evidence + accent behavior + signature move`.
- `imageRole`: work in progress, finished result, process closeup, local context, or proof collage.
- `imageEvidence`: a concrete statement of what the image proves.
- `ctaRhythm`: call-first, quote-first, photo-first, date-check, package-select, consult, or route-join.
- `surfaceFamily`: controlled surface family such as outlined repeaters, single elevated proof, dark panel, receipt stack, ticket/menu board, status board, mobile dock, side rail, gallery mosaic, or grid board.
- `surfaceModel`: readable surface detail, such as route cards, warning rows, grid map, floating proof board, or receipt-table-details stack.
- `styleFamily`: the visual voice family from the Style Family Atlas.
- `density`: compact lead-gen, balanced editorial, or visual first.
- `colorRoles`: map ink, paper, field, line, primary, action, proof, muted, warning, and shadow tint to palette roles.
- `geometry`: radius scale, border role, shadow role, and media crop rule.
- `coreBlockPlan`: the richer core blocks that carry the pattern, especially `Media & Text`, `Gallery`, `Table`, `Quote`, `Pullquote`, and `Details` when appropriate.
- `knownRisks`: first-viewport CTA, logo scale, mobile overlap, sticky anchor offset, readable package/table rows, or gallery hero height.

These fields are production data now, not optional notes. Every spec must include a `pattern` object with the fields above, and the builder embeds them in the non-rendered Site-O-Mattic layout signature plus `settings.custom.som.pattern`. `npm run spec:validate`, `npm run blueprint:validate`, `npm run blueprint:sync`, and `npm run blueprint:variety` use this contract to catch missing pattern intent, stale generated Blueprints, repeated navigation primitives, and clone-like production choices before a Playground link is shared.

Before shipping, run the squint test against the previous two Blueprints. If the page silhouette, navigation pattern, CTA placement, proof rhythm, and surface geometry look the same before reading the business name, the pattern assignment failed.

## Pattern Selection Workflow

Use this workflow before writing copy, generating images, or assigning a layout:

1. Choose the conversion job: decision filter, quote/action, proof-led transformation, checklist/urgency, date-window reservation, scope/package, route/schedule, consultation/story, or objection-led close.
2. Choose the support job: proof strip, service-area confidence, process reassurance, FAQ objections, package comparison, route/date confidence, material proof, or safety/risk proof.
3. Choose the navigation primitive: compact header only when it genuinely fits; otherwise prefer side rail, split nav/action, section anchor strip, fixed mobile action, floating proof/action, or viewport-safe hero shell.
4. Choose the image evidence: finished outcome, work in progress, process closeup, operator/founder, local context, environment context, or proof collage. The image must prove something concrete.
5. Choose the CTA rhythm: call-first, quote-first, photo-first, date-check, package-select, consult-first, route-join, book-first, start-service, or photo-plan.
6. Choose the style family: type voice, color roles, surface geometry, radius/shadow rules, image direction, and restraint rule.
7. Choose the surface family, density, geometry, color-role map, and core-block plan.
8. Write the one-sentence `styleContract` in this shape: mood, trust cue, image evidence, accent behavior, signature move.
9. Check the previous two Blueprints before building. The new recipe should differ in at least four of hero composition, navigation treatment, type pairing, color role map, section order, service presentation, proof treatment, CTA rhythm, image role, card geometry, and mobile action pattern.

## Core Block Boundary

Stay inside core WordPress blocks and global styles:

- `Group`, `Cover`, `Media & Text`, `Columns`, `Row`, `Stack`, `Image`, `Gallery`, `Buttons`, `Navigation`, `List`, `Table`, `Details`, `Separator`, `Quote`, `Pullquote`, `Spacer`, and `Site Logo`.
- WordPress core has no complete native lead-form workflow. Treat form-like patterns as quote/contact panels with real `tel:` and `mailto:` actions unless another approved core-only contact path exists.
- Use theme/global styles and scoped custom CSS for fixed mobile action bars, side rails, responsive art direction, and repeated component polish.

Prefer `wp_global_styles` and `theme.json` tokens for the reusable design system: palette, gradients, fluid typography, spacing scale, shadows, radius, root padding, block defaults, link states, and button states. Use scoped custom CSS for what block supports cannot reliably express: fixed bars, side rails, advanced grids, object-fit crops, focus-visible polish, preset utility fallbacks, logo sizing, and Playground first-render reliability.

Do not depend on remote fonts, remote images, plugin blocks, maps, embeds, forms, external scripts, or networking. The Studio-ready Blueprint must stay self-contained.

## Blueprint-Safe WordPress Capabilities

| Capability | Use it for | Production route | CSS fallback / QA note |
| --- | --- | --- | --- |
| Playground/Studio Blueprint format | Portable one-file setup. | Keep `$schema`, explicit steps, embedded assets, `preferredVersions`, and `features.networking: false`. | Studio can ignore some Playground fields, so keep them harmless and self-contained. |
| `runPHP` setup | Content, media, front page, global styles, template fix. | Import base64 media with WordPress APIs, set logo/favicon, create the Home page and `front-page` template. | Validate no local `writeFile` dependencies in Studio-ready JSON. |
| `wp_global_styles` | Tokenized design system. | Store palette, gradients, type scale, spacing, shadows, block defaults, link/button states, and custom Site-O-Mattic tokens. | Clean theme JSON caches after updates. |
| `theme.json` block supports | Native block-level polish. | Use appearance tools, layout, spacing, border, typography, color, dimensions, shadow, and sticky support where supported. | Do not fake everything with classes when a block support exists. |
| Core custom CSS | Reliability and advanced layout. | Use `wp_update_custom_css_post()` for preset utility fallbacks, side rails, fixed bars, focus states, object-fit crops, anchor offsets, and logo sizing. | Keep selectors scoped to Site-O-Mattic classes and core blocks. |
| Core media blocks | Proof-first visual layouts. | Use `Cover`, `Image`, `Gallery`, and `Media & Text` for service evidence, not decorative filler. | Bound media height so the first CTA survives mobile. |
| Core semantic blocks | Premium clarity and trust. | Use `Details` for objections, `Table` for schedules/packages, `Quote`/`Pullquote` for trust, and `List` for receipts/checklists. | Add mobile table overflow checks and focus checks for `Details`. |
| Sticky/fixed action patterns | Better navigation and mobile conversion. | Use root `Group` sticky support where safe; use scoped CSS for fixed mobile action bars. | Require `scroll-margin-top`, safe-area padding, and footer overlap checks. |

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

## Conversion Pattern Atlas

These are generic conversion jobs, not niches:

| Pattern | Best when the visitor asks | Signature move | Strong blocks | Avoid |
| --- | --- | --- | --- | --- |
| `decision-filter` | "Is this right for me and nearby?" | Hero proof cue plus service-area confidence. | `Cover`, `Columns`, `Buttons`, proof `Group`. | Generic local claims without concrete towns/timing. |
| `quote-action-panel` | "Can I get an estimate quickly?" | High-contrast quote/call/photo board in or near hero. | `Columns`, `Group`, `Buttons`, `List`, optional `Table`. | Fake form fields that do not submit. |
| `proof-led-transformation` | "Can I see the result?" | Visual evidence before claims. | `Gallery`, `Media & Text`, `Image`, `Quote`. | Stock-feeling images or fake before/after claims. |
| `checklist-urgency-gate` | "Do I need this now?" | Self-diagnosis checklist plus risk/date proof. | `List`, `Details`, `Group`, `Buttons`. | Alarmist copy without practical next steps. |
| `date-window-reservation` | "Can I still get on the calendar?" | Reserve-date board with timing proof and clear prep instructions. | `Group`, `Buttons`, `Details`, `List`, optional `Table`. | Fake urgency or date pressure without a calm next step. |
| `scope-package-board` | "What is included and what fits me?" | Menu, table, ticket, or package board. | `Table`, `Columns`, `List`, `Separator`, `Buttons`. | Tiny package rows on mobile. |
| `route-schedule-board` | "When do you come to my area?" | Route/date/status board. | `Table`, `Group`, `Columns`, `List`. | External maps or vague "serving the area" language. |
| `consultation-story-flow` | "Can I trust this process?" | Calm what-to-expect sequence and proof quote. | `Media & Text`, `Quote`, `Details`, `List`. | Overly salesy CTAs that undercut trust. |
| `objection-led-close` | "What could go wrong?" | FAQ/details section as a conversion surface, not an afterthought. | `Details`, `Table`, `Buttons`, final `Group`. | Burying objections below an oversized footer. |

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
| `workshop-bench` | Workshop / Craft Bench, Receipt / Scope Summary, Process Reassurance Timeline. | Strong for craft and material-sensitive services; keep process closeups, care notes, and photo quote instructions concrete. |
| `water-test-board` | Route / Schedule Board, Proof Bar Under Hero, Receipt / Scope Summary. | Strong for recurring water-care services; keep water evidence visible in the hero and make chemistry/service notes concrete. |
| `zone-grid-planner` | Service Path Tiles, Service Area Confidence Strip, Process Reassurance Timeline. | Strong for organization and storage services; keep the image outcome visible and use zone language instead of generic decluttering claims. |
| `urgent-checklist` | Checklist / Urgency Gate, Proof Bar, FAQ / Objection Accordion. | Strong for seasonal services with date pressure; avoid reusing compact-header plus work-in-progress imagery too often. |
| `service-receipt-stack` | Receipt / Scope Summary, FAQ / Objection Accordion, Consultation Story Flow. | Strong for estimate anxiety and safety-sensitive services; use `Table`, `Details`, and receipt geometry to make scope feel concrete. |

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

## Style Family Atlas

Each generated site should select one family or a deliberate hybrid. This gives type, color, and surface decisions a repeatable vocabulary without forcing every page into the same look.

| Family | Type voice | Color / surface behavior | Image direction | Signature restraint |
| --- | --- | --- | --- | --- |
| `quiet-utility-grid` | System sans, compact hierarchy, 700-850 headings. | Neutral paper/field split, 1px lines, 2-6px radius, almost no shadows. | Clear work evidence, square or 4:3 crops. | Premium comes from useful density, not decoration. |
| `humanist-local-calm` | Humanist sans body/display, softer 1.55-1.65 line-height. | Warm paper, muted fields, one action color, soft tonal surfaces. | People, place, or finished outcome with negative space. | Keep friendly without getting cute. |
| `editorial-proof-stage` | Serif display plus humanist sans body. | Paper/ink palette, one art accent, mostly flat sections. | Large evidence-led hero or gallery. | Fewer cards; let the image do the proving. |
| `operator-console` | Condensed display, system body, mono labels. | Neutral/dark field, high-visibility action, rails, grids, 2-4px radius. | Gear, route, sorted outcome, status board. | Dense but not cramped; every panel must do work. |
| `material-workbench` | Sturdy display, humanist body, mono labels. | Material tones, tool accent, inset borders, modest media shadow. | Process closeups and material detail. | Tactile, not rustic-cliche. |
| `mobile-action-gloss` | System UI with heavy display and 850-900 action weight. | High contrast, one electric action color, secondary outline CTA. | Current, glossy, inspection-ready service moment. | Fixed bar gets the strongest shadow; everything else stays controlled. |
| `risk-control-alert` | Condensed/sturdy sans, tight labels. | Protective dark/neutral system, warning used only for risk/action/focus. | Visible risk or mitigation. | Rows beat cards; no exaggerated scare copy. |
| `receipt-ledger` | System body plus mono accent. | Paper/ink/muted-line system with stamped proof/action color. | Estimate confidence, scope, or service evidence. | Tables and receipts must stay readable on mobile. |
| `hospitality-menu-board` | Condensed display, humanist body, mono menu labels. | Warm dark/paper contrast, flavor accent as CTA/status. | Candid service moment with real scale. | Menu board can be expressive; packages must stay scannable. |
| `clear-status-dashboard` | Rounded/system display, mono accent. | Cool paper/field, status chips, proof rails, bright test/action color. | Measurable state or outcome in clean light. | Floating boards are allowed, but only one should dominate. |

Use role-based palettes, not recolors. Define how `ink`, `paper`, `field`, `line`, `primary`, `action`, `proof`, `muted`, `warning`, and `shadowTint` behave, then map those roles onto the current spec palette keys.

## Silhouette Atlas

Use the research taxonomy in [Lane 2 Visual Layout Taxonomy](./lane-2-visual-layout-taxonomy.md) as the working source for silhouettes. The enforced `pattern.silhouette` field currently supports:

| Silhouette | Signature move |
| --- | --- |
| `viewport-safe-conversion-shell` | First viewport guarantees brand, service promise, proof cue, CTA, and service media. |
| `editorial-proof-stage` | Evidence-led hero or gallery carries the first impression. |
| `split-quote-board` | Hero includes a high-contrast quote/action board. |
| `receipt-scope-stack` | Receipt cards, scope table, or ledger surfaces make estimates concrete. |
| `operator-console` | Dashboard-like route, status, checklist, or plan panels. |
| `side-rail-service-story` | Desktop side rail holds anchors, proof, and primary action. |
| `gallery-mosaic-proof` | Curated visual proof mosaic leads the page. |
| `checklist-urgency-gate` | Self-diagnosis checklist or warning board drives action. |
| `route-status-board` | Route, timing, or service-area status is the main proof. |
| `package-menu-board` | Package/tier/menu comparison becomes the signature surface. |
| `consultation-story-flow` | Calm guided process and trust proof lead to a soft consult. |
| `mobile-action-dock` | Mobile fixed action bar is the primary conversion surface. |
| `floating-proof-sidecar` | Sticky proof/contact sidecar supports the content column. |

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

| Primitive | Desktop behavior | Mobile behavior | Core-block translation | QA risks |
| --- | --- | --- | --- | --- |
| `compact-header` | Sticky top header with logo, short anchors, one CTA. | Logo plus compact nav or action button. | `Group`, `Site Logo`, `Navigation`, `Buttons`. | Logo scale, wrapped nav labels, anchor offset. |
| `split-nav-action-header` | Logo left, anchors center, action buttons right. | Actions move to fixed bottom bar or stacked hero buttons. | Header `Group` as grid/columns with `Navigation` and `Buttons`. | Crowded 390px header, duplicate CTA focus order. |
| `menu-utility-header` | Utility/menu header with package/date emphasis. | Compact logo plus date/package action. | `Group`, `Navigation`, `Buttons`, menu-ticket classes. | Menu labels can look decorative instead of actionable. |
| `desktop-side-rail` | Sticky/fixed side rail with logo, vertical anchors, primary CTA. | Side rail hidden, compact top header appears. | `Group`/`Columns`, `Site Logo`, `Navigation`, `Buttons`. | Main content offset, focus order, mobile collapse, z-index. |
| `split-side-top-hybrid` | Side label/rail cues plus a top action strip. | Collapses to normal top header. | `Group`, `Columns`, `Navigation`, `Buttons`. | Can feel like two nav systems if labels repeat. |
| `section-anchor-strip` | Thin in-page anchor strip after hero or under intro. | Horizontal scroll strip or omitted in favor of CTA bar. | `Navigation` or linked `List` in a `Group`. | Hidden targets, cramped labels, focus rings clipped. |
| `fixed-bottom-mobile-cta` | Hidden or reduced to normal desktop CTA. | One dominant action plus optional call/text action. | Mobile-only `Group`/`Row` with `Buttons`. | Footer coverage, safe-area padding, keyboard viewport shifts. |
| `floating-proof-action` | Sticky proof/contact sidecar beside copy or media. | Inline proof group or hidden secondary proof. | `Columns`, sticky `Group`, `Quote`/`List`, `Buttons`. | Overlap with media, confusing keyboard order, clipped focus. |
| `viewport-safe-hero-shell` | First viewport guarantees logo, H1, proof cue, CTA, and media. | Uses `svh`/`dvh` fallback and reduced media height. | `Cover`/`Group`, `Buttons`, constrained `Image`. | CTA below fold, browser chrome height changes. |

Highest-value primitives for the next silhouettes: `desktop-side-rail`, `section-anchor-strip`, `viewport-safe-hero-shell`, `floating-proof-action`, and receipt/scope stack compositions. Be cautious with another split nav/action hero immediately after the zone-grid and urgent-checklist patterns unless the hero and proof geometry change significantly.

## Scale QA Rubric

| Area | Fail when | Machine-check direction |
| --- | --- | --- |
| Visual clone detection | The new screenshot reads like one of the previous two before the brand name is read. | Compare signature fields, component-class Jaccard, palette fingerprint, screenshot layout boxes, and nearest-neighbor review notes. |
| First mobile viewport | At 360px, 390px, or 430px the logo, service H1, proof cue, primary CTA, or service media is missing. | Extend visual QA viewport matrix and record `h1Rect`, `ctaRect`, `logoRect`, media rect, and overflow. |
| Logo sizing | The wordmark is timid, cropped, too wide, or includes tagline text. | Keep desktop logo roughly 180px+ wide, mobile under about 62vw, and enforce no tagline in logo metadata/review. |
| Contrast | Token pairs pass but text over image, muted pills, or buttons fail in screenshots. | Add computed contrast checks plus screenshot sampling for image overlays. |
| Focus states | Keyboard focus is invisible, clipped, or hidden under fixed/sticky elements. | Add a Playwright tab walk and verify active element rect plus visible focus pixels. |
| Sticky/fixed overlap | Anchor headings hide under sticky headers or mobile bars cover footer/final CTA. | Measure sticky/fixed intersections after anchor clicks and footer scroll. Require `scroll-margin-top` and bottom padding. |
| Core block misuse | Non-core blocks, fake forms, remote assets, or navigation-as-action-dock appear. | Keep allowlist validation; action docks should use `Buttons`, not another `Navigation`. |
| Asset specificity | Hero image is generic, text-artifacted, or does not match `imageRole`. | Store prompt review, evidence nouns, forbidden artifact flags, and screenshot crop notes. |
| Review evidence | `approved` exists without measured or written rationale. | Add `review.json` fields for viewport metrics, logo metrics, focus walk, overlap findings, contrast failures, nearest visual neighbors, and blocking notes. |

## Production Implications

Before resuming full-scale blueprint generation:

- Pick a primary pattern family and one secondary support pattern for each remaining niche.
- Implement enough archetypes that 35 sites do not overuse the current silhouettes, especially top-horizontal-header variants.
- Reduce repeated `compact-header` use unless the actual navigation treatment and first-viewport silhouette are clearly different.
- Rotate image roles beyond `work-in-progress`; use finished outcome, local context, proof collage, operator/founder, and environment context when they are better evidence.
- Require at least one underused core block family in each new pattern when it genuinely improves the page: `Media & Text`, `Gallery`, `Table`, `Quote`, `Pullquote`, `Details`, or semantic `List`.
- Keep the spec-to-generated-signature sync gate active so stale generated Blueprints cannot pass pattern review.
- Compare `ctaRhythmPattern` from the spec in the variety report, not only the archetype CTA rhythm.
- Use the structured `silhouette`, `styleFamily`, `surfaceFamily`, `density`, `colorRoles`, `geometry`, and `coreBlockPlan` fields before full 35-site production.
- Move hardcoded CTA labels from archetype builders into specs before broad reuse.
- Split `src/build-blueprint.mjs` by archetype/shared components before the file becomes unsafe to review.
- Keep JSON schema, JS validation, polish reports, and variety reports aligned as pattern fields evolve.
- Add a compact variety summary before 35 sites create unreadably large pairwise output.
- Track use of underused core blocks such as `Details`, `Table`, `Gallery`, `Quote`, `Pullquote`, and `Media & Text` so production has real structural variety, not just different component class names.

## Source Trail

- WordPress core blocks: https://developer.wordpress.org/block-editor/reference-guides/core-blocks/
- WordPress theme.json reference: https://developer.wordpress.org/block-editor/reference-guides/theme-json-reference/theme-json-living/
- WordPress block supports: https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/
- WordPress Playground Blueprints: https://wordpress.github.io/wordpress-playground/blueprints/
- WordPress Playground Blueprint steps: https://wordpress.github.io/wordpress-playground/blueprints/steps/
- WordPress Studio Blueprints: https://developer.wordpress.com/docs/developer-tools/studio/blueprints/
- WordPress page jumps/anchors: https://wordpress.org/documentation/article/page-jumps/
- WordPress sticky block support: https://make.wordpress.org/core/2023/03/07/sticky-position-block-support/
- NN/g in-page links: https://www.nngroup.com/articles/in-page-links-content-navigation/
- NN/g table of contents and side rails: https://www.nngroup.com/articles/table-of-contents/
- NN/g mobile navigation patterns: https://www.nngroup.com/articles/mobile-navigation-patterns/
- NN/g type pairing: https://www.nngroup.com/articles/pairing-typefaces/
- NN/g photos as web content: https://www.nngroup.com/articles/photos-as-web-content/
- WCAG target size minimum: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- WCAG reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- WCAG contrast minimum: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- WCAG focus visible: https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html
- WCAG focus appearance: https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html
- Baymard button design: https://baymard.com/learn/button-design
- Modern Font Stacks: https://modernfontstacks.com/
- Atlassian spacing: https://atlassian.design/foundations/spacing
- Atlassian elevation: https://atlassian.design/foundations/elevation
- Atlassian borders: https://atlassian.design/foundations/border
- Atlassian radius: https://atlassian.design/foundations/radius
- Material color roles: https://m3.material.io/styles/color/roles
- Material typography: https://m3.material.io/styles/typography/applying-type
- Carbon typography: https://carbondesignsystem.com/elements/typography/overview/
