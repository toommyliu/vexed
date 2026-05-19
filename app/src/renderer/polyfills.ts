if (!Array.prototype.at) {
  Object.defineProperty(Array.prototype, "at", {
    configurable: true,
    value(
      this:
        | readonly unknown[]
        | { readonly length: number; readonly [n: number]: unknown },
      index: number,
    ) {
      const length = this.length;
      const relativeIndex = Math.trunc(index) || 0;
      const resolvedIndex =
        relativeIndex < 0 ? length + relativeIndex : relativeIndex;

      if (resolvedIndex < 0 || resolvedIndex >= length) {
        return undefined;
      }

      return this[resolvedIndex];
    },
    writable: true,
  });
}
