export function sleep(ms: number, signal?: AbortSignal) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(resolve, ms);

    if (signal) {
      const onAbort = () => {
        clearTimeout(timeoutId);
        reject();
      };

      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}
