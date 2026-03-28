<script lang="ts">
  import { Button, Card, Checkbox, Input, Icon, Label } from "@vexed/ui";

  type QuestsSectionProps = {
    autoRegisterRequirements: boolean;
    autoRegisterRewards: boolean;
    onAutoRegisterRequirementsChange(this: void, checked: boolean): void;
    onAutoRegisterRewardsChange(this: void, checked: boolean): void;
    onClearQuests(this: void): void;
    onQuestInputInput(this: void, value: string): void;
    onQuestSubmit(this: void, ev: Event): void;
    onRemoveQuest(this: void, id: number): void;
    onUpdateQuestItemId(this: void, questId: number, itemIdStr: string): void;
    questIds: number[];
    questInput: string;
    questItemIds: Record<number, number>;
  };

  const props: QuestsSectionProps = $props();
</script>

<Card.Root class="overflow-hidden rounded-xl border-border/40 shadow-none">
  <Card.Header
    class="relative flex min-h-[40px] flex-row items-center justify-between border-b border-border/10 p-3 py-2"
  >
    <div class="flex items-center gap-2">
      <Card.Title class="text-xs font-semibold text-foreground/70"
        >Quests</Card.Title
      >
      {#if props.questIds.length > 0}
        <span
          class="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-blue-500/80"
        >
          {props.questIds.length}
        </span>
      {/if}
    </div>
    {#if props.questIds.length > 0}
      <Button
        variant="ghost"
        size="xs"
        class="h-6 gap-1 text-[10px] text-destructive hover:bg-destructive/10"
        onclick={props.onClearQuests}
      >
        <Icon icon="trash" size="xs" />
        Clear
      </Button>
    {/if}
  </Card.Header>

  <Card.Content class="flex flex-col gap-3 p-3">
    <form class="flex items-center gap-2" onsubmit={props.onQuestSubmit}>
      <Input
        type="text"
        size="sm"
        placeholder="Enter quest ID..."
        value={props.questInput}
        oninput={(ev) => props.onQuestInputInput(ev.currentTarget.value)}
        class="flex-1 border-border/40 bg-secondary/30"
      />
      <Button
        type="submit"
        size="sm"
        class="h-7 gap-1"
        disabled={!props.questInput.trim()}
      >
        <Icon icon="plus" size="sm" />
        Add
      </Button>
    </form>

    <div class="max-h-32 min-h-[80px] overflow-y-auto rounded-md bg-secondary/10 p-1.5">
      {#if props.questIds.length === 0}
        <div class="flex h-20 items-center justify-center">
          <span class="text-[11px] text-muted-foreground/60"
            >No quests registered</span
          >
        </div>
      {:else}
        <div class="flex flex-wrap gap-1">
          {#each props.questIds as questId (questId)}
            <div
              class="group inline-flex items-center gap-1 rounded-md border border-border/40 bg-background/50 px-1.5 py-0.5 text-xs transition-colors hover:border-border/60"
            >
              <span class="font-medium tabular-nums text-foreground/80">{questId}</span>
              {#if props.questItemIds[questId] !== undefined}
                <span class="text-muted-foreground/40">:</span>
                <input
                  type="number"
                  class="w-12 border-none bg-transparent p-0 text-xs tabular-nums text-primary outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  value={String(props.questItemIds[questId])}
                  onblur={(ev) =>
                    props.onUpdateQuestItemId(questId, ev.currentTarget.value)}
                  onkeydown={(ev) => {
                    if (ev.key === "Enter") {
                      ev.currentTarget.blur();
                    }
                  }}
                />
              {:else}
                <input
                  type="text"
                  class="w-10 border-none bg-transparent p-0 text-[10px] tabular-nums text-foreground opacity-0 outline-none transition-opacity placeholder:text-muted-foreground/30 focus:opacity-100 group-hover:opacity-100"
                  placeholder=":itemId"
                  onblur={(ev) => {
                    if (ev.currentTarget.value.trim()) {
                      props.onUpdateQuestItemId(
                        questId,
                        ev.currentTarget.value,
                      );
                    }
                  }}
                  onkeydown={(ev) => {
                    if (ev.key === "Enter") {
                      ev.currentTarget.blur();
                    }
                  }}
                />
              {/if}
              <button
                type="button"
                class="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-sm text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
                onclick={() => props.onRemoveQuest(questId)}
              >
                <Icon icon="x" size="xs" />
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="flex flex-col gap-2 border-t border-border/10 pt-2">
      <div class="flex items-center gap-1.5 px-0.5">
        <Checkbox
          id="auto-requirements"
          checked={props.autoRegisterRequirements}
          onCheckedChange={(details) =>
            props.onAutoRegisterRequirementsChange(details.checked === true)}
        />
        <Label
          for="auto-requirements"
          class="cursor-pointer text-[11px] font-medium text-muted-foreground/70"
        >
          Auto register requirements
        </Label>
      </div>
      <div class="flex items-center gap-1.5 px-0.5">
        <Checkbox
          id="auto-rewards"
          checked={props.autoRegisterRewards}
          onCheckedChange={(details) =>
            props.onAutoRegisterRewardsChange(details.checked === true)}
        />
        <Label
          for="auto-rewards"
          class="cursor-pointer text-[11px] font-medium text-muted-foreground/70"
        >
          Auto register rewards
        </Label>
      </div>
    </div>
  </Card.Content>
</Card.Root>
