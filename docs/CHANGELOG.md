# Changelog

Все значимые изменения проекта документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
проект придерживается [Semantic Versioning](https://semver.org/lang/ru/).

## [0.2.2] - 2026-03-24

### Исправлено

- Неверные импорты в собранном проекте (из-за `tsc-alias`)

## [0.2.1] - 2026-03-22

### Добавлено

- `inject.define<T>(name)` для объявления контрактов и выбора реализации через `bind()` без отдельного named export из корневого пакета
- Поддержка object-shaped provider при `bind()`, если реализацию удобнее задавать через `getInstance()`

### Изменено

- Документация по DI-концепциям и README теперь явно описывает object identity контракта, обязательный `bind()` до первого разрешения и раннюю ошибку для unbound contract
- React-документация уточняет, что scoped-контракты продолжают работать через `setupReactDi()` и `DiScopeProvider`, без нового React-specific API
- Unit-тесты ядра и React перенесены в `src/core/__tests__/` и `src/react/__tests__/`, а интеграционные проверки дополнены root-export и React scoped-contract regression coverage

## [0.2.0] - 2026-03-20

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
