import { act, render } from "@testing-library/react";
import React from "react";
import { Subject } from "rxjs";

import { inject, injectable, resetRegistry, Scope } from "@/core";
import { DiScopeProvider, setupReactDi } from "@/react";

// --- Helper utilities ---

function createScope(parent?: Scope | null, name?: string): Scope {
    const scope = new Scope(parent ?? null, name);
    scope.init$ = new Subject<void>();
    scope.destroyed$ = new Subject<void>();
    return scope;
}

/** Wait for useSafeMount microtask to settle */
const tick = () => act(() => new Promise((r) => setTimeout(r, 10)));

// --- Tests ---

describe("Integration: scoped lifecycle", () => {
    beforeEach(() => {
        setupReactDi();
    });

    // T70: Full singleton injection chain
    it("T70: singleton chain — A depends on B, both singletons", () => {
        @injectable("SINGLETON")
        class ServiceB {
            id = Math.random();
        }

        @injectable("SINGLETON")
        class ServiceA {
            b = inject(ServiceB);
        }

        const a = inject(ServiceA);
        const b = inject(ServiceB);

        expect(a).toBeInstanceOf(ServiceA);
        expect(a.b).toBeInstanceOf(ServiceB);
        expect(a.b).toBe(b);
    });

    // T71: Mixed lifetimes — singleton depends on transient
    it("T71: singleton depends on transient — transient created inside singleton constructor", () => {
        @injectable("TRANSIENT")
        class TransientDep {
            id = Math.random();
        }

        @injectable("SINGLETON")
        class SingletonOwner {
            dep = inject(TransientDep);
        }

        const owner = inject(SingletonOwner);
        expect(owner.dep).toBeInstanceOf(TransientDep);

        // Direct transient inject creates a new instance each time
        const standalone1 = inject(TransientDep);
        const standalone2 = inject(TransientDep);
        expect(standalone1).not.toBe(standalone2);
        expect(standalone1).not.toBe(owner.dep);
    });

    // T72: Multi-level scope hierarchy — 3 nested DiScopeProvider
    it("T72: multi-level scope hierarchy with React providers", async () => {
        @injectable({ lifetime: "SCOPED", requireProvide: false })
        class Level1Service {
            id = Math.random();
        }

        @injectable({ lifetime: "SCOPED", requireProvide: false })
        class Level2Service {
            id = Math.random();
        }

        @injectable({ lifetime: "SCOPED", requireProvide: false })
        class Level3Service {
            id = Math.random();
        }

        let scope1: Scope | null = null;
        let scope2: Scope | null = null;
        let scope3: Scope | null = null;
        let l1FromLevel3: Level1Service | null = null;
        let l2FromLevel3: Level2Service | null = null;
        let l3FromLevel3: Level3Service | null = null;

        function Level1Consumer() {
            scope1 = Scope.getCurrentScope();
            inject(Level1Service);
            return null;
        }

        function Level2Consumer() {
            scope2 = Scope.getCurrentScope();
            inject(Level2Service);
            return null;
        }

        function Level3Consumer() {
            scope3 = Scope.getCurrentScope();
            l1FromLevel3 = inject(Level1Service);
            l2FromLevel3 = inject(Level2Service);
            l3FromLevel3 = inject(Level3Service);
            return null;
        }

        render(
            <DiScopeProvider keyName="level1" provide={[Level1Service]}>
                <Level1Consumer />
                <DiScopeProvider keyName="level2" provide={[Level2Service]}>
                    <Level2Consumer />
                    <DiScopeProvider keyName="level3" provide={[Level3Service]}>
                        <Level3Consumer />
                    </DiScopeProvider>
                </DiScopeProvider>
            </DiScopeProvider>,
        );

        // Verify scope hierarchy
        expect(scope1).not.toBeNull();
        expect(scope2).not.toBeNull();
        expect(scope3).not.toBeNull();
        expect(scope2!.parent).toBe(scope1);
        expect(scope3!.parent).toBe(scope2);

        // Level 3 can resolve services from all ancestor scopes
        expect(l1FromLevel3).toBeInstanceOf(Level1Service);
        expect(l2FromLevel3).toBeInstanceOf(Level2Service);
        expect(l3FromLevel3).toBeInstanceOf(Level3Service);
    });

    // T73: Scoped lifecycle end-to-end — onScopeInit fires, cleanup fires on dispose
    it("T73: scoped lifecycle — onScopeInit and cleanup via DiScopeProvider", async () => {
        const initFn = vi.fn();
        const cleanupFn = vi.fn();

        @injectable({
            lifetime: "SCOPED",
            requireProvide: false,
            onScopeInit() {
                initFn();
                return () => cleanupFn();
            },
        })
        class LifecycleService {
            id = Math.random();
        }

        function Consumer() {
            inject(LifecycleService);
            return null;
        }

        const { unmount } = render(
            <DiScopeProvider>
                <Consumer />
            </DiScopeProvider>,
        );

        // Before microtask settles, init may not have fired
        expect(initFn).not.toHaveBeenCalled();

        // Wait for useSafeMount microtask
        await tick();

        // scope.init() was called — onScopeInit fires
        expect(initFn).toHaveBeenCalledOnce();
        expect(cleanupFn).not.toHaveBeenCalled();

        unmount();

        // Wait for unmount microtask
        await tick();

        // scope.dispose() was called — cleanup fires
        expect(cleanupFn).toHaveBeenCalledOnce();
    });

    // T74: resetRegistry() isolation — different instances after reset
    it("T74: resetRegistry isolates test suites", () => {
        @injectable("SINGLETON")
        class IsolatedService {
            id = Math.random();
        }

        const first = inject(IsolatedService);
        expect(first).toBeInstanceOf(IsolatedService);

        resetRegistry();

        const second = inject(IsolatedService);
        expect(second).toBeInstanceOf(IsolatedService);
        expect(second).not.toBe(first);
        expect(second.id).not.toBe(first.id);
    });

    // T77: keyName change triggers scope re-creation (via React key)
    it("T77: keyName prop change triggers scope re-creation", async () => {
        const scopeRefs: Scope[] = [];
        const disposeSpy = vi.fn();

        function Consumer() {
            const scope = Scope.getCurrentScope();
            if (scope) {
                // Track each unique scope we see
                if (!scopeRefs.includes(scope)) {
                    scopeRefs.push(scope);
                    scope.destroyed$?.subscribe(disposeSpy);
                }
            }
            return null;
        }

        // Use React key to force full unmount/remount on keyName change,
        // which triggers scope.dispose() on old and scope.init() on new
        function Wrapper({ keyName }: { keyName: string }) {
            return (
                <DiScopeProvider key={keyName} keyName={keyName}>
                    <Consumer />
                </DiScopeProvider>
            );
        }

        const { rerender } = render(<Wrapper keyName="a" />);

        await tick();

        expect(scopeRefs).toHaveLength(1);
        expect(scopeRefs[0].name).toBe("a");
        expect(scopeRefs[0].isInitialized).toBe(true);

        // Change keyName — old provider unmounts (dispose), new mounts (init)
        rerender(<Wrapper keyName="b" />);

        await tick();

        expect(scopeRefs.length).toBeGreaterThanOrEqual(2);
        expect(disposeSpy).toHaveBeenCalled();

        // The latest scope should have the new keyName and be initialized
        const latestScope = scopeRefs[scopeRefs.length - 1];
        expect(latestScope.name).toBe("b");
        expect(latestScope.isInitialized).toBe(true);
    });

    it("T79: bound scoped contracts resolve through DiScopeProvider and coexist with constructor consumers", async () => {
        const initFn = vi.fn();
        const cleanupFn = vi.fn();

        interface RequestSession {
            requestId: string;
        }

        @injectable("SINGLETON")
        class Logger {
            id = Math.random();
        }

        @injectable({
            lifetime: "SCOPED",
            requireProvide: true,
            onScopeInit() {
                initFn();
                return () => cleanupFn();
            },
        })
        class BrowserRequestSession implements RequestSession {
            requestId = `session-${Math.random()}`;
        }

        @injectable({ lifetime: "SCOPED", requireProvide: false })
        class PageStore {
            logger = inject(Logger);
        }

        const RequestSession = inject.define<RequestSession>("RequestSession");
        RequestSession.bind(BrowserRequestSession);

        function MissingScopeConsumer() {
            inject(RequestSession);
            return null;
        }

        expect(() => render(<MissingScopeConsumer />)).toThrow(/No active scope found/);

        let contractSessionA: RequestSession | null = null;
        let contractSessionB: RequestSession | null = null;
        let pageStore: PageStore | null = null;
        let logger: Logger | null = null;

        function Consumer() {
            contractSessionA = inject(RequestSession);
            contractSessionB = inject(RequestSession);
            pageStore = inject(PageStore);
            logger = inject(Logger);
            return null;
        }

        const { unmount } = render(
            <DiScopeProvider>
                <Consumer />
            </DiScopeProvider>,
        );

        expect(contractSessionA).toBeInstanceOf(BrowserRequestSession);
        expect(contractSessionB).toBe(contractSessionA);
        expect(pageStore).toBeInstanceOf(PageStore);
        expect(logger).toBeInstanceOf(Logger);
        expect(pageStore!.logger).toBe(logger);
        expect(initFn).not.toHaveBeenCalled();
        expect(cleanupFn).not.toHaveBeenCalled();

        await tick();

        expect(initFn).toHaveBeenCalledOnce();
        expect(cleanupFn).not.toHaveBeenCalled();

        unmount();

        await tick();

        expect(cleanupFn).toHaveBeenCalledOnce();
    });
});
