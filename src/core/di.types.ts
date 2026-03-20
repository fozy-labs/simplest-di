import { INJECTABLE_OPTIONS, INJECTING_INSTANCE } from "./symbols";

type Constructor<T = any> = new (...args: any[]) => T;

export type InjectableOptionsSymbol = typeof INJECTABLE_OPTIONS;
export type InjectingInstanceSymbol = typeof INJECTING_INSTANCE;

export type InjectionLifetime = "SINGLETON" | "TRANSIENT" | "SCOPED";

export type InjectableDetailedOptions<T extends Constructor> = {
    lifetime: InjectionLifetime;
    onScopeInit?: (this: InstanceType<T>) => void | (() => void);
    /**
     * Требовать обязательного inject.provide(Entity) для регистрации в скоупе.
     */
    requireProvide?: boolean;
};

export type InjectableOptions<T extends Constructor = any> = InjectionLifetime | InjectableDetailedOptions<T>;

export type Injectable = Record<InjectableOptionsSymbol, InjectableOptions>;

export type InjectOptions<T extends Constructor> = {
    token: unknown;
    getInstance: () => InstanceType<T>;
    name?: string;
} & InjectableDetailedOptions<T>;

export type InjectComputedOptions<T extends Constructor> = Omit<InjectOptions<T>, "name" | "requireProvide"> & {
    name: string;
    requireProvide: boolean;
};

export type ProvideOptions<T extends Constructor> = InjectOptions<T> | T;
