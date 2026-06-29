# Lane 2 Visual Layout Taxonomy

Research scope: visual layout archetypes and style systems for premium one-page service sites. This document intentionally does not add niche ideas, specs, or Blueprints. It is a pattern taxonomy for future Site-O-Mattic design decisions that remain implementable with WordPress core blocks, `theme.json` / global styles, and scoped core custom CSS only.

## Source Synthesis

- One-page service sites need the first viewport to communicate purpose, trust, and action. NN/g's homepage guidance emphasizes clear purpose, engaging content, and prompting action, while its scrolling research shows that people still look more above the fold than below it.
- Long pages can work when they give strong information scent. NN/g's in-page-link research says anchor lists can help users skip to relevant sections and understand page structure, but only when the content is long enough and links are clearly identified as in-page navigation.
- The first viewport should avoid the "illusion of completeness": if a full-screen hero appears visually complete, users may not realize there is useful content below.
- Premium polish comes from hierarchy, not decoration. NN/g frames visual hierarchy as contrast, scale, and grouping. For Site-O-Mattic, that means one dominant action, one proof cue, one media role, and quiet supporting surfaces.
- Avoid generic CTAs. NN/g specifically warns that ambiguous "Get Started" actions can mislead service-site users who are trying to understand what the company offers.
- WordPress can support the needed grammar with core blocks such as `Cover`, `Group`, `Columns`, `Media & Text`, `Image`, `Gallery`, `Navigation`, `Buttons`, `Table`, `Details`, `Quote`, `Pullquote`, `Spacer`, and text-brand `Paragraph` blocks. The official core-block reference confirms these blocks and their supports.
- Use `theme.json` / global styles as the design-system layer: palette, gradients, font sizes, spacing, shadows, block defaults, layout widths, and per-block settings. WordPress documents `theme.json` as the canonical way to define editor settings and managed style output.
- Treat styles as tokens and roles. Carbon documents type tokens as calibrated size, weight, and leading choices; USWDS groups color into role-based theme tokens; Atlassian's elevation system separates default, bordered, raised, and overlay surfaces. This supports Site-O-Mattic's role-map approach: ink, paper, field, line, action, proof, muted, warning, and shadow tint.

## Core-Only Implementation Boundary

Use core blocks for structure:

- Hero and media: `Cover`, `Media & Text`, `Columns`, `Image`, `Gallery`.
- Navigation and actions: text-brand `Paragraph`, `Navigation`, `Buttons`, linked `Paragraph` / `List` when a nav block is too heavy.
- Proof and scope: `Group`, `Columns`, `Table`, `List`, `Quote`, `Pullquote`.
- Objections and late-stage clarity: `Details`, `Heading`, `Paragraph`, `Buttons`.
- Rhythm and spacing: full-width `Group` sections, layout constraints, `Spacer` only when needed.

Use `theme.json` / global styles for:

- Font families, font sizes, line heights, heading defaults, button defaults.
- Palette roles, gradients, shadows, border radii, spacing scale, content/wide widths.
- Block defaults for `core/group`, `core/columns`, `core/button`, `core/navigation`, `core/table`, `core/details`, `core/quote`, and `core/pullquote`.

Use scoped custom CSS only for:

- Fixed mobile action bars, side rails, sticky/floating proof panels, safe-area padding.
- `scroll-margin-top` for anchored sections.
- Object-fit crops, mobile-only visibility changes, focus-visible polish, and Playground first-render preset fallbacks.

Do not rely on plugin blocks, remote fonts, remote images, maps, external scripts, or unvalidated form submission flows. Quote/contact surfaces should use real `tel:` and `mailto:` actions unless the target WordPress runtime's native form behavior is explicitly verified.

## Silhouette Taxonomy

