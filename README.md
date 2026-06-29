# Site-O-Mattic

Site-O-Mattic creates WordPress Studio / WordPress Playground Blueprints that turn the default WordPress theme into niche-specific one-page sites.

The repo currently includes 35 single-page service-business Blueprints. Each one uses:

- the default WordPress theme when available, with Twenty Twenty-Five selected if present;
- core blocks and WordPress settings first, with generated CSS reserved for shared polish, accessibility, and responsive edge-case fixes;
- a generated hero image;
- a generated favicon and a core text brand in the header;
- a professional but fun one-page service-site voice.

## Build

```bash
npm run blueprint:build
npm run quality
npm run build
```

`npm run quality` runs spec validation, Blueprint validation, the polish report, accessibility checks, layout variety, typography guardrails, production guardrails, asset QA, copy realism, premium review, the visual baseline gate, the production host build, and lint. The polish report checks the token stack, block-level styles, focus states, contrast pairs, anchors, component polish classes, layout signatures, and text-brand discipline. The variety and premium reports compare Blueprints so different niches cannot quietly reuse the same hero structure, service presentation, proof treatment, CTA rhythm, navigation, typography, palette behavior, and component class mix.

Use `npm run quality:catalog` for a full local release lane. It rebuilds the catalog, checks repeated-build determinism for generated Blueprint files and ZIPs, runs the static quality suite, refreshes the local screenshot sweep, and writes the visual comparison dashboard.

For a local Playground visual smoke test, start the Playground CLI for a Blueprint and run:

```bash
npm run blueprint:visual -- http://127.0.0.1:<port>
```

The visual smoke test checks desktop and mobile first viewports for readable text branding, visible CTAs, missing default theme wrappers, and horizontal overflow.

For a full local screenshot sweep across specs:

```bash
npm run quality:release
```

The visual sweep launches the Playground CLI child process with an installed Node 22 binary when one is available through `.nvmrc`/NVM or Homebrew. To override detection, set `VISUAL_SWEEP_NODE_BIN_DIR=/path/to/node22/bin`; to disable it, set `VISUAL_SWEEP_DISABLE_NODE22_SHIM=1`.

For public Playground smoke tests after pushing a commit, use a commit SHA or branch ref:

```bash
SITE_O_MATTIC_REF=<commit-sha-or-branch> npm run quality:public
```

To smoke a deployed app/API route instead of raw GitHub files:

```bash
PUBLIC_BLUEPRINT_BASE=https://<deployed-origin>/api/blueprints npm run quality:public
```

When `PUBLIC_BLUEPRINT_BASE` is set, public smoke asserts the API JSON schema, CORS headers, content type, cache header, `OPTIONS` response, and homepage catalog links. Set `PUBLIC_SITE_ORIGIN=https://<deployed-origin>` if the API base is not enough to infer the homepage origin. Pass specific `specs/*.json` paths to smoke test a representative batch.

For published releases, capture approved desktop/mobile baselines:

```bash
SLUG=<slug> PLAYGROUND_URL=<url> npm run visual:baseline:capture
```

The generated Blueprint files are written to `public/blueprints/<slug>/`.

Use each `public/blueprints/<slug>/blueprint.json` as the Studio-ready Blueprint file. It is self-contained, with the generated hero image and favicon embedded into the setup step. The visible business name renders as core text, not a packaged logo asset. Once deployed, the Playground links point at `/api/blueprints/<slug>/blueprint.json`, which serves the same Blueprint with CORS headers.

The host app catalog and API routes are generated from `specs/*.json`, so new production blueprints should not require hand-editing the homepage or route files.

## Catalog Links

The deployed homepage is the source for Playground links because it builds each URL from `/api/blueprints/<slug>/blueprint.json`. For commit-specific raw smoke tests, generate Playground URLs from the matching pushed ref rather than copying raw `main` links into the README.

For a static GitHub Pages catalog with preview images, Playground links, raw Blueprint JSON, ZIP downloads, and spec links, run:

```bash
npm run pages:catalog
```

This writes `docs/index.html` and `docs/.nojekyll`. Configure GitHub Pages to publish from the `docs/` folder on the branch you push.

## Structure

- `specs/`: editable source specs.
- `schemas/`: spec contract for production inputs.
- `config/production-guardrails.json`: asset, Blueprint, and bundle budgets.
- `src/`: Blueprint builder and validator.
- `assets/`: Imagegen heroes, favicon sources, rendered PNG assets, and prompt notes by niche.
- `public/blueprints/`: generated Blueprint directories and bundles served by the host site.
- `qa/baselines/`: approved desktop/mobile screenshots for published Blueprints.
- `qa/reports/`: lightweight release review dashboards; raw visual sweep and public smoke screenshots are local by default.
- `docs/layout-archetypes.md`: implemented and planned one-page layout archetypes.
- `docs/production-readiness.md`: release states and production checklist.
- `docs/taste-layer-backlog.md`: taste review lanes, current gates, and block-first design debt.
- `docs/niche-shortlist.md`: candidate niche backlog for future single-page Blueprints.

## Notes

The generated JSON is intentionally self-contained for Studio. The repo still keeps source assets beside the spec so each niche site can be rebuilt, audited, and packaged cleanly.
