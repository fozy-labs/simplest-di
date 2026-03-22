---
workflow_version: b0.5
title: "Architecture Decisions: Contract definitions and test folder relocation"
date: 2026-03-22
stage: 02-design
role: rdpi-architect
language: en
rdpi-version: b0.5
---

## ADR-1: Keep the Public API Centered on `inject.define`

### Status
Proposed

### Context

The task example introduces the feature through `inject.define<T>(name)` and the user answer explicitly selects keeping the public API centered on `inject.define` only. Research also shows that the published package surface is currently top-level only through the root export path, so adding new named exports or subpaths would broaden package exposure beyond the confirmed requirement [ref: ../01-research/04-open-questions.md#q1-what-is-the-intended-public-api-and-export-surface-for-contract-definitions] [ref: ../01-research/04-open-questions.md#user-answers] [ref: ../01-research/01-core-contract-analysis.md#package-level-exposure-is-currently-top-level-only].

### Options Considered

1. **Attach the feature only to `inject.define`**: Pros: smallest public-surface change, aligns with task and user answer, preserves current package-root export strategy. Cons: the returned contract type is less discoverable as a named type.
2. **Add named contract exports**: Pros: clearer explicit typing and documentation targets. Cons: expands the package surface without research support.
3. **Add subpath exports for contracts**: Pros: stronger separation of core DI concepts from React. Cons: conflicts with the current export-map shape and adds packaging scope.

### Decision

Choose option 1. The public package API remains centered on the existing `inject` export, which gains a `define` method. The returned contract object is public by usage, but no new named package export is required by this design [ref: ../01-research/04-open-questions.md#user-answers].

### Consequences

- Positive: minimal package-surface expansion.
- Positive: aligns exactly with the requested API direction.
- Negative: consumers who want an explicit named contract type may rely on inference or internal type extraction.
- Risks: implementation must keep the returned object shape stable enough for direct `inject(contract)` usage without documenting unrelated internal fields.

## ADR-2: Use the Defined Contract Object Instance as Runtime Token Identity

### Status
Proposed

### Context

Research identifies token identity as unresolved and shows that current scoped storage is constructor-typed while singleton storage already supports arbitrary keys. External ecosystem research shows object-identity tokens are an established pattern and also documents the pitfall that debug names are not safe identifiers. The user left token identity for design resolution [ref: ../01-research/04-open-questions.md#q2-what-runtime-identity-should-a-defined-contract-use] [ref: ../01-research/01-core-contract-analysis.md#the-repository-still-models-several-core-seams-around-constructors] [ref: ../01-research/03-external-patterns.md#established-practices] [ref: ../01-research/03-external-patterns.md#pitfalls].

### Options Considered

1. **Object-instance identity on the returned contract object**: Pros: collision-free without name registries, compatible with WeakMap-backed scoped storage, matches object-token ecosystem patterns. Cons: repeated `define("SameName")` calls intentionally do not match.
2. **Generated symbol identity**: Pros: explicit uniqueness and small runtime surface. Cons: would force broader storage redesign because scoped storage currently relies on object keys.
3. **String-name identity**: Pros: easy to debug and reason about superficially. Cons: collisions are possible and research does not support display names as safe identifiers.

### Decision

Choose option 1. The defined contract object instance is the runtime token. The name passed to `define()` is diagnostic metadata only [ref: ../01-research/04-open-questions.md#user-answers].

### Consequences

- Positive: avoids token collisions without a central registry.
- Positive: minimizes runtime broadening by keeping tokens object-backed and compatible with current storage strategy.
- Negative: consumers must share the same contract object across modules; recreating a same-named contract creates a new key.
- Risks: documentation must state that the name is not identity.

## ADR-3: Store Binding State on the Contract and Expose It Through Contract-Backed Inject Options

### Status
Proposed

### Context

The user answer requires `define()` to return an object with a `bind` method and requires `bind` to write binding state into the object's internal state. Research also confirms that the existing runtime already has an object-shaped input path through `getInjectOptions()`, making a contract-backed inject-options model the most direct reuse path [ref: ../01-research/04-open-questions.md#q3-how-should-binding-semantics-work-for-environment-specific-implementation-selection] [ref: ../01-research/04-open-questions.md#q4-what-type-shape-must-injectdefinetname-return-so-that-it-fits-the-current-inject-and-provide-contracts] [ref: ../01-research/04-open-questions.md#user-answers] [ref: ../01-research/01-core-contract-analysis.md#current-contract-surface-already-has-an-object-based-injection-path].

### Options Considered

1. **Store normalized binding state on the contract and expose the contract as an inject target**: Pros: matches the user answer exactly, keeps one resolution pipeline, keeps API centered on the contract object. Cons: some runtime fields become structurally observable on the object.
2. **Keep contract and provider descriptors separate, with a conversion step before injection**: Pros: cleaner separation of concepts. Cons: diverges from direct `inject(contract)` usage.
3. **Create a separate registration container keyed by contract**: Pros: strong explicit registration boundary. Cons: introduces a second runtime abstraction not justified by research or task scope.

### Decision

Choose option 1. `bind()` stores a normalized provider descriptor on the contract. `inject(contract)` reads contract-backed fields via normalization and resolves through the existing runtime. Cache identity remains on the contract token rather than the bound implementation token [ref: ../01-research/01-core-contract-analysis.md#lifetime-resolution-and-caching-rules].

### Consequences

- Positive: low conceptual overhead for consumers.
- Positive: reuses current DI runtime rather than duplicating resolution semantics.
- Negative: the contract object has an observable structural shape beyond `bind()`.
- Risks: implementation must prevent use before binding and keep undocumented fields out of the supported extension surface.

## ADR-4: Allow Rebinding Only Before First Resolution

### Status
Proposed

### Context

The user answer explicitly sets rebinding as allowed only before the first `getInstance()` call. Research also notes that current singleton and scoped paths already cache by token, so post-resolution rebinding would create ambiguity about stale instances and cache invalidation [ref: ../01-research/04-open-questions.md#q6-what-should-happen-when-the-same-contract-is-bound-more-than-once-or-after-it-has-already-been-resolved] [ref: ../01-research/04-open-questions.md#user-answers] [ref: ../01-research/01-core-contract-analysis.md#lifetime-resolution-and-caching-rules].

### Options Considered

1. **First binding wins forever**: Pros: simple and safe. Cons: reduces bootstrap flexibility and test override options.
2. **Rebinding allowed only before first resolution**: Pros: supports environment/bootstrap selection while keeping caches coherent. Cons: requires explicit runtime tracking of first resolution.
3. **Rebinding always allowed**: Pros: maximum flexibility. Cons: conflicts with singleton and scoped cache semantics.

### Decision

Choose option 2. A contract may be rebound while unresolved. Once its bound `getInstance()` is first invoked, rebinding becomes invalid [ref: ../01-research/04-open-questions.md#user-answers].

### Consequences

- Positive: supports environment selection and bootstrap overrides.
- Positive: avoids cache invalidation logic.
- Negative: late test overrides after first access must use a fresh contract or earlier setup.
- Risks: implementations must mark first resolution consistently for all lifetimes.

## ADR-5: Treat Binding as Registration for Scoped Contracts While Preserving Existing Scoped Runtime Rules

### Status
Proposed

### Context

Research shows that current scoped resolution requires an active scope, enforces parent compatibility, uses lifecycle callbacks, and gates creation behind `requireProvide`. The task example, however, expects a bound contract to be directly injectable after environment selection, and the user answer treats minimal runtime change as a preference rather than a hard constraint [ref: ../01-research/01-core-contract-analysis.md#provide-contract-and-requireprovide-semantics] [ref: ../01-research/01-core-contract-analysis.md#scope-lifecycle-and-error-paths] [ref: ../01-research/04-open-questions.md#user-answers].

### Options Considered

1. **Preserve `requireProvide` exactly, even for bound contracts**: Pros: smallest semantic change relative to current scoped classes. Cons: makes `bind()` insufficient for direct contract use, especially for environment-selected scoped dependencies.
2. **Treat binding as registration for contract-defined dependencies while preserving scope presence, compatibility, cache, and lifecycle rules**: Pros: makes `bind()` meaningful, matches token-plus-provider patterns in external research, keeps one scoped runtime. Cons: broadens current scoped registration semantics.
3. **Disallow scoped bindings for defined contracts**: Pros: minimizes runtime change. Cons: unjustifiably limits the feature and conflicts with the request to define scoped-runtime compatibility.

### Decision

Choose option 2. A bound scoped contract no longer requires a separate `provide` step before injection, but it still requires an active scope and still obeys all current scoped runtime restrictions and lifecycle behavior [ref: ../01-research/03-external-patterns.md#established-practices].

### Consequences

- Positive: `bind()` becomes a complete contract-registration step.
- Positive: React and non-React consumers can resolve bound scoped contracts consistently.
- Negative: scoped contract behavior differs from constructor defaults, where `requireProvide` is usually true.
- Risks: documentation must explain the distinction between constructor-scoped registration and contract binding.

## ADR-6: Standardize Relocated React Hook Tests on Alias-Based Imports

### Status
Proposed

### Context

Research shows that most current tests already use the `@` alias, while only `useConstant.test.ts` and `useSafeMount.test.tsx` depend on same-folder relative imports. The user left the relocation strategy for those tests to the design stage [ref: ../01-research/02-test-topology-analysis.md#file-by-file-inventory-for-moved-test-candidates] [ref: ../01-research/04-open-questions.md#q8-how-should-the-two-react-hook-tests-that-rely-on-same-directory-relative-imports-behave-after-relocation].

### Options Considered

1. **Preserve relative imports by choosing mirrored placement rules**: Pros: reduces import edits for two files. Cons: constrains folder topology around an exceptional pattern.
2. **Switch relocated hook tests to alias imports**: Pros: aligns with the repository majority, decouples tests from source adjacency, works with existing Vitest alias config. Cons: requires minor import edits in those tests.
3. **Allow mixed conventions after relocation**: Pros: lowest immediate change. Cons: preserves inconsistency inside the same test area.

### Decision

Choose option 2. Relocated React hook tests use alias imports like the rest of the test suite [ref: ../01-research/02-test-topology-analysis.md#vitest-discovery-and-setup-behavior].

### Consequences

- Positive: clearer and more uniform test import conventions.
- Positive: topology can be chosen independently from same-folder source placement.
- Negative: two tests require small import rewrites during relocation.
- Risks: none beyond routine path update mistakes.

## ADR-7: Keep Vitest and TypeScript Discovery Configuration Unchanged for the Chosen Topology

### Status
Proposed

### Context

Research confirms that current discovery is already recursive under `src/**` with `.test.ts` and `.test.tsx` suffixes, and that `src/__tests__/setup.ts` is pinned in shared Vitest configuration. The user asked design to resolve whether config changes are allowed and to constrain them to the minimum needed [ref: ../01-research/02-test-topology-analysis.md#vitest-discovery-and-setup-behavior] [ref: ../01-research/04-open-questions.md#q9-which-test-discovery-and-compilation-assumptions-are-allowed-to-change-as-part-of-the-relocation] [ref: ../01-research/03-external-patterns.md#pitfalls].

### Options Considered

1. **Keep Vitest and TypeScript discovery unchanged**: Pros: zero toolchain churn for the chosen topology, least risky, matches current suffix-based discovery. Cons: relocation must preserve suffixes and setup-file location.
2. **Adjust local config to explicitly include new `__tests__` folders**: Pros: more explicit topology documentation in tooling. Cons: redundant for current globs and adds avoidable config churn.
3. **Modify shared config package or test naming rules**: Pros: could support broader future topologies. Cons: expands scope beyond this feature.

### Decision

Choose option 1. No Vitest or TypeScript discovery changes are part of this design. The relocation must keep `.test.ts` and `.test.tsx` suffixes and leave `src/__tests__/setup.ts` in place [ref: ../01-research/04-open-questions.md#user-answers].

### Consequences

- Positive: minimal implementation risk and no shared-config divergence.
- Positive: preserves existing developer expectations for test discovery.
- Negative: future moves that rename files or relocate setup would need a separate config decision.
- Risks: implementation must not silently change test suffixes or the setup path.
