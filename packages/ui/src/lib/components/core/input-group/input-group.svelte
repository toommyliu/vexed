<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLAttributes } from "svelte/elements";
  import { setInputGroupContext } from "./context.js";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    ref?: HTMLDivElement;
  }

  let {
    class: className,
    ref = $bindable(),
    children,
    ...props
  }: Props = $props();

  const hasTextarea = $state({ value: false });
  const hasBlockAddon = $state({ value: false });
  const disabled = $state({ value: false });
  setInputGroupContext({ hasTextarea, hasBlockAddon, disabled });

  let isTextarea = $derived(hasTextarea.value);
  let isBlock = $derived(hasBlockAddon.value);

  let focused = $state(false);
  let valid = $state(true);

  function onfocusin() {
    focused = true;
  }

  function onfocusout(e: FocusEvent) {
    const relatedTarget = e.relatedTarget as Node | null;
    const currentTarget = e.currentTarget as HTMLElement | null;
    if (!currentTarget || !currentTarget?.contains(relatedTarget)) {
      // Defer to avoid state_unsafe_mutation if triggered during Svelte teardown
      queueMicrotask(() => {
        if (currentTarget?.isConnected) focused = false;
      });
    }
  }

  function oninvalid(e: Event) {
    e.preventDefault();
    valid = false;
  }

  function oninput(e: Event) {
    const el = e.target as HTMLInputElement | HTMLTextAreaElement;
    if (el.validity) valid = el.validity.valid;
  }

  function onchange(e: Event) {
    const el = e.target as HTMLInputElement | HTMLTextAreaElement;
    if (el.validity) valid = el.validity.valid;
  }
</script>

<div
  bind:this={ref}
  class={cn(
    "relative inline-flex w-full min-w-0 items-center rounded-lg border border-input bg-background bg-clip-padding text-sm shadow-xs transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(theme(borderRadius.lg)-1px)] before:content-['']",
    // Focus ring states
    focused && valid && "border-ring ring-[3px] ring-ring/20 shadow-none",
    focused &&
      !valid &&
      "border-destructive ring-[3px] ring-destructive/20 shadow-none",
    !focused && !valid && "border-destructive",
    // Disabled state
    disabled.value && "opacity-50 shadow-none",
    // Inner bottom highlight when idle — creates the inset/depth effect
    !focused &&
      valid &&
      !disabled.value &&
      "before:shadow-[0_1px_rgba(0,0,0,0.04)] dark:before:shadow-[0_-1px_rgba(255,255,255,0.06)]",
    // Layout: textarea or block-align addon → column direction
    (isTextarea || isBlock) && "h-auto flex-col items-stretch",
    // Flatten inner input/textarea control wrappers so they participate in flex directly
    "[&>[data-slot=input-control]]:contents [&>[data-slot=textarea-control]]:contents",
    "[&>[data-slot=input-control]]:before:hidden [&>[data-slot=textarea-control]]:before:hidden",
    // Input/textarea sizing inside group
    "[&_input]:flex-1 [&_textarea]:flex-1",
    "[&_textarea]:resize-none [&_textarea]:py-[calc(theme(spacing.3)-1px)]",
    className,
  )}
  data-slot="input-group"
  role="group"
  {onfocusin}
  {onfocusout}
  {oninvalid}
  {oninput}
  {onchange}
  {...props}
>
  {@render children?.()}
</div>
