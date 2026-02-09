import type {
  ActionContext,
  ActionContextWithSenderWindow,
  ActionFunction,
  EventFunction,
} from "./types";

type ChainNode<TInput, TContext extends ActionContext = ActionContext> = {
  input<NewInput>(): ChainNode<NewInput, TContext>;
  requireSenderWindow(): ChainNode<TInput, ActionContextWithSenderWindow>;
  action<TResult>(action: ActionFunction<TInput, TResult, TContext>): {
    action: ActionFunction<TInput, TResult, TContext>;
    __tipcMeta?: { requireSenderWindow?: boolean };
  };
  event(action: EventFunction<TInput>): { event: EventFunction<TInput> };
  [key: string]: unknown;
};

const createChainFns = <
  TInput,
  TContext extends ActionContext = ActionContext,
>(meta: { requireSenderWindow?: boolean } = {}): ChainNode<TInput, TContext> => {
  const node: ChainNode<TInput, TContext> = {
    input<NewInput>() {
      return createChainFns<NewInput, TContext>(meta);
    },

    requireSenderWindow() {
      return createChainFns<TInput, ActionContextWithSenderWindow>({
        ...meta,
        requireSenderWindow: true,
      });
    },

    action: <TResult>(action: ActionFunction<TInput, TResult, TContext>) => {
      return {
        action,
        __tipcMeta: { ...meta },
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
        // propagate current context/meta for nested namespaces
        target[key] = createChainFns<unknown, TContext>(meta);
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
