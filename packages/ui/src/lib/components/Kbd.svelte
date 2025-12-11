<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    interface Props extends HTMLAttributes<HTMLElement> {
        hotkey?: string;
    }

    let {
        class: className = undefined,
        children,
        hotkey,
        ...restProps
    }: Props = $props();

    const IS_MAC = $derived.by(() => navigator.userAgent.includes("Mac"));

    /**
     * Converts a hotkey string like "command+shift+t" to symbolic format "⌘⇧T"
     */
    function formatHotkey(hotkey: string): string {
        if (!hotkey) return "";

        return hotkey
            .split("+")
            .map((part) => {
                const lower = part.toLowerCase();
                if (IS_MAC) {
                    if (
                        lower === "command" ||
                        lower === "cmd" ||
                        lower === "meta"
                    )
                        return "⌘";
                    if (lower === "shift") return "⇧";
                    if (lower === "alt" || lower === "option") return "⌥";
                    if (lower === "control" || lower === "ctrl") return "⌃";
                } else {
                    if (
                        lower === "command" ||
                        lower === "cmd" ||
                        lower === "meta"
                    )
                        return "Ctrl";
                    if (lower === "shift") return "Shift";
                    if (lower === "alt" || lower === "option") return "Alt";
                    if (lower === "control" || lower === "ctrl") return "Ctrl";
                }
                return part.toUpperCase();
            })
            .join(IS_MAC ? "" : "+");
    }

    const formattedHotkey = $derived(hotkey ? formatHotkey(hotkey) : null);
</script>

{#if formattedHotkey || children}
    <kbd
        class={cn(
            "inline-flex h-5 min-w-5 cursor-default select-none items-center justify-center rounded border border-border/40 bg-muted/50 px-1 text-[10px] font-medium text-muted-foreground transition-all",
            className,
        )}
        data-slot="kbd"
        {...restProps}
    >
        {#if formattedHotkey}
            {formattedHotkey}
        {:else}
            {@render children?.()}
        {/if}
    </kbd>
{/if}
