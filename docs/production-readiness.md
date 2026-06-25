# Production Readiness

Use this checklist before scaling Site-O-Mattic beyond hand-built Blueprints.

Before creating additional niche specs, choose patterns from [Pattern And Style Catalog](./pattern-style-catalog.md). Production should scale from conversion-job patterns, not by cloning the last niche with new copy and colors.

## Release States

| State | Meaning | Gates |
| --- | --- | --- |
| `draft` | Work in progress. Can build locally. | Spec shape and assets should be valid, but human review can be incomplete. |
| `approved` | Ready to share as a Playground preview. | Human polish checklist must be all true; full `npm run quality` must pass. |
| `published` | Final catalog/release state. | Everything in `approved`, plus approved desktop/mobile visual baselines. |

The release state lives in each `specs/*.json` file under `release`.

## Quality Command

Run this before sharing links:

```bash
npm run blueprint:build
npm run quality
```

`npm run quality` includes:

- Spec validation against the production contract.
- Blueprint validation for core blocks, front-page ownership, embedded media, global styles, and cache clearing.
- Polish report for token quality, focus states, contrast, anchors, component classes, layout signatures, and logo metadata.
- Accessibility report for headings, safe links, CTA text, media metadata, duplicate IDs, and navigation labels.
- Layout variety comparison across current Blueprints.
- Asset, Blueprint size, ZIP size, prompt-note, manifest, premium-review, and release-state guardrails.
- Visual baseline gate for published specs.
- Production host build and lint.

## Visual Baselines

Approved previews can have `visualBaseline: "pending"`. Published specs must have:

```text
qa/baselines/<slug>/desktop.png
qa/baselines/<slug>/mobile.png
qa/baselines/<slug>/review.json
```

Capture baselines from a local or public Playground URL:

```bash
SLUG=<slug> PLAYGROUND_URL=<url> npm run visual:baseline:capture
```

After human review, set `reviewed` to `true` in `review.json` and set `release.visualBaseline` to `approved` in the spec.

## Budgets

Budgets live in `config/production-guardrails.json`.

- Hero images should be inspectable but not huge.
- Logo PNGs should be large enough for crisp scaling.
- Favicons should be square simplified marks.
- Blueprint JSON and ZIP output are capped so base64 media does not quietly balloon.

## Premium Review

Every approved or published spec must mark the full human review checklist true, including:

- first viewport clarity, logo readability, CTA clarity, copy specificity, and image artifact checks.
- art-directed hero imagery with a specific service moment or outcome.
- distinct hierarchy, type, color, and spacing compared with recent Blueprints.
- one memorable signature layout move beyond generic service cards.
- restrained composition without awkward overlaps or decorative clutter.
- screenshot comparison against recent desktop and mobile previews.

## Pattern Gate

Before a new spec is approved, record the intended pattern family in the layout archetype decision:

- primary conversion job, such as quote panel, package/menu board, gallery proof, side rail, route/schedule, receipt stack, or consultation flow.
- secondary support pattern, such as proof bar, service-area strip, FAQ accordion, process timeline, or mobile action bar.
- one signature move visible in screenshots.
- image direction and CTA rhythm.
