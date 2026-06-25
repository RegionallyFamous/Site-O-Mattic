# PopArc Party Styling

Generated WordPress Studio / Playground Blueprint.

## Import

Use `public/blueprints/balloon-garland-party-backdrop/blueprint.json` as the Studio-ready Blueprint file. It is self-contained and embeds the hero image, logo, and favicon in the PHP setup step.

The ZIP includes the same root `blueprint.json`, an `asset-manifest.json`, plus asset files for inspection and Playground/CLI distribution.

## What It Builds

- Switches to `twentytwentyfive` when that default theme exists.
- Imports the embedded hero image, logo, and favicon into the Media Library.
- Sets the site logo and site icon.
- Creates a one-page balloon garland and party backdrop styling homepage using core blocks only.
- Creates a front-page block template so the default theme does not wrap the site with its stock header, title, or footer.
- Applies the site palette and typography through WordPress global styles/settings, with a core custom CSS fallback for first-load palette classes.
- Uses the `balloon-backdrop-gallery` layout archetype.
