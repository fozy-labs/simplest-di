import { createDefinedContract } from "@/core/createDefinedContract";
import { Constructor, DefinedContract, InjectedInstance, InjectOptions, ProvideOptions } from "@/core/di.types";
import { CircularDependencyError, MustBeProvidedError, NonCompatibleParentError } from "@/core/errors";
import { getInjectOptions } from "@/core/getInjectOptions";
import { InjectScope } from "@/core/InjectScope";
import { Scope } from "@/core/Scope";
import { INJECTING_INSTANCE } from "@/core/symbols";

const registry = new Map<unknown, unknown>();

type InjectFn = {
    <T extends Constructor>(arg: T | InjectOptions<T>, scope?: Scope | InjectTag): InjectedInstance<T>;
    <T>(arg: DefinedContract<T> | InjectOptions<T>, scope?: Scope | InjectTag): T;
    provide<T extends Constructor>(token: T | InjectOptions<T>, scope?: Scope | InjectTag): InjectedInstance<T>;
    provide<T>(token: DefinedContract<T> | InjectOptions<T>, scope?: Scope | InjectTag): T;
    define<T>(name: string): DefinedContract<T>;
    createTag(): InjectTag;
};

export class InjectTag {
    findInCurrentScope(scope = Scope.getCurrentScope()): Scope | null {
        if (!scope) return null;

        if (scope.hasTag(this)) {
            return scope;
        }

        return this.findInCurrentScope(scope.parent);
    }
}

function getScope(ctx: Scope | InjectTag | null | undefined): Scope | null {
    if (!ctx) {
        return Scope.getCurrentScope();
    }

    if (ctx instanceof InjectTag) {
        return ctx.findInCurrentScope();
    }

    return ctx;
}

const injectImpl = function <T>(arg: ProvideOptions<T>, ctx?: Scope | InjectTag): InjectedInstance<T> {
    const options = getInjectOptions(arg);
    const lifetime = options.lifetime;
    const token = options.token;

    if (lifetime === "TRANSIENT") {
        return InjectScope.createInstance(options as InjectOptions<any>) as InjectedInstance<T>;
    }

    if (lifetime === "SINGLETON") {
        // has(), а не truthiness: инстанс может быть легитимно falsy (0, "", false).
        if (registry.has(token)) {
            const registered = registry.get(token);

            if (registered === INJECTING_INSTANCE) {
                throw new CircularDependencyError(options.name);
            }

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

        const currentScope = getScope(ctx);

        if (!currentScope) {
            throw new Error(`No active scope found for scoped injection of ${options.name}`);
        }

        // hasInstance(), а не truthiness/`!== null`: инстанс может быть легитимно
        // falsy (0, "", false) или самим `null`/`undefined`. getInstance возвращает
        // `null` и при отсутствии токена, и при инстансе === null — их различает
        // только проверка существования токена в цепочке скоупов (паритет со
        // SINGLETON, где для этого используется registry.has()).
        if (currentScope.hasInstance(token as object)) {
            const scopedInstance = currentScope.getInstance<InjectedInstance<T>>(token as object);

            if (scopedInstance === INJECTING_INSTANCE) {
                throw new CircularDependencyError(options.name);
            }

            return scopedInstance as InjectedInstance<T>;
        }

        if (options.requireProvide) {
            throw new MustBeProvidedError(options.name);
        }

        const onScopeInit = options.onScopeInit;
        const onScopeDestroy = [] as (() => void)[];

        // Проверяем поддержку lifecycle-колбэков ДО любой мутации скоупа, чтобы
        // отклонённое внедрение не оставляло за собой закэшированный инстанс или
        // висячую подписку. Требование destroyed$ при наличии onScopeInit —
        // намеренный контракт: потребитель с хуками обязан прокинуть lifecycle-
        // способный скоуп (например, через useScope/setupReactDi); мы лишь
        // переносим отказ на fail-fast до создания инстанса.
        if (onScopeInit && !currentScope.init$) {
            throw new Error(`Scope for ${options.name} does not support initialization callbacks`);
        }

        if (onScopeInit && !currentScope.destroyed$) {
            throw new Error(`Scope for ${options.name} does not support destruction callbacks`);
        }

        // Помечаем как "в процессе создания", чтобы отловить циклические зависимости
        currentScope.setInstance(token as object, INJECTING_INSTANCE);

        let instance: InjectedInstance<T>;

        try {
            instance = InjectScope.createInstance(options as InjectOptions<any>) as InjectedInstance<T>;
        } catch (error) {
            // Откатываем "в процессе создания"-маркер, чтобы повторная попытка
            // не была ошибочно принята за циклическую зависимость.
            currentScope.deleteInstance(token as object);
            throw error;
        }

        currentScope.setInstance(token as object, instance);

        // Подписку на init$ регистрируем ПОСЛЕ успешного создания инстанса: провал
        // конструктора не оставляет висячей подписки, а колбэк не обращается к ещё
        // не инициализированной переменной instance.
        if (onScopeInit && currentScope.init$) {
            currentScope.init$.subscribe(() => {
                const result = onScopeInit.call(instance) ?? undefined;
                if (typeof result === "function") {
                    onScopeDestroy.push(result);
                }
            });
        }

        if (currentScope.isInitialized && onScopeInit) {
            const result = onScopeInit.call(instance) ?? undefined;

            if (typeof result === "function") {
                onScopeDestroy.push(result);
            }
        }

        // Поддержка destroyed$ уже провалидирована выше (до мутации скоупа), так что
        // здесь остаётся только подписка. Destroy-колбэки появляются лишь как возврат
        // onScopeInit, поэтому подписка привязана к onScopeInit: сущность SCOPED без
        // хуков не плодит пустую подписку.
        if (onScopeInit && currentScope.destroyed$) {
            currentScope.destroyed$.subscribe(() => {
                onScopeDestroy.forEach((fn) => fn.call(instance));
            });
        }

        return instance;
    }

    throw new Error(`Unknown injection lifetime: ${lifetime}`);
} as InjectFn;

injectImpl.provide = function <T>(token: ProvideOptions<T>, scope?: Scope | InjectTag): InjectedInstance<T> {
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

injectImpl.createTag = function (): InjectTag {
    return new InjectTag();
};

export const inject = injectImpl;

export function resetRegistry() {
    registry.clear();
}
