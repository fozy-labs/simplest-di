import { InjectableOptions } from "./di.types";
import { INJECTABLE_OPTIONS } from "./symbols";

type Constructor<T = any> = new (...args: any[]) => T;

// ecma 3 stage decorator
export function injectable<T extends Constructor>(options: InjectableOptions<T> = "SINGLETON") {
    return function (value: T, _context: ClassDecoratorContext<T>) {
        Object.defineProperty(value, INJECTABLE_OPTIONS, {
            value: options,
            writable: false,
            enumerable: false,
            configurable: false,
        });
    };
}
