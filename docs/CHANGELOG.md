# Changelog

Все значимые изменения проекта документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
проект придерживается [Semantic Versioning](https://semver.org/lang/ru/).

## [Unreleased]

Первый релиз. Извлечено из монорепозитория fozy (`@/shared/di/`).

### Добавлено

- Ядро DI-системы: `inject`, `injectable`, `Scope` — три режима жизненного цикла (SINGLETON, TRANSIENT, SCOPED)
- Иерархия скоупов с parent-child цепочкой и `WeakMap`-хранилищем
- `inject.provide()` — явная регистрация зависимостей в скоупе
- `resetRegistry()` — очистка синглтон-реестра для изоляции тестов
- React-интеграция: `setupReactDi()`, `DiScopeProvider`
- Экспорт классов ошибок: `CircularDependencyError`, `NonCompatibleParentError`, `MustBeProvidedError`
- `getInjectorName()` — утилита для отладки
- Полная типизация (TypeScript ≥ 5.0, Stage 3 декораторы)
- Документация: README, концепции DI, React-интеграция, миграция

### Исправлено

- Переименование `INJECTING_INSTANSE` → `INJECTING_INSTANCE` (опечатка)
- `setupReactDi()`: проверка версии React `>= 18` → `>= 19`

### Удалено

- Зависимость от `@fozy/client-tools`
