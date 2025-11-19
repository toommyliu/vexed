<script>
  import { tv } from "tailwind-variants";

  const tag = tv({
    base: "inline-flex items-center space-x-2 rounded-full border border-gray-700/50 bg-gray-800/50 font-medium text-gray-200",
    variants: {
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-3 py-1 text-xs",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      size: "md",
    },
  });

  /** @type {boolean} */
  export let removable = false;
  
  /** @type {() => void} */
  export let onRemove = undefined;
  
  /** @type {"sm" | "md" | "lg"} */
  export let size = undefined;
  
  /** @type {string} */
  let className = "";
  export { className as class };

  function handleRemove() {
    if (onRemove) onRemove();
  }
</script>

<span
  class={tag({ size, class: className })}
  {...$$restProps}
>
  <span><slot /></span>
  {#if removable}
    <button
      type="button"
      class="flex h-4 w-4 items-center justify-center rounded-full bg-transparent leading-none text-gray-400 transition duration-150 hover:bg-gray-700/50 hover:text-red-400"
      on:click={handleRemove}
    >
      ×
    </button>
  {/if}
</span>
