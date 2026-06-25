# QA Reports

Track lightweight release-review artifacts here, such as the visual comparison dashboard HTML and JSON.

Raw screenshot sweeps and public smoke screenshots are local working artifacts and are ignored by default:

```bash
VISUAL_SWEEP_DIR=qa/reports/visual-sweep npm run visual:sweep
npm run visual:compare -- --input qa/reports/visual-sweep/report.json --out qa/reports/visual-sweep/dashboard
SITE_O_MATTIC_REF=<commit-sha> npm run playground:smoke
```

If the local Playground CLI fails under the installed Node version, use:

```bash
VISUAL_SWEEP_DIR=qa/reports/visual-sweep PLAYGROUND_CLI_USE_NPM_EXEC=1 npx -y -p node@22 -p npm@10 npm run visual:sweep
```

Promote only approved desktop/mobile screenshots to `qa/baselines/<slug>/` when a Blueprint is ready for `release.status: "published"`.
