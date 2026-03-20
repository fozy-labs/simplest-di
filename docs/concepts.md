# Концепции DI

## Обзор

`@fozy-labs/simplest-di` — лёгкая система внедрения зависимостей (Dependency Injection), основанная на TC39 Stage 3 декораторах. Сервисы помечаются декоратором `@injectable()`, а разрешение зависимостей происходит через функцию `inject()`.

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
    onScopeInit: (instance) => {
        instance.start();
        return () => instance.stop(); // cleanup при dispose скоупа
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
| `onScopeInit` | `(instance) => void \| (() => void)` | Callback при инициализации скоупа. Может вернуть cleanup-функцию |

## Скоупы (Scopes)

### Иерархия parent-child

Скоупы образуют дерево. При вызове `scope.getInstance(token)` сначала проверяется текущий скоуп, затем поднимается по цепочке `parent`:

```
GrandchildScope → ChildScope → RootScope → null
```

Дочерний скоуп может «перекрыть» (shadow) зависимость родителя, если явно предоставить её через `inject.provide()`.

### WeakMap-хранилище

Каждый скоуп хранит экземпляры в `WeakMap<Constructor, instance>`. Это позволяет GC собирать экземпляры при уничтожении скоупа.

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

## `onScopeInit` — жизненный цикл скоупа

Callback `onScopeInit` вызывается при инициализации скоупа (`scope.init()`). Если callback возвращает функцию, она будет вызвана при уничтожении скоупа (`scope.dispose()`).

Скоуп имеет два rxjs-Subject:
- `init$` — срабатывает при `scope.init()`, затем `complete()`
- `destroyed$` — срабатывает при `scope.dispose()`, затем `complete()`

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
