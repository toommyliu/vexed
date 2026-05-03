import type { JSX } from "solid-js";
import { cn } from "../lib/cn";

export interface LabelProps extends JSX.LabelHTMLAttributes<HTMLLabelElement> {
  readonly class?: string;
}

export function Label(props: LabelProps): JSX.Element {
  return (
    <label {...props} class={cn("label", props.class)} data-slot="label">
      {props.children}
    </label>
  );
}
