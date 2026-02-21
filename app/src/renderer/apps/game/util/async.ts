/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// https://github.com/microsoft/vscode/blob/main/src/vs/base/common/async.ts

export function isThenable<T>(obj: unknown): obj is Promise<T> {
  return (
    Boolean(obj) && typeof (obj as unknown as Promise<T>).then === "function"
  );
}

export class CancellationError extends Error {
  public constructor(message = "Operation was cancelled") {
    super(message);
    this.name = "CancellationError";
  }
}

export function createCancelablePromise<T>(
  // eslint-disable-next-line promise/prefer-await-to-callbacks
  callback: (signal: AbortSignal) => Promise<T>,
): CancelablePromise<T> {
  const controller = new AbortController();
  const { signal } = controller;

  // eslint-disable-next-line promise/prefer-await-to-callbacks
  const thenable = callback(signal);

  let isCancelled = false;

  const promise = new Promise<T>((resolve, reject) => {
    signal.addEventListener(
      "abort",
      () => {
        isCancelled = true;
        reject(new CancellationError());
      },
      { once: true },
    );

    // eslint-disable-next-line promise/prefer-await-to-then
    Promise.resolve(thenable).then(
      (value) => {
        if (!isCancelled) {
          resolve(value);
        }
      },
      // eslint-disable-next-line promise/prefer-await-to-callbacks
      (error) => {
        reject(error);
      },
    );
  });

  return new (class {
    public cancel() {
      controller.abort();
    }

    // eslint-disable-next-line unicorn/no-thenable
    public async then<TResult1 = T, TResult2 = never>(
      resolve?: ((value: T) => Promise<TResult1> | TResult1) | null | undefined,
      reject?:
        | ((reason: unknown) => Promise<TResult2> | TResult2)
        | null
        | undefined,
    ): Promise<TResult1 | TResult2> {
      // eslint-disable-next-line promise/prefer-await-to-then
      return promise.then(resolve, reject);
    }

    public async catch<TResult = never>(
      reject?:
        | ((reason: unknown) => Promise<TResult> | TResult)
        | null
        | undefined,
    ): Promise<T | TResult> {
      // eslint-disable-next-line promise/prefer-await-to-then
      return this.then(undefined, reject);
    }

    public async finally(
      onfinally?: (() => void) | null | undefined,
    ): Promise<T> {
      // eslint-disable-next-line promise/prefer-await-to-then
      return promise.finally(onfinally);
    }
  })() as CancelablePromise<T>;
}

export type CancelablePromise<T> = Promise<T> & {
  cancel(): void;
};
