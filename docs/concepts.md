# Концепции DI

## Обзор

`@fozy-labs/simplest-di` — лёгкая система внедрения зависимостей (Dependency Injection), основанная на TC39 Stage 3 декораторах. Сервисы помечаются декоратором `@injectable()`, а разрешение зависимостей происходит через функцию `inject()`. Для interface-shaped зависимостей можно создать отдельный контракт через `inject.define()` и затем резолвить его тем же `inject()`.

## Жизненные циклы (Lifetimes)

Каждый сервис имеет один из трёх жизненных циклов:

### SINGLETON

Один экземпляр на всё приложение. Кэшируется в модульном реестре (`Map`).

```typescript
import { injectable, inject } from '@fozy-labs/simplest-di';

@injectable('SINGLETON')
class ApiClient {
    fetch(url: string) { /* ... */ }
}

const client1 = inject(ApiClient);
const client2 = inject(ApiClient);
// client1 === client2 → true
```

### TRANSIENT

Новый экземпляр при каждом вызове `inject()`. Никогда не кэшируется.

```typescript
@injectable('TRANSIENT')
class RequestHandler {
    readonly id = Math.random();
}

const h1 = inject(RequestHandler);
const h2 = inject(RequestHandler);
// h1 !== h2 → true
```

### SCOPED

Один экземпляр на `Scope`. Кэшируется в `WeakMap` скоупа. При поиске поднимается по цепочке родительских скоупов.

```typescript
import { injectable, inject, Scope } from '@fozy-labs/simplest-di';

@injectable({ lifetime: 'SCOPED', requireProvide: false })
class UserSession {
    user: string | null = null;
}

const root = new Scope(null, 'root');
const child = new Scope(root, 'child');

inject.provide(UserSession, root);
const rootSession = inject(UserSession, root);

// Дочерний скоуп наследует от родительского
const childSession = inject(UserSession, child);
// childSession === rootSession → true
```

## Декоратор `@injectable()`

Помечает класс как DI-сервис с метаданными о жизненном цикле. Используются TC39 Stage 3 декораторы (не `experimentalDecorators`).

### Краткая форма

```typescript
@injectable('SINGLETON')
class Logger {}

@injectable() // По умолчанию — SINGLETON
class Config {}
```

### Полная форма

```typescript
@injectable({
    lifetime: 'SCOPED',
    requireProvide: true,
    onScopeInit(this: WebSocketConnection) {
        // Инстанс доступен как `this`, а не как аргумент.
        this.start();
        return () => this.stop(); // cleanup при dispose скоупа
    },
})
class WebSocketConnection {
    start() { /* ... */ }
    stop() { /* ... */ }
}
```

**Параметры `InjectableDetailedOptions`:**

| Параметр | Тип | Описание |
|---|---|---|
| `lifetime` | `InjectionLifetime` | Обязательный. Режим жизненного цикла |
| `requireProvide` | `boolean` | Требовать явного `inject.provide()`. По умолчанию `true` для SCOPED |
| `onScopeInit` | `(this: Instance) => void \| (() => void)` | Callback при инициализации скоупа. Инстанс доступен как `this` (не как аргумент). Может вернуть cleanup-функцию |

## Контракты через `inject.define()`

Когда зависимость описана интерфейсом, а не конкретным классом, можно заранее объявить контракт и затем привязать к нему реализацию:

```typescript
import { inject, injectable } from '@fozy-labs/simplest-di';

interface ChatDataSource {
    fetchChatMessages(): Promise<string[]>;
}

@injectable('SINGLETON')
class CloudChatDataSource implements ChatDataSource {
    fetchChatMessages() {
        return Promise.resolve(['cloud']);
    }
}

const ChatDataSource = inject.define<ChatDataSource>('ChatDataSource');
ChatDataSource.bind(CloudChatDataSource);

const dataSource = inject(ChatDataSource);
```

Ключевые правила:

