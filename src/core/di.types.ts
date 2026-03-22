import { INJECTABLE_OPTIONS, INJECTING_INSTANCE } from "@/core/symbols";

export type Constructor<T = any> = new (...args: any[]) => T;
export type InjectedInstance<T> = T extends Constructor<infer Instance> ? Instance : T;
export type ScopeToken = object;

export type InjectableOptionsSymbol = typeof INJECTABLE_OPTIONS;
export type InjectingInstanceSymbol = typeof INJECTING_INSTANCE;

export type InjectionLifetime = "SINGLETON" | "TRANSIENT" | "SCOPED";

export type InjectableDetailedOptions<T = any> = {
    lifetime: InjectionLifetime;
    onScopeInit?: (this: InjectedInstance<T>) => void | (() => void);
    /**
     * Требовать обязательного inject.provide(Entity) для регистрации в скоупе.
     */
    requireProvide?: boolean;
};

export type InjectableOptions<T extends Constructor = Constructor> = InjectionLifetime | InjectableDetailedOptions<T>;

export type Injectable = Record<InjectableOptionsSymbol, InjectableOptions>;

export type InjectOptions<T = any> = {
    token: unknown;
    getInstance: () => InjectedInstance<T>;
    name?: string;
} & InjectableDetailedOptions<T>;

export type InjectComputedOptions<T = any> = Omit<InjectOptions<T>, "name" | "requireProvide"> & {
    name: string;
    requireProvide: boolean;
};

export const DEFINED_CONTRACT = Symbol("DEFINED_CONTRACT");
export const CONTRACT_STATE = Symbol("CONTRACT_STATE");

export type ContractProvider<T> = Constructor<T> | InjectOptions<T>;

export type DefinedContractState<T> =
    | { status: "unbound" }
    | {
          status: "bound-unresolved";
          descriptor: InjectComputedOptions<T>;
          implementationName: string;
      }
    | {
          status: "bound-resolved";
          descriptor: InjectComputedOptions<T>;
          implementationName: string;
      };

export type DefinedContract<T> = {
    readonly [DEFINED_CONTRACT]: true;
    [CONTRACT_STATE]: DefinedContractState<T>;
    readonly token: object;
    readonly name: string;
    readonly lifetime: InjectionLifetime;
    readonly requireProvide: false;
    readonly getInstance: () => T;
    bind(provider: ContractProvider<T>): DefinedContract<T>;
};

export type ProvideOptions<T = any> = T extends Constructor
    ? InjectOptions<T> | T
    : InjectOptions<T> | DefinedContract<T>;
