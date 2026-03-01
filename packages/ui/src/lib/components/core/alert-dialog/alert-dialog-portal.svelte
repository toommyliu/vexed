<script lang="ts">
  import type { Snippet } from "svelte";
  import { portal } from "$lib/actions/index.js";

  interface AlertDialogPortalProps {
    children?: Snippet;
    target?: string | HTMLElement;
  }

  let { children, target = "body" }: AlertDialogPortalProps = $props();
</script>

<div use:portal={target}>
  {@render children?.()}
</div>
