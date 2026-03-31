import { useRef } from "react";

type ResultBox<T> = { v: T };

export function useConstant<T>(fn: () => T, deps: any[] = []): T {
    const ref = useRef<ResultBox<T> | null>(null);
    const depsRef = useRef<any[] | null>(null);

    if (ref.current === null) {
        ref.current = { v: fn() };
    }

    if (depsRef.current === null) {
        depsRef.current = deps;
    }

    if (depsRef.current.some((d, i) => d !== deps[i])) {
        ref.current = { v: fn() };
        depsRef.current = deps;
    }

    return ref.current.v;
}
