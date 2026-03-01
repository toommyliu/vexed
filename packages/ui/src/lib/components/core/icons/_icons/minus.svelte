<script lang="ts">
  import { cn } from "$lib/utils";

  type Props = {
    class?: string;
  };

  let { class: className, ...restProps }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class={cn("lucide lucide-minus-icon lucide-minus", className)}
  {...restProps}
><path d="M5 12h14"/></svg
>
