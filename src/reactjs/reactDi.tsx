import React from "react";

import { ProvideOptions, ScopeTag } from "@/core/di.types";
import { inject } from "@/core/inject";
import { Scope } from "@/core/Scope";

import { getReactContext } from "./reactContext";
import { useConstant } from "./useConstant";
import { useScope } from "./useScope";

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
    tags?: ScopeTag[];
    /**
     * Внешне-управляемый Scope, созданный через {@link useScope}.
     * Если задан — провайдер не создаёт новый scope и не управляет его жизненным циклом
     * (init/dispose выполняет владелец, обычно сам useScope).
     * Опция `provide` (если указана) будет выполнена в этот переданный scope.
     */
    scope?: Scope;
};

function InternalScopeProvider({
    children,
    keyName,
    provide,
    tags,
}: {
    children: React.ReactNode;
    keyName?: string;
    provide?: ProvideOptions<any>[];
    tags?: ScopeTag[];
}) {
    const scope = useScope({ keyName, provide, tags });
    const ReactContext = getReactContext();
    return <ReactContext.Provider value={scope}>{children}</ReactContext.Provider>;
}

function ExternalScopeProvider({
    children,
    scope,
    provide,
}: {
    children: React.ReactNode;
    scope: Scope;
    provide?: ProvideOptions<any>[];
}) {
    // Однократно выполняем provide-операции в переданный scope.
    useConstant(() => {
        if (provide && provide.length > 0) {
            scope.runInScope(() => {
                provide.forEach((item) => {
                    inject.provide(item, scope);
                });
            });
        }
        return null;
    }, [scope]);

    const ReactContext = getReactContext();
    return <ReactContext.Provider value={scope}>{children}</ReactContext.Provider>;
}

export function DiScopeProvider(props: DiScopeProviderProps) {
    if (props.scope) {
        return (
            <ExternalScopeProvider scope={props.scope} provide={props.provide}>
                {props.children}
            </ExternalScopeProvider>
        );
    }
    return (
        <InternalScopeProvider keyName={props.keyName} provide={props.provide} tags={props.tags}>
            {props.children}
        </InternalScopeProvider>
    );
}
