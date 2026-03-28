<script lang="ts">
  import { Button, Card, Input, Icon } from "@vexed/ui";

  type BoostsSectionProps = {
    boostInput: string;
    boostItems: string[];
    onBoostInputInput(this: void, value: string): void;
    onBoostSubmit(this: void, ev: Event): void;
    onClearBoosts(this: void): void;
    onGrabBoosts(this: void): void;
    onRemoveBoost(this: void, boost: string): void;
  };

  const props: BoostsSectionProps = $props();
</script>

<Card.Root class="overflow-hidden rounded-xl border-border/40 shadow-none">
  <Card.Header
    class="relative flex min-h-[40px] flex-row items-center justify-between border-b border-border/10 p-3 py-2"
  >
    <div class="flex items-center gap-2">
      <Card.Title class="text-xs font-semibold text-foreground/70"
        >Boosts</Card.Title
      >
      {#if props.boostItems.length > 0}
        <span
          class="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-amber-500/80"
        >
          {props.boostItems.length}
        </span>
      {/if}
    </div>
    <div class="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        class="h-6 gap-1 border-border/20"
        onclick={props.onGrabBoosts}
      >
        <Icon icon="download" />
        Grab
      </Button>
      {#if props.boostItems.length > 0}
        <Button
          variant="outline"
          size="sm"
          class="h-6 gap-1 border-border/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onclick={props.onClearBoosts}
        >
          <Icon icon="trash" />
          Clear
        </Button>
      {/if}
    </div>
  </Card.Header>

  <Card.Content class="flex flex-col gap-3 p-3">
    <form class="flex items-center gap-2" onsubmit={props.onBoostSubmit}>
      <Input
        type="text"
        size="sm"
        placeholder="Enter boost name..."
        value={props.boostInput}
        oninput={(ev) => props.onBoostInputInput(ev.currentTarget.value)}
        class="flex-1 border-border/40 bg-secondary/30"
        autocomplete="off"
        spellcheck="false"
      />
      <Button
        type="submit"
        size="sm"
        class="h-7 gap-1"
        disabled={!props.boostInput.trim()}
      >
        <Icon icon="plus" size="sm" />
        Add
      </Button>
    </form>

    <div
      class="max-h-32 min-h-[80px] overflow-y-auto rounded-md bg-secondary/10 p-1.5"
    >
      {#if props.boostItems.length === 0}
        <div class="flex h-20 items-center justify-center">
          <span class="text-[11px] text-muted-foreground/60"
            >No boosts registered</span
          >
        </div>
      {:else}
        <div class="flex flex-wrap gap-1">
          {#each props.boostItems as boost (boost)}
            <div
              class="group inline-flex items-center gap-1.5 rounded-md border border-border/40 bg-background/50 px-2 py-0.5 text-xs transition-colors hover:border-border/60"
            >
              <span class="font-medium text-foreground/80">{boost}</span>
              <button
                type="button"
                class="flex h-3.5 w-3.5 items-center justify-center rounded-sm text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
                onclick={() => props.onRemoveBoost(boost)}
              >
                <Icon icon="x" size="xs" />
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </Card.Content>
</Card.Root>