- Идентичность контракта задаёт объект, возвращённый `inject.define()`, а не строковое имя. Два вызова `inject.define('ChatDataSource')` создают два разных токена.
- `bind()` можно вызывать повторно только до первого разрешения. После первого `inject(contract)` повторная привязка запрещена.
- Если вызвать `inject(contract)` до `bind()`, будет выброшена `UnboundContractError`.
- `bind()` принимает либо класс с `@injectable()`, либо object-shaped provider с полями `lifetime`, `name` и `getInstance`.
- Обычная constructor-based инъекция остаётся без изменений: `inject(SomeClass)` продолжает работать как раньше.

Пример object-shaped provider:

```typescript
const MockChatDataSource = inject.define<ChatDataSource>('MockChatDataSource');

MockChatDataSource.bind({
    lifetime: 'TRANSIENT',
    name: 'MockChatDataSourceImpl',
    getInstance: () => ({
        fetchChatMessages: () => Promise.resolve(['mock']),
    }),
});
```

## Скоупы (Scopes)

### Иерархия parent-child

Скоупы образуют дерево. При вызове `scope.getInstance(token)` сначала проверяется текущий скоуп, затем поднимается по цепочке `parent`:

```
GrandchildScope → ChildScope → RootScope → null
```

Дочерний скоуп может «перекрыть» (shadow) зависимость родителя, если явно предоставить её через `inject.provide()`.

### WeakMap-хранилище

Каждый скоуп хранит экземпляры в `WeakMap<object, instance>`. Это позволяет использовать как классы, так и объектные контрактные токены, и при этом не мешает GC собирать экземпляры после уничтожения скоупа.

### Каскадное уничтожение (`dispose`)

Скоуп знает своих детей: конструктор `new Scope(parent, …)` регистрирует скоуп в `parent.children`. Поэтому `scope.dispose()` каскадит — сначала уничтожает дочерние скоупы (рекурсивно, снизу вверх), затем сам:

```typescript
const root = new Scope(null, 'root');
const child = new Scope(root, 'child');
const grandchild = new Scope(child, 'grandchild');

root.dispose();
// порядок destroyed$: grandchild → child → root
// у каждого срабатывают onScopeInit-cleanup'ы его SCOPED-сервисов
```

`dispose` идемпотентен (повторный вызов — no-op, `isDisposed` становится `true`), а при уничтожении ребёнка снимает его из `parent.children`.

> **Владение и GC.** `children` — сильные ссылки: родитель удерживает детей до их `dispose`. Это плата за каскад — уничтожайте скоупы явно (в React это делает `useScope` на unmount; для императивных сценариев — `unstable_createScopesStore`). Раньше осиротевший дочерний скоуп собирался GC сам; теперь его держит родитель, пока тот жив.

## `requireProvide`

Когда `requireProvide: true` (по умолчанию для SCOPED), сервис **необходимо** явно зарегистрировать через `inject.provide()` перед использованием. Иначе выбрасывается `MustBeProvidedError`.

```typescript
@injectable({ lifetime: 'SCOPED', requireProvide: true })
class AuthService {}

const scope = new Scope(null, 'app');

// Ошибка: MustBeProvidedError
inject(AuthService, scope);

// Правильно:
inject.provide(AuthService, scope);
const auth = inject(AuthService, scope); // OK
```

Для scoped-контрактов правило немного отличается: если контракт уже привязан через `contract.bind(Impl)`, это само по себе считается регистрацией. Отдельный `inject.provide(contract, scope)` не нужен, но активный `Scope` всё равно обязателен.

## Теги скоупов (Scope Tags)

Для точной регистрации scoped-зависимости в конкретном контейнере можно использовать теги.

```typescript
import { inject, Scope } from '@fozy-labs/simplest-di';

const PRIVATE = inject.createTag();

const root = new Scope(null, 'root');
const privateScope = new Scope(root, 'private', [PRIVATE]);
const nested = new Scope(privateScope, 'nested');

nested.runInScope(() => {
    // Регистрирует зависимость не в nested, а в ближайшем scope с тегом PRIVATE
    inject.provide(UserSession, PRIVATE);
});
```

Правила:

