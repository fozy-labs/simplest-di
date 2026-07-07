import { InjectOptions } from "./di.types";

type Constructor = new (...args: any[]) => any;

export const InjectScope = {
    injecting: false,
    current: null as InjectOptions<any> | null,
    previous: undefined as InjectOptions<any> | null | undefined,
    createInstance<T extends Constructor>(options: InjectOptions<T>): InstanceType<T> {
        const wasInjecting = InjectScope.injecting;
        const previous = InjectScope.previous;
        const current = InjectScope.current;

        InjectScope.injecting = true;
        InjectScope.previous = current;
        InjectScope.current = options;

        try {
            return options.getInstance();
        } finally {
            // Restore the previous state unconditionally — including on throw —
            // so a failed construction never leaves the injection stack dirty.
            // `injecting` is restored to its prior value (not a hard `false`) to
            // keep it truthy while an outer construction is still in progress.
            InjectScope.injecting = wasInjecting;
            InjectScope.previous = previous;
            InjectScope.current = current;
        }
    },
};
