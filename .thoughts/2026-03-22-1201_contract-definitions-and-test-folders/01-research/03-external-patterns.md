---
workflow_version: b0.5
title: "External Research: Contract tokens and test organization"
date: 2026-03-22
stage: 01-research
role: rdpi-external-researcher
language: en
rdpi-version: b0.5
---

## Contract token patterns

### Comparative analysis

| Library | Concrete API shape or convention | Problem solved | Observable trade-offs or pitfalls | Evidence type | Confidence |
|---------|----------------------------------|----------------|-----------------------------------|---------------|------------|
| Angular | `new InjectionToken<T>('Description', { providedIn?, factory? })`; provider objects use `provide` with `useClass`, `useValue`, `useFactory`, or `useExisting` | Gives runtime identity to interfaces, functions, primitives, and other non-reified types while preserving generic typing | Token identity is by object reference, not by description string; creating multiple token instances with the same description creates different DI keys; `providedIn: NgModule` and `providedIn: 'any'` are deprecated in current docs | Documented practice, library behavior | High |
| InversifyJS | Service identifiers can be symbols, strings, or classes; docs recommend symbols for dependency inversion; binding API is `container.bind(id).to(...)` with scope methods like `inSingletonScope()` | Separates contract identity from implementation class and supports interface-style injection in TypeScript | Interface-style injection still requires explicit identifiers and decorators such as `@inject`; async bindings require `getAsync` or `getAllAsync`; autobinding is optional and disabled by default | Documented practice, library behavior | High |
| tsyringe | `InjectionToken<T> = constructor<T> | DelayedConstructor<T> | string | symbol`; registration uses `container.register(token, { useClass | useValue | useFactory | useToken })`; injection uses `@inject(token)` | Supports interface and primitive injection in a constructor-injection container without introducing a dedicated token class | Non-class tokens are explicit strings or symbols rather than first-class token objects; decorator metadata and `reflect-metadata` setup are required; unresolved optional dependencies need explicit `{ isOptional: true }` | Documented practice, library behavior | High |
| NestJS | Provider objects use `{ provide: token, useClass | useValue | useFactory | useExisting }`; non-class tokens can be strings, symbols, or enums and are consumed with `@Inject(token)` | Makes environment-specific, mock, alias, and external-value bindings explicit in module metadata | Tokens are often plain strings or symbols, so naming centralization matters; docs distinguish `useExisting` aliasing from `useClass`, which creates separate instances | Documented practice | High |

### Established practices

- Angular uses dedicated token objects for non-class dependencies because TypeScript interfaces do not exist at runtime. The docs explicitly state that `InjectionToken` is the runtime value Angular uses for interfaces, functions, arrays, parameterized types, and other non-reified values, while the generic parameter preserves type information. Sources: https://angular.dev/api/core/InjectionToken, https://angular.dev/guide/di/defining-dependency-providers#can-typescript-interfaces-be-identifiers-for-injection. Evidence: documented practice. Confidence: High.

- Angular treats the token object instance as the identifier; the description string is debug-only. Both the API page and guide state that using a different `InjectionToken` instance, even with the same description, produces a different DI key. Sources: https://angular.dev/api/core/InjectionToken, https://angular.dev/guide/di/defining-dependency-providers#what-is-an-injectiontoken. Evidence: documented practice, library behavior. Confidence: High.

- Angular exposes both token-definition and provider-definition layers. The token object is created first, and the actual binding is later expressed with provider objects using `provide` plus `useClass`, `useValue`, `useFactory`, or `useExisting`. The same docs also show library-author-facing `provide*` functions that hide internal tokens behind provider factories. Sources: https://angular.dev/guide/di/defining-dependency-providers#provider-configuration-object, https://angular.dev/guide/di/defining-dependency-providers#the-provide-pattern. Evidence: documented practice. Confidence: High.

- InversifyJS documents symbols as the recommended identifier form for dependency inversion, while still supporting classes and string literals as service identifiers. This shows an established split between class-as-token and explicit token forms, depending on whether the dependency has runtime class identity. Sources: https://inversify.io/docs/introduction/dependency-inversion/, https://inversify.io/docs/next/introduction/dependency-inversion/. Evidence: documented practice. Confidence: High.

- InversifyJS models token binding as an explicit container operation. `container.bind(identifier).to(...)` or related binding forms establish the mapping, and scope is configured separately via `inTransientScope`, `inSingletonScope`, or `inRequestScope`. Sources: https://inversify.io/docs/fundamentals/binding/. Evidence: documented practice, library behavior. Confidence: High.

