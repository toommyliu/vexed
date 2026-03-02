<script lang="ts">
  import { Switch, type SwitchRootProps } from "@ark-ui/svelte/switch";
  import { cn } from "$lib/utils";

  type Size = "default" | "sm";

  let {
    checked = $bindable(false),
    disabled = false,
    name,
    value,
    size = "default",
    class: className,
    required,
    readOnly,
    invalid,
    ...restProps
  }: SwitchRootProps & { size?: Size } = $props();

  const thumbSize = $derived(size === "sm" ? "1rem" : "1.25rem");
</script>

<Switch.Root
  bind:checked
  {disabled}
  {name}
  {value}
  {required}
  {readOnly}
  {invalid}
  {...restProps}
  style="--thumb-size: {thumbSize}"
  class="inline-flex cursor-pointer items-center disabled:cursor-not-allowed disabled:opacity-60"
>
  <Switch.Control
    class={cn(
      "group peer inline-flex h-[calc(var(--thumb-size)+2px)] w-[calc(var(--thumb-size)*2-2px)] shrink-0 items-center rounded-full p-px outline-none transition-[background-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background data-[state=checked]:bg-foreground data-[state=unchecked]:bg-input",
      className,
    )}
  >
    <Switch.Thumb
      class={cn(
        "pointer-events-none block h-full w-[var(--thumb-size)] origin-left rounded-full bg-background shadow-sm ring-0 will-change-transform transition-[transform] duration-150",
        "data-[state=checked]:origin-right data-[state=checked]:translate-x-[calc(var(--thumb-size)-4px)]",
        "data-[state=unchecked]:translate-x-0 group-active:scale-x-110",
      )}
    />
  </Switch.Control>
  <Switch.HiddenInput />
</Switch.Root>
