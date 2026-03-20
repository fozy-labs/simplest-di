import { ProvideOptions } from "./di.types";
import { CircularDependencyError, MustBeProvidedError, NonCompatibleParentError } from "./errors";
import { getInjectOptions } from "./getInjectOptions";
import { InjectScope } from "./InjectScope";
import { Scope } from "./Scope";
import { INJECTING_INSTANCE } from "./symbols";

type Constructor = new (...args: any[]) => any;

const registry = new Map();

export function inject<T extends Constructor>(arg: ProvideOptions<T>, scope?: Scope): InstanceType<T> {
    const options = getInjectOptions(arg);
    const lifetime = options.lifetime;
    const token = options.token;

    if (lifetime === "TRANSIENT") {
        return InjectScope.createInstance(options);
    }

    if (lifetime === "SINGLETON") {
        const registered = registry.get(token);

        if (registered === INJECTING_INSTANCE) {
            throw new CircularDependencyError(options.name);
        }

        if (registered) {
            return registered;
        }

        // Помечаем как "в процессе создания", чтобы отловить циклические зависимости
        registry.set(token, INJECTING_INSTANCE);

        try {
            const instance = InjectScope.createInstance(options);

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

        const scopedInstance = currentScope.getInstance(token as any);

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
        currentScope.setInstance(token as any, INJECTING_INSTANCE);

        const instance = InjectScope.createInstance(options);

        currentScope.setInstance(token as any, instance);

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
}

inject.provide = function <T extends Constructor>(token: ProvideOptions<T>, scope?: Scope): InstanceType<T> {
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

export function resetRegistry() {
    registry.clear();
}
