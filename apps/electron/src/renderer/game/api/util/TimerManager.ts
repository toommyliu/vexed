// https://www.npmjs.com/package/set-interval-async
// https://www.npmjs.com/package/@sapphire/timer-manager
/* eslint-disable */
const MIN_INTERVAL_MS = 10;
const MAX_INTERVAL_MS = 2147483647;

type NativeTimeout = unknown;
type SetIntervalAsyncStrategy = 'dynamic' | 'fixed';
type SetIntervalAsyncHandler<HandlerArgs extends unknown[]> = (
	...handlerArgs: HandlerArgs
) => void | Promise<void>;

export class SetIntervalAsyncTimer<HandlerArgs extends unknown[]> {
	#timeout: NativeTimeout | undefined = undefined;
	#promise: Promise<void> | undefined = undefined;
	#stopped = false;

	static startTimer<HandlerArgs extends unknown[]>(
		strategy: SetIntervalAsyncStrategy,
		handler: SetIntervalAsyncHandler<HandlerArgs>,
		intervalMs: number,
		...handlerArgs: HandlerArgs
	): SetIntervalAsyncTimer<HandlerArgs> {
		intervalMs = Math.min(
			Math.max(Math.trunc(intervalMs), MIN_INTERVAL_MS),
			MAX_INTERVAL_MS,
		);
		const timer = new SetIntervalAsyncTimer<HandlerArgs>();
		timer.#scheduleTimeout(
			strategy,
			handler,
			intervalMs,
			intervalMs,
			...handlerArgs,
		);
		return timer;
	}

	static async stopTimer<HandlerArgs extends unknown[]>(
		timer: SetIntervalAsyncTimer<HandlerArgs>,
	): Promise<void> {
		timer.#stopped = true;
		if (timer.#timeout) {
			// @ts-expect-error
			clearTimeout(timer.#timeout);
		}
		if (timer.#promise) {
			await timer.#promise;
		}
	}

	#scheduleTimeout(
		strategy: SetIntervalAsyncStrategy,
		handler: SetIntervalAsyncHandler<HandlerArgs>,
		intervalMs: number,
		delayMs: number,
		...handlerArgs: HandlerArgs
	): void {
		this.#timeout = setTimeout(async () => {
			this.#timeout = undefined;
			this.#promise = this.#runHandlerAndScheduleTimeout(
				strategy,
				handler,
				intervalMs,
				...handlerArgs,
			);
			await this.#promise;
			this.#promise = undefined;
		}, delayMs);
	}

	async #runHandlerAndScheduleTimeout(
		strategy: SetIntervalAsyncStrategy,
		handler: SetIntervalAsyncHandler<HandlerArgs>,
		intervalMs: number,
		...handlerArgs: HandlerArgs
	): Promise<void> {
		const startTimeMs = new Date().getTime();
		try {
			await handler(...handlerArgs);
		} finally {
			if (!this.#stopped) {
				const executionTimeMs = new Date().getTime() - startTimeMs;
				const delayMs =
					strategy === 'dynamic'
						? intervalMs > executionTimeMs
							? intervalMs - executionTimeMs
							: 0
						: intervalMs;
				this.#scheduleTimeout(
					strategy,
					handler,
					intervalMs,
					delayMs,
					...handlerArgs,
				);
			}
		}
	}
}

export function setIntervalAsync<HandlerArgs extends unknown[]>(
	handler: SetIntervalAsyncHandler<HandlerArgs>,
	intervalMs: number,
	...handlerArgs: HandlerArgs
): SetIntervalAsyncTimer<HandlerArgs> {
	if (!(typeof handler === 'function')) {
		throw new TypeError('First argument is not a function');
	}
	if (!(typeof intervalMs === 'number')) {
		throw new TypeError('Second argument is not a number');
	}
	return SetIntervalAsyncTimer.startTimer(
		'dynamic',
		handler,
		intervalMs,
		...handlerArgs,
	);
}

export async function clearIntervalAsync<HandlerArgs extends unknown[]>(
	timer: SetIntervalAsyncTimer<HandlerArgs>,
): Promise<void> {
	if (!(timer instanceof SetIntervalAsyncTimer)) {
		throw new TypeError(
			'First argument is not an instance of SetIntervalAsyncTimer',
		);
	}
	await SetIntervalAsyncTimer.stopTimer(timer);
}

/**
 * Manager for timers and intervals.
 */
export class TimerManager {
	#intervals: Set<SetIntervalAsyncTimer<unknown[]>> = new Set();
	#timeouts: Set<NativeTimeout> = new Set();

	/**
	 * @param fn - The interval function.
	 * @param interval - The delay between each execution.
	 * @returns - The interval id.
	 */
	public setInterval(
		fn: Function,
		interval: number,
	): SetIntervalAsyncTimer<unknown[]> {
		const id = setIntervalAsync(async () => {
			await fn();
		}, interval);
		this.#intervals.add(id);
		return id;
	}

	/**
	 * @param id - The interval id.
	 */
	public async clearInterval(
		id: SetIntervalAsyncTimer<unknown[]>,
	): Promise<void> {
		clearIntervalAsync(id);
		this.#intervals.delete(id);
	}

	/**
	 * @param fn - The timeout function.
	 * @param delay - The delay before executing the function.
	 * @param args - Arguments to pass to the function.
	 * @returns - The timeout id.
	 */
	public setTimeout(fn: Function, delay: number, ...args: any[]): number {
		const timeout = setTimeout(() => {
			this.#timeouts.delete(timeout);
			fn(...args);
		}, delay);
		this.#timeouts.add(timeout);
		// @ts-expect-error
		return timeout;
	}

	/**
	 * @param timeout - The timeout id.
	 */
	public clearTimeout(timeout: number): void {
		clearTimeout(timeout);
		this.#timeouts.delete(timeout);
	}
}
/* eslint-enable */
