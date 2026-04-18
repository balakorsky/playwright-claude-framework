# Visual Snapshot Rules

## Never update snapshots without an explicit request

Do not run `--update-snapshots` unless the user explicitly says "update snapshots" or "обнови снапшоты".
A failing visual test means a real UI change was detected — investigate before overwriting.

## visual_user snapshot is intentional

`inventory-visual-user-visual-darwin.png` and `inventory-visual-user-visual-linux.png` document
SauceDemo's known broken state for `visual_user` (shuffled images, wrong prices).

Do NOT update these snapshots to "fix" a failing visual test for `visual_user`.
If this test fails, it means `visual_user`'s bugs changed — report it, don't silently overwrite.

## Platform-specific filenames

Snapshots include the OS in the filename:
- `-darwin` = macOS (local dev)
- `-linux` = Ubuntu (CI / GitHub Actions)

When adding a new `toHaveScreenshot()` call:
1. Run locally first: `npx playwright test --project=visual --update-snapshots`  → creates `-darwin` baseline
2. Trigger the **"Update Visual Snapshots"** GitHub Actions workflow → creates `-linux` baseline
3. Commit both sets of PNG files

If only macOS baseline exists, the CI visual job will fail with "snapshot missing" — that is expected until step 2 is done.

## Snapshot update workflow (Linux/CI baseline)

```
GitHub → Actions → Update Visual Snapshots → Run workflow → branch: main
```

The workflow runs on ubuntu, regenerates all visual snapshots, and commits them back automatically.
Run it after every intentional UI change that affects screenshots.
