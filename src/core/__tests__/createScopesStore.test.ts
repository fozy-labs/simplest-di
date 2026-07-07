import { unstable_createScopesStore as createScopesStore, inject, injectable, Scope } from "@/core";

@injectable("SCOPED")
class ScopedService {
    id = 42;
}

@injectable("SCOPED")
class ExplodingService {
    constructor() {
        throw new Error("boom in constructor");
    }
}

describe("createScopesStore", () => {
    // --- acquire ---

    it("acquire creates a scope with wired init$/destroyed$ Subjects", () => {
        const store = createScopesStore();
        const scope = store.acquire("a");

        expect(scope).toBeInstanceOf(Scope);
        expect(scope.init$).not.toBeNull();
        expect(scope.destroyed$).not.toBeNull();
    });

    it("acquire returns the same instance for the same key", () => {
        const store = createScopesStore();

        expect(store.acquire("a")).toBe(store.acquire("a"));
    });

    it("acquire uses the store default parent", () => {
        const root = new Scope(null, "root");
        const store = createScopesStore({ parent: root });

        expect(store.acquire("a").parent).toBe(root);
    });

    it("acquire accepts an explicit Scope parent", () => {
        const other = new Scope(null, "other");
        const store = createScopesStore();

        expect(store.acquire("a", { parent: other }).parent).toBe(other);
    });

    it("acquire resolves a parent given by key", () => {
        const store = createScopesStore();
        const parent = store.acquire("parent");
        const child = store.acquire("child", { parent: "parent" });

        expect(child.parent).toBe(parent);
    });

    it("acquire throws when the parent key is unknown", () => {
        const store = createScopesStore();

        expect(() => store.acquire("child", { parent: "ghost" })).toThrow();
    });

    it("acquire names the scope by key, overridable via options", () => {
        const store = createScopesStore();

        expect(store.acquire("a").name).toBe("a");
        expect(store.acquire("b", { name: "custom" }).name).toBe("custom");
    });

    it("acquire runs provide into the created scope", () => {
        const store = createScopesStore();
        const scope = store.acquire("a", { provide: [ScopedService] });

        expect(scope.getInstance(ScopedService)).toBeInstanceOf(ScopedService);
        expect(inject(ScopedService, scope)).toBe(scope.getInstance(ScopedService));
    });

    it("acquire disposes the half-created scope when provide throws (no leak in parent.children)", () => {
        const root = new Scope(null, "root");
        const store = createScopesStore({ parent: root });

        expect(() => store.acquire("a", { provide: [ExplodingService] })).toThrow("boom in constructor");

        // Полусозданный скоуп не должен остаться подвешенным в родителе...
        expect(root.children.size).toBe(0);
        // ...и не должен попасть в индекс стора.
        expect(store.has("a")).toBe(false);
    });

    // --- get / has / keys ---

    it("get returns the scope or null without creating", () => {
        const store = createScopesStore();

        expect(store.get("a")).toBeNull();
        const scope = store.acquire("a");
        expect(store.get("a")).toBe(scope);
    });

    it("has and keys reflect live scopes", () => {
        const store = createScopesStore();
        store.acquire("a");
        store.acquire("b");

        expect(store.has("a")).toBe(true);
        expect(store.has("c")).toBe(false);
        expect(store.keys().sort()).toEqual(["a", "b"]);
    });

    // --- init ---

    it("init initializes the scope and is idempotent", () => {
        const store = createScopesStore();
        const scope = store.acquire("a");
        const onInit = vi.fn();
        scope.init$!.subscribe(onInit);

        store.init("a");
        store.init("a");

        expect(onInit).toHaveBeenCalledTimes(1);
        expect(scope.isInitialized).toBe(true);
    });

    it("init throws for an unknown key", () => {
        const store = createScopesStore();

        expect(() => store.init("nope")).toThrow();
    });

    // --- dispose ---

    it("dispose fires destroyed$ and removes the scope", () => {
        const store = createScopesStore();
        const scope = store.acquire("a");
        const onDestroy = vi.fn();
        scope.destroyed$!.subscribe(onDestroy);

        store.dispose("a");

        expect(onDestroy).toHaveBeenCalledTimes(1);
        expect(store.has("a")).toBe(false);
    });

    it("dispose is idempotent (double dispose / unknown key are no-ops)", () => {
        const store = createScopesStore();
        const scope = store.acquire("a");
        const onDestroy = vi.fn();
        scope.destroyed$!.subscribe(onDestroy);

        store.dispose("a");
        store.dispose("a");
        expect(() => store.dispose("never-existed")).not.toThrow();

        expect(onDestroy).toHaveBeenCalledTimes(1);
    });

    it("re-acquire after dispose yields a fresh scope", () => {
        const store = createScopesStore();
        const first = store.acquire("a");
        store.dispose("a");
        const second = store.acquire("a");

        expect(second).not.toBe(first);
    });

    it("acquire does not hand back a scope disposed directly (bypassing store.dispose)", () => {
        const store = createScopesStore();
        const first = store.acquire("a");

        // Уничтожаем напрямую, минуя store.dispose("a"): индекс стора ещё держит ключ.
        first.dispose();

        const second = store.acquire("a");

        expect(second).not.toBe(first);
        expect(second.isDisposed).toBe(false);
    });

    // --- cascade dispose ---

    it("dispose cascades to descendants, children before parents", () => {
        const root = new Scope(null, "root");
        const store = createScopesStore({ parent: root });
        const a = store.acquire("a");
        const b = store.acquire("b", { parent: "a" });
        const c = store.acquire("c", { parent: "b" });

        const order: string[] = [];
        a.destroyed$!.subscribe(() => order.push("a"));
        b.destroyed$!.subscribe(() => order.push("b"));
        c.destroyed$!.subscribe(() => order.push("c"));

        store.dispose("a");

        expect(order).toEqual(["c", "b", "a"]);
        expect(store.keys()).toEqual([]);
    });

    it("dispose only affects the subtree, not siblings or external parent", () => {
        const root = new Scope(null, "root");
        const store = createScopesStore({ parent: root });
        store.acquire("zone");
        store.acquire("page1", { parent: "zone" });
        store.acquire("page2", { parent: "zone" });

        store.dispose("page1");

        expect(store.has("page1")).toBe(false);
        expect(store.has("page2")).toBe(true);
        expect(store.has("zone")).toBe(true);
        // внешний родитель не управляется стором и не трогается
        expect(store.keys()).not.toContain("root");
    });

    // --- disposeAll ---

    it("disposeAll disposes everything (deepest first) and clears the store", () => {
        const store = createScopesStore();
        const a = store.acquire("a");
        const b = store.acquire("b", { parent: "a" });

        const order: string[] = [];
        a.destroyed$!.subscribe(() => order.push("a"));
        b.destroyed$!.subscribe(() => order.push("b"));

        store.disposeAll();

        expect(order).toEqual(["b", "a"]);
        expect(store.keys()).toEqual([]);
    });
});
