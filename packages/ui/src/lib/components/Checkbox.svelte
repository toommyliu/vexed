<script>
  import { tv } from "tailwind-variants";

  const checkbox = tv({
    base: "h-4 w-4 rounded border-gray-700/50 bg-gray-800/50 transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
    variants: {
      variant: {
        emerald: "text-emerald-500 focus:ring-emerald-500/20",
        blue: "text-blue-500 focus:ring-blue-500/20",
      },
    },
    defaultVariants: {
      variant: "emerald",
    },
  });

  /** @type {boolean} */
  export let checked = false;
  
  /** @type {boolean} */
  export let disabled = false;
  
  /** @type {string | undefined} */
  export let id = undefined;
  
  /** @type {string | undefined} */
  export let label = undefined;
  
  /** @type {"emerald" | "blue" | undefined} */
  export let variant = undefined;
  
  /** @type {string} */
  let className = "";
  export { className as class };
</script>

{#if label}
  <label class="flex items-center space-x-2 {className}">
    <input
      type="checkbox"
      {id}
      {disabled}
      bind:checked
      class={checkbox({ variant })}
      {...$$restProps}
    />
    <span class="text-sm text-gray-300 {disabled ? 'opacity-50' : ''}">{label}</span>
  </label>
{:else}
  <input
    type="checkbox"
    {id}
    {disabled}
    bind:checked
    class={checkbox({ variant, class: className })}
    {...$$restProps}
  />
{/if}
