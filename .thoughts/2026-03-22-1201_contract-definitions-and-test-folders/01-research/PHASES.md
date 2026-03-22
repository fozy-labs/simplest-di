---
workflow_version: b0.5
title: "Phases: 01-research"
date: 2026-03-22
stage: 01-research
language: en
rdpi-version: b0.5
---

# Phases: 01-research

## Phase 1: Analyze core DI contract surface

- **Agent**: `rdpi-codebase-researcher`
- **Output**: `01-core-contract-analysis.md`
- **Depends on**: —
- **Retry limit**: 2

### Prompt

Research only. Do not propose implementation approaches.

Read these files first:
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/TASK.md`
- `src/core/inject.ts`
- `src/core/di.types.ts`
- `src/core/getInjectOptions.ts`
- `src/core/injectable.ts`
- `src/core/index.ts`
- `src/index.ts`
- `src/core/symbols.ts`
- `src/core/errors.ts`
- `docs/concepts.md`

Document the current DI contract surface relevant to introducing a future `inject.define<T>(name)` API. Focus on facts only:
- how `inject()` currently resolves tokens and lifetimes
- which types define the public injection and provide contract
- how names, tokens, and constructors are derived today
- what is exported from the core and package entry points
- where the current API assumes constructor-based tokens versus generic token objects
- which error paths, scope rules, and lifecycle semantics would constrain a contract-definition feature
- whether the task assumption is currently supported by repository structure: "the inject mechanism should not require additional changes beyond adding the define method"

Boundaries:
- include only the core DI implementation and package exports
- do not inspect React internals except where package exports reference them
- do not recommend code changes or API designs

Output requirements:
- use frontmatter with title, date, stage, role
- include concrete file references
- separate confirmed facts from inferred constraints
- if a claim depends on multiple files, cross-reference them explicitly

---

## Phase 2: Analyze test topology and React-adjacent impact

- **Agent**: `rdpi-codebase-researcher`
- **Output**: `02-test-topology-analysis.md`
- **Depends on**: —
- **Retry limit**: 2

### Prompt

Research only. Do not propose implementation approaches.

Read these files and directories first:
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/TASK.md`
- `src/core/errors.test.ts`
- `src/core/getInjectOptions.test.ts`
- `src/core/getInjectorName.test.ts`
- `src/core/inject.test.ts`
- `src/core/injectable.test.ts`
- `src/core/Scope.test.ts`
- `src/react/reactDi.test.tsx`
- `src/react/useConstant.test.ts`
- `src/react/useSafeMount.test.tsx`
- `src/__tests__/setup.ts`
- `src/__tests__/helpers/singleton-reset.ts`
- `src/__tests__/integration/exports.test.ts`
- `src/__tests__/integration/scoped-lifecycle.test.tsx`
- `src/react/reactDi.tsx`
- `src/react/index.ts`
- `vitest.config.ts`
- `tsconfig.test.json`
- `docs/react-integration.md`

Document the current test layout and the repository constraints around moving tests from `src/core` and `src/react` into `__tests__` directories. Focus on facts only:
- where unit, integration, and shared test utilities currently live
- how Vitest discovers tests and setup files today
- whether path assumptions or import patterns in existing tests depend on co-location with source files
- which React-facing files or docs are covered by tests that would be moved
- what naming, folder, or config conventions already exist under `src/__tests__`
- which files appear to be part of the move scope versus outside scope

Boundaries:
- include test files, test config, and directly related React/core source files needed to explain imports
- do not evaluate alternative folder structures beyond documenting current patterns
- do not prescribe a relocation plan

Output requirements:
- use frontmatter with title, date, stage, role
- provide a file-by-file inventory for moved-test candidates
- note any discovery/config risks as evidence-backed observations, not recommendations

---

## Phase 3: Research external patterns for contract tokens and test organization

- **Agent**: `rdpi-external-researcher`
- **Output**: `03-external-patterns.md`
- **Depends on**: —
- **Retry limit**: 1

### Prompt

Research external patterns relevant to this task. Do not design a solution for this repository.

