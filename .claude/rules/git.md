# Git Rules

## Commit message format

Use the imperative form with a short prefix describing the type of change:

```
Add visual regression tests for inventory page
Fix URL resolution — trailing slash missing in baseURL
Update visual baselines after header redesign
Refactor CheckoutPage to use data-test selectors
```

Prefix words: `Add`, `Fix`, `Update`, `Refactor`, `Remove`, `Extract`, `Rename`.
Keep the subject line under 72 characters.

## Never commit these files

- `results.json` — Playwright JSON report output (already in `.gitignore`)
- `.claude/settings.local.json` — local Claude Code config (already in `.gitignore`)
- `playwright-report/` — HTML report output (already in `.gitignore`)
- `test-results/` — raw test artifacts (already in `.gitignore`)

## Visual snapshot commits

When committing new or updated snapshots, use a dedicated commit:

```
Add visual regression baselines (macOS/chromium)
Update visual baselines after login page redesign
```

Do not mix snapshot PNG files with code changes in the same commit.

## Push policy

Always pull before push if the remote may have new commits (e.g., after triggering the
"Update Visual Snapshots" CI workflow — it commits Linux baselines back to the branch).

```bash
git pull --rebase origin main
git push
```

## Branch strategy

- `main` — stable, CI must pass before merging
- Feature branches: `feat/description`, e.g. `feat/add-cart-tests`
- Fix branches: `fix/description`, e.g. `fix/visual-baseline-linux`
