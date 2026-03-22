---
workflow_version: b0.5
title: "Risk Analysis: Contract definitions and test folder relocation"
date: 2026-03-22
stage: 02-design
role: rdpi-qa-designer
language: en
rdpi-version: b0.5
---

## Risk Matrix

| ID | Risk | Probability | Impact | Strategy | Mitigation |
|----|------|-------------|--------|----------|------------|
| R1 | API ambiguity causes consumers or tests to assume contract identity is name-based rather than object-based | M | H | Mitigate | Add unit and docs verification that same-name contracts do not share bindings or caches; require docs/examples to state that the returned contract object is the identity [ref: ./03-model.md#identity-rule] [ref: ./07-docs.md#required-documentation-touchpoints] |
| R2 | Rebinding or cache ownership is implemented incorrectly, leaving stale singleton or scoped instances after binding changes | M | H | Mitigate | Gate the feature with pre-resolution replacement and post-resolution rejection tests across singleton and scoped lifetimes; verify cache ownership stays on the contract token, not the implementation constructor [ref: ./01-architecture.md#binding-storage] [ref: ./04-decisions.md#adr-4-allow-rebinding-only-before-first-resolution] |
| R3 | Scope/runtime incompatibility remains in constructor-oriented seams, causing bound contracts to fail or behave differently in scoped resolution | M | H | Mitigate | Require explicit scoped contract tests for no-active-scope, parent compatibility, per-scope caching, and lifecycle hooks; verify that broadening `Scope` token support does not change constructor-backed scoped behavior [ref: ./01-architecture.md#runtime-touchpoints-and-required-broadening] [ref: ./02-dataflow.md#flow-3-bound-scoped-contract-resolution] |
| R4 | Test discovery regresses after relocation because the move unintentionally breaks suffix-based include rules or setup-file assumptions | M | H | Mitigate | Keep `.test.ts/.test.tsx` suffixes and `src/__tests__/setup.ts` unchanged; add repository regression checks that the moved files are discovered exactly once under existing Vitest and TypeScript config [ref: ./04-decisions.md#adr-7-keep-vitest-and-typescript-discovery-configuration-unchanged-for-the-chosen-topology] |
| R5 | Relocated React hook tests fail because imports still depend on source adjacency | M | M | Mitigate | Convert both moved hook suites to alias-based imports and run them specifically from `src/react/__tests__` as part of relocation verification [ref: ./04-decisions.md#adr-6-standardize-relocated-react-hook-tests-on-alias-based-imports] |
| R6 | Docs, changelog, and export checks drift from the approved API, leaving users with mismatched guidance about `inject.define` and React usage | M | M | Mitigate | Tie repository regression to docs/changelog review plus root-export verification so the published surface, examples, and package tests stay synchronized [ref: ./05-usecases.md#documentation-verification-expectations] [ref: ./07-docs.md#required-public-facing-verification-touchpoints] |
| R7 | Existing constructor-path behavior regresses while broadening types and normalization for contract objects | M | H | Mitigate | Preserve constructor-path regression tests and treat unchanged constructor semantics as a release gate alongside new contract coverage [ref: ./01-architecture.md#constructor-compatibility] [ref: ./05-usecases.md#uc-4-keep-existing-constructor-based-consumers-unchanged-unless-interface-based-binding-is-needed] |

## Detailed Mitigation Plans

### R1: Contract identity is misread as name-based

Why this is high impact:
Contract identity is foundational to cache ownership, binding lookup, and documentation accuracy. If consumers infer identity from the display name, repeated `define("SameName")` calls can silently diverge from expectations and create hard-to-diagnose runtime mismatches [ref: ./03-model.md#runtime-token-model].

Mitigation steps:
1. Add a mandatory unit scenario where two same-name contracts are defined independently and only one is bound.
2. Require the expected outcome to show one contract resolving successfully while the other fails as unbound.
3. Require docs review to state explicitly that the returned contract object, not the string name, is the identity.
4. Require export/docs review to avoid introducing a named token helper that could blur this rule.

Verification criteria:
- Same-name contracts do not share binding state or caches in unit coverage.
- Concepts documentation explains object identity without contradictory examples.
- Export-surface tests still show the API centered on `inject.define` only.

### R2: Stale cache behavior after binding or rebinding

Why this is high impact:
The design deliberately splits provider metadata from cache identity. If implementation work keys caches by the bound constructor or allows rebinding after first resolution, singleton and scoped behavior becomes nondeterministic and consumer-visible [ref: ./01-architecture.md#binding-storage] [ref: ./03-model.md#cache-rule].

Mitigation steps:
1. Add unit coverage for bind-replace-before-resolution and bind-reject-after-resolution.
2. Test singleton and scoped lifetimes separately so stale-instance behavior cannot hide behind one lifetime path.
3. Verify that `inject(contract)` twice returns the same singleton instance while `inject(boundConstructor)` remains a distinct resolution path.
4. Treat any post-resolution rebinding success as a release-blocking defect.

Verification criteria:
- Pre-resolution replacement resolves the last bound implementation.
- Post-resolution rebinding fails consistently.
- Contract-token cache ownership remains isolated from constructor-token cache ownership.

### R3: Scoped contract path diverges from existing runtime rules

Why this is high impact:
Scoped behavior is already one of the most constrained parts of the runtime, and the research explicitly called out constructor-oriented scoped storage as a seam that may block contract objects [ref: ../01-research/README.md#key-findings] [ref: ./01-architecture.md#runtime-touchpoints-and-required-broadening].

Mitigation steps:
1. Add explicit scoped-contract tests for outside-scope failure, parent compatibility rejection, per-scope caching, and lifecycle hook execution.
2. Run the same constructor-backed scoped regression suite to prove the broadened token handling does not regress the existing path.
3. Validate React-scoped consumption through `DiScopeProvider` because React is the main consumer of scope creation in this repository.
4. Treat any need for React-only DI semantics as an architectural mismatch rather than a test-only issue.

Verification criteria:
- Bound scoped contracts fail outside scope and succeed inside active scope.
- Parent compatibility and lifecycle behavior match the existing scoped runtime.
- Constructor-backed scoped tests still pass unchanged.

### R4: Test discovery breaks after moving tests into module-local __tests__ folders

Why this is high impact:
If the relocation invalidates discovery assumptions, the repository can appear green while silently skipping coverage, especially because current discovery depends on suffix-based includes and a fixed setup-file path rather than on directory names alone [ref: ../01-research/02-test-topology-analysis.md#vitest-discovery-and-setup-behavior].

Mitigation steps:
1. Keep the relocated filenames on the existing `.test.ts/.test.tsx` contract.
2. Preserve `src/__tests__/setup.ts` in place so shared setup configuration does not drift.
3. Add repository regression checks that enumerate the moved suites and confirm they execute under the unchanged test command.
4. Add a duplicate-topology check so source-adjacent leftovers do not cause double execution.

Verification criteria:
- All moved suites are discovered under the unchanged config.
- Shared setup still runs for relocated suites.
- No duplicate execution occurs from stale source-adjacent copies.

### R7: Constructor-path non-regression is lost while adding contract support

Why this is high impact:
The feature is additive by design. If widening types or normalization changes constructor-backed injection semantics, the repository breaks its main established contract to ship a secondary capability [ref: ./01-architecture.md#constructor-compatibility] [ref: ./05-usecases.md#uc-4-keep-existing-constructor-based-consumers-unchanged-unless-interface-based-binding-is-needed].

Mitigation steps:
1. Preserve the current constructor-path unit and integration suites as explicit regression gates.
2. Verify singleton, transient, scoped, circular, and `requireProvide` scenarios without `define()` involvement.
3. Review any failures in constructor tests as release blockers even if all new contract tests pass.
4. Keep documentation clear that constructor injection remains valid and unchanged.

Verification criteria:
- Existing constructor-path suites pass with no semantic rebaselining.
- Public docs still describe constructor injection as a first-class supported path.
- New contract support does not become a hidden prerequisite for existing users.