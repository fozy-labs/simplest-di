import {
    CircularDependencyError,
    ContractAlreadyResolvedError,
    MustBeProvidedError,
    NonCompatibleParentError,
    UnboundContractError,
} from "@/core/errors";
import { InjectScope } from "@/core/InjectScope";

describe("errors", () => {
    // T39: CircularDependencyError has correct name and message
    it("T39: CircularDependencyError has correct name and message", () => {
        const error = new CircularDependencyError("MyService");

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(CircularDependencyError);
        expect(error.name).toBe("CircularDependencyError");
        expect(error.message).toContain("MyService");
        expect(error.message).toContain("Circular dependency");
    });

    // T40: NonCompatibleParentError includes parent context info
    it("T40: NonCompatibleParentError includes parent context info", () => {
        // Set InjectScope.current to simulate injection context
        const original = InjectScope.current;
        InjectScope.current = {
            token: class ParentService {},
            getInstance: () => null as any,
            name: "ParentService",
            lifetime: "SINGLETON",
        };

        try {
            const error = new NonCompatibleParentError("ChildService", "SCOPED");

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(NonCompatibleParentError);
            expect(error.name).toBe("NonCompatibleParentError");
            expect(error.message).toContain("ChildService");
            expect(error.message).toContain("SINGLETON");
            expect(error.message).toContain("ParentService");
        } finally {
            InjectScope.current = original;
        }
    });

    // T41: MustBeProvidedError has correct name and message
    it("T41: MustBeProvidedError has correct name and message", () => {
        const error = new MustBeProvidedError("RequiredService");

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(MustBeProvidedError);
        expect(error.name).toBe("MustBeProvidedError");
        expect(error.message).toContain("RequiredService");
        expect(error.message).toContain("must be provided");
    });

    it("T44: UnboundContractError has correct name and message", () => {
        const error = new UnboundContractError("ChatDataSource");

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(UnboundContractError);
        expect(error.name).toBe("UnboundContractError");
        expect(error.message).toContain("ChatDataSource");
        expect(error.message).toContain("must be bound");
    });

    it("T45: ContractAlreadyResolvedError has correct name and message", () => {
        const error = new ContractAlreadyResolvedError("ChatDataSource");

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ContractAlreadyResolvedError);
        expect(error.name).toBe("ContractAlreadyResolvedError");
        expect(error.message).toContain("ChatDataSource");
        expect(error.message).toContain("Cannot rebind");
    });
});