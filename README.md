# @fozy-labs/simplest-di

> Простейшая система внедрения зависимостей (DI) для TypeScript с поддержкой React и RxJS.

[![npm version](https://badge.fury.io/js/%40fozy-labs%2Fsimplest-di.svg)](https://badge.fury.io/js/%40fozy-labs%2Fsimplest-di)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![RxJS](https://img.shields.io/badge/RxJS-7.0-purple.svg)](https://rxjs.dev/)

## 📦 Установка

```bash
npm install @fozy-labs/simplest-di
```

### Peer-зависимости

| Зависимость | Версия | Обязательность |
|---|---|---|
| `rxjs` | `^7.0.0` | Обязательна |
| `react` | `^19.0.0` | Опционально (только для React-интеграции) |



## 🚀 Быстрый старт

### Базовый пример: Singleton-сервис

```typescript
import { injectable, inject } from '@fozy-labs/simplest-di';

@injectable('SINGLETON')
class ApiClient {
    fetch(url: string) { /* ... */ }
}

// Первый вызов создаёт экземпляр
const client1 = inject(ApiClient);
// Второй вызов возвращает тот же экземпляр
const client2 = inject(ApiClient);
// client1 === client2 → true
```

### React: DiScopeProvider

```tsx
import { setupReactDi, DiScopeProvider, injectable, inject } from '@fozy-labs/simplest-di';

// Вызвать один раз при старте приложения
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

## ✨ Особенности

- 🔄 **Три режима жизненного цикла** — `SINGLETON`, `TRANSIENT`, `SCOPED`
- 🌳 **Иерархия скоупов** — Родительские и дочерние скоупы с наследованием зависимостей
- ⚛️ **React-интеграция** — `DiScopeProvider` для управления скоупами в React-дереве
- 🎨 **Stage 3 декораторы** — TC39 декораторы, без `experimentalDecorators`
- 🧪 **Изоляция тестов** — `resetRegistry()` для очистки синглтон-состояния между тестами
- 🔷 **TypeScript-first** — Полная типизация


## 📚 Документация

- [**Концепции DI**](./docs/concepts.md) — жизненные циклы, скоупы, декораторы, обнаружение циклов
- [**React-интеграция**](./docs/react-integration.md) — setupReactDi, DiScopeProvider, вложенные скоупы
- [**Миграция с fozy**](./docs/migration.md) — пошаговая инструкция миграции
- [**CHANGELOG**](./docs/CHANGELOG.md) — история изменений


## 📖 API

### Основные экспорты

| Экспорт | Тип | Описание |
|---|---|---|
| `inject` | Функция | Разрешение зависимости по токену (классу) |
| `inject.provide` | Метод | Явная регистрация зависимости в скоупе |
| `injectable` | Декоратор | Помечает класс метаданными DI (lifetime, опции) |
| `Scope` | Класс | Контейнер скоупа с иерархией и жизненным циклом |
| `resetRegistry` | Функция | Очистка синглтон-реестра (для тестов) |
| `getInjectorName` | Функция | Получение имени родительского инжектора (отладка) |

### Классы ошибок

| Экспорт | Описание |
|---|---|
| `CircularDependencyError` | Обнаружена циклическая зависимость |
| `NonCompatibleParentError` | SCOPED-зависимость в SINGLETON/TRANSIENT-контексте |
| `MustBeProvidedError` | Зависимость с `requireProvide: true` не предоставлена |

### React-интеграция

| Экспорт | Тип | Описание |
|---|---|---|
| `setupReactDi` | Функция | Инициализация DI для React (вызвать один раз) |
| `DiScopeProvider` | React-компонент | Создаёт дочерний скоуп в React-дереве |

### Типы

| Экспорт | Описание |
|---|---|
| `InjectionLifetime` | `'SINGLETON' \| 'TRANSIENT' \| 'SCOPED'` |
| `InjectableOptions<T>` | Опции для `@injectable()` (строка или объект) |
| `InjectableDetailedOptions<T>` | Подробные опции: `lifetime`, `onScopeInit`, `requireProvide` |
| `InjectOptions<T>` | Полный дескриптор для ручной регистрации |
| `InjectComputedOptions<T>` | Нормализованная форма `InjectOptions` |
| `ProvideOptions<T>` | Тип аргумента `inject()` / `inject.provide()` |
| `Injectable` | Тип класса с метаданными `@injectable()` |
| `InjectableOptionsSymbol` | Тип символа `INJECTABLE_OPTIONS` |
| `InjectingInstanceSymbol` | Тип символа `INJECTING_INSTANCE` |
| `DiScopeProviderProps` | Props для `DiScopeProvider` |

## ⚙️ Требования TypeScript

- TypeScript **≥ 5.0**
- **Не** включать `experimentalDecorators` — библиотека использует TC39 Stage 3 декораторы
- В `tsconfig.json` не нужны дополнительные настройки для декораторов
