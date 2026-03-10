<script lang="ts">
  import { tv, type VariantProps } from "tailwind-variants";
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";

  const alertVariants = tv({
    base: "relative w-full rounded-lg border py-2 px-3 [&>svg~*]:pl-8 [&>svg]:absolute [&>svg]:left-3 [&>svg]:top-2.5 [&>svg]:text-foreground",
    variants: {
      variant: {
        default:
          "bg-background text-foreground dark:bg-muted/50 [&>svg]:text-muted-foreground",
        error:
          "border-destructive/20 bg-destructive/5 text-foreground dark:border-destructive/30 dark:bg-destructive/10 [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  });

  type AlertVariant = VariantProps<typeof alertVariants>["variant"];

  interface Props extends HTMLAttributes<HTMLDivElement> {
    variant?: AlertVariant;
  }

  let {
    class: className = undefined,
    variant = undefined,
    children,
    ...restProps
  }: Props = $props();
</script>

<div
  role="alert"
  data-slot="alert"
  class={cn(alertVariants({ variant }), className)}
  {...restProps}
>
  {@render children?.()}
</div>
