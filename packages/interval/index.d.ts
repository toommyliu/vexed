/**
 * Configuration options for the interval function
 */
export interface IIntervalPromiseOptions {
  /**
   * Number of iterations to run. Defaults to Infinity.
   */
  iterations?: number;

  /**
   * Whether to stop execution on error. Defaults to true.
   */
  stopOnError?: boolean;
}

/**
 * Function that stops the interval execution
 */
export type stop = () => void;

/**
 * Function to be executed at each interval
 * @param iterationNumber - The current iteration number (1-based)
 * @param stop - Function to call to stop the interval
 * @returns Promise that resolves when the function completes
 */
export type func = (iterationNumber: number, stop: stop) => Promise<void>;

/**
 * Function that calculates interval length based on iteration number
 * @param iterationNumber - The current iteration number (1-based)
 * @returns The interval length in milliseconds
 */
export type intervalLengthFn = (iterationNumber: number) => number;

/**
 * Interval length specification - either a fixed number or a function
 */
export type intervalLength = intervalLengthFn | number;

/**
 * Executes a function at specified intervals with promise support and advanced control
 *
 * @param func - The function to execute at each interval
 * @param intervalLength - The interval length in milliseconds or a function that returns it
 * @param options - Configuration options
 * @returns A promise that resolves when all intervals are complete
 *
 * @example
 * ```typescript
 * import { interval } from 'async-interval';
 *
 * // Run every 1000ms, 5 times
 * await interval(
 *   async (iteration, stop) => {
 *     console.log(`Iteration ${iteration}`);
 *     if (iteration === 3) {
 *       stop(); // Stop early
 *     }
 *   },
 *   1000,
 *   { iterations: 5 }
 * );
 * ```
 */
export function interval(
  func: func,
  intervalLength: intervalLength,
  options?: IIntervalPromiseOptions,
): Promise<void>;
