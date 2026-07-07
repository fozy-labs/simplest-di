# Changelog

Все значимые изменения проекта документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
проект придерживается [Semantic Versioning](https://semver.org/lang/ru/).


## [0.5.3] - 2026-07-07

### Добавлено

- Из публичного API экспортированы классы ошибок `UnboundContractError`, `ContractAlreadyResolvedError` и типы `DefinedContract`, `ContractProvider` — теперь доступны `instanceof`-проверки контрактных ошибок и типизация контрактов.

### Исправлено

- Смена `keyName` в `useScope`/`<DiScopeProvider>` теперь корректно уничтожает старый scope. Раньше отложенный `dispose` ошибочно отменялся (как StrictMode-replay), из-за чего старый scope навсегда оставался в `parent.children`, а его cleanup-и `onScopeInit` и `destroyed$` не срабатывали.
- SCOPED-сервис с `onScopeInit`, который лениво внедряется во время инициализации scope (из `onScopeInit` другого сервиса), теперь корректно получает свои `onScopeInit` и cleanup. Раньше `Scope.init()` ставил флаг `isInitialized` уже после эмиссии `init$`, поэтому такой сервис не получал ни текущий tick (подписка вне снапшота), ни прямой вызов по `isInitialized` — оба хука молча пропускались.
- Сообщение `NonCompatibleParentError` указывало лайфтайм зависимости, взятый от родителя (`Cannot inject SINGLETON (X) …`), хотя `X` — SCOPED. Теперь выводится корректный лайфтайм самой зависимости (`Cannot inject SCOPED (X) …`).

### Документация

- Исправлен пример `onScopeInit` в `concepts.md`: инстанс доступен как `this`, а не как аргумент — прежний вариант `(instance) => …` падал с `TypeError`.
- Исправлен пример tagged scope в `react-integration.md`: адресная регистрация по тегу вынесена в компонент под провайдером — из `Page` свежесозданный scope ещё не в контексте, и вызов бросал «No active scope found».
- `unstable_createScopesStore().acquire()`: провал `provide` при создании scope больше не оставляет полусозданный scope подвешенным в `parent.children` — он уничтожается (`dispose`) с пробросом ошибки. Плюс `acquire` больше не возвращает scope, уничтоженный напрямую (в обход `store.dispose`) — вместо мёртвого экземпляра создаётся свежий.
- `package.json`: условие `types` в `exports` перемещено перед `import`. Раньше типы разрешались лишь случайно — через sibling-lookup `.d.ts` рядом с `.js`.

## [0.5.2] - 2026-07-07

### Исправлено

- Кэш значений из фабрики/контракта надёжен для любого результата, включая `0`, `""`, `false`, `null`, `undefined`. Раньше такие значения пересоздавались при каждом `inject`, а SCOPED с `requireProvide` ошибочно бросал `MustBeProvidedError` даже после `provide`.
- Ошибка при внедрении (провал конструктора или scope без нужных lifecycle-коллбэков) больше не оставляет контейнер «грязным»: не остаётся частично созданного экземпляра и висячих подписок, а повторная попытка пересоздаёт зависимость без ложной `CircularDependencyError`.
- SCOPED-зависимость без хуков (`onScopeInit`) работает и в минимальном (ручном) scope — коллбэки уничтожения ему больше не требуются.

### Изменено

- **Потенциально ломающее:** `@injectable` не наследуется недекорированным подклассом — у подкласса должен быть собственный `@injectable`, иначе `inject()` бросает ошибку. Раньше подкласс молча разрешался с lifetime, токеном и экземпляром родителя.
- `getInjectorName(false)` без родителя возвращает `null` (раньше — `undefined`); безымянный родитель показывается читаемой меткой вместо `[object Object]`.

## [0.5.1] - 2026-06-29

### Исправлено

- Корректная сборка релиза: артефакт `0.5.0` в npm содержал стейл-`dist` без `createScopesStore` (опубликован вручную без `npm run build`). `0.5.1` публикует правильную сборку тех же изменений — используйте `0.5.1+`.

## [0.5.0] - 2026-06-29

### Добавлено

- `unstable_createScopesStore()` — императивное хранилище `Scope`-ов, адресуемых по строковому ключу. См. раздел [«Хранилище скоупов»](./concepts.md)
- `Scope` отслеживает дочерние скоупы (`children`) и имеет геттер `isDisposed`

### Изменено

- `Scope.dispose()` каскадно уничтожает дочерние скоупы (снизу вверх — дети раньше родителя) и стал идемпотентным; конструктор регистрирует скоуп в `parent.children`. Важно: `children` — сильные ссылки (родитель удерживает детей до их `dispose`), поэтому уничтожайте скоупы явно — раньше осиротевший дочерний скоуп собирался GC сам


## [0.4.0] - 2026-17-05

### Добавлено

- `inject.createTag()` для создания уникальных тегов контейнеров (scope)
- Поддержка `inject.provide(token, tag)` для адресной регистрации в ближайшем tagged-scope
- Поддержка `tags` в `useScope({ ... })` и `<DiScopeProvider tags={...}>`


## [0.3.0] - 2026-04-26

### Добавлено

- Хук `useScope({ keyName?, provide? })` для React: создаёт scoped `Scope` в текущем компоненте и владеет его жизненным циклом (`init`/`dispose` через `useSafeMount`)
- Опциональный prop `scope` у `DiScopeProvider`: позволяет передать заранее созданный через `useScope` scope. Провайдер пробрасывает его в React-контекст и не управляет жизненным циклом
- При одновременной передаче `scope` и `provide` опция `provide` выполняется в переданный scope
- Паттерн "parent-side inject": `inject.provide(Token, scope)` в render-фазе родителя плюс `<DiScopeProvider scope={scope}>` для детей


## [0.2.4] - 2026-04-23

### Исправлено

- Scoped-зависимости, перечисленные в `DiScopeProvider provide`, теперь корректно разрешают вложенные scoped-инъекции в том же scope


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

[Unreleased]: https://github.com/fozy-labs/simplest-di/compare/v0.5.3...HEAD
[0.5.3]: https://github.com/fozy-labs/simplest-di/compare/v0.5.2...v0.5.3
[0.5.2]: https://github.com/fozy-labs/simplest-di/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/fozy-labs/simplest-di/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/fozy-labs/simplest-di/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/fozy-labs/simplest-di/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/fozy-labs/simplest-di/compare/v0.2.4...v0.3.0
[0.2.4]: https://github.com/fozy-labs/simplest-di/compare/v0.2.2...v0.2.4
[0.2.2]: https://github.com/fozy-labs/simplest-di/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/fozy-labs/simplest-di/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/fozy-labs/simplest-di/releases/tag/v0.2.0

