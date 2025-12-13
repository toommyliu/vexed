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
</script>

{#if hotkeyParts.length || children}
    <span
        class={cn("inline-flex shrink-0 items-center gap-0.5", className)}
        data-slot="kbd-group"
        {...restProps}
    >
        {#if hotkeyParts.length}
            {#each hotkeyParts as part}
                <kbd
                    class="inline-flex h-5 min-w-5 cursor-default select-none items-center justify-center rounded border border-border/40 bg-muted/50 px-1 font-sans text-[10px] font-medium text-muted-foreground"
                >
                    {part}
                </kbd>
            {/each}
        {:else}
            <kbd
                class="inline-flex h-5 min-w-5 cursor-default select-none items-center justify-center rounded border border-border/40 bg-muted/50 px-1 font-sans text-[10px] font-medium text-muted-foreground"
            >
                {@render children?.()}
            </kbd>
        {/if}
    </span>
{/if}
