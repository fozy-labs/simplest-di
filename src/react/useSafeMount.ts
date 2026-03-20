import { useEffect, useLayoutEffect, useRef } from "react";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useSafeMount(fn: () => void | (() => void), deps = [] as any[]): void {
    const preventMountRef = useRef<null | (() => void)>(null);
    const preventUnmountRef = useRef<null | (() => void)>(null);
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

            queueMicrotask(() => {
                if (isUnmountPrevented) return;
                preventUnmountRef.current = null;
                teardownRef.current?.();
            });
        };
    }, deps);

    useIsomorphicLayoutEffect(() => {
        preventUnmountRef.current?.();
        preventUnmountRef.current = null;
    }, deps);
}
