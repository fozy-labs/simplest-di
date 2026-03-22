---
workflow_version: b0.5
title: "Phases: 04-implement"
date: 2026-03-22
stage: 04-implement
task: "../TASK.md"
plan: "../03-plan/README.md"
rdpi-version: b0.5
---

# Phases: 04-implement

## Phase 1: Codder Startup Proof

- **Agent**: `rdpi-codder`
- **Output**: `01-codder-startup.md`
- **Depends on**: —
- **Retry limit**: 2

### Prompt

You are validating RDPI startup behavior only for the 04-implement stage.

Read these files first:
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\TASK.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\01-research\README.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\02-design\README.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\03-plan\README.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\03-plan\PHASES.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\03-plan\01-planner-startup.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\03-plan\02-redraft-startup.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\04-implement\README.md`

Write only `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\04-implement\01-codder-startup.md`.

Scope constraints:
- Verify only that `rdpi-codder` starts successfully in the normal implement-stage workflow.
- Produce a minimal proof-of-run artifact in English with front matter using workflow version `b0.5`.
- Record only concise startup evidence such as agent identity, files read, startup result, and explicit confirmation that no code changes or repository modifications were performed.
- Do not perform code changes, test changes, implementation work, repository edits, debugging, or plan execution.
- Stop immediately after writing the minimal proof-of-run output.

---

## Phase 2: Tester Startup Proof

- **Agent**: `rdpi-tester`
- **Output**: `02-tester-startup.md`
- **Depends on**: —
- **Retry limit**: 2

### Prompt

You are validating RDPI startup behavior only for the 04-implement stage.

Read these files first:
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\TASK.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\01-research\README.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\02-design\README.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\03-plan\README.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\03-plan\PHASES.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\03-plan\01-planner-startup.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\03-plan\02-redraft-startup.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\04-implement\README.md`

Write only `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\04-implement\02-tester-startup.md`.

Scope constraints:
- Verify only that `rdpi-tester` starts successfully in the normal implement-stage workflow.
- Produce a minimal proof-of-run artifact in English with front matter using workflow version `b0.5`.
- Record only concise startup evidence such as agent identity, files read, startup result, and explicit confirmation that no tests were executed or changed.
- Do not perform code changes, test changes, implementation work, repository edits, test execution, or verification beyond startup.
- Stop immediately after writing the minimal proof-of-run output.

---

## Phase 3: Implement Startup Review

- **Agent**: `rdpi-implement-reviewer`
- **Output**: Updates `README.md`
- **Depends on**: 1, 2
- **Retry limit**: 2

### Prompt

You are validating RDPI startup behavior only for the 04-implement stage review.

Read these files first:
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\TASK.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\01-research\README.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\02-design\README.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\03-plan\README.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\03-plan\PHASES.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\03-plan\01-planner-startup.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\03-plan\02-redraft-startup.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\04-implement\README.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\04-implement\01-codder-startup.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\04-implement\02-tester-startup.md`

Update only `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\04-implement\README.md`.

Scope constraints:
- Verify only that `rdpi-codder` and `rdpi-tester` started and produced minimal startup-only proof-of-run outputs.
- Add a concise verification result to `README.md` in English.
- Confirm that the stage remained startup-only and that no code changes, test changes, or substantive implementation work were introduced.
- Do not perform implementation review, code review, test review, defect analysis, or follow-up execution.
- Stop immediately after recording the minimal verification result.

---