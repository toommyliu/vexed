<script lang="ts">
  import { Button, Card, Checkbox, Input, Icon, Label } from "@vexed/ui";

  type DropsSectionProps = {
    dropInput: string;
    dropItems: string[];
    onClearDrops(this: void): void;
    onDropInputInput(this: void, value: string): void;
    onDropSubmit(this: void, ev: Event): void;
    onRejectElseChange(this: void, checked: boolean): void;
    onRemoveDrop(this: void, item: string): void;
    rejectElse: boolean;
  };

  const props: DropsSectionProps = $props();
</script>

<Card.Root class="overflow-hidden rounded-xl border-border/40 shadow-none">
  <Card.Header
    class="relative flex min-h-[40px] flex-row items-center justify-between border-b border-border/10 p-3 py-2"
  >
    <div class="flex items-center gap-2">
      <Card.Title class="text-xs font-semibold text-foreground/70"
        >Drops</Card.Title
      >
      {#if props.dropItems.length > 0}
        <span
          class="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-emerald-500/80"
        >
          {props.dropItems.length}
        </span>
      {/if}
    </div>
    {#if props.dropItems.length > 0}
      <Button
        variant="ghost"
        size="xs"
        class="h-6 gap-1 text-[10px] text-destructive hover:bg-destructive/10"
        onclick={props.onClearDrops}
      >
        <Icon icon="trash" size="xs" />
        Clear
      </Button>
    {/if}
  </Card.Header>

  <Card.Content class="flex flex-col gap-3 p-3">
    <form class="flex items-center gap-2" onsubmit={props.onDropSubmit}>
      <Input
        type="text"
        size="sm"
        placeholder="Enter item name..."
        value={props.dropInput}
        oninput={(ev) => props.onDropInputInput(ev.currentTarget.value)}
        class="flex-1 border-border/40 bg-secondary/30"
        autocomplete="off"
        spellcheck="false"
      />
      <Button
        type="submit"
        size="sm"
        class="h-7 gap-1"
        disabled={!props.dropInput.trim()}
      >
        <Icon icon="plus" size="sm" />
        Add
      </Button>
    </form>

    <div class="max-h-32 min-h-[80px] overflow-y-auto rounded-md bg-secondary/10 p-1.5">
      {#if props.dropItems.length === 0}
        <div class="flex h-20 items-center justify-center">
          <span class="text-[11px] text-muted-foreground/60"
            >No drops registered</span
          >
        </div>
      {:else}
        <div class="flex flex-wrap gap-1">
          {#each props.dropItems as drop (drop)}
            <div
              class="group inline-flex items-center gap-1.5 rounded-md border border-border/40 bg-background/50 px-2 py-0.5 text-xs transition-colors hover:border-border/60"
            >
              <span class="font-medium text-foreground/80">{drop}</span>
              <button
                type="button"
                class="flex h-3.5 w-3.5 items-center justify-center rounded-sm text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
                onclick={() => props.onRemoveDrop(drop)}
              >
                <Icon icon="x" size="xs" />
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="flex items-center gap-1.5 border-t border-border/10 px-0.5 pt-2">
      <Checkbox
        id="reject-else"
        checked={props.rejectElse}
        onCheckedChange={(details) =>
          props.onRejectElseChange(details.checked === true)}
      />
      <Label
        for="reject-else"
        class="cursor-pointer text-[11px] font-medium text-muted-foreground/70"
      >
        Reject else
      </Label>
    </div>
  </Card.Content>
</Card.Root>
