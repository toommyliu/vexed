<script lang="ts">
  import { cn } from "$lib/util/cn";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface Props extends HTMLButtonAttributes {
    checked?: boolean | "indeterminate";
    onCheckedChange?: (checked: boolean | "indeterminate") => void;
  }

  let {
    class: className = undefined,
    checked = $bindable(false),
    disabled = false,
    onCheckedChange = undefined,
    ...restProps
  }: Props = $props();

  function handleClick() {
    if (disabled) return;

    const newChecked = checked === "indeterminate" ? true : !checked;
    checked = newChecked;
    onCheckedChange?.(newChecked);
  }
</script>

<button
  type="button"
  role="checkbox"
  aria-checked={checked === "indeterminate" ? "mixed" : checked}
  {disabled}
  onclick={handleClick}
  class={cn(
    "peer h-4 w-4 shrink-0 rounded-sm border border-input bg-background ring-offset-background transition-all hover:border-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
    className,
  )}
  data-state={checked === "indeterminate"
    ? "indeterminate"
    : checked
      ? "checked"
      : "unchecked"}
  {...restProps}
>
  <span
    class={cn(
      "flex items-center justify-center text-current",
      checked === "indeterminate" || checked ? "opacity-100" : "opacity-0",
    )}
  >
    {#if checked === "indeterminate"}
      <svg
        class="h-3 w-3"
        fill="none"
        height="24"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="3"
        viewBox="0 0 24 24"
        width="24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M5.252 12h13.496" />
      </svg>
    {:else}
      <svg
        class="h-3 w-3"
        fill="none"
        height="24"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="3"
        viewBox="0 0 24 24"
        width="24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
      </svg>
    {/if}
  </span>
</button>
