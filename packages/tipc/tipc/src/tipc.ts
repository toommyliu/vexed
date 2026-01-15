import type { ActionFunction, EventFunction } from "./types";

type ChainNode<TInput> = {
  input<NewInput>(): ChainNode<NewInput>;
  action<TResult>(action: ActionFunction<TInput, TResult>): {
    action: ActionFunction<TInput, TResult>;
  };
  event(action: EventFunction<TInput>): { event: EventFunction<TInput> };
  [key: string]: unknown;
};

const createChainFns = <TInput>(): ChainNode<TInput> => {
  const node: ChainNode<TInput> = {
    input<NewInput>() {
      return createChainFns<NewInput>();
    },

    action: <TResult>(action: ActionFunction<TInput, TResult>) => {
      return {
        action,
      };
    },

    event: (action: EventFunction<TInput>) => {
      return {
        event: action,
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
        target[key] = createChainFns<unknown>();
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
