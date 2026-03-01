<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLButtonAttributes } from "svelte/elements";

  type Size = "default" | "sm";

  interface SwitchProps extends Omit<HTMLButtonAttributes, "checked" | "value"> {
    ref?: HTMLButtonElement | null;
    checked?: boolean;
    disabled?: boolean;
    name?: string;
    value?: string;
    size?: Size;
    class?: string;
    onCheckedChange?: (checked: boolean) => void;
  }

  let {
    ref = $bindable(null),
    checked = $bindable(false),
    disabled = false,
    name,
    value,
    size = "default",
    class: className,
    onCheckedChange,
    ...restProps
  }: SwitchProps = $props();

  const thumbSize = $derived(size === "sm" ? "1rem" : "1.25rem");
  const dataState = $derived(checked ? "checked" : "unchecked");

  function toggle() {
    if (disabled) return;
    checked = !checked;
    onCheckedChange?.(checked);
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === " " || e.key === "Enter") {
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
    {disabled}
    {checked}
    aria-hidden="true"
    tabindex="-1"
    style="position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0"
  />
{/if}

<button
  bind:this={ref}
  type="button"
  role="switch"
  aria-checked={checked}
  data-slot="switch"
  data-state={dataState}
  {disabled}
  onclick={toggle}
  {onkeydown}
  style="--thumb-size: {thumbSize}"
  class={cn(
    "group peer inline-flex h-[calc(var(--thumb-size)+2px)] w-[calc(var(--thumb-size)*2-2px)] shrink-0 cursor-pointer items-center rounded-full p-px outline-none transition-[background-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:bg-foreground data-[state=unchecked]:bg-input",
    className,
  )}
  {...restProps}
>
  <div
    data-slot="switch-thumb"
    data-state={dataState}
    class={cn(
      "pointer-events-none block h-full w-[var(--thumb-size)] origin-left rounded-full bg-background shadow-sm ring-0 will-change-transform transition-[transform] duration-150",
      "data-[state=checked]:origin-right data-[state=checked]:translate-x-[calc(var(--thumb-size)-4px)]",
      "data-[state=unchecked]:translate-x-0 group-active:scale-x-110",
    )}
  ></div>
</button>
