<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLAttributes } from "svelte/elements";

    interface Props extends HTMLAttributes<HTMLDivElement> {
        ref?: HTMLDivElement;
    }

    let {
        class: className,
        ref = $bindable(),
        children,
        ...props
    }: Props = $props();
</script>

<div
    bind:this={ref}
    class={cn(
        "relative inline-flex w-full min-w-0 items-center rounded-lg border border-input bg-background bg-clip-padding text-base/5 shadow-xs ring-ring/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-has-[input:disabled,textarea:disabled]:not-has-[input:focus-visible,textarea:focus-visible]:not-has-[input[aria-invalid],textarea[aria-invalid]]:before:shadow-[0_1px_--theme(--color-black/4%)] has-[input:focus-visible,textarea:focus-visible]:has-[input[aria-invalid],textarea[aria-invalid]]:border-destructive/64 has-[input:focus-visible,textarea:focus-visible]:has-[input[aria-invalid],textarea[aria-invalid]]:ring-destructive/16 has-[textarea]:h-auto has-[[data-align=block-end]]:h-auto has-[[data-align=block-start]]:h-auto has-[[data-align=block-end]]:flex-col has-[[data-align=block-start]]:flex-col has-[input:focus-visible,textarea:focus-visible]:border-ring has-[input[aria-invalid],textarea[aria-invalid]]:border-destructive/36 has-[input:disabled,textarea:disabled]:opacity-64 has-[input:disabled,textarea:disabled,input:focus-visible,textarea:focus-visible,input[aria-invalid],textarea[aria-invalid]]:shadow-none has-[input:focus-visible,textarea:focus-visible]:ring-[3px] sm:text-sm dark:bg-input/32 dark:not-in-data-[slot=group]:bg-clip-border dark:has-[input[aria-invalid],textarea[aria-invalid]]:ring-destructive/24 dark:not-has-[input:disabled,textarea:disabled]:not-has-[input:focus-visible,textarea:focus-visible]:not-has-[input[aria-invalid],textarea[aria-invalid]]:before:shadow-[0_-1px_--theme(--color-white/8%)] [&>[data-slot=input-control]]:contents [&>[data-slot=textarea-control]]:contents [&>[data-slot=input-control]]:before:hidden [&>[data-slot=textarea-control]]:before:hidden has-[[data-align=inline-start]]:**:[[data-size=sm]_input]:ps-1.5 has-[[data-align=inline-end]]:**:[[data-size=sm]_input]:pe-1.5 has-[[data-align=inline-start]]:**:[input]:ps-2 has-[[data-align=inline-end]]:**:[input]:pe-2 has-[[data-align=block-end]]:**:[input]:pt-3 has-[[data-align=block-start]]:**:[input]:pb-[calc(theme(spacing.3)-1px)] **:[textarea]:min-h-20.5 **:[textarea]:resize-none **:[textarea]:py-[calc(theme(spacing.3)-1px)] **:[textarea]:max-sm:min-h-23.5 **:[textarea_button]:rounded-[calc(var(--radius-md)-1px)] **:[input]:flex-1 **:[textarea]:flex-1",
        className,
    )}
    data-slot="input-group"
    role="group"
    {...props}
>
    {@render children?.()}
</div>
