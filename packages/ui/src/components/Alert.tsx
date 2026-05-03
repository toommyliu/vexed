import { splitProps, type JSX } from "solid-js";
import { cn } from "../lib/cn";

export type AlertVariant =
  | "default"
  | "error"
  | "info"
  | "success"
  | "warning";

export interface AlertProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class"> {
  readonly class?: string;
  readonly variant?: AlertVariant;
}

export function Alert(props: AlertProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class", "variant"]);
  return (
    <div
      {...rest}
      class={cn("alert", `alert--${local.variant ?? "default"}`, local.class)}
      data-slot="alert"
      role={rest.role ?? "alert"}
    />
  );
}

export interface AlertTitleProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class"> {
  readonly class?: string;
}

export function AlertTitle(props: AlertTitleProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      {...rest}
      class={cn("alert__title", local.class)}
      data-slot="alert-title"
    />
  );
}

export interface AlertDescriptionProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class"> {
  readonly class?: string;
}

export function AlertDescription(props: AlertDescriptionProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      {...rest}
      class={cn("alert__description", local.class)}
      data-slot="alert-description"
    />
  );
}

export interface AlertActionProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class"> {
  readonly class?: string;
}

export function AlertAction(props: AlertActionProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      {...rest}
      class={cn("alert__action", local.class)}
      data-slot="alert-action"
    />
  );
}
