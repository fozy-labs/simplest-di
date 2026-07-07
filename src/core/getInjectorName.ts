import { InjectScope } from "./InjectScope";

/**
 * Имя родительского инжектора в текущей цепочке внедрения.
 *
 * - `strict` (по умолчанию) — бросает, если родителя нет (внедрение верхнего уровня);
 * - `strict = false` — возвращает `null` в том же случае.
 *
 * Вызов вне активного внедрения всегда бросает.
 */
export function getInjectorName(strict?: true): string;
export function getInjectorName(strict: boolean): string | null;
export function getInjectorName(strict = true): string | null {
    if (!InjectScope.injecting) {
        throw new Error("Cannot get injection name outside of an inject scope");
    }

    const parent = InjectScope.previous;

    if (!parent) {
        if (strict) {
            throw new Error("No parent injection context in " + InjectScope.current?.name);
        }

        return null;
    }

    // Имя всегда вычислено в getInjectOptions; фолбэк — на случай пустого имени
    // (осмысленная метка вместо "[object Object]" от toString объекта опций).
    return parent.name || "[anonymous]";
}
