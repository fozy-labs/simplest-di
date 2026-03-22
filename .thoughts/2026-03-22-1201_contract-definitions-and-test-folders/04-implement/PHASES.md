---
workflow_version: b0.5
title: "Phases: 04-implement"
date: 2026-03-22
stage: 04-implement
language: en
rdpi-version: b0.5
---

# Phases: 04-implement

## Phase 1: Implement contract definition runtime

- **Agent**: `rdpi-codder`
- **Output**: Code changes per `../03-plan/01-contract-definition-runtime.md`
- **Depends on**: —
- **Retry limit**: 2

### Prompt

Repository root: `d:/Area/projects/fz/simplest-di`
Stage directory: `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement`

Read these files before editing:
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/TASK.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/README.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/README.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/01-architecture.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/02-dataflow.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/03-model.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/04-decisions.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/05-usecases.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/06-testcases.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/08-risks.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/README.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/01-contract-definition-runtime.md`

Implement only plan phase 1. Execute Tasks 1.1 through 1.8 in order and keep the work strictly within this phase scope:
- `src/core/di.types.ts`
- `src/core/getInjectOptions.ts`
- `src/core/inject.ts`
- `src/core/Scope.ts`
- `src/core/errors.ts`
- `src/core/errors.test.ts`
- `src/core/getInjectOptions.test.ts`
- `src/core/inject.test.ts`
- `src/core/Scope.test.ts`

Constraints:
- Keep the public API centered on `inject.define`; do not add a new named contract export or a new package subpath.
- Preserve constructor-based injection behavior when `define()` is not used.
- Allow contract-backed object identity for singleton and scoped caches exactly as described by the approved design.
- Keep TypeScript strict-mode compatibility and follow existing repository patterns for naming, imports, barrel behavior, and test style.
- Use `@/*` alias imports when changing or adding imports under `src/`.
- Do not relocate tests, edit docs, or expand into phase 2 or phase 3 work.
- If `npm run ts-check` fails after implementation, fix the issue within this phase scope with at most 2 attempts. If still blocked, document the blocker for the orchestrator and stop.

---

## Phase 2: Verify contract definition runtime

- **Agent**: `rdpi-tester`
- **Output**: `verification-1.md`
- **Depends on**: 1
- **Retry limit**: 1

### Prompt

Repository root: `d:/Area/projects/fz/simplest-di`
Verification output: `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/verification-1.md`

Read these files before verifying:
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/01-contract-definition-runtime.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/01-architecture.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/02-dataflow.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/04-decisions.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/06-testcases.md`

Verify the completed phase-1 implementation only.

Run from the repository root:
- `npm run ts-check`
- `npx vitest run src/core/errors.test.ts src/core/getInjectOptions.test.ts src/core/inject.test.ts src/core/Scope.test.ts`

Check and report pass or fail for each of these items:
- TypeScript compiles after the phase-1 runtime changes.
- Core tests cover contract identity, missing-binding failure, object-shaped provider binding, rebinding freeze after first resolution, contract-token cache ownership, and constructor-path non-regression.
- No phase-2 relocation work or phase-3 docs/export work leaked into this implementation.

Write `verification-1.md` with frontmatter fields `workflow_version`, `title`, `date`, `stage`, `role`, `language`, and `rdpi-version`, then include:
- Commands executed
- Pass/fail per verification item
- Failure details and affected files if anything fails
- A concise conclusion stating whether the stage can proceed to phase 2

If verification fails, do not modify code. Report the failure to the orchestrator through the verification file.

---

## Phase 3: Relocate unit tests and preserve fixture boundaries

- **Agent**: `rdpi-codder`
- **Output**: Code changes per `../03-plan/02-test-relocation-and-fixtures.md`
- **Depends on**: 2
- **Retry limit**: 2

### Prompt

Repository root: `d:/Area/projects/fz/simplest-di`
Stage directory: `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement`

Read these files before editing:
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/TASK.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/README.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/README.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/01-architecture.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/03-model.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/04-decisions.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/05-usecases.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/06-testcases.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/README.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/02-test-relocation-and-fixtures.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/verification-1.md`

Implement only plan phase 2. Execute Tasks 2.1 through 2.3 in order.

Scope for file creation and deletion:
- Create `src/core/__tests__/errors.test.ts`, `src/core/__tests__/getInjectOptions.test.ts`, `src/core/__tests__/getInjectorName.test.ts`, `src/core/__tests__/inject.test.ts`, `src/core/__tests__/injectable.test.ts`, and `src/core/__tests__/Scope.test.ts`
- Delete `src/core/errors.test.ts`, `src/core/getInjectOptions.test.ts`, `src/core/getInjectorName.test.ts`, `src/core/inject.test.ts`, `src/core/injectable.test.ts`, and `src/core/Scope.test.ts`
- Create `src/react/__tests__/reactDi.test.tsx`, `src/react/__tests__/useConstant.test.ts`, and `src/react/__tests__/useSafeMount.test.tsx`
- Delete `src/react/reactDi.test.tsx`, `src/react/useConstant.test.ts`, and `src/react/useSafeMount.test.tsx`
- Audit only, and change only if strictly required by discovered incompatibility: `src/__tests__/setup.ts`, `src/__tests__/helpers/singleton-reset.ts`, `src/__tests__/integration/exports.test.ts`, `src/__tests__/integration/scoped-lifecycle.test.tsx`, `vitest.config.ts`, `tsconfig.test.json`

Constraints:
- Preserve test names and assertions; this phase is a topology move, not a semantic rewrite.
- Convert relocated `useConstant` and `useSafeMount` suites to alias-based imports so they are independent from source adjacency.
- Keep `vitest.config.ts`, `tsconfig.test.json`, and the shared `src/__tests__/` infrastructure unchanged unless relocation reveals a concrete breakage that must be fixed.
- Do not modify phase-1 runtime files except for import-path fallout inside moved tests.
- Leave the repository compilable before finishing the phase. If `npm run ts-check` fails, fix only phase-2-scope issues with at most 2 attempts.

---

## Phase 4: Verify test relocation and fixture boundaries

- **Agent**: `rdpi-tester`
- **Output**: `verification-2.md`
- **Depends on**: 3
- **Retry limit**: 1

### Prompt

Repository root: `d:/Area/projects/fz/simplest-di`
Verification output: `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/verification-2.md`

Read these files before verifying:
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/02-test-relocation-and-fixtures.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/01-architecture.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/04-decisions.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/06-testcases.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/verification-1.md`

Verify the completed phase-2 relocation only.

Run from the repository root:
- `npm run ts-check`
- `npm run test`

Also verify these repository conditions:
- No source-adjacent `*.test.ts` or `*.test.tsx` files remain under `src/core/` or `src/react/`.
- The relocated `useConstant` and `useSafeMount` suites use alias-based imports.
- `src/__tests__/setup.ts`, `src/__tests__/helpers/`, and `src/__tests__/integration/` remain the shared infrastructure boundary.
- `vitest.config.ts` and `tsconfig.test.json` stayed unchanged unless a concrete relocation breakage made an edit necessary.

Write `verification-2.md` with frontmatter fields `workflow_version`, `title`, `date`, `stage`, `role`, `language`, and `rdpi-version`, then include:
- Commands executed
- Pass/fail per verification item
- Any unexpected scope expansion or config churn
- A concise conclusion stating whether the stage can proceed to phase 3

If verification fails, do not modify code. Report the failure to the orchestrator through the verification file.

---

## Phase 5: Finish docs, exports, and integration regression

- **Agent**: `rdpi-codder`
- **Output**: Code changes per `../03-plan/03-docs-exports-and-regression.md`
- **Depends on**: 2, 4
- **Retry limit**: 2

### Prompt

Repository root: `d:/Area/projects/fz/simplest-di`
Stage directory: `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement`

Read these files before editing:
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/TASK.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/README.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/README.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/01-architecture.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/02-dataflow.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/04-decisions.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/05-usecases.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/06-testcases.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/07-docs.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/08-risks.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/README.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/03-docs-exports-and-regression.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/verification-1.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/verification-2.md`

Implement only plan phase 3. Execute Tasks 3.1 through 3.4 in order.

Primary phase scope:
- `src/__tests__/integration/exports.test.ts`
- `src/__tests__/integration/scoped-lifecycle.test.tsx`
- `README.md`
- `docs/concepts.md`
- `docs/react-integration.md`
- `docs/CHANGELOG.md`

Fallback-only scope if a regression proves it necessary:
- `src/index.ts`
- `src/core/index.ts`

Constraints:
- Keep the public package surface centered on `inject`; `inject.define` must be reachable from the root import without introducing a separate named contract export requirement.
- Do not invent a React-specific DI API. React usage must remain grounded in `setupReactDi` and `DiScopeProvider`.
- Keep documentation proportional to the existing repository docs footprint; do not add demo or app work.
- Preserve the approved runtime semantics: object identity, bind-before-first-resolution, missing-binding failure, object-shaped provider support, unchanged constructor injection, and unchanged React entry points.
- Keep edits limited to phase-3 scope and fix any `npm run ts-check` fallout only within that scope, with at most 2 attempts.

---

## Phase 6: Verify docs, exports, and integration regression

- **Agent**: `rdpi-tester`
- **Output**: `verification-3.md`
- **Depends on**: 5
- **Retry limit**: 1

### Prompt

Repository root: `d:/Area/projects/fz/simplest-di`
Verification output: `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/verification-3.md`

Read these files before verifying:
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/03-docs-exports-and-regression.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/04-decisions.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/06-testcases.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/07-docs.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/08-risks.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/verification-1.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/verification-2.md`

Verify the completed phase-3 implementation only.

Run from the repository root:
- `npm run ts-check`
- `npm run test`

Check and report pass or fail for each of these items:
- Root-import access to `inject.define` is verified without introducing a new required named export.
- React scoped integration covers bound contracts through `DiScopeProvider` while constructor-based flows still work.
- `README.md`, `docs/concepts.md`, `docs/react-integration.md`, and `docs/CHANGELOG.md` describe the approved semantics consistently.
- No phase-3 changes widened the package surface or introduced out-of-scope documentation work.

Write `verification-3.md` with frontmatter fields `workflow_version`, `title`, `date`, `stage`, `role`, `language`, and `rdpi-version`, then include:
- Commands executed
- Pass/fail per verification item
- Any remaining regression or documentation drift
- A concise conclusion stating whether the implementation is ready for final review

If verification fails, do not modify code. Report the failure to the orchestrator through the verification file.

---

## Phase 7: Final implementation review

- **Agent**: `rdpi-implement-reviewer`
- **Output**: Updates `README.md`
- **Depends on**: 1, 2, 3, 4, 5, 6
- **Retry limit**: 2

### Prompt

Repository root: `d:/Area/projects/fz/simplest-di`
Stage README to replace: `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/README.md`

Read these files before reviewing:
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/TASK.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/01-research/README.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/02-design/README.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/README.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/01-contract-definition-runtime.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/02-test-relocation-and-fixtures.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/03-docs-exports-and-regression.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/verification-1.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/verification-2.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/verification-3.md`

Review the entire implementation for traceability to the approved plan package.

Replace `README.md` with the final implementation record using frontmatter fields `workflow_version`, `title`, `date`, `status`, `feature`, `plan`, `language`, and `rdpi-version`.

The final README must include:
- Implementation status and explicit traceability to `../03-plan/README.md`
- Phase completion status for plan phases 1 through 3
- Verification summary based on `verification-1.md`, `verification-2.md`, and `verification-3.md`
- Quality Review with a checklist covering: all plan phases implemented, verification passed, no out-of-scope files modified, code follows project patterns, barrel exports are correct, TypeScript strict mode remains intact, docs are proportional, and no security-relevant regressions were introduced
- Issues Found, if any
- Change Summary with the full list of changed files
- Post-Implementation Recommendations
- Recommended commit message in conventional-commit format

Set the README status to `Draft` if the implementation is ready for approval, or `Redraft` if blocking issues remain. Do not create any files other than the updated stage README.

---

# Redraft Round 1

## Phase 8: Fix verification-3 frontmatter metadata

- **Agent**: `rdpi-redraft`
- **Output**: `verification-3.md`
- **Depends on**: 7
- **Retry limit**: 2
- **Review issues**: 1

### Prompt

Repository root: `d:/Area/projects/fz/simplest-di`
Stage directory: `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement`
Review record: `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/README.md`

Read these files before editing:
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/README.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/verification-1.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/verification-2.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/verification-3.md`

Your assigned issue is issue #1 from the implementation review recorded in `README.md`: `verification-3.md` has invalid YAML frontmatter because the opening `---` delimiter is missing.

Fix only the workflow metadata/bookkeeping problem in `verification-3.md`.

Constraints:
- Do not modify repository source code, tests, docs, or any files outside `verification-3.md`.
- Preserve the existing verification body and conclusions; change only the frontmatter structure needed to make the artifact workflow-valid.
- Keep the file language and frontmatter fields aligned with the valid verification artifacts in `verification-1.md` and `verification-2.md`.

---

## Phase 9: Re-review after Redraft Round 1

- **Agent**: `rdpi-implement-reviewer`
- **Output**: Updates `README.md`
- **Depends on**: 8
- **Retry limit**: 2

### Prompt

Repository root: `d:/Area/projects/fz/simplest-di`
Stage README to update: `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/README.md`

Read these files before reviewing:
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/03-plan/README.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/verification-1.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/verification-2.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/verification-3.md`
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/README.md`

Re-review only the files modified in Redraft Round 1:
- `d:/Area/projects/fz/simplest-di/.thoughts/2026-03-22-1201_contract-definitions-and-test-folders/04-implement/verification-3.md`

Confirm whether the verification artifact is now workflow-valid and whether the implementation record can leave redraft status. Update `README.md` accordingly using the existing implementation-review structure and criteria, without reopening unrelated implementation scope.

---
