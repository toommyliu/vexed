import { getContext, setContext } from "svelte";

const KEY = Symbol("input-group");

export type InputGroupContext = {
  hasTextarea: { value: boolean };
  hasBlockAddon: { value: boolean };
  disabled: { value: boolean };
};

export function setInputGroupContext(ctx: InputGroupContext): void {
  setContext(KEY, ctx);
}

export function getInputGroupContext(): InputGroupContext | undefined {
  return getContext<InputGroupContext>(KEY);
}
