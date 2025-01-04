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

/**
 * Makes an asynchronous task interruptible using signals.
 *
 * @param task - The task to make interruptible.
 * @param signal - The AbortSignal to use for interrupting the task. If
 * omitted, the task will be executed without interruption.
 * @returns A promise that resolves when the task completes or rejects when
 * the task is interrupted.
 */
export async function makeInterruptible<T>(
	task: () => Promise<T>,
	signal?: AbortSignal | null,
): Promise<T> {
	// If no signal, the task can execute normally.
	if (!signal) {
		return task();
	}

	// Race the task with the signal.
	// If the signal is aborted, the task will be interrupted.
	return Promise.race([
		task(),
		new Promise<never>((_resolve, reject) => {
			signal.addEventListener('abort', () => {
				reject(new Error('Task interrupted'));
			});
		}),
	]);
}
