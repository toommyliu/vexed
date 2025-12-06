/**
 * Case-insensitive equality check.
 * 
 * @param a - the first string to compare
 * @param b - the second string to compare
 * @returns true if the strings are equal, false otherwise
 */
export function equalsIgnoreCase(a: string | undefined | null, b: string | undefined | null) {
    if (a === null || b === null || a === undefined || b === undefined)
        return false;

    return a.toLowerCase() === b.toLowerCase();
}

/**
 * Case-insensitive includes check.
 * 
 * @param str - the string to search in
 * @param search - the string to search for
 * @returns true if the string contains the search string, false otherwise
 */
export function includesIgnoreCase(str: string | undefined | null, search: string | undefined | null) {
    if (str === null || search === null || str === undefined || search === undefined)
        return false;

    return str.toLowerCase().includes(search.toLowerCase());
}
