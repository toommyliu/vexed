import { splitProps, type JSX } from "solid-js";
import { cn } from "../lib/cn";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "error"
  | "info"
  | "success"
  | "warning";

export type BadgeSize = "sm" | "default" | "lg";

export interface BadgeProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  readonly size?: BadgeSize;
  readonly variant?: BadgeVariant;
}

export function Badge(props: BadgeProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class", "size", "variant"]);
  const variant = () => local.variant ?? "default";
  const size = () => local.size ?? "default";
  const sizeClass = () =>
    size() === "default" ? "badge--size-default" : `badge--${size()}`;

  return (
    <span
      {...rest}
      class={cn("badge", `badge--${variant()}`, sizeClass(), local.class)}
      data-slot="badge"
    />
  );
}
