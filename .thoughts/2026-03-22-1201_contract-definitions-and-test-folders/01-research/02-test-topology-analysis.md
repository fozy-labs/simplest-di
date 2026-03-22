---
workflow_version: b0.5
title: "Test Topology and React-adjacent Impact — Codebase Analysis"
date: 2026-03-22
stage: 01-research
role: rdpi-codebase-researcher
language: en
rdpi-version: b0.5
---

## Summary
The task scope states that tests in the core and react folders are to be moved into __tests__ directories, and this phase documents the current layout without proposing changes. Today, source-adjacent test files live under src/core and src/react, while shared setup, a helper re-export, and integration suites already live under src/__tests__; Vitest discovery is split between the repository Vitest merge config, the shared config package, and tsconfig.test.json. @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/TASK.md:12 @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/PHASES.md:57 @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/PHASES.md:89 @/vitest.config.ts:1 @/node_modules/@fozy-labs/js-configs/dist/vitest/index.js:5 @/node_modules/@fozy-labs/js-configs/dist/vitest/index.js:6 @/tsconfig.test.json:3

## Findings

### Current test layout
- **Location**: @/src/core/errors.test.ts:4 @/src/core/getInjectOptions.test.ts:4 @/src/core/getInjectorName.test.ts:3 @/src/core/inject.test.ts:49 @/src/core/inject.test.ts:351 @/src/core/injectable.test.ts:6 @/src/core/Scope.test.ts:5
- **What it does**: The core test area currently consists of six source-adjacent files in src/core that define suites for errors, getInjectOptions, getInjectorName, inject, inject.provide, injectable, and Scope behavior.
- **Key dependencies**: Core tests import through the @ alias or direct subpaths under @/core, including @/core, @/core/getInjectOptions, @/core/InjectScope, and @/core/symbols. @/src/core/errors.test.ts:1 @/src/core/errors.test.ts:2 @/src/core/getInjectOptions.test.ts:1 @/src/core/getInjectOptions.test.ts:2 @/src/core/getInjectorName.test.ts:1 @/src/core/Scope.test.ts:3
- **Patterns**: These tests are co-located with the source folder they exercise, but their imports are alias-based rather than relative. @/src/core/errors.test.ts:1 @/src/core/getInjectOptions.test.ts:2 @/src/core/getInjectorName.test.ts:1 @/src/core/inject.test.ts:3 @/src/core/Scope.test.ts:3

- **Location**: @/src/react/reactDi.test.tsx:34 @/src/react/useConstant.test.ts:5 @/src/react/useSafeMount.test.tsx:10
- **What it does**: The react test area currently consists of three source-adjacent files in src/react covering setupReactDi and DiScopeProvider, the useConstant hook, and the useSafeMount hook.
- **Key dependencies**: reactDi.test.tsx imports @/core and @/react through the alias; the hook tests import their implementation files through same-directory relative paths. @/src/react/reactDi.test.tsx:5 @/src/react/reactDi.test.tsx:6 @/src/react/useConstant.test.ts:3 @/src/react/useSafeMount.test.tsx:4
- **Patterns**: The React hook tests are the current cases where the test file path and the source file path are directly coupled by ./useConstant and ./useSafeMount imports. @/src/react/useConstant.test.ts:3 @/src/react/useSafeMount.test.tsx:4

- **Location**: @/src/__tests__/setup.ts:1 @/src/__tests__/helpers/singleton-reset.ts:1 @/src/__tests__/integration/exports.test.ts:16 @/src/__tests__/integration/scoped-lifecycle.test.tsx:22
- **What it does**: Shared test infrastructure already exists under src/__tests__. The setup file resets the singleton registry and InjectScope state before each test, the helper file re-exports resetRegistry, and two integration suites live under src/__tests__/integration.
- **Key dependencies**: The setup file imports resetRegistry from @/core and InjectScope from @/core/InjectScope; integration suites import from @/index, @/core, and @/react. @/src/__tests__/setup.ts:1 @/src/__tests__/setup.ts:2 @/src/__tests__/integration/exports.test.ts:1 @/src/__tests__/integration/scoped-lifecycle.test.tsx:5 @/src/__tests__/integration/scoped-lifecycle.test.tsx:6
- **Patterns**: Under src/__tests__, the existing folders are named helpers and integration, and the integration files use kebab-case names with .test.ts or .test.tsx suffixes. @/src/__tests__/helpers/singleton-reset.ts:1 @/src/__tests__/integration/exports.test.ts:16 @/src/__tests__/integration/scoped-lifecycle.test.tsx:22

