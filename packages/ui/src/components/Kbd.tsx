import { splitProps, type JSX } from "solid-js";
import { cn } from "../lib/cn";

export interface KbdProps
  extends Omit<JSX.HTMLAttributes<HTMLElement>, "class"> {
  readonly class?: string;
}

export function Kbd(props: KbdProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <kbd {...rest} class={cn("kbd", local.class)} data-slot="kbd" />
  );
}

export interface KbdGroupProps
  extends Omit<JSX.HTMLAttributes<HTMLElement>, "class"> {
  readonly class?: string;
}

export function KbdGroup(props: KbdGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <kbd
      {...rest}
      class={cn("kbd-group", local.class)}
      data-slot="kbd-group"
    />
  );
}
