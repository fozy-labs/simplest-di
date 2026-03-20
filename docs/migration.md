# Миграция с fozy

Руководство по миграции с `@/shared/di/` (монорепозиторий fozy) на `@fozy-labs/simplest-di`.

## Сводка изменений

| Что изменилось | Было (fozy) | Стало (simplest-di) |
|---|---|---|
| Импорт | `@/shared/di` | `@fozy-labs/simplest-di` |
| React-инициализация | Неявная | Требуется `setupReactDi()` |
| Классы ошибок | Не экспортировались | Экспортируются для `instanceof` проверок |
| Изоляция тестов | Не было | `resetRegistry()` |
| Зависимость `@fozy/client-tools` | Требовалась | Удалена |
| TypeScript | Любой | ≥ 5.0, без `experimentalDecorators` |

## Пошаговая инструкция

### 1. Установка пакета

```bash
npm install @fozy-labs/simplest-di
```

### 2. Замена импортов

Заменить все импорты из `@/shared/di` на `@fozy-labs/simplest-di`:

```diff
- import { injectable, inject, Scope } from '@/shared/di';
+ import { injectable, inject, Scope } from '@fozy-labs/simplest-di';
```

```diff
- import { DiScopeProvider } from '@/shared/di/react';
+ import { DiScopeProvider } from '@fozy-labs/simplest-di';
```

### 3. Добавить `setupReactDi()`

В точке входа приложения (например, `main.tsx`), **до первого рендера**, добавить вызов:

```typescript
import { setupReactDi } from '@fozy-labs/simplest-di';

setupReactDi();

// ... далее ReactDOM.createRoot(...).render(...)
```

### 4. Удалить зависимость `@fozy/client-tools`

Если `@fozy/client-tools` использовался только для DI, удалите:

```bash
npm uninstall @fozy/client-tools
```

### 5. Настроить TypeScript

Убедитесь, что в `tsconfig.json`:
- TypeScript версии **≥ 5.0**
- **Нет** `"experimentalDecorators": true` (библиотека использует TC39 Stage 3 декораторы)

```diff
{
    "compilerOptions": {
-       "experimentalDecorators": true,
        "target": "ES2022"
    }
}
```

### 6. Обновить тесты

Для изоляции синглтон-состояния между тестами используйте `resetRegistry()`:

```typescript
import { beforeEach } from 'vitest';
import { resetRegistry } from '@fozy-labs/simplest-di';

beforeEach(() => {
    resetRegistry();
});
```

### 7. Использование классов ошибок (опционально)

Теперь можно типизированно обрабатывать ошибки DI:

```typescript
import {
    CircularDependencyError,
    NonCompatibleParentError,
    MustBeProvidedError,
} from '@fozy-labs/simplest-di';

try {
    inject(MyService, scope);
} catch (e) {
    if (e instanceof MustBeProvidedError) {
        // Сервис не предоставлен в скоупе
    }
}
```
