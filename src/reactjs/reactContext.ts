import React from "react";

import { Scope } from "@/core/Scope";

let _reactContext: React.Context<Scope | null> | null = null;

export function getReactContext(): React.Context<Scope | null> {
    if (!_reactContext) {
        _reactContext = React.createContext<Scope | null>(null);
    }
    return _reactContext;
}
