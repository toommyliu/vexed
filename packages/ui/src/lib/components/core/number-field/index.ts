import Root from "./number-field.svelte";
import Group from "./number-field-group.svelte";
import Input from "./number-field-input.svelte";
import Increment from "./number-field-increment.svelte";
import Decrement from "./number-field-decrement.svelte";

export {
  Root,
  Group,
  Input,
  Increment,
  Decrement,
  //
  Root as NumberField,
  Group as NumberFieldGroup,
  Input as NumberFieldInput,
  Increment as NumberFieldIncrement,
  Decrement as NumberFieldDecrement,
};

export type { NumberFieldContext, NumberFieldSize } from "./context.js";
