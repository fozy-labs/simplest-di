---
workflow_version: b0.5
title: "Design: Contract definitions and test folder relocation"
date: 2026-03-22
status: Approved
feature: "Contract definitions and test folder relocation"
research: "../01-research/README.md"
language: en
rdpi-version: b0.5
---

## Overview
This design package translates the approved research into a concrete design for two linked changes: contract definitions through `inject.define`, and relocation of core/react unit tests into per-module `__tests__` folders. The documents keep the package surface centered on the existing `inject` export, preserve the current constructor-based path, and define how contract binding interacts with singleton, scoped, and transient resolution.

The package is largely ready to move into planning, but one internal consistency issue remains in the domain model's provider typing. The architectural direction, ADR set, QA strategy, risk coverage, and documentation scope are otherwise coherent and traceable to the research inputs.

## Goals
- Define a contract-definition design where `inject.define` remains the only new public entry, the returned contract object is the runtime identity, and binding semantics fit the existing resolver.
- Define the relocation topology for `src/core/__tests__` and `src/react/__tests__`, including import normalization for moved React hook tests and explicit config-boundary decisions.
- Produce design artifacts for use cases, documentation impact, QA coverage, export verification, and repository-level regression checks that stay within the feature scope.

## Non-Goals
- Implement runtime, test, or docs changes in the source repository.
- Produce full documentation drafts, JSDoc text, or plan-stage task decomposition.
- Introduce broader package-surface changes such as new contract subpaths or a parallel React-specific DI API.

## Documents
- [Architecture](./01-architecture.md)
- [Data Flow](./02-dataflow.md)
- [Domain Model](./03-model.md)
- [Decisions](./04-decisions.md)
- [Use Cases](./05-usecases.md)
- [Test Cases](./06-testcases.md)
- [Documentation and Examples](./07-docs.md)
- [Risks](./08-risks.md)

## Key Decisions
- Keep the public API centered on `inject.define` and avoid new named package exports or subpath exposure.
- Use the defined contract object instance as the runtime token, with the define-time string acting as diagnostics rather than identity.
- Store normalized binding state on the contract object, allow rebinding only before first resolution, and keep cache ownership on the contract token.
- Treat binding as registration for contract-backed scoped resolution while preserving existing scope-presence, compatibility, and lifecycle rules.
- Move unit tests into `src/core/__tests__` and `src/react/__tests__`, switch relocated React hook tests to alias imports, and keep Vitest/TypeScript discovery unchanged.

## Quality Review

### Checklist
| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 1 | Design decisions trace to research findings | PASS | Architecture, data flow, ADRs, use cases, tests, docs, and risks consistently cite the research package and user-answered open questions. |
| 2 | ADRs have Status, Context, Options, Decision, Consequences | PASS | [04-decisions.md](./04-decisions.md) contains seven ADRs, each with the required sections and defensible rationale. |
| 3 | Mermaid diagrams present and conformant | PASS | [01-architecture.md](./01-architecture.md), [02-dataflow.md](./02-dataflow.md), and [03-model.md](./03-model.md) include titled Mermaid diagrams that remain readable and appropriately split. |
| 4 | Test strategy covers identified risks | PASS | [06-testcases.md](./06-testcases.md) covers identity, rebinding, scoped semantics, constructor regressions, relocation/discovery, exports, and docs alignment, matching the high-impact risks in [08-risks.md](./08-risks.md). |
| 5 | docs.md is concise and proportional to existing docs/demos | PASS | [07-docs.md](./07-docs.md) stays short and limited to high-impact docs surfaces. The repository has a modest `docs/` set and no `apps/demos/` directory, so the proposed scope is proportionate. |
| 6 | docs.md describes WHAT not HOW (no JSDoc, no full drafts) | PASS | [07-docs.md](./07-docs.md) lists affected docs and verification touchpoints without drifting into authoring instructions or draft prose. |
| 7 | No implementation details or code | PASS | The package stays at design level. The TypeScript snippets in [03-model.md](./03-model.md) and [05-usecases.md](./05-usecases.md) are illustrative API/type sketches rather than implementation tasks or code-level breakdowns. |
| 8 | Research open questions addressed or deferred | PASS | Q1-Q10 from [04-open-questions.md](../01-research/04-open-questions.md) are either closed by user answers or resolved in the ADR/design set; no open design-stage ambiguity remains undocumented. |
| 9 | Risk analysis has actionable mitigations for high-impact risks | PASS | [08-risks.md](./08-risks.md) provides concrete mitigation and verification steps for the high-impact runtime and tooling risks. |
| 10 | Internal consistency (arch/dataflow/model/usecases) | FAIL | [03-model.md](./03-model.md) defines contract provider and stored descriptor types around `InjectOptions<Constructor<T>>` / `InjectComputedOptions<Constructor<T>>`, which conflicts with the architecture and ADRs that say binding supports constructor or object-shaped provider inputs for contract type `T`. |

### Documentation Proportionality
The documentation-impact design is scaled appropriately to the repository. The current docs surface is limited to a small set of package guides under `docs/`, and there is no `apps/demos/` directory to justify a large example plan. [07-docs.md](./07-docs.md) appropriately limits the scope to focused updates in `docs/concepts.md`, selective clarification in `docs/react-integration.md`, a proportional root README adjustment, and a changelog entry. It stays on what must change and avoids over-specifying examples, demos, or authoring mechanics.

### Issues Found
1. The domain model's provider typing is internally inconsistent with the approved architecture and ADRs.
Where: [03-model.md](./03-model.md), sections `Type Model`, `Internal State Model`, and `Type and Relationship Model`.
What's wrong: the model defines `ContractProvider<T>` as `Constructor<T> | InjectOptions<Constructor<T>>` and the stored descriptor as `InjectComputedOptions<Constructor<T>>`. That shape implies object-form providers produce `Constructor<T>` rather than `T`, which contradicts the architecture in [01-architecture.md](./01-architecture.md) and ADR-3 in [04-decisions.md](./04-decisions.md), both of which state that binding should accept constructor-backed or object-shaped providers for the contract itself and that `inject(contract)` resolves instances of `T`.
What's expected: the model should describe provider and normalized descriptor shapes that remain instance-oriented for contract type `T` while still allowing constructors as one binding form.
Severity: High

## Next Steps
Proceeds to Plan stage after human review, provided the type-model inconsistency in [03-model.md](./03-model.md) is corrected or explicitly reconciled.