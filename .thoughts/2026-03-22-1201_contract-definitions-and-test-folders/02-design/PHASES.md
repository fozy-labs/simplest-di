---
workflow_version: b0.5
title: "Phases: 02-design"
date: 2026-03-22
stage: 02-design
language: en
rdpi-version: b0.5
---

# Phases: 02-design

## Phase 1: Core architecture and ADR decisions

- **Agent**: `rdpi-architect`
- **Output**: `01-architecture.md`, `02-dataflow.md`, `03-model.md`, `04-decisions.md`
- **Depends on**: —
- **Retry limit**: 2

### Prompt

Read these mandatory inputs before designing anything:
- `../TASK.md`
- `../01-research/README.md`
- `../01-research/01-core-contract-analysis.md`
- `../01-research/02-test-topology-analysis.md`
- `../01-research/03-external-patterns.md`
- `../01-research/04-open-questions.md`

Produce the core design package for the feature "Contract definitions and test folder relocation".

Scope:
- Design the architecture for a contract-definition API centered on `inject.define<T>(name)`.
- Keep the public API centered on `inject.define`; do not widen the package surface beyond what the research and user answers justify.
- Resolve the remaining design questions around runtime token identity, how the defined contract object participates in `inject()`, and how `bind()` writes and exposes binding state.
- Define how the chosen contract identity and binding model interact with singleton caches, scoped resolution, and existing constructor-based resolution paths.
- Treat the task assumption about minimal runtime change as a preference, not a hard constraint, but document every required runtime broadening explicitly.
- Design the target repository structure for relocating source-adjacent tests into `src/core/__tests__` and `src/react/__tests__`.
- Resolve the import strategy for relocated React hook tests currently relying on same-folder relative imports.
- Resolve whether Vitest and TypeScript test-discovery/configuration changes are allowed, and constrain them to the minimum needed for the chosen topology.

Required outputs:
- `01-architecture.md`: architecture narrative plus component/module boundaries for contract definitions, binding storage, inject runtime touchpoints, and test-topology organization.
- `02-dataflow.md`: key flows for contract definition, environment-specific binding selection, first resolution, rebinding-before-first-resolution, and test execution/discovery after relocation.
- `03-model.md`: domain model for contract objects, token identity, binding state, public/internal types, and repository topology artifacts.
- `04-decisions.md`: ADRs for token identity, rebinding rule, scoped-runtime compatibility, React test import strategy, and config-change boundaries.

Mermaid requirements:
- Include titled Mermaid diagrams for C4/container or component structure, module dependencies, class/interface or type hierarchy, and sequence/state flows.
- Keep each diagram within 15-20 elements; split large diagrams.

ADR requirements:
- Use ADR numbering `ADR-1`, `ADR-2`, etc.
- Each ADR must include Status, Context, Options with pros/cons, Decision, and Consequences.

Traceability and constraints:
- Every major design choice must cite or explicitly reference the supporting research finding.
- Treat the user answers captured in `../01-research/04-open-questions.md` as binding inputs unless an ADR explicitly documents a necessary constraint or deferment.
- Do not write implementation code or migration steps beyond design-level structure.

---

## Phase 2: Use cases and documentation impact

- **Agent**: `rdpi-architect`
- **Output**: `05-usecases.md`, `07-docs.md`
- **Depends on**: 1
- **Retry limit**: 2

### Prompt

Read these inputs:
- `../TASK.md`
- `../01-research/README.md`
- `../01-research/04-open-questions.md`
- `./01-architecture.md`
- `./02-dataflow.md`
- `./03-model.md`
- `./04-decisions.md`

Use the phase-1 architecture as the source of truth and produce design outputs for usage scenarios and documentation impact.

Scope for `05-usecases.md`:
- Describe the main TypeScript usage scenarios for defining a contract, binding environment-specific implementations, and resolving the contract through `inject()`.
- Include the migration/use-case path for existing constructor-based consumers so the plan stage can separate unchanged behavior from new contract-definition behavior.
- Describe the repository-maintainer use cases for relocating tests into per-module `__tests__` directories, including how moved React hook tests should reference their source modules after relocation.
- Cover edge cases: binding too late, missing binding, repeated `define()` sites, export-surface verification, and documentation verification expectations.

