<script>
    import { onDestroy } from "svelte";
    import { tv } from "tailwind-variants";

    const modal = tv({
        variants: {
            maxWidth: {
                sm: "max-w-sm",
                md: "max-w-md",
                lg: "max-w-lg",
                xl: "max-w-xl",
                "2xl": "max-w-2xl",
            },
        },
        defaultVariants: {
            maxWidth: "md",
        },
    });

    /** @type {boolean} */
    export let isOpen = false;

    /** @type {(() => void) | undefined} */
    export let onClose = undefined;

    /** @type {string | undefined} */
    export let title = undefined;

    /** @type {"sm" | "md" | "lg" | "xl" | "2xl" | undefined} */
    export let maxWidth = undefined;

    /** @type {string} */
    let className = "";
    export { className as class };

    /**
     * @param {KeyboardEvent} ev
     */
    function handleKeydown(ev) {
        if (!isOpen) return;
        if (ev.key === "Escape") handleClose();
    }

    function handleClose() {
        if (onClose) onClose();
        else isOpen = false;
    }

    /**
     * @param {MouseEvent} ev
     */
    function handleOverlayClick(ev) {
        if (ev.target === ev.currentTarget) {
            handleClose();
        }
    }

    $: if (isOpen) {
        document.body.style.overflow = "hidden";
    } else {
        document.body.style.overflow = "";
    }

    onDestroy(() => {
        document.body.style.overflow = "";
    });
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        on:click={handleOverlayClick}
        on:keydown={(ev) => ev.key === "Enter" && handleOverlayClick(ev)}
        role="button"
        tabindex="0"
    >
        <div
            class="relative w-full {modal({
                maxWidth,
            })} rounded-md border border-zinc-700/50 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 shadow-2xl {className}"
            on:click={(ev) => ev.stopPropagation()}
            on:keydown={(ev) => ev.key === "Enter" && ev.stopPropagation()}
            role="dialog"
            aria-labelledby={title ? "modal-title" : undefined}
            aria-modal="true"
            tabindex="-1"
            {...$$restProps}
        >
            <button
                class="absolute right-4 top-4 bg-transparent text-zinc-400 transition-colors hover:text-white"
                on:click={handleClose}
                aria-label="Close modal"
            >
                <svg
                    class="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>

            {#if title}
                <div class="mb-6">
                    <h2
                        id="modal-title"
                        class="text-xl font-semibold text-white"
                    >
                        {title}
                    </h2>
                </div>
            {/if}

            <slot />
        </div>
    </div>
{/if}
