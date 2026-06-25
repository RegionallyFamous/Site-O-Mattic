# Visual Baselines

Published Site-O-Mattic Blueprints need approved desktop and mobile screenshots here.

Use:

```bash
SLUG=<slug> PLAYGROUND_URL=<url> npm run visual:baseline:capture
```

Then review:

- `qa/baselines/<slug>/desktop.png`
- `qa/baselines/<slug>/mobile.png`
- `qa/baselines/<slug>/review.json`

Only set `release.status` to `published` when screenshots are approved and `release.visualBaseline` is `approved`.
