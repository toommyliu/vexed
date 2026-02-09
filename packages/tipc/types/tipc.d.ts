import type {
  ActionContext,
  ActionContextWithSenderWindow,
  ActionFunction,
  EventFunction,
} from "./types";

export type ChainNode<
  TInput,
  TContext extends ActionContext = ActionContext,
> = {
  input<NewInput>(): ChainNode<NewInput, TContext>;
  requireSenderWindow(): ChainNode<TInput, ActionContextWithSenderWindow>;
  action<TResult>(action: ActionFunction<TInput, TResult, TContext>): {
    action: ActionFunction<TInput, TResult, TContext>;
    __tipcMeta?: { requireSenderWindow?: boolean };
  };
  event(action: EventFunction<TInput>): { event: EventFunction<TInput> };
  [key: string]: unknown;
};

declare const tipc: {
  create(): {
    procedure: ChainNode<void>;
  };
};

export { tipc };
