import { act, render } from "@testing-library/react";
import React from "react";

import { inject, injectable, Scope } from "@/core";
import { DiScopeProvider, setupReactDi, useScope } from "@/reactjs";

const tick = () => act(() => new Promise((r) => setTimeout(r, 10)));

describe("useScope", () => {
    beforeEach(() => {
        setupReactDi();
    });

    // T90: returns a Scope instance
    it("T90: returns a Scope instance", () => {
        let capturedScope: Scope | null = null;

        function Component() {
            capturedScope = useScope();
            return null;
        }

        render(<Component />);

        expect(capturedScope).toBeInstanceOf(Scope);
    });

    // T91: stable across re-renders
    it("T91: returns the same scope instance across re-renders", () => {
        const captured: Scope[] = [];

        function Component() {
            captured.push(useScope());
            return null;
        }

        const { rerender } = render(<Component />);
        rerender(<Component />);
        rerender(<Component />);

        expect(captured.length).toBeGreaterThanOrEqual(3);
        expect(captured[0]).toBe(captured[1]);
        expect(captured[1]).toBe(captured[2]);
    });

    // T92: parent is current React-context scope
    it("T92: parent is the React-context scope from DiScopeProvider", () => {
        let parentScope: Scope | null = null;
        let childScope: Scope | null = null;

        function Parent() {
            parentScope = Scope.getCurrentScope();
            return <Child />;
        }

        function Child() {
            childScope = useScope({ keyName: "child" });
            return null;
        }

        render(
            <DiScopeProvider keyName="parent">
                <Parent />
            </DiScopeProvider>,
        );

        expect(childScope).not.toBeNull();
        expect(childScope!.parent).toBe(parentScope);
    });

    // T93: parent is null at top level
    it("T93: parent is null when used outside any provider", () => {
        let scope: Scope | null = null;

        function Component() {
            scope = useScope();
            return null;
        }

        render(<Component />);

        expect(scope).not.toBeNull();
        expect(scope!.parent).toBeNull();
    });

    // T94: init$ fires after mount
    it("T94: scope.init() fires after mount", async () => {
        let scope: Scope | null = null;

        function Component() {
            scope = useScope();
            return null;
        }

        render(<Component />);

        expect(scope!.isInitialized).toBe(false);

        await tick();

        expect(scope!.isInitialized).toBe(true);
    });

    // T95: destroyed$ fires on unmount
    it("T95: destroyed$ fires on unmount", async () => {
        let scope: Scope | null = null;
        const destroyed = vi.fn();

        function Component() {
            scope = useScope();
            scope.destroyed$!.subscribe(destroyed);
            return null;
        }

        const { unmount } = render(<Component />);
        await tick();

        unmount();
        await tick();

        expect(destroyed).toHaveBeenCalledOnce();
    });

    // T96: keyName change creates a new scope
    it("T96: changing keyName creates a new scope", () => {
        let captured: Scope | null = null;

        function Component({ k }: { k: string }) {
            captured = useScope({ keyName: k });
            return null;
        }

        const { rerender } = render(<Component k="a" />);
        const first = captured;

        rerender(<Component k="b" />);

        expect(captured).not.toBe(first);
        expect(captured!.name).toBe("b");
    });

    // T97: provide option provisions services into the new scope
    it("T97: provide option populates the scope with services", async () => {
        @injectable({ lifetime: "SCOPED", requireProvide: false })
        class MyService {
            id = Math.random();
        }

        let outerInstance: MyService | null = null;
        let innerInstance: MyService | null = null;

        function Outer() {
            const scope = useScope({ provide: [MyService] });
            outerInstance = inject.provide(MyService, scope);
            return (
                <DiScopeProvider scope={scope}>
                    <Inner />
                </DiScopeProvider>
            );
        }

        function Inner() {
            innerInstance = inject(MyService);
            return null;
        }

        render(<Outer />);
        await tick();

        expect(outerInstance).toBeInstanceOf(MyService);
        expect(innerInstance).toBe(outerInstance);
    });

    // T98: onScopeInit and onScopeDestroy fire correctly
    it("T98: onScopeInit and onScopeDestroy fire on mount/unmount", async () => {
        const initFn = vi.fn();
        const destroyFn = vi.fn();

        @injectable({
            lifetime: "SCOPED",
            requireProvide: false,
            onScopeInit() {
                initFn();
                return destroyFn;
            },
        })
        class LifecycleService {
            id = Math.random();
        }

        function Outer() {
            const scope = useScope();
            inject.provide(LifecycleService, scope);
            return (
                <DiScopeProvider scope={scope}>
                    <span>x</span>
                </DiScopeProvider>
            );
        }

        const { unmount } = render(<Outer />);
        await tick();

        expect(initFn).toHaveBeenCalledOnce();
        expect(destroyFn).not.toHaveBeenCalled();

        unmount();
        await tick();

        expect(destroyFn).toHaveBeenCalledOnce();
    });

    it("T99: useScope applies tags to created scope", () => {
        const PRIVATE = inject.createTag();
        let scope: Scope | null = null;

        function Component() {
            scope = useScope({ tags: [PRIVATE] });
            return null;
        }

        render(<Component />);

        expect(scope).not.toBeNull();
        expect(scope!.hasTag(PRIVATE)).toBe(true);
    });
});
