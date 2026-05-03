import { splitProps, type JSX } from "solid-js";
import { Check } from "lucide-solid";
import { cn } from "../lib/cn";
import { isAriaInvalid } from "../lib/domState";

export interface CheckboxProps
  extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "class" | "type"> {
  readonly class?: string;
  readonly invalid?: boolean;
}

export function Checkbox(props: CheckboxProps): JSX.Element {
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
        "checkbox",
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
        <Check class="checkbox__icon" />
      </span>
      {local.children && <span class="checkbox__label">{local.children}</span>}
    </label>
  );
}
