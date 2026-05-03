import { splitProps, type JSX } from "solid-js";
import { cn } from "../lib/cn";
import { isAriaInvalid } from "../lib/domState";

export interface TextareaProps
  extends Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, "class"> {
  readonly class?: string;
  readonly fullWidth?: boolean;
  readonly invalid?: boolean;
  readonly size?: "sm" | "default" | "lg";
  readonly unstyled?: boolean;
}

export function Textarea(props: TextareaProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "aria-invalid",
    "class",
    "fullWidth",
    "invalid",
    "size",
    "unstyled",
  ]);
  const size = () => local.size ?? "default";
  const invalid = () =>
    Boolean(local.invalid || isAriaInvalid(local["aria-invalid"]));

  return (
    <span
      class={cn(
        !local.unstyled && "textarea-control",
        !local.unstyled && `textarea-control--${size()}`,
        local.fullWidth && "textarea-control--full-width",
        invalid() && "textarea-control--invalid",
      )}
      data-size={size()}
      data-slot="textarea-control"
    >
      <textarea
        {...rest}
        aria-invalid={invalid() ? "true" : local["aria-invalid"]}
        class={cn(
          "textarea",
          `textarea--${size()}`,
          local.fullWidth && "textarea--full-width",
          invalid() && "textarea--invalid",
          local.unstyled && "textarea--unstyled",
          local.class,
        )}
        data-slot="textarea"
      />
    </span>
  );
}
