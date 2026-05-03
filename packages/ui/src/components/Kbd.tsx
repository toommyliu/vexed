import type { JSX } from "solid-js";
import { cn } from "../lib/cn";

export interface KbdProps extends JSX.HTMLAttributes<HTMLElement> {
  readonly class?: string;
}

export function Kbd(props: KbdProps): JSX.Element {
  return (
    <kbd {...props} class={cn("kbd", props.class)} data-slot="kbd">
      {props.children}
    </kbd>
  );
}
