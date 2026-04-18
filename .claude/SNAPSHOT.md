# SNAPSHOT.md

Состояние проекта между сессиями. Обновляется автоматически при `/finish`.

---

## Последняя сессия

**Дата:** 2026-04-18
**Ветка:** main
**Что сделано:**
- Настроен полный Claude Code workflow: CLAUDE.md, rules/, skills/, hooks
- Добавлены 5 skills: start, finish, testing, housekeeping + SNAPSHOT
- SessionStart и Stop hooks в settings.json
- Разрешения для Playwright/git/npm без промптов
- Репозиторий: https://github.com/balakorsky/playwright-claude-framework

**Статус тестов:** не запускались в этой сессии (работали над конфигурацией)

---

## Приоритеты

> Обновляй этот список в конце каждой сессии.

- [ ] Запустить полный тест-сьют и убедиться что все проекты проходят
- [ ] Запустить "Update Visual Snapshots" workflow на GitHub (Linux baseline)
- [ ] Настроить git user.name / user.email (сейчас коммиты идут от "Elena Serbina <elenaserbina@MacBookPro.lan>")

---

## Известные проблемы

- **Visual job в CI** — упадёт с "snapshot missing" пока не запущен "Update Visual Snapshots" workflow
- **git user config** — коммиты идут с предупреждением о неправильном имени/email, нужно `git config --global user.name` и `user.email`

---

## Архитектура (быстрый справочник)

| Что | Где |
|-----|-----|
| API тесты | `tests/api/` — reqres.in |
| UI тесты | `tests/auth/` — saucedemo.com |
| E2E сценарии | `tests/e2e/` — checkout flow |
| Visual regression | `tests/visual/` |
| Accessibility | `tests/a11y/` |
| Page objects | `pages/` |
| API клиенты | `api/clients/` |
| Zod схемы | `api/schemas/` |
| CI | `.github/workflows/playwright.yml` — 5 jobs |
