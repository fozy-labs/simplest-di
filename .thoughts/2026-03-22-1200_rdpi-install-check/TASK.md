---
workflow_version: b0.5
title: RDPI installation check
created_at: 2026-03-22T12:00:00Z
language: en
---

# Task

Run the RDPI pipeline as a normal workflow, but only to verify subagent startup correctness.

Constraints:
- Do not perform feature work on the repository.
- Each RDPI subagent should only validate that it can be launched correctly and produce minimal proof-of-run output.
- Create files in .thoughts exactly as a normal RDPI run would.
