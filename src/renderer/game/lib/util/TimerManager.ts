// https://www.npmjs.com/package/set-interval-async
// https://www.npmjs.com/package/@sapphire/timer-manager

const MIN_INTERVAL_MS = 10;
const MAX_INTERVAL_MS = 2_147_483_647;

type SetIntervalAsyncHandler = () => Promise<void> | void;

export class SetIntervalAsyncTimer {
  #timeout: ReturnType<typeof window.setTimeout> | undefined = undefined;

  #promise: Promise<void> | undefined = undefined;

  #stopped = false;

  public static startTimer(
    handler: SetIntervalAsyncHandler,
    intervalMs: number,
  ): SetIntervalAsyncTimer {
    const ms = Math.min(
      Math.max(Math.trunc(intervalMs), MIN_INTERVAL_MS),
      MAX_INTERVAL_MS,
    );
    const timer = new SetIntervalAsyncTimer();
    timer.#scheduleTimeout(handler, ms, ms);
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
  ): void {
    this.#timeout = setTimeout(async () => {
      this.#timeout = undefined;
      this.#promise = this.#runHandlerAndScheduleTimeout(handler, intervalMs);
      await this.#promise;
      this.#promise = undefined;
    }, delayMs);
  }

  async #runHandlerAndScheduleTimeout(
    handler: SetIntervalAsyncHandler,
    intervalMs: number,
  ): Promise<void> {
    const startTimeMs = Date.now();
    try {
      await handler();
    } finally {
      if (!this.#stopped) {
        const executionTimeMs = Date.now() - startTimeMs;
        const delayMs =
          /* strategy === 'dynamic'*/
          true
            ? intervalMs > executionTimeMs
              ? intervalMs - executionTimeMs
              : 0
            : intervalMs;

        this.#scheduleTimeout(handler, intervalMs, delayMs);
      }
    }
  }
}

export function setIntervalAsync(
  handler: SetIntervalAsyncHandler,
  intervalMs: number,
): SetIntervalAsyncTimer {
  if (typeof handler !== 'function') {
    throw new TypeError('First argument is not a function');
  }

  if (typeof intervalMs !== 'number') {
    throw new TypeError('Second argument is not a number');
  }

  return SetIntervalAsyncTimer.startTimer(handler, intervalMs);
}

export async function clearIntervalAsync(
  timer: SetIntervalAsyncTimer,
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
  #intervals: Set<SetIntervalAsyncTimer> = new Set();

  #timeouts: Set<number> = new Set();

  /**
   * @param fn - The interval function.
   * @param interval - The delay between each execution.
   * @returns - The interval id.
   */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  public setInterval(fn: Function, interval: number): SetIntervalAsyncTimer {
    const id = setIntervalAsync(async () => {
      await fn();
    }, interval);
    this.#intervals.add(id);
    return id;
  }

  /**
   * @param id - The interval id.
   */
  public async clearInterval(id: SetIntervalAsyncTimer): Promise<void> {
    void clearIntervalAsync(id);
    this.#intervals.delete(id);
  }

  /**
   * @param fn - The timeout function.
   * @param delay - The delay before executing the function.
   * @returns - The timeout id.
   */
  public setTimeout(fn: SetIntervalAsyncHandler, delay: number): number {
    const timeout = window.setTimeout(() => {
      this.#timeouts.delete(timeout);
      void fn();
    }, delay);
    this.#timeouts.add(timeout);
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