- tsyringe does not introduce a dedicated token class. Its documented `InjectionToken` type is a union of constructor, delayed constructor, string, or symbol, and providers are registered separately with `register`. This produces a token-definition style centered on primitive or constructor identifiers rather than object-backed token instances. Sources: https://github.com/microsoft/tsyringe, https://www.npmjs.com/package/tsyringe. Evidence: documented practice, library behavior. Confidence: High.

- tsyringe supports token aliasing and conditional resolution through provider forms rather than through a distinct token-definition API. The docs show `useToken` for aliasing and `predicateAwareClassFactory` for conditional selection between implementations. Sources: https://github.com/microsoft/tsyringe, https://www.npmjs.com/package/tsyringe. Evidence: documented practice, library behavior. Confidence: High.

- NestJS uses provider objects with explicit tokens and binding strategies that mirror Angular's provider vocabulary. The official custom-providers guide documents `useValue`, `useClass`, `useFactory`, and `useExisting`, plus non-class tokens via strings, symbols, or enums. Source: https://docs.nestjs.com/fundamentals/custom-providers. Evidence: documented practice. Confidence: High.

- NestJS documentation explicitly advises defining non-class tokens in a separate file rather than scattering string literals inline. This is documentation-backed guidance for token centralization rather than a runtime requirement. Source: https://docs.nestjs.com/fundamentals/custom-providers. Evidence: documented practice. Confidence: Medium.

### Opinions and speculation

- Angular's guide presents `provide*` helper functions for library authors as a best-practice packaging pattern because they encapsulate internal tokens and preserve flexibility for future internal changes. This is guidance from the official docs, but it is still architectural advice rather than a required runtime behavior. Source: https://angular.dev/guide/di/defining-dependency-providers#why-use-provider-functions-instead-of-direct-configuration. Evidence: documented recommendation. Confidence: Medium.

- NestJS's advice to place tokens in a dedicated constants file is described as a clean-code practice rather than a technical requirement. Source: https://docs.nestjs.com/fundamentals/custom-providers. Evidence: documented recommendation. Confidence: Medium.

- No high-quality primary-source material was found that establishes a single universal best practice across these ecosystems for whether tokens should be dedicated objects, symbols, or strings. The documented patterns differ by framework and by how much runtime metadata the container relies on. Sources: Angular, InversifyJS, tsyringe, and NestJS docs listed in this document. Evidence: synthesis across primary docs. Confidence: Medium.

### Pitfalls

- Angular token descriptions are not unique identifiers. Recreating `new InjectionToken<T>('SameName')` in multiple places leads to mismatched providers and lookups because Angular keys by object identity. Sources: https://angular.dev/api/core/InjectionToken, https://angular.dev/guide/di/defining-dependency-providers#what-is-an-injectiontoken. Evidence: documented practice, library behavior. Confidence: High.

- InversifyJS interface-style injection requires explicit identifier wiring even when classes can be resolved from metadata. The docs show symbol-based `ServiceIdentifier` usage for interfaces and separately document metadata-based class resolution, which means class-only ergonomics do not automatically extend to interface contracts. Sources: https://inversify.io/docs/introduction/dependency-inversion/, https://inversify.io/docs/fundamentals/binding/. Evidence: documented practice. Confidence: High.

- InversifyJS async bindings change the retrieval API. The binding docs warn that async bindings require `Container.getAsync` or `Container.getAllAsync`, so token-to-provider mappings are not always retrievable through the same synchronous resolution path. Source: https://inversify.io/docs/fundamentals/binding/. Evidence: documented practice, library behavior. Confidence: High.

- tsyringe requires explicit metadata setup for decorator-driven injection. Its installation docs require `experimentalDecorators`, `emitDecoratorMetadata`, and a Reflect polyfill, so token/provider patterns are coupled to compiler and runtime metadata configuration. Sources: https://github.com/microsoft/tsyringe, https://www.npmjs.com/package/tsyringe. Evidence: documented practice. Confidence: High.

- tsyringe differentiates missing registrations from optional injection through explicit options. The docs state that `@inject()` throws by default when no registration is found unless `{ isOptional: true }` is passed. Sources: https://github.com/microsoft/tsyringe, https://www.npmjs.com/package/tsyringe. Evidence: documented practice, library behavior. Confidence: High.

- NestJS distinguishes aliasing from replacement. The custom-providers guide warns that `useExisting` shares the same provider instance while `useClass` can produce a separate class-backed provider path, so the binding form changes lifecycle semantics. Source: https://docs.nestjs.com/fundamentals/custom-providers. Evidence: documented practice. Confidence: High.

