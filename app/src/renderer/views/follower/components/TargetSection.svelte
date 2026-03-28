<script lang="ts">
  import { Button, Card, Checkbox, Input, Label } from "@vexed/ui";

  type TargetSectionProps = {
    copyWalk: boolean;
    isEnabled: boolean;
    onCopyWalkChange(checked: boolean): void;
    onFillMe(): void;
    onPlayerNameChange(value: string): void;
    playerName: string;
  };

  const props: TargetSectionProps = $props();
</script>

<Card.Root class="overflow-hidden rounded-xl border-border/40 shadow-none">
  <Card.Header class="gap-0 border-b border-border/10 p-3 pb-2 pt-2.5">
    <Card.Title class="text-xs font-semibold text-foreground/70"
      >Target</Card.Title
    >
  </Card.Header>

  <Card.Content class="space-y-4 p-3.5">
    <div class="space-y-1">
      <Label for="input-player" class="text-xs font-semibold text-foreground/80"
        >Player Name</Label
      >
      <div class="flex gap-2">
        <Input
          type="text"
          id="input-player"
          size="sm"
          value={props.playerName}
          oninput={(event) =>
            props.onPlayerNameChange(
              (event.currentTarget as HTMLInputElement).value,
            )}
          placeholder="Enter player name..."
          disabled={props.isEnabled}
          autocomplete="off"
        />
        <Button
          variant="outline"
          size="sm"
          class="shrink-0"
          onclick={() => props.onFillMe()}
          disabled={props.isEnabled}
        >
          Me
        </Button>
      </div>
    </div>
    <div class="flex items-center gap-1.5 px-0.5">
      <Checkbox
        id="copy-walk"
        checked={props.copyWalk}
        onCheckedChange={(details) =>
          props.onCopyWalkChange(details.checked === true)}
        disabled={props.isEnabled}
      />
      <Label
        for="copy-walk"
        class="cursor-pointer text-xs font-medium text-muted-foreground"
      >
        Copy Walk
      </Label>
    </div>
  </Card.Content>
</Card.Root>
