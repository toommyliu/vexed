import { createMemo, splitProps, type JSX } from "solid-js";
import { cn } from "../lib/cn";

export interface KbdProps
  extends Omit<JSX.HTMLAttributes<HTMLElement>, "class"> {
  readonly class?: string;
}

type ModifierKey = "command" | "shift" | "control" | "alt" | "option";

const modifierKeyAliases = new Map<string, ModifierKey>([
  ["⌘", "command"],
  ["cmd", "command"],
  ["command", "command"],
  ["meta", "command"],
  ["mod", "command"],
  ["⇧", "shift"],
  ["shift", "shift"],
  ["⌃", "control"],
  ["ctrl", "control"],
  ["control", "control"],
  ["alt", "alt"],
  ["⌥", "option"],
  ["option", "option"],
]);

const readModifierKey = (children: JSX.Element): ModifierKey | undefined => {
  if (typeof children !== "string") {
    return undefined;
  }

  return modifierKeyAliases.get(children.trim().toLowerCase());
};

const modifierKeyLabel = (key: ModifierKey): string => {
  switch (key) {
    case "command":
      return "Command";
    case "shift":
      return "Shift";
    case "control":
      return "Control";
    case "alt":
      return "Alt";
    case "option":
      return "Option";
  }
};

export function Kbd(props: KbdProps): JSX.Element {
  const [local, rest] = splitProps(props, ["aria-label", "children", "class"]);
  const modifierKey = createMemo(() => readModifierKey(local.children));
  const content = createMemo(() => {
    const key = modifierKey();
    return key === undefined ? (
      local.children
    ) : (
      <span aria-hidden="true" class="kbd__label">
        {local.children}
      </span>
    );
  });
  const label = createMemo(() => {
    const key = modifierKey();
    return key === undefined ? undefined : modifierKeyLabel(key);
  });

  return (
    <kbd
      {...rest}
      aria-label={local["aria-label"] ?? label()}
      class={cn("kbd", local.class)}
      data-key={modifierKey()}
      data-slot="kbd"
    >
      {content()}
    </kbd>
  );
}

export interface KbdGroupProps
  extends Omit<JSX.HTMLAttributes<HTMLElement>, "class"> {
  readonly class?: string;
}

export function KbdGroup(props: KbdGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <kbd {...rest} class={cn("kbd-group", local.class)} data-slot="kbd-group" />
  );
}
