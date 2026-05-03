import { Search } from "lucide-solid";
import {
  createContext,
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
  splitProps,
  useContext,
  type Accessor,
  type JSX,
} from "solid-js";
import {
  Dialog,
  DialogContent,
  type DialogContentProps,
  type DialogProps,
} from "./Dialog";
import { Spinner } from "./Spinner";
import { cn } from "../lib/cn";
import { computeCommandScore } from "../lib/commandScore";

export type CommandFilterFn = (
  value: string,
  search: string,
  keywords?: ReadonlyArray<string>,
) => number;

interface CommandItemRecord {
  readonly disabled: boolean;
  readonly keywords: ReadonlyArray<string>;
  readonly value: string;
}

interface CommandContextValue {
  readonly filteredItems: Accessor<ReadonlyArray<CommandItemRecord>>;
  readonly registerItem: (item: CommandItemRecord) => void;
  readonly search: Accessor<string>;
  readonly selectValue: (value: string) => void;
  readonly selectedValue: Accessor<string>;
  readonly setSearch: (value: string) => void;
  readonly shouldFilter: Accessor<boolean>;
  readonly unregisterItem: (value: string) => void;
}

const CommandContext = createContext<CommandContextValue>();

function callEventHandler<EventType extends Event>(
  handler: unknown,
  event: EventType,
): void {
  if (typeof handler === "function") {
    handler(event);
  }
}

export interface CommandProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class" | "onChange"> {
  readonly class?: string;
  readonly defaultValue?: string;
  readonly filter?: CommandFilterFn;
  readonly loop?: boolean;
  readonly onValueChange?: (value: string) => void;
  readonly shouldFilter?: boolean;
  readonly value?: string;
}

export function Command(props: CommandProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "children",
    "class",
    "defaultValue",
    "filter",
    "loop",
    "onKeyDown",
    "onValueChange",
    "shouldFilter",
    "value",
  ]);
  const [items, setItems] = createSignal<CommandItemRecord[]>([]);
  const [search, setSearch] = createSignal("");
  const [internalValue, setInternalValue] = createSignal(local.defaultValue ?? "");
  const selectedValue = () => local.value ?? internalValue();
  const shouldFilter = () => local.shouldFilter !== false;
  const filter = () => local.filter ?? computeCommandScore;
  const filteredItems = createMemo(() => {
    const query = search();
    if (!shouldFilter() || !query) return items();
    return items()
      .map((item) => ({
        item,
        score: filter()(item.value, query, item.keywords),
      }))
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score)
      .map(({ item }) => item);
  });
  const selectValue = (value: string) => {
    if (value === selectedValue()) return;
    setInternalValue(value);
    local.onValueChange?.(value);
  };
  const context: CommandContextValue = {
    filteredItems,
    registerItem(item) {
      setItems((current) => {
        const next = current.filter((candidate) => candidate.value !== item.value);
        return [...next, item];
      });
    },
    search,
    selectValue,
    selectedValue,
    setSearch,
    shouldFilter,
    unregisterItem(value) {
      setItems((current) =>
        current.filter((candidate) => candidate.value !== value),
      );
    },
  };

  function moveSelection(offset: number): void {
    const candidates = filteredItems().filter((item) => !item.disabled);
    if (candidates.length === 0) return;
    const currentIndex = candidates.findIndex(
      (item) => item.value === selectedValue(),
    );
    const fallbackIndex = offset > 0 ? -1 : 0;
    let nextIndex = (currentIndex === -1 ? fallbackIndex : currentIndex) + offset;
    if (local.loop) {
      nextIndex = (nextIndex + candidates.length) % candidates.length;
    } else {
      nextIndex = Math.max(0, Math.min(nextIndex, candidates.length - 1));
    }
    selectValue(candidates[nextIndex]?.value ?? "");
  }

  function handleKeyDown(event: KeyboardEvent): void {
    callEventHandler(local.onKeyDown, event);
    if (event.defaultPrevented) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveSelection(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveSelection(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectValue(filteredItems().find((item) => !item.disabled)?.value ?? "");
    } else if (event.key === "End") {
      event.preventDefault();
      const enabled = filteredItems().filter((item) => !item.disabled);
      selectValue(enabled[enabled.length - 1]?.value ?? "");
    } else if (event.key === "Enter") {
      const target = document.querySelector<HTMLElement>(
        `[data-command-value="${CSS.escape(selectedValue())}"]`,
      );
      if (target) {
        event.preventDefault();
        target.click();
      }
    }
  }

  return (
    <CommandContext.Provider value={context}>
      <div
        {...rest}
        class={cn("command", local.class)}
        data-slot="command"
        onKeyDown={handleKeyDown}
      >
        {local.children}
      </div>
    </CommandContext.Provider>
  );
}

