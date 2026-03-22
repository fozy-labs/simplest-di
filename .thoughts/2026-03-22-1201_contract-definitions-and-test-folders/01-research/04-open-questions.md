---
workflow_version: b0.5
title: "Open Questions: Contract definitions and test folder relocation"
date: 2026-03-22
stage: 01-research
role: rdpi-questioner
language: en
rdpi-version: b0.5
---

## High Priority

### Q1: What is the intended public API and export surface for contract definitions?

**Context**: The task example introduces `inject.define<T>(name)` and shows consumers calling `inject(ChatDataSource)` after a prior `ChatDataSource.bind(...)` step. Current package exposure is top-level only through `@/src/index.ts`, which re-exports core and react together, and there is no declared core-only subpath export in `@/package.json`. The current public surface exports `inject` plus core types and React helpers, but no contract-definition type or helper exists yet. Research also shows that external ecosystems separate token definition and provider definition in different ways, and some expose dedicated token classes while others only expose registration APIs.

**Concrete ambiguity or constraint**: The next stage must decide whether the new capability is limited to an attached method on `inject`, whether any new named exports or public types are required for consumers, and whether the export surface remains package-root-only or introduces a more explicit contract-definition surface.

**Options**:
1. Keep the public entry point centered on `inject.define` only — Pros: smallest visible surface change and aligns with the task assumption that `inject` should ideally only gain `define`; Cons: may hide any required token or binding types behind a method-attached API and may make public typing less discoverable.
2. Expose `inject.define` plus one or more named contract-related exports — Pros: clearer public typing and easier documentation of the token/binding contract; Cons: expands the published surface beyond the task example and raises compatibility/documentation scope.
3. Introduce a broader package-surface change such as new subpath or grouped exports — Pros: clearer separation between core DI contracts and React integration; Cons: conflicts with the repository's current top-level-only export map and would increase packaging impact.

**Risks**: If this stays unresolved, design cannot determine the stable API shape, export tests may encode the wrong contract, and documentation may drift from the published package surface.

**Researcher recommendation**: Must be resolved in design.

---

### Q2: What runtime identity should a defined contract use?

**Context**: Current constructor-based injection uses the constructor itself as the token, while the object path in `@/src/core/getInjectOptions.ts` accepts an arbitrary `token` and forwards it into the existing runtime. Singleton storage is a `Map` keyed by token, but scoped storage in `@/src/core/Scope.ts` is typed as `WeakMap<Constructor, any>`, even though `inject()` already passes `token as any` into that scoped store. External research shows conflicting but established patterns: Angular uses dedicated token objects with object-identity semantics, while InversifyJS, tsyringe, and NestJS support symbols and/or strings.

**Concrete ambiguity or constraint**: The next stage must decide whether contract identity is name-based, symbol-based, object-instance-based, or otherwise constrained so that it works consistently across singleton storage, scoped storage, and repeated definition sites.

**Options**:
1. Object-instance identity per `define()` call — Pros: aligns with Angular-style token identity and avoids string-name collisions; Cons: repeated `define('SameName')` calls would not match unless shared from one module, and the returned object shape becomes part of the public contract.
2. Symbol-based identity — Pros: explicit runtime uniqueness and compatible with non-class contracts; Cons: debug names and serialization remain secondary concerns, and the design still must define whether symbols are internally generated or externally supplied.
3. String-name identity — Pros: simple mental model and easy debugging; Cons: creates collision risk and conflicts with research showing that several DI systems avoid using display names as unique runtime identity.

**Risks**: If token identity is not fixed in design, bindings and lookups may silently mismatch, repeated definitions may create accidental duplicate contracts, and scoped storage requirements may contradict the chosen token form.

**Researcher recommendation**: Must be resolved in design.

---

### Q3: How should binding semantics work for environment-specific implementation selection?

**Context**: The task example shows `ChatDataSource.bind(ElectronChatDataSource)` or `ChatDataSource.bind(CloudChatDataSource)` before injection. Current repository behavior has no separate binding store: `inject.provide` re-enters `inject()` with `requireProvide` forced to `false`, lifetimes are enforced inside `inject()`, and all lifecycle and compatibility rules are inside the existing injection algorithm. External research shows that other DI systems typically separate token definition from provider registration, and they expose multiple binding forms such as class, factory, value, or alias providers.

