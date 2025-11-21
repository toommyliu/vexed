<script lang="ts">
    import Combobox from "./Combobox.svelte";
    import ComboboxInput from "./ComboboxInput.svelte";
    import ComboboxTrigger from "./ComboboxTrigger.svelte";
    import ComboboxContent from "./ComboboxContent.svelte";
    import ComboboxList from "./ComboboxList.svelte";
    import type { HTMLAttributes } from "svelte/elements";
    import { cn } from "$lib/util/cn";

    interface Props extends HTMLAttributes<HTMLDivElement> {
        value?: any;
        open?: boolean;
        disabled?: boolean;
        placeholder?: string;
        onValueChange?: (value: any) => void;
        onOpenChange?: (open: boolean) => void;
    }

    let {
        value = $bindable(undefined),
        open = $bindable(false),
        disabled = false,
        placeholder = "Select an option",
        onValueChange = undefined,
        onOpenChange = undefined,
        class: className = undefined,
        children,
        ...restProps
    }: Props = $props();

    let inputValue = $state("");
</script>

<Combobox
    bind:value
    bind:open
    {disabled}
    {onValueChange}
    {onOpenChange}
    class={className}
    {...restProps}
>
    <div class="relative">
        <ComboboxInput
            readonly
            {placeholder}
            class="cursor-pointer caret-transparent"
            onclick={() => (open = !open)}
        >
            <ComboboxTrigger />
        </ComboboxInput>
    </div>
    <ComboboxContent>
        <ComboboxList>
            {@render children?.()}
        </ComboboxList>
    </ComboboxContent>
</Combobox>
