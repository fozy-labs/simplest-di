import { Subject } from "rxjs";

import { InjectingInstanceSymbol } from "./di.types";

type Constructor<T = any> = new (...args: any[]) => T;

export class Scope {
    private _isInitialized: boolean = false;

    get isInitialized(): boolean {
        return this._isInitialized;
    }

    instances = new WeakMap<Constructor, any>();

    constructor(
        public parent: Scope | null = null,
        public name: string | undefined = undefined,
    ) {}

    getInstance<T extends Constructor>(token: T): InstanceType<T> | null | InjectingInstanceSymbol {
        if (this.instances.has(token)) {
            return this.instances.get(token);
        }

        if (this.parent) {
            return this.parent.getInstance(token);
        }

        return null;
    }

    setInstance<T extends Constructor>(token: T, instance: InstanceType<T> | InjectingInstanceSymbol): void {
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
