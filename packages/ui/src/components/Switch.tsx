import { splitProps, type JSX } from "solid-js";
import { cn } from "../lib/cn";
import { isAriaInvalid } from "../lib/domState";

export type SwitchSize = "sm" | "default" | "lg";

export interface SwitchProps
  extends Omit<
    JSX.InputHTMLAttributes<HTMLInputElement>,
    "class" | "size" | "type"
  > {
  readonly class?: string;
  readonly invalid?: boolean;
  readonly size?: SwitchSize;
}

export function Switch(props: SwitchProps): JSX.Element {
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
    size() === "default" ? "switch--size-default" : `switch--${size()}`;
  const invalid = () =>
    Boolean(local.invalid || isAriaInvalid(local["aria-invalid"]));

  return (
    <label
      class={cn(
        "switch",
        sizeClass(),
        invalid() && "switch--invalid",
        local.disabled && "switch--disabled",
        local.class,
      )}
      data-slot="switch"
    >
      <input
        {...rest}
        aria-invalid={invalid() ? "true" : local["aria-invalid"]}
        class="switch__input"
        disabled={local.disabled}
        role="switch"
        type="checkbox"
      />
      <span aria-hidden="true" class="switch__track">
        <span class="switch__thumb" />
      </span>
      {local.children && <span class="switch__label">{local.children}</span>}
    </label>
  );
}
