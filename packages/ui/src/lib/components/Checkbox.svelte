<script lang="ts">
  import { cn } from "$lib/util/cn";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface Props extends HTMLButtonAttributes {
    checked?: boolean;
    label?: string;
    indeterminate?: boolean;
  }

  let {
    class: className = undefined,
    checked = $bindable(false),
    disabled = false,
    id = undefined,
    label = undefined,
    indeterminate = false,
    ...restProps
  }: Props = $props();
</script>

{#snippet checkboxControl()}
  <button
    type="button"
    role="checkbox"
    aria-checked={indeterminate ? "mixed" : checked}
    {disabled}
    {id}
    onclick={() => {
      if (!disabled) checked = !checked;
    }}
    class={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary",
      className
    )}
    data-state={indeterminate
      ? "indeterminate"
      : checked
        ? "checked"
        : "unchecked"}
    {...restProps}
  >
    <span
      class={cn(
        "flex items-center justify-center text-current",
        checked || indeterminate ? "opacity-100" : "opacity-0"
      )}
    >
      {#if indeterminate}
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
{/snippet}

{#if label}
  <label
    class="flex items-center space-x-2 cursor-pointer"
    class:disabled={"cursor-not-allowed opacity-70"}
  >
    {@render checkboxControl()}
    <span
      class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    >
      {label}
    </span>
  </label>
{:else}
  {@render checkboxControl()}
{/if}
