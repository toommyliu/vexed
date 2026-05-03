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

export type BadgeElement = "span" | "button" | "a";

export interface BadgeProps
  extends Omit<JSX.HTMLAttributes<HTMLElement>, "class"> {
  readonly as?: BadgeElement;
  readonly size?: BadgeSize;
  readonly variant?: BadgeVariant;
  readonly class?: string;
  readonly disabled?: boolean;
  readonly href?: string;
  readonly type?: "button" | "submit" | "reset";
}

export function Badge(props: BadgeProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "as",
    "class",
    "disabled",
    "href",
    "size",
    "type",
    "variant",
  ]);
  const variant = () => local.variant ?? "default";
  const size = () => local.size ?? "default";
  const sizeClass = () =>
    size() === "default" ? "badge--size-default" : `badge--${size()}`;
  const className = () =>
    cn("badge", `badge--${variant()}`, sizeClass(), local.class);

  if (local.as === "button") {
    return (
      <button
        {...(rest as JSX.ButtonHTMLAttributes<HTMLButtonElement>)}
        class={className()}
        data-slot="badge"
        disabled={local.disabled}
        type={local.type ?? "button"}
      />
    );
  }

  if (local.as === "a") {
    return (
      <a
        {...(rest as JSX.AnchorHTMLAttributes<HTMLAnchorElement>)}
        aria-disabled={local.disabled ? "true" : undefined}
        class={className()}
        data-slot="badge"
        href={local.disabled ? undefined : local.href}
      />
    );
  }

  return (
    <span
      {...rest}
      class={className()}
      data-slot="badge"
    />
  );
}
