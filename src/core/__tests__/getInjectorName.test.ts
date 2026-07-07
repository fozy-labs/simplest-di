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

    // strict=false без родителя возвращает согласованный null (не undefined/объект).
    it("T46: strict=false returns null when there is no parent injector", () => {
        let captured: unknown = "sentinel";

        @injectable()
        class TopService {
            constructor() {
                captured = getInjectorName(false);
            }
        }

        inject(TopService);

        expect(captured).toBeNull();
    });

    // strict=true без родителя бросает.
    it("T47: strict=true throws when there is no parent injector", () => {
        let thrown = false;

        @injectable()
        class TopService {
            constructor() {
                try {
                    getInjectorName(true);
                } catch {
                    thrown = true;
                }
            }
        }

        inject(TopService);

        expect(thrown).toBe(true);
    });
});
