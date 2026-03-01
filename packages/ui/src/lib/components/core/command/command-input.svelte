<script lang="ts">
  import { cn } from "$lib/utils";
  import { Icon } from "$lib";
  import {
    getCommandRootCtx,
    generateId,
    ATTR_INPUT,
    type CommandInputProps,
  } from "./command-state.svelte.js";

  let {
    ref = $bindable(null),
    class: className = undefined,
    placeholder = "Search...",
    value,
    autofocus = false,
    ...restProps
  }: CommandInputProps = $props();

  const root = getCommandRootCtx();
  const inputId = generateId("cmd-input");

  function oninput(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    root.setState("search", v);
    if (typeof restProps.oninput === "function") {
      (restProps.oninput as (e: Event) => void)(e);
    }
  }

  $effect(() => {
    root.inputNode = ref;
  });

  $effect(() => {
    if (ref && autofocus) {
      setTimeout(() => ref?.focus(), 10);
    }
  });

  let selectedItemId = $derived.by(() => {
    if (!root.viewportNode) return undefined;
    const val = root.commandState.value;
    if (!val) return undefined;
    const item = root.viewportNode.querySelector(
      `[data-command-item][data-value="${CSS.escape(val)}"]`,
    );
    return item?.getAttribute("id") ?? undefined;
  });

  let inputValue = $derived(value ?? root.commandState.search);
</script>

<div
  data-slot="command-input-wrapper"
  class="flex items-center gap-2.5 border-b border-border px-3.5 py-2.5"
>
  <Icon icon="search" class="size-4 shrink-0 opacity-50" />
  <input
    bind:this={ref}
    id={inputId}
    data-slot="command-input"
    {...{ [ATTR_INPUT]: "" }}
    type="text"
    role="combobox"
    aria-expanded="true"
    aria-autocomplete="list"
    aria-controls={root.viewportNode?.id ?? undefined}
    aria-labelledby={root.labelNode?.id ?? undefined}
    aria-activedescendant={selectedItemId}
    autocomplete="off"
    autocorrect="off"
    spellcheck={false}
    value={inputValue}
    {placeholder}
    {oninput}
    class={cn(
      "flex h-8 w-full bg-transparent text-sm outline-none",
      "placeholder:text-muted-foreground",
      "disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...restProps}
  />
</div>
