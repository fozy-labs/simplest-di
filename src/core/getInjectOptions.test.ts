import { injectable } from "@/core";
import { getInjectOptions } from "@/core/getInjectOptions";

describe("getInjectOptions", () => {
    // T33: Normalizes class with @injectable('SINGLETON')
    it('T33: normalizes class with @injectable("SINGLETON")', () => {
        @injectable("SINGLETON")
        class MyService {}

        const options = getInjectOptions(MyService);

        expect(options.lifetime).toBe("SINGLETON");
        expect(options.requireProvide).toBe(true);
        expect(options.name).toBe("MyService");
        expect(options.token).toBe(MyService);
    });

    // T34: Normalizes class with detailed options
    it("T34: normalizes class with detailed options", () => {
        const onInit = vi.fn();

        @injectable({ lifetime: "SCOPED", requireProvide: false, onScopeInit: onInit })
        class MyService {}

        const options = getInjectOptions(MyService);

        expect(options.lifetime).toBe("SCOPED");
        expect(options.requireProvide).toBe(false);
        expect(options.onScopeInit).toBe(onInit);
        expect(options.name).toBe("MyService");
    });

    // T35: Throws for undecorated class
    it("T35: throws for undecorated class", () => {
        class PlainClass {}

        expect(() => getInjectOptions(PlainClass)).toThrow(/Did you forget to add @injectable/);
    });

    // T36: Normalizes explicit InjectOptions object
    it("T36: normalizes explicit InjectOptions object", () => {
        class Token {}

        const options = getInjectOptions({
            token: Token,
            getInstance: () => new Token(),
            lifetime: "TRANSIENT",
        });

        expect(options.token).toBe(Token);
        expect(options.lifetime).toBe("TRANSIENT");
        expect(options.requireProvide).toBe(true);
    });

    // T37: Default requireProvide is true
    it("T37: default requireProvide is true", () => {
        @injectable("SINGLETON")
        class MyService {}

        const options = getInjectOptions(MyService);
        expect(options.requireProvide).toBe(true);
    });

    // T38: getInstance defaults to () => new token()
    it("T38: getInstance defaults to () => new token()", () => {
        @injectable("SINGLETON")
        class MyService {
            value = 42;
        }

        const options = getInjectOptions(MyService);
        const instance = options.getInstance();

        expect(instance).toBeInstanceOf(MyService);
        expect(instance.value).toBe(42);
    });
});
