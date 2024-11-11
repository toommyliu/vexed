export function isMonsterMapId(input: string): boolean {
	return ["id'", 'id.', 'id:', 'id-'].some((prefix) =>
		input.startsWith(prefix),
	);
}
