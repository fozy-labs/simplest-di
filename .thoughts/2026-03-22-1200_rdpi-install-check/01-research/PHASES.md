---
workflow_version: b0.5
title: "Phases: 01-research"
date: 2026-03-22
stage: 01-research
feature: "RDPI installation check"
task: "../TASK.md"
---

# Phases: 01-research

## Phase 1: Codebase Startup Proof

- **Agent**: `rdpi-codebase-researcher`
- **Output**: `01-codebase-startup.md`
- **Depends on**: —
- **Retry limit**: 1

### Prompt

Read `../TASK.md` and `../../../package.json`.

Your scope is startup verification only. Confirm that `rdpi-codebase-researcher` launches successfully in this repository context, then write a minimal proof-of-run note to `01-codebase-startup.md`.

The output must stay minimal and include only:
- a short heading,
- the agent name,
- the files you read,
- a one-sentence confirmation that startup succeeded.

Do not inspect additional repository files unless strictly required to confirm launch. Do not perform normal codebase research. Stop immediately after writing the minimal proof-of-run output.

---

## Phase 2: External Startup Proof

- **Agent**: `rdpi-external-researcher`
- **Output**: `02-external-startup.md`
- **Depends on**: —
- **Retry limit**: 1

### Prompt

Read `../TASK.md`.

Your scope is startup verification only. Confirm that `rdpi-external-researcher` launches successfully for this workflow, then write a minimal proof-of-run note to `02-external-startup.md`.

The output must stay minimal and include only:
- a short heading,
- the agent name,
- the file you read,
- a one-sentence confirmation that startup succeeded,
- a one-sentence note that no substantive external research was performed because this run is limited to launch verification.

Do not perform external research beyond what is needed to confirm successful startup. Stop immediately after writing the minimal proof-of-run output.

---

## Phase 3: Questioner Startup Proof

- **Agent**: `rdpi-questioner`
- **Output**: `03-questioner-startup.md`
- **Depends on**: —
- **Retry limit**: 1

### Prompt

Read `../TASK.md`.

Your scope is startup verification only. Confirm that `rdpi-questioner` launches successfully for this workflow, then write a minimal proof-of-run note to `03-questioner-startup.md`.

The output must stay minimal and include only:
- a short heading,
- the agent name,
- the file you read,
- a one-sentence confirmation that startup succeeded,
- either `No blocking startup question.` or one short startup-related question if launch itself was blocked.

Do not expand into normal discovery, clarification, or repository analysis. Stop immediately after writing the minimal proof-of-run output.

---

## Phase 4: Startup Verification Review

- **Agent**: `rdpi-research-reviewer`
- **Output**: Updates `README.md`
- **Depends on**: 1, 2, 3
- **Retry limit**: 1

### Prompt

Read `../TASK.md`, `README.md`, `01-codebase-startup.md`, `02-external-startup.md`, and `03-questioner-startup.md`.

Your scope is startup verification review only. Verify that each required research-stage agent launched, that each output is only a minimal proof-of-run artifact, and that no phase performed broader repository or external analysis.

If the outputs satisfy that startup-only scope, update `README.md` with a concise review outcome suitable for this verification run. If a startup-only requirement was missed, record only the minimal review feedback needed for correction according to normal reviewer behavior.

Do not re-run research. Do not request additional analysis unless it is strictly required to confirm whether startup verification succeeded. Stop after completing the minimal review action.

---
