import { Show, type JSX } from "solid-js";
import { cn } from "../lib/cn";
import { Label } from "./Label";

export interface FieldProps {
  readonly children: JSX.Element;
  readonly class?: string;
  readonly contentClass?: string;
  readonly error?: boolean;
  readonly for?: string;
  readonly label: JSX.Element;
  readonly optional?: boolean;
  readonly optionalLabel?: string;
}

export function Field(props: FieldProps): JSX.Element {
  return (
    <div class={cn("form-field", props.class)}>
      <Label for={props.for}>
        {props.label}
        <Show when={props.optional}>
          <span class="form-field__optional">
            {props.optionalLabel ?? "Optional"}
          </span>
        </Show>
      </Label>
      <div
        class={props.contentClass}
        data-invalid={props.error ? "" : undefined}
      >
        {props.children}
      </div>
    </div>
  );
}