### Performance

- Angular documents `InjectionToken` factories with `providedIn` as tree-shakeable and "only included if actually used" for non-class values. This is an official performance-related claim tied to token factories rather than an independent benchmark. Source: https://angular.dev/guide/di/defining-dependency-providers#when-to-use-injectiontoken-with-factory-functions. Evidence: documented practice. Confidence: Medium.

- Angular's guide contrasts application-wide providers with component-scoped providers and notes different memory and bundling implications. Application-level providers reduce duplicated instances but are described as globally included, while component-level providers create new instances per component and are bundled with that component. Source: https://angular.dev/guide/di/defining-dependency-providers#where-can-you-specify-providers. Evidence: documented guidance. Confidence: Medium.

- No primary-source benchmark data was found in the reviewed Angular, InversifyJS, tsyringe, or NestJS materials comparing token-object, symbol-token, and string-token lookup overhead. Evidence remains documentation-level rather than benchmark-backed. Sources: all DI sources listed below. Evidence: absence of benchmark data in primary docs. Confidence: Medium.

## Test organization patterns

### Comparative analysis

| Tooling | Concrete API shape or convention | Problem solved | Observable trade-offs or pitfalls | Evidence type | Confidence |
|---------|----------------------------------|----------------|-----------------------------------|---------------|------------|
| Vitest | Default `include` is `['**/*.{test,spec}.?(c|m)[jt]s?(x)']`; tests are discovered by filename pattern; setup uses `test.setupFiles`; separate-file tests are the default, while in-source tests require `includeSource` | Supports colocated or centralized test files as long as filenames match the glob; provides per-test-file setup hooks | A `__tests__` directory alone is not enough unless files still end with `.test` or `.spec`; overriding `include` replaces defaults unless `configDefaults.include` is spread back in; setup files rerun before each test file | Documented practice, library behavior | High |
| Jest | Default `testMatch` explicitly includes `**/__tests__/**/*.?([mc])[jt]s?(x)` and `**/?(*.)+(spec|test).?([mc])[jt]s?(x)`; `roots` can separate source and test trees | Built-in support for both `__tests__` directories and suffix-based colocated tests; configurable discovery roots | `testMatch` and coverage glob negation are order-sensitive; moving tests outside existing roots also affects where Jest looks for manual mocks | Documented practice, library behavior | High |

### Established practices

