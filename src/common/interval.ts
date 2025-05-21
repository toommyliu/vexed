// https://www.npmjs.com/package/interval-promise

/**
 * @param val - value to check
 * @returns true if the value is then-able
 */
function isPromise(val: any): boolean {
  return val !== null && typeof val.then === "function";
}

export async function interval(
  func: func,
  intervalLength: intervalLength,
  options: IIntervalPromiseOptions = {},
): Promise<void> {
  validateArgs(func, intervalLength, options);

  const defaults: Required<IIntervalPromiseOptions> = {
    iterations: Infinity,
    stopOnError: true,
  };
  const settings: Required<IIntervalPromiseOptions> = {
    ...defaults,
    ...options,
  };

  // Track all active timeouts in an array
  const activeTimeouts: ReturnType<typeof setTimeout>[] = [];

  // Helper function to clear all pending timeouts
  const clearAllTimeouts = (): void => {
    while (activeTimeouts.length > 0) {
      const timeoutId = activeTimeouts.pop();
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  };

  return new Promise<void>((resolve, reject) => {
    const callFunction = (currentIteration: number): void => {
      // Set up a way to track if a "stop" was requested by the user function
      let stopRequested = false;
      const stop: stop = () => {
        stopRequested = true;
        // Clear all pending timeouts when stop is called
        clearAllTimeouts();
      };

      // Set up a function to call the next iteration. This is abstracted so it can be called by .then(), or in .catch(), if options allow.
      const callNext = (): void => {
        // If we've hit the desired number of iterations, or stop was called, resolve the root promise and return
        if (currentIteration === settings.iterations || stopRequested) {
          resolve();
          return;
        }

        // Otherwise, call the next iteration
        callFunction(currentIteration + 1);
      };

      // Calculate our interval length
      const calculatedIntervalLength: number =
        typeof intervalLength === "function"
          ? intervalLength(currentIteration)
          : intervalLength;

      // If the interval length was calculated, validate the result
      if (
        typeof intervalLength === "function" &&
        (!Number.isInteger(calculatedIntervalLength) ||
          calculatedIntervalLength < 0)
      ) {
        clearAllTimeouts();
        reject(
          new Error(
            'Function for "intervalLength" argument must return a non-negative integer.',
          ),
        );
        return;
      }

      // Call the user function after the desired interval length. After, call the next iteration (and/or handle error)
      const timeoutId = setTimeout(() => {
        // Remove this timeout from the active list since it's now executing
        const index = activeTimeouts.indexOf(timeoutId);
        if (index !== -1) {
          activeTimeouts.splice(index, 1);
        }

        const returnVal = func(currentIteration, stop);

        // Ensure that the value returned is a promise
        if (!isPromise(returnVal)) {
          clearAllTimeouts();
          reject(new Error('Return value of "func" must be a Promise.'));
          return;
        }

        // eslint-disable-next-line promise/prefer-await-to-callbacks, promise/prefer-await-to-then
        returnVal.then(callNext).catch((error: Error) => {
          if (!settings.stopOnError) {
            callNext();
            return;
          }

          clearAllTimeouts();
          reject(error);
        });
      }, calculatedIntervalLength);

      // Store the timeout ID for potential clearing
      activeTimeouts.push(timeoutId);
    };

    callFunction(1);
  });
}

/**
 * A helper function to validate the arguments passed to interval(...)
 */
function validateArgs(func: any, intervalLength: any, options: any): void {
  // Validate "func"
  if (typeof func !== "function") {
    throw new TypeError('Argument 1, "func", must be a function.');
  }

  // Validate "intervalLength"
  if (typeof intervalLength === "number") {
    if (!Number.isInteger(intervalLength) || intervalLength < 0) {
      throw new TypeError(
        'Argument 2, "intervalLength", must be a non-negative integer or a function that returns a non-negative integer.',
      );
    }
  } else if (typeof intervalLength !== "function") {
    throw new TypeError(
      'Argument 2, "intervalLength", must be a non-negative integer or a function that returns a non-negative integer.',
    );
  }

  // Validate options...
  if (typeof options !== "object") {
    throw new TypeError('Argument 3, "options", must be an object.');
  }

  // Validate passed keys
  const allowedKeys = ["iterations", "stopOnError"];

  for (const key of Object.keys(options)) {
    if (!allowedKeys.includes(key)) {
      throw new TypeError('Option "' + key + '" is not a valid option.');
    }
  }

  // validate "iterations" option (if passed)
  if (
    typeof options.iterations !== "undefined" &&
    options.iterations !== Infinity &&
    (!Number.isInteger(options.iterations) || options.iterations < 1)
  ) {
    throw new TypeError(
      'Option "iterations" must be Infinity or an integer greater than 0.',
    );
  }

  // validate "stopOnError" option (if passed)
  if (
    typeof options.stopOnError !== "undefined" &&
    typeof options.stopOnError !== "boolean"
  ) {
    throw new TypeError('Option "stopOnError" must be a boolean.');
  }
}

type IIntervalPromiseOptions = {
  iterations?: number;
  stopOnError?: boolean;
};

type stop = () => void;
type func = (iterationNumber: number, stop: stop) => Promise<void>;
type intervalLengthFn = (iterationNumber: number) => number;
type intervalLength = intervalLengthFn | number;
