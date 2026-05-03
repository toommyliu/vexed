import { Menu as MenuPrimitive } from "@ark-ui/solid/menu";
import { Check, ChevronRight } from "lucide-solid";
import { splitProps, type JSX } from "solid-js";
import { Portal } from "solid-js/web";
import { cn } from "../lib/cn";

export type MenuProps = Parameters<typeof MenuPrimitive.Root>[0];

export function Menu(props: MenuProps): JSX.Element {
  const [local, rest] = splitProps(props, ["positioning"]);
  return (
    <MenuPrimitive.Root
      positioning={local.positioning ?? { gutter: 4 }}
      {...rest}
    />
  );
}

export type MenuTriggerProps = Parameters<typeof MenuPrimitive.Trigger>[0];

export function MenuTrigger(props: MenuTriggerProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <MenuPrimitive.Trigger
      {...rest}
      class={cn(local.class)}
      data-slot="menu-trigger"
    />
  );
}

export interface MenuContentProps
  extends Omit<Parameters<typeof MenuPrimitive.Content>[0], "class"> {
  readonly class?: string;
  readonly portal?: boolean;
}

export function MenuContent(props: MenuContentProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children", "class", "portal"]);
  const content = () => (
    <MenuPrimitive.Positioner
      class="menu__positioner"
      data-slot="menu-positioner"
    >
      <MenuPrimitive.Content
        {...rest}
        class={cn("menu__content", local.class)}
        data-slot="menu-content"
      >
        <div class="menu__viewport" data-slot="menu-viewport">
          {local.children}
        </div>
      </MenuPrimitive.Content>
    </MenuPrimitive.Positioner>
  );

  return local.portal === false ? content() : <Portal>{content()}</Portal>;
}

export interface MenuItemProps
  extends Omit<Parameters<typeof MenuPrimitive.Item>[0], "class"> {
  readonly class?: string;
  readonly inset?: boolean;
  readonly variant?: "default" | "destructive";
}

export function MenuItem(props: MenuItemProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "class",
    "inset",
    "onClick",
    "onSelect",
    "value",
    "variant",
  ]);
  let handledPrimitiveSelect = false;
  return (
    <MenuPrimitive.Item
      {...rest}
      onClick={(event) => {
        if (typeof local.onClick === "function") {
          (local.onClick as JSX.EventHandler<HTMLDivElement, MouseEvent>)(
            event,
          );
        }
        if (!handledPrimitiveSelect) local.onSelect?.();
      }}
      onSelect={() => {
        handledPrimitiveSelect = true;
        queueMicrotask(() => {
          handledPrimitiveSelect = false;
        });
        local.onSelect?.();
      }}
      value={local.value}
      class={cn("menu__item", local.inset && "menu__item--inset", local.class)}
      data-inset={local.inset ? "" : undefined}
      data-slot="menu-item"
      data-value={local.value}
      data-variant={local.variant ?? "default"}
    />
  );
}

export interface MenuLabelProps
  extends Omit<Parameters<typeof MenuPrimitive.ItemGroupLabel>[0], "class"> {
  readonly class?: string;
  readonly inset?: boolean;
}

export function MenuLabel(props: MenuLabelProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class", "inset"]);
  return (
    <MenuPrimitive.ItemGroupLabel
      {...rest}
      class={cn(
        "menu__label",
        local.inset && "menu__label--inset",
        local.class,
      )}
      data-inset={local.inset ? "" : undefined}
      data-slot="menu-label"
    />
  );
}

export type MenuGroupProps = Parameters<typeof MenuPrimitive.ItemGroup>[0];

export function MenuGroup(props: MenuGroupProps): JSX.Element {
  return <MenuPrimitive.ItemGroup data-slot="menu-group" {...props} />;
}

export type MenuSeparatorProps = Parameters<typeof MenuPrimitive.Separator>[0];

export function MenuSeparator(props: MenuSeparatorProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <MenuPrimitive.Separator
      {...rest}
      class={cn("menu__separator", local.class)}
      data-slot="menu-separator"
    />
  );
}

export type MenuShortcutProps = Omit<
  JSX.HTMLAttributes<HTMLElement>,
  "class"
> & {
  readonly class?: string;
};

export function MenuShortcut(props: MenuShortcutProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <kbd
      {...rest}
      class={cn("menu__shortcut", local.class)}
      data-slot="menu-shortcut"
    />
  );
}

export interface MenuCheckboxItemProps
  extends Omit<Parameters<typeof MenuPrimitive.CheckboxItem>[0], "class"> {
  readonly class?: string;
}

export function MenuCheckboxItem(props: MenuCheckboxItemProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children", "class"]);
  return (
    <MenuPrimitive.CheckboxItem
      {...rest}
      class={cn("menu__item", "menu__option-item", local.class)}
      data-slot="menu-checkbox-item"
    >
      <MenuPrimitive.ItemIndicator class="menu__item-indicator">
        <Check />
      </MenuPrimitive.ItemIndicator>
      <MenuPrimitive.ItemText class="menu__item-text">
        {local.children}
      </MenuPrimitive.ItemText>
    </MenuPrimitive.CheckboxItem>
  );
}

export type MenuRadioGroupProps = Parameters<
  typeof MenuPrimitive.RadioItemGroup
>[0];

export function MenuRadioGroup(props: MenuRadioGroupProps): JSX.Element {
  return (
    <MenuPrimitive.RadioItemGroup data-slot="menu-radio-group" {...props} />
  );
}

export interface MenuRadioItemProps
  extends Omit<Parameters<typeof MenuPrimitive.RadioItem>[0], "class"> {
  readonly class?: string;
}

export function MenuRadioItem(props: MenuRadioItemProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children", "class"]);
  return (
    <MenuPrimitive.RadioItem
      {...rest}
      class={cn("menu__item", "menu__option-item", local.class)}
      data-slot="menu-radio-item"
    >
      <MenuPrimitive.ItemIndicator class="menu__item-indicator">
        <Check />
      </MenuPrimitive.ItemIndicator>
      <MenuPrimitive.ItemText class="menu__item-text">
        {local.children}
      </MenuPrimitive.ItemText>
    </MenuPrimitive.RadioItem>
  );
}

export type MenuSubProps = MenuProps;

export function MenuSub(props: MenuSubProps): JSX.Element {
  return <Menu {...props} />;
}

export interface MenuSubTriggerProps
  extends Omit<Parameters<typeof MenuPrimitive.TriggerItem>[0], "class"> {
  readonly class?: string;
  readonly inset?: boolean;
  readonly value?: string;
}

export function MenuSubTrigger(props: MenuSubTriggerProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "children",
    "class",
    "inset",
    "value",
  ]);
  return (
    <MenuPrimitive.TriggerItem
      {...rest}
      class={cn(
        "menu__item",
        "menu__sub-trigger",
        local.inset && "menu__item--inset",
        local.class,
      )}
      data-inset={local.inset ? "" : undefined}
      data-slot="menu-sub-trigger"
      data-value={local.value}
    >
      {local.children}
      <ChevronRight class="menu__sub-icon" />
    </MenuPrimitive.TriggerItem>
  );
}

export type MenuSubContentProps = MenuContentProps;

export function MenuSubContent(props: MenuSubContentProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return <MenuContent {...rest} class={cn("menu__sub-content", local.class)} />;
}
