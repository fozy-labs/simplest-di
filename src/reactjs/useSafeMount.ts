import { useEffect, useLayoutEffect, useRef } from "react";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function sameDeps(a: readonly any[] | null, b: readonly any[]): boolean {
    if (a === null || a.length !== b.length) return false;
    return a.every((v, i) => Object.is(v, b[i]));
}

export function useSafeMount(fn: () => void | (() => void), deps = [] as any[]): void {
    const preventMountRef = useRef<null | (() => void)>(null);
    const preventUnmountRef = useRef<null | (() => void)>(null);
    const pendingUnmountDepsRef = useRef<any[] | null>(null);
    const teardownRef = useRef<void | (() => void)>(undefined);

    useIsomorphicLayoutEffect(() => {
        let isMountPrevented = false;

        preventMountRef.current = () => {
            isMountPrevented = true;
        };

        queueMicrotask(() => {
            if (isMountPrevented) return;
            preventMountRef.current = null;
            teardownRef.current = fn();
        });

        return () => {
            preventMountRef.current?.();
            preventMountRef.current = null;

            let isUnmountPrevented = false;

            preventUnmountRef.current = () => {
                isUnmountPrevented = true;
            };
            // Remember which deps this pending teardown belongs to. A StrictMode
            // replay remounts with the SAME deps and may legitimately cancel it;
            // a genuine deps change (e.g. new keyName → new scope) remounts with
            // DIFFERENT deps and must let the teardown run — otherwise the old
            // resource leaks (never disposed, stays in parent.children).
            pendingUnmountDepsRef.current = deps;

            queueMicrotask(() => {
                if (isUnmountPrevented) return;
                preventUnmountRef.current = null;
                teardownRef.current?.();
            });
        };
    }, deps);

    useIsomorphicLayoutEffect(() => {
        // Only a StrictMode replay — a remount with the same deps that scheduled
        // the pending teardown — may cancel it. On a real deps change the deps
        // differ, so we leave the teardown to run.
        if (sameDeps(pendingUnmountDepsRef.current, deps)) {
            preventUnmountRef.current?.();
        }
        preventUnmountRef.current = null;
        pendingUnmountDepsRef.current = null;
    }, deps);
}