export interface CommandInputProps
  extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "class"> {
  readonly class?: string;
}

export function CommandInput(props: CommandInputProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class", "onInput"]);
  const context = useContext(CommandContext);
  return (
    <div class="command__input-wrap" data-slot="command-input-wrap">
      <Search class="command__input-icon" />
      <input
        {...rest}
        class={cn("command__input", local.class)}
        data-slot="command-input"
        onInput={(event) => {
          callEventHandler(local.onInput, event);
          context?.setSearch(event.currentTarget.value);
        }}
        value={context?.search() ?? rest.value}
      />
    </div>
  );
}

export interface CommandListProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class"> {
  readonly class?: string;
}

export function CommandList(props: CommandListProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      {...rest}
      class={cn("command__list", local.class)}
      data-slot="command-list"
      role="listbox"
    />
  );
}

export function CommandViewport(props: CommandListProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      {...rest}
      class={cn("command__viewport", local.class)}
      data-slot="command-viewport"
    />
  );
}

export interface CommandGroupProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class"> {
  readonly class?: string;
}

export function CommandGroup(props: CommandGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      {...rest}
      class={cn("command__group", local.class)}
      data-slot="command-group"
      role="group"
    />
  );
}

export function CommandGroupHeading(props: CommandGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      {...rest}
      class={cn("command__group-heading", local.class)}
      data-slot="command-group-heading"
    />
  );
}

export function CommandGroupItems(props: CommandGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      {...rest}
      class={cn("command__group-items", local.class)}
      data-slot="command-group-items"
    />
  );
}

export interface CommandItemProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class" | "onSelect"> {
  readonly class?: string;
  readonly disabled?: boolean;
  readonly forceMount?: boolean;
  readonly keywords?: ReadonlyArray<string>;
  readonly onSelect?: (value: string) => void;
  readonly value: string;
}

export function CommandItem(props: CommandItemProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "children",
    "class",
    "disabled",
    "forceMount",
    "keywords",
    "onClick",
    "onSelect",
    "value",
  ]);
  const context = useContext(CommandContext);
  const item = createMemo<CommandItemRecord>(() => ({
    disabled: Boolean(local.disabled),
    keywords: local.keywords ?? [],
    value: local.value,
  }));
  const visible = () =>
    Boolean(
      local.forceMount ||
        !context?.shouldFilter() ||
        context?.filteredItems().some((candidate) => candidate.value === local.value),
    );
  const selected = () => context?.selectedValue() === local.value;

  onMount(() => context?.registerItem(item()));
  onCleanup(() => context?.unregisterItem(local.value));

  return (
    <div
      {...rest}
      aria-disabled={local.disabled ? "true" : undefined}
      aria-selected={selected() ? "true" : "false"}
      class={cn("command__item", local.class)}
      data-command-value={local.value}
      data-disabled={local.disabled ? "" : undefined}
      data-selected={selected() ? "" : undefined}
      data-slot="command-item"
      onClick={(event) => {
        callEventHandler(local.onClick, event);
        if (event.defaultPrevented || local.disabled) return;
        context?.selectValue(local.value);
        local.onSelect?.(local.value);
      }}
      role="option"
      style={{ display: visible() ? undefined : "none" }}
      tabIndex={local.disabled ? undefined : -1}
    >
      {local.children}
    </div>
  );
}

export interface CommandLinkItemProps
  extends Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, "class" | "onSelect"> {
  readonly class?: string;
  readonly disabled?: boolean;
  readonly forceMount?: boolean;
  readonly keywords?: ReadonlyArray<string>;
  readonly onSelect?: (value: string) => void;
  readonly value: string;
}

