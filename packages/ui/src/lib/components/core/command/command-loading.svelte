<script lang="ts">
  import { cn } from "$lib/utils";
  import {
    generateId,
    ATTR_LOADING,
    type CommandLoadingProps,
  } from "./command-state.svelte.js";

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
  class={cn("flex items-center justify-center py-6 text-sm text-muted-foreground", className)}
  {...restProps}
>
  {#if children}
    {@render children?.()}
  {:else}
    <svg
      class="size-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    <span class="ml-2">Loading...</span>
  {/if}
</div>
