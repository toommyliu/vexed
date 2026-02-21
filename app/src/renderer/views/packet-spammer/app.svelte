<script lang="ts">
  import { Button, Input, Label, Card } from "@vexed/ui";
  import * as InputGroup from "@vexed/ui/InputGroup";
  import { cn } from "@vexed/ui/util";

  import Play from "@vexed/ui/icons/Play";
  import Pause from "@vexed/ui/icons/Pause";
  import Plus from "@vexed/ui/icons/Plus";
  import Trash2 from "@vexed/ui/icons/Trash2";

  import { client, handlers } from "~/shared/tipc";

  let packets = $state<string[]>([]);
  let packetInput = $state("");
  let delay = $state(1000);
  let isRunning = $state(false);
  let selectedIndex = $state<number | null>(null);

  const canStart = $derived(packets.length > 0 && !isRunning);
  const canStop = $derived(isRunning);
  const canRemove = $derived(selectedIndex !== null && !isRunning);
  const canAdd = $derived(packetInput.trim().length > 0 && !isRunning);

  function clearPackets() {
    packets = [];
    selectedIndex = null;
  }

  function addPacket() {
    if (!packetInput.trim()) return;

    packets = [...packets, packetInput.trim()];
    packetInput = "";
  }

  function removePacket() {
    if (selectedIndex === null) return;

    packets = packets.filter((_, index) => index !== selectedIndex);
    selectedIndex = null;
  }

  $effect(() => {
    if (isRunning) {
      client.packets.startSpammer({
        packets: [...packets],
        delay,
      });
    } else {
      client.packets.stopSpammer();
    }
  });

  handlers.game.gameReloaded.listen(() => (isRunning = false));
</script>

<div class="flex h-screen flex-col bg-background">
  <header
    class="elevation-1 sticky top-0 z-10 border-b border-border/50 bg-background/95 px-6 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80"
  >
    <div class="mx-auto flex max-w-7xl items-center justify-between">
      <div class="flex items-center gap-3">
        <h1 class="text-base font-semibold tracking-tight text-foreground">
          Packet Spammer
        </h1>
      </div>

      <div class="flex items-center gap-2">
        <Button
          size="sm"
          variant={isRunning ? "destructive" : "default"}
          class="gap-2"
          onclick={() => (isRunning = !isRunning)}
          disabled={!canStart && !canStop}
        >
          {#if isRunning}
            <Pause class="h-4 w-4" />
            <span class="hidden sm:inline">Stop</span>
          {:else}
            <Play class="h-4 w-4" />
            <span class="hidden sm:inline">Start</span>
          {/if}
        </Button>
      </div>
    </div>
  </header>

  <main class="flex-1 overflow-auto p-4 sm:p-6">
    <div class="mx-auto flex max-w-7xl flex-col gap-4">
      <Card.Root class="gap-0 overflow-hidden border-border/40 py-0">
        <Card.Header
          class="relative flex h-10 flex-row items-center space-y-0 border-b border-border/20 px-4 py-0"
        >
          <div
            class="absolute bottom-3 left-0 top-3 w-0.5 rounded-full bg-primary/50"
          ></div>
          <h2 class="text-sm font-medium text-foreground/80">Add Packet</h2>
        </Card.Header>

        <Card.Content class="space-y-4 p-5">
          <div class="space-y-1.5">
            <Label for="packet-input" class="text-muted-foreground"
              >Packet</Label
            >
            <div class="flex gap-2">
              <Input
                type="text"
                id="packet-input"
                bind:value={packetInput}
                placeholder="Enter packet..."
                class={cn(
                  "border-border/50 bg-secondary/50 font-mono transition-colors focus:bg-background",
                  isRunning && "pointer-events-none opacity-50",
                )}
                disabled={isRunning}
                autocomplete="off"
                onkeydown={(ev) => {
                  if (ev.key === "Enter" && canAdd) {
                    ev.preventDefault();
                    addPacket();
                  }
                }}
              />
              <Button
                variant="default"
                size="default"
                class="shrink-0 gap-2"
                onclick={addPacket}
                disabled={!canAdd}
              >
                <Plus class="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>

          <div class="space-y-1.5">
            <Label for="delay-input" class="text-muted-foreground"
              >Delay between packets</Label
            >
            <InputGroup.Root
              class="max-w-xs border-border/50 bg-secondary/50 transition-colors focus-within:bg-background"
            >
              <Input
                type="number"
                id="delay-input"
                bind:value={delay}
                min={10}
                step={100}
                class={cn(isRunning && "pointer-events-none opacity-50")}
                disabled={isRunning}
                autocomplete="off"
              />
              <InputGroup.Addon align="inline-end">
                <InputGroup.Text
                  class="text-xs font-medium text-muted-foreground"
                >
                  ms
                </InputGroup.Text>
              </InputGroup.Addon>
            </InputGroup.Root>
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root class="flex-1 gap-0 overflow-hidden border-border/40 py-0">
        <Card.Header
          class="relative flex h-10 flex-row items-center justify-between space-y-0 border-b border-border/20 px-4 py-0"
        >
          <div
            class="absolute bottom-3 left-0 top-3 w-0.5 rounded-full bg-primary/50"
          ></div>
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-medium text-foreground/80">Packet Queue</h2>
            <span
              class="rounded bg-secondary px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground"
            >
              {packets.length}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              class="gap-2 text-destructive"
              onclick={removePacket}
              disabled={!canRemove}
            >
              <Trash2 class="h-4 w-4" />
              Remove
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="gap-2 text-destructive"
              onclick={clearPackets}
              disabled={isRunning || packets.length === 0}
            >
              <Trash2 class="h-4 w-4" />
              Clear All
            </Button>
          </div>
        </Card.Header>

        <Card.Content class="space-y-2 p-5">
          <div
            class="max-h-[350px] min-h-[200px] overflow-auto rounded-lg border border-border/50 bg-secondary/30 p-2"
          >
            {#if packets.length === 0}
              <div
                class="flex h-full min-h-[180px] items-center justify-center"
              >
                <p class="text-center text-sm text-muted-foreground">
                  No packets added yet
                </p>
              </div>
            {:else}
              <div class="space-y-1">
                {#each packets as packet, index (index)}
                  <div
                    class={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 font-mono text-sm transition-colors",
                      isRunning ? "cursor-default" : "cursor-pointer",
                      selectedIndex === index
                        ? "border border-primary/30 bg-primary/20 text-primary"
                        : "border border-transparent text-foreground hover:bg-secondary/80",
                    )}
                    onclick={() =>
                      !isRunning &&
                      (selectedIndex = selectedIndex === index ? null : index)}
                    onkeydown={(ev) => {
                      if (ev.key === "Enter" && !isRunning) {
                        ev.preventDefault();
                        selectedIndex = selectedIndex === index ? null : index;
                      }
                    }}
                    role="button"
                    tabindex={isRunning ? -1 : 0}
                  >
                    <span
                      class="w-6 shrink-0 text-xs tabular-nums text-muted-foreground"
                    >
                      {index + 1}.
                    </span>
                    <span class="flex-1 truncate">{packet}</span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  </main>
</div>
