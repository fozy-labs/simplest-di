---
workflow_version: b0.5
title: "Phase 3: Docs, exports, and regression"
date: 2026-03-22
stage: 03-plan
role: rdpi-planner
language: en
rdpi-version: b0.5
---

## Goal
Finish the feature by verifying the root package surface, adding integration coverage for bound contracts in React scope usage, and updating the verified documentation surfaces so they describe the approved semantics without expanding beyond the existing `inject`-centered API.

## Dependencies
- **Requires**: Phase 1 and Phase 2
- **Blocks**: None

## Execution
Sequential. This phase must run after the runtime is stable and the unit-test topology is final so that export checks, React integration coverage, and documentation all describe the implemented end state.

## Tasks

### Task 3.1: Extend package-barrel regression coverage for `inject.define`
- **File**: `src/__tests__/integration/exports.test.ts`
- **Action**: Modify
- **Description**: Extend the export integration suite so it verifies that consumers can reach `inject.define` from the existing root package import and that no new named contract export becomes required.
- **Details**: Keep the package surface centered on `inject`, verify that existing core/react exports remain intact, and treat any need to change `src/index.ts` or `src/core/index.ts` as a regression signal rather than a planned surface expansion. [ref: ../02-design/04-decisions.md#adr-1-keep-the-public-api-centered-on-injectdefine] [ref: ../02-design/05-usecases.md#export-surface-verification-expectations] [ref: ../02-design/06-testcases.md#test-cases] [ref: ../02-design/07-docs.md#required-public-facing-verification-touchpoints]
- **Complexity**: Medium

### Task 3.2: Add React-scoped integration coverage for bound contracts
- **File**: `src/__tests__/integration/scoped-lifecycle.test.tsx`
- **Action**: Modify
- **Description**: Add an integration scenario where a contract defined through `inject.define` is bound to a scoped implementation and resolved inside `DiScopeProvider`, while constructor-based consumers continue to behave unchanged in the same graph.
- **Details**: Cover binding-as-registration for scoped contracts, scope-presence requirements, lifecycle hooks, and coexistence of contract-backed and constructor-backed call sites through the existing React integration surface. [ref: ../02-design/02-dataflow.md#flow-3-bound-scoped-contract-resolution] [ref: ../02-design/05-usecases.md#uc-3-use-a-bound-scoped-contract-in-react-without-creating-a-separate-react-specific-api] [ref: ../02-design/06-testcases.md#test-cases] [ref: ../02-design/08-risks.md#r3-scoperuntime-incompatibility-remains-in-constructor-oriented-seams-causing-bound-contracts-to-fail-or-behave-differently-in-scoped-resolution]
- **Complexity**: High

### Task 3.3: Update the public conceptual documentation for the new contract model
- **File**: `README.md`
- **Action**: Modify
- **Description**: Adjust the package landing documentation so the API summary and examples mention `inject.define` through the existing root import path.
- **Details**: This documentation batch also includes `docs/concepts.md` (**Modify**) to explain contract identity, binding timing, missing-binding failure, object-shaped provider support, and the rule that constructor injection remains valid and unchanged. Keep the narrative proportional to the current repository docs surface and do not introduce demo/app work because no such directories exist in the repository. [ref: ../02-design/07-docs.md#required-documentation-touchpoints] [ref: ../02-design/05-usecases.md#documentation-verification-expectations] [ref: ../02-design/08-risks.md#r6-docs-changelog-and-export-checks-drift-from-the-approved-api-leaving-users-with-mismatched-guidance-about-injectdefine-and-react-usage]
- **Complexity**: Medium

### Task 3.4: Update React-specific guidance and release notes
- **File**: `docs/react-integration.md`
- **Action**: Modify
- **Description**: Clarify that React continues to use `setupReactDi` and `DiScopeProvider`, and explain the scoped contract-binding rule only where it changes user expectations.
- **Details**: This documentation batch also includes `docs/CHANGELOG.md` (**Modify**) to record the new `inject.define` capability, the scoped-contract clarification, and the test-topology relocation as one feature delivery. Do not invent a React-only DI API or separate contract export surface. [ref: ../02-design/01-architecture.md#system-fit] [ref: ../02-design/04-decisions.md#adr-5-treat-binding-as-registration-for-scoped-contracts-while-preserving-existing-scoped-runtime-rules] [ref: ../02-design/07-docs.md#required-documentation-touchpoints]
- **Complexity**: Low

## Verification
- [ ] `npm run ts-check` passes
- [ ] Final integration and unit regression runs pass after the topology move is complete
- [ ] `src/__tests__/integration/exports.test.ts` proves root-import access to `inject.define` without a new required named export
- [ ] `src/__tests__/integration/scoped-lifecycle.test.tsx` proves bound scoped contracts work through `DiScopeProvider` while constructor-based flows remain intact
- [ ] `README.md`, `docs/concepts.md`, `docs/react-integration.md`, and `docs/CHANGELOG.md` all describe object identity, bind-before-first-resolution, missing-binding failure, unchanged constructor injection, and unchanged React entry points consistently