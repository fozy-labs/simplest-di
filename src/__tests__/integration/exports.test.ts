import * as rootExports from "@/index";

import {
    CircularDependencyError,
    DiScopeProvider,
    getInjectorName,
    inject,
    injectable,
    MustBeProvidedError,
    NonCompatibleParentError,
    resetRegistry,
    Scope,
    setupReactDi,
} from "@/index";

// --- Tests ---

describe("Integration: exports", () => {
    // T75: Barrel export correctness — all public API symbols are importable and defined
    describe("T75: barrel export correctness", () => {
        it("inject is a function", () => {
            expect(inject).toBeDefined();
            expect(typeof inject).toBe("function");
        });

        it("inject.define is reachable from the root import without extra runtime exports", () => {
            interface ChatDataSource {
                kind: string;
            }

            @injectable("SINGLETON")
            class CloudChatDataSource implements ChatDataSource {
                kind = "cloud";
            }

            expect(rootExports.inject).toBe(inject);
            expect(typeof inject.define).toBe("function");
            expect(Object.keys(rootExports)).not.toContain("defineContract");
            expect(Object.keys(rootExports)).not.toContain("DefinedContract");

            const ChatDataSource = inject.define<ChatDataSource>("ChatDataSource");
            ChatDataSource.bind(CloudChatDataSource);

            const instance = inject(ChatDataSource);

            expect(instance).toBeInstanceOf(CloudChatDataSource);
            expect(instance.kind).toBe("cloud");
        });

        it("injectable is a function", () => {
            expect(injectable).toBeDefined();
            expect(typeof injectable).toBe("function");
        });

        it("Scope is a class (function)", () => {
            expect(Scope).toBeDefined();
            expect(typeof Scope).toBe("function");
        });

        it("resetRegistry is a function", () => {
            expect(resetRegistry).toBeDefined();
            expect(typeof resetRegistry).toBe("function");
        });

        it("getInjectorName is a function", () => {
            expect(getInjectorName).toBeDefined();
            expect(typeof getInjectorName).toBe("function");
        });

        it("CircularDependencyError is a class (function)", () => {
            expect(CircularDependencyError).toBeDefined();
            expect(typeof CircularDependencyError).toBe("function");
        });

        it("NonCompatibleParentError is a class (function)", () => {
            expect(NonCompatibleParentError).toBeDefined();
            expect(typeof NonCompatibleParentError).toBe("function");
        });

        it("MustBeProvidedError is a class (function)", () => {
            expect(MustBeProvidedError).toBeDefined();
            expect(typeof MustBeProvidedError).toBe("function");
        });

        it("setupReactDi is a function", () => {
            expect(setupReactDi).toBeDefined();
            expect(typeof setupReactDi).toBe("function");
        });

        it("DiScopeProvider is a function", () => {
            expect(DiScopeProvider).toBeDefined();
            expect(typeof DiScopeProvider).toBe("function");
        });
    });

    // T76: Error classes are importable and catchable — circular dep instanceof check
    it("T76: CircularDependencyError is catchable via instanceof", () => {
        @injectable("SINGLETON")
        class CycleA {
            b = inject(CycleB);
        }

        @injectable("SINGLETON")
        class CycleB {
            a = inject(CycleA);
        }

        try {
            inject(CycleA);
            expect.unreachable("Should have thrown");
        } catch (error) {
            expect(error).toBeInstanceOf(CircularDependencyError);
        }
    });

    // T78: Non-React import does not crash — core symbols work without setupReactDi()
    it("T78: core DI works without calling setupReactDi()", () => {
        // Do NOT call setupReactDi() — verify core works standalone

        @injectable("SINGLETON")
        class StandaloneService {
            value = 42;
        }

        const instance = inject(StandaloneService);
        expect(instance).toBeInstanceOf(StandaloneService);
        expect(instance.value).toBe(42);

        // Second call returns same singleton
        const instance2 = inject(StandaloneService);
        expect(instance2).toBe(instance);
    });
});
