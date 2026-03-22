---
workflow_version: b0.5
title: "Core DI contract surface — Codebase Analysis"
date: 2026-03-22
stage: 01-research
role: rdpi-codebase-researcher
language: en
rdpi-version: b0.5
---

## Summary
The current DI surface is centered on constructor-decorated classes, but the injection entry point already accepts either a constructor or an InjectOptions object. The constructor path derives token, name, and instance creation directly from the class, while the object path accepts an arbitrary token and explicit getInstance function. Root package exports expose the combined core and React surface through a single package entry point.

## Confirmed Facts

### Public contract types
- **Location**: @/src/core/di.types.ts:5-34, @/src/core/index.ts:1-17, @/src/index.ts:1-2
- **What it does**: The public DI contract types are defined in di.types.ts and re-exported from the core entry point. InjectionLifetime is the union of SINGLETON, TRANSIENT, and SCOPED. InjectableDetailedOptions carries lifetime, optional onScopeInit, and optional requireProvide. InjectOptions includes token, getInstance, optional name, and the detailed options. ProvideOptions is a union of InjectOptions<T> and T, where T is constrained to a constructor type. The package source root re-exports both core and React exports.
- **Key dependencies**: The type layer depends on the INJECTABLE_OPTIONS and INJECTING_INSTANCE symbols for InjectableOptionsSymbol and InjectingInstanceSymbol. The source root depends on the core and react source entry points.
- **Patterns**: The type surface mixes constructor-oriented generics with an object-shaped injection options contract.

### Decorator metadata path
- **Location**: @/src/core/injectable.ts:7-15, @/src/core/symbols.ts:1-2, @/src/core/getInjectOptions.ts:22-49
- **What it does**: The injectable decorator stores the provided lifetime/options object on the class constructor under the INJECTABLE_OPTIONS symbol. When getInjectOptions receives a constructor, it reads that symbol, validates that the metadata is either a lifetime string or an object with a lifetime field, and expands it into a computed options object.
- **Key dependencies**: injectable.ts depends on InjectableOptions and INJECTABLE_OPTIONS. getInjectOptions.ts depends on the same symbol and the Injectable and InjectComputedOptions type definitions.
- **Patterns**: Constructor-based injection is metadata-driven; the constructor itself is the token, the instance factory is new arg(), and the derived name is arg.name.

### Token, name, and constructor derivation
- **Location**: @/src/core/getInjectOptions.ts:12-19, @/src/core/getInjectOptions.ts:21-70, @/src/core/getInjectorName.ts:3-13
- **What it does**: For constructor inputs, getInjectOptions returns token: arg, getInstance: () => new arg(), and name: arg.name. For object inputs, it preserves the provided object and lazily supplies name when absent by converting options.token to String(options.token) or using [anonymous]. getInjectorName reads the current and previous InjectScope frames and returns the previous frame name, or throws if called outside an inject scope or without a parent context in strict mode.
- **Key dependencies**: getInjectOptions.ts depends on the symbol-backed metadata path for constructors and on the object shape defined by InjectOptions. getInjectorName.ts depends on InjectScope state.
- **Patterns**: Name derivation is split between constructor names, explicit name fields, and stringification of arbitrary tokens.

### Lifetime resolution and caching rules
- **Location**: @/src/core/inject.ts:12-117, @/src/core/InjectScope.ts:5-25, @/src/core/Scope.ts:14-35, @/docs/concepts.md:11-64
- **What it does**: inject() computes options first, then branches by lifetime. TRANSIENT always creates a new instance through InjectScope.createInstance. SINGLETON stores instances in a module-level Map keyed by token and uses INJECTING_INSTANCE as a sentinel during construction. SCOPED resolves the active scope from the explicit scope argument or Scope.getCurrentScope(), looks up instances through Scope.getInstance(), and writes them with Scope.setInstance(). Scope.getInstance walks the current scope and then parent scopes until it finds a stored value or reaches null. The concepts document describes the same lifetime categories and parent-scope lookup behavior.
- **Key dependencies**: inject.ts depends on getInjectOptions, InjectScope, Scope, the sentinel symbol, and error types. Scope.ts depends on rxjs Subject and stores scoped instances in a WeakMap.
- **Patterns**: Lifetime dispatch happens entirely inside inject(), with sentinel-based cycle detection for SINGLETON and SCOPED paths and constructor-context tracking delegated to InjectScope.

### Provide contract and requireProvide semantics
- **Location**: @/src/core/inject.ts:69-75, @/src/core/inject.ts:120-137, @/src/core/getInjectOptions.ts:43-49, @/src/core/getInjectOptions.ts:63-67, @/docs/concepts.md:121-137
- **What it does**: The SCOPED branch throws MustBeProvidedError when no scoped instance exists and options.requireProvide is true. inject.provide is attached as a method on inject; it accepts the same ProvideOptions union, rejects TRANSIENT lifetimes, and re-invokes inject with requireProvide forced to false. getInjectOptions sets requireProvide to true for constructor-derived options and also defaults it to true for object inputs when the field is omitted. The concepts document describes requireProvide as the gate that makes scoped dependencies require explicit registration before injection.
- **Key dependencies**: inject.provide depends on getInjectOptions and the main inject function. The documented behavior depends on Scope-based registration examples in the concepts document.
- **Patterns**: Registration is expressed as a second pass through inject() with a modified requireProvide flag rather than a separate registration store.

