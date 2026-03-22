---
workflow_version: b0.5
title: "Data Flow: Contract definitions and test folder relocation"
date: 2026-03-22
stage: 02-design
role: rdpi-architect
language: en
rdpi-version: b0.5
---

## Overview

The new data flow keeps binding-time work lightweight and pushes all lifetime-sensitive behavior into the existing resolver. `define()` creates a stable contract object, `bind()` selects the implementation by writing normalized provider metadata into contract state, and `inject(contract)` later resolves through the same singleton/scoped/transient branches already used for constructors [ref: ../01-research/01-core-contract-analysis.md#lifetime-resolution-and-caching-rules] [ref: ../01-research/04-open-questions.md#user-answers].

## Flow 1: Contract Definition and Environment-Specific Binding Selection

This flow covers bootstrapping-time contract creation and environment branching.

```mermaid
---
title: Contract Definition and Binding Selection
---
sequenceDiagram
    participant Consumer
    participant Define as inject.define
    participant Contract as Defined Contract
    participant Normalize as getInjectOptions
    participant State as Binding State

    Consumer->>Define: define<IChatDataSource>("ChatDataSource")
    Define-->>Consumer: contract object
    Consumer->>Contract: bind(ElectronChatDataSource) or bind(CloudChatDataSource)
    Contract->>Normalize: normalize bound provider input
    Normalize-->>Contract: computed provider descriptor
    Contract->>State: store descriptor and mark unresolved
    Contract-->>Consumer: same contract object
```

Key properties of this flow:

- identity is fixed at define time by the returned contract object, not by the chosen implementation name [ref: ../01-research/04-open-questions.md#q2-what-runtime-identity-should-a-defined-contract-use] [ref: ../01-research/03-external-patterns.md#pitfalls];
- binding is lazy and writes metadata only, so bootstrapping does not instantiate dependencies early [ref: ../01-research/04-open-questions.md#q3-how-should-binding-semantics-work-for-environment-specific-implementation-selection];
- the provider descriptor is normalized once at bind time so later resolutions can reuse existing runtime semantics without a second conversion path [ref: ../01-research/01-core-contract-analysis.md#current-contract-surface-already-has-an-object-based-injection-path].

## Flow 2: First Resolution of a Bound Contract

This is the main runtime path for `inject(contract)` after binding.

```mermaid
---
title: First Resolution of a Bound Contract
---
sequenceDiagram
    participant Consumer
    participant Inject as inject(contract)
    participant Normalize as getInjectOptions
    participant Contract as Defined Contract
    participant Runtime as inject lifetime branch
    participant Cache as Registry or Scope
    participant Impl as Bound Implementation

    Consumer->>Inject: inject(contract, optionalScope)
    Inject->>Normalize: normalize contract
    Normalize->>Contract: read token/name/lifetime/getInstance
    Contract-->>Normalize: contract-backed options
    Normalize-->>Inject: computed options
    Inject->>Runtime: branch by lifetime
    Runtime->>Cache: lookup by contract token
    alt cache miss
        Runtime->>Contract: getInstance()
        Contract->>Impl: invoke bound factory
        Impl-->>Contract: instance
        Contract-->>Runtime: instance
        Runtime->>Cache: store instance under contract token
    else cache hit
        Cache-->>Runtime: existing instance
    end
    Runtime-->>Consumer: instance typed as T
```

Important consequences:

- the cache key is the contract token, so environment selection changes implementation identity without changing consumer call sites [ref: ../01-research/04-open-questions.md#user-answers];
- scoped and singleton caches remain independent from constructor tokens, preventing accidental sharing between `inject(SomeClass)` and `inject(SomeContract)` [ref: ../01-research/01-core-contract-analysis.md#lifetime-resolution-and-caching-rules];
- the contract is marked resolved when `getInstance()` is first invoked, which freezes rebinding from that point onward [ref: ../01-research/04-open-questions.md#q6-what-should-happen-when-the-same-contract-is-bound-more-than-once-or-after-it-has-already-been-resolved] [ref: ../01-research/04-open-questions.md#user-answers].

## Flow 3: Bound Scoped Contract Resolution

The scoped flow keeps current scope restrictions and lifecycle semantics, but binding counts as provider registration.

```mermaid
---
title: Scoped Contract Resolution
---
sequenceDiagram
    participant Consumer
    participant Inject as inject(contract, scope)
    participant Runtime as inject scoped branch
    participant Scope as Scope instance
    participant Contract as Defined Contract
    participant Impl as Bound Scoped Implementation

    Consumer->>Inject: inject(contract, scope?)
    Inject->>Runtime: resolve SCOPED contract options
    Runtime->>Scope: get current or explicit scope
    Runtime->>Scope: lookup by contract token
    alt no active scope
        Runtime-->>Consumer: error: no active scope
    else parent incompatible
        Runtime-->>Consumer: NonCompatibleParentError
    else scope hit
        Scope-->>Consumer: existing scoped instance
    else scope miss
        Runtime->>Scope: mark token as INJECTING_INSTANCE
        Runtime->>Contract: getInstance()
        Contract->>Impl: create instance
        Impl-->>Contract: instance
        Runtime->>Scope: store instance under contract token
        Runtime->>Scope: connect init/destroy hooks from bound impl metadata
        Runtime-->>Consumer: scoped instance
    end
```

The deliberate behavioral rule is that `bind()` satisfies the registration requirement for the contract path. `inject.provide(contract, scope)` remains valid as an eager-instantiation path, but it is no longer mandatory for a bound scoped contract [ref: ../01-research/01-core-contract-analysis.md#provide-contract-and-requireprovide-semantics] [ref: ../01-research/01-core-contract-analysis.md#scope-lifecycle-and-error-paths] [ref: ../01-research/04-open-questions.md#user-answers].

## Flow 4: Rebinding Before First Resolution

Rebinding is allowed only while the contract has not yet created any instance.

```mermaid
---
title: Contract Binding State Machine
---
stateDiagram-v2
    [*] --> Unbound
    Unbound --> BoundUnresolved: bind(provider)
    BoundUnresolved --> BoundUnresolved: bind(replacement provider)
    BoundUnresolved --> BoundResolved: first getInstance()
    BoundResolved --> RebindRejected: bind(new provider)
    RebindRejected --> [*]
    BoundResolved --> [*]
```

Operational interpretation:

- `bind()` may replace the descriptor while the contract is still unresolved;
- once resolution begins, rebinding is rejected to avoid cache ambiguity for singleton and scoped lifetimes [ref: ../01-research/04-open-questions.md#q6-what-should-happen-when-the-same-contract-is-bound-more-than-once-or-after-it-has-already-been-resolved] [ref: ../01-research/01-core-contract-analysis.md#lifetime-resolution-and-caching-rules];
- no cache invalidation flow is needed because rebinding never happens after cache ownership may have been established [ref: ../01-research/03-external-patterns.md#pitfalls].

## Flow 5: Unbound Contract Failure

An unbound contract fails during normalization rather than deep inside lifetime branching.

1. Consumer calls `inject(contract)`.
2. `getInjectOptions()` recognizes the object as a defined contract.
3. The contract state has no bound descriptor.
4. Normalization throws an unbound-contract error using the define-time name.

This keeps the failure local to the contract-definition layer and avoids partially entering singleton or scoped bookkeeping with missing binding metadata [ref: ../01-research/04-open-questions.md#q3-how-should-binding-semantics-work-for-environment-specific-implementation-selection] [ref: ../01-research/04-open-questions.md#q4-what-type-shape-must-injectdefinetname-return-so-that-it-fits-the-current-inject-and-provide-contracts].

## Flow 6: Test Discovery and Execution After Relocation

The chosen topology does not require discovery-rule changes because file suffixes remain unchanged.

```mermaid
---
title: Test Discovery After Relocation
---
flowchart TD
    Vitest[Vitest include globs]
    Tsconfig[tsconfig.test.json include]
    CoreTests[src/core/__tests__/*.test.ts]
    ReactTests[src/react/__tests__/*.test.tsx]
    SharedSetup[src/__tests__/setup.ts]
    Alias[@ alias resolution]
    Run[Test execution]

    Vitest --> CoreTests
    Vitest --> ReactTests
    Tsconfig --> CoreTests
    Tsconfig --> ReactTests
    SharedSetup --> Run
    Alias --> Run
    CoreTests --> Run
    ReactTests --> Run
```

This flow relies on three preserved invariants:

- test files keep `.test.ts` or `.test.tsx` suffixes, which the current shared Vitest config already includes [ref: ../01-research/02-test-topology-analysis.md#vitest-discovery-and-setup-behavior] [ref: ../01-research/03-external-patterns.md#established-practices];
- `src/__tests__/setup.ts` remains at the configured path, so `setupFiles` does not need to change [ref: ../01-research/02-test-topology-analysis.md#vitest-discovery-and-setup-behavior];
- relocated hook tests switch to alias imports, so moving into `src/react/__tests__` no longer depends on same-folder relative imports [ref: ../01-research/02-test-topology-analysis.md#file-by-file-inventory-for-moved-test-candidates] [ref: ../01-research/04-open-questions.md#q8-how-should-the-two-react-hook-tests-that-rely-on-same-directory-relative-imports-behave-after-relocation].

## Data-Flow Invariants

1. `define()` fixes identity but not implementation.
2. `bind()` fixes implementation metadata but does not allocate an instance.
3. `inject(contract)` always caches by contract token, never by implementation constructor.
4. Bound scoped contracts still require scope presence and scope compatibility.
5. Test relocation is structural only; discovery continues through existing suffix-based rules.
