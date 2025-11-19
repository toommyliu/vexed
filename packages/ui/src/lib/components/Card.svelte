<script>
  import { tv } from "tailwind-variants";

  const card = tv({
    base: "rounded-md border shadow-lg backdrop-blur-sm",
    variants: {
      variant: {
        default: "border-gray-800/50 bg-background-secondary",
        zinc: "border-zinc-700/50 bg-background-secondary",
      },
      padding: {
        none: "",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
      },
      hoverable: {
        true: "hover:border-gray-700/70 hover:shadow-xl transition-all duration-300",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      hoverable: false,
    },
  });

  /** @type {"default" | "zinc"} */
  export let variant = undefined;
  
  /** @type {"none" | "sm" | "md" | "lg"} */
  export let padding = undefined;
  
  /** @type {boolean} */
  export let hoverable = undefined;
  
  /** @type {string} */
  let className = "";
  export { className as class };
</script>

<div
  class={card({ variant, padding, hoverable, class: className })}
  {...$$restProps}
>
  <slot />
</div>