- Vitest's default discovery is filename-based, not folder-name-based. The official `include` default is `['**/*.{test,spec}.?(c|m)[jt]s?(x)']`, so files moved into a `__tests__` directory are still only discovered if their filenames retain `.test` or `.spec` suffixes. Sources: https://vitest.dev/guide/, https://vitest.dev/config/include. Evidence: documented practice, library behavior. Confidence: High.

- Vitest treats separate test files as the normal path and in-source tests as a distinct optional feature. The in-source testing guide requires `includeSource` and explicitly recommends separate test files for more complex tests such as components or E2E scenarios. Sources: https://vitest.dev/guide/in-source, https://vitest.dev/guide/. Evidence: documented practice. Confidence: High.

- Vitest setup files are configured through `test.setupFiles` and run before each test file in the same process. This means shared setup code remains independent of whether tests are source-adjacent or centralized in `__tests__` folders. Source: https://vitest.dev/config/setupfiles. Evidence: documented practice, library behavior. Confidence: High.

- Jest has first-class `__tests__` discovery by default. Its default `testMatch` and `testRegex` both explicitly include files under `__tests__` directories, in addition to `.test` and `.spec` suffix patterns. Source: https://jestjs.io/docs/configuration#testmatch-arraystring, https://jestjs.io/docs/configuration#testregex-string--arraystring. Evidence: documented practice, library behavior. Confidence: High.

- Jest's `roots` option is the documented way to limit discovery to specific source and test trees. The same docs note that `roots` also affects where manual mocks in `__mocks__` are found. Source: https://jestjs.io/docs/configuration#roots-arraystring. Evidence: documented practice, library behavior. Confidence: High.

### Opinions and speculation

- Vitest's in-source guide says separate test files are recommended for more complex tests such as component and E2E tests. This is documentation-backed guidance about organization, not a hard runtime rule. Source: https://vitest.dev/guide/in-source. Evidence: documented recommendation. Confidence: Medium.

- No primary-source documentation was found from Vitest or Jest that claims `__tests__` directories are universally superior to source-adjacent `.test.ts` files. The official docs describe discovery mechanics and configuration, but do not prescribe one universal layout for all library codebases. Sources: https://vitest.dev/guide/, https://vitest.dev/config/include, https://jestjs.io/docs/configuration. Evidence: synthesis across primary docs. Confidence: Medium.

### Pitfalls

- In Vitest, replacing `test.include` discards default globs unless the configuration explicitly spreads `configDefaults.include`. This is an official warning on the `include` page, and it matters when reorganizing tests into new directories. Source: https://vitest.dev/config/include. Evidence: documented practice, library behavior. Confidence: High.

- In Vitest, setup files rerun before each test file and share the same process as tests. The docs warn that if isolation is disabled, imported modules stay cached while the setup file executes again, which can duplicate global initialization unless guarded. Source: https://vitest.dev/config/setupfiles. Evidence: documented practice, library behavior. Confidence: High.

- In Jest, glob ordering matters for both `testMatch`-style matching and coverage-related glob exclusion. The configuration docs show that an early negation such as `!**/__fixtures__/**` can be overridden by a later positive glob. Source: https://jestjs.io/docs/configuration#testmatch-arraystring, https://jestjs.io/docs/configuration#collectcoveragefrom-array. Evidence: documented practice, library behavior. Confidence: High.

- In Jest, moving tests into directories outside configured `roots` can also affect manual mock discovery, because `__mocks__` must live within one of the configured roots. Source: https://jestjs.io/docs/configuration#roots-arraystring. Evidence: documented practice, library behavior. Confidence: High.

- Jest warns that `testRegex` is matched against the absolute file path, so a directory name that accidentally matches the regex can cause unexpected files to run as tests. Source: https://jestjs.io/docs/configuration#testregex-string--arraystring. Evidence: documented practice, library behavior. Confidence: High.

### Performance

- Vitest states that test files run in parallel by default, and setup files execute before each test file in the same process. This is a runtime characteristic relevant to how centralized test trees share setup cost, but the docs do not provide a benchmark comparing colocated and `__tests__` layouts. Source: https://vitest.dev/config/setupfiles. Evidence: documented behavior. Confidence: Medium.

- Jest documents that `roots` constrains where files are searched, which implies filesystem-scan scope can be reduced by narrowing the search area. The docs describe the mechanism but do not provide a benchmark for directory-layout changes. Source: https://jestjs.io/docs/configuration#roots-arraystring. Evidence: documented behavior. Confidence: Medium.

- No primary-source benchmark data was found in the reviewed Vitest or Jest materials measuring performance differences between source-adjacent tests and `__tests__` directories for TypeScript library repositories. Sources: https://vitest.dev/guide/, https://vitest.dev/config/include, https://jestjs.io/docs/configuration. Evidence: absence of benchmark data in primary docs. Confidence: Medium.

## Sources

- https://angular.dev/api/core/InjectionToken — Angular `InjectionToken` API reference, constructor shape, identity caveats, factory options.
- https://angular.dev/guide/di/defining-dependency-providers — Angular provider identifiers, token usage, provider object patterns, and library-author `provide*` guidance.
- https://inversify.io/docs/introduction/dependency-inversion/ — InversifyJS recommendation for symbol-based service identifiers and interface-style injection examples.
- https://inversify.io/docs/next/introduction/dependency-inversion/ — Cross-check of the same InversifyJS pattern in the next-version docs.
- https://inversify.io/docs/fundamentals/binding/ — InversifyJS binding API, scopes, autobinding, and async binding behavior.
- https://github.com/microsoft/tsyringe — tsyringe README and API docs for tokens, providers, optional injection, factories, and metadata requirements.
- https://www.npmjs.com/package/tsyringe — tsyringe package page confirming current published version and mirroring the README API.
- https://docs.nestjs.com/fundamentals/custom-providers — NestJS custom providers, non-class tokens, aliasing, and factory/value/class provider patterns.
- https://vitest.dev/guide/ — Vitest getting-started guide, default filename convention, and configuration overview.
- https://vitest.dev/config/include — Vitest default `include` glob and warning that overriding it replaces defaults.
- https://vitest.dev/config/setupfiles — Vitest `setupFiles` semantics and isolation caveats.
- https://vitest.dev/guide/in-source — Vitest in-source testing, `includeSource`, and recommendation to use separate files for more complex tests.
- https://jestjs.io/docs/configuration — Jest configuration reference for `testMatch`, `testRegex`, `roots`, setup behavior, and glob-order caveats.