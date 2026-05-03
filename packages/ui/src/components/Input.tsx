import { splitProps, type JSX } from "solid-js";
import { cn } from "../lib/cn";
import { isAriaInvalid } from "../lib/domState";

export interface InputProps
  extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "class" | "size"> {
  readonly class?: string;
  readonly fullWidth?: boolean;
  readonly invalid?: boolean;
  readonly size?: "sm" | "default" | "lg";
  readonly unstyled?: boolean;
}

export function Input(props: InputProps): JSX.Element {
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
    <input
      {...rest}
      aria-invalid={invalid() ? "true" : local["aria-invalid"]}
      class={cn(
        !local.unstyled && "input",
        !local.unstyled && `input--${size()}`,
        local.unstyled && "input--unstyled",
        local.fullWidth && "input--full-width",
        invalid() && "input--invalid",
        local.class,
      )}
      data-size={size()}
      data-slot="input"
    />
  );
}
