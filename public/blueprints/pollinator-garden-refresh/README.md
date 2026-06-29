# BloomRoute Garden Studio

Generated WordPress Studio / Playground Blueprint.

## Import

Use `public/blueprints/pollinator-garden-refresh/blueprint.json` as the Studio-ready Blueprint file. It is self-contained and embeds the hero image and favicon in the PHP setup step.

The ZIP includes the same root `blueprint.json`, an `asset-manifest.json`, plus asset files for inspection and Playground/CLI distribution.

## What It Builds

- Switches to `twentytwentyfive` when that default theme exists.
- Imports the embedded hero image and favicon into the Media Library.
- Sets the site icon and uses text branding in the header.
- Creates a one-page pollinator garden refresh service homepage using core blocks only.
- Creates a front-page block template so the default theme does not wrap the site with its stock header, title, or footer.
- Applies the site palette and typography through WordPress global styles/settings, with a core custom CSS fallback for first-load palette classes.
- Uses the `pollinator-season-board` layout archetype.