### Vitest discovery and setup behavior
- **Location**: @/vitest.config.ts:1 @/vitest.config.ts:3 @/vitest.config.ts:5 @/vitest.config.ts:9 @/vitest.config.ts:17 @/vitest.config.ts:18
- **What it does**: The repository Vitest config merges a shared config from @fozy-labs/js-configs/vitest, defines the @ alias to ./src, enables legacy decorators in oxc, and narrows coverage include to src/core/** and src/react/**.
- **Key dependencies**: Discovery-relevant behavior is inherited from the shared config package rather than declared entirely in the local file. @/vitest.config.ts:3 @/vitest.config.ts:5 @/node_modules/@fozy-labs/js-configs/dist/vitest/index.js:3 @/node_modules/@fozy-labs/js-configs/dist/vitest/index.js:4 @/node_modules/@fozy-labs/js-configs/dist/vitest/index.js:5 @/node_modules/@fozy-labs/js-configs/dist/vitest/index.js:6
- **Patterns**: The shared config sets globals=true, environment="jsdom", setupFiles=["src/__tests__/setup.ts"], and include=["src/**/*.test.ts", "src/**/*.test.tsx"]. The local config adds alias and coverage configuration on top of that. @/node_modules/@fozy-labs/js-configs/dist/vitest/index.js:3 @/node_modules/@fozy-labs/js-configs/dist/vitest/index.js:4 @/node_modules/@fozy-labs/js-configs/dist/vitest/index.js:5 @/node_modules/@fozy-labs/js-configs/dist/vitest/index.js:6 @/vitest.config.ts:9 @/vitest.config.ts:18

