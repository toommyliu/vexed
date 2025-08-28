import type { ActionFunction } from "./types";

const createChainFns = <TInput>() => {
  const node: any = {
    input<NewInput>() {
      return createChainFns<NewInput>();
    },

    action: <TResult>(action: ActionFunction<TInput, TResult>) => {
      return {
        action,
      };
    },
  };

  // Return a proxy so consumers can namespace procedures like `procedure.namespace.fn.action(...)`.
  return new Proxy(node, {
    get(target, prop, receiver) {
      // Preserve access to existing members (input/action/etc.) and built-in symbols
      if (typeof prop === "symbol" || prop in target) {
        return Reflect.get(target, prop, receiver);
      }

      // Lazily create and cache a nested chain for namespacing
      const key = String(prop);
      if (!(key in target)) {
        target[key] = createChainFns<any>();
      }
      return target[key];
    },
  });
};

const tipc = {
  create() {
    return {
      procedure: createChainFns<void>(),
    };
  },
};

export { tipc };
