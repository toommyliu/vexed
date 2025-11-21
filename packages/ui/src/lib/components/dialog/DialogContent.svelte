<script lang="ts">
    import { getContext, onDestroy } from "svelte";
    import { motionFade, motionScale } from "$lib/util/motion";
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";
    import type { Writable } from "svelte/store";
    import type { DialogContext } from "./types";

    interface Props extends HTMLAttributes<HTMLDivElement> {
        showCloseButton?: boolean;
    }

    let {
        class: className = undefined,
        showCloseButton = true,
        children,
        ...restProps
    }: Props = $props();

    const { open, updateOpen } = getContext<DialogContext>("dialog");

    function handleClose() {
        updateOpen(false);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape" && $open) {
            handleClose();
        }
    }

    function handleBackdropKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            handleClose();
        }
    }

    $effect(() => {
        if ($open) {
            if (typeof document !== "undefined") {
                document.body.style.overflow = "hidden";
            }
        } else {
            if (typeof document !== "undefined") {
                document.body.style.overflow = "";
            }
        }
    });

    onDestroy(() => {
        if (typeof document !== "undefined") {
            document.body.style.overflow = "";
        }
    });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if $open}
    <div class="relative z-50">
        <!-- Backdrop -->
        <div
            class="fixed inset-0 z-50 bg-black/32 backdrop-blur-sm transition-all duration-200"
            transition:motionFade={{ duration: 200 }}
            data-slot="dialog-backdrop"
            onclick={handleClose}
            onkeydown={handleBackdropKeydown}
            role="button"
            tabindex="0"
        ></div>

        <!-- Popup Container -->
        <div class="fixed inset-0 z-50 pointer-events-none">
            <div
                class="grid h-dvh grid-rows-[1fr_auto] justify-items-center pt-6 sm:grid-rows-[1fr_auto_3fr] sm:p-4 pointer-events-none"
            >
                <!-- Popup -->
                <div
                    class={cn(
                        "pointer-events-auto sm:-translate-y-[calc(1.25rem*var(--nested-dialogs))] relative row-start-2 grid max-h-full w-full min-w-0 origin-top overflow-hidden border bg-popover bg-clip-padding text-popover-foreground shadow-lg transition-[scale,opacity,translate] duration-200 ease-in-out will-change-transform before:pointer-events-none before:absolute before:inset-0 before:shadow-[0_1px_--theme(--color-black/4%)] max-sm:border-none max-sm:opacity-[calc(1-min(var(--nested-dialogs),1))] max-sm:before:hidden sm:max-w-lg sm:scale-[calc(1-0.1*var(--nested-dialogs))] sm:rounded-2xl sm:before:rounded-[calc(var(--radius-2xl)-1px)] dark:bg-clip-border dark:before:shadow-[0_-1px_--theme(--color-white/8%)]",
                        className,
                    )}
                    transition:motionScale={{ start: 0.95, duration: 200 }}
                    data-slot="dialog-popup"
                    {...restProps}
                >
                    <div class="flex h-full flex-col overflow-y-auto">
                        {@render children?.()}
                        {#if showCloseButton}
                            <button
                                class="absolute end-2 top-2 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent opacity-72 outline-none transition-[color,background-color,box-shadow,opacity] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0"
                                onclick={handleClose}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    class="lucide lucide-x"
                                    ><path d="M18 6 6 18" /><path
                                        d="m6 6 12 12"
                                    /></svg
                                >
                                <span class="sr-only">Close</span>
                            </button>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}
