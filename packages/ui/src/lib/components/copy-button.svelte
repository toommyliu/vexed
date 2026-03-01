<script lang="ts">
  import { Button } from '$lib';
  import type { ButtonProps } from "$lib/components/core/button.svelte";
  import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "$lib/components/core/tooltip/";
  import { Icon } from "$lib/components/core/icons";
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";

  let {
    copy,
    children,
    ...restProps
  }: ButtonProps & {
    copy?: () => void | Promise<void>;
    children?: Snippet<[{ copied: boolean; handleCopy: (e: Event) => Promise<void> }]>;
  } = $props();

  let copied = $state(false);

  async function handleCopy(e: Event) {
    if (copied) return;
    if (typeof copy === "function") await copy();
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }
</script>

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>
      {#snippet child({ props })}
        {#if children}
          {@render children({ copied, handleCopy })}
        {:else}
          <Button
            variant="outline"
            size="icon"
            {...restProps}
            {...props}
            class={cn(
              "disabled:opacity-100",
              copied && "cursor-default",
              restProps.class,
            )}
            onclick={(e) => {
              handleCopy(e);
              if (typeof props?.onclick === "function") props.onclick?.(e);
              restProps.onclick?.(e);
            }}
            disabled={restProps.disabled}
          >
            <div class={cn("transition-all", copied ? "scale-100 opacity-100" : "scale-0 opacity-0 absolute")}>
              <Icon icon="check" size="md" class="stroke-emerald-500" />
            </div>
            <div class={cn("transition-all", copied ? "scale-0 opacity-0 absolute" : "scale-100 opacity-100")}>
              <Icon icon="copy" size="md" />
            </div>
          </Button>
        {/if}
      {/snippet}
    </TooltipTrigger>
    <TooltipContent class="px-2 py-1 text-xs">{copied ? "Copied" : "Click to copy"}</TooltipContent>
  </Tooltip>
</TooltipProvider>