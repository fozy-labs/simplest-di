import { InjectScope } from "./InjectScope";

export function getInjectorName(strict = true) {
    if (!InjectScope.injecting) {
        throw new Error("Cannot get injection name outside of an inject scope");
    }

    if (!InjectScope.previous) {
        if (!strict) return InjectScope.previous;
        throw new Error("No parent injection context in " + InjectScope.current?.name);
    }

    return InjectScope.previous.name || InjectScope.previous.toString();
}