**Concrete ambiguity or constraint**: The next stage must decide what `bind` means in this repository: whether it is a one-time global binding, a rebinding mechanism, a thin wrapper over the existing provide path, or a new registration concept with different lifetime behavior.

**Options**:
1. Treat binding as global contract-to-implementation registration before normal resolution — Pros: fits the task example's environment switch and matches the external token-plus-provider split; Cons: the repository currently has no distinct binding store, so semantics relative to existing `provide` and cached instances remain undefined.
2. Treat binding as sugar over existing `inject.provide` behavior — Pros: keeps the runtime closer to current semantics; Cons: the example API suggests contract-first registration, while current provide semantics are scope- and lifetime-aware in ways that may not map cleanly to contract objects.
3. Allow multiple binding forms or scopes of binding — Pros: closer to external ecosystems with class/value/factory/alias patterns; Cons: significantly increases semantic surface and weakens the task assumption that `inject` needs minimal change.

**Risks**: Leaving this unresolved blocks any precise API contract for environment-specific implementations and risks introducing a `bind` method whose behavior diverges from existing lifetime, caching, and provide semantics.

**Researcher recommendation**: Must be resolved in design.

---

### Q4: What type shape must `inject.define<T>(name)` return so that it fits the current `inject()` and `provide()` contracts?

**Context**: The current type layer is still constructor-oriented in several seams: `ProvideOptions<T>` is `InjectOptions<T> | T` where `T` extends `Constructor`, constructor normalization derives `new arg()` and `arg.name`, and `Scope` APIs are typed around constructors even though the object-based path already accepts arbitrary tokens. The task specifically asks for declaring dependency interfaces ahead of time, which means the generic type parameter will not have a runtime class value. External research shows multiple patterns here: dedicated token objects, string-or-symbol unions, and separate provider descriptors.

**Concrete ambiguity or constraint**: The next stage must decide whether the defined contract is itself a valid `inject()` argument, a valid `provide()` argument, both, or neither without additional wrapping, and how TypeScript should enforce that a bound implementation satisfies `T`.

**Options**:
1. Return a first-class contract object consumed directly by `inject()` and possibly by registration APIs — Pros: closest to the task example and to object-token ecosystems; Cons: requires a clear public type contract and may expose internal token structure.
2. Return a descriptor that still needs conversion into existing `InjectOptions` or provider inputs — Pros: keeps current internal shapes more explicit; Cons: diverges from the task example's direct `inject(ChatDataSource)` usage.
3. Use overloads or conditional typing to preserve constructor-style ergonomics alongside contract definitions — Pros: may minimize source breakage for existing users; Cons: increases type-system complexity around already mixed constructor/object paths.

**Risks**: If this is postponed, design cannot verify whether the generic API is type-safe, whether it leaks runtime-only fields into public types, or whether existing constructor-based overloads remain unambiguous.

**Researcher recommendation**: Must be resolved in design.

---

### Q5: Is the task assumption that `inject` needs no changes beyond adding `define` actually compatible with current scope and storage internals?

**Context**: The task states an assumption that the inject mechanism should ideally not require changes beyond adding `define`. Research shows the object-based path already exists, but also shows a mismatch: singleton resolution already supports arbitrary token keys through `Map<unknown, any>`, while scoped storage is typed to constructors and receives broader tokens only through `as any`. All scoped restrictions, lifecycle hooks, parent-compatibility checks, and `requireProvide` behavior are implemented inside `inject()` rather than in decorators.

**Concrete ambiguity or constraint**: The next stage must decide whether the assumption is a hard constraint, a preference, or an aspirational goal, because contract-definition tokens may require internal broadening or explicit limitations to remain compatible with scoped resolution.

**Options**:
1. Treat the assumption as a hard design constraint — Pros: keeps the feature narrowly scoped; Cons: may force the contract API to fit existing storage and lifecycle semantics even if that limits supported token forms.
2. Treat the assumption as a preference that can be broken if research-backed incompatibilities require it — Pros: allows the design to address constructor-centric seams directly; Cons: expands scope and may affect compatibility claims.
3. Keep the assumption unresolved until implementation — Pros: preserves flexibility temporarily; Cons: pushes a foundational compatibility decision too late in the pipeline.

