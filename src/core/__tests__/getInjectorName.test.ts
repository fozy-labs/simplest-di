import { getInjectorName, inject, injectable } from "@/core";

describe("getInjectorName", () => {
    // T45: Throws when called outside injection context
    it("T45: throws when called outside injection context", () => {
        expect(() => getInjectorName()).toThrow(/outside of an inject scope/);
    });

    // T44: Returns parent injector name during injection
    it("T44: returns parent name during inject chain", () => {
        let capturedName: string | null | undefined = null;

        @injectable()
        class ChildService {
            constructor() {
                capturedName = getInjectorName();
            }
        }

        @injectable()
        class ParentService {
            child = inject(ChildService);
        }

        inject(ParentService);

        expect(capturedName).toBe("ParentService");
    });
});