- **Location**: @/tsconfig.test.json:3 @/package.json:12 @/package.json:14
- **What it does**: tsconfig.test.json includes vitest.config.ts, all src/**/*.test.ts files, all src/**/*.test.tsx files, and all files under src/__tests__/**; package.json defines test and test:coverage scripts that run the test toolchain.
- **Key dependencies**: Test TypeScript compilation includes both source-adjacent test names and the src/__tests__ tree. @/tsconfig.test.json:3
- **Patterns**: Current discovery and compilation depend on filename suffixes .test.ts or .test.tsx plus the explicit src/__tests__ path and the explicit setup file path src/__tests__/setup.ts. @/node_modules/@fozy-labs/js-configs/dist/vitest/index.js:5 @/node_modules/@fozy-labs/js-configs/dist/vitest/index.js:6 @/tsconfig.test.json:3

### File-by-file inventory for moved-test candidates
- **Location**: @/src/core/errors.test.ts:4
- **What it does**: errors.test.ts defines the errors suite and validates the repository's three exported DI error classes, including parent-context behavior via InjectScope. @/src/core/errors.test.ts:1 @/src/core/errors.test.ts:2 @/src/core/errors.test.ts:17 @/src/core/errors.test.ts:42
- **Key dependencies**: @/core and @/core/InjectScope. @/src/core/errors.test.ts:1 @/src/core/errors.test.ts:2
- **Patterns**: Co-located under src/core, alias imports only. @/src/core/errors.test.ts:1 @/src/core/errors.test.ts:4

- **Location**: @/src/core/getInjectOptions.test.ts:4
- **What it does**: getInjectOptions.test.ts verifies normalization for @injectable shorthand and detailed options, undecorated class failure, explicit InjectOptions normalization, default requireProvide, and default getInstance behavior. @/src/core/getInjectOptions.test.ts:6 @/src/core/getInjectOptions.test.ts:19 @/src/core/getInjectOptions.test.ts:35 @/src/core/getInjectOptions.test.ts:55
- **Key dependencies**: @/core and @/core/getInjectOptions. @/src/core/getInjectOptions.test.ts:1 @/src/core/getInjectOptions.test.ts:2
- **Patterns**: Co-located under src/core, mostly alias imports with one direct core subpath. @/src/core/getInjectOptions.test.ts:1 @/src/core/getInjectOptions.test.ts:2

- **Location**: @/src/core/getInjectorName.test.ts:3
- **What it does**: getInjectorName.test.ts validates outside-of-scope failure and parent injector name capture during an inject chain. @/src/core/getInjectorName.test.ts:5 @/src/core/getInjectorName.test.ts:9
- **Key dependencies**: @/core imports for getInjectorName, inject, and injectable. @/src/core/getInjectorName.test.ts:1
- **Patterns**: Co-located under src/core, alias-only imports. @/src/core/getInjectorName.test.ts:1 @/src/core/getInjectorName.test.ts:3

- **Location**: @/src/core/inject.test.ts:49 @/src/core/inject.test.ts:351
- **What it does**: inject.test.ts contains the largest core suite, covering singleton, transient, scoped, circular dependency, provide, requireProvide, onScopeInit, cleanup, construction failure, and resetRegistry behavior, plus a separate inject.provide suite. @/src/core/inject.test.ts:73 @/src/core/inject.test.ts:171 @/src/core/inject.test.ts:189 @/src/core/inject.test.ts:195 @/src/core/inject.test.ts:243 @/src/core/inject.test.ts:278 @/src/core/inject.test.ts:334 @/src/core/inject.test.ts:353 @/src/core/inject.test.ts:360
- **Key dependencies**: rxjs Subject plus the @/core barrel. @/src/core/inject.test.ts:1 @/src/core/inject.test.ts:3
- **Patterns**: Co-located under src/core; defines a local createScope helper instead of importing one from src/__tests__/helpers. @/src/core/inject.test.ts:40

- **Location**: @/src/core/injectable.test.ts:6
- **What it does**: injectable.test.ts validates metadata attachment, shorthand lifetime configuration, detailed options storage, and property descriptor locking for the decorator. @/src/core/injectable.test.ts:8 @/src/core/injectable.test.ts:17 @/src/core/injectable.test.ts:24 @/src/core/injectable.test.ts:40
- **Key dependencies**: @/core and @/core/symbols. @/src/core/injectable.test.ts:1 @/src/core/injectable.test.ts:2
- **Patterns**: Co-located under src/core, alias imports only. @/src/core/injectable.test.ts:1 @/src/core/injectable.test.ts:6

- **Location**: @/src/core/Scope.test.ts:5
- **What it does**: Scope.test.ts verifies constructor defaults, parent linking, parent-chain lookup, local storage, init and destroyed subjects, completion behavior, default getCurrentScope, and name storage. @/src/core/Scope.test.ts:7 @/src/core/Scope.test.ts:14 @/src/core/Scope.test.ts:21 @/src/core/Scope.test.ts:47 @/src/core/Scope.test.ts:58 @/src/core/Scope.test.ts:67 @/src/core/Scope.test.ts:76 @/src/core/Scope.test.ts:93
- **Key dependencies**: rxjs Subject and @/core. @/src/core/Scope.test.ts:1 @/src/core/Scope.test.ts:3
- **Patterns**: Co-located under src/core, alias imports only. @/src/core/Scope.test.ts:3 @/src/core/Scope.test.ts:5

- **Location**: @/src/react/reactDi.test.tsx:34
- **What it does**: reactDi.test.tsx covers lazy context creation expectations, React version gating, Scope.getCurrentScope wiring, child rendering, scope creation, inject-through-context, nested providers, mount init, unmount dispose, provide prop handling, and destroyed$ notifications. @/src/react/reactDi.test.tsx:54 @/src/react/reactDi.test.tsx:59 @/src/react/reactDi.test.tsx:71 @/src/react/reactDi.test.tsx:89 @/src/react/reactDi.test.tsx:100 @/src/react/reactDi.test.tsx:119 @/src/react/reactDi.test.tsx:137 @/src/react/reactDi.test.tsx:167 @/src/react/reactDi.test.tsx:189 @/src/react/reactDi.test.tsx:218 @/src/react/reactDi.test.tsx:239
- **Key dependencies**: @/core and @/react barrels. @/src/react/reactDi.test.tsx:5 @/src/react/reactDi.test.tsx:6
- **Patterns**: Co-located under src/react, but alias-based imports; defines a local createScope helper that is not imported from src/__tests__/helpers. @/src/react/reactDi.test.tsx:25

- **Location**: @/src/react/useConstant.test.ts:5
- **What it does**: useConstant.test.ts verifies stable references across rerenders, stable undefined return behavior, recomputation on dependency change, and no recomputation when deps stay stable. @/src/react/useConstant.test.ts:7 @/src/react/useConstant.test.ts:17 @/src/react/useConstant.test.ts:29 @/src/react/useConstant.test.ts:46
- **Key dependencies**: @testing-library/react renderHook and the local ./useConstant module. @/src/react/useConstant.test.ts:1 @/src/react/useConstant.test.ts:3
- **Patterns**: Co-located under src/react and directly coupled to file adjacency through a relative import. @/src/react/useConstant.test.ts:3

- **Location**: @/src/react/useSafeMount.test.tsx:10
- **What it does**: useSafeMount.test.tsx verifies mount callback execution, cleanup on unmount, no-crash behavior without cleanup, and StrictMode-specific single-run and no-phantom-side-effect behavior. @/src/react/useSafeMount.test.tsx:12 @/src/react/useSafeMount.test.tsx:21 @/src/react/useSafeMount.test.tsx:38 @/src/react/useSafeMount.test.tsx:52 @/src/react/useSafeMount.test.tsx:65 @/src/react/useSafeMount.test.tsx:82
- **Key dependencies**: @testing-library/react, React, and the local ./useSafeMount module. @/src/react/useSafeMount.test.tsx:1 @/src/react/useSafeMount.test.tsx:2 @/src/react/useSafeMount.test.tsx:4
- **Patterns**: Co-located under src/react and directly coupled to file adjacency through a relative import. @/src/react/useSafeMount.test.tsx:4

### React-adjacent source and documentation covered by moved tests
- **Location**: @/src/react/reactDi.tsx:20 @/src/react/reactDi.tsx:32 @/src/react/reactDi.tsx:38 @/src/react/index.ts:1 @/src/react/index.ts:2
- **What it does**: The React runtime surface exported from src/react/index.ts consists of setupReactDi, DiScopeProvider, and DiScopeProviderProps, and the implementation file wires React context lookup, Scope creation, provide registration, keyName-based scope recreation through useConstant, and lifecycle init/dispose through useSafeMount.
- **Key dependencies**: reactDi.tsx imports ProvideOptions from core types, inject from core/inject, Scope from core/Scope, and the local useConstant and useSafeMount hooks. @/src/react/reactDi.tsx:4 @/src/react/reactDi.tsx:5 @/src/react/reactDi.tsx:6 @/src/react/reactDi.tsx:8 @/src/react/reactDi.tsx:9
- **Patterns**: reactDi.test.tsx and scoped-lifecycle.test.tsx both exercise setupReactDi and DiScopeProvider through alias imports instead of relative source imports. @/src/react/reactDi.test.tsx:6 @/src/__tests__/integration/scoped-lifecycle.test.tsx:6

- **Location**: @/src/react/useConstant.ts:5 @/src/react/useSafeMount.ts:5
- **What it does**: The two React hook source files export useConstant and useSafeMount, which are the direct implementation targets of the two hook tests that currently use same-folder relative imports. @/src/react/useConstant.test.ts:3 @/src/react/useSafeMount.test.tsx:4
- **Key dependencies**: useConstant.ts imports useRef; useSafeMount.ts imports useEffect, useLayoutEffect, and useRef. @/src/react/useConstant.ts:1 @/src/react/useSafeMount.ts:1
- **Patterns**: These are the only directly relative test-to-source pairs in the requested move scope. @/src/react/useConstant.test.ts:3 @/src/react/useSafeMount.test.tsx:4

- **Location**: @/docs/react-integration.md:5 @/docs/react-integration.md:7 @/docs/react-integration.md:24 @/docs/react-integration.md:33 @/docs/react-integration.md:34 @/docs/react-integration.md:127 @/docs/react-integration.md:143
- **What it does**: The React integration document describes the same exported React surface and behaviors that the current React-adjacent tests exercise: setupReactDi, DiScopeProvider, the keyName prop, the provide prop, React 19 requirement, and StrictMode behavior.
- **Key dependencies**: The document examples import setupReactDi, DiScopeProvider, injectable, and inject from the package entry point. @/docs/react-integration.md:15 @/docs/react-integration.md:39 @/docs/react-integration.md:67
- **Patterns**: The documented behaviors align with test coverage split across reactDi.test.tsx and src/__tests__/integration/scoped-lifecycle.test.tsx rather than a dedicated docs test file. @/src/react/reactDi.test.tsx:54 @/src/react/reactDi.test.tsx:59 @/src/react/reactDi.test.tsx:137 @/src/react/reactDi.test.tsx:218 @/src/react/useSafeMount.test.tsx:52 @/src/__tests__/integration/scoped-lifecycle.test.tsx:70 @/src/__tests__/integration/scoped-lifecycle.test.tsx:139 @/src/__tests__/integration/scoped-lifecycle.test.tsx:204

### Scope boundaries and observed discovery dependencies
- **Location**: @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/TASK.md:12
- **What it does**: The task text names tests in the core and react folders as the move target, which matches the six src/core/*.test.ts files and the three src/react/*.test.ts or *.test.tsx files listed above.
- **Key dependencies**: Files already under src/__tests__ are not named in the task as source folders to move from; they are part of the current topology that Phase 2 asks to document. @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/PHASES.md:79 @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/PHASES.md:80 @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/PHASES.md:81 @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/PHASES.md:82
- **Patterns**: In-scope moved-test candidates are source-adjacent test files under src/core and src/react. Outside the move scope but inside the research scope are src/__tests__/setup.ts, src/__tests__/helpers/singleton-reset.ts, src/__tests__/integration/*.test.*, vitest.config.ts, tsconfig.test.json, src/react/reactDi.tsx, src/react/index.ts, src/react/useConstant.ts, src/react/useSafeMount.ts, and docs/react-integration.md. @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/PHASES.md:70 @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/PHASES.md:76 @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/PHASES.md:79 @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/PHASES.md:80 @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/PHASES.md:81 @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/PHASES.md:82 @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/PHASES.md:83 @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/PHASES.md:84 @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/PHASES.md:85 @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/PHASES.md:86 @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/PHASES.md:87

- **Location**: @/node_modules/@fozy-labs/js-configs/dist/vitest/index.js:5 @/node_modules/@fozy-labs/js-configs/dist/vitest/index.js:6 @/tsconfig.test.json:3 @/src/react/useConstant.test.ts:3 @/src/react/useSafeMount.test.tsx:4
- **What it does**: Current discovery depends on explicit file patterns for *.test.ts and *.test.tsx plus an explicit setup file path src/__tests__/setup.ts; current compilation also includes the src/__tests__ tree. The existing moved-test candidates are not uniform in path assumptions, because most use alias imports while the two hook tests use same-directory relative imports.
- **Key dependencies**: Shared config, tsconfig.test.json, and the import statements inside the two hook tests. @/node_modules/@fozy-labs/js-configs/dist/vitest/index.js:5 @/node_modules/@fozy-labs/js-configs/dist/vitest/index.js:6 @/tsconfig.test.json:3 @/src/react/useConstant.test.ts:3 @/src/react/useSafeMount.test.tsx:4
- **Patterns**: The repository already supports both source-adjacent *.test.* files and content under src/__tests__, but setup file discovery is pinned to the concrete path src/__tests__/setup.ts. @/node_modules/@fozy-labs/js-configs/dist/vitest/index.js:5 @/node_modules/@fozy-labs/js-configs/dist/vitest/index.js:6 @/tsconfig.test.json:3

## Code References
- @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/TASK.md:12 - task statement naming tests in core and react folders as move targets.
- @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/PHASES.md:57 - Phase 2 heading for test topology and React-adjacent impact.
- @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/PHASES.md:70 - src/core/errors.test.ts is in the required Phase 2 read set.
- @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/PHASES.md:76 - src/react/reactDi.test.tsx is in the required Phase 2 read set.
- @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/PHASES.md:79 - src/__tests__/setup.ts is in the required Phase 2 read set.
- @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/PHASES.md:89 - Phase 2 prompt frames the analysis around moving tests from src/core and src/react into __tests__ directories.
- @/node_modules/@fozy-labs/js-configs/dist/vitest/index.js:5 - shared Vitest setupFiles path is src/__tests__/setup.ts.
- @/node_modules/@fozy-labs/js-configs/dist/vitest/index.js:6 - shared Vitest include globs are src/**/*.test.ts and src/**/*.test.tsx.
- @/vitest.config.ts:5 - repository Vitest config merges the shared config.
- @/vitest.config.ts:18 - repository coverage include is limited to src/core/** and src/react/**.
- @/tsconfig.test.json:3 - test TypeScript config includes both src/**/*.test.* and src/__tests__/**/*.
- @/src/__tests__/setup.ts:4 - shared per-test reset behavior is centralized in src/__tests__/setup.ts.
- @/src/__tests__/integration/exports.test.ts:16 - one integration suite already lives under src/__tests__/integration.
- @/src/__tests__/integration/scoped-lifecycle.test.tsx:22 - a second integration suite already lives under src/__tests__/integration.
- @/src/react/useConstant.test.ts:3 - useConstant test imports its source through a same-directory relative path.
- @/src/react/useSafeMount.test.tsx:4 - useSafeMount test imports its source through a same-directory relative path.
- @/src/react/reactDi.tsx:38 - DiScopeProvider implementation creates and manages Scope instances in the React layer.
- @/docs/react-integration.md:143 - the React integration document explicitly describes StrictMode behavior.