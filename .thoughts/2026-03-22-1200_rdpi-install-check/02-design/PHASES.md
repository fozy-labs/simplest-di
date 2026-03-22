---
workflow_version: b0.5
title: "Phases: 02-design"
date: 2026-03-22
stage: 02-design
task: "../TASK.md"
research: "../01-research/README.md"
rdpi-version: b0.5
---

# Phases: 02-design

## Phase 1: Architect Startup Proof

- **Agent**: `rdpi-architect`
- **Output**: `01-architect-startup.md`
- **Depends on**: —
- **Retry limit**: 2

### Prompt

You are validating RDPI startup behavior only for the 02-design stage.

Read these files first:
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\TASK.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\01-research\README.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\02-design\README.md`

Write only `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\02-design\01-architect-startup.md`.

Scope constraints:
- Verify only that `rdpi-architect` starts successfully in the normal design-stage workflow.
- Produce a minimal proof-of-run artifact in English with front matter using workflow version `b0.5`.
- Record only concise startup evidence such as agent identity, files read, and whether startup succeeded.
- Do not perform repository design analysis, architecture design, option comparison, or recommendations.
- Stop immediately after writing the minimal proof-of-run output.

---

## Phase 2: QA Designer Startup Proof

- **Agent**: `rdpi-qa-designer`
- **Output**: `02-qa-designer-startup.md`
- **Depends on**: —
- **Retry limit**: 2

### Prompt

You are validating RDPI startup behavior only for the 02-design stage.

Read these files first:
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\TASK.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\01-research\README.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\02-design\README.md`

Write only `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\02-design\02-qa-designer-startup.md`.

Scope constraints:
- Verify only that `rdpi-qa-designer` starts successfully in the normal design-stage workflow.
- Produce a minimal proof-of-run artifact in English with front matter using workflow version `b0.5`.
- Record only concise startup evidence such as agent identity, files read, and whether startup succeeded.
- Do not create QA strategy, test planning, acceptance criteria, risk analysis, or any substantive design content.
- Stop immediately after writing the minimal proof-of-run output.

---

## Phase 3: Design Startup Review

- **Agent**: `rdpi-design-reviewer`
- **Output**: Updates `README.md`
- **Depends on**: 1, 2
- **Retry limit**: 2

### Prompt

You are validating RDPI startup behavior only for the 02-design stage review.

Read these files first:
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\TASK.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\01-research\README.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\02-design\README.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\02-design\01-architect-startup.md`
- `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\02-design\02-qa-designer-startup.md`

Update only `d:\Area\projects\fz\simplest-di\.thoughts\2026-03-22-1200_rdpi-install-check\02-design\README.md`.

Scope constraints:
- Verify only that both design-stage agents started and produced minimal startup-only proof-of-run outputs.
- Add a concise verification result to `README.md` in English.
- Do not request or perform substantive design review, design synthesis, architecture judgment, or follow-up design work.
- Stop immediately after recording the minimal verification result.

---