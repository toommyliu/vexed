import { getContext, setContext } from "svelte";

const KEY = Symbol("number-field");

export type NumberFieldSize = "sm" | "default" | "lg";

export type NumberFieldContext = {
  value: number;
  min?: number;
  max?: number;
  step: number;
  size: NumberFieldSize;
  disabled: boolean;
  increment: () => void;
  decrement: () => void;
  setValue: (v: number) => void;
};

export function setNumberFieldContext(ctx: NumberFieldContext): void {
  setContext(KEY, ctx);
}

export function getNumberFieldContext(): NumberFieldContext {
  const ctx = getContext<NumberFieldContext>(KEY);
  if (!ctx) {
    throw new Error("NumberField sub-components must be used inside <NumberField.Root>");
  }
  return ctx;
}
