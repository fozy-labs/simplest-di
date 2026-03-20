import { resetRegistry } from "@/core";
import { InjectScope } from "@/core/InjectScope";

beforeEach(() => {
    resetRegistry();
    InjectScope.injecting = false;
    InjectScope.current = null;
    InjectScope.previous = undefined;
});
