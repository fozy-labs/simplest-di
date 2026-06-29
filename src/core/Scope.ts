import { Subject } from "rxjs";

import { InjectingInstanceSymbol, ScopeTag, ScopeToken } from "@/core/di.types";

export class Scope {
    private _isInitialized: boolean = false;
    private _isDisposed: boolean = false;

    get isInitialized(): boolean {
        return this._isInitialized;
    }

    get isDisposed(): boolean {
        return this._isDisposed;
    }

    instances = new WeakMap<ScopeToken, unknown>();

    /**
     * Дочерние скоупы. Заполняется конструктором ребёнка (см. ниже) и
     * используется каскадным {@link dispose}. Это сильные ссылки: родитель
     * удерживает детей до их `dispose` — не забывайте уничтожать скоупы.
     */
    children = new Set<Scope>();

    constructor(
        public parent: Scope | null = null,
        public name: string | undefined = undefined,
        public tags: ScopeTag[] = [],
    ) {
        parent?.children.add(this);
    }

    getInstance<T>(token: ScopeToken): T | null | InjectingInstanceSymbol {
        if (this.instances.has(token)) {
            return this.instances.get(token) as T | InjectingInstanceSymbol;
        }

        if (this.parent) {
            return this.parent.getInstance<T>(token);
        }

        return null;
    }

    setInstance<T>(token: ScopeToken, instance: T | InjectingInstanceSymbol): void {
        this.instances.set(token, instance);
    }

    init$: Subject<void> | null = null;
    destroyed$: Subject<void> | null = null;

    init(): void {
        this.init$?.next();
        this.init$?.complete();
        this._isInitialized = true;
    }

    dispose(): void {
        if (this._isDisposed) {
            return;
        }
        this._isDisposed = true;

        // Каскад снизу вверх: сначала дочерние скоупы (рекурсивно), затем сам.
        for (const child of [...this.children]) {
            child.dispose();
        }
        this.children.clear();
        this.parent?.children.delete(this);

        this.destroyed$?.next();
        this.destroyed$?.complete();
    }

    runInScope<T>(fn: () => T): T {
        const getPreviousScope = Scope.getCurrentScope;
        try {
            (Scope.getCurrentScope as any) = () => this;
            return fn();
        } finally {
            (Scope.getCurrentScope as any) = getPreviousScope;
        }
    }

    hasTag(tag: ScopeTag): boolean {
        return this.tags.includes(tag);
    }

    static getCurrentScope: () => Scope | null = () => null;
}
