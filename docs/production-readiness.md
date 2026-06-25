# Production Readiness

Use this checklist before scaling Site-O-Mattic beyond hand-built Blueprints.

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
- Asset, Blueprint size, ZIP size, prompt-note, manifest, and release-state guardrails.
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
