---
workflow_version: b0.5
title: "Research: Contract definitions and test folder relocation"
date: 2026-03-22
status: Approved
feature: "Contract definitions and test folder relocation"
language: en
rdpi-version: b0.5
---

## Summary
The four research outputs remain substantively consistent with the previous review. The repository still has a mixed DI contract surface and a mixed test topology: `inject()` already accepts constructor inputs and object-shaped `InjectOptions`, but scoped storage and several generic seams remain constructor-oriented, while tests remain split between source-adjacent files under `src/core` and `src/react` and shared infrastructure under `src/__tests__`.

Re-verification against the current on-disk [REVIEW.md](./REVIEW.md) shows that the stage-level review artifacts are now aligned on workflow metadata and issue bookkeeping. [README.md](./README.md), [PHASES.md](./PHASES.md), and [REVIEW.md](./REVIEW.md) all carry the required workflow metadata fields, and [REVIEW.md](./REVIEW.md) now records zero unresolved issues. On the original research review criteria, the research outputs continue to pass the frontmatter, reference, sourcing, actionability, and no-solutions checks.

No unresolved stage-review issues remain. The remaining work is normal human approval flow for the research stage rather than additional correction of the research outputs or the review bookkeeping.

## Documents
- [Core Contract Analysis](./01-core-contract-analysis.md)
- [Test Topology Analysis](./02-test-topology-analysis.md)
- [External Patterns](./03-external-patterns.md)
- [Open Questions](./04-open-questions.md)

## Key Findings
- The current DI runtime already supports object-shaped `InjectOptions`, but constructor-derived defaults and `Scope`'s constructor-typed storage leave contract-definition support only partially generalized; see [Core Contract Analysis](./01-core-contract-analysis.md) and [Open Questions](./04-open-questions.md).
- The published package surface is top-level only through `src/index.ts` and the root export map, so any contract-definition API becomes part of the root package surface unless packaging changes are introduced; see [Core Contract Analysis](./01-core-contract-analysis.md).
- The move scope currently covers six source-adjacent core tests and three source-adjacent react tests, while shared setup and integration coverage already live under `src/__tests__`; see [Test Topology Analysis](./02-test-topology-analysis.md).
- Most moved-test candidates already use alias-based imports, but `useConstant.test.ts` and `useSafeMount.test.tsx` are directly coupled to file adjacency through relative imports; see [Test Topology Analysis](./02-test-topology-analysis.md).
- Repository test discovery is filename-suffix based through shared Vitest config and `tsconfig.test.json`, which matches the external finding that `__tests__` folders are not sufficient for Vitest without compatible include rules; see [Test Topology Analysis](./02-test-topology-analysis.md) and [External Patterns](./03-external-patterns.md).
- External DI research shows a consistent token-plus-binding split across Angular, InversifyJS, tsyringe, and NestJS, but no primary-source consensus that object tokens, symbols, or strings are universally best; see [External Patterns](./03-external-patterns.md).
- Stage-level workflow metadata and review bookkeeping are now consistent across [README.md](./README.md), [PHASES.md](./PHASES.md), and [REVIEW.md](./REVIEW.md); no unresolved review issues remain for this stage.

## Contradictions and Gaps
No contradictions were found across the four research outputs.

The main research gap remains the same as before: the task assumption prefers adding `inject.define<T>(name)` without deeper runtime change, but the codebase still contains constructor-oriented seams in scoped storage and public generic bounds. This is described consistently in [Core Contract Analysis](./01-core-contract-analysis.md) and escalated in [Open Questions](./04-open-questions.md).

No unresolved stage-level review gaps remain. The open items captured in [Open Questions](./04-open-questions.md) are design-stage decisions, not defects in the research-stage artifacts.

## Quality Review

### Checklist
| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 1 | All phases produced output files | PASS | `01-core-contract-analysis.md`, `02-test-topology-analysis.md`, `03-external-patterns.md`, and `04-open-questions.md` are present, matching [PHASES.md](./PHASES.md). |
| 2 | Codebase analysis has exact file:line references | PASS | All `@/path:line` references found in the reviewed research docs resolve to existing files and valid line numbers. |
| 3 | External research has source + confidence annotations | PASS | [03-external-patterns.md](./03-external-patterns.md) annotates major claims with sources, evidence type, and confidence, and includes a consolidated Sources section. |
| 4 | Open questions are actionable and prioritized | PASS | [04-open-questions.md](./04-open-questions.md) is grouped by High/Medium/Low priority and each question includes context, ambiguity, options, risks, and a stage recommendation. |
| 5 | No solutions or design proposals in research | PASS | [01-core-contract-analysis.md](./01-core-contract-analysis.md), [02-test-topology-analysis.md](./02-test-topology-analysis.md), and [03-external-patterns.md](./03-external-patterns.md) remain factual; [04-open-questions.md](./04-open-questions.md) frames choices as unresolved questions rather than prescribing an implementation. |
| 6 | YAML frontmatter present on all files | PASS | The research outputs all contain complete frontmatter, and the stage-level review artifacts [README.md](./README.md), [PHASES.md](./PHASES.md), and [REVIEW.md](./REVIEW.md) now all carry `workflow_version`, `language`, and `rdpi-version`. |
| 7 | Cross-references consistent between documents | PASS | The four research outputs remain cross-consistent, and the stage-level review artifacts now agree on metadata and issue bookkeeping: [REVIEW.md](./REVIEW.md) records zero unresolved issues and no longer conflicts with the current artifact state. |

### Issues Found
No issues found.

## Next Steps
Proceeds to Design stage after human review.