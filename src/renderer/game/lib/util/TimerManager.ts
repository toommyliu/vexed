// https://www.npmjs.com/package/set-interval-async
// https://www.npmjs.com/package/@sapphire/timer-manager

const MIN_INTERVAL_MS = 10;
const MAX_INTERVAL_MS = 2_147_483_647;

export class SetIntervalAsyncTimer {
	#timeout: ReturnType<typeof setTimeout> | undefined = undefined;

	#promise: Promise<void> | undefined = undefined;

	#stopped = false;

	public static startTimer(
		handler: SetIntervalAsyncHandler,
		intervalMs: number,
		...handlerArgs: any[]
	): SetIntervalAsyncTimer {
		// eslint-disable-next-line no-param-reassign
		intervalMs = Math.min(
			Math.max(Math.trunc(intervalMs), MIN_INTERVAL_MS),
			MAX_INTERVAL_MS,
		);
		const timer = new SetIntervalAsyncTimer();
		timer.#scheduleTimeout(handler, intervalMs, intervalMs, ...handlerArgs);
		return timer;
	}

	public static async stopTimer(timer: SetIntervalAsyncTimer): Promise<void> {
		timer.#stopped = true;
		if (timer.#timeout) {
			clearTimeout(timer.#timeout);
		}

		if (timer.#promise) {
			await timer.#promise;
		}
	}

	#scheduleTimeout(
		handler: SetIntervalAsyncHandler,
		intervalMs: number,
		delayMs: number,
		...handlerArgs: any[]
	): void {
		this.#timeout = setTimeout(async () => {
			this.#timeout = undefined;
			this.#promise = this.#runHandlerAndScheduleTimeout(
				handler,
				intervalMs,
				...handlerArgs,
			);
			await this.#promise;
			this.#promise = undefined;
		}, delayMs);
	}

	async #runHandlerAndScheduleTimeout(
		handler: SetIntervalAsyncHandler,
		intervalMs: number,
		...handlerArgs: any[]
	): Promise<void> {
		const startTimeMs = Date.now();
		try {
			await handler(...handlerArgs);
		} finally {
			if (!this.#stopped) {
				const executionTimeMs = Date.now() - startTimeMs;
				const delayMs =
					intervalMs > executionTimeMs
						? intervalMs - executionTimeMs
						: 0;
				this.#scheduleTimeout(
					handler,
					intervalMs,
					delayMs,
					...handlerArgs,
				);
			}
		}
	}
}

function setIntervalAsync(
	handler: SetIntervalAsyncHandler,
	intervalMs: number,
	...handlerArgs: any[]
): SetIntervalAsyncTimer {
	if (typeof handler !== 'function') {
		throw new TypeError('First argument is not a function');
	}

	if (typeof intervalMs !== 'number') {
		throw new TypeError('Second argument is not a number');
	}

	return SetIntervalAsyncTimer.startTimer(
		handler,
		intervalMs,
		...handlerArgs,
	);
}

async function clearIntervalAsync(timer: SetIntervalAsyncTimer): Promise<void> {
	if (!(timer instanceof SetIntervalAsyncTimer)) {
		throw new TypeError(
			'First argument is not an instance of SetIntervalAsyncTimer',
		);
	}

	await SetIntervalAsyncTimer.stopTimer(timer);
}

export class TimerManager {
	#intervals: Set<SetIntervalAsyncTimer> = new Set();

	#timeouts: Set<ReturnType<typeof setTimeout>> = new Set();

	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	public setInterval(fn: Function, interval: number): SetIntervalAsyncTimer {
		const id = setIntervalAsync(async () => {
			await fn();
		}, interval);
		this.#intervals.add(id);
		return id;
	}

	public async clearInterval(id: SetIntervalAsyncTimer): Promise<void> {
		void clearIntervalAsync(id);
		this.#intervals.delete(id);
	}

	public setTimeout(
		// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
		fn: Function,
		delay: number,
		...args: any[]
	): ReturnType<typeof setTimeout> {
		const timeout = setTimeout(() => {
			this.#timeouts.delete(timeout);
			fn(...args);
		}, delay);
		this.#timeouts.add(timeout);
		return timeout;
	}

	public clearTimeout(timeout: ReturnType<typeof setTimeout>): void {
		clearTimeout(timeout);
		this.#timeouts.delete(timeout);
	}
}

type SetIntervalAsyncHandler = (...args: any[]) => Promise<void> | void;
