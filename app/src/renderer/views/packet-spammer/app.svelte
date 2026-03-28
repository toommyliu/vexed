<script lang="ts">
  import { AppFrame, Button, Icon } from "@vexed/ui";
  import { client, handlers } from "~/shared/tipc";

  import AddPacketSection from "./components/AddPacketSection.svelte";
  import PacketQueueSection from "./components/PacketQueueSection.svelte";

  let packets = $state<string[]>([]);
  let packetInput = $state("");
  let delay = $state(1_000);
  let isRunning = $state(false);
  let selectedIndex = $state<number | null>(null);

  const canStart = $derived(packets.length > 0 && !isRunning);
  const canStop = $derived(isRunning);
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
      void client.packets.startSpammer({
        packets: [...packets],
        delay,
      });
    } else {
      void client.packets.stopSpammer();
    }
  });

  handlers.game.gameReloaded.listen(() => (isRunning = false));
</script>

<AppFrame.Root>
  <AppFrame.Header title="Packet Spammer">
    {#snippet right()}
      <Button
        size="sm"
        variant={isRunning ? "destructive" : "default"}
        class="h-7 gap-1.5 px-3 text-xs"
        onclick={() => (isRunning = !isRunning)}
        disabled={!canStart && !canStop}
      >
        {#if isRunning}
          <Icon icon="pause" size="sm" />
          <span>Stop</span>
        {:else}
          <Icon icon="play" size="sm" />
          <span>Start</span>
        {/if}
      </Button>
    {/snippet}
  </AppFrame.Header>

  <AppFrame.Body maxWidth="max-w-3xl">
    <div class="grid gap-4">
      <AddPacketSection
        disabled={isRunning}
        {packetInput}
        {delay}
        {canAdd}
        onPacketInputChange={(value) => (packetInput = value)}
        onDelayChange={(value) => (delay = value)}
        onAddPacket={addPacket}
      />

      <PacketQueueSection
        {packets}
        {selectedIndex}
        {isRunning}
        onSelectIndex={(index) => (selectedIndex = index)}
        onRemovePacket={removePacket}
        onClearPackets={clearPackets}
      />
    </div>
  </AppFrame.Body>
</AppFrame.Root>
