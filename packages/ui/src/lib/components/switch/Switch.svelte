<script lang="ts">
    import { cn } from "$lib/util/cn";
    import type { HTMLButtonAttributes } from "svelte/elements";

    interface Props extends HTMLButtonAttributes {
        checked?: boolean;
        onCheckedChange?: (checked: boolean) => void;
    }

    let {
        checked = $bindable(false),
        onCheckedChange = undefined,
        disabled = false,
        class: className = undefined,
        ...restProps
    }: Props = $props();

    function toggle() {
        if (disabled) return;
        checked = !checked;
        onCheckedChange?.(checked);
    }
</script>

<button
    type="button"
    role="switch"
    aria-checked={checked}
    {disabled}
    onclick={toggle}
    class={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        className,
    )}
    data-state={checked ? "checked" : "unchecked"}
    {...restProps}
>
    <span
        class={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        )}
        data-state={checked ? "checked" : "unchecked"}
    ></span>
</button>
