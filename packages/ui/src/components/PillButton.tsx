import { splitProps, type JSX } from "solid-js";
import { cn } from "../lib/cn";

export interface PillButtonProps
  extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "class"> {
  readonly class?: string;
  readonly pressed?: boolean;
}

export function PillButton(props: PillButtonProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "children",
    "class",
    "pressed",
    "type",
  ]);

  return (
    <button
      {...rest}
      aria-pressed={
        local.pressed === undefined
          ? undefined
          : local.pressed
            ? "true"
            : "false"
      }
      class={cn(
        "pill-button",
        local.pressed && "pill-button--pressed",
        local.class,
      )}
      type={local.type ?? "button"}
    >
      {local.children}
    </button>
  );
}
