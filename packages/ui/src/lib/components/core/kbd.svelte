<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLElement> {
    hotkey?: string;
    kbdClass?: string;
  }

  let {
    class: className,
    children,
    hotkey,
    kbdClass,
    ...restProps
  }: Props = $props();

  const IS_MAC = $derived.by(
    () =>
      typeof navigator !== "undefined" && navigator.userAgent.includes("Mac"),
  );

  function isSymbolKey(part: string) {
    return /[⌘⇧⌥⌃↵↑↓←→⎋]/.test(part);
  }

  /**
   * Converts a hotkey string like "command+shift+t" to an array of formatted keys
   */
  function formatHotkeyParts(hotkey: string): string[] {
    if (!hotkey) return [];
    return hotkey.split("+").map((part) => {
      const lower = part.toLowerCase();
      if (IS_MAC) {
        if (lower === "command" || lower === "cmd" || lower === "meta")
          return "⌘";
        if (lower === "shift") return "⇧";
        if (lower === "alt" || lower === "option") return "⌥";
        if (lower === "control" || lower === "ctrl") return "⌃";
      } else {
        if (lower === "command" || lower === "cmd" || lower === "meta")
          return "Ctrl";
        if (lower === "shift") return "Shift";
        if (lower === "alt" || lower === "option") return "Alt";
        if (lower === "control" || lower === "ctrl") return "Ctrl";
      }

      return part.toUpperCase();
    });
  }

  const hotkeyParts = $derived(hotkey ? formatHotkeyParts(hotkey) : []);

  const baseKbdClass =
    "inline-flex h-5 min-w-5 cursor-default select-none items-center justify-center rounded-[calc(var(--radius)-6px)] border border-border/60 bg-muted/60 px-1.5 font-sans text-[11px] font-semibold leading-none tracking-tight text-foreground/70 antialiased shadow-[inset_0_1px_0_rgb(255_255_255_/_0.35),0_1px_0_rgb(0_0_0_/_0.04)] dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08),0_1px_0_rgb(0_0_0_/_0.35)]";
</script>

{#if hotkeyParts.length || children}
  <span
    class={cn("inline-flex shrink-0 items-center gap-1", className)}
    data-slot="kbd-group"
    {...restProps}
  >
    {#if hotkeyParts.length}
      {#each hotkeyParts as part}
        <kbd
          class={cn(
            baseKbdClass,
            isSymbolKey(part) && "text-[12px] tracking-normal",
            kbdClass,
          )}
          data-slot="kbd"
        >
          {part}
        </kbd>
      {/each}
    {:else}
      <kbd class={cn(baseKbdClass, kbdClass)} data-slot="kbd">
        {@render children?.()}
      </kbd>
    {/if}
  </span>
{/if}
