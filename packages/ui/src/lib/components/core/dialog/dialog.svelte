<script lang="ts">
  import { Dialog, type DialogRootProps } from "@ark-ui/svelte/dialog";

  let {
    open = $bindable(false),
    role = "dialog",
    closeOnEscape = true,
    closeOnInteractOutside = true,
    modal = true,
    lazyMount = false,
    unmountOnExit = false,
    onOpenChange,
    children,
    ...restProps
  }: DialogRootProps = $props();
</script>

<Dialog.Root
  bind:open
  {role}
  {closeOnEscape}
  {closeOnInteractOutside}
  {modal}
  {lazyMount}
  {unmountOnExit}
  {...restProps}
>
  {@render children?.()}
</Dialog.Root>
