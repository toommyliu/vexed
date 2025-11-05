<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "./util/cn";

  type DialogProps = {
    open: boolean;
    class?: string;
    children?: Snippet;
    onDismiss?: () => void;
  };

  let { open, class: cls, children, onDismiss }: DialogProps = $props();
</script>

{#if open}
  <div
    class={cn(
      "bg-black/50 z-[99999] flex items-center justify-center backdrop-blur-sm",
      cls
    )}
    style="position: fixed; top: 0; left: 0; right: 0; bottom: 0;"
    onclick={onDismiss}
    onkeydown={(ev) => {
      if (ev.key === "Escape") {
        onDismiss?.();
        ev.preventDefault();
      }
    }}
    role="dialog"
    tabindex="-1"
  >
    {@render children?.()}
  </div>
{/if}
