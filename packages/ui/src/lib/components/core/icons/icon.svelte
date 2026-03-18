<script lang="ts">
  import { icons, type IconName } from "./icons.js";

  import type { Component as SvelteComponent } from "svelte";
  import { cn } from "$lib/utils";

  type Color =
    | "primary"
    | "secondary"
    | "info"
    | "success"
    | "notice"
    | "warning"
    | "danger";

  type Size = "2xs" | "xs" | "sm" | "md" | "lg" | "xl";

  interface Props {
    icon: IconName;
    class?: string;
    style?: string;
    size?: Size;
    spin?: boolean;
    title?: string;
    color?: Color | "custom" | "default";
  }

  let {
    icon,
    color = "default",
    spin = false,
    size = "md",
    style,
    class: className,
    title,
  }: Props = $props();

  const Component = $derived(
    (icons[icon] ?? icons.triangle_alert) as SvelteComponent<{
      title?: string;
      style?: string;
      class?: string;
    }>,
  );

  const sizeClass = $derived(
    {
      xl: "h-6 w-6",
      lg: "h-5 w-5",
      md: "h-4 w-4",
      sm: "h-3.5 w-3.5",
      xs: "h-3 w-3",
      "2xs": "h-2.5 w-2.5",
    }[size],
  );

  const colorClass = $derived(
    color === "primary"
      ? "text-primary"
      : color === "secondary"
        ? "text-secondary"
        : color === "info"
          ? "text-info"
          : color === "success"
            ? "text-success"
            : color === "notice"
              ? "text-notice"
              : color === "warning"
                ? "text-warning"
                : color === "danger"
                  ? "text-danger"
                  : "",
  );
</script>

<Component
  {title}
  {style}
  class={cn(
    "shrink-0",
    spin ? "animate-spin" : "transform-gpu",
    sizeClass,
    colorClass,
    className,
  )}
/>
