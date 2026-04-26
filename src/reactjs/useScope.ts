import React from "react";
import { Subject } from "rxjs";

import { ProvideOptions } from "@/core/di.types";
import { inject } from "@/core/inject";
import { Scope } from "@/core/Scope";

import { getReactContext } from "./reactContext";
import { useConstant } from "./useConstant";
import { useSafeMount } from "./useSafeMount";

export type UseScopeOptions = {
    keyName?: string;
    provide?: ProvideOptions<any>[];
};

/**
 * Создаёт React-привязанный {@link Scope} с управлением жизненным циклом.
 *
 * Возвращаемый scope:
 * - Имеет родительский scope, взятый из текущего React-контекста ({@link DiScopeProvider}).
 * - Создаётся один раз; пересоздаётся при изменении `keyName`.
 * - Инициализируется (`init$`) при mount и уничтожается (`destroyed$`) при unmount.
 *
 * Используется совместно с `<DiScopeProvider scope={scope}>` для случаев,
 * когда инстансы из этого scope нужно получить ДО рендера дочернего дерева
 * через `inject.provide(Token, scope)`.
 */
export function useScope(options: UseScopeOptions = {}): Scope {
    const { keyName, provide } = options;
    const parentScope = React.use(getReactContext());

    const scope = useConstant(() => {
        const newScope = new Scope(parentScope, keyName);
        newScope.init$ = new Subject<void>();
        newScope.destroyed$ = new Subject<void>();

        newScope.runInScope(() => {
            provide?.forEach((item) => {
                inject.provide(item, newScope);
            });
        });

        return newScope;
    }, [keyName]);

    useSafeMount(() => {
        scope.init();
        return () => {
            scope.dispose();
        };
    }, [scope]);

    return scope;
}
