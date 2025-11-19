<script>
  import { tv } from "tailwind-variants";

  const button = tv({
    base: "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
    variants: {
      variant: {
        primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-lg focus:ring-blue-500/50",
        success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:shadow-lg focus:ring-emerald-500/50",
        danger: "border border-red-600/50 bg-red-900/30 text-red-200 hover:bg-red-800/40 shadow-md hover:shadow-lg focus:ring-red-500/50",
        secondary: "border border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700 shadow-sm hover:shadow-md focus:ring-zinc-500/50",
        ghost: "bg-transparent hover:bg-gray-700/50 text-gray-300 border-transparent focus:ring-gray-500/50",
      },
      size: {
        xs: "px-2 py-1 text-xs",
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  });

  /** @type {"primary" | "success" | "danger" | "secondary" | "ghost"} */
  export let variant = undefined;
  
  /** @type {"xs" | "sm" | "md" | "lg"} */
  export let size = undefined;
  
  /** @type {"button" | "submit" | "reset"} */
  export let type = "button";
  
  /** @type {boolean} */
  export let disabled = false;
  
  /** @type {(event: MouseEvent) => void} */
  export let onclick = undefined;
  
  /** @type {string} */
  let className = "";
  export { className as class };
</script>

<button
  {type}
  {disabled}
  on:click={onclick}
  class={button({ variant, size, class: className })}
  {...$$restProps}
>
  <slot />
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
