import { splitProps, type JSX } from "solid-js";
import { cn } from "../lib/cn";
import { isAriaInvalid } from "../lib/domState";

export interface SwitchProps
  extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "class" | "type"> {
  readonly class?: string;
  readonly invalid?: boolean;
}

export function Switch(props: SwitchProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "aria-invalid",
    "children",
    "class",
    "disabled",
    "invalid",
  ]);
  const invalid = () =>
    Boolean(local.invalid || isAriaInvalid(local["aria-invalid"]));

  return (
    <label
      class={cn(
        "switch",
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
