import { Subject } from "rxjs";

import { InjectingInstanceSymbol, ScopeToken } from "@/core/di.types";

export class Scope {
    private _isInitialized: boolean = false;

    get isInitialized(): boolean {
        return this._isInitialized;
    }

    instances = new WeakMap<ScopeToken, unknown>();

    constructor(
        public parent: Scope | null = null,
        public name: string | undefined = undefined,
    ) {}

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
        this.destroyed$?.next();
        this.destroyed$?.complete();
    }

    static getCurrentScope: () => Scope | null = () => null;
}
