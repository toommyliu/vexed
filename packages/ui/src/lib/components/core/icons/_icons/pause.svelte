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
  class={cn("lucide lucide-pause-icon lucide-pause", className)}
  {...restProps}
><rect x="14" y="3" width="5" height="18" rx="1"/><rect x="5" y="3" width="5" height="18" rx="1"/></svg
>
