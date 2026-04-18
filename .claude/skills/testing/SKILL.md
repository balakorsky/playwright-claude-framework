# Skill: testing

Запуск тестов с выбором проекта, тега или файла. Вызывается командой `/testing`.

## Использование

Пользователь может вызвать skill с аргументом или без:

- `/testing` — интерактивно спросить что запустить
- `/testing smoke` — запустить все @smoke тесты
- `/testing api` — запустить весь api проект
- `/testing visual` — запустить visual regression
- `/testing e2e` — запустить e2e сценарии
- `/testing a11y` — запустить accessibility checks
- `/testing all` — запустить все проекты последовательно

## Шаги выполнения

### Если аргумент не передан — спроси:
```
Что запустить?
  1. smoke — быстрые @smoke тесты (api + chromium)
  2. api — все API тесты
  3. ui — UI тесты (chromium/firefox/webkit)
  4. e2e — бизнес-сценарии
  5. visual — visual regression
  6. a11y — accessibility
  7. all — всё подряд
```

### Команды по вариантам:

**smoke:**
```bash
npx playwright test --grep "@smoke" --project=api
npx playwright test --grep "@smoke" --project=chromium
```

**api:**
```bash
npx playwright test --project=api
```

**ui:**
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

**e2e:**
```bash
npx playwright test --project=e2e
```

**visual:**
```bash
npx playwright test --project=visual
```

**a11y:**
```bash
npx playwright test --project=a11y
```

**all:**
```bash
npx playwright test --project=api
npx playwright test --project=chromium
npx playwright test --project=e2e
npx playwright test --project=visual
npx playwright test --project=a11y
```

## После запуска — выведи сводку:

```
=== Результаты тестов ===
Проект: <название>
Прошло:  N
Упало:   N
Пропущено: N
Время: Xs

<если упали — перечисли названия упавших тестов>
```

## Правила

- Не запускай `--update-snapshots` — это отдельная операция
- Если visual тесты упали из-за "snapshot missing" — объясни что нужен Linux-baseline (см. `rules/snapshots.md`)
- Если quality gate упал (<80%) — не предлагай снижать порог, предлагай починить тесты
