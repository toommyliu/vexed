import {
  Combobox as ComboboxPrimitive,
  createListCollection,
  type CollectionItem,
} from "@ark-ui/solid/combobox";
import { Check, ChevronsUpDown, X } from "lucide-solid";
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  splitProps,
  useContext,
  type JSX,
} from "solid-js";
import { Portal } from "solid-js/web";
import { cn } from "../lib/cn";

export interface ComboboxOption extends CollectionItem {
  readonly disabled?: boolean;
  readonly label: string;
  readonly value: string;
}

interface ComboboxContextValue {
  readonly registerItem: (item: ComboboxOption) => void;
  readonly unregisterItem: (value: string) => void;
}

const ComboboxItemsContext = createContext<ComboboxContextValue>();

export interface ComboboxProps
  extends Omit<
    Parameters<typeof ComboboxPrimitive.Root<ComboboxOption>>[0],
    "collection"
  > {
  readonly items?: ReadonlyArray<ComboboxOption>;
}

export function Combobox(props: ComboboxProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "children",
    "class",
    "items",
    "positioning",
  ]);
  const [registeredItems, setRegisteredItems] = createSignal<ComboboxOption[]>([
    ...(local.items ?? []),
  ]);
  const collection = createMemo(() =>
    createListCollection<ComboboxOption>({ items: registeredItems() }),
  );
  const context: ComboboxContextValue = {
    registerItem(item) {
      setRegisteredItems((items) => {
        const next = items.filter(
          (candidate) => candidate.value !== item.value,
        );
        return [...next, item];
      });
    },
    unregisterItem(value) {
      setRegisteredItems((items) =>
        items.filter((candidate) => candidate.value !== value),
      );
    },
  };

  return (
    <ComboboxItemsContext.Provider value={context}>
      <ComboboxPrimitive.Root
        {...rest}
        class={cn("combobox", local.class)}
        collection={collection()}
        data-slot="combobox"
        positioning={
          local.positioning ?? { fitViewport: true, sameWidth: true }
        }
      >
        {local.children}
      </ComboboxPrimitive.Root>
    </ComboboxItemsContext.Provider>
  );
}

export interface ComboboxInputProps
  extends Omit<
    Parameters<typeof ComboboxPrimitive.Input>[0],
    "class" | "size"
  > {
  readonly class?: string;
  readonly clearProps?: ComboboxClearProps;
  readonly showClear?: boolean;
  readonly showTrigger?: boolean;
  readonly size?: "sm" | "default" | "lg";
  readonly triggerProps?: ComboboxTriggerProps;
}

export function ComboboxInput(props: ComboboxInputProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "class",
    "clearProps",
    "showClear",
    "showTrigger",
    "size",
    "triggerProps",
  ]);
  const size = () => local.size ?? "default";
  return (
    <ComboboxPrimitive.Context>
      {(context) => {
        const hasSelection = () =>
          context().value.some((value) => value.trim().length > 0) &&
          context().selectedItems.length > 0;
        const showClear = () => local.showClear !== false && hasSelection();
        return (
          <ComboboxPrimitive.Control
            class={cn("combobox__control", `combobox__control--${size()}`)}
            data-slot="combobox-control"
          >
            <ComboboxPrimitive.Input
              {...rest}
              class={cn("combobox__input", local.class)}
              data-slot="combobox-input"
            />
            {showClear() && (
              <ComboboxClear class="combobox__clear" {...local.clearProps}>
                <X />
              </ComboboxClear>
            )}
            {local.showTrigger !== false && !hasSelection() && (
              <ComboboxTrigger
                class="combobox__trigger"
                {...local.triggerProps}
              >
                <ChevronsUpDown />
              </ComboboxTrigger>
            )}
          </ComboboxPrimitive.Control>
        );
      }}
    </ComboboxPrimitive.Context>
  );
}

export type ComboboxTriggerProps = Parameters<
  typeof ComboboxPrimitive.Trigger
>[0];

export function ComboboxTrigger(props: ComboboxTriggerProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <ComboboxPrimitive.Trigger
      {...rest}
      class={cn("combobox__trigger", local.class)}
      data-slot="combobox-trigger"
    />
  );
}

export interface ComboboxContentProps
  extends Omit<Parameters<typeof ComboboxPrimitive.Content>[0], "class"> {
  readonly class?: string;
}

