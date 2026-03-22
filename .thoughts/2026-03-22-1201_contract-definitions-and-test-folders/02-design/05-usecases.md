---
workflow_version: b0.5
title: "Use Cases: Contract definitions and test folder relocation"
date: 2026-03-22
stage: 02-design
role: rdpi-architect
language: en
rdpi-version: b0.5
---

## Overview

These use cases describe how library consumers define and bind contracts, how existing constructor-based consumers remain unchanged, and how repository maintainers relocate tests into per-module `__tests__` directories. The scenarios follow the approved architecture of `inject.define` as the only new public API, contract-object identity, bind-before-first-resolution semantics, unchanged constructor-based injection, alias-based React hook test imports after relocation, and unchanged test-discovery configuration [ref: ../01-research/04-open-questions.md#user-answers] [ref: ../01-research/01-core-contract-analysis.md#current-contract-surface-already-has-an-object-based-injection-path] [ref: ../01-research/02-test-topology-analysis.md#vitest-discovery-and-setup-behavior] [ref: ./01-architecture.md#contract-definition-architecture] [ref: ./04-decisions.md#adr-1-keep-the-public-api-centered-on-injectdefine] [ref: ./04-decisions.md#adr-7-keep-vitest-and-typescript-discovery-configuration-unchanged-for-the-chosen-topology].

## Consumer Use Cases

### UC-1: Define a contract once and bind an environment-specific implementation

**Goal**: A consumer wants to declare an interface-shaped dependency once, choose its implementation during bootstrap, and keep downstream call sites independent from environment branching.

```ts
import { inject, injectable } from "@fozy-labs/simplest-di";

interface ChatDataSource {
  fetchChatMessages(): Promise<string[]>;
}

@injectable("SINGLETON")
class ElectronChatDataSource implements ChatDataSource {
  fetchChatMessages() {
    return Promise.resolve(["desktop"]);
  }
}

@injectable("SINGLETON")
class CloudChatDataSource implements ChatDataSource {
  fetchChatMessages() {
    return Promise.resolve(["cloud"]);
  }
}

export const ChatDataSource = inject.define<ChatDataSource>("ChatDataSource");

if (environment.IS_ELECTRON) {
  ChatDataSource.bind(ElectronChatDataSource);
} else {
  ChatDataSource.bind(CloudChatDataSource);
}
```

**Expected behavior**:

- The exported `ChatDataSource` object is the contract identity that must be shared across modules; the string name is diagnostic only [ref: ../01-research/04-open-questions.md#q2-what-runtime-identity-should-a-defined-contract-use] [ref: ./04-decisions.md#adr-2-use-the-defined-contract-object-instance-as-runtime-token-identity].
- `bind()` records provider metadata without creating an instance, so bootstrap stays side-effect-light and resolution remains lazy [ref: ../01-research/04-open-questions.md#q3-how-should-binding-semantics-work-for-environment-specific-implementation-selection] [ref: ./02-dataflow.md#flow-1-contract-definition-and-environment-specific-binding-selection].
- No new named package export is introduced; consumers continue importing from the root package surface [ref: ../01-research/04-open-questions.md#user-answers] [ref: ../01-research/01-core-contract-analysis.md#package-level-exposure-is-currently-top-level-only] [ref: ./04-decisions.md#adr-1-keep-the-public-api-centered-on-injectdefine].

### UC-2: Resolve the contract through `inject()` inside existing application code

**Goal**: A consumer wants to use the contract at call sites without exposing environment selection to the consuming service.

```ts
import { inject, injectable } from "@fozy-labs/simplest-di";
import { ChatDataSource } from "./contracts/ChatDataSource";

@injectable("SINGLETON")
class ChatApi {
  private readonly dataSource = inject(ChatDataSource);

  getMessages() {
    return this.dataSource.fetchChatMessages();
  }
}
```

**Expected behavior**:

- `inject(ChatDataSource)` uses the same normalization and lifetime branching pipeline as constructor-based injection, but caches by the contract object instead of the implementation constructor [ref: ../01-research/01-core-contract-analysis.md#lifetime-resolution-and-caching-rules] [ref: ./02-dataflow.md#flow-2-first-resolution-of-a-bound-contract] [ref: ./03-model.md#runtime-token-model].
- Consumers do not change when the implementation changes from Electron to Cloud or vice versa, because the contract remains the stable resolution root [ref: ../01-research/04-open-questions.md#user-answers] [ref: ./01-architecture.md#binding-storage].
- Constructor-based call sites remain valid and behaviorally unchanged when a contract is not needed [ref: ../01-research/01-core-contract-analysis.md#decorator-metadata-path] [ref: ./01-architecture.md#constructor-compatibility].

### UC-3: Use a bound scoped contract in React without creating a separate React-specific API

**Goal**: A React consumer wants to keep using `DiScopeProvider` and `inject()` while swapping a scoped interface-shaped dependency behind a contract.

```tsx
import { DiScopeProvider, inject, injectable, setupReactDi } from "@fozy-labs/simplest-di";

setupReactDi();

interface RequestSession {
  requestId: string;
}

@injectable({ lifetime: "SCOPED", requireProvide: true })
class BrowserRequestSession implements RequestSession {
  requestId = crypto.randomUUID();
}

const RequestSession = inject.define<RequestSession>("RequestSession");
RequestSession.bind(BrowserRequestSession);

function RequestPanel() {
  const session = inject(RequestSession);
  return <span>{session.requestId}</span>;
}

export function App() {
  return (
    <DiScopeProvider>
      <RequestPanel />
    </DiScopeProvider>
  );
}
```

**Expected behavior**:

- The React surface remains `setupReactDi` plus `DiScopeProvider`; the contract feature does not introduce a React-only registration API [ref: ../01-research/02-test-topology-analysis.md#react-adjacent-source-and-documentation-covered-by-moved-tests] [ref: ../01-research/01-core-contract-analysis.md#export-surface-and-package-entry-points] [ref: ./01-architecture.md#system-fit].
- For the contract path, binding counts as registration, so a bound scoped contract can be injected inside an active scope without an extra `provide` step [ref: ../01-research/01-core-contract-analysis.md#provide-contract-and-requireprovide-semantics] [ref: ./04-decisions.md#adr-5-treat-binding-as-registration-for-scoped-contracts-while-preserving-existing-scoped-runtime-rules].
- Scope presence, parent-compatibility restrictions, and lifecycle hooks still follow the existing scoped runtime rules [ref: ../01-research/01-core-contract-analysis.md#scope-lifecycle-and-error-paths] [ref: ./02-dataflow.md#flow-3-bound-scoped-contract-resolution].

### UC-4: Keep existing constructor-based consumers unchanged unless interface-based binding is needed

**Goal**: A maintainer needs a migration path that separates unchanged behavior from the new contract-definition capability.

**Unchanged path**:

```ts
import { inject, injectable } from "@fozy-labs/simplest-di";

@injectable("SINGLETON")
class Logger {
  log(message: string) {
    console.log(message);
  }
}

@injectable("SINGLETON")
class ChatApi {
  private readonly logger = inject(Logger);
}
```

**When to migrate**:

- Migrate to `inject.define` only when the consumer depends on an interface-shaped contract or environment-selected implementation that cannot be expressed as one stable constructor token [ref: ../TASK.md#expected-api-example] [ref: ../01-research/04-open-questions.md#q4-what-type-shape-must-injectdefinetname-return-so-that-it-fits-the-current-inject-and-provide-contracts] [ref: ./01-architecture.md#constructor-compatibility].
- Keep constructor injection unchanged for ordinary class-to-class dependencies; the feature is additive, not a rewrite of the DI model [ref: ../01-research/01-core-contract-analysis.md#decorator-metadata-path] [ref: ./04-decisions.md#adr-3-store-binding-state-on-the-contract-and-expose-it-through-contract-backed-inject-options].
- Planning should therefore treat constructor-based tests and docs as mostly regression coverage, while separating new contract-definition behavior into its own implementation and verification slices [ref: ../01-research/README.md#key-findings] [ref: ./01-architecture.md#runtime-touchpoints-and-required-broadening].

## Repository Maintainer Use Cases

### UC-5: Relocate unit tests into per-module `__tests__` directories without changing discovery behavior

**Goal**: A maintainer wants the repository layout to move source-adjacent unit tests under module-local `__tests__` folders while keeping shared setup and integration assets where they already are.

**Target outcome**:

- Core unit tests move from `src/core/*.test.ts` to `src/core/__tests__/*.test.ts` [ref: ../01-research/02-test-topology-analysis.md#current-test-layout] [ref: ./01-architecture.md#repository-topology-boundary].
- React unit tests move from `src/react/*.test.ts(x)` to `src/react/__tests__/*.test.ts(x)` [ref: ../01-research/02-test-topology-analysis.md#current-test-layout] [ref: ./03-model.md#repository-topology-model].
- Shared setup, helpers, and integration suites remain under `src/__tests__`, because the task only targets the core and react source folders and the current setup path is already fixed there [ref: ../01-research/02-test-topology-analysis.md#scope-boundaries-and-observed-discovery-dependencies] [ref: ./04-decisions.md#adr-7-keep-vitest-and-typescript-discovery-configuration-unchanged-for-the-chosen-topology].

**Expected behavior**:

- Test file suffixes stay `.test.ts` or `.test.tsx`, so Vitest and `tsconfig.test.json` continue to discover the moved files without configuration changes [ref: ../01-research/02-test-topology-analysis.md#vitest-discovery-and-setup-behavior] [ref: ./01-architecture.md#discovery-and-config-boundary].
- Integration suites such as export-surface checks remain centralized under `src/__tests__/integration` because they validate the top-level package contract rather than one module-local concern [ref: ../01-research/02-test-topology-analysis.md#current-test-layout] [ref: ./03-model.md#topology-rules].

### UC-6: Relocate React hook tests and make their source references independent from adjacency

**Goal**: A maintainer wants to move `useConstant.test.ts` and `useSafeMount.test.tsx` into `src/react/__tests__` without preserving same-folder coupling.

**Expected behavior**:

- The moved hook tests stop importing `./useConstant` and `./useSafeMount` and instead reference the source modules through the repository alias pattern already used by the rest of the test suite [ref: ../01-research/02-test-topology-analysis.md#file-by-file-inventory-for-moved-test-candidates] [ref: ./04-decisions.md#adr-6-standardize-relocated-react-hook-tests-on-alias-based-imports].
- The relocation should not force a mirrored source/test directory trick just to preserve those two relative imports, because that would make folder design depend on outlier files rather than the chosen per-module topology [ref: ../01-research/04-open-questions.md#q8-how-should-the-two-react-hook-tests-that-rely-on-same-directory-relative-imports-behave-after-relocation] [ref: ./01-architecture.md#react-hook-import-strategy].

## Edge Cases and Verification Expectations

### Edge-case expectations

| Scenario | Expected outcome | Why this is the approved behavior |
|---|---|---|
| `inject(contract)` before any `bind()` | Resolution fails as an unbound-contract error before lifetime dispatch | The contract object must be a direct inject target, but binding is the registration step that supplies provider metadata [ref: ../01-research/04-open-questions.md#q3-how-should-binding-semantics-work-for-environment-specific-implementation-selection] [ref: ./02-dataflow.md#flow-5-unbound-contract-failure] |
| `bind()` after the contract has already resolved once | Rebinding is rejected | The approved design allows rebinding only before first resolution so singleton and scoped caches never need invalidation logic [ref: ../01-research/04-open-questions.md#user-answers] [ref: ./04-decisions.md#adr-4-allow-rebinding-only-before-first-resolution] |
| Two modules each call `inject.define("ChatDataSource")` | They produce different contracts and do not share bindings or caches | Identity is the returned object instance, not the display name [ref: ../01-research/04-open-questions.md#q2-what-runtime-identity-should-a-defined-contract-use] [ref: ./03-model.md#identity-rule] |
| A constructor-based consumer keeps using `inject(SomeClass)` | Behavior is unchanged | The contract feature is additive and reuses, rather than replaces, the current constructor path [ref: ../01-research/01-core-contract-analysis.md#decorator-metadata-path] [ref: ./01-architecture.md#constructor-compatibility] |

### Export-surface verification expectations

- Root-package export verification must confirm that `inject.define` is reachable from the same top-level package import used today, and that no extra named contract export becomes required for consumers [ref: ../01-research/01-core-contract-analysis.md#export-surface-and-package-entry-points] [ref: ./04-decisions.md#adr-1-keep-the-public-api-centered-on-injectdefine].
- Export verification remains an integration concern under the shared `src/__tests__/integration` area, because it checks the package barrel rather than an internal module folder [ref: ../01-research/02-test-topology-analysis.md#current-test-layout] [ref: ../01-research/04-open-questions.md#q10-what-level-of-documentation-and-public-surface-verification-must-accompany-the-feature-if-the-api-and-test-layout-change-together].

### Documentation verification expectations

- Documentation review must confirm that package-level concepts explain contract identity, binding timing, missing-binding behavior, and the rule that constructor injection remains valid and unchanged [ref: ../01-research/04-open-questions.md#user-answers] [ref: ./04-decisions.md#adr-2-use-the-defined-contract-object-instance-as-runtime-token-identity] [ref: ./04-decisions.md#adr-4-allow-rebinding-only-before-first-resolution].
- React-facing docs must only change where the contract feature affects scoped usage expectations; they should continue to present `setupReactDi` and `DiScopeProvider` as the React entry points [ref: ../01-research/02-test-topology-analysis.md#react-adjacent-source-and-documentation-covered-by-moved-tests] [ref: ./01-architecture.md#system-fit].
- Change notes must describe the new contract-definition capability and the repository-visible test topology move as part of the same feature delivery, because public API and public verification change together in scope [ref: ../01-research/04-open-questions.md#q10-what-level-of-documentation-and-public-surface-verification-must-accompany-the-feature-if-the-api-and-test-layout-change-together] [ref: ../01-research/04-open-questions.md#user-answers].