**Risks**: If this remains open, the design may accidentally promise a contract API that cannot work with scoped storage or existing `requireProvide` semantics without hidden runtime changes.

**Researcher recommendation**: Must be resolved in design.

---

## Medium Priority

### Q6: What should happen when the same contract is bound more than once or after it has already been resolved?

**Context**: The task example shows a single environment branch choosing one implementation. Current runtime behavior caches singleton instances by token and stores scoped instances in scope state; external patterns distinguish aliasing from replacement and often make registration timing explicit. Research did not find an existing repository contract for rebinding because current usage is primarily constructor-driven and `inject.provide` is not framed as a reusable contract-registration API.

**Concrete ambiguity or constraint**: The next stage must decide whether contract bindings are immutable, replaceable before first resolution only, replaceable at any time, or differentiated by binding kind.

**Options**:
1. First binding wins — Pros: predictable for bootstrap-time configuration; Cons: late environment selection or test overrides become constrained.
2. Last binding wins until resolution, but rebinding after resolution is restricted or undefined — Pros: mirrors many container bootstrapping patterns; Cons: requires explicit rules for singleton and scoped caches.
3. Rebinding is always allowed — Pros: flexible for tests and dynamic environments; Cons: interacts ambiguously with cached instances and lifecycle cleanup.

**Risks**: If unresolved, consumers and tests may rely on inconsistent rebinding behavior, leading to stale singletons, scope pollution, or environment-dependent bugs.

**Researcher recommendation**: Must be resolved in design.

---

### Q7: What target test topology is actually intended by “move tests into __tests__ directories”?

**Context**: The task says to move tests in the core and react folders into `__tests__` directories. Current repository topology already includes `@/src/__tests__/setup.ts`, `@/src/__tests__/helpers`, and `@/src/__tests__/integration`, while the in-scope moved files currently live adjacent to source under `@/src/core` and `@/src/react`. External research shows that neither Vitest nor Jest prescribes one universal layout, and Vitest discovery is filename-driven rather than directory-name-driven.

**Concrete ambiguity or constraint**: The next stage must decide whether the move means per-module directories such as `src/core/__tests__` and `src/react/__tests__`, a centralized tree such as `src/__tests__/core` and `src/__tests__/react`, or some hybrid that preserves existing conventions.

**Options**:
1. Per-module `__tests__` directories inside `src/core` and `src/react` — Pros: keeps tests near the code they exercise and matches the task wording literally; Cons: introduces multiple `__tests__` conventions alongside the existing central `src/__tests__` tree.
2. Centralize moved tests under the existing `src/__tests__` hierarchy — Pros: reuses the repository's current shared test tree and setup path; Cons: may weaken locality and requires a naming convention for mapping tests back to source modules.
3. Use different layouts for core and react tests based on their current import patterns — Pros: can reflect practical differences such as the relative-import hook tests; Cons: increases convention complexity.

**Risks**: If unresolved, design and plan cannot stabilize folder conventions, and the move may create a mixed topology that is harder to navigate and document.

**Researcher recommendation**: Must be resolved in design.

---

### Q8: How should the two React hook tests that rely on same-directory relative imports behave after relocation?

**Context**: Most moved-test candidates import through the `@` alias, but `@/src/react/useConstant.test.ts` imports `./useConstant` and `@/src/react/useSafeMount.test.tsx` imports `./useSafeMount`. Research identifies these as the only direct same-folder test-to-source pairs within the move scope.

**Concrete ambiguity or constraint**: The next stage must decide whether relocation should preserve adjacency assumptions through mirrored test placement, or whether the imports are expected to change to alias-based or other non-relative forms.

**Options**:
1. Preserve local-style imports by choosing a layout that keeps the source-relative path simple — Pros: minimizes per-file import rewrites; Cons: constrains directory design around two files.
2. Standardize moved tests on alias-based imports — Pros: aligns these two tests with the broader repository pattern; Cons: changes an existing local-coupling convention and may affect how internal-only modules are referenced.
3. Permit a mixed import strategy after the move — Pros: lowest short-term friction; Cons: retains inconsistency inside the same test suite.

