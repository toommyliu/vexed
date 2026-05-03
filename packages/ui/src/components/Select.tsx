import {
  createListCollection,
  Select as SelectPrimitive,
  type CollectionItem,
} from "@ark-ui/solid/select";
import { Check, ChevronsUpDown } from "lucide-solid";
import {
  createContext,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  splitProps,
  useContext,
  type JSX,
} from "solid-js";
import { Portal } from "solid-js/web";
import { cn } from "../lib/cn";

export interface SelectOption extends CollectionItem {
  readonly disabled?: boolean;
  readonly label: string;
  readonly value: string;
}

interface SelectContextValue {
  readonly registerItem: (item: SelectOption) => void;
  readonly unregisterItem: (value: string) => void;
}

const SelectItemsContext = createContext<SelectContextValue>();

export interface SelectProps
  extends Omit<Parameters<typeof SelectPrimitive.Root<SelectOption>>[0], "collection"> {
  readonly items?: ReadonlyArray<SelectOption>;
}

export function Select(props: SelectProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "children",
    "class",
    "items",
    "positioning",
  ]);
  const [registeredItems, setRegisteredItems] = createSignal<SelectOption[]>(
    [...(local.items ?? [])],
  );
  const collection = createMemo(() =>
    createListCollection<SelectOption>({ items: registeredItems() }),
  );
  const context: SelectContextValue = {
    registerItem(item) {
      setRegisteredItems((items) => {
        const next = items.filter((candidate) => candidate.value !== item.value);
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
    <SelectItemsContext.Provider value={context}>
      <SelectPrimitive.Root
        {...rest}
        class={cn("select", local.class)}
        collection={collection()}
        data-slot="select"
        positioning={local.positioning ?? { fitViewport: true, sameWidth: true }}
      >
        {local.children}
      </SelectPrimitive.Root>
    </SelectItemsContext.Provider>
  );
}

export interface SelectButtonProps
  extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "class" | "size"> {
  readonly class?: string;
  readonly size?: "sm" | "default" | "lg";
}

export function SelectButton(props: SelectButtonProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children", "class", "size"]);
  const size = () => local.size ?? "default";
  return (
    <button
      {...rest}
      class={cn(
        "select__trigger",
        `select__trigger--${size()}`,
        local.class,
      )}
      data-slot="select-button"
      type={rest.type ?? "button"}
    >
      <span class="select__value">{local.children}</span>
      <ChevronsUpDown class="select__icon" />
    </button>
  );
}

export interface SelectTriggerProps
  extends Omit<Parameters<typeof SelectPrimitive.Trigger>[0], "class"> {
  readonly class?: string;
  readonly size?: "sm" | "default" | "lg";
}

export function SelectTrigger(props: SelectTriggerProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children", "class", "size"]);
  const size = () => local.size ?? "default";
  return (
    <SelectPrimitive.Trigger
      {...rest}
      class={cn(
        "select__trigger",
        `select__trigger--${size()}`,
        local.class,
      )}
      data-slot="select-trigger"
    >
      {local.children}
      <ChevronsUpDown class="select__icon" />
    </SelectPrimitive.Trigger>
  );
}

export interface SelectValueProps
  extends Omit<Parameters<typeof SelectPrimitive.ValueText>[0], "children"> {
  readonly placeholder?: string;
}

export function SelectValue(props: SelectValueProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class", "placeholder"]);
  return (
    <SelectPrimitive.Context>
      {(context) => {
        const label = () => {
          const selected = context().selectedItems?.[0] as
            | SelectOption
            | undefined;
          return selected?.label ?? context().valueAsString;
        };
        return (
          <SelectPrimitive.ValueText
            {...rest}
            class={cn("select__value", local.class)}
            data-placeholder={!label() ? "" : undefined}
            data-slot="select-value"
          >
            {label() || local.placeholder}
          </SelectPrimitive.ValueText>
        );
      }}
    </SelectPrimitive.Context>
  );
}

export interface SelectContentProps
  extends Omit<Parameters<typeof SelectPrimitive.Content>[0], "class"> {
  readonly class?: string;
}

export function SelectContent(props: SelectContentProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children", "class"]);
  return (
    <Portal>
      <SelectPrimitive.Positioner class="select__positioner" data-slot="select-positioner">
        <SelectPrimitive.Content
          {...rest}
          class={cn("select__content", local.class)}
          data-slot="select-content"
        >
          <SelectPrimitive.List class="select__list" data-slot="select-list">
            {local.children}
          </SelectPrimitive.List>
        </SelectPrimitive.Content>
      </SelectPrimitive.Positioner>
    </Portal>
  );
}

export interface SelectItemProps
  extends Omit<Parameters<typeof SelectPrimitive.Item>[0], "class" | "item"> {
  readonly class?: string;
  readonly disabled?: boolean;
  readonly item?: SelectOption;
  readonly label?: string;
  readonly value: string;
}

export function SelectItem(props: SelectItemProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "children",
    "class",
    "disabled",
    "item",
    "label",
    "value",
  ]);
  const context = useContext(SelectItemsContext);
  const item = createMemo<SelectOption>(() => ({
    label: local.item?.label ?? local.label ?? local.value,
    value: local.item?.value ?? local.value,
    ...(local.disabled === undefined ? {} : { disabled: local.disabled }),
  }));

  onMount(() => context?.registerItem(item()));
  onCleanup(() => context?.unregisterItem(item().value));

  return (
    <SelectPrimitive.Item
      {...rest}
      class={cn("select__item", local.class)}
      data-slot="select-item"
      item={item()}
    >
      <SelectPrimitive.ItemIndicator class="select__item-indicator">
        <Check />
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText class="select__item-text">
        {local.children ?? item().label}
      </SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export type SelectGroupProps = Parameters<typeof SelectPrimitive.ItemGroup>[0];

export function SelectGroup(props: SelectGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <SelectPrimitive.ItemGroup
      {...rest}
      class={cn("select__group", local.class)}
      data-slot="select-group"
    />
  );
}

export type SelectGroupLabelProps = Parameters<
  typeof SelectPrimitive.ItemGroupLabel
>[0];

export function SelectGroupLabel(props: SelectGroupLabelProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <SelectPrimitive.ItemGroupLabel
      {...rest}
      class={cn("select__group-label", local.class)}
      data-slot="select-group-label"
    />
  );
}

export type SelectLabelProps = Parameters<typeof SelectPrimitive.Label>[0];

export function SelectLabel(props: SelectLabelProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <SelectPrimitive.Label
      {...rest}
      class={cn("select__label", local.class)}
      data-slot="select-label"
    />
  );
}

export interface SelectSeparatorProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class"> {
  readonly class?: string;
}

export function SelectSeparator(props: SelectSeparatorProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      {...rest}
      class={cn("select__separator", local.class)}
      data-slot="select-separator"
      role="separator"
    />
  );
}
