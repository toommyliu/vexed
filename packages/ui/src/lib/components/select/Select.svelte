<script>
    import { setContext } from "svelte";
    import { writable } from "svelte/store";

    let {
        value = $bindable(undefined),
        onValueChange = undefined,
        open = $bindable(false),
        disabled = false,
        name = undefined,
        required = false,
        children,
    } = $props();

    // Use a store for reactive context in Svelte 5 if we want deep reactivity,
    // or just pass a state object if using runes deeply.
    // For simplicity and compatibility, I'll use a simple context object with getters/setters or stores.
    // Actually, with Svelte 5 runes, we can pass a state object.

    // Let's use a simple closure-based context for now to avoid complex store logic if possible,
    // but since we need to react to changes in children, stores or runes state is best.
    // I'll use a custom context object.

    const ctx = {
        get value() {
            return value;
        },
        set value(v) {
            value = v;
            if (onValueChange) onValueChange(v);
        },
        get open() {
            return open;
        },
        set open(v) {
            open = v;
        },
        get disabled() {
            return disabled;
        },
        toggle() {
            if (!disabled) open = !open;
        },
        close() {
            open = false;
        },
    };

    setContext("select", ctx);
</script>

<div class="relative inline-block text-left w-full">
    {@render children?.()}
    {#if name}
        <input type="hidden" {name} {value} {required} />
    {/if}
</div>
