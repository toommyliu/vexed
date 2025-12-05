<script lang="ts">
    import { setContext } from "svelte";
    import { writable } from "svelte/store";
    import type { AlertDialogContext } from "./types";

    interface Props {
        open?: boolean;
        onOpenChange?: (open: boolean) => void;
        children?: import("svelte").Snippet;
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

    const ctx: AlertDialogContext = {
        open: openStore,
        updateOpen,
    };

    setContext("alert-dialog", ctx);
</script>

{@render children?.()}
