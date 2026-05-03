import { splitProps, type JSX } from "solid-js";
import { cn } from "../lib/cn";
import { isAriaInvalid } from "../lib/domState";

export interface TextareaProps
  extends Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, "class"> {
  readonly class?: string;
  readonly fullWidth?: boolean;
  readonly invalid?: boolean;
  readonly size?: "sm" | "default" | "lg";
}

export function Textarea(props: TextareaProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "aria-invalid",
    "class",
    "fullWidth",
    "invalid",
    "size",
  ]);
  const size = () => local.size ?? "default";
  const invalid = () =>
    Boolean(local.invalid || isAriaInvalid(local["aria-invalid"]));

  return (
    <textarea
      {...rest}
      aria-invalid={invalid() ? "true" : local["aria-invalid"]}
      class={cn(
        "textarea",
        `textarea--${size()}`,
        local.fullWidth && "textarea--full-width",
        invalid() && "textarea--invalid",
        local.class,
      )}
      data-slot="textarea"
    />
  );
}
