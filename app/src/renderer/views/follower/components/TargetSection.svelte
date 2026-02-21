<script lang="ts">
  import { Button, Card, Checkbox, Input, Label } from "@vexed/ui";
  import { cn } from "@vexed/ui/util";

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

<Card.Root class="border-border/40 gap-0 overflow-hidden py-0">
  <Card.Header
    class="border-border/20 relative flex flex-row items-center space-y-0 border-b px-4 py-2"
  >
    <div
      class="bg-primary/50 absolute bottom-3 left-0 top-3 w-0.5 rounded-full"
    ></div>
    <h2 class="text-foreground/80 text-sm font-medium">Target</h2>
  </Card.Header>

  <Card.Content class="space-y-4 p-5">
    <div class="space-y-1.5">
      <Label for="input-player" class="text-muted-foreground">Player Name</Label>
      <div class="flex gap-2">
        <Input
          type="text"
          id="input-player"
          value={props.playerName}
          oninput={(event) =>
            props.onPlayerNameChange((event.currentTarget as HTMLInputElement).value)}
          placeholder="Enter player name..."
          class={cn(
            "bg-secondary/50 border-border/50 focus:bg-background transition-colors",
            props.isEnabled && "pointer-events-none opacity-50",
          )}
          disabled={props.isEnabled}
          autocomplete="off"
        />
        <Button
          variant="outline"
          size="default"
          class="border-border/50 shrink-0"
          onclick={() => props.onFillMe()}
          disabled={props.isEnabled}
        >
          Me
        </Button>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <Checkbox
        id="copy-walk"
        checked={props.copyWalk}
        onCheckedChange={(checked) => props.onCopyWalkChange(checked === true)}
        disabled={props.isEnabled}
      />
      <Label
        for="copy-walk"
        class="text-muted-foreground flex cursor-pointer items-center gap-1.5 text-sm"
      >
        Copy Walk
      </Label>
    </div>
  </Card.Content>
</Card.Root>
