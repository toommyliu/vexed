// https://www.npmjs.com/package/set-interval-async
// https://www.npmjs.com/package/@sapphire/timer-manager

const MIN_INTERVAL_MS = 10;
const MAX_INTERVAL_MS = 2147483647;
class SetIntervalAsyncTimer {
	#timeout = undefined;
	#promise = undefined;
	#stopped = false;
	static startTimer(strategy, handler, intervalMs, ...handlerArgs) {
		intervalMs = Math.min(
			Math.max(Math.trunc(intervalMs), MIN_INTERVAL_MS),
			MAX_INTERVAL_MS,
		);
		const timer = new SetIntervalAsyncTimer();
		timer.#scheduleTimeout(
			strategy,
			handler,
			intervalMs,
			intervalMs,
			...handlerArgs,
		);
		return timer;
	}
	static async stopTimer(timer) {
		timer.#stopped = true;
		if (timer.#timeout) {
			clearTimeout(timer.#timeout);
		}
		if (timer.#promise) {
			await timer.#promise;
		}
	}
	#scheduleTimeout(strategy, handler, intervalMs, delayMs, ...handlerArgs) {
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
		strategy,
		handler,
		intervalMs,
		...handlerArgs
	) {
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

function setIntervalAsync(handler, intervalMs, ...handlerArgs) {
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

async function clearIntervalAsync(timer) {
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
class TimerManager {
	#intervals = new Set();
	#timeouts = new Set();

	/**
	 * @param {Function} fn The interval function.
	 * @param {number} interval The delay between each execution.
	 * @returns {SetIntervalAsyncTimer} The interval id.
	 */
	setInterval(fn, interval) {
		const id = setIntervalAsync(async () => {
			await fn();
		}, interval);
		this.#intervals.add(id);
		return id;
	}

	/**
	 * @param {SetIntervalAsyncTimer} id The interval id.
	 * @returns {Promise<void>}
	 */
	async clearInterval(id) {
		clearIntervalAsync(id);
		this.#intervals.delete(id);
	}

	/**
	 * @param {Function} fn The timeout function.
	 * @param {number} delay The delay before executing the function.
	 * @param  {...any} args Arguments to pass to the function.
	 * @returns {number} The timeout id.
	 */
	setTimeout(fn, delay, ...args) {
		const timeout = setTimeout(() => {
			this.#timeouts.delete(timeout);
			fn(...args);
		}, delay);
		this.#timeouts.add(timeout);
		return timeout;
	}

	/**
	 * @param {number} timeout The timeout id.
	 * @returns {void}
	 */
	clearTimeout(timeout) {
		clearTimeout(timeout);
		this.#timeouts.delete(timeout);
	}
}

export default TimerManager;