export function ComboboxContent(props: ComboboxContentProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children", "class"]);
  return (
    <Portal>
      <ComboboxPrimitive.Positioner
        class="combobox__positioner"
        data-slot="combobox-positioner"
      >
        <ComboboxPrimitive.Content
          {...rest}
          class={cn("combobox__content", local.class)}
          data-slot="combobox-content"
        >
          {local.children}
        </ComboboxPrimitive.Content>
      </ComboboxPrimitive.Positioner>
    </Portal>
  );
}

export type ComboboxListProps = Parameters<typeof ComboboxPrimitive.List>[0];

export function ComboboxList(props: ComboboxListProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <ComboboxPrimitive.List
      {...rest}
      class={cn("combobox__list", local.class)}
      data-slot="combobox-list"
    />
  );
}

export interface ComboboxItemProps
  extends Omit<Parameters<typeof ComboboxPrimitive.Item>[0], "class" | "item"> {
  readonly class?: string;
  readonly disabled?: boolean;
  readonly item?: ComboboxOption;
  readonly label?: string;
  readonly value: string;
}

export function ComboboxItem(props: ComboboxItemProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "children",
    "class",
    "disabled",
    "item",
    "label",
    "value",
  ]);
  const context = useContext(ComboboxItemsContext);
  const item = createMemo<ComboboxOption>(() => ({
    label: local.item?.label ?? local.label ?? local.value,
    value: local.item?.value ?? local.value,
    ...(local.disabled === undefined ? {} : { disabled: local.disabled }),
  }));

  createEffect(() => {
    const registeredItem = item();

    context?.registerItem(registeredItem);
    onCleanup(() => context?.unregisterItem(registeredItem.value));
  });

  return (
    <ComboboxPrimitive.Item
      {...rest}
      class={cn("combobox__item", local.class)}
      data-slot="combobox-item"
      data-value={item().value}
      item={item()}
    >
      <ComboboxPrimitive.ItemIndicator class="combobox__item-indicator">
        <Check />
      </ComboboxPrimitive.ItemIndicator>
      <ComboboxPrimitive.ItemText class="combobox__item-text">
        {local.children ?? item().label}
      </ComboboxPrimitive.ItemText>
    </ComboboxPrimitive.Item>
  );
}

export type ComboboxGroupProps = Parameters<
  typeof ComboboxPrimitive.ItemGroup
>[0];

export function ComboboxGroup(props: ComboboxGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <ComboboxPrimitive.ItemGroup
      {...rest}
      class={cn("combobox__group", local.class)}
      data-slot="combobox-group"
    />
  );
}

export type ComboboxGroupLabelProps = Parameters<
  typeof ComboboxPrimitive.ItemGroupLabel
>[0];

export function ComboboxGroupLabel(
  props: ComboboxGroupLabelProps,
): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <ComboboxPrimitive.ItemGroupLabel
      {...rest}
      class={cn("combobox__group-label", local.class)}
      data-slot="combobox-group-label"
    />
  );
}

export interface ComboboxSeparatorProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class"> {
  readonly class?: string;
}

export function ComboboxSeparator(props: ComboboxSeparatorProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      {...rest}
      class={cn("combobox__separator", local.class)}
      data-slot="combobox-separator"
      role="separator"
    />
  );
}

export type ComboboxEmptyProps = Parameters<typeof ComboboxPrimitive.Empty>[0];

export function ComboboxEmpty(props: ComboboxEmptyProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <ComboboxPrimitive.Empty
      {...rest}
      class={cn("combobox__empty", local.class)}
      data-slot="combobox-empty"
    />
  );
}

export interface ComboboxValueProps
  extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, "class"> {
  readonly class?: string;
}

export function ComboboxValue(props: ComboboxValueProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <span
      {...rest}
      class={cn("combobox__value", local.class)}
      data-slot="combobox-value"
    />
  );
}

export type ComboboxClearProps = Parameters<
  typeof ComboboxPrimitive.ClearTrigger
>[0];

export function ComboboxClear(props: ComboboxClearProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <ComboboxPrimitive.ClearTrigger
      {...rest}
      class={cn("combobox__clear", local.class)}
      data-slot="combobox-clear"
    />
  );
}
