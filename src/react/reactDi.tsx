import React from "react";
import { Subject } from "rxjs";

import { ProvideOptions } from "@/core/di.types";
import { inject } from "@/core/inject";
import { Scope } from "@/core/Scope";

import { useConstant } from "./useConstant";
import { useSafeMount } from "./useSafeMount";

let _reactContext: React.Context<Scope | null> | null = null;

function getReactContext(): React.Context<Scope | null> {
    if (!_reactContext) {
        _reactContext = React.createContext<Scope | null>(null);
    }
    return _reactContext;
}

export function setupReactDi() {
    const reactVersion = parseInt(React.version.split(".")[0], 10);

    if (reactVersion < 19) {
        throw new Error("React version 19 or higher is required for this DI setup.");
    }

    Scope.getCurrentScope = () => {
        return React.use(getReactContext());
    };
}

export type DiScopeProviderProps = {
    children: React.ReactNode;
    keyName?: string;
    provide?: ProvideOptions<any>[];
};

export function DiScopeProvider({ children, keyName, provide }: DiScopeProviderProps) {
    const parentScope = React.use(getReactContext());

    const scope = useConstant(() => {
        const newScope = new Scope(parentScope, keyName);
        newScope.init$ = new Subject<void>();
        newScope.destroyed$ = new Subject<void>();

        provide?.forEach((item) => {
            inject.provide(item, newScope);
        });

        return newScope;
    }, [keyName]);

    useSafeMount(() => {
        scope.init();
        return () => {
            scope.dispose();
        };
    });

    const ReactContext = getReactContext();

    return <ReactContext.Provider value={scope}>{children}</ReactContext.Provider>;
}
