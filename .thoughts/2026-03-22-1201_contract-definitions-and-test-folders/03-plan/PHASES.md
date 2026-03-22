---
workflow_version: b0.5
title: "Phases: 03-plan"
date: 2026-03-22
stage: 03-plan
language: en
rdpi-version: b0.5
---

# Phases: 03-plan

## Phase 1: Build the implementation plan package

- **Agent**: `rdpi-planner`
- **Output**: `README.md`, `01-contract-definition-runtime.md`, `02-test-relocation-and-fixtures.md`, `03-docs-exports-and-regression.md`
- **Depends on**: —
- **Retry limit**: 2

### Prompt

Create the implementation plan package for feature `Contract definitions and test folder relocation` in `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/`.

Read these inputs first:
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/TASK.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/README.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/README.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/01-architecture.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/02-dataflow.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/03-model.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/04-decisions.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/05-usecases.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/06-testcases.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/07-docs.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/08-risks.md`

Repository root: `d:/Area/projects/fz/simplest-di`.

Before writing the plan, verify all referenced repository file paths with search against the actual repository. The current repository surface already suggests these likely touchpoints, which must be verified before they appear in the plan: `src/index.ts`, `src/core/`, `src/react/`, `src/__tests__/`, `docs/concepts.md`, `docs/react-integration.md`, `docs/CHANGELOG.md`, `README.md`, `vitest.config.ts`, `tsconfig.test.json`, `package.json`, and any core/react test files that are still source-adjacent.

Your analysis must, before drafting outputs:
1. Map every approved design component to concrete repository file actions (`Create`, `Modify`, or `Delete`).
2. Identify dependency order between changes and separate parallelizable work from strictly sequential work.
3. Estimate task complexity as `Low`, `Medium`, or `High`.
4. Define verification criteria per implementation phase, with `npm run ts-check` as the minimum gate.
5. Keep every implementation phase in a compilable state.
6. Keep the design package authoritative; do not introduce new design decisions.

Scope that must be explicitly covered in the plan:
- Contract-definition runtime and type work for `inject.define`, including contract token identity, bind-time behavior, constructor compatibility, object-shaped provider support, lifecycle interaction for singleton/scoped/transient resolution, cache ownership, and diagnostic naming.
- Package-surface and export implications, including how the new API remains centered on the existing `inject` export.
- Relocation of source-adjacent unit tests into `src/core/__tests__/` and `src/react/__tests__/`, including import normalization for relocated React hook tests and preservation of the current shared `src/__tests__/` infrastructure boundary.
- Verification tasks tied to the approved QA and risk documents, including export checks, runtime regression coverage, relocation/discovery confidence, and proportional documentation updates.
- Documentation surfaces identified by the design package, including root `README.md`, `docs/concepts.md`, `docs/react-integration.md`, and `docs/CHANGELOG.md`, but only if the paths exist on disk.

There is one approved-design consistency hotspot recorded in `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/README.md`: `03-model.md` currently describes provider typing in a way that conflicts with the approved architecture and ADR set. Reflect that in the implementation plan as explicit reconciliation work traced back to the approved architecture/decisions documents. Do not invent behavior beyond reconciling the already approved package.

Produce exactly these stage outputs:
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/README.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/01-contract-definition-runtime.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/02-test-relocation-and-fixtures.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/03-docs-exports-and-regression.md`

Output requirements:
- `README.md` must contain `Overview`, `Phase Map`, `Phase Summary`, `Execution Rules`, and `Next Steps`.
- `README.md` must include a Mermaid dependency graph for the implementation phases and a summary table that identifies dependencies, parallelism, and main verification gates.
- Each `NN-*.md` phase file must include frontmatter with `title`, `date`, `stage`, `role`, `language`, and `rdpi-version`.
- Each phase file must contain `Goal`, `Dependencies`, `Execution`, `Tasks`, and `Verification` sections.
- Every task must name the exact repository file path, the exact action (`Create`, `Modify`, `Delete`), a concrete change description, the design section it implements, and a `Low`/`Medium`/`High` complexity estimate.
- No vague tasks, no placeholder paths, no phases that leave the repository uncompilable.
- Keep documentation work proportional to this repository. Do not create demo or app tasks unless those paths are verified to exist.

---

# Redraft Round 1

## Phase 3: Fix issues #1 and #2 in plan phase files

- **Agent**: `rdpi-redraft`
- **Output**: `01-contract-definition-runtime.md`, `02-test-relocation-and-fixtures.md`
- **Depends on**: 2
- **Retry limit**: 2
- **Review issues**: 1, 2

### Prompt

Read REVIEW.md at `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/REVIEW.md`.
Your assigned issues: #1, #2.
Affected files: `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/01-contract-definition-runtime.md`, `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/02-test-relocation-and-fixtures.md`.
Fix only your assigned issues.

---

## Phase 4: Re-review after Redraft Round 1

- **Agent**: `rdpi-plan-reviewer`
- **Output**: Updates `README.md`
- **Depends on**: 3
- **Retry limit**: 2

### Prompt

Re-review the redrafted outputs for feature `Contract definitions and test folder relocation` in `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/`.

Read the original review criteria and issues:
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/REVIEW.md`

Re-verify all files modified by the fix phase in this round:
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/01-contract-definition-runtime.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/02-test-relocation-and-fixtures.md`

Use the original 03-plan review criteria from the stage package and confirm that the redraft resolves the recorded issues without introducing new scope. Update `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/README.md` with the re-review outcome.

---

## Phase 2: Review plan traceability and readiness

- **Agent**: `rdpi-plan-reviewer`
- **Output**: Updates `README.md`
- **Depends on**: 1
- **Retry limit**: 2

### Prompt

Review the plan package for feature `Contract definitions and test folder relocation` in `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/`.

Read all plan outputs:
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/README.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/01-contract-definition-runtime.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/02-test-relocation-and-fixtures.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/03-docs-exports-and-regression.md`

Read the authoritative design package for traceability:
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/README.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/01-architecture.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/02-dataflow.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/03-model.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/04-decisions.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/05-usecases.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/06-testcases.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/07-docs.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/08-risks.md`

Also read the task and research summary for scope guardrails:
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/TASK.md`
- `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/README.md`

Review criteria:
1. Every approved design component is mapped to at least one concrete plan task.
2. All repository file paths are concrete and plausibly verified rather than placeholders.
3. Phase dependencies are correct and no phase consumes work from a later phase.
4. Each implementation phase includes verification criteria.
5. Each implementation phase leaves the repository in a compilable state with `npm run ts-check` as a minimum gate.
6. No vague tasks remain; each task specifies exact file changes.
7. Every task references the exact design section it implements.
8. Parallelizable versus sequential work is marked correctly.
9. Every task includes a `Low`/`Medium`/`High` complexity estimate.
10. Documentation and changelog tasks are proportional to the existing repository docs surface.
11. `README.md` contains a Mermaid dependency graph and a complete phase summary table.
12. The plan explicitly accounts for the known design-package inconsistency noted in `02-design/README.md` without introducing new design scope.

Update `.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/README.md` by adding a `## Quality Review` section and setting the stage status to `Draft` if the package passes review. If it does not pass, record concrete issues in the quality review section.

---