# React-интеграция

## Обзор

`@fozy-labs/simplest-di` предоставляет интеграцию с React через два экспорта: `setupReactDi()` и `DiScopeProvider`. Для работы требуется **React ≥ 19**. Контракты, созданные через `inject.define()`, используют ту же React-интеграцию: отдельного React-специфичного API для них нет.

## `setupReactDi()`

Однократная инициализация DI-системы для React. Привязывает разрешение текущего скоупа к React-контексту через `React.use()`.

**Вызывать один раз** в точке входа приложения, **до первого рендера**:

```typescript
// main.tsx
import { setupReactDi } from '@fozy-labs/simplest-di';

setupReactDi();

// ... далее рендер приложения
```

Если версия React ниже 19, `setupReactDi()` выбросит ошибку.

## `DiScopeProvider`

React-компонент, создающий дочерний скоуп в React-дереве. Каждый `DiScopeProvider` создаёт новый `Scope` с привязкой к родительскому.

### Props

| Prop | Тип | Описание |
|---|---|---|
| `children` | `React.ReactNode` | Дочерние элементы |
| `keyName` | `string?` | Имя скоупа. При изменении скоуп пересоздаётся |
| `provide` | `ProvideOptions<any>[]?` | Массив сервисов для регистрации в скоупе |

### Базовый пример

```tsx
import { setupReactDi, DiScopeProvider, injectable, inject } from '@fozy-labs/simplest-di';

setupReactDi();

@injectable('SCOPED')
class AppStore {
    count = 0;
}

function Counter() {
    const store = inject(AppStore);
    return <div>{store.count}</div>;
}

function App() {
    return (
        <DiScopeProvider provide={[AppStore]}>
            <Counter />
        </DiScopeProvider>
    );
}
```

## Контракты в React

Для контрактов по-прежнему используются `setupReactDi()` и `DiScopeProvider`. Если scoped-контракт уже привязан через `bind()`, это считается регистрацией зависимости: дополнительный `provide` для самого контракта не нужен.

```tsx
import { DiScopeProvider, inject, injectable, setupReactDi } from '@fozy-labs/simplest-di';

setupReactDi();

interface RequestSession {
    requestId: string;
}

@injectable({ lifetime: 'SCOPED', requireProvide: true })
class BrowserRequestSession implements RequestSession {
    requestId = crypto.randomUUID();
}

const RequestSession = inject.define<RequestSession>('RequestSession');
RequestSession.bind(BrowserRequestSession);

function RequestPanel() {
    const session = inject(RequestSession);
    return <span>{session.requestId}</span>;
}

function App() {
    return (
        <DiScopeProvider>
            <RequestPanel />
        </DiScopeProvider>
    );
}
```

Важно:

- `inject(RequestSession)` вне `DiScopeProvider` по-прежнему завершится ошибкой отсутствующего active scope.
- Для constructor-based scoped-сервисов правило не меняется: если у класса `requireProvide: true`, его по-прежнему нужно передать через `provide` или зарегистрировать через `inject.provide()`.
- `setupReactDi()` и `DiScopeProvider` остаются единственными React entry points.

## Вложенные скоупы

`DiScopeProvider` можно вкладывать друг в друга. Дочерний скоуп наследует зависимости от родительского:

```tsx
import { setupReactDi, DiScopeProvider, injectable, inject } from '@fozy-labs/simplest-di';

setupReactDi();

@injectable({ lifetime: 'SCOPED', requireProvide: false })
class ThemeService {
    theme = 'light';
}

@injectable({ lifetime: 'SCOPED', requireProvide: true })
class PageStore {
    title = '';
}

function ThemedComponent() {
    const theme = inject(ThemeService);
    const page = inject(PageStore);
    return <div className={theme.theme}>{page.title}</div>;
}

function App() {
    return (
        <DiScopeProvider provide={[ThemeService]}>
            {/* Корневой скоуп: ThemeService */}
            <DiScopeProvider provide={[PageStore]}>
                {/* Дочерний скоуп: PageStore + ThemeService из родителя */}
                <ThemedComponent />
            </DiScopeProvider>
        </DiScopeProvider>
    );
}
```

## Жизненный цикл скоупа в React

При монтировании `DiScopeProvider`:
1. Создаётся новый `Scope` с `init$` и `destroyed$` Subject'ами
2. Регистрируются зависимости из `provide`
3. Вызывается `scope.init()` → срабатывают `onScopeInit` callback'и

При размонтировании:
1. Вызывается `scope.dispose()` → срабатывают cleanup-функции из `onScopeInit`
2. Subject'ы `init$` и `destroyed$` завершаются (`complete()`)

### Пример `onScopeInit`

```typescript
@injectable({
    lifetime: 'SCOPED',
    onScopeInit(this: WebSocketService) {
        this.connect();
        return () => this.disconnect(); // cleanup при dispose
    },
})
class WebSocketService {
    connect() { /* ... */ }
    disconnect() { /* ... */ }
}
```

## Prop `keyName`

Параметр `keyName` задаёт имя скоупа. При изменении `keyName` скоуп пересоздаётся — старый скоуп уничтожается, создаётся новый. Это полезно для привязки к маршрутам или динамическим параметрам:

```tsx
function PageLayout({ routeId }: { routeId: string }) {
    return (
        <DiScopeProvider keyName={routeId} provide={[PageStore]}>
            <PageContent />
        </DiScopeProvider>
    );
}
```

При смене `routeId` скоуп с `PageStore` пересоздаётся, что обеспечивает свежее состояние для новой страницы.

## Поведение в StrictMode

В React StrictMode компоненты монтируются и размонтируются дважды при разработке. `DiScopeProvider` использует внутренний хук `useSafeMount`, который корректно обрабатывает этот цикл:

- При первом монтировании: `init()` → `dispose()` (StrictMode unmount) → повторный `init()`
- Скоуп корректно переживает двойной mount/unmount цикл StrictMode
