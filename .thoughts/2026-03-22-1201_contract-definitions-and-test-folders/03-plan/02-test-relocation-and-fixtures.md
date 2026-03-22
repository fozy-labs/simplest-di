---
workflow_version: b0.5
title: "Phase 2: Test relocation and fixtures"
date: 2026-03-22
stage: 03-plan
role: rdpi-planner
language: en
rdpi-version: b0.5
---

## Goal
Relocate the source-adjacent core and react unit tests into `src/core/__tests__/` and `src/react/__tests__/`, normalize imports where relocation changes path assumptions, and preserve the shared `src/__tests__/` setup/helpers/integration boundary without config churn.

## Dependencies
- **Requires**: Phase 1
- **Blocks**: Phase 3

## Execution
Sequential. The relocation must follow Phase 1 because the moved test files need the final runtime assertions added there, and Phase 3 should verify exports and documentation only after the final test topology is in place.

## Tasks

### Task 2.1: Relocate core source-adjacent unit suites into `src/core/__tests__`
- **File**: `src/core/__tests__/errors.test.ts`
- **Action**: Create
- **Description**: Recreate the current errors unit suite under the module-local `__tests__` root and update any imports that are affected by the new folder depth.
- **Details**: This relocation batch also includes `src/core/errors.test.ts` (**Delete**), `src/core/__tests__/getInjectOptions.test.ts` (**Create**), `src/core/getInjectOptions.test.ts` (**Delete**), `src/core/__tests__/getInjectorName.test.ts` (**Create**), `src/core/getInjectorName.test.ts` (**Delete**), `src/core/__tests__/inject.test.ts` (**Create**), `src/core/inject.test.ts` (**Delete**), `src/core/__tests__/injectable.test.ts` (**Create**), `src/core/injectable.test.ts` (**Delete**), `src/core/__tests__/Scope.test.ts` (**Create**), and `src/core/Scope.test.ts` (**Delete**). Preserve test names and assertions so the move is structural, not semantic. [ref: ../02-design/01-architecture.md#repository-topology-boundary] [ref: ../02-design/03-model.md#repository-topology-model] [ref: ../02-design/05-usecases.md#uc-5-relocate-unit-tests-into-per-module-__tests__-directories-without-changing-discovery-behavior]
- **Complexity**: Medium

### Task 2.2: Relocate React unit suites and normalize hook imports
- **File**: `src/react/__tests__/reactDi.test.tsx`
- **Action**: Create
- **Description**: Recreate the current React unit suites under `src/react/__tests__/` and normalize imports so the moved hook tests no longer depend on source adjacency.
- **Details**: This relocation batch also includes `src/react/reactDi.test.tsx` (**Delete**), `src/react/__tests__/useConstant.test.ts` (**Create**), `src/react/useConstant.test.ts` (**Delete**), `src/react/__tests__/useSafeMount.test.tsx` (**Create**), and `src/react/useSafeMount.test.tsx` (**Delete**). Convert the relocated `useConstant` and `useSafeMount` suites to alias-based imports per ADR-6, while keeping the existing `.test.ts` and `.test.tsx` suffixes intact. [ref: ../02-design/01-architecture.md#react-hook-import-strategy] [ref: ../02-design/04-decisions.md#adr-6-standardize-relocated-react-hook-tests-on-alias-based-imports] [ref: ../02-design/05-usecases.md#uc-6-relocate-react-hook-tests-and-make-their-source-references-independent-from-adjacency]
- **Complexity**: Medium

### Task 2.3: Preserve shared-test infrastructure boundaries during relocation
- **File**: `src/__tests__/setup.ts`
- **Action**: Verify
- **Description**: Audit the shared setup and discovery boundary after relocation without claiming a default file edit, and treat any code change as an exception that must be justified by a concrete incompatibility discovered during the move.
- **Details**: Verify that `src/__tests__/setup.ts`, `src/__tests__/helpers/singleton-reset.ts`, `src/__tests__/integration/exports.test.ts`, `src/__tests__/integration/scoped-lifecycle.test.tsx`, `vitest.config.ts`, and `tsconfig.test.json` remain compatible without discovery-rule or setup-path changes. If relocation reveals a real breakage, the implementation must convert that finding into an explicit follow-up edit against the exact affected file rather than silently widening this task's scope. [ref: ../02-design/01-architecture.md#discovery-and-config-boundary] [ref: ../02-design/04-decisions.md#adr-7-keep-vitest-and-typescript-discovery-configuration-unchanged-for-the-chosen-topology] [ref: ../02-design/06-testcases.md#test-cases]
- **Complexity**: Low

## Verification
- [ ] `npm run ts-check` passes
- [ ] Relocated unit suites are discovered and compiled under the unchanged `vitest.config.ts` and `tsconfig.test.json` rules
- [ ] `src/__tests__/setup.ts`, `src/__tests__/helpers/`, and `src/__tests__/integration/` remain the shared infrastructure boundary
- [ ] No source-adjacent `*.test.ts` or `*.test.tsx` files remain under `src/core/` or `src/react/`
- [ ] The relocated `useConstant` and `useSafeMount` suites pass using alias-based imports from `src/react/__tests__/`
