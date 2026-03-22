import { InjectionLifetime } from "@/core/di.types";
import { InjectScope } from "@/core/InjectScope";

export class NonCompatibleParentError extends Error {
    constructor(tokenName: string, lifetime: InjectionLifetime) {
        const currentName = InjectScope.current?.name;
        const currentLifetime = InjectScope.current?.lifetime;

        super(`Cannot inject ${lifetime} (${tokenName}) into ${currentLifetime} (${currentName})`);
        this.name = "NonCompatibleParentError";
    }
}

export class CircularDependencyError extends Error {
    constructor(tokenName: string) {
        super(`Circular dependency detected while resolving ${tokenName}`);
        this.name = "CircularDependencyError";
    }
}

export class MustBeProvidedError extends Error {
    constructor(tokenName: string) {
        super(`The dependency ${tokenName} must be provided before it can be injected.`);
        this.name = "MustBeProvidedError";
    }
}

export class UnboundContractError extends Error {
    constructor(contractName: string) {
        super(`The contract ${contractName} must be bound before it can be injected.`);
        this.name = "UnboundContractError";
    }
}

export class ContractAlreadyResolvedError extends Error {
    constructor(contractName: string) {
        super(`Cannot rebind ${contractName} after it has started resolving.`);
        this.name = "ContractAlreadyResolvedError";
    }
}
