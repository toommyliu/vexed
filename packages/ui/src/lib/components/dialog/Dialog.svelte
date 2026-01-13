<script lang="ts">
    import { setContext } from "svelte";
    import type { Snippet } from "svelte";
    import { writable } from "svelte/store";
    import type { DialogContext } from "./types";

    interface Props {
        open?: boolean;
        onOpenChange?: (open: boolean) => void;
        children?: Snippet;
    }

    let {
        open = $bindable(false),
        onOpenChange = undefined,
        children,
    }: Props = $props();

    const openStore = writable(open);

    $effect(() => {
        openStore.set(open);
    });

    function updateOpen(newOpen: boolean) {
        open = newOpen;
        onOpenChange?.(newOpen);
    }

    const ctx: DialogContext = {
        open: openStore,
        updateOpen,
    };

    setContext("dialog", ctx);
</script>

{@render children?.()}
