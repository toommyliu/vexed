<script>
  import { tv } from "tailwind-variants";

  const input = tv({
    base: "w-full rounded-md border border-gray-700/50 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-500 shadow-inner transition-all duration-200 focus:border-blue-500/50 focus:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50",
  });

  /** @type {string | number} */
  export let value = "";
  
  /** @type {string} */
  export let type = "text";
  
  /** @type {string} */
  export let placeholder = "";
  
  /** @type {boolean} */
  export let disabled = false;
  
  /** @type {boolean} */
  export let required = false;
  
  /** @type {string} */
  export let autocomplete = "off";
  
  /** @type {string} */
  export let id = undefined;
  
  /** @type {string} */
  let className = "";
  export { className as class };
</script>

<input
  {type}
  {id}
  {placeholder}
  {disabled}
  {required}
  {autocomplete}
  bind:value
  class={input({ class: className })}
  {...$$restProps}
/>
