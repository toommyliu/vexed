import { createMemo, splitProps, type JSX } from "solid-js";
import { cn } from "../lib/cn";

export interface KbdProps
  extends Omit<JSX.HTMLAttributes<HTMLElement>, "class"> {
  readonly class?: string;
}

type SymbolKey = "shift";

const readSymbolKey = (children: JSX.Element): SymbolKey | undefined =>
  typeof children === "string" && children.trim() === "⇧" ? "shift" : undefined;

const symbolKeyLabel = (key: SymbolKey): string => {
  switch (key) {
    case "shift":
      return "Shift";
  }
};

const renderSymbolKey = (key: SymbolKey): JSX.Element => {
  switch (key) {
    case "shift":
      return (
        <span aria-hidden="true" class="kbd__label">
          Shift
        </span>
      );
  }
};

export function Kbd(props: KbdProps): JSX.Element {
  const [local, rest] = splitProps(props, ["aria-label", "children", "class"]);
  const symbolKey = createMemo(() => readSymbolKey(local.children));
  const content = createMemo(() => {
    const key = symbolKey();
    return key === undefined ? local.children : renderSymbolKey(key);
  });
  const label = createMemo(() => {
    const key = symbolKey();
    return key === undefined ? undefined : symbolKeyLabel(key);
  });

  return (
    <kbd
      {...rest}
      aria-label={local["aria-label"] ?? label()}
      class={cn("kbd", local.class)}
      data-key={symbolKey()}
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