| Silhouette | Hero / media composition | Navigation primitive | Section rhythm | Typography voice | Color role map | Surface model | Core-block translation | Risks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Viewport-safe conversion shell | First viewport contains text brand, literal service promise, proof cue, action buttons, and real service media. Use a split `Cover` or `Columns` composition with the next section peeking below. | Compact sticky header or split nav/action header. | Hero, proof strip, scope, process, objections, final contact. Keep 6-8 sections. | Direct system or neo-grotesque sans; high-weight H1; calm body line-height. | Neutral paper/ink, muted field, one high-contrast action, proof as a secondary status color. | Mostly flat with one elevated proof or quote panel. | `Group`, `Cover`, `Columns`, `Image`, `Buttons`, `Navigation`. | Hero too tall, CTA below fold, image acts as decoration, sticky header hides anchors. |
| Editorial proof stage | Large outcome or process image carries the first impression; copy sits beside or over a controlled negative-space crop. | Minimal top header plus short section anchor strip after hero. | Visual proof, service scope, process, quote/proof, FAQ, final action. | Expressive display with humanist sans body, or serif display with restrained sans labels. | Paper/ink-led palette; action color used sparingly; image-derived muted field. | Flat editorial bands, unframed images, rare cards. | `Cover`, `Media & Text`, `Image`, `Gallery`, `Quote`, `Buttons`. | CTA can disappear under the image, text contrast over media, stock-like visuals, gallery bloat. |
| Split quote board | Text/media split with a high-contrast quote or call panel in the hero. Panel lists what to send, response expectation, and primary action. | Split nav/action header with one dominant quote/call action. | Hero board, trust chips, service rows, process, final instructions. | Confident sans with compact labels; optional mono labels for estimate details. | Paper/ink base, dark or tinted quote board, action reserved for the primary button, proof chips muted. | Single elevated board plus flat content rows. | `Columns`, `Group`, `List`, `Buttons`, `Separator`, optional `Table`. | Fake form affordances, too many CTA styles, quote panel crowding mobile, unclear action wording. |
| Receipt / scope stack | Hero or early section shows stacked receipt cards, scope list, or estimate ledger next to service evidence. | Compact top nav with anchors to scope, timing, questions. | Hero, included/not-included, timing table, process, `Details`, final contact. | System sans body with mono accent for labels, totals, timestamps, or scope metadata. | Paper, ink, line, muted, stamp/action, proof. Keep accent to stamps, buttons, and status. | Paper stack, outlined repeaters, low shadow, strong line system. | `Media & Text`, `Group`, `Table`, `List`, `Details`, `Buttons`. | Tables become tiny on mobile, receipt metaphor feels decorative, over-specific pricing, too much mono text. |
| Operator console | A dashboard-like hero pairs real service media with route, status, checklist, or plan panels. | Desktop side rail, split-side/top hybrid, or compact header plus status strip. | Console hero, operational proof, plan lanes, process board, final action. | Condensed or sturdy display, system body, mono labels for status. | Neutral or dark field, high-visibility action, proof/status color, warning only for real risk. | Grids, rails, boards, rows; 2-4px radius; almost no ornamental shadow. | `Group`, `Columns`, `Navigation`, `Buttons`, `Table`, `List`. | Overdense panels, side rail focus order, mobile collapse, contrast on dark fields. |
| Side-rail service story | Sticky desktop rail contains text brand, anchors, contact action, and one proof cue while the main content scrolls in strong bands. | Desktop side rail collapsing to compact top header on mobile. | Rail plus hero, proof, scope, process, objections, final contact. | Compact utility sans; strong section labels; body text stays readable and unfussy. | Rail can use dark/brand field; main content stays paper/ink; action remains consistent across rail and body. | Rail as the only persistent surface; main sections mostly flat. | `Group` shell, text-brand `Paragraph`, `Navigation`, `Buttons`, `Columns`, scoped CSS for rail. | Main content offset errors, rail consumes desktop width, duplicated mobile nav, z-index/focus issues. |
| Gallery mosaic proof | First impression is a curated mosaic or proof collage with a concise action area. Best for visually judged service quality. | Minimal top nav or post-hero anchor strip. | Mosaic hero, proof captions, offer/scope, process, testimonial quote, final action. | Editorial or warm humanist; avoid oversized display inside captions. | Image-led muted palette, neutral text, action color independent from image colors. | Unframed media grid with caption blocks, minimal cards. | `Gallery`, `Columns`, `Image`, `Group`, `Quote`, `Buttons`. | CTA below fold, uneven crops, slow/heavy images, insufficient service clarity before the gallery. |
| Checklist urgency gate | Hero uses a checklist, readiness board, or warning-sign panel to help visitors self-diagnose and act. | Utility header with primary action, or section anchor strip for checklist/proof/quote. | Hero checklist, risk/proof band, service steps, process, `Details`, final contact. | Sturdy sans, tight labels, readable body. | Protective neutral base, warning reserved for risk/status/action, proof color separate from warning. | Rows and panels over card grids; warning chips sparingly. | `Group`, `List`, `Columns`, `Details`, `Buttons`, `Separator`. | Alarmist tone, warning color overuse, checklist crowds mobile hero, false urgency. |
| Route / status board | Hero foregrounds timing, service area, route days, or status without external maps. Media supports local/operational proof. | Section anchor strip, split nav/action, or compact header with route/action cue. | Hero route board, service-area confidence, cadence/options, process, final route/action CTA. | Utility sans plus mono labels for days, zones, or status. | Paper/ink, field grid, proof/status color, action color, muted local notes. | Board/table surface with outlined cells and status chips. | `Group`, `Table`, `Columns`, `List`, `Buttons`. | Vague local claims, table overflow, false precision, too many place names in first viewport. |
| Package / menu board | Hero pairs a service photo with a readable package, menu, or tier board. | Menu-utility header with package/date/action anchors. | Hero menu, package cards/table, add-ons or options, process/proof, final action. | Condensed display for headings, humanist body, mono or small caps for menu labels. | Warm paper/dark contrast, action for date/check/quote, proof as subtle stamp or chip. | Ticket/menu board with tight spacing and clean dividers. | `Columns`, `Group`, `Table`, `List`, `Buttons`, `Separator`. | Package rows unreadable on mobile, menu styling becomes decorative, too many tiers, button hierarchy collapse. |
| Consultation story flow | Calm hero leads with trust and what to expect, then unfolds as a guided one-page conversation. | Quiet top header or labeled in-page anchor strip. | Hero, empathy/problem, what to expect, process, proof quote, objections, soft final consult/contact. | Warm humanist sans or restrained editorial display; generous line-height; smaller H1 than action-heavy sites. | Warm neutral paper, trust/proof accent, action kept visible but not loud. | Mostly flat with quote/pullquote moments and a single soft contact panel. | `Media & Text`, `Group`, `List`, `Quote`, `Pullquote`, `Details`, `Buttons`. | Too soft to convert, long prose, vague "get started" CTA, weak service specificity. |
| Mobile action dock | Desktop remains conventional, while mobile gets a fixed bottom call/quote/date action bar. Hero and sections are shortened for thumb-first conversion. | Desktop top header plus mobile fixed `Buttons` bar, not a second navigation block. | Hero, proof chips, service/package scope, process, final contact with bottom padding. | System UI voice, heavy action weight, compact mobile labels. | High-contrast action color only in dock and primary buttons; neutral paper/field elsewhere. | The dock is the main raised surface; ordinary cards remain flat or bordered. | `Group`, `Buttons`, `Columns`, `List`, scoped CSS for fixed bar and safe area. | Footer coverage, duplicate focus order, keyboard viewport shifts, too many actions in the dock. |
| Floating proof sidecar | Main hero/content column scrolls beside a sticky proof/contact sidecar on desktop; sidecar becomes inline on mobile. | Compact header plus sticky/floating proof-action panel. | Hero, sidecar proof/action, scope sections, process, objections, final contact. | Clear utility sans; sidecar labels can use mono or compact uppercase only in small doses. | Main content paper/ink, sidecar contrast field, action consistent, proof chips muted. | One floating raised sidecar; body content stays flat. | `Columns`, sticky `Group`, `Quote` or `List`, `Buttons`, `Details`. | Sticky overlap, sidecar too tall, hidden mobile proof, confusing keyboard order. |

