<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { TooltipTrigger } from "@ark-ui/svelte/tooltip";

  interface TooltipTriggerProps extends HTMLButtonAttributes {
    ref?: HTMLButtonElement | null;
    class?: string;
    children?: Snippet;
    /**
     * Render-prop slot for a custom trigger element (composition pattern).
     * Ark UI handles the `asChild` prop internally; pass `asChild` when using `child`.
     */
    child?: Snippet<[{ props: Record<string, unknown> }]>;
  }

  let {
    ref = $bindable(null),
    class: className,
    child,
    children,
    disabled,
    ...restProps
  }: TooltipTriggerProps = $props();
</script>

{#if child}
  <TooltipTrigger>
    {#snippet asChild(propsFn)}
      {@const triggerProps = propsFn({
        class: className,
        disabled,
        ...restProps,
      })}
      {@render child({ props: { ...triggerProps, ref } })}
    {/snippet}
  </TooltipTrigger>
{:else}
  <TooltipTrigger
    bind:ref
    data-slot="tooltip-trigger"
    class={className}
    {disabled}
    {...restProps}
  >
    {@render children?.()}
  </TooltipTrigger>
{/if}
