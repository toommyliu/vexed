<script lang="ts">
  import { Button, Card, Icon, Input, InputGroup, Label } from "@vexed/ui";
  import { cn } from "@vexed/ui/util";

  type Props = {
    canAdd: boolean;
    delay: number;
    disabled?: boolean;
    onAddPacket(this: void): void;
    onDelayChange(this: void, value: number): void;
    onPacketInputChange(this: void, value: string): void;
    packetInput: string;
  };

  const {
    canAdd,
    delay,
    disabled = false,
    onAddPacket,
    onDelayChange,
    onPacketInputChange,
    packetInput,
  }: Props = $props();
</script>

<Card.Root
  class="overflow-hidden rounded-xl border-border/40 bg-background shadow-none"
>
  <Card.Header
    class="flex min-h-[40px] flex-row items-center justify-between border-b border-border/10 p-3 py-2"
  >
    <Card.Title class="text-xs font-semibold text-foreground/70"
      >Add Packet</Card.Title
    >
  </Card.Header>

  <Card.Content class="grid gap-4 p-4">
    <div class="grid gap-1.5">
      <Label
        for="packet-input"
        class="text-[11px] font-medium text-muted-foreground/80">Packet</Label
      >
      <div class="flex gap-2">
        <Input
          type="text"
          id="packet-input"
          value={packetInput}
          oninput={(event) => onPacketInputChange(event.currentTarget.value)}
          placeholder="Enter packet..."
          class={cn(
            "h-7 border-border/40 bg-background/50 font-mono text-xs transition-colors focus:bg-background",
            disabled && "pointer-events-none opacity-50",
          )}
          {disabled}
          autocomplete="off"
          onkeydown={(ev) => {
            if (ev.key === "Enter" && canAdd) {
              ev.preventDefault();
              onAddPacket();
            }
          }}
        />
        <Button
          variant="default"
          size="sm"
          class="h-7 shrink-0 gap-1.5 text-xs"
          onclick={onAddPacket}
          disabled={!canAdd || disabled}
        >
          <Icon icon="plus" size="sm" />
          <span>Add</span>
        </Button>
      </div>
    </div>

    <div class="grid gap-1.5">
      <Label
        for="delay-input"
        class="text-[11px] font-medium text-muted-foreground/80"
        >Interval Delay</Label
      >
      <InputGroup.Root
        class="h-7 max-w-[140px] border-border/40 bg-background/50 transition-colors focus-within:bg-background"
      >
        <Input
          type="number"
          id="delay-input"
          value={delay}
          oninput={(event) =>
            onDelayChange(Number.parseInt(event.currentTarget.value, 10) || 0)}
          min={10}
          step={100}
          class={cn("text-xs", disabled && "pointer-events-none opacity-50")}
          {disabled}
          autocomplete="off"
        />
        <InputGroup.Addon align="inline-end" class="px-2">
          <InputGroup.Text
            class="text-[10px] font-medium text-muted-foreground/60"
          >
            ms
          </InputGroup.Text>
        </InputGroup.Addon>
      </InputGroup.Root>
    </div>
  </Card.Content>
</Card.Root>
