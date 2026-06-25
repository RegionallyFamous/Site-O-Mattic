# Site-O-Mattic

Site-O-Mattic creates WordPress Studio / WordPress Playground Blueprints that turn the default WordPress theme into niche-specific one-page sites.

The repo currently includes 35 single-page service-business Blueprints. Each one uses:

- the default WordPress theme when available, with Twenty Twenty-Five selected if present;
- only core blocks and WordPress settings;
- a generated hero image;
- a custom logo and favicon;
- a professional but fun one-page service-site voice.

## Build

```bash
npm run render-brand
npm run blueprint:build
npm run quality
npm run build
```

`npm run quality` runs spec validation, Blueprint validation, the polish report, accessibility checks, layout variety, typography guardrails, production guardrails, asset QA, copy realism, premium review, the visual baseline gate, the production host build, and lint. The polish report checks the token stack, block-level styles, focus states, contrast pairs, anchors, component polish classes, layout signatures, and logo metadata. The variety and premium reports compare Blueprints so different niches cannot quietly reuse the same hero structure, service presentation, proof treatment, CTA rhythm, navigation, typography, palette behavior, and component class mix.

For a local Playground visual smoke test, start the Playground CLI for a Blueprint and run:

```bash
npm run blueprint:visual -- http://127.0.0.1:<port>
```

The visual smoke test checks desktop and mobile first viewports for readable logo sizing, visible CTAs, missing default theme wrappers, and horizontal overflow.

For a full local screenshot sweep across specs:

```bash
VISUAL_SWEEP_DIR=qa/reports/visual-sweep npm run visual:sweep
npm run visual:compare -- --input qa/reports/visual-sweep/report.json --out qa/reports/visual-sweep/dashboard
```

If the Playground CLI hits a local Node/native-module mismatch, run the sweep through Node 22:

```bash
VISUAL_SWEEP_DIR=qa/reports/visual-sweep PLAYGROUND_CLI_USE_NPM_EXEC=1 npx -y -p node@22 -p npm@10 npm run visual:sweep
```

For public Playground smoke tests after pushing a commit:

```bash
SITE_O_MATTIC_REF=<commit-sha-or-branch> npm run playground:smoke
```

Pass specific `specs/*.json` paths to smoke test a representative batch.

For published releases, capture approved desktop/mobile baselines:

```bash
SLUG=<slug> PLAYGROUND_URL=<url> npm run visual:baseline:capture
```

The generated Blueprint files are written to `public/blueprints/<slug>/`.

Use each `public/blueprints/<slug>/blueprint.json` as the Studio-ready Blueprint file. It is self-contained, with the generated hero image, logo, and favicon embedded into the setup step. Once deployed, the Playground links point at `/api/blueprints/<slug>/blueprint.json`, which serves the same Blueprint with CORS headers.

The host app catalog and API routes are generated from `specs/*.json`, so new production blueprints should not require hand-editing the homepage or route files.

## Lawn Care Playground

- Playground: <https://playground.wordpress.net/?blueprint-url=https%3A%2F%2Fraw.githubusercontent.com%2FRegionallyFamous%2FSite-O-Mattic%2Fmain%2Fpublic%2Fblueprints%2Flawn-care-service%2Fblueprint.json>
- Raw Blueprint JSON: <https://raw.githubusercontent.com/RegionallyFamous/Site-O-Mattic/main/public/blueprints/lawn-care-service/blueprint.json>

## Pressure Washing Playground

- Playground: <https://playground.wordpress.net/?blueprint-url=https%3A%2F%2Fraw.githubusercontent.com%2FRegionallyFamous%2FSite-O-Mattic%2Fmain%2Fpublic%2Fblueprints%2Fpressure-washing-service%2Fblueprint.json>
- Raw Blueprint JSON: <https://raw.githubusercontent.com/RegionallyFamous/Site-O-Mattic/main/public/blueprints/pressure-washing-service/blueprint.json>

## Window Cleaning Playground

- Playground: <https://playground.wordpress.net/?blueprint-url=https%3A%2F%2Fraw.githubusercontent.com%2FRegionallyFamous%2FSite-O-Mattic%2Fmain%2Fpublic%2Fblueprints%2Fwindow-cleaning%2Fblueprint.json>
- Raw Blueprint JSON: <https://raw.githubusercontent.com/RegionallyFamous/Site-O-Mattic/main/public/blueprints/window-cleaning/blueprint.json>

## Gutter Cleaning Playground

- Playground: <https://playground.wordpress.net/?blueprint-url=https%3A%2F%2Fraw.githubusercontent.com%2FRegionallyFamous%2FSite-O-Mattic%2Fmain%2Fpublic%2Fblueprints%2Fgutter-cleaning%2Fblueprint.json>
- Raw Blueprint JSON: <https://raw.githubusercontent.com/RegionallyFamous/Site-O-Mattic/main/public/blueprints/gutter-cleaning/blueprint.json>

## Pollinator Garden Playground

- Playground: <https://playground.wordpress.net/?blueprint-url=https%3A%2F%2Fraw.githubusercontent.com%2FRegionallyFamous%2FSite-O-Mattic%2Fmain%2Fpublic%2Fblueprints%2Fpollinator-garden-refresh%2Fblueprint.json>
- Raw Blueprint JSON: <https://raw.githubusercontent.com/RegionallyFamous/Site-O-Mattic/main/public/blueprints/pollinator-garden-refresh/blueprint.json>

## Driveway Sealcoating Playground

- Playground: <https://playground.wordpress.net/?blueprint-url=https%3A%2F%2Fraw.githubusercontent.com%2FRegionallyFamous%2FSite-O-Mattic%2Fmain%2Fpublic%2Fblueprints%2Fdriveway-sealcoating%2Fblueprint.json>
- Raw Blueprint JSON: <https://raw.githubusercontent.com/RegionallyFamous/Site-O-Mattic/main/public/blueprints/driveway-sealcoating/blueprint.json>

## Carpet And Upholstery Cleaning Playground

- Playground: <https://playground.wordpress.net/?blueprint-url=https%3A%2F%2Fraw.githubusercontent.com%2FRegionallyFamous%2FSite-O-Mattic%2Fmain%2Fpublic%2Fblueprints%2Fcarpet-upholstery-cleaning%2Fblueprint.json>
- Raw Blueprint JSON: <https://raw.githubusercontent.com/RegionallyFamous/Site-O-Mattic/main/public/blueprints/carpet-upholstery-cleaning/blueprint.json>

## Structure

- `specs/`: editable source specs.
- `schemas/`: spec contract for production inputs.
- `config/production-guardrails.json`: asset, Blueprint, and bundle budgets.
- `src/`: Blueprint builder and validator.
- `assets/`: Imagegen heroes, logo sources, favicon sources, rendered PNG assets, and prompt notes by niche.
- `public/blueprints/`: generated Blueprint directories and bundles served by the host site.
- `qa/baselines/`: approved desktop/mobile screenshots for published Blueprints.
- `qa/reports/`: lightweight release review dashboards; raw visual sweep and public smoke screenshots are local by default.
- `docs/layout-archetypes.md`: implemented and planned one-page layout archetypes.
- `docs/production-readiness.md`: release states and production checklist.
- `docs/niche-shortlist.md`: candidate niche backlog for future single-page Blueprints.

## Notes

The generated JSON is intentionally self-contained for Studio. The repo still keeps source assets beside the spec so each niche site can be rebuilt, audited, and packaged cleanly.