- `inject.createTag()` создаёт уникальный тег.
- `inject.provide(token, tag)` ищет ближайший текущему контексту scope, у которого есть этот тег.
- Если tagged-scope не найден, будет выброшена ошибка отсутствующего active scope.
- При обычном `inject.provide(token, scope)` поведение остаётся прежним.

## `onScopeInit` — жизненный цикл скоупа

Callback `onScopeInit` вызывается при инициализации скоупа (`scope.init()`). Если callback возвращает функцию, она будет вызвана при уничтожении скоупа (`scope.dispose()`).

Скоуп имеет два rxjs-Subject:
- `init$` — срабатывает при `scope.init()`, затем `complete()`
- `destroyed$` — срабатывает при `scope.dispose()`, затем `complete()`

## Хранилище скоупов — `unstable_createScopesStore`

> ⚠️ **Нестабильный API (`@experimental`).** 

`Scope` инициализируется и уничтожается вручную (`init`/`dispose`). В React за это отвечает `useScope` (`DiScopeProvider`),
    привязывая жизнь скоупа к mount/unmount компонента.
Но иногда жизненным циклом управляет не React, 
    а внешний источник событий — например **code-based-роутер**. 
Тогда нужно:

- создать скоуп **до** рендера дерева (чтобы загрузчики роута успели зарегистрировать в него зависимости через `inject.provide`);
- переиспользовать **один и тот же** скоуп между множеством вызовов (хук загрузки срабатывает на каждую навигацию, а скоуп зоны должен быть один);
- иногда — **пережить** уход со страницы (keep-alive) и умереть лишь при выходе из родительской зоны.

`useScope` этого не умеет: React-unmount всегда означает `dispose`. Здесь помогает `unstable_createScopesStore` — императивное хранилище скоупов, адресуемых по строковому ключу. Ключ играет роль «внешней памяти»: по нему скоуп переиспользуется между вызовами и переживает размонтирование дерева.


### API

| Метод | Описание |
|---|---|
| `acquire(key, options?)` | Взять-или-создать скоуп по ключу. Повторный вызов с тем же ключом возвращает тот же экземпляр (`options` игнорируются). При создании сам ставит `init$`/`destroyed$` и проводит `provide`. |
| `get(key)` | Существующий скоуп или `null`, без создания. |
| `has(key)` / `keys()` | Наличие ключа / список живых ключей. |
| `init(key)` | Вызывает `Scope.init()`. Идемпотентно. Бросает, если ключа нет. |
| `dispose(key)` | Уничтожает скоуп: каскад выполняет ядро `Scope` (дети раньше родителя), стор убирает из индекса сам скоуп и его потомков. Идемпотентно. |
| `disposeAll()` | Уничтожает все скоупы стора. |

Опции `acquire`: `parent` (`Scope`, либо ключ другого скоупа стора, либо дефолт из `unstable_createScopesStore({ parent })`), `name` (по умолчанию — сам `key`), `tags`, `provide`.

### Пример: зона роута + keep-alive страниц

```typescript
import { unstable_createScopesStore, Scope } from '@fozy-labs/simplest-di';

const rootScope = new Scope(null, 'app');
const scopes = unstable_createScopesStore({ parent: rootScope });

// Схематично, на примере роутера с хуками beforeLoad / onEnter / onLeave.

// Зона: создаётся на входе, живёт сквозь навигацию внутри, умирает на выходе.
beforeLoad: () => ({ scope: scopes.acquire('zone') })
onEnter:    () => scopes.init('zone')
onLeave:    () => scopes.dispose('zone')   // каскад снесёт и все keep-alive страницы ниже

// Страница с keep-alive: ребёнок зоны, переживает уход.
loader:  ({ params }) => { scopes.acquire(`page:${params.id}`, { parent: 'zone' }) }
onEnter: ({ params }) => scopes.init(`page:${params.id}`)
// onLeave страницы — пусто: скоуп остаётся живым до выхода из зоны
```

### Каскадный `dispose`

