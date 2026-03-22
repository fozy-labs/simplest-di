import { createDefinedContract } from "@/core/createDefinedContract";
import { Constructor, DefinedContract, InjectedInstance, InjectOptions, ProvideOptions } from "@/core/di.types";
import { CircularDependencyError, MustBeProvidedError, NonCompatibleParentError } from "@/core/errors";
import { getInjectOptions } from "@/core/getInjectOptions";
import { InjectScope } from "@/core/InjectScope";
import { Scope } from "@/core/Scope";
import { INJECTING_INSTANCE } from "@/core/symbols";

const registry = new Map<unknown, unknown>();

type InjectFn = {
    <T extends Constructor>(arg: T | InjectOptions<T>, scope?: Scope): InjectedInstance<T>;
    <T>(arg: DefinedContract<T> | InjectOptions<T>, scope?: Scope): T;
    provide<T extends Constructor>(token: T | InjectOptions<T>, scope?: Scope): InjectedInstance<T>;
    provide<T>(token: DefinedContract<T> | InjectOptions<T>, scope?: Scope): T;
    define<T>(name: string): DefinedContract<T>;
};

const injectImpl = function <T>(arg: ProvideOptions<T>, scope?: Scope): InjectedInstance<T> {
    const options = getInjectOptions(arg);
    const lifetime = options.lifetime;
    const token = options.token;

    if (lifetime === "TRANSIENT") {
        return InjectScope.createInstance(options as InjectOptions<any>) as InjectedInstance<T>;
    }

    if (lifetime === "SINGLETON") {
        const registered = registry.get(token);

        if (registered === INJECTING_INSTANCE) {
            throw new CircularDependencyError(options.name);
        }

        if (registered) {
            return registered as InjectedInstance<T>;
        }

        // Помечаем как "в процессе создания", чтобы отловить циклические зависимости
        registry.set(token, INJECTING_INSTANCE);

        try {
            const instance = InjectScope.createInstance(options as InjectOptions<any>) as InjectedInstance<T>;

            registry.set(token, instance);

            return instance;
        } catch (error) {
            // Если создание не удалось, удаляем маркер "в процессе создания"
            registry.delete(token);
            throw error;
        }
    }

    if (lifetime === "SCOPED") {
        if (InjectScope.current?.lifetime === "TRANSIENT") {
            throw new NonCompatibleParentError(options.name, "TRANSIENT");
        }

        if (InjectScope.current?.lifetime === "SINGLETON") {
            throw new NonCompatibleParentError(options.name, "SINGLETON");
        }

        const currentScope = scope ?? Scope.getCurrentScope();

        if (!currentScope) {
            throw new Error(`No active scope found for scoped injection of ${options.name}`);
        }

        const scopedInstance = currentScope.getInstance<InjectedInstance<T>>(token as object);

        if (scopedInstance === INJECTING_INSTANCE) {
            throw new CircularDependencyError(options.name);
        }

        if (!scopedInstance && options.requireProvide) {
            throw new MustBeProvidedError(options.name);
        }

        if (scopedInstance) {
            return scopedInstance;
        }

        const onScopeInit = options.onScopeInit;
        const onScopeDestroy = [] as (() => void)[];

        if (onScopeInit && !currentScope.init$) {
            throw new Error(`Scope for ${options.name} does not support initialization callbacks`);
        } else if (onScopeInit && currentScope.init$) {
            currentScope.init$!.subscribe(() => {
                const result = onScopeInit.call(instance) ?? undefined;
                if (typeof result === "function") {
                    onScopeDestroy.push(result);
                }
            });
        }

        // Помечаем как "в процессе создания", чтобы отловить циклические зависимости
        currentScope.setInstance(token as object, INJECTING_INSTANCE);

        const instance = InjectScope.createInstance(options as InjectOptions<any>) as InjectedInstance<T>;

        currentScope.setInstance(token as object, instance);

        if (currentScope.isInitialized && onScopeInit) {
            const result = onScopeInit.call(instance) ?? undefined;

            if (typeof result === "function") {
                onScopeDestroy.push(result);
            }
        }

        if (onScopeDestroy && !currentScope.destroyed$) {
            throw new Error(`Scope for ${options.name} does not support destruction callbacks`);
        } else if (onScopeDestroy && currentScope.destroyed$) {
            currentScope.destroyed$!.subscribe(() => {
                onScopeDestroy.forEach((fn) => fn.call(instance));
            });
        }

        return instance;
    }

    throw new Error(`Unknown injection lifetime: ${lifetime}`);
} as InjectFn;

injectImpl.provide = function <T>(token: ProvideOptions<T>, scope?: Scope): InjectedInstance<T> {
    const options = getInjectOptions(token);
    const lifetime = options.lifetime;

    if (lifetime !== "SCOPED" && lifetime !== "SINGLETON") {
        throw new Error(
            `Provide can be used only with SINGLETON or SCOPED lifetimes. ${options.name} has ${lifetime} lifetime.`,
        );
    }

    return inject(
        {
            ...options,
            requireProvide: false,
        },
        scope,
    );
};

injectImpl.define = function <T>(name: string): DefinedContract<T> {
    return createDefinedContract<T>(name);
};

export const inject = injectImpl;

export function resetRegistry() {
    registry.clear();
}