export function CommandLinkItem(props: CommandLinkItemProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "children",
    "class",
    "disabled",
    "forceMount",
    "keywords",
    "onClick",
    "onSelect",
    "value",
  ]);
  const context = useContext(CommandContext);
  const visible = () =>
    Boolean(
      local.forceMount ||
        !context?.shouldFilter() ||
        context?.filteredItems().some((candidate) => candidate.value === local.value),
    );

  onMount(() =>
    context?.registerItem({
      disabled: Boolean(local.disabled),
      keywords: local.keywords ?? [],
      value: local.value,
    }),
  );
  onCleanup(() => context?.unregisterItem(local.value));

  return (
    <a
      {...rest}
      aria-disabled={local.disabled ? "true" : undefined}
      class={cn("command__item", "command__link-item", local.class)}
      data-command-value={local.value}
      data-disabled={local.disabled ? "" : undefined}
      data-selected={context?.selectedValue() === local.value ? "" : undefined}
      data-slot="command-link-item"
      onClick={(event) => {
        callEventHandler(local.onClick, event);
        if (event.defaultPrevented || local.disabled) return;
        context?.selectValue(local.value);
        local.onSelect?.(local.value);
      }}
      role="option"
      style={{ display: visible() ? undefined : "none" }}
      tabIndex={local.disabled ? undefined : -1}
    >
      {local.children}
    </a>
  );
}

export interface CommandEmptyProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class"> {
  readonly class?: string;
  readonly forceMount?: boolean;
}

export function CommandEmpty(props: CommandEmptyProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class", "forceMount"]);
  const context = useContext(CommandContext);
  return (
    <Show when={local.forceMount || context?.filteredItems().length === 0}>
      <div
        {...rest}
        class={cn("command__empty", local.class)}
        data-slot="command-empty"
      />
    </Show>
  );
}

export function CommandSeparator(props: CommandGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      {...rest}
      class={cn("command__separator", local.class)}
      data-slot="command-separator"
      role="separator"
    />
  );
}

export interface CommandLoadingProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class"> {
  readonly class?: string;
  readonly progress?: number;
}

export function CommandLoading(props: CommandLoadingProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children", "class", "progress"]);
  return (
    <div
      {...rest}
      aria-valuenow={local.progress}
      class={cn("command__loading", local.class)}
      data-slot="command-loading"
      role={local.progress === undefined ? "status" : "progressbar"}
    >
      <Spinner size="sm" />
      {local.children}
    </div>
  );
}

export interface CommandShortcutProps
  extends Omit<JSX.HTMLAttributes<HTMLElement>, "class"> {
  readonly class?: string;
}

export function CommandShortcut(props: CommandShortcutProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <kbd
      {...rest}
      class={cn("command__shortcut", local.class)}
      data-slot="command-shortcut"
    />
  );
}

export function CommandFooter(props: CommandGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      {...rest}
      class={cn("command__footer", local.class)}
      data-slot="command-footer"
    />
  );
}

export function CommandPanel(props: CommandGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div
      {...rest}
      class={cn("command__panel", local.class)}
      data-slot="command-panel"
    />
  );
}

export interface CommandDialogProps extends DialogProps {
  readonly contentProps?: DialogContentProps;
}

export function CommandDialog(props: CommandDialogProps): JSX.Element {
  const [local, rest] = splitProps(props, ["children", "contentProps"]);
  return (
    <Dialog {...rest}>
      <DialogContent
        showCloseButton={false}
        {...local.contentProps}
        class={cn("command-dialog", local.contentProps?.class)}
      >
        {local.children}
      </DialogContent>
    </Dialog>
  );
}

export function CommandState(props: {
  readonly children: (state: {
    readonly items: ReadonlyArray<CommandItemRecord>;
    readonly search: string;
    readonly value: string;
  }) => JSX.Element;
}): JSX.Element {
  const context = useContext(CommandContext);
  return (
    <For each={[context]}>
      {(ctx) =>
        props.children({
          items: ctx?.filteredItems() ?? [],
          search: ctx?.search() ?? "",
          value: ctx?.selectedValue() ?? "",
        })
      }
    </For>
  );
}
