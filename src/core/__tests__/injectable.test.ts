import { injectable } from "@/core";
import { INJECTABLE_OPTIONS } from "@/core/symbols";

// --- Tests ---

describe("injectable", () => {
    // T20: Decorator attaches metadata with default lifetime (SINGLETON)
    it("T20: @injectable() sets INJECTABLE_OPTIONS with default SINGLETON", () => {
        @injectable()
        class DefaultService {}

        const options = (DefaultService as any)[INJECTABLE_OPTIONS];
        expect(options).toBe("SINGLETON");
    });

    // T21: Decorator with string shorthand
    it('T21: @injectable("TRANSIENT") sets TRANSIENT', () => {
        @injectable("TRANSIENT")
        class TransientService {}

        const options = (TransientService as any)[INJECTABLE_OPTIONS];
        expect(options).toBe("TRANSIENT");
    });

    // T22: Decorator with detailed options
    it('T22: @injectable({ lifetime: "SCOPED" }) sets detailed options', () => {
        const onScopeInit = vi.fn();

        @injectable({ lifetime: "SCOPED", requireProvide: true, onScopeInit })
        class ScopedService {}

        const options = (ScopedService as any)[INJECTABLE_OPTIONS];
        expect(options).toEqual({
            lifetime: "SCOPED",
            requireProvide: true,
            onScopeInit,
        });
    });

    // T23: Metadata is non-writable, non-enumerable, non-configurable
    it("T23: @injectable metadata property descriptor is locked", () => {
        @injectable()
        class LockedService {}

        const descriptor = Object.getOwnPropertyDescriptor(LockedService, INJECTABLE_OPTIONS);
        expect(descriptor).toBeDefined();
        expect(descriptor!.writable).toBe(false);
        expect(descriptor!.enumerable).toBe(false);
        expect(descriptor!.configurable).toBe(false);
    });
});
