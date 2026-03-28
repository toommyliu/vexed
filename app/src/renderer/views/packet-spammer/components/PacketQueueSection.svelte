<script lang="ts">
  import { Button, Card, Icon } from "@vexed/ui";
  import { cn } from "@vexed/ui/util";

  type Props = {
    isRunning: boolean;
    onClearPackets(this: void): void;
    onRemovePacket(this: void): void;
    onSelectIndex(this: void, index: number | null): void;
    packets: string[];
    selectedIndex: number | null;
  };

  const {
    isRunning,
    onClearPackets,
    onRemovePacket,
    onSelectIndex,
    packets,
    selectedIndex,
  }: Props = $props();

  const canRemove = $derived(selectedIndex !== null && !isRunning);
  const canClear = $derived(packets.length > 0 && !isRunning);
</script>

<Card.Root class="overflow-hidden rounded-xl border-border/40 bg-background shadow-none">
  <Card.Header
    class="flex min-h-[40px] flex-row items-center justify-between border-b border-border/10 p-3 py-2"
  >
    <div class="flex items-center gap-2">
      <Card.Title class="text-xs font-semibold text-foreground/70">Packet Queue</Card.Title>
      <span class="rounded bg-secondary/80 px-1.5 py-0.5 text-[10px] tabular-nums font-semibold text-muted-foreground/80">
        {packets.length}
      </span>
    </div>

    <div class="flex items-center gap-1.5">
      <Button
        variant="ghost"
        size="xs"
        class="h-6 gap-1.5 px-2 text-[11px] text-destructive transition-colors hover:bg-destructive/10"
        onclick={onRemovePacket}
        disabled={!canRemove}
      >
        <Icon icon="trash" size="2xs" />
        <span>Remove</span>
      </Button>
      <Button
        variant="ghost"
        size="xs"
        class="h-6 gap-1.5 px-2 text-[11px] text-destructive transition-colors hover:bg-destructive/10"
        onclick={onClearPackets}
        disabled={!canClear}
      >
        <Icon icon="trash" size="2xs" />
        <span>Clear All</span>
      </Button>
    </div>
  </Card.Header>

  <Card.Content class="p-2 pt-1">
    <div
      class="max-h-[300px] min-h-[160px] overflow-y-auto rounded-md border border-border/20 bg-background/50 p-1.5 shadow-inner"
    >
      {#if packets.length === 0}
        <div class="flex h-full min-h-[148px] items-center justify-center">
          <p class="text-[11px] text-muted-foreground/60 italic font-medium">
            No packets added yet
          </p>
        </div>
      {:else}
        <div class="space-y-0.5">
          {#each packets as packet, index (index)}
            <button
              class={cn(
                "group flex w-full items-center gap-3 rounded-sm px-2.5 py-1.5 font-mono text-xs transition-all",
                isRunning ? "cursor-default" : "cursor-pointer",
                selectedIndex === index
                  ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2)]"
                  : "text-foreground/80 hover:bg-secondary/60 hover:text-foreground",
              )}
              onclick={() =>
                !isRunning &&
                onSelectIndex(selectedIndex === index ? null : index)}
              onkeydown={(ev) => {
                if (ev.key === "Enter" && !isRunning) {
                  ev.preventDefault();
                  onSelectIndex(selectedIndex === index ? null : index);
                }
              }}
              tabindex={isRunning ? -1 : 0}
            >
              <span class="w-5 shrink-0 text-[10px] tabular-nums text-muted-foreground/40 font-bold group-hover:text-muted-foreground/60">
                {(index + 1).toString().padStart(2, '0')}
              </span>
              <span class="flex-1 truncate text-left">{packet}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </Card.Content>
</Card.Root>
