# Site-O-Mattic

Site-O-Mattic creates WordPress Studio / WordPress Playground Blueprints that turn the default WordPress theme into niche-specific one-page sites.

The repo currently includes Blueprints for GreenStripe Lawn Care and BrightJet Exterior Cleaning. Each one uses:

- the default WordPress theme when available, with Twenty Twenty-Five selected if present;
- only core blocks and WordPress settings;
- a generated hero image;
- a custom logo and favicon;
- a professional but fun one-page service-site voice.

## Build

```bash
npm run render-brand
npm run build
npm run quality
```

`npm run quality` runs Blueprint validation, the polish report, the production host build, and lint. The polish report checks the token stack, block-level styles, focus states, contrast pairs, anchors, component polish classes, and logo metadata.

For a local Playground visual smoke test, start the Playground CLI for a Blueprint and run:

```bash
npm run blueprint:visual -- http://127.0.0.1:<port>
```

The generated Blueprint files are written to:

```text
public/blueprints/lawn-care-service/
public/blueprints/pressure-washing-service/
```

Use each `public/blueprints/<slug>/blueprint.json` as the Studio-ready Blueprint file. It is self-contained, with the generated hero image, logo, and favicon embedded into the setup step. Once deployed, the Playground links point at `/api/blueprints/<slug>/blueprint.json`, which serves the same Blueprint with CORS headers.

## Lawn Care Playground

- Playground: <https://playground.wordpress.net/?blueprint-url=https%3A%2F%2Fraw.githubusercontent.com%2FRegionallyFamous%2FSite-O-Mattic%2Fmain%2Fpublic%2Fblueprints%2Flawn-care-service%2Fblueprint.json>
- Raw Blueprint JSON: <https://raw.githubusercontent.com/RegionallyFamous/Site-O-Mattic/main/public/blueprints/lawn-care-service/blueprint.json>

## Pressure Washing Playground

- Playground: <https://playground.wordpress.net/?blueprint-url=https%3A%2F%2Fraw.githubusercontent.com%2FRegionallyFamous%2FSite-O-Mattic%2Fmain%2Fpublic%2Fblueprints%2Fpressure-washing-service%2Fblueprint.json>
- Raw Blueprint JSON: <https://raw.githubusercontent.com/RegionallyFamous/Site-O-Mattic/main/public/blueprints/pressure-washing-service/blueprint.json>

## Structure

- `specs/`: editable source specs.
- `src/`: Blueprint builder and validator.
- `assets/`: Imagegen heroes, logo sources, favicon sources, rendered PNG assets, and prompt notes by niche.
- `public/blueprints/`: generated Blueprint directories and bundles served by the host site.
- `docs/niche-shortlist.md`: candidate niche backlog for future single-page Blueprints.

## Notes

The generated JSON is intentionally self-contained for Studio. The repo still keeps source assets beside the spec so each niche site can be rebuilt, audited, and packaged cleanly.
