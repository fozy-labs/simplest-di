import {
    CONTRACT_STATE,
    Constructor,
    DefinedContract,
    DEFINED_CONTRACT,
    Injectable,
    InjectableDetailedOptions,
    InjectComputedOptions,
    InjectionLifetime,
    InjectOptions,
} from "@/core/di.types";
import { UnboundContractError } from "@/core/errors";
import { INJECTABLE_OPTIONS } from "@/core/symbols";

function isDefinedContract<T>(value: unknown): value is DefinedContract<T> {
    return typeof value === "object" && value !== null && (value as DefinedContract<T>)[DEFINED_CONTRACT] === true;
}

function getName(options: Pick<InjectOptions, "token" | "name">): string {
    return options.name ?? String(options.token ?? "[anonymous]");
}

export function getInjectOptions<T extends Constructor>(arg: T | InjectOptions<T>): InjectComputedOptions<T>;
export function getInjectOptions<T>(arg: DefinedContract<T> | InjectOptions<T>): InjectComputedOptions<T>;
export function getInjectOptions<T>(arg: Constructor | DefinedContract<T> | InjectOptions<T>): InjectComputedOptions<T> {
    if (typeof arg === "function") {
        const options = (arg as unknown as Partial<Injectable>)[INJECTABLE_OPTIONS];

        if (!options) {
            throw new Error(`No injectable options found for ${arg.name}. Did you forget to add @injectable()?`);
        }

        let injectableOptions: InjectableDetailedOptions<T> | null = null;

        if (typeof options === "string") {
            injectableOptions = {
                lifetime: options as InjectionLifetime,
            };
        } else if (typeof options === "object" && options.lifetime) {
            injectableOptions = options as InjectableDetailedOptions<T>;
        }

        if (!injectableOptions) {
            throw new Error(`Invalid injectable options for ${arg.name}`);
        }

        return {
            requireProvide: true,
            ...injectableOptions,
            token: arg,
            getInstance: () => new arg(),
            name: arg.name,
        } as InjectComputedOptions<T>;
    }

    if (isDefinedContract(arg)) {
        const state = arg[CONTRACT_STATE];

        if (state.status === "unbound") {
            throw new UnboundContractError(arg.name);
        }

        return {
            ...state.descriptor,
            token: arg,
            name: arg.name,
            requireProvide: false,
            getInstance: arg.getInstance,
        } as InjectComputedOptions<T>;
    }

    let options = arg as InjectOptions<T>;

    if (!options.name) {
        const sourceOptions = options;

        options = {
            ...options,
            get name() {
                return getName(sourceOptions);
            },
        };
    }

    if (options.requireProvide === undefined) {
        options = {
            ...options,
            requireProvide: true,
        };
    }

    return options as InjectComputedOptions<T>;
}
