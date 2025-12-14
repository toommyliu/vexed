/**
 * Converts a value to a number.
 * 
 * @param value - the value to convert
 * @param defaultValue - the default value to return if the value is null or undefined
 * @returns the number value or the default value, otherwise null
 */
export function number(value: string | number | null | undefined): number | null;
export function number(value: string | number | null | undefined, defaultValue: number): number;
export function number(value: string | number | null | undefined, defaultValue?: number): number | null {
    if (value === null || value === undefined)
        return defaultValue ?? null;

    if (typeof value === "string") {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed))
            return defaultValue ?? null;

        return parsed;
    }

    return value;
}