## Style System Families

| Family | Typography voice | Color role map | Surface model | Best silhouette fit |
| --- | --- | --- | --- | --- |
| Quiet utility grid | System sans, compact hierarchy, 700-850 headings. | Base/primary neutrals, one action, proof as small status. | 1px lines, flat rows, 2-6px radius. | Viewport-safe shell, route/status board, receipt stack. |
| Humanist local calm | Humanist sans, readable body, friendly section heads. | Warm paper, muted field, clear action, trust accent. | Soft tonal panels, 6-8px radius, low shadow. | Consultation story, split quote board. |
| Editorial proof stage | Expressive display or serif display plus calm sans body. | Paper/ink with art accent and image-led muted fields. | Flat bands, large media, few cards. | Editorial proof stage, gallery mosaic. |
| Operator console | Condensed/sturdy display, mono labels, system body. | Neutral/dark field, high-vis action, proof/status, reserved warning. | Rails, boards, grid cells, 2-4px radius. | Operator console, side-rail story, checklist gate. |
| Receipt ledger | System body plus mono accent for scope and labels. | Paper, ink, line, muted, stamp/action. | Outlined repeaters, paper stack, restrained shadows. | Receipt/scope stack, split quote board. |
| Hospitality menu | Condensed display, humanist body, compact labels. | Warm dark/paper contrast, action as booking/check color. | Menu board, dividers, ticket panels. | Package/menu board. |
| Mobile action gloss | System UI, heavy button labels, tight mobile hierarchy. | Strong action, secondary outline, neutral content fields. | Raised dock only; body surfaces controlled. | Mobile action dock, viewport-safe shell. |

