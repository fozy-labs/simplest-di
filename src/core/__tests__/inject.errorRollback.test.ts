import { Subject } from "rxjs";

import { CircularDependencyError, inject, injectable, NonCompatibleParentError, Scope, ScopeTag } from "@/core";
import { InjectScope } from "@/core/InjectScope";

function createScope(parent?: Scope | null, name?: string, tags?: ScopeTag[]): Scope {
    const scope = new Scope(parent ?? null, name, tags);
    scope.init$ = new Subject<void>();
    scope.destroyed$ = new Subject<void>();
    return scope;
}

// Error-path state rollback: a single throwing constructor must not leave the
// container in a dirty state.
describe("inject — error-path state rollback", () => {
    // A failed construction must not corrupt a subsequent, unrelated injection.
    it("T57: failed construction does not corrupt subsequent unrelated injection", () => {
        @injectable("SINGLETON")
        class Boom {
            constructor() {
                throw new Error("boom");
            }
        }

        @injectable("SCOPED")
        class LaterScoped {
            id = Math.random();
        }

        expect(() => inject(Boom)).toThrow("boom");

        // Fresh top-level scoped injection — there is no parent, so this must succeed.
        const scope = createScope();
        expect(() => inject.provide(LaterScoped, scope)).not.toThrow();
    });

    // The global InjectScope stack is fully restored after a throw.
    it("T58: InjectScope state is restored after a failed construction", () => {
        @injectable("SINGLETON")
        class Boom {
            constructor() {
                throw new Error("boom");
            }
        }

        expect(() => inject(Boom)).toThrow("boom");

        expect(InjectScope.injecting).toBe(false);
        expect(InjectScope.current).toBeNull();
        expect(InjectScope.previous).toBeUndefined();
    });

    // A failed SCOPED construction must not poison the token with the in-progress
    // sentinel (which would masquerade as a circular dependency).
    it("T59: failed scoped construction does not poison the scope token", () => {
        let shouldThrow = true;

        @injectable({ lifetime: "SCOPED", requireProvide: false })
        class FailingScoped {
            id = 0;
            constructor() {
                if (shouldThrow) throw new Error("scoped-boom");
            }
        }

        const scope = createScope();

        expect(() => inject(FailingScoped, scope)).toThrow("scoped-boom");

        shouldThrow = false;
        // Retry must re-create, not throw CircularDependencyError.
        let retried: FailingScoped | null = null;
        expect(() => {
            retried = inject(FailingScoped, scope);
        }).not.toThrow();
        expect(retried).toBeInstanceOf(FailingScoped);
    });

    // Explicit — the retry must not surface as a circular dependency.
    it("T59 (subcase): retry after failed scoped construction is not a CircularDependencyError", () => {
        let shouldThrow = true;

        @injectable({ lifetime: "SCOPED", requireProvide: false })
        class FailingScoped2 {
            constructor() {
                if (shouldThrow) throw new Error("scoped-boom-2");
            }
        }

        const scope = createScope();
        expect(() => inject(FailingScoped2, scope)).toThrow("scoped-boom-2");

        shouldThrow = false;
        let err: unknown = null;
        try {
            inject(FailingScoped2, scope);
        } catch (e) {
            err = e;
        }
        expect(err).not.toBeInstanceOf(CircularDependencyError);
    });

    // A failed SCOPED construction must not leave a dangling init$ subscription
    // that later throws (TDZ) or fires the lifecycle hook for a non-existent instance.
    it("T60: failed scoped construction leaves no dangling init$ subscription", () => {
        const onInit = vi.fn();

        @injectable({ lifetime: "SCOPED", requireProvide: false, onScopeInit: onInit })
        class FailingScopedWithInit {
            constructor() {
                throw new Error("ctor-boom");
            }
        }

        const scope = createScope();

        expect(() => inject(FailingScopedWithInit, scope)).toThrow("ctor-boom");

        // No dangling subscription must remain on the scope's init$ Subject.
        expect(scope.init$!.observed).toBe(false);

        expect(() => scope.init()).not.toThrow();
        expect(onInit).not.toHaveBeenCalled();
    });

    // Nested construction must restore `injecting` to its prior value, not to a hard
    // `false` — otherwise code running in the outer constructor after a nested inject
    // would wrongly observe "outside of an inject scope".
    it("T61: nested inject restores the injecting flag for the outer constructor", () => {
        let injectingAfterNested: boolean | null = null;

        @injectable()
        class Child {
            id = Math.random();
        }

        @injectable()
        class Parent {
            child = inject(Child);
            constructor() {
                // Field initializers ran (nested inject(Child) completed); we are
                // still inside Parent's construction, so injecting must stay true.
                injectingAfterNested = InjectScope.injecting;
            }
        }

        inject(Parent);

        expect(injectingAfterNested).toBe(true);
    });

    // Guard against the NonCompatibleParentError leaking from a stuck stack.
    it("T61 (subcase): failed singleton then scoped provide does not raise NonCompatibleParentError", () => {
        @injectable("SINGLETON")
        class BoomSingleton {
            constructor() {
                throw new Error("boom-single");
            }
        }

        @injectable("SCOPED")
        class Later {
            id = Math.random();
        }

        expect(() => inject(BoomSingleton)).toThrow("boom-single");

        const scope = createScope();
        let err: unknown = null;
        try {
            inject.provide(Later, scope);
        } catch (e) {
            err = e;
        }
        expect(err).not.toBeInstanceOf(NonCompatibleParentError);
    });

    // A rejected injection — a scope that supports init$ but not destroyed$ for a
    // hooked injectable — must fail-fast BEFORE mutating the scope. The requirement
    // itself is intentional (a consumer using onScopeInit must wire a lifecycle-
    // capable scope, e.g. via useScope/setupReactDi); the throw must simply happen
    // before caching the instance or subscribing to init$, leaving no dirty state.
    it("T80: unsupported-destroy scope rejects before mutating the scope", () => {
        const onInit = vi.fn();

        @injectable({ lifetime: "SCOPED", requireProvide: false, onScopeInit: onInit })
        class HookedScoped {
            id = Math.random();
        }

        const scope = new Scope(null, "init-only");
        scope.init$ = new Subject<void>(); // init$ есть, destroyed$ намеренно отсутствует

        expect(() => inject(HookedScoped, scope)).toThrow(/does not support destruction callbacks/);

        // Скоуп не тронут: инстанс не закэширован (иначе повторный inject вернул бы мусор).
        expect(scope.getInstance(HookedScoped)).toBeNull();

        // Нет висячей init$-подписки, которая дёрнула бы хук на несуществующем инстансе.
        scope.init();
        expect(onInit).not.toHaveBeenCalled();
    });
});
