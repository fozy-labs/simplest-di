import { Subject } from "rxjs";

import { type ProvideOptions, type ScopeTag } from "@/core/di.types";
import { inject } from "@/core/inject";
import { Scope } from "@/core/Scope";

export type ScopesStoreOptions = {
    /**
     * Родитель по умолчанию для всех создаваемых стором скоупов.
     * Используется, если в {@link ScopesStore.acquire} не передан собственный `parent`.
     */
    parent?: Scope | null;
};

export type AcquireOptions = {
    /**
     * Родитель создаваемого скоупа. Может быть:
     * - `Scope` — использовать как родителя напрямую;
     * - `string` — ключ другого скоупа в этом же сторе (должен существовать);
     * - не задан — родитель по умолчанию из {@link unstable_createScopesStore}.
     *
     * Каскадный {@link ScopesStore.dispose} опирается на цепочку `parent`, поэтому
     * keep-alive дочерние скоупы создавайте родителем своей зоны.
     */
    parent?: Scope | string;
    /** Имя скоупа (для отладки). По умолчанию — сам `key`. */
    name?: string;
    tags?: ScopeTag[];
    /** Зависимости, регистрируемые в скоуп при его создании (как в `useScope`). */
    provide?: ProvideOptions<any>[];
};

/**
 * **Нестабильный API (`@experimental`).** Не покрыт semver-гарантиями stable API
 * и может измениться (вплоть до сигнатур) без мажорной версии.
 *
 * Императивное хранилище {@link Scope}-ов, адресуемых по строковому ключу.
 *
 * Это «внешняя память» для жизненного цикла скоупов, которым управляет не React
 * mount/unmount, а внешние события (роутер и т.п.). В отличие от {@link Scope},
 * стор:
 * - переиспользует скоуп по ключу (один и тот же на каждый `acquire`);
 * - сам проводит `init$`/`destroyed$` и `provide` при создании;
 * - при `dispose(key)` опирается на каскад ядра `Scope` (гасит подвес детей
 *   снизу вверх) и синхронизирует свой индекс ключей.
 */
export interface ScopesStore {
    /**
     * Взять-или-создать скоуп по ключу. На повторный вызов с тем же ключом
     * возвращает тот же экземпляр; `options` при переиспользовании игнорируются.
     */
    acquire(key: string, options?: AcquireOptions): Scope;
    /** Вернуть существующий скоуп без создания, либо `null`. */
    get(key: string): Scope | null;
    has(key: string): boolean;
    /** Список ключей живых скоупов (отладка/политики вытеснения). */
    keys(): string[];
    /**
     * Инициализировать скоуп (`Scope.init`). Идемпотентно.
     * Бросает, если ключа нет в сторе.
     */
    init(key: string): void;
    /**
     * Уничтожить скоуп. Каскад выполняет ядро `Scope.dispose` (гасит весь подвес
     * детей снизу вверх); стор дополнительно убирает из своего индекса сам скоуп
     * и всех его потомков. Идемпотентно: для отсутствующего ключа — no-op.
     */
    dispose(key: string): void;
    /** Уничтожить все скоупы стора (глубочайшие первыми) и очистить его. */
    disposeAll(): void;
}

/** Число шагов вверх по `parent` от `scope` до `ancestor`; `-1`, если не потомок. */
function depthUnder(scope: Scope, ancestor: Scope): number {
    let depth = 0;
    let current: Scope | null = scope;

    while (current) {
        if (current === ancestor) {
            return depth;
        }
        current = current.parent;
        depth++;
    }

    return -1;
}

/**
 * **Нестабильный API (`@experimental`).** Может измениться без мажорной версии —
 * не полагайтесь на стабильность сигнатуры в долгоживущем коде.
 *
 * Создаёт {@link ScopesStore} — императивное хранилище скоупов по ключу.
 *
 * @experimental
 */
export function unstable_createScopesStore(options: ScopesStoreOptions = {}): ScopesStore {
    const defaultParent = options.parent ?? null;
    const scopes = new Map<string, Scope>();

    function resolveParent(parent: AcquireOptions["parent"]): Scope | null {
        if (parent === undefined) {
            return defaultParent;
        }

        if (typeof parent === "string") {
            const found = scopes.get(parent);

            if (!found) {
                throw new Error(`ScopesStore: parent scope "${parent}" is not in the store.`);
            }

            return found;
        }

        return parent;
    }

    return {
        acquire(key, acquireOptions = {}) {
            const existing = scopes.get(key);

            if (existing) {
                return existing;
            }

            const parent = resolveParent(acquireOptions.parent);
            const scope = new Scope(parent, acquireOptions.name ?? key, acquireOptions.tags);
            scope.init$ = new Subject<void>();
            scope.destroyed$ = new Subject<void>();

            const provide = acquireOptions.provide;

            if (provide && provide.length > 0) {
                scope.runInScope(() => {
                    provide.forEach((item) => {
                        inject.provide(item, scope);
                    });
                });
            }

            scopes.set(key, scope);

            return scope;
        },

        get(key) {
            return scopes.get(key) ?? null;
        },

        has(key) {
            return scopes.has(key);
        },

        keys() {
            return [...scopes.keys()];
        },

        init(key) {
            const scope = scopes.get(key);

            if (!scope) {
                throw new Error(`ScopesStore: cannot init unknown scope "${key}".`);
            }

            scope.init();
        },

        dispose(key) {
            const target = scopes.get(key);

            if (!target) {
                return;
            }

            // Каскад выполняет ядро: target.dispose() гасит весь подвес снизу
            // вверх (детей раньше родителя). Стор лишь синхронизирует индекс,
            // убирая target и всех его потомков по цепочке `parent`.
            target.dispose();

            for (const [storeKey, scope] of [...scopes]) {
                if (depthUnder(scope, target) >= 0) {
                    scopes.delete(storeKey);
                }
            }
        },

        disposeAll() {
            // Каждый скоуп каскадит сам; идемпотентность делает повторные
            // dispose (для уже погашенных потомков) безопасным no-op.
            for (const scope of scopes.values()) {
                scope.dispose();
            }

            scopes.clear();
        },
    };
}
