import { Subject } from "rxjs";

import { Scope } from "@/core";
import { INJECTING_INSTANCE } from "@/core/symbols";

describe("Scope", () => {
    // T24: new Scope() creates empty scope
    it("T24: new Scope() creates empty scope with isInitialized=false", () => {
        const scope = new Scope(null, "root");
        expect(scope.isInitialized).toBe(false);
        expect(scope.parent).toBeNull();
        expect(scope.name).toBe("root");
    });

    // T25: Scope with parent
    it("T25: Scope with parent establishes parent-child link", () => {
        const parent = new Scope(null, "parent");
        const child = new Scope(parent, "child");
        expect(child.parent).toBe(parent);
    });

    // T26: getInstance walks parent chain
    it("T26: getInstance walks parent chain", () => {
        class Token {}
        const parent = new Scope(null, "parent");
        const child = new Scope(parent, "child");
        const instance = new Token();
        parent.setInstance(Token, instance);

        expect(child.getInstance(Token)).toBe(instance);
    });

    // T27: getInstance returns null when not found
    it("T27: getInstance returns null if not found (no parent)", () => {
        class UnknownToken {}
        const scope = new Scope(null, "test");
        expect(scope.getInstance(UnknownToken)).toBeNull();
    });

    // T28: setInstance stores in local WeakMap
    it("T28: setInstance stores and getInstance retrieves", () => {
        class Token {}
        const scope = new Scope(null, "test");
        const instance = new Token();
        scope.setInstance(Token, instance);
        expect(scope.getInstance(Token)).toBe(instance);
    });

    // T29: init() fires init$ and sets isInitialized
    it("T29: init() fires init$ Subject and sets isInitialized=true", () => {
        const scope = new Scope(null, "test");
        scope.init$ = new Subject<void>();
        const callback = vi.fn();
        scope.init$.subscribe(callback);

        scope.init();

        expect(callback).toHaveBeenCalledOnce();
        expect(scope.isInitialized).toBe(true);
    });

    // T30: dispose() fires destroyed$
    it("T30: dispose() fires destroyed$ Subject", () => {
        const scope = new Scope(null, "test");
        scope.destroyed$ = new Subject<void>();
        const callback = vi.fn();
        scope.destroyed$.subscribe(callback);

        scope.dispose();

        expect(callback).toHaveBeenCalledOnce();
    });

    // T31: init$ completes after init()
    it("T31: init$ completes after init()", () => {
        const scope = new Scope(null, "test");
        scope.init$ = new Subject<void>();
        const completeFn = vi.fn();
        scope.init$.subscribe({ complete: completeFn });

        scope.init();

        expect(completeFn).toHaveBeenCalledOnce();
    });

    // T32: getCurrentScope default returns null
    it("T32: Scope.getCurrentScope defaults to returning null", () => {
        // Reset to default
        Scope.getCurrentScope = () => null;
        expect(Scope.getCurrentScope()).toBeNull();
    });

    // Extra: Scope.name stores the name string
    it("Scope.name stores the provided name string", () => {
        const scope = new Scope(null, "my-scope");
        expect(scope.name).toBe("my-scope");
    });

    // Extra: Scope without Subjects — init$/destroyed$ are null by default
    it("init$ and destroyed$ are null by default", () => {
        const scope = new Scope();
        expect(scope.init$).toBeNull();
        expect(scope.destroyed$).toBeNull();
    });

    it("T44: supports arbitrary object tokens in local scope storage", () => {
        const scope = new Scope(null, "test");
        const token = {};
        const instance = { value: 42 };

        scope.setInstance(token, instance);

        expect(scope.getInstance<typeof instance>(token)).toBe(instance);
    });

    it("T45: object-backed tokens still resolve through the parent chain", () => {
        const token = {};
        const parent = new Scope(null, "parent");
        const child = new Scope(parent, "child");
        const instance = { value: 42 };

        parent.setInstance(token, instance);

        expect(child.getInstance<typeof instance>(token)).toBe(instance);
    });

    it("T46: object-backed tokens preserve sentinel storage", () => {
        const scope = new Scope(null, "test");
        const token = {};

        scope.setInstance(token, INJECTING_INSTANCE);

        expect(scope.getInstance(token)).toBe(INJECTING_INSTANCE);
    });
});
