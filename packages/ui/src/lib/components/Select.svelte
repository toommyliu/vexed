<script>
  import { tv } from "tailwind-variants";

  const select = tv({
    base: "w-full rounded-md border border-gray-700/50 bg-gray-800/50 px-3 py-2 text-white transition-all duration-200 focus:border-blue-500/50 focus:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50",
  });

  /** @type {string} */
  export let value = "";
  
  /** @type {boolean} */
  export let disabled = false;
  
  /** @type {boolean} */
  export let required = false;
  
  /** @type {string} */
  export let id = undefined;
  
  /** @type {string} */
  let className = "";
  export { className as class };
</script>

<select
  {id}
  {disabled}
  {required}
  bind:value
  class={select({ class: className })}
  {...$$restProps}
>
  <slot />
</select>