### Scope lifecycle and error paths
- **Location**: @/src/core/inject.ts:24-25, @/src/core/inject.ts:49-60, @/src/core/inject.ts:65-70, @/src/core/inject.ts:77-112, @/src/core/errors.ts:4-25, @/src/core/Scope.ts:37-51, @/docs/concepts.md:139-201
- **What it does**: CircularDependencyError is thrown when the singleton registry or scoped storage already contains the INJECTING_INSTANCE sentinel for the current token. NonCompatibleParentError is thrown when a SCOPED dependency is requested while the parent injection context is TRANSIENT or SINGLETON. SCOPED injection also throws when no current scope exists, when initialization callbacks are requested but init$ is absent, and when destruction callbacks are requested but destroyed$ is absent. Scope exposes init(), dispose(), init$, destroyed$, and isInitialized. The concepts document describes onScopeInit execution on scope.init(), optional cleanup execution on scope.dispose(), cycle detection via the sentinel, and the scoped-into-singleton or scoped-into-transient restriction.
- **Key dependencies**: These paths depend on InjectScope.current and InjectScope.previous for parent-context checks, on Scope lifecycle fields, and on the dedicated error classes.
- **Patterns**: Lifecycle hooks are attached only in the SCOPED branch and are coordinated through optional scope subjects plus the isInitialized flag.

### Export surface and package entry points
- **Location**: @/src/core/index.ts:1-17, @/src/index.ts:1-2, @/src/react/index.ts:1-2, @/package.json:4-5, @/package.json:75-79
- **What it does**: The core source entry point exports all DI-related public types plus inject, resetRegistry, injectable, Scope, getInjectorName, and the three error classes. The package source root re-exports core and react, and the React source entry point exports setupReactDi, DiScopeProvider, and DiScopeProviderProps. package.json exposes a single package export for . that points to dist/index.js and dist/index.d.ts.
- **Key dependencies**: The package entry point depends on the generated dist/index files. The source root depends on both core and react source trees.
- **Patterns**: Published package consumers get the merged top-level entry point rather than separate declared subpath exports for core and react.

## Inferred Constraints

### Current contract surface already has an object-based injection path
- **Location**: @/src/core/di.types.ts:23-34, @/src/core/getInjectOptions.ts:52-70, @/src/core/inject.ts:12-15, @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/TASK.md:17-35
- **What it means**: The task assumption refers to adding inject.define<T>(name). The existing inject entry point already accepts non-constructor inputs through InjectOptions<T>, because ProvideOptions<T> is a union of InjectOptions<T> and T, inject() always normalizes through getInjectOptions(), and the object branch works from token/getInstance/name fields instead of decorator metadata. The repository therefore already contains a non-decorator injection path alongside the constructor path.

### The repository still models several core seams around constructors
- **Location**: @/src/core/inject.ts:8-12, @/src/core/di.types.ts:3-34, @/src/core/getInjectOptions.ts:21-49, @/src/core/Scope.ts:5-35
- **What it means**: Even with the object-based InjectOptions path, the main generic bounds use T extends Constructor, constructor inputs are expanded with new arg() and arg.name, and Scope stores instances in WeakMap<Constructor, any> with getInstance/setInstance signatures typed to constructors. The SCOPED branch in inject.ts passes token as any into scope storage, which crosses from the broader token: unknown contract into constructor-typed scope APIs.

### Future contract-definition behavior would be constrained by existing scope, provide, and lifecycle semantics
- **Location**: @/src/core/inject.ts:48-115, @/src/core/inject.ts:120-137, @/src/core/errors.ts:4-25, @/src/core/InjectScope.ts:5-25, @/docs/concepts.md:121-201
- **What it means**: Any future contract-definition surface that routes through inject() would inherit the current SCOPED restrictions, provide gate, singleton registry semantics, cycle detection sentinel, parent-context compatibility checks, and scope lifecycle hook behavior because these rules are implemented inside inject() and InjectScope rather than in the decorator.

### Package-level exposure is currently top-level only
- **Location**: @/src/index.ts:1-2, @/package.json:75-79
- **What it means**: The published package surface is routed through the top-level entry point that re-exports both core and react. There is no separate declared package export for a core-only subpath in package.json.

## Code References
- @/src/core/di.types.ts:8-34 - Public DI type definitions, including InjectOptions and ProvideOptions.
- @/src/core/injectable.ts:7-15 - Decorator stores DI metadata on the constructor.
- @/src/core/getInjectOptions.ts:21-70 - Normalization from constructor or InjectOptions into computed options.
- @/src/core/inject.ts:12-117 - Main injection algorithm for TRANSIENT, SINGLETON, and SCOPED lifetimes.
- @/src/core/inject.ts:120-137 - inject.provide implementation.
- @/src/core/InjectScope.ts:5-25 - Injection context stack and instance construction wrapper.
- @/src/core/Scope.ts:14-51 - Scoped storage, parent traversal, and lifecycle entry points.
- @/src/core/errors.ts:4-25 - Dedicated DI error classes.
- @/src/core/getInjectorName.ts:3-13 - Parent injector name lookup from InjectScope state.
- @/src/core/index.ts:1-17 - Core export surface.
- @/src/index.ts:1-2 - Package source root re-exports core and react.
- @/src/react/index.ts:1-2 - React exports referenced by the package root.
- @/package.json:75-79 - Published package export map.
- @/docs/concepts.md:11-64 - Documented lifetime model and scope inheritance example.
- @/docs/concepts.md:121-201 - Documented requireProvide, lifecycle callbacks, cycle detection, and compatibility rules.
- @/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/TASK.md:17-35 - Expected future API example and the assumption about not changing inject beyond define.