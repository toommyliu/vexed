<script lang="ts">
  import { Icon } from "$lib";
  import { cn } from "$lib/utils";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface CheckboxProps extends Omit<HTMLButtonAttributes, "checked" | "value"> {
    ref?: HTMLButtonElement | null;
    checked?: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
    name?: string;
    value?: string;
    required?: boolean;
    class?: string;
    onCheckedChange?: (checked: boolean) => void;
  }

  let {
    ref = $bindable(null),
    checked = $bindable(false),
    indeterminate = $bindable(false),
    disabled = false,
    name,
    value,
    required,
    class: className,
    onCheckedChange,
    ...restProps
  }: CheckboxProps = $props();

  const state = $derived(indeterminate ? "indeterminate" : checked ? "checked" : "unchecked");

  function toggle() {
    if (disabled) return;
    if (indeterminate) {
      indeterminate = false;
      checked = true;
    } else {
      checked = !checked;
    }
    onCheckedChange?.(checked);
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === " ") {
      e.preventDefault();
      toggle();
    }
  }
</script>

{#if name}
  <input
    type="checkbox"
    {name}
    {value}
    {required}
    {disabled}
    checked={checked && !indeterminate}
    aria-hidden="true"
    tabindex="-1"
    style="position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0"
  />
{/if}

<button
  bind:this={ref}
  type="button"
  role="checkbox"
  aria-checked={indeterminate ? "mixed" : checked}
  data-slot="checkbox"
  data-state={state}
  {disabled}
  onclick={toggle}
  {onkeydown}
  {...restProps}
  class={cn(
    "peer h-4 w-4 shrink-0 rounded-sm border border-input bg-background ring-offset-background transition-all",
    "hover:border-muted-foreground/60",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
    className,
  )}
>
  <div data-slot="checkbox-indicator" class="flex items-center justify-center text-current transition-none">
    {#if checked && !indeterminate}
      <Icon icon="check" size="md" />
    {:else if indeterminate}
      <Icon icon="minus" size="md" />
    {/if}
  </div>
</button>
