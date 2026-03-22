import { Subject } from "rxjs";

import {
    CircularDependencyError,
    inject,
    injectable,
    MustBeProvidedError,
    NonCompatibleParentError,
    resetRegistry,
    Scope,
} from "@/core";
import { ContractAlreadyResolvedError, UnboundContractError } from "@/core/errors";

// --- Helper classes ---

@injectable()
class SingletonService {
    id = Math.random();
}

@injectable("TRANSIENT")
class TransientService {
    id = Math.random();
}

@injectable("SCOPED")
class ScopedService {
    id = Math.random();
}

@injectable({ lifetime: "SCOPED", requireProvide: false })
class ScopedAutoService {
    id = Math.random();
}

@injectable({ lifetime: "SCOPED", requireProvide: true })
class ScopedStrictService {
    id = Math.random();
}

function createScope(parent?: Scope | null, name?: string): Scope {
    const scope = new Scope(parent ?? null, name);
    scope.init$ = new Subject<void>();
    scope.destroyed$ = new Subject<void>();
    return scope;
}

// --- Tests ---

describe("inject", () => {
    // T01: Singleton first call creates instance
    it("T01: singleton returns an instance", () => {
        const instance = inject(SingletonService);
        expect(instance).toBeInstanceOf(SingletonService);
    });

    // T02: Singleton second call returns cached (same reference)
    it("T02: singleton returns same instance on subsequent calls", () => {
        const a = inject(SingletonService);
        const b = inject(SingletonService);
        expect(a).toBe(b);
    });

    // T03: Transient always creates new instance
    it("T03: transient returns new instance each time", () => {
        const a = inject(TransientService);
        const b = inject(TransientService);
        expect(a).not.toBe(b);
        expect(a).toBeInstanceOf(TransientService);
        expect(b).toBeInstanceOf(TransientService);
    });

    // T04: Scoped resolution from scope after inject.provide()
    it("T04: scoped returns instance from scope after provide", () => {
        const scope = createScope();
        const instance = inject.provide(ScopedService, scope);
        const resolved = inject(ScopedService, scope);
        expect(resolved).toBe(instance);
    });

    // T05: Scoped parent chain lookup
    it("T05: scoped resolves from parent scope", () => {
        const parentScope = createScope();
        const childScope = createScope(parentScope, "child");

        const parentInstance = inject.provide(ScopedService, parentScope);
        const resolved = inject(ScopedService, childScope);

        expect(resolved).toBe(parentInstance);
    });

    // T06: Scoped child shadows parent
    it("T06: scoped child shadows parent instance", () => {
        const parentScope = createScope();
        const childScope = createScope(parentScope, "child");

        // Provide in child first — creates instance in child
        const childInstance = inject.provide(ScopedService, childScope);
        // Provide in parent — creates separate instance in parent
        const parentInstance = inject.provide(ScopedService, parentScope);

        // Resolve from child returns child's own instance, not parent's
        const resolved = inject(ScopedService, childScope);

        expect(resolved).toBe(childInstance);
        expect(childInstance).not.toBe(parentInstance);
    });

    // T07: Circular dependency detection (singleton)
    it("T07: circular dependency throws CircularDependencyError (singleton)", () => {
        @injectable()
        class CircA {
            b = inject(CircB);
        }

        @injectable()
        class CircB {
            a = inject(CircA);
        }

        expect(() => inject(CircA)).toThrow(CircularDependencyError);
    });

    // T07 subcase: 3-node chain A→B→C→A
    it("T07 (subcase): circular dependency detected in deep chain A→B→C→A", () => {
        @injectable()
        class ChainA {
            b = inject(ChainB);
        }

        @injectable()
        class ChainB {
            c = inject(ChainC);
        }

        @injectable()
        class ChainC {
            a = inject(ChainA);
        }

        expect(() => inject(ChainA)).toThrow(CircularDependencyError);
    });

    // T08: Circular dependency detection (scoped)
    it("T08: circular dependency throws CircularDependencyError (scoped)", () => {
        @injectable({ lifetime: "SCOPED", requireProvide: false })
        class ScopedCircA {
            b = inject(ScopedCircB, Scope.getCurrentScope()!);
        }

        @injectable({ lifetime: "SCOPED", requireProvide: false })
        class ScopedCircB {
            a = inject(ScopedCircA, Scope.getCurrentScope()!);
        }

        const scope = createScope();
        Scope.getCurrentScope = () => scope;

        expect(() => inject(ScopedCircA, scope)).toThrow(CircularDependencyError);

        Scope.getCurrentScope = () => null;
    });

    // T09: Missing @injectable() throws descriptive error
    it("T09: inject undecorated class throws", () => {
        class PlainClass {}

        expect(() => inject(PlainClass as any)).toThrow(/Did you forget to add @injectable/);
    });

    // T10: inject.provide() creates and registers in scope
    it("T10: inject.provide creates and registers instance in scope", () => {
        const scope = createScope();
        const instance = inject.provide(ScopedService, scope);

        expect(instance).toBeInstanceOf(ScopedService);
        // Second provide returns same instance
        const instance2 = inject.provide(ScopedService, scope);
        expect(instance2).toBe(instance);
    });

    // T11: inject.provide() for singleton stores in registry
    it("T11: inject.provide for singleton stores in registry", () => {
        const instance = inject.provide(SingletonService);
        const resolved = inject(SingletonService);
        expect(resolved).toBe(instance);
    });

    // T12: requireProvide=true throws MustBeProvidedError
    it("T12: requireProvide=true throws MustBeProvidedError without provide", () => {
        const scope = createScope();
        expect(() => inject(ScopedStrictService, scope)).toThrow(MustBeProvidedError);
    });

    // T13: requireProvide=false auto-creates instance
    it("T13: requireProvide=false works without provide", () => {
        const scope = createScope();
        const instance = inject(ScopedAutoService, scope);
        expect(instance).toBeInstanceOf(ScopedAutoService);
    });

    // T14: Scoped from singleton parent throws NonCompatibleParentError
    it("T14: scoped from singleton parent throws NonCompatibleParentError", () => {
        @injectable({ lifetime: "SCOPED", requireProvide: false })
        class InnerScoped {
            id = Math.random();
        }

        @injectable("SINGLETON")
        class OuterSingleton {
            scoped: InnerScoped;
            constructor() {
                const scope = createScope();
                this.scoped = inject(InnerScoped, scope);
            }
        }

        expect(() => inject(OuterSingleton)).toThrow(NonCompatibleParentError);
    });

    // T15: Scoped from transient parent throws NonCompatibleParentError
    it("T15: scoped from transient parent throws NonCompatibleParentError", () => {
        @injectable({ lifetime: "SCOPED", requireProvide: false })
        class InnerScoped2 {
            id = Math.random();
        }

        @injectable("TRANSIENT")
        class OuterTransient {
            scoped: InnerScoped2;
            constructor() {
                const scope = createScope();
                this.scoped = inject(InnerScoped2, scope);
            }
        }

        expect(() => inject(OuterTransient)).toThrow(NonCompatibleParentError);
    });

    // T16: onScopeInit callback fires on scope.init()
    it("T16: onScopeInit fires on scope.init()", () => {
        const initFn = vi.fn();

        @injectable({ lifetime: "SCOPED", requireProvide: false, onScopeInit: initFn })
        class ScopedWithInit {
            id = Math.random();
        }

        const scope = createScope();
        inject(ScopedWithInit, scope);

        expect(initFn).not.toHaveBeenCalled();

        scope.init();

        expect(initFn).toHaveBeenCalledOnce();
    });

    // T16 subcase: manual Scope without init$/destroyed$ Subjects
    it("T16 (subcase): manual Scope without Subjects throws", () => {
        const initFn = vi.fn();

        @injectable({ lifetime: "SCOPED", requireProvide: false, onScopeInit: initFn })
        class ScopedWithInitNoSubjects {
            id = Math.random();
        }

        const scope = new Scope(null, "manual");
        // init$ is null by default

        expect(() => inject(ScopedWithInitNoSubjects, scope)).toThrow(/does not support initialization callbacks/);
    });

    // T17: onScopeInit cleanup runs on scope.dispose()
    it("T17: onScopeInit cleanup runs on scope.dispose()", () => {
        const cleanupFn = vi.fn();
        const initFn = vi.fn(() => cleanupFn);

        @injectable({ lifetime: "SCOPED", requireProvide: false, onScopeInit: initFn })
        class ScopedWithCleanup {
            id = Math.random();
        }

        const scope = createScope();
        inject(ScopedWithCleanup, scope);

        scope.init();
        expect(initFn).toHaveBeenCalledOnce();
        expect(cleanupFn).not.toHaveBeenCalled();

        scope.dispose();
        expect(cleanupFn).toHaveBeenCalledOnce();
    });

    // T18: onScopeInit fires immediately if scope already initialized
    it("T18: onScopeInit fires immediately if scope already initialized", () => {
        const initFn = vi.fn();

        @injectable({ lifetime: "SCOPED", requireProvide: false, onScopeInit: initFn })
        class ScopedLateInit {
            id = Math.random();
        }

        const scope = createScope();
        scope.init();

        inject(ScopedLateInit, scope);

        expect(initFn).toHaveBeenCalledOnce();
    });

    // T19: Singleton registry cleanup on construction failure
    it("T19: singleton registry cleaned up on construction failure", () => {
        let shouldThrow = true;

        @injectable()
        class FailingService {
            constructor() {
                if (shouldThrow) {
                    throw new Error("Construction failed");
                }
            }
            id = Math.random();
        }

        expect(() => inject(FailingService)).toThrow("Construction failed");

        // After failure, sentinel should be cleaned — retry should work
        shouldThrow = false;
        const instance = inject(FailingService);
        expect(instance).toBeInstanceOf(FailingService);
    });

    // T42: resetRegistry() clears singleton cache
    it("T42: resetRegistry clears singleton cache", () => {
        const a = inject(SingletonService);
        resetRegistry();
        const b = inject(SingletonService);
        expect(a).not.toBe(b);
    });

    // T43: resetRegistry() — next inject re-creates
    it("T43: after reset, singleton is re-created fresh", () => {
        const a = inject(SingletonService);
        resetRegistry();
        const b = inject(SingletonService);
        expect(b).toBeInstanceOf(SingletonService);
        expect(a.id).not.toBe(b.id);
    });

    it("T44: same-name contracts do not share bindings", () => {
        @injectable("SINGLETON")
        class CloudDataSource {
            kind = "cloud";
        }

        const ContractA = inject.define<{ kind: string }>("ChatDataSource");
        const ContractB = inject.define<{ kind: string }>("ChatDataSource");

        ContractA.bind(CloudDataSource);

        expect(inject(ContractA)).toBeInstanceOf(CloudDataSource);
        expect(() => inject(ContractB)).toThrow(UnboundContractError);
    });

    it("T45: rebinding before first resolution uses the last bound implementation", () => {
        @injectable("TRANSIENT")
        class ElectronDataSource {
            kind = "electron";
        }

        @injectable("TRANSIENT")
        class CloudDataSource {
            kind = "cloud";
        }

        const ChatDataSource = inject.define<{ kind: string }>("ChatDataSource");

        ChatDataSource.bind(ElectronDataSource);
        ChatDataSource.bind(CloudDataSource);

        expect(inject(ChatDataSource)).toBeInstanceOf(CloudDataSource);
    });

    it("T46: rebinding after first resolution is rejected", () => {
        @injectable("SINGLETON")
        class ElectronDataSource {
            kind = "electron";
        }

        @injectable("SINGLETON")
        class CloudDataSource {
            kind = "cloud";
        }

        const ChatDataSource = inject.define<{ kind: string }>("ChatDataSource");

        ChatDataSource.bind(ElectronDataSource);
        inject(ChatDataSource);

        expect(() => ChatDataSource.bind(CloudDataSource)).toThrow(ContractAlreadyResolvedError);
    });

    it("T47: singleton contracts cache by contract token, not by constructor token", () => {
        @injectable("SINGLETON")
        class CloudDataSource {
            kind = "cloud";
        }

        const ChatDataSource = inject.define<CloudDataSource>("ChatDataSource");
        ChatDataSource.bind(CloudDataSource);

        const contractA = inject(ChatDataSource);
        const contractB = inject(ChatDataSource);
        const constructorInstance = inject(CloudDataSource);

        expect(contractA).toBe(contractB);
        expect(contractA).toBeInstanceOf(CloudDataSource);
        expect(constructorInstance).toBeInstanceOf(CloudDataSource);
        expect(contractA).not.toBe(constructorInstance);
    });

    it("T48: object-shaped contract providers remain supported", () => {
        const factory = vi.fn(() => ({ kind: "factory" }));
        const ChatDataSource = inject.define<{ kind: string }>("ChatDataSource");

        ChatDataSource.bind({
            token: { provider: "factory" },
            getInstance: factory,
            lifetime: "TRANSIENT",
            name: "FactoryProvider",
        });

        expect(inject(ChatDataSource)).toEqual({ kind: "factory" });
        expect(factory).toHaveBeenCalledOnce();
    });

    it("T49: bound scoped contracts use binding as registration and keep lifecycle behavior", () => {
        const onInit = vi.fn();

        @injectable({ lifetime: "SCOPED", requireProvide: true, onScopeInit: onInit })
        class ScopedContractImpl {
            id = Math.random();
        }

        const ScopedContract = inject.define<ScopedContractImpl>("ScopedContract");
        ScopedContract.bind(ScopedContractImpl);

        expect(() => inject(ScopedContract)).toThrow(/No active scope found/);

        const scope = createScope();
        const instanceA = inject(ScopedContract, scope);
        const instanceB = inject(ScopedContract, scope);

        expect(instanceA).toBe(instanceB);
        expect(onInit).not.toHaveBeenCalled();

        scope.init();

        expect(onInit).toHaveBeenCalledOnce();
    });

    it("T50: scoped contracts preserve parent compatibility checks", () => {
        @injectable({ lifetime: "SCOPED", requireProvide: true })
        class ScopedContractImpl {
            id = Math.random();
        }

        const ScopedContract = inject.define<ScopedContractImpl>("ScopedContract");
        ScopedContract.bind(ScopedContractImpl);

        @injectable("SINGLETON")
        class OuterSingleton {
            constructor() {
                inject(ScopedContract, createScope());
            }
        }

        expect(() => inject(OuterSingleton)).toThrow(NonCompatibleParentError);
    });
});

describe("inject.provide", () => {
    // T42 (from prompt mapping): inject.provide returns instance
    it("inject.provide returns instance", () => {
        const scope = createScope();
        const instance = inject.provide(ScopedService, scope);
        expect(instance).toBeInstanceOf(ScopedService);
    });

    // T43 (from prompt mapping): inject.provide on transient throws descriptive error
    it("inject.provide on transient throws descriptive error", () => {
        expect(() => inject.provide(TransientService)).toThrow(/SINGLETON or SCOPED/);
    });
});
