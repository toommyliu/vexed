<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    interface Props extends HTMLAttributes<HTMLDivElement> {
        orientation?: "horizontal" | "vertical";
    }

    let {
        children,
        class: className = undefined,
        orientation = "horizontal",
        ...restProps
    }: Props = $props();
</script>

<div
    class={cn(
        "flex w-fit has-[>[data-slot=group]]:gap-2",
        "[&_*:focus-visible]:z-10 [&_*:has(:focus-visible)]:z-10",
        orientation === "horizontal"
            ? "[&>:not(:first-child):before]:-start-[0.5px] [&>:not(:last-child):before]:-end-[0.5px] [&>:not(:first-child)]:rounded-l-none [&>:not(:last-child)]:rounded-r-none [&>:not(:first-child)]:border-l-0 [&>:not(:last-child)]:border-r-0 [&>:not(:first-child):before]:rounded-l-none [&>:not(:last-child):before]:rounded-r-none [&>:after]:min-w-auto"
            : "[&>:not(:first-child):before]:-top-[0.5px] [&>:not(:last-child):before]:-bottom-[0.5px] flex-col [&>:not(:first-child)]:rounded-t-none [&>:not(:last-child)]:rounded-b-none [&>:not(:first-child)]:border-t-0 [&>:not(:last-child)]:border-b-0 [&>:not(:last-child):before]:hidden [&>:not(:first-child):before]:rounded-t-none [&>:not(:last-child):before]:rounded-b-none [&>:after]:min-h-auto dark:[&>:last-child:before]:hidden dark:[&>:first-child:before]:block",
        className,
    )}
    data-orientation={orientation}
    data-slot="group"
    role="group"
    {...restProps}
>
    {@render children?.()}
</div>
