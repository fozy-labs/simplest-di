import { InjectOptions } from "./di.types";

type Constructor = new (...args: any[]) => any;

export const InjectScope = {
    injecting: false,
    current: null as InjectOptions<any> | null,
    previous: undefined as InjectOptions<any> | null | undefined,
    createInstance<T extends Constructor>(options: InjectOptions<T>): InstanceType<T> {
        const previous = InjectScope.previous;
        const current = InjectScope.current;

        InjectScope.injecting = true;
        InjectScope.previous = current;
        InjectScope.current = options;

        const instance = options.getInstance();

        InjectScope.injecting = false;
        InjectScope.previous = previous;
        InjectScope.current = current;

        return instance;
    },
};
