# Site-O-Mattic

Site-O-Mattic creates WordPress Studio / WordPress Playground Blueprints that turn the default WordPress theme into niche-specific one-page sites.

The first Blueprint is a lawn care service called GreenStripe Lawn Care. It uses:

- the default WordPress theme when available, with Twenty Twenty-Five selected if present;
- only core blocks and WordPress settings;
- a generated hero image;
- a custom logo and favicon;
- a professional but fun one-page service-site voice.

## Build

```bash
npm run render-brand
npm run build
npm run validate
```

The generated Blueprint files are written to:

```text
public/blueprints/lawn-care-service/
```

Use `public/blueprints/lawn-care-service/blueprint.json` as the Studio-ready Blueprint file. It is self-contained, with the generated hero image, logo, and favicon embedded into the setup step. Once deployed, the Playground link points at `/api/blueprints/lawn-care-service/blueprint.json`, which serves the same Blueprint with CORS headers.

## Lawn Care Playground

- Playground: <https://playground.wordpress.net/?blueprint-url=https%3A%2F%2Fraw.githubusercontent.com%2FRegionallyFamous%2FSite-O-Mattic%2Fmain%2Fpublic%2Fblueprints%2Flawn-care-service%2Fblueprint.json>
- Raw Blueprint JSON: <https://raw.githubusercontent.com/RegionallyFamous/Site-O-Mattic/main/public/blueprints/lawn-care-service/blueprint.json>

## Structure

- `specs/`: editable source specs.
- `src/`: Blueprint builder and validator.
- `assets/lawn-care/`: Imagegen hero, logo source, favicon source, rendered PNG assets, and prompt notes.
- `public/blueprints/`: generated Blueprint directories and bundles served by the host site.
- `docs/niche-shortlist.md`: candidate niche backlog for future single-page Blueprints.

## Notes

The generated JSON is intentionally self-contained for Studio. The repo still keeps source assets beside the spec so each niche site can be rebuilt, audited, and packaged cleanly.
