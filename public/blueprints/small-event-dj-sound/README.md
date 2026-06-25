# SoundNest Events

Generated WordPress Studio / Playground Blueprint.

## Import

Use `public/blueprints/small-event-dj-sound/blueprint.json` as the Studio-ready Blueprint file. It is self-contained and embeds the hero image, logo, and favicon in the PHP setup step.

The ZIP includes the same root `blueprint.json`, an `asset-manifest.json`, plus asset files for inspection and Playground/CLI distribution.

## What It Builds

- Switches to `twentytwentyfive` when that default theme exists.
- Imports the embedded hero image, logo, and favicon into the Media Library.
- Sets the site logo and site icon.
- Creates a one-page small-event DJ and sound service homepage using core blocks only.
- Creates a front-page block template so the default theme does not wrap the site with its stock header, title, or footer.
- Applies the site palette and typography through WordPress global styles/settings, with a core custom CSS fallback for first-load palette classes.
- Uses the `soundcheck-console` layout archetype.
