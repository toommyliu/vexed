import type { JSX } from "solid-js";
import { cn } from "../lib/cn";

export interface VisuallyHiddenProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  readonly class?: string;
}

export function VisuallyHidden(props: VisuallyHiddenProps): JSX.Element {
  return (
    <span
      {...props}
      class={cn("visually-hidden", props.class)}
      data-slot="visually-hidden"
    >
      {props.children}
    </span>
  );
}
