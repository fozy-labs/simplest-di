workflow_version: b0.5
title: "Design: RDPI installation check"
date: 2026-03-22
status: Approved
stage: 02-design
feature: "RDPI installation check"
task: "../TASK.md"
research: "../01-research/README.md"
rdpi-version: b0.5

## Overview
This design stage exists only to verify that the design-stage RDPI agents start successfully in a normal pipeline layout. It does not perform substantive design work and only expects minimal proof-of-run artifacts.

## Phases
- Phase 1: rdpi-architect writes a minimal startup proof in 01-architect-startup.md.
- Phase 2: rdpi-qa-designer writes a minimal startup proof in 02-qa-designer-startup.md.
- Phase 3: rdpi-design-reviewer verifies that both outputs are startup-only and updates this README with the verification result.

## Inputs
- Task: [../TASK.md](../TASK.md)
- Research summary: [../01-research/README.md](../01-research/README.md)

## Startup Verification Review
Outcome: PASS.

Verified items:
- rdpi-architect launched and produced a minimal startup artifact in [01-architect-startup.md](./01-architect-startup.md).
- rdpi-qa-designer launched and produced a minimal startup artifact in [02-qa-designer-startup.md](./02-qa-designer-startup.md).
- Both artifacts remained startup-only and did not expand into substantive design review, synthesis, architecture judgment, or follow-up design work.

## Next Steps
If the startup verification completes cleanly, the pipeline may proceed to the next RDPI stage for the same verification purpose. If any agent cannot start or writes substantive design content, stop the verification run and record the failure.