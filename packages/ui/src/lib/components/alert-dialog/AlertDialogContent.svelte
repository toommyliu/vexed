<script lang="ts">
    import { getContext, onDestroy } from "svelte";
    import { motionFade, motionScale } from "$lib/util/motion";
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";
    import type { AlertDialogContext } from "./types";

    interface Props extends HTMLAttributes<HTMLDivElement> {}

    let {
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();

    const { open, updateOpen } = getContext<AlertDialogContext>("alert-dialog");

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape" && $open) {
            updateOpen(false);
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
        <div
            class="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-all duration-200"
            transition:motionFade={{ duration: 150 }}
            data-slot="alert-dialog-backdrop"
        ></div>

        <div
            class="fixed inset-0 z-50 grid grid-rows-[1fr_auto_1fr] place-items-center p-4"
        >
            <div
                class={cn(
                    "row-start-2 relative grid w-full max-w-[400px] overflow-hidden rounded-xl border border-border/60 bg-popover text-popover-foreground",
                    "transition-all duration-200 ease-out will-change-transform",
                    "dark:border-border/40 dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]",
                    className,
                )}
                transition:motionScale={{ start: 0.96, duration: 150 }}
                data-slot="alert-dialog-popup"
                role="alertdialog"
                aria-modal="true"
                {...restProps}
            >
                {@render children?.()}
            </div>
        </div>
    </div>
{/if}