Каскад выполняет ядро — `Scope.dispose` уничтожает поддерево детей снизу вверх (см. раздел [«Каскадное уничтожение»](#каскадное-уничтожение-dispose) выше). `store.dispose(key)` дёргает `dispose` целевого скоупа, а затем синхронизирует свой индекс ключей — убирает из стора сам скоуп и всех его потомков:

```
store.dispose('zone')
  → Scope.dispose: page:7, page:3, …, zone   (детей раньше родителя)
  → из индекса стора удаляются zone и все page:*
```

Каскад гасит и не-сторовых детей зоны (например виджеты на `useScope`, смонтированные в её поддереве) — это и есть «родитель умер → дети умерли». Скоупы вне поддерева зоны (например сам `rootScope`) не затрагиваются.

### Заметки

- **Идемпотентность.** `init` и `dispose` безопасно вызывать повторно: `Scope.init`/`dispose` завершают свои Subject, повторный вызов — no-op. `dispose` несуществующего ключа — тоже no-op.
- **Никакого переиспользования мёртвого скоупа.** После `dispose` ключ удаляется; следующий `acquire` создаёт свежий скоуп (с новыми Subject). Это важно, потому что `dispose` не сбрасывает состояние скоупа.
- **GC.** Пока ключ в сторе, скоуп жив (сильная ссылка). `dispose`/`disposeAll` убирают ссылку, и кэш SCOPED-сервисов уходит в сборку мусора.
- **Рост внутри зоны.** Каскад снимает скоупы при сносе родителя, но не ограничивает их число, пока зона жива. Для per-instance keep-alive (скоуп на каждый id) добавляйте свою политику вытеснения поверх `keys()`/`dispose()` (например LRU).

## Обнаружение циклических зависимостей

Перед созданием экземпляра в реестр (для SINGLETON) или скоуп (для SCOPED) помещается sentinel-значение `INJECTING_INSTANCE`. Если при конструировании обнаруживается этот sentinel — значит зависимость запрошена повторно, и выбрасывается `CircularDependencyError`.

```typescript
@injectable('SINGLETON')
class ServiceA {
    b = inject(ServiceB);
}

@injectable('SINGLETON')
class ServiceB {
    a = inject(ServiceA); // → CircularDependencyError
}
```

> ⚠️ Детекция работает **только для SINGLETON и SCOPED** — тех, у кого есть кэш
> (реестр/скоуп) для sentinel'а. У **TRANSIENT** кэша нет, sentinel ставить некуда,
> поэтому циклическая зависимость между TRANSIENT-сервисами не даёт
> `CircularDependencyError`, а уходит в бесконечную рекурсию (stack overflow,
> `RangeError`).

## `NonCompatibleParentError`

SCOPED-зависимость **не может** быть внедрена из контекста SINGLETON или TRANSIENT сервиса. Это нарушило бы гарантии жизненного цикла: скоуп-зависимость может быть уничтожена раньше, чем синглтон, который на неё ссылается.

```typescript
@injectable({ lifetime: 'SCOPED', requireProvide: false })
class ScopedService {}

@injectable('SINGLETON')
class SingletonParent {
    scoped = inject(ScopedService); // → NonCompatibleParentError
}
```

## `resetRegistry()` — изоляция тестов

Функция `resetRegistry()` очищает модульный реестр синглтонов. Используйте в `beforeEach` для предотвращения утечки состояния между тестами.

```typescript
import { beforeEach } from 'vitest';
import { inject, injectable, resetRegistry } from '@fozy-labs/simplest-di';

@injectable('SINGLETON')
class Counter {
    value = 0;
}

beforeEach(() => {
    resetRegistry();
});
```

## Совместимость с TC39 декораторами

Библиотека использует **TC39 Stage 3 декораторы** (стандарт). **Не** включайте `experimentalDecorators` в `tsconfig.json` — это активирует устаревшие TypeScript-декораторы, несовместимые с данной библиотекой.

Требования:
- TypeScript ≥ 5.0
- В `tsconfig.json`: **не** устанавливать `"experimentalDecorators": true`
