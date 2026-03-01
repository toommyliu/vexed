import { getContext, setContext } from "svelte";

export interface DialogContext {
  open: () => boolean;
  setOpen: (v: boolean) => void;
  close: () => void;
  contentId: () => string;
  titleId: () => string;
  descriptionId: () => string;
}

const KEY = Symbol("dialog");

export function createDialogContext(ctx: DialogContext) {
  setContext(KEY, ctx);
}

export function getDialogContext(): DialogContext {
  return getContext<DialogContext>(KEY);
}
