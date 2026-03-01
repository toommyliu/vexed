<script lang="ts">
  import { cn } from "$lib/utils";
  import {
    generateId,
    ATTR_LOADING,
    type CommandLoadingProps,
  } from "./command-state.svelte.js";
  import Icon from "../icons/icon.svelte";

  let {
    ref = $bindable(null),
    class: className = undefined,
    progress = 0,
    children,
    ...restProps
  }: CommandLoadingProps = $props();

  const loadingId = generateId("cmd-loading");
</script>

<div
  bind:this={ref}
  id={loadingId}
  data-slot="command-loading"
  {...{ [ATTR_LOADING]: "" }}
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Loading..."
  class={cn(
    "flex items-center justify-center py-6 text-sm text-muted-foreground",
    className,
  )}
  {...restProps}
>
  {#if children}
    {@render children?.()}
  {:else}
    <Icon icon="loader" size="md" spin={true} />
    <span class="ml-2">Loading...</span>
  {/if}
</div>
