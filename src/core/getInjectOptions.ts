import {
    Injectable,
    InjectableDetailedOptions,
    InjectComputedOptions,
    InjectionLifetime,
    InjectOptions,
} from "./di.types";
import { INJECTABLE_OPTIONS } from "./symbols";

type Constructor = new (...args: any[]) => any;

function getName<T extends Constructor>(options: InjectOptions<T>): string {
    if (typeof options === "function") {
        // @ts-expect-error — options may be a function with .name
        return options.name ?? options.constructor.name ?? "[anonymous]";
    }

    return String(options.token ?? "[anonymous]");
}

export function getInjectOptions<T extends Constructor>(arg: T | InjectOptions<T>): InjectComputedOptions<T> {
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
        };
    }

    let options = arg as InjectOptions<T>;

    if (!options.name) {
        options = {
            ...options,
            get name() {
                return getName(options);
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
