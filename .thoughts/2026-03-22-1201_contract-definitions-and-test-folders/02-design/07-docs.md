---
workflow_version: b0.5
title: "Documentation Impact: Contract definitions and test folder relocation"
date: 2026-03-22
stage: 02-design
role: rdpi-architect
language: en
rdpi-version: b0.5
---

## Overview

The documentation impact is limited to high-visibility package guidance and public-surface verification. The feature changes the root DI API by adding `inject.define`, changes the mental model for interface-shaped dependencies, and relocates internal unit tests without changing package import paths or React entry points [ref: ../01-research/01-core-contract-analysis.md#export-surface-and-package-entry-points] [ref: ../01-research/02-test-topology-analysis.md#current-test-layout] [ref: ./04-decisions.md#adr-1-keep-the-public-api-centered-on-injectdefine].

## Required Documentation Touchpoints

### 1. Package concepts documentation

`docs/concepts.md` needs a focused update for the new contract-definition concept:

- what `inject.define` adds to the existing constructor-based model;
- that contract identity is the returned object, not the display name;
- that binding must happen before first resolution and that missing binding fails early;
- that constructor-based injection remains valid and unchanged.

This is the highest-impact conceptual documentation change because the new feature extends the core DI mental model rather than the React-specific surface [ref: ../01-research/01-core-contract-analysis.md#current-contract-surface-already-has-an-object-based-injection-path] [ref: ../01-research/04-open-questions.md#user-answers] [ref: ./04-decisions.md#adr-2-use-the-defined-contract-object-instance-as-runtime-token-identity] [ref: ./04-decisions.md#adr-4-allow-rebinding-only-before-first-resolution].

### 2. React integration documentation

`docs/react-integration.md` only needs adjustment where contract binding affects scoped usage expectations:

- `setupReactDi` and `DiScopeProvider` remain the React entry points;
- examples may need one contract-based scoped scenario if the feature is shown in React;
- the document should distinguish contract binding from the existing `provide` path for constructor-based scoped services.

This remains secondary to the concepts update because the architecture does not add a React-only API [ref: ../01-research/02-test-topology-analysis.md#react-adjacent-source-and-documentation-covered-by-moved-tests] [ref: ./01-architecture.md#system-fit] [ref: ./04-decisions.md#adr-5-treat-binding-as-registration-for-scoped-contracts-while-preserving-existing-scoped-runtime-rules].

### 3. Public package entry documentation

The package landing docs that describe the exported API, especially `README.md`, need a proportional update so the root-package examples and API summary reflect that consumers access the feature through `inject.define` from the same top-level import path. No separate contract export should be documented [ref: ../01-research/01-core-contract-analysis.md#package-level-exposure-is-currently-top-level-only] [ref: ./04-decisions.md#adr-1-keep-the-public-api-centered-on-injectdefine].

### 4. Changelog

`docs/CHANGELOG.md` must record the feature as one release item covering:

- the new `inject.define` capability and its contract-binding semantics;
- any visible React-scoped usage clarification, if shipped;
- the repository test relocation only insofar as it changes verification coverage or maintenance-visible structure.

This is required because the user explicitly included docs, export verification, and changelog updates in the same feature scope [ref: ../01-research/04-open-questions.md#q10-what-level-of-documentation-and-public-surface-verification-must-accompany-the-feature-if-the-api-and-test-layout-change-together] [ref: ../01-research/04-open-questions.md#user-answers].

## Required Public-Facing Verification Touchpoints

- Export-surface verification must confirm the root package exposes `inject.define` without introducing a new named contract export or a new subpath contract entry [ref: ../01-research/01-core-contract-analysis.md#export-surface-and-package-entry-points] [ref: ./04-decisions.md#adr-1-keep-the-public-api-centered-on-injectdefine].
- Documentation verification must confirm that concepts and React docs match the approved semantics for identity, binding timing, missing binding, and unchanged constructor-based injection [ref: ../01-research/04-open-questions.md#user-answers] [ref: ./01-architecture.md#architectural-invariants].