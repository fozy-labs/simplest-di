import { act, render } from "@testing-library/react";
import React from "react";
import { Subject } from "rxjs";

import { inject, injectable, Scope } from "@/core";
import { DiScopeProvider, setupReactDi, useScope } from "@/reactjs";

// --- Helper classes ---

@injectable({ lifetime: "SCOPED", requireProvide: false })
class ScopedService {
    id = Math.random();
}

@injectable({ lifetime: "SCOPED", requireProvide: false })
class ScopedServiceA {
    id = Math.random();
}

@injectable({ lifetime: "SCOPED", requireProvide: false })
class ScopedServiceB {
    id = Math.random();
}

function createScope(parent?: Scope | null, name?: string): Scope {
    const scope = new Scope(parent ?? null, name);
    scope.init$ = new Subject<void>();
    scope.destroyed$ = new Subject<void>();
    return scope;
}

// --- Tests ---

describe("reactDi", () => {
    beforeEach(() => {
        setupReactDi();
    });

    // T52: setupReactDi() passes for React 19+
    it("T52: setupReactDi passes for React 19+", () => {
        expect(() => setupReactDi()).not.toThrow();
    });

    // T51: setupReactDi() throws for React < 19
    it("T51: setupReactDi throws for React < 19", () => {
        const originalVersion = React.version;
        Object.defineProperty(React, "version", { value: "18.2.0", configurable: true });

        try {
            expect(() => setupReactDi()).toThrow("React version 19 or higher is required");
        } finally {
            Object.defineProperty(React, "version", { value: originalVersion, configurable: true });
        }
    });

    // T50: setupReactDi wires Scope.getCurrentScope
    it("T50: setupReactDi wires Scope.getCurrentScope to React context", () => {
        let capturedScope: Scope | null = null;

        function Consumer() {
            capturedScope = Scope.getCurrentScope();
            return null;
        }

        render(
            <DiScopeProvider>
                <Consumer />
            </DiScopeProvider>,
        );

        expect(capturedScope).toBeInstanceOf(Scope);
    });

    // T53: DiScopeProvider renders children
    it("T53: DiScopeProvider renders children", () => {
        const { getByText } = render(
            <DiScopeProvider>
                <div>child</div>
            </DiScopeProvider>,
        );

        expect(getByText("child")).toBeDefined();
    });

    // T54: DiScopeProvider creates a new scope
    it("T54: DiScopeProvider creates a new scope", () => {
        let capturedScope: Scope | null = null;

        function Consumer() {
            capturedScope = Scope.getCurrentScope();
            return null;
        }

        render(
            <DiScopeProvider>
                <Consumer />
            </DiScopeProvider>,
        );

        expect(capturedScope).not.toBeNull();
        expect(capturedScope).toBeInstanceOf(Scope);
    });

    // T55: DiScopeProvider passes scope via React context — child calls inject()
    it("T55: DiScopeProvider passes scope via context for inject()", async () => {
        let instance: ScopedService | null = null;

        function Consumer() {
            instance = inject(ScopedService);
            return null;
        }

        render(
            <DiScopeProvider>
                <Consumer />
            </DiScopeProvider>,
        );

        expect(instance).toBeInstanceOf(ScopedService);
    });

    // T56: Nested DiScopeProvider — parent-child scope hierarchy
    it("T56: nested DiScopeProvider creates parent-child scope hierarchy", () => {
        let parentScopeRef: Scope | null = null;
        let childScopeRef: Scope | null = null;

        function ParentConsumer() {
            parentScopeRef = Scope.getCurrentScope();
            return null;
        }

        function ChildConsumer() {
            childScopeRef = Scope.getCurrentScope();
            return null;
        }

        render(
            <DiScopeProvider keyName="parent">
                <ParentConsumer />
                <DiScopeProvider keyName="child">
                    <ChildConsumer />
                </DiScopeProvider>
            </DiScopeProvider>,
        );

        expect(parentScopeRef).not.toBeNull();
        expect(childScopeRef).not.toBeNull();
        expect(childScopeRef).not.toBe(parentScopeRef);
        expect(childScopeRef!.parent).toBe(parentScopeRef);
    });

    // T57: DiScopeProvider calls scope.init() on mount
    it("T57: DiScopeProvider calls scope.init() on mount", async () => {
        let capturedScope: Scope | null = null;

        function Consumer() {
            capturedScope = Scope.getCurrentScope();
            return null;
        }

        render(
            <DiScopeProvider>
                <Consumer />
            </DiScopeProvider>,
        );

        // Wait for microtask (useSafeMount defers via queueMicrotask)
        await act(() => new Promise((r) => setTimeout(r, 10)));

        expect(capturedScope).not.toBeNull();
        expect(capturedScope!.isInitialized).toBe(true);
    });

    // T58: DiScopeProvider calls scope.dispose() on unmount
    it("T58: DiScopeProvider calls scope.dispose() on unmount", async () => {
        let capturedScope: Scope | null = null;

        function Consumer() {
            capturedScope = Scope.getCurrentScope();
            return null;
        }

        const { unmount } = render(
            <DiScopeProvider>
                <Consumer />
            </DiScopeProvider>,
        );

        // Wait for mount microtask
        await act(() => new Promise((r) => setTimeout(r, 10)));

        expect(capturedScope).not.toBeNull();
        const disposeSpy = vi.spyOn(capturedScope!.destroyed$!, "next");

        unmount();

        // Wait for unmount microtask
        await act(() => new Promise((r) => setTimeout(r, 10)));

        expect(disposeSpy).toHaveBeenCalled();
    });

    // T59: DiScopeProvider provides listed dependencies
    it("T59: DiScopeProvider with provide prop injects services", () => {
        let instanceA: ScopedServiceA | null = null;
        let instanceB: ScopedServiceB | null = null;

        function Consumer() {
            instanceA = inject(ScopedServiceA);
            instanceB = inject(ScopedServiceB);
            return null;
        }

        render(
            <DiScopeProvider provide={[ScopedServiceA, ScopedServiceB]}>
                <Consumer />
            </DiScopeProvider>,
        );

        expect(instanceA).toBeInstanceOf(ScopedServiceA);
        expect(instanceB).toBeInstanceOf(ScopedServiceB);
    });

    // T60: DiScopeProvider cleanup on unmount — destroyed$ fires
    it("T60: DiScopeProvider cleanup on unmount fires destroyed$", async () => {
        let capturedScope: Scope | null = null;
        const destroyedCallback = vi.fn();

        function Consumer() {
            capturedScope = Scope.getCurrentScope();
            if (capturedScope?.destroyed$) {
                capturedScope.destroyed$.subscribe(destroyedCallback);
            }
            return null;
        }

        const { unmount } = render(
            <DiScopeProvider>
                <Consumer />
            </DiScopeProvider>,
        );

        // Wait for mount microtask
        await act(() => new Promise((r) => setTimeout(r, 10)));

        unmount();

        // Wait for unmount microtask
        await act(() => new Promise((r) => setTimeout(r, 10)));

        expect(destroyedCallback).toHaveBeenCalledOnce();
    });

    // T61: DiScopeProvider with external scope passes it via context
    it("T61: DiScopeProvider with external scope prop uses it as context value", async () => {
        let externalScope: Scope | null = null;
        let consumedScope: Scope | null = null;

        function Outer() {
            externalScope = useScope({ keyName: "external" });
            return (
                <DiScopeProvider scope={externalScope}>
                    <Consumer />
                </DiScopeProvider>
            );
        }

        function Consumer() {
            consumedScope = Scope.getCurrentScope();
            return null;
        }

        render(<Outer />);

        expect(consumedScope).toBe(externalScope);
    });

    // T62: external scope's instances pre-provided via inject.provide are visible to children
    it("T62: instances pre-provided via inject.provide on external scope are visible to children", async () => {
        let outerInstance: ScopedService | null = null;
        let innerInstance: ScopedService | null = null;

        function Outer() {
            const scope = useScope();
            outerInstance = inject.provide(ScopedService, scope);
            return (
                <DiScopeProvider scope={scope}>
                    <Inner />
                </DiScopeProvider>
            );
        }

        function Inner() {
            innerInstance = inject(ScopedService);
            return null;
        }

        render(<Outer />);
        await act(() => new Promise((r) => setTimeout(r, 10)));

        expect(outerInstance).toBeInstanceOf(ScopedService);
        expect(innerInstance).toBe(outerInstance);
    });

    // T63: external scope — provider does not double-init
    it("T63: external scope — provider does not call init() a second time", async () => {
        let scope: Scope | null = null;
        const initSpy = vi.fn();

        function Outer() {
            scope = useScope();
            scope.init$!.subscribe(initSpy);
            return (
                <DiScopeProvider scope={scope}>
                    <span>x</span>
                </DiScopeProvider>
            );
        }

        render(<Outer />);
        await act(() => new Promise((r) => setTimeout(r, 10)));

        // useScope owns lifecycle; provider must not re-init
        expect(initSpy).toHaveBeenCalledOnce();
    });

    // T64: external scope — provider does not double-dispose
    it("T64: external scope — provider does not call dispose() a second time", async () => {
        let scope: Scope | null = null;
        const destroyedSpy = vi.fn();

        function Outer() {
            scope = useScope();
            scope.destroyed$!.subscribe(destroyedSpy);
            return (
                <DiScopeProvider scope={scope}>
                    <span>x</span>
                </DiScopeProvider>
            );
        }

        const { unmount } = render(<Outer />);
        await act(() => new Promise((r) => setTimeout(r, 10)));

        unmount();
        await act(() => new Promise((r) => setTimeout(r, 10)));

        expect(destroyedSpy).toHaveBeenCalledOnce();
    });

    // T65: external scope + provide prop — services are provisioned into the external scope
    it("T65: external scope + provide prop — services are provisioned into the passed scope", async () => {
        let externalScope: Scope | null = null;
        let consumed: ScopedServiceA | null = null;

        function Outer() {
            externalScope = useScope();
            return (
                <DiScopeProvider scope={externalScope} provide={[ScopedServiceA]}>
                    <Inner />
                </DiScopeProvider>
            );
        }

        function Inner() {
            consumed = inject(ScopedServiceA);
            return null;
        }

        render(<Outer />);
        await act(() => new Promise((r) => setTimeout(r, 10)));

        expect(consumed).toBeInstanceOf(ScopedServiceA);
        // The instance must live in the external scope
        expect(externalScope!.getInstance(ScopedServiceA)).toBe(consumed);
    });
});