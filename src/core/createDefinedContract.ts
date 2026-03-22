import {
    CONTRACT_STATE,
    DEFINED_CONTRACT,
    type Constructor,
    type ContractProvider,
    type DefinedContract,
    type DefinedContractState,
    type InjectComputedOptions,
    type InjectOptions,
} from "@/core/di.types";
import { ContractAlreadyResolvedError, UnboundContractError } from "@/core/errors";
import { getInjectOptions } from "@/core/getInjectOptions";

export function createDefinedContract<T>(name: string): DefinedContract<T> {
    const contract: DefinedContract<T> = {
        [DEFINED_CONTRACT]: true as const,
        [CONTRACT_STATE]: { status: "unbound" } as DefinedContractState<T>,
        get token() {
            return contract;
        },
        get name() {
            return name;
        },
        get lifetime() {
            const state = contract[CONTRACT_STATE];

            if (state.status === "unbound") {
                throw new UnboundContractError(name);
            }

            return state.descriptor.lifetime;
        },
        get requireProvide() {
            return false as const;
        },
        getInstance() {
            const state = contract[CONTRACT_STATE];

            if (state.status === "unbound") {
                throw new UnboundContractError(name);
            }

            if (state.status === "bound-unresolved") {
                contract[CONTRACT_STATE] = {
                    status: "bound-resolved",
                    descriptor: state.descriptor,
                    implementationName: state.implementationName,
                };
            }

            return state.descriptor.getInstance() as T;
        },
        bind(provider: ContractProvider<T>) {
            const state = contract[CONTRACT_STATE];

            if (state.status === "bound-resolved") {
                throw new ContractAlreadyResolvedError(name);
            }

            const descriptor = getInjectOptions(
                provider as Constructor<T> | InjectOptions<T>,
            ) as InjectComputedOptions<T>;

            contract[CONTRACT_STATE] = {
                status: "bound-unresolved",
                descriptor,
                implementationName: descriptor.name,
            };

            return contract;
        },
    } satisfies DefinedContract<T>;

    return contract;
}
