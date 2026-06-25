# Layout Archetypes

Site-O-Mattic layouts are named production patterns. Every generated Blueprint embeds a non-rendered layout signature so the quality scripts can compare Blueprints structurally.

Each archetype also carries a design voice. The generator records a `typographyTreatment` and `colorStrategy` in the layout signature, writes matching local/system font stacks into `wp_global_styles`, and compares actual palette fingerprints in the variety report. Fonts must stay self-contained: no external font URLs.

Use [Pattern And Style Catalog](./pattern-style-catalog.md) before implementing or assigning additional archetypes. It defines the conversion-job patterns, navigation rules, style dimensions, and production implications that should shape the next full-scale batch.

## Implemented

| Variant | Best for | Navigation | Hero | Service presentation | Proof treatment | CTA rhythm |
| --- | --- | --- | --- | --- | --- | --- |
| `route-plan` | Lawn care, pool cleaning, plant care, knife sharpening, mobile bicycle repair | Top horizontal header | Full-bleed cover with left copy | Three equal service cards | Large stat cards | Hero buttons plus centered final quote card |
| `before-after-quote` | Pressure washing, driveway sealing, carpet cleaning, junk removal, furniture refinishing | Top header with early photo-quote anchor | Split editorial copy and hero photo | Numbered surface rows | Compact proof grid inside final CTA | Early photo quote strip plus final proof CTA |
| `checklist-urgency` | Window cleaning, vacation rental turnover, holiday lights, move prep | Top header with checklist anchors | Stacked hero with checklist panel | Checklist cards plus service-area panel | Compact proof strip before services | Hero buttons plus midpage urgency band |
| `risk-prevention` | Gutter cleaning, roof moss removal, dryer vent cleaning, chimney sweeping | Top header with risk anchors | Roofline photo left with risk copy panel | Warning-sign rows with home-risk panel | Prevention badges before the plan | Hero phone CTA plus seasonal risk band |
| `gallery-led` | Pollinator gardens, photography, murals, florals, balloon styling, dessert tables, color consulting | Top header with gallery anchors | Editorial image header with overlapping copy | Visual style cards with caption panel | Testimonial-style proof strip before gallery | Hero consult button plus final style brief |
| `surface-seasonal` | Driveway sealcoating, deck staining, fence staining, asphalt repair | Top header with seasonal anchors | Dark copy-left hero with wide service-action photo | Prep and scope cards with a season note | Seasonal readiness badges under hero | Hero estimate buttons plus final photo quote |
| `stain-care` | Carpet cleaning, upholstery cleaning, area rugs, mattress cleaning | Top header with fabric-care anchors | Soft home hero with fabric service photo | Stain and fabric care cards with a care note | Trust proof badges after the hero | Hero estimate buttons plus final fabric quote |
| `side-rail-service` | Junk removal, garage organization, closet organization, senior downsizing, smart home setup | Desktop side rail, mobile top header | Side rail with haul-away action hero and haul ticket | Accepted-items grid with donation route note | Donation sorting proof strip after hero | Persistent rail photo CTA plus final haul plan |
| `package-menu-board` | Coffee carts, mocktail carts, photo booths, DJs, pizza/taco catering | Menu-board top nav with package/event/date anchors | Split hero with live service photo and menu ticket | Package cards styled like a readable event menu | Host detail proof strip under hero | Hero date check, package selection, final date CTA |
| `fixed-bottom-action` | Mobile detailing, photo booths, DJs, holiday lights, coffee carts, mocktail carts | Desktop top header plus mobile fixed bottom CTA bar | Split detail hero with live service photo and kit ticket | Package cards with sticky mobile action | Compact proof strip under hero | Desktop hero quote plus mobile fixed quote/call bar |

## Cataloged For Scale

| Variant | Best for | Navigation | Production direction |
| --- | --- | --- | --- |
| `package-comparison` | Mobile detailing, photo booths, DJs, coffee carts, catering | Menu-style top header with date-check anchor | Event fit, package columns, add-ons, date-check CTAs, package selection |
| `side-rail-estimate` | Smart home setup, senior downsizing, color consulting, furniture refinishing | Desktop fixed left rail with phone CTA | Full-height right-side hero image, trust cues, consult steps, services, and final soft CTA |
| `bottom-dock-booking` | Mobile auto detailing, mobile bike repair, knife sharpening, pool cleaning | Mobile fixed bottom dock | App-like service dashboard, packages, route/service area, process, reviews, and quote |
| `split-proof-transform` | Junk removal, garage organization, carpet cleaning, deck staining | Minimal top logo plus send-photo button | Before/after transformation story, what gets fixed, process, proof, and photo-submit CTA |
| `portfolio-first-mosaic` | Pet photography, headshots, murals, florals, dessert tables | Simple top gallery nav | Mosaic hero, style/package sections, process, testimonial, and inquiry |
| `route-led-schedule` | Lawn care, plant care, pool cleaning, knife sharpening, bike repair | Horizontal route header | Route days, service-area panel, plans, service menu, proof, and join-the-route CTA |
| `urgent-checklist` | Gutter cleaning, holiday lights, vacation rental turnover, solar panel cleaning | Utility header with urgent CTA | Problem checklist, warning signs, packages, safety proof, area, and quote |
| `story-card-consult` | Senior downsizing, color consulting, organization, micro-wedding florals | Calm top header | Warm editorial flow with next steps, support cards, packages, proof, and gentle consult CTA |
| `service-receipt-stack` | Window cleaning, carpet cleaning, detailing, vacation turnover | Compact top nav plus phone button | Receipt-style scope summary, included services, add-ons, process, proof, and build-my-estimate CTA |
| `workshop-bench` | Furniture refinishing, knife sharpening, bike repair, mural/window lettering | Side/top hybrid with craft labels | Craft image, materials/process chips, timeline, gallery/proof, care notes, and send-a-photo CTA |
| `consultation-led` | Smart home setup, senior downsizing, organization, micro-wedding florals, color consulting | Calm top header with consult anchor | Trust, what to expect, consult steps, supportive language, low-friction first call |

Only implemented variants should be used in `specs/*.json`; the spec validator enforces this. Cataloged variants are the roadmap for adding more layout variety. New implemented variants should set a distinct `navigationTreatment` so the variety report can catch repeated top-header compositions before scale.

## Design Voice Guardrails

- Use body, display, and accent font stacks, not one global font for everything.
- Vary heading weight, action weight, line height, and fluid type scale by archetype.
- Treat color as a strategy: decide what the accent does, which surfaces are quiet, and where contrast should spike.
- Keep semantic palette keys stable in specs so the builder works, but make the actual hex palette niche-specific.
- Let `npm run blueprint:variety` fail when typography treatment, color strategy, or palette are too similar to recent Blueprints.
- Add one memorable, niche-appropriate signature move to each archetype so screenshots read as different products before the business name is read.
- Select archetypes by conversion job first, then niche. A service can reuse a category only when its hero, proof, navigation, CTA rhythm, and style voice remain structurally distinct.