Read task context first:
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/TASK.md`

Investigate two domains:
1. DI contract-definition or token-definition APIs in TypeScript/JavaScript libraries
2. Test folder organization conventions for Vitest or similar TypeScript libraries when tests move from source-adjacent files into `__tests__` directories

Comparable libraries and ecosystems to examine where relevant:
- Angular `InjectionToken`
- InversifyJS service identifiers and symbol/token patterns
- tsyringe injection tokens and provider binding patterns
- NestJS custom providers or token-based injection, if it adds useful contrast
- Vitest and Jest test discovery conventions for `__tests__`

For each source, capture:
- the concrete API shape or convention being used
- what problem it solves
- observable trade-offs or pitfalls
- whether the evidence is a documented practice, library behavior, or opinion
- confidence level: High, Medium, or Low

Skepticism requirements:
- cross-check claims against primary docs when possible
- separate established patterns from commentary
- avoid repo-specific recommendations

Output requirements:
- use frontmatter with title, date, stage, role
- split findings into `Contract token patterns` and `Test organization patterns`
- include source attribution and confidence per major claim

---

## Phase 4: Synthesize open questions and constraints

- **Agent**: `rdpi-questioner`
- **Output**: `04-open-questions.md`
- **Depends on**: 1, 2, 3
- **Retry limit**: 1

### Prompt

Read these inputs before writing anything:
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/TASK.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/01-core-contract-analysis.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/02-test-topology-analysis.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/03-external-patterns.md`

Context:
- the feature combines test relocation in `src/core` and `src/react` with a future `inject.define<T>(name)` contract-definition API
- the task includes an assumption that the existing inject mechanism should ideally not need changes beyond adding `define`

Generate only unresolved questions and constraints that the next stage must address. Do not answer them and do not design the solution.

Each question must include:
- priority: High, Medium, or Low
- context from the research outputs
- the concrete ambiguity or constraint
- options, if the research exposed multiple viable interpretations
- risk if the question stays unresolved
- researcher recommendation about whether the question must be resolved in design, plan, or implementation

Focus on:
- API compatibility and export-surface ambiguity
- token identity, binding semantics, and environment-specific implementation selection
- type-system implications of a generic contract-definition API
- assumptions hidden in test imports, Vitest discovery, and existing folder conventions
- any contradictions between repository facts and external patterns

---

## Phase 5: Review research outputs and consolidate stage README

- **Agent**: `rdpi-research-reviewer`
- **Output**: Updates `README.md`
- **Depends on**: 1, 2, 3, 4
- **Retry limit**: 2

### Prompt

Read and verify all research outputs:
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/01-core-contract-analysis.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/02-test-topology-analysis.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/03-external-patterns.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/04-open-questions.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/README.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/TASK.md`

Update `README.md` so it becomes the research-stage summary document.

The updated README.md must contain:
- Summary
- Documents
- Key Findings (5-7 bullets)
- Contradictions and Gaps
- Quality Review
- Next Steps

Quality review requirements:
- verify that every referenced file exists
- check reference accuracy across documents
- verify source attribution and confidence levels in external research
- verify that open questions are actionable and prioritized
- enforce the no-solutions rule for research outputs
- verify frontmatter correctness and workflow version consistency
- cross-check claims made in one research document against the others

If you find contradictions or weak evidence, record them explicitly in README.md instead of silently normalizing them.

---

# Redraft Round 1

## Phase 6: Fix frontmatter metadata issues #1 and #2

- **Agent**: `rdpi-redraft`
- **Output**: `01-core-contract-analysis.md`, `02-test-topology-analysis.md`
- **Depends on**: 5
- **Retry limit**: 2
- **Review issues**: 1, 2

### Prompt

Read REVIEW.md at `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/REVIEW.md`.
Your assigned issues: #1, #2.
Affected files: `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/01-core-contract-analysis.md`, `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/02-test-topology-analysis.md`.
Fix only your assigned issues.

---

## Phase 7: Re-review after Redraft Round 1

- **Agent**: `rdpi-research-reviewer`
- **Output**: Updates `README.md`
- **Depends on**: 6
- **Retry limit**: 2

### Prompt

Re-verify all files modified in Redraft Round 1:
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/01-core-contract-analysis.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/02-test-topology-analysis.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/REVIEW.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/README.md`

Confirm that the Review.md issues addressed in this round are fully resolved, that workflow metadata is now consistent with the `.thoughts` workflow rules, and update `README.md` accordingly using the original research review criteria.

---

# Redraft Round 2

## Phase 8: Fix review metadata and stale issue bookkeeping

- **Agent**: `rdpi-redraft`
- **Output**: `REVIEW.md`
- **Depends on**: 7
- **Retry limit**: 2
- **Review issues**: 1, 2

### Prompt

Read REVIEW.md at `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/REVIEW.md`.
Your assigned issues: #1, #2.
Affected files: `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/REVIEW.md`.
Fix only your assigned issues.

---

## Phase 9: Re-review after Redraft Round 2

- **Agent**: `rdpi-research-reviewer`
- **Output**: Updates `README.md`
- **Depends on**: 8
- **Retry limit**: 2

### Prompt

Re-verify all files modified in Redraft Round 2:
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/REVIEW.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/README.md`

Confirm that the Review.md issues addressed in this round are fully resolved, that review bookkeeping now matches the current redraft state, and update `README.md` accordingly using the original research review criteria.

---