---
workflow_version: b0.5
title: "Phase 1: Contract definition runtime"
date: 2026-03-22
stage: 03-plan
role: rdpi-planner
language: en
rdpi-version: b0.5
---

## Goal
Implement the contract-definition runtime centered on `inject.define`, broaden constructor-oriented core seams to accept contract objects as inject targets, and add pre-relocation core coverage for the approved binding, identity, lifecycle, cache, and diagnostic rules.

## Dependencies
- **Requires**: None
- **Blocks**: Phase 2 and Phase 3

## Execution
Sequential. This phase must land first because later phases depend on the new runtime semantics and on the updated unit coverage that will be relocated afterward.

## Tasks

### Task 1.1: Reconcile the DI type model with the approved contract architecture
- **File**: `src/core/di.types.ts`
- **Action**: Modify
- **Description**: Replace constructor-only generic seams with a contract-capable type model that still preserves the constructor path. This task is the explicit reconciliation point for the approved-design hotspot where `03-model.md` currently sketches provider typing around `Constructor<T>` instead of the contract instance type `T`.
- **Details**: Introduce the defined-contract target/provider shapes needed by `inject.define`, keep `InjectOptions` and `ProvideOptions` compatible with constructor-backed and object-shaped providers, allow object-backed token identity for contract caches, and keep the public API centered on the existing `inject` export rather than a new named contract export. [ref: ../02-design/01-architecture.md#runtime-touchpoints-and-required-broadening] [ref: ../02-design/03-model.md#type-model] [ref: ../02-design/04-decisions.md#adr-1-keep-the-public-api-centered-on-injectdefine] [ref: ../02-design/04-decisions.md#adr-2-use-the-defined-contract-object-instance-as-runtime-token-identity] [ref: ../02-design/04-decisions.md#adr-3-store-binding-state-on-the-contract-and-expose-it-through-contract-backed-inject-options]
- **Complexity**: High

### Task 1.2: Normalize bound contracts through the existing object-input path
- **File**: `src/core/getInjectOptions.ts`
- **Action**: Modify
- **Description**: Teach normalization to recognize a defined contract, reject unbound contracts before lifetime dispatch, and convert the bound provider into contract-backed computed options that preserve object identity, object-shaped provider support, and design-approved diagnostic naming.
- **Details**: Detect contract objects created by `inject.define`, validate that a binding exists, normalize constructor-backed or object-shaped provider input into one computed descriptor, rewrite token ownership to the contract object, and ensure the define-time name remains the primary diagnostic label while the bound implementation name stays available for error/debug text. [ref: ../02-design/01-architecture.md#contract-participation-in-inject] [ref: ../02-design/01-architecture.md#binding-storage] [ref: ../02-design/02-dataflow.md#flow-1-contract-definition-and-environment-specific-binding-selection] [ref: ../02-design/02-dataflow.md#flow-5-unbound-contract-failure]
- **Complexity**: High

### Task 1.3: Add `inject.define` and enforce contract cache/binding semantics in the runtime
- **File**: `src/core/inject.ts`
- **Action**: Modify
- **Description**: Attach `define` to the exported `inject` function, persist contract binding state on the returned contract object, allow rebinding only before first resolution, and keep singleton/scoped/transient resolution owned by the contract token rather than by the bound implementation constructor.
- **Details**: Implement `inject.define<T>(name)` as the only new public entry, keep `bind()` lazy, freeze rebinding on first `getInstance()` path, treat binding as registration for bound scoped contracts, preserve constructor-based resolution unchanged, and avoid any new barrel export or subpath requirement. [ref: ../02-design/01-architecture.md#public-api-boundary] [ref: ../02-design/01-architecture.md#scoped-singleton-and-transient-semantics] [ref: ../02-design/02-dataflow.md#flow-2-first-resolution-of-a-bound-contract] [ref: ../02-design/02-dataflow.md#flow-3-bound-scoped-contract-resolution] [ref: ../02-design/04-decisions.md#adr-4-allow-rebinding-only-before-first-resolution] [ref: ../02-design/04-decisions.md#adr-5-treat-binding-as-registration-for-scoped-contracts-while-preserving-existing-scoped-runtime-rules]
- **Complexity**: High

### Task 1.4: Broaden scoped storage to accept contract-object tokens
- **File**: `src/core/Scope.ts`
- **Action**: Modify
- **Description**: Expand the scoped instance store from constructor-only typing to object-backed contract tokens without changing parent lookup, sentinel storage, initialization, or disposal behavior.
- **Details**: Keep the current WeakMap-based storage model, but allow the contract object returned by `inject.define` to act as the scoped cache key. Preserve existing parent traversal and lifecycle semantics so constructor-backed scoped services remain behaviorally unchanged. [ref: ../02-design/01-architecture.md#runtime-touchpoints-and-required-broadening] [ref: ../02-design/03-model.md#scope-compatibility-model] [ref: ../02-design/08-risks.md#r3-scoperuntime-incompatibility-remains-in-constructor-oriented-seams-causing-bound-contracts-to-fail-or-behave-differently-in-scoped-resolution]
- **Complexity**: Medium

### Task 1.5: Keep contract-specific runtime errors owned by the centralized DI error surface
- **File**: `src/core/errors.ts`
- **Action**: Modify
- **Description**: Define, or explicitly reuse with clarified messages, the DI-specific error surface for unbound-contract resolution and post-resolution rebinding rejection so Phase 1 does not leave those semantics implicit in runtime call sites.
- **Details**: This task also includes `src/core/errors.test.ts` (**Modify**) to lock the chosen error constructors/messages to the approved failure semantics before `getInjectOptions` and `inject` begin throwing them. Keep ownership of these diagnostics in the existing core error module rather than scattering contract-specific strings across runtime branches. [ref: ../02-design/01-architecture.md#contract-participation-in-inject] [ref: ../02-design/02-dataflow.md#flow-4-rebinding-before-first-resolution] [ref: ../02-design/02-dataflow.md#flow-5-unbound-contract-failure] [ref: ../02-design/04-decisions.md#adr-4-allow-rebinding-only-before-first-resolution] [ref: ../02-design/06-testcases.md#test-cases]
- **Complexity**: Medium

### Task 1.6: Extend core normalization coverage before relocation
- **File**: `src/core/getInjectOptions.test.ts`
- **Action**: Modify
- **Description**: Add unit coverage for contract normalization, same-name identity separation, missing-binding failure, object-shaped provider binding, and define-time diagnostic naming while the suite still lives in its current source-adjacent location.
- **Details**: Cover the architecture-approved contract object shape directly through `getInjectOptions`, verify that two same-name contracts do not share bound state, and assert that unbound resolution fails before entering lifetime-specific branches. [ref: ../02-design/05-usecases.md#edge-case-expectations] [ref: ../02-design/06-testcases.md#test-cases] [ref: ../02-design/08-risks.md#r1-contract-identity-is-misread-as-name-based]
- **Complexity**: Medium

### Task 1.7: Extend core runtime coverage for rebinding, cache ownership, and lifecycle behavior
- **File**: `src/core/inject.test.ts`
- **Action**: Modify
- **Description**: Add runtime tests for pre-resolution rebinding, post-resolution rejection, contract-token cache ownership across singleton/scoped/transient lifetimes, constructor compatibility, and object-shaped provider support.
- **Details**: Verify that the last unresolved binding wins, that post-resolution rebinding is rejected, that `inject(contract)` and `inject(boundConstructor)` remain distinct cache roots, and that constructor-based behavior still passes without any `define()` usage. [ref: ../02-design/02-dataflow.md#flow-4-rebinding-before-first-resolution] [ref: ../02-design/03-model.md#cache-rule] [ref: ../02-design/06-testcases.md#test-cases] [ref: ../02-design/08-risks.md#r2-stale-cache-behavior-after-binding-or-rebinding] [ref: ../02-design/08-risks.md#r7-constructor-path-non-regression-is-lost-while-adding-contract-support]
- **Complexity**: High

### Task 1.8: Extend scoped-storage regression coverage for contract tokens
- **File**: `src/core/Scope.test.ts`
- **Action**: Modify
- **Description**: Add focused coverage proving that contract-object tokens can be stored and retrieved in scopes without regressing parent lookup or sentinel behavior.
- **Details**: Reuse the existing `Scope` test surface to validate that the object-backed token change is strictly additive and does not alter current scope traversal semantics. [ref: ../02-design/01-architecture.md#architectural-invariants] [ref: ../02-design/06-testcases.md#test-cases] [ref: ../02-design/08-risks.md#r3-scoperuntime-incompatibility-remains-in-constructor-oriented-seams-causing-bound-contracts-to-fail-or-behave-differently-in-scoped-resolution]
- **Complexity**: Medium

## Verification
- [ ] `npm run ts-check` passes
- [ ] The updated core unit suites for `errors`, `getInjectOptions`, `inject`, and `Scope` pass from their pre-relocation locations
- [ ] Contract identity, unbound-contract failure, object-shaped provider binding, rebinding freeze, and contract-token cache ownership are all covered before Phase 2 starts
- [ ] Existing constructor-path behavior remains covered and unchanged without any `define()` usage
