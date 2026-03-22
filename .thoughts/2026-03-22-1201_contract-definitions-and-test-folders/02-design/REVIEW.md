---
title: "Review: 02-design"
date: 2026-03-22
status: Approved
stage: 02-design
---

## Source
Reviewer agent output in README.md Quality Review, plus approval-gate sanity check for output presence, file non-emptiness, review-criteria coverage, and redraft-round state.

## Issues Summary
- Critical: 0
- High: 1
- Medium: 0
- Low: 0

## Issues
1. The domain model's provider typing is internally inconsistent with the approved architecture and ADRs.
Where: 03-model.md, sections Type Model, Internal State Model, and Type and Relationship Model.
What's wrong: the model defines contract provider and stored descriptor types around InjectOptions<Constructor<T>> and InjectComputedOptions<Constructor<T>>, which implies object-form providers produce Constructor<T> rather than contract instance type T. That conflicts with 01-architecture.md and ADR-3 in 04-decisions.md, both of which state binding must accept constructor-backed or object-shaped providers for the contract itself and that inject(contract) resolves instances of T.
What's expected: describe provider and normalized descriptor shapes that stay instance-oriented for contract type T while still allowing constructors as one binding form.
Severity: High
Source: Reviewer
Checklist item: 10

## Recommendations
- Align the 03-model.md type sketches with the architecture language by modeling provider inputs and normalized descriptors around contract instance type T, not Constructor<T>.
- After the type model is corrected, re-run the internal-consistency pass across 01-architecture.md, 02-dataflow.md, 03-model.md, and 05-usecases.md to ensure the same provider semantics appear everywhere.