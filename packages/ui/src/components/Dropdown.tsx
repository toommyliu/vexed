import { splitProps, type JSX } from "solid-js";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxList,
  type ComboboxProps,
} from "./Combobox";
import { cn } from "../lib/cn";

type ComboboxRootProps = ComboboxProps;

export interface DropdownProps
  extends Omit<
    ComboboxRootProps,
    "class" | "multiple" | "onOpenChange" | "onValueChange" | "value"
  > {
  readonly class?: string;
  readonly inputClass?: string;
  readonly open?: boolean;
  readonly placeholder?: string;
  readonly size?: "sm" | "default" | "lg";
  readonly value?: string;
  readonly onOpenChange?: (open: boolean) => void;
  readonly onValueChange?: (value: string) => void;
}

export function Dropdown(props: DropdownProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "children",
    "class",
    "inputClass",
    "onOpenChange",
    "onValueChange",
    "open",
    "placeholder",
    "size",
    "value",
  ]);
  const value = () => {
    const current = local.value;
    return current && current.length > 0 ? [current] : [];
  };
  let handledPrimitiveValueChange = false;

  return (
    <Combobox
      {...rest}
      class={cn("dropdown", local.class)}
      inputBehavior="none"
      open={local.open}
      openOnClick
      onOpenChange={(details) => local.onOpenChange?.(details.open)}
      onValueChange={(details) => {
        handledPrimitiveValueChange = true;
        queueMicrotask(() => {
          handledPrimitiveValueChange = false;
        });
        local.onValueChange?.(details.value[0] ?? "");
      }}
      value={local.value === undefined ? undefined : value()}
    >
      <ComboboxInput
        class={cn("dropdown__input", local.inputClass)}
        placeholder={local.placeholder ?? "Select an option"}
        readOnly
        showClear={false}
        showTrigger
        size={local.size ?? "default"}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          if (event.key === " ") event.preventDefault();

          const highlighted = document.querySelector<HTMLElement>(
            '[data-highlighted][data-slot="combobox-item"]',
          );
          if (highlighted && local.open) {
            highlighted.click();
          }
        }}
      />
      <ComboboxContent>
        <ComboboxList
          onClick={(event) => {
            if (handledPrimitiveValueChange) return;
            const item = (event.target as HTMLElement).closest<HTMLElement>(
              "[data-slot='combobox-item']",
            );
            const nextValue = item?.getAttribute("data-value");
            if (nextValue !== null && nextValue !== undefined) {
              local.onValueChange?.(nextValue);
            }
          }}
        >
          {local.children}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
