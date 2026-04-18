# CI Rules

## Job map

| Job | Playwright project | Browser | Trigger |
|-----|--------------------|---------|---------|
| `api` | `api` | none | push / PR |
| `ui` | `chromium`, `firefox`, `webkit` | matrix | push / PR |
| `e2e` | `e2e` | chromium | push / PR |
| `visual` | `visual` | chromium | push / PR |
| `a11y` | `a11y` | chromium | push / PR |
| Update Visual Snapshots | `visual` | chromium | manual only |

## Quality gate — do not lower the threshold

Every job runs `node scripts/quality-gate.mjs results.json 0.8` after tests.
The threshold is **80%** — do not reduce it without a deliberate decision.
If tests are consistently failing, fix the tests — do not adjust the gate downward.

## Visual job will fail without Linux baselines

The `visual` CI job compares screenshots against Linux (`-linux`) baselines.
If they don't exist yet, the job fails with "snapshot missing" — this is expected.

Fix: trigger the **"Update Visual Snapshots"** workflow manually:
```
GitHub → Actions → Update Visual Snapshots → Run workflow
```

This must be done once after:
- Adding new `toHaveScreenshot()` calls
- Any intentional UI change that affects existing snapshots

## Do not add `--update-snapshots` to the regular visual CI job

The regular `visual` job must compare, not regenerate.
Snapshot regeneration only belongs in the dedicated `update-snapshots.yml` workflow.

## Artifacts

Each job uploads its HTML report to GitHub Actions artifacts (retained 14 days).
Artifact names: `report-api`, `report-ui-chromium`, `report-ui-firefox`, `report-ui-webkit`,
`report-e2e`, `report-visual`, `report-a11y`.
