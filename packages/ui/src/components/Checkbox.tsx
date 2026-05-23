import { Icon } from "./Icon";
import { splitProps, type JSX } from "solid-js";
import { cn } from "../lib/cn";
import { isAriaInvalid } from "../lib/domState";

export type CheckboxSize = "sm" | "default" | "lg";

export interface CheckboxProps
  extends Omit<
    JSX.InputHTMLAttributes<HTMLInputElement>,
    "class" | "size" | "type"
  > {
  readonly class?: string;
  readonly invalid?: boolean;
  readonly size?: CheckboxSize;
}

export function Checkbox(props: CheckboxProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "aria-invalid",
    "children",
    "class",
    "disabled",
    "invalid",
    "size",
  ]);
  const size = () => local.size ?? "default";
  const sizeClass = () =>
    size() === "default" ? "checkbox--size-default" : `checkbox--${size()}`;
  const invalid = () =>
    Boolean(local.invalid || isAriaInvalid(local["aria-invalid"]));

  return (
    <label
      class={cn(
        "checkbox",
        sizeClass(),
        invalid() && "checkbox--invalid",
        local.disabled && "checkbox--disabled",
        local.class,
      )}
      data-slot="checkbox"
    >
      <input
        {...rest}
        aria-invalid={invalid() ? "true" : local["aria-invalid"]}
        class="checkbox__input"
        disabled={local.disabled}
        type="checkbox"
      />
      <span aria-hidden="true" class="checkbox__control">
        <Icon icon="check" class="checkbox__icon" />
      </span>
      {local.children && <span class="checkbox__label">{local.children}</span>}
    </label>
  );
}
