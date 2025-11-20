<script>
    import { setContext } from "svelte";
    import { writable } from "svelte/store";

    /** @type {boolean} */
    export let open = false;

    /** @type {(open: boolean) => void} */
    export let onOpenChange = undefined;

    const openStore = writable(open);

    $: openStore.set(open);

    function updateOpen(newOpen) {
        open = newOpen;
        if (onOpenChange) {
            onOpenChange(newOpen);
        }
    }

    setContext("dialog", {
        open: openStore,
        updateOpen,
    });
</script>

<slot />
