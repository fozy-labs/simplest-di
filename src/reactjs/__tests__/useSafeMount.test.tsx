import { act, renderHook } from "@testing-library/react";
import React from "react";

import { useSafeMount } from "@/reactjs/useSafeMount";

function flushMicrotasks(): Promise<void> {
    return act(() => new Promise<void>((r) => setTimeout(r, 10)));
}

describe("useSafeMount", () => {
    // T65: Callback fires on mount
    it("T65: callback fires on mount", async () => {
        const callback = vi.fn();
        renderHook(() => useSafeMount(callback));

        await flushMicrotasks();

        expect(callback).toHaveBeenCalledOnce();
    });

    // T66: Cleanup fires on unmount
    it("T66: cleanup fires on unmount", async () => {
        const cleanup = vi.fn();
        const callback = vi.fn(() => cleanup);

        const { unmount } = renderHook(() => useSafeMount(callback));

        await flushMicrotasks();
        expect(callback).toHaveBeenCalledOnce();

        unmount();
        await flushMicrotasks();

        expect(cleanup).toHaveBeenCalledOnce();
    });

    // T66 subcase: no cleanup function returned — unmount doesn't crash
    it("T66: unmount does not crash when no cleanup function returned", async () => {
        const callback = vi.fn();
        const { unmount } = renderHook(() => useSafeMount(callback));

        await flushMicrotasks();

        expect(() => {
            unmount();
        }).not.toThrow();

        await flushMicrotasks();
    });

    // T67: StrictMode — no double execution of mount callback
    it("T67: StrictMode — mount callback fires exactly once", async () => {
        const callback = vi.fn();

        renderHook(() => useSafeMount(callback), {
            wrapper: ({ children }) => <React.StrictMode>{children}</React.StrictMode>,
        });

        await flushMicrotasks();

        expect(callback).toHaveBeenCalledOnce();
    });

    // T68: StrictMode — cleanup fires exactly once on final unmount
    it("T68: StrictMode — cleanup fires exactly once on unmount", async () => {
        const cleanup = vi.fn();
        const callback = vi.fn(() => cleanup);

        const { unmount } = renderHook(() => useSafeMount(callback), {
            wrapper: ({ children }) => <React.StrictMode>{children}</React.StrictMode>,
        });

        await flushMicrotasks();

        unmount();
        await flushMicrotasks();

        expect(cleanup).toHaveBeenCalledOnce();
    });

    // T69: StrictMode — double mount/unmount cycle handled (no phantom side effects)
    it("T69: StrictMode — no phantom side effects from first mount", async () => {
        const sideEffects: string[] = [];
        const callback = vi.fn(() => {
            sideEffects.push("mount");
            return () => {
                sideEffects.push("unmount");
            };
        });

        const { unmount } = renderHook(() => useSafeMount(callback), {
            wrapper: ({ children }) => <React.StrictMode>{children}</React.StrictMode>,
        });

        await flushMicrotasks();

        expect(sideEffects).toEqual(["mount"]);

        unmount();
        await flushMicrotasks();

        expect(sideEffects).toEqual(["mount", "unmount"]);
    });
});
