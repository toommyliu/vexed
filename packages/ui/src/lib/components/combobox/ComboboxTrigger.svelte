<script lang="ts">
    import { getContext } from "svelte";
    import { cn } from "$lib/util/cn";
    import ChevronsUpDown from "$lib/components/icons/ChevronsUpDown.svelte";
    import type { HTMLButtonAttributes } from "svelte/elements";
    import type { ComboboxContext } from "./types";

    interface Props extends HTMLButtonAttributes {}

    let { class: className = undefined, ...restProps }: Props = $props();

    const ctx = getContext<ComboboxContext>("combobox");
</script>

<button
    type="button"
    class={cn(
        "-translate-y-1/2 absolute top-1/2 end-0.5 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent opacity-72 outline-none transition-opacity hover:opacity-100 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
    )}
    onclick={() => ctx.toggle()}
    tabindex="-1"
    data-slot="combobox-trigger"
    {...restProps}
>
    <ChevronsUpDown />
</button>
