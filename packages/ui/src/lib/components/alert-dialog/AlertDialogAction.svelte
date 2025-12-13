<script lang="ts">
    import { getContext } from "svelte";
    import type { AlertDialogContext } from "./types";
    import type { HTMLButtonAttributes } from "svelte/elements";

    interface Props extends HTMLButtonAttributes {}

    let { children, onclick, ...restProps }: Props = $props();

    const { updateOpen } = getContext<AlertDialogContext>("alert-dialog");

    function handleClick(e: MouseEvent) {
        updateOpen(false);
        if (onclick && typeof onclick === "function") {
            onclick(
                e as MouseEvent & {
                    currentTarget: HTMLButtonElement;
                    target: Element;
                },
            );
        }
    }
</script>

<button onclick={handleClick} {...restProps}>
    {@render children?.()}
</button>
