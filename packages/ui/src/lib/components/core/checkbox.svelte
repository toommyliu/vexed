<script lang="ts">
  import { Checkbox, type CheckboxRootProps } from "@ark-ui/svelte/checkbox";
  import { Icon } from "$lib";
  import { cn } from "$lib/utils";

  let {
    checked = $bindable(false),
    indeterminate = $bindable(false),
    disabled = false,
    name,
    value,
    required,
    invalid,
    readOnly,
    class: className,
    onCheckedChange,
  }: CheckboxRootProps & {
    indeterminate?: boolean;
  } = $props();

  const checkedState = $derived(indeterminate ? "indeterminate" : checked);
</script>

<Checkbox.Root
  {name}
  {value}
  {disabled}
  {required}
  {invalid}
  {readOnly}
  checked={checkedState}
  onCheckedChange={(details) => {
    if (details.checked === "indeterminate") {
      indeterminate = true;
      checked = false;
    } else {
      indeterminate = false;
      checked = details.checked;
      onCheckedChange?.(details);
    }
  }}
  class={cn(
    "peer h-4 w-4 shrink-0 rounded-sm border border-input bg-background ring-offset-background transition-all",
    "hover:border-muted-foreground/60",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
    className,
  )}
  data-slot="checkbox"
>
  <Checkbox.Control>
    <Checkbox.Indicator {indeterminate}>
      <div
        data-slot="checkbox-indicator"
        class={cn(
          "flex items-center justify-center text-current transition-none",
          { "-mt-[1px]": indeterminate },
        )}
      >
        {#if indeterminate}
          <Icon icon="minus" size="md" />
        {:else}
          <Icon icon="check" size="md" />
        {/if}
      </div>
    </Checkbox.Indicator>
  </Checkbox.Control>
  <Checkbox.HiddenInput />
</Checkbox.Root>