Scope for `07-docs.md`:
- Keep this document SHORT and focused. Large `07-docs.md` is an anti-pattern.
- Describe WHAT documentation and public-facing verification must change, not HOW to write it.
- Identify the high-impact docs and verification touchpoints implied by the feature, including package concepts documentation, React integration docs if affected, export-surface verification, and `docs/CHANGELOG.md`.
- Match the existing repository documentation style expectations; do not propose JSDoc work.

Constraints:
- Tie every use case and documentation-impact item back to research and the approved architecture decisions.
- No implementation code, no pseudo-runtime internals, and no broad documentation rewrite plan.

---

## Phase 3: QA strategy and risk analysis

- **Agent**: `rdpi-qa-designer`
- **Output**: `06-testcases.md`, `08-risks.md`
- **Depends on**: 1, 2
- **Retry limit**: 1

### Prompt

Read these inputs:
- `../TASK.md`
- `../01-research/README.md`
- `../01-research/02-test-topology-analysis.md`
- `../01-research/04-open-questions.md`
- `./01-architecture.md`
- `./02-dataflow.md`
- `./03-model.md`
- `./04-decisions.md`
- `./05-usecases.md`
- `./07-docs.md`

Produce the design-stage QA strategy and risk register for this feature.

For `06-testcases.md`:
- Design verification coverage across unit, integration, and repository-level regression testing.
- Include contract-definition cases for token identity, binding-before-first-resolution, rebinding restrictions, missing bindings, scoped behavior compatibility, and existing constructor-path non-regression.
- Include relocation cases for moved core/react tests, React hook import behavior after relocation, export-surface verification, docs/changelog verification, and any config-sensitive test discovery paths.
- Use a test case table with columns: ID, Category, Description, Input, Expected Output, Priority.

For `08-risks.md`:
- Produce a risk table with columns: ID, Risk, Probability (H/M/L), Impact (H/M/L), Strategy (Accept/Mitigate/Avoid), Mitigation.
- Include explicit risks for API ambiguity around contract identity, stale cache behavior after binding, scope/runtime incompatibility, test discovery regressions, import breakage in relocated React tests, and docs/export drift.
- Provide detailed mitigation plans for every high-impact risk.
- Include performance-test criteria only if the design introduces a plausible runtime or test-execution performance concern.

Constraints:
- QA and risk outputs must be traceable to the architecture/use-case documents and the research findings.
- Keep the focus on verification design, not implementation steps.

---

## Phase 4: Design review and stage README update

- **Agent**: `rdpi-design-reviewer`
- **Output**: Updates `README.md`
- **Depends on**: 1, 2, 3
- **Retry limit**: 2

### Prompt

Review the complete design package against the research inputs and update `README.md` for the stage.

Read these files:
- `../TASK.md`
- `../01-research/README.md`
- `../01-research/01-core-contract-analysis.md`
- `../01-research/02-test-topology-analysis.md`
- `../01-research/03-external-patterns.md`
- `../01-research/04-open-questions.md`
- `./01-architecture.md`
- `./02-dataflow.md`
- `./03-model.md`
- `./04-decisions.md`
- `./05-usecases.md`
- `./06-testcases.md`
- `./07-docs.md`
- `./08-risks.md`
- `./README.md`

Review criteria:
- Research traceability: every major design claim must map back to the research package or an explicitly documented ADR decision.
- Internal consistency: architecture, use cases, QA strategy, docs impact, and risks must agree on contract identity, binding behavior, relocation topology, import strategy, and config boundaries.
- Completeness: the design must cover contract-definition behavior, per-module `__tests__` relocation, export verification, documentation/changelog impact, and open-question closure or explicit deferment.
- Feasibility: proposed boundaries must fit the existing repository constraints without sneaking in undocumented package-surface changes.
- ADR quality: each ADR must have full sections and defensible consequences.
- Mermaid conformance: diagrams are titled, readable, and appropriately split.
- QA/risk coverage: testcases and risks must cover both runtime behavior and repository/tooling effects, with actionable mitigations for high-impact risks.
- Docs proportionality: `07-docs.md` must stay short, focused, and describe WHAT changes, not HOW.
- No implementation leakage: design docs must not contain implementation code or plan-stage task breakdown.

Update `README.md` so it accurately reflects the produced documents, goals/non-goals, key decisions, quality review outcome, and next steps for the plan stage.

---