import { inject, injectable } from "@/core";
import { UnboundContractError } from "@/core/errors";
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

    it("T44: normalizes a bound contract with contract-backed identity", () => {
        @injectable("SINGLETON")
        class CloudDataSource {
            value = "cloud";
        }

        const ChatDataSource = inject.define<{ value: string }>("ChatDataSource");
        ChatDataSource.bind(CloudDataSource);

        const options = getInjectOptions(ChatDataSource);

        expect(options.token).toBe(ChatDataSource);
        expect(options.name).toBe("ChatDataSource");
        expect(options.lifetime).toBe("SINGLETON");
        expect(options.requireProvide).toBe(false);
        expect(options.getInstance()).toBeInstanceOf(CloudDataSource);
    });

    it("T45: same-name contracts keep independent binding state", () => {
        @injectable("SINGLETON")
        class CloudDataSource {
            value = "cloud";
        }

        const ContractA = inject.define<{ value: string }>("ChatDataSource");
        const ContractB = inject.define<{ value: string }>("ChatDataSource");

        ContractA.bind(CloudDataSource);

        expect(getInjectOptions(ContractA).token).toBe(ContractA);
        expect(() => getInjectOptions(ContractB)).toThrow(UnboundContractError);
    });

    it("T46: unbound contract throws before lifetime dispatch", () => {
        const ChatDataSource = inject.define<{ value: string }>("ChatDataSource");

        expect(() => getInjectOptions(ChatDataSource)).toThrow(UnboundContractError);
    });

    it("T47: preserves define-time name for object-shaped contract providers", () => {
        const factory = vi.fn(() => ({ value: "object-provider" }));
        const ChatDataSource = inject.define<{ value: string }>("ChatDataSource");

        ChatDataSource.bind({
            token: { id: "provider-token" },
            getInstance: factory,
            lifetime: "TRANSIENT",
            name: "CloudDataSourceProvider",
        });

        const options = getInjectOptions(ChatDataSource);

        expect(options.name).toBe("ChatDataSource");
        expect(options.lifetime).toBe("TRANSIENT");
        expect(options.requireProvide).toBe(false);
        expect(options.token).toBe(ChatDataSource);
        expect(options.getInstance()).toEqual({ value: "object-provider" });
        expect(factory).toHaveBeenCalledOnce();
    });
});
