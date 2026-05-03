import { splitProps, type JSX } from "solid-js";
import { cn } from "../lib/cn";
import { isAriaInvalid } from "../lib/domState";

export interface InputProps
  extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "class" | "size"> {
  readonly class?: string;
  readonly fullWidth?: boolean;
  readonly invalid?: boolean;
  readonly size?: "sm" | "default" | "lg";
}

export function Input(props: InputProps): JSX.Element {
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
    <input
      {...rest}
      aria-invalid={invalid() ? "true" : local["aria-invalid"]}
      class={cn(
        "input",
        `input--${size()}`,
        local.fullWidth && "input--full-width",
        invalid() && "input--invalid",
        local.class,
      )}
      data-slot="input"
    />
  );
}
