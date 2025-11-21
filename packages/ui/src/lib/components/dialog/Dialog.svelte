<script lang="ts">
    import { setContext } from "svelte";
    import { writable } from "svelte/store";

    interface DialogContext {
        open: ReturnType<typeof writable<boolean>>;
        updateOpen: (newOpen: boolean) => void;
    }

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

    const ctx: DialogContext = {
        open: openStore,
        updateOpen,
    };

    setContext("dialog", ctx);
</script>

{@render children?.()}
