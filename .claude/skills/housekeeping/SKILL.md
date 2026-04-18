# Skill: housekeeping

Проверка актуальности проекта. Вызывается командой `/housekeeping`.

## Шаги выполнения

1. **CLAUDE.md** — прочитай файл и сравни с реальной структурой:
   - Все проекты из `playwright.config.ts` упомянуты?
   - Все команды актуальны?
   - Если расхождение — предложи конкретные правки

2. **rules/** — проверь что правила не устарели:
   - `testing.md` — соответствует ли текущим фикстурам и схемам?
   - `snapshots.md` — актуальны ли имена снапшотов?
   - Выведи список файлов и статус: актуален / требует проверки

3. **.gitignore** — проверь наличие нужных записей:
   ```
   node_modules/
   /playwright-report/
   /test-results/
   results.json
   .DS_Store
   .claude/settings.local.json
   .claude/skills
   ```
   Если чего-то нет — предложи добавить

4. **package.json** — проверь зависимости:
   - `@playwright/test` — актуальная версия? (последняя: сравни с `npm show @playwright/test version`)
   - `@axe-core/playwright` — установлен в devDependencies?
   - `zod` — установлен в dependencies?

5. **Снапшоты** — проверь `tests/visual/visual-regression.spec.ts-snapshots/`:
   - Есть ли `-darwin` версии? (локальные baseline)
   - Есть ли `-linux` версии? (CI baseline)
   - Если linux отсутствуют — напомни про "Update Visual Snapshots" workflow

6. **CI workflow** — прочитай `.github/workflows/playwright.yml`:
   - Все проекты из `playwright.config.ts` есть в CI?
   - Quality gate присутствует в каждом job?

## Итоговый отчёт:

```
=== Housekeeping ===
CLAUDE.md:      актуален / N расхождений
rules/:         актуальны / требует обновления: <файл>
.gitignore:     полный / отсутствует: <запись>
package.json:   зависимости OK / устарело: <пакет>
Снапшоты:       darwin ✓  linux ✓ / linux отсутствуют
CI workflow:    все jobs OK / отсутствует: <job>
```

## Правила

- Только анализируй и предлагай — не вноси изменения без явного запроса
- Если всё в порядке — скажи "всё актуально", не придумывай проблемы