**Risks**: If this stays open, relocation planning cannot estimate required import churn, and the resulting test tree may encode inconsistent import conventions.

**Researcher recommendation**: Can be resolved in plan if design first fixes the target topology.

---

### Q9: Which test-discovery and compilation assumptions are allowed to change as part of the relocation?

**Context**: Shared Vitest configuration includes `src/**/*.test.ts` and `src/**/*.test.tsx`, while setup is pinned to `src/__tests__/setup.ts`. `@/tsconfig.test.json` includes both suffix-based test globs and the explicit `src/__tests__/**` tree. External research confirms that Vitest does not discover tests merely because they are under `__tests__`; filename suffixes still matter unless configuration changes.

**Concrete ambiguity or constraint**: The next stage must decide whether the move is required to fit the current include/setup conventions unchanged, or whether config updates are in scope as long as discovery remains correct.

**Options**:
1. Preserve the current discovery contract unchanged — Pros: reduces configuration risk and keeps the move mostly structural; Cons: constrains naming and placement decisions.
2. Allow local Vitest and/or TypeScript config changes to reflect the new topology — Pros: gives more flexibility if a central `__tests__` layout is chosen; Cons: introduces broader toolchain impact and potential divergence from the shared config package.
3. Defer discovery-rule decisions until implementation — Pros: postpones configuration work; Cons: makes the plan unreliable because discovery behavior is a prerequisite for the move.

**Risks**: If unresolved, relocated tests may stop being discovered or type-checked, and implementation may unexpectedly need to modify shared or local test configuration.

**Researcher recommendation**: Must be resolved in plan after design fixes the target topology.

---

## Low Priority

### Q10: What level of documentation and public-surface verification must accompany the feature if the API and test layout change together?

**Context**: The repository already has public-surface coverage in `@/src/__tests__/integration/exports.test.ts` and user-facing documentation in `@/docs/concepts.md` and `@/docs/react-integration.md`. The task combines a new DI contract-definition capability with test relocation, but the research inputs do not state whether docs and export-surface assertions are mandatory deliverables in the same change.

**Concrete ambiguity or constraint**: The next stage must decide whether documentation and export-verification updates are part of the same feature scope or can follow after implementation stabilizes.

**Options**:
1. Require documentation and export-surface updates in the same feature — Pros: keeps published behavior, docs, and tests aligned; Cons: increases feature scope.
2. Limit the feature to code and tests first, with docs/export verification deferred — Pros: narrows immediate implementation; Cons: increases the chance of temporary mismatch between behavior and published guidance.

**Risks**: If left implicit, implementation may land with incomplete user-facing guidance or with export assertions that no longer reflect the intended public API.

**Researcher recommendation**: Can be resolved in plan.

## User Answers

### Q1: What is the intended public API and export surface for contract definitions?
**Decision**: Keep the public API centered on `inject.define` only.

### Q2: What runtime identity should a defined contract use?
**Decision**: Must be resolved in design.

### Q3: How should binding semantics work for environment-specific implementation selection?
**Decision**: `define()` should return an object with a `bind` method, and `bind` should write the binding into the object's internal state.

### Q4: What type shape must `inject.define<T>(name)` return so that it fits the current `inject()` and `provide()` contracts?
**Decision**: Return an object that can be passed directly to `inject()`.

### Q5: Is the task assumption that `inject` needs no changes beyond adding `define` actually compatible with current scope and storage internals?
**Decision**: Treat the assumption as a preference rather than a hard constraint.

### Q6: What should happen when the same contract is bound more than once or after it has already been resolved?
**Decision**: Rebinding is allowed only before the first `getInstance()` call.

### Q7: What target test topology is actually intended by “move tests into __tests__ directories”?
**Decision**: Use per-module `__tests__` directories such as `src/core/__tests__` and `src/react/__tests__`.

### Q8: How should the two React hook tests that rely on same-directory relative imports behave after relocation?
**Decision**: Must be resolved in design.

### Q9: Which test-discovery and compilation assumptions are allowed to change as part of the relocation?
**Decision**: Must be resolved in design.

### Q10: What level of documentation and public-surface verification must accompany the feature if the API and test layout change together?
**Decision**: Include documentation updates, export verification, and a `docs/CHANGELOG.md` update in the same feature.