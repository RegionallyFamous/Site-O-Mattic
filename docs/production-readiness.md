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

## Release Lane

Use this lane for production batches:

1. **Generate or refresh specs**: choose the pattern recipe, generate assets, then run `node src/production-polish-fields.mjs --write`.
2. **Store the premium snapshot**: run `node src/premium-review-report.mjs --write` after build-relevant copy, assets, layout, or release-checklist changes.
3. **Build and gate**: run `npm run blueprint:build && npm run quality`.
4. **Run screenshot comparison**: run `VISUAL_SWEEP_DIR=qa/reports/visual-sweep npm run visual:sweep`, then `npm run visual:compare -- --input qa/reports/visual-sweep/report.json --out qa/reports/visual-sweep/dashboard`. If local Node is too new for the Playground CLI native dependency, use `VISUAL_SWEEP_DIR=qa/reports/visual-sweep PLAYGROUND_CLI_USE_NPM_EXEC=1 npx -y -p node@22 -p npm@10 npm run visual:sweep`.
5. **Human taste pass**: review the contact sheet/dashboard and ask whether each site feels trustworthy, premium, niche-specific, readable on mobile, and meaningfully different from nearby patterns.
6. **Commit and push**: commit the accepted state, push it, then use the pushed commit SHA for public Playground smoke tests.
7. **Public smoke**: run `SITE_O_MATTIC_REF=<commit-sha> npm run playground:smoke` for all specs, or pass a representative batch of `specs/*.json` paths first when checking deployment health.
8. **Publish only after baselines**: capture approved baselines with `SLUG=<slug> PLAYGROUND_URL=<url> npm run visual:baseline:capture`, set `reviewed` to `true`, set `release.visualBaseline` to `approved`, and then move the spec to `published`.

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
- Typography guardrails for readable, non-novelty type systems.
- Asset, Blueprint size, ZIP size, prompt-note, manifest, premium-review, and release-state guardrails.
- Asset QA for hero evidence, logo scale, favicon shape, embedded assets, and logo no-tagline discipline.
- Copy realism for concrete visitor instructions, service-area specificity, action CTAs, real process steps, and no fake review claims.
- Premium review verification for first viewport, logo scale, typography, image proof, CTA clarity, mobile polish, layout distinctness, copy specificity, asset QA, and brand brief.
- Visual baseline gate for published specs.
- Production host build and lint.

## Reports Policy

Track lightweight review artifacts that describe a release decision:

- `qa/reports/README.md`
- `qa/reports/visual-comparison-dashboard.html`
- `qa/reports/visual-comparison-dashboard.json`

Do not track raw screenshot sweep or public smoke folders by default:

- `qa/reports/visual-sweep/`
- `qa/reports/public-smoke/`

Promote only approved screenshots to `qa/baselines/<slug>/` when a spec moves to `published`.

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

## Human Taste Pass

Automation catches regressions; it does not replace judgment. Before approving a batch, inspect screenshots and answer yes to these:

- Would a visitor trust this business enough to call or email?
- Is the first viewport specific to the niche before reading body copy?
- Is the logo readable and appropriately scaled?
- Is the CTA visible without hunting on desktop and mobile?
- Does the page avoid feeling like the previous five sites with new colors?
- Is the typography composed, readable, and appropriate to the service?
- Does the hero image prove a service moment or outcome instead of acting like generic decor?
- Is there one memorable layout move that fits the niche?

## Pattern Gate

Before a new spec is approved, record the intended pattern family in the layout archetype decision:

- primary conversion job, such as quote panel, package/menu board, gallery proof, side rail, route/schedule, receipt stack, or consultation flow.
- secondary support pattern, such as proof bar, service-area strip, FAQ accordion, process timeline, or mobile action bar.
- one signature move visible in screenshots.
- image direction and CTA rhythm.