## Recommendations For Site-O-Mattic Lane 2

- Promote `silhouette` and `styleFamily` as separate decisions. A side rail can use operator-console styling or humanist-calm styling; do not conflate navigation with visual voice.
- For every future archetype, record: `silhouette`, `navigationPrimitive`, `heroMediaRole`, `sectionRhythm`, `styleFamily`, `colorRoles`, `surfaceModel`, and `knownRisks`.
- Rotate away from top-header sameness by using section anchor strips, desktop side rails, mobile fixed action bars, floating proof sidecars, and viewport-safe shells where appropriate.
- Use more semantic core blocks where they solve real layout jobs: `Table` for scope or timing, `Details` for objections, `Quote` / `Pullquote` for trust, `Gallery` for visual proof, and `Media & Text` for editorial/process flows.
- Keep the first mobile viewport measurable: text brand, H1/service promise, proof cue, primary CTA, and meaningful media should be visible at 360px, 390px, and 430px unless the silhouette intentionally trades one for a fixed mobile action dock.
- Treat color as roles, not recolors. Define ink, paper, field, line, primary, action, proof, muted, warning, and shadow tint before choosing hex values.
- Reserve elevation. Use borders and tonal fields for routine content, shadows only for the hero media, one proof/contact surface, or a mobile action dock.
- Avoid fake form language and ambiguous CTAs. Prefer action-specific text such as call, request quote, send photos, check date, plan consult, or join route.

## Source Trail

- NN/g, "Homepage Design: 5 Fundamental Principles": https://www.nngroup.com/articles/homepage-design-principles/
- NN/g, "Scrolling and Attention": https://www.nngroup.com/articles/scrolling-and-attention/
- NN/g, "Why Didn't People Scroll? The Illusion of Completeness": https://www.nngroup.com/videos/illusion-completeness/
- NN/g, "Do People Scroll? What Information Foraging Says": https://www.nngroup.com/videos/scrolling-information-foraging/
- NN/g, "In-Page Links for Content Navigation": https://www.nngroup.com/articles/in-page-links-content-navigation/
- NN/g, "In-Page Links: 3 Usability Tips": https://www.nngroup.com/videos/in-page-links/
- NN/g, "Visual Hierarchy in UX: Definition": https://www.nngroup.com/articles/visual-hierarchy-ux-definition/
- NN/g, '"Get Started" Stops Users': https://www.nngroup.com/articles/get-started/
- WordPress Developer Resources, "Core Blocks Reference": https://developer.wordpress.org/block-editor/reference-guides/core-blocks/
- WordPress Developer Resources, "Global Settings & Styles (theme.json)": https://developer.wordpress.org/block-editor/how-to-guides/themes/global-settings-and-styles/
- WordPress Developer Resources, "Supports": https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/
- WordPress.org Documentation, "Page Jumps": https://wordpress.org/documentation/article/page-jumps/
- Make WordPress Core, "Sticky position block support": https://make.wordpress.org/core/2023/03/07/sticky-position-block-support/
- WordPress Developer Blog, "Styling sections, nested elements, and more with Block Style Variations in WordPress 6.6": https://developer.wordpress.org/news/2024/06/styling-sections-nested-elements-and-more-with-block-style-variations-in-wordpress-6-6/
- Carbon Design System, "Typography": https://carbondesignsystem.com/elements/typography/overview/
- U.S. Web Design System, "Theme color tokens": https://designsystem.digital.gov/design-tokens/color/theme-tokens/
- Material Design 3, "Color roles": https://m3.material.io/styles/color/roles
- Atlassian Design System, "Elevation": https://atlassian.design/foundations/elevation
