<script lang="ts">
  // shadcn
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { cn } from "./util/cn";

  type Variant = "default" | "primary" | "secondary" | "destructive";
  type Size = "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";

  interface Props extends HTMLButtonAttributes {
    variant?: Variant;
    size?: Size;
    children?: Snippet;
  }

  let {
    variant = "default",
    size = "default",
    children,
    class: cls,
    ...rest
  }: Props = $props();

  function getVariantClass(v: Variant): string {
    const variants: Record<Variant, string> = {
      default: "",
      primary: "btn--primary",
      secondary: "btn--secondary",
      destructive: "btn--destructive",
    };
    return variants[v];
  }

  function getSizeClass(s: Size): string {
    const sizes: Record<Size, string> = {
      default: "",
      sm: "btn--sm",
      lg: "btn--lg",
      icon: "btn--icon",
      "icon-sm": "btn--icon-sm",
      "icon-lg": "btn--icon-lg",
    };
    return sizes[s];
  }
</script>

<button
  class={cn("btn", getVariantClass(variant), getSizeClass(size), cls)}
  {...rest}
>
  {@render children?.()}
</button>

<style>
  :root {
    --color-white: #fff;
    --color-primary: rgb(229, 229, 229);
    --spacing: 0.25rem;
    --radius: 0.625rem;
    --text-sm: 0.875rem;
    --text-sm--line-height: calc(1.25 / 0.875);
    --font-weight-medium: 500;
    --default-transition-duration: 0.15s;
    --default-transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    --destructive: rgb(255, 94, 54);
  }

  .btn {
    box-sizing: border-box;
    border: 0 solid;
    margin: 0;
    padding: 0;
    font: inherit;
    opacity: 1;
    appearance: button;
    display: inline-flex;
    height: calc(var(--spacing) * 9);
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    gap: calc(var(--spacing) * 2);
    border-radius: calc(var(--radius) - 2px);
    padding: calc(var(--spacing) * 2) calc(var(--spacing) * 4);
    font-size: var(--text-sm);
    line-height: var(--text-sm--line-height);
    font-weight: var(--font-weight-medium);
    white-space: nowrap;
    transition: all var(--default-transition-duration)
      var(--default-transition-timing-function);
    outline: none;
    cursor: pointer;
    background-color: var(--color-primary);
    color: rgb(23, 23, 23);
  }

  .btn--primary {
    background-color: #3b82f6;
    color: rgb(250, 250, 250) !important;
  }

  .btn--secondary {
    background-color: rgb(38, 38, 38);
    color: rgb(250, 250, 250) !important;
  }

  .btn--destructive {
    background-color: var(--destructive);
    color: rgb(250, 250, 250) !important;
  }

  .btn--sm {
    height: calc(var(--spacing) * 8);
    border-radius: 0.375rem;
    gap: calc(var(--spacing) * 1.5);
    padding: 0 calc(var(--spacing) * 3);
  }

  .btn--lg {
    height: calc(var(--spacing) * 10);
    border-radius: 0.375rem;
    padding: 0 calc(var(--spacing) * 6);
  }

  .btn--icon {
    width: calc(var(--spacing) * 9);
    background-color: #ffffff0b;
    color: #d4d4d4;
  }

  .btn--icon-sm {
    width: calc(var(--spacing) * 8);
    background-color: #ffffff0b;
    color: #d4d4d4;
  }

  .btn--icon-lg {
    width: calc(var(--spacing) * 10);
    background-color: #ffffff0b;
    color: #d4d4d4;
  }

  .btn:hover {
    opacity: 0.9;
  }

  .btn:active {
    transform: scale(0.98);
  }
</style>
