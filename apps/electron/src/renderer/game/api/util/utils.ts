/**
 * Validates if the input string is in monMapId format.
 *
 * @param input - The input string to check.
 * @returns True if the input string is in monMapId format, false otherwise.
 */
export function isMonsterMapId(input: string): boolean {
	return ["id'", 'id.', 'id:', 'id-'].some((prefix) =>
		input.startsWith(prefix),
	);
}
