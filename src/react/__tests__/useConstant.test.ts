import { renderHook } from "@testing-library/react";

import { useConstant } from "@/react/useConstant";

describe("useConstant", () => {
    // T62: Returns stable reference across re-renders
    it("T62: returns stable reference across re-renders", () => {
        const factory = vi.fn(() => ({ id: 1 }));
        const { result, rerender } = renderHook(() => useConstant(factory));

        const first = result.current;
        rerender();
        rerender();

        expect(result.current).toBe(first);
        expect(factory).toHaveBeenCalledTimes(1);
    });

    // T62 subcase: factory returns undefined
    it("T62: returns stable reference even when factory returns undefined", () => {
        const factory = vi.fn(() => undefined);
        const { result, rerender } = renderHook(() => useConstant(factory));

        expect(result.current).toBeUndefined();
        rerender();
        rerender();

        expect(result.current).toBeUndefined();
        expect(factory).toHaveBeenCalledTimes(1);
    });

    // T63: Recomputes when deps change
    it("T63: recomputes when deps change", () => {
        let dep = "a";
        const factory = vi.fn(() => ({ dep }));
        const { result, rerender } = renderHook(() => useConstant(factory, [dep]));

        const first = result.current;
        expect(first.dep).toBe("a");

        dep = "b";
        rerender();

        expect(result.current).not.toBe(first);
        expect(result.current.dep).toBe("b");
        expect(factory).toHaveBeenCalledTimes(2);
    });

    // T64: Does not recompute when deps are stable
    it("T64: does not recompute when deps are stable", () => {
        const dep = "stable";
        const factory = vi.fn(() => ({ dep }));
        const { result, rerender } = renderHook(() => useConstant(factory, [dep]));

        const first = result.current;
        rerender();
        rerender();

        expect(result.current).toBe(first);
        expect(factory).toHaveBeenCalledTimes(1);
    });
});