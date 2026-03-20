# Contributing

Руководство для контрибьюторов проекта **@fozy-labs/simplest-di**.

## Содержание

- [Contributing](#contributing)
  - [Содержание](#содержание)
  - [Настройка окружения](#настройка-окружения)
    - [Предварительные требования](#предварительные-требования)
    - [Быстрый старт](#быстрый-старт)
  - [Запуск тестов](#запуск-тестов)
  - [Проверка типов](#проверка-типов)
  - [Линтинг и форматирование](#линтинг-и-форматирование)
  - [Стиль кода](#стиль-кода)
  - [Структура проекта](#структура-проекта)
  - [Git](#git)
    - [Ветвление](#ветвление)
    - [Коммиты](#коммиты)
    - [Чеклист](#чеклист)


## Настройка окружения

### Предварительные требования

- **Node.js** ≥ 18
- **npm** ≥ 9

### Быстрый старт

```bash
# Клонирование
git clone https://github.com/fozy-labs/simplest-di.git
cd simplest-di

# Установка зависимостей
npm install

# Проверка типов
npm run ts-check

# Запуск тестов
npm run test

# Сборка
npm run build
```


## Запуск тестов

Используется **Vitest** с окружением `jsdom`.

```bash
npm run test            # Однократный запуск
npm run test:watch      # Watch-режим
npm run test:coverage   # Отчёт о покрытии
```

- Юнит-тесты размещаются рядом с кодом: `MyModule.test.ts`
- Интеграционные тесты — в `src/__tests__/integration/`


## Проверка типов

```bash
npm run ts-check          # Проверка типов исходного кода
npm run ts-check:tests    # Проверка типов тестов
```

Оба скрипта выполняют `tsc --noEmit` с соответствующим `tsconfig`.


## Линтинг и форматирование

```bash
npm run lint            # Проверка линтером (ESLint)
npm run lint:fix        # Автоисправление ошибок линтера
npm run format          # Форматирование кода (Prettier)
npm run format:check    # Проверка форматирования без изменений
```



## Стиль кода

- **TypeScript strict mode** — проект работает в строгом режиме (`"strict": true`)
- **ESM-only** — `"type": "module"` в `package.json`, только ES-импорты/экспорты
- **Stage 3 декораторы** — используются для DI (`@injectable`, `@inject`)
- **Алиас путей** — `@/` → `src/` (настроен в `tsconfig.json`)
- Код и комментарии в коде — **на английском**
- Документация (`docs/`) — **на русском**
- Barrel-экспорт через `index.ts` для публичного API


## Структура проекта

```
simplest-di/
├── src/
│   ├── core/             # Ядро DI: injectable, inject, Scope, ошибки
│   ├── react/            # React-интеграция: провайдер, хуки
│   └── __tests__/        # Интеграционные тесты и хелперы
│       ├── integration/  # Интеграционные тесты (exports, scoped-lifecycle)
│       └── helpers/      # Тестовые утилиты (singleton-reset)
├── docs/                 # Документация (на русском)
└── dist/                 # Результат сборки (не коммитится)
```

| Директория | Описание |
|---|---|
| `src/core/` | Декораторы `@injectable`, `@inject`, класс `Scope`, типы, ошибки |
| `src/react/` | React-провайдер, хуки `useConstant`, `useSafeMount` |
| `src/__tests__/` | Интеграционные тесты и вспомогательные утилиты |


## Git

### Ветвление

Создавайте ветку от `main`:

```bash
git checkout -b feat/my-feature
```

Рекомендуемые префиксы веток: `feat/`, `fix/`, `docs/`, `refactor/`, `chore/`.

### Коммиты

Используются [Conventional Commits](https://www.conventionalcommits.org/):


### Чеклист

```bash
npm run ts-check          # Типы
npm run ts-check:tests    # Типы тестов
npm run test              # Тесты
npm run lint              # Линтер
npm run format:check      # Форматирование
```

