<script lang="ts">
  import { cn } from "$lib/utils";
  import { onMount, untrack } from "svelte";
  import {
    CommandRootState,
    setCommandRootCtx,
    generateId,
    srOnlyStyles,
    ATTR_ROOT,
    ATTR_INPUT_LABEL,
    type CommandRootProps,
  } from "./command-state.svelte.js";

  let {
    ref = $bindable(null),
    value = $bindable(),
    class: className = undefined,
    label = "Command menu",
    shouldFilter = true,
    filter,
    loop = false,
    vimBindings = true,
    disablePointerSelection = false,
    disableInitialScroll = false,
    columns = null,
    onValueChange,
    onStateChange,
    children,
    ...restProps
  }: CommandRootProps = $props();

  const opts = {
    get value() {
      return value ?? "";
    },
    get shouldFilter() {
      return shouldFilter;
    },
    get filter() {
      return filter;
    },
    get loop() {
      return loop;
    },
    get vimBindings() {
      return vimBindings;
    },
    get disablePointerSelection() {
      return disablePointerSelection;
    },
    get disableInitialScroll() {
      return disableInitialScroll;
    },
    get columns() {
      return columns;
    },
    get label() {
      return label;
    },
    get onValueChange() {
      return onValueChange;
    },
    get onStateChange() {
      return onStateChange;
    },
  };

  const state = new CommandRootState(opts);
  setCommandRootCtx(state);

  const labelId = state.labelId;
  const inputLabelId = generateId("cmd-input-label");

  $effect(() => {
    state.shouldFilter = opts.shouldFilter;
  });
  $effect(() => {
    if (opts.filter) state.filterFn = opts.filter;
  });
  $effect(() => {
    state.loop = opts.loop;
  });
  $effect(() => {
    state.vimBindings = opts.vimBindings;
  });
  $effect(() => {
    state.disablePointerSelection = opts.disablePointerSelection;
  });
  $effect(() => {
    state.disableInitialScroll = opts.disableInitialScroll;
  });
  $effect(() => {
    state.columns = opts.columns;
  });
  $effect(() => {
    state.onValueChange = opts.onValueChange;
  });
  $effect(() => {
    state.onStateChange = opts.onStateChange;
  });

  $effect(() => {
    if (value !== undefined) {
      const currentState = untrack(() => state._state.value);
      if (value !== currentState) {
        state.setValue(value, true);
      }
    }
  });

  $effect(() => {
    const v = state._state.value;
    const currentValue = untrack(() => value);
    if (v !== currentValue) {
      value = v;
    }
  });
  $effect(() => {
    state.rootNode = ref;
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  bind:this={ref}
  data-slot="command"
  {...{ [ATTR_ROOT]: "" }}
  role="application"
  tabindex={-1}
  class={cn(
    "flex h-full w-full flex-col overflow-hidden rounded-xl text-foreground outline-none",
    className,
  )}
  onkeydown={state.onkeydown}
  {...restProps}
>
  <label
    bind:this={state.labelNode}
    id={inputLabelId}
    {...{ [ATTR_INPUT_LABEL]: "" }}
    for=""
    style={srOnlyStyles}
  >
    {label}
  </label>
  {@render children?.()}
</div>
