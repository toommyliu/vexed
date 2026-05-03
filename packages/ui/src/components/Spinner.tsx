import { splitProps, type JSX } from "solid-js";
import { cn } from "../lib/cn";

export interface SpinnerProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  readonly size?: "sm" | "md" | "lg";
}

export function Spinner(props: SpinnerProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class", "size"]);
  const size = () => local.size ?? "md";

  return (
    <span
      {...rest}
      aria-hidden={rest["aria-hidden"] ?? "true"}
      class={cn("spinner", `spinner--${size()}`, local.class)}
      data-slot="spinner"
    />
  );
}
