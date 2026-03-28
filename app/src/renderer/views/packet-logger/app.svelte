<script lang="ts">
  import {
    AppFrame,
    Button,
    Checkbox,
    Icon,
    Label,
    VirtualList,
  } from "@vexed/ui";
  import { cn } from "@vexed/ui/util";
  import { v4 as uuid } from "@lukeed/uuid";
  import { client, handlers } from "~/shared/tipc";

  type PacketType = "client" | "pext" | "server";
  type PacketEntry = {
    content: string;
    id: string;
    timestamp: number;
    type: PacketType;
  };

  const packets = $state<PacketEntry[]>([]);
  let activeFilters = $state<PacketType[]>(["client", "server", "pext"]);
  let on = $state(false);
  let showTimestamps = $state(false);
  let autoScroll = $state(true);

  let listInstance = $state<VirtualList<PacketEntry>>();

  const stats = $state({ client: 0, server: 0, pext: 0 });

  const filteredPackets = $derived(
    packets.filter((packet) => activeFilters.includes(packet.type)),
  );

  function toggleFilter(type: PacketType) {
    if (activeFilters.includes(type)) {
      activeFilters = activeFilters.filter((filter) => filter !== type);
    } else {
      activeFilters = [...activeFilters, type];
    }
  }

  function formatPacket(data: unknown, type: PacketType): string {
    if (typeof data === "object") return JSON.stringify(data, null, 2);
    if (
      type === "client" &&
      typeof data === "string" &&
      data.startsWith("[Sending - STR]: ")
    ) {
      return data.slice(17);
    }
    return typeof data === "string" ? data : JSON.stringify(data, null, 2);
  }

  function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const hh = date.getHours().toString().padStart(2, "0");
    const mm = date.getMinutes().toString().padStart(2, "0");
    const ss = date.getSeconds().toString().padStart(2, "0");
    const ms = date.getMilliseconds().toString().padStart(3, "0");
    return `${hh}:${mm}:${ss}.${ms}`;
  }

  function prefixClass(type: PacketType): string {
    switch (type) {
      case "client":
        return "text-primary";
      case "server":
        return "text-success";
      case "pext":
        return "text-muted-foreground";
    }
  }

  function filterTabClass(type: PacketType): string {
    const active = activeFilters.includes(type);
    const colorMap: Record<PacketType, string> = {
      client: "border-primary text-primary",
      server: "border-success text-success",
      pext: "border-muted-foreground text-muted-foreground",
    };
    return active
      ? colorMap[type]
      : "border-transparent text-muted-foreground hover:text-foreground";
  }

  async function toggleCapture() {
    on = !on;
    if (on) await client.packets.startLogger();
    else await client.packets.stopLogger();
  }

  function addPacket(data: unknown, type: PacketType) {
    if (!on) return;
    const packet: PacketEntry = {
      id: uuid(),
      content: formatPacket(data, type),
      type,
      timestamp: Date.now(),
    };
    packets.push(packet);
    stats[type]++;

    if (autoScroll && listInstance) {
      setTimeout(() => {
        listInstance?.scrollToBottom();
      }, 0);
    }
  }

  async function copyPacket(content: string) {
    await navigator.clipboard.writeText(content).catch(() => {});
  }

  async function saveToFile() {
    if (!filteredPackets.length) return;
    const content = filteredPackets
      .map(
        (pkt) =>
          `[${formatTimestamp(pkt.timestamp)}] [${pkt.type.toUpperCase()}] ${pkt.content}`,
      )
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    a.download = "packets.txt";
    a.click();
  }

  async function copyAll() {
    const content = filteredPackets
      .map((pkt) => {
        const ts = showTimestamps ? `[${formatTimestamp(pkt.timestamp)}] ` : "";
        return `${ts}[${pkt.type.toUpperCase()}] ${pkt.content}`;
      })
      .join("\n");
    await navigator.clipboard.writeText(content).catch(() => {});
  }

  function clearPackets() {
    packets.length = 0;
    stats.client = 0;
    stats.server = 0;
    stats.pext = 0;
  }

  handlers.packets.onPacket.listen((packet) => {
    if (!on) return;
    addPacket(packet.packet, packet.type as PacketType);
  });

  handlers.game.gameReloaded.listen(() => {
    on = false;
  });
</script>

<AppFrame.Root>
  <AppFrame.Header title="Packet Logger">
    {#snippet right()}
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          class="gap-2 border-border/50"
          onclick={saveToFile}
          disabled={filteredPackets.length === 0}
        >
          <Icon icon="download" size="md" />
          <span class="hidden sm:inline">Save</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="gap-2 border-border/50"
          onclick={copyAll}
          disabled={filteredPackets.length === 0}
        >
          <Icon icon="copy" size="md" />
          <span class="hidden sm:inline">Copy all</span>
        </Button>
        <Button
          size="sm"
          variant={on ? "destructive" : "default"}
          class="gap-2"
          onclick={toggleCapture}
        >
          {#if on}
            <Icon icon="pause" size="md" />
            <span class="hidden sm:inline">Stop</span>
          {:else}
            <Icon icon="play" size="md" />
            <span class="hidden sm:inline">Start</span>
          {/if}
        </Button>
      </div>
    {/snippet}
  </AppFrame.Header>
  <AppFrame.Body scroll={false}>
    <div class="flex h-full flex-col gap-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          {#each ["client", "server", "pext"] as PacketType[] as type (type)}
            <button
              class={cn(
                "flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium transition-colors",
                filterTabClass(type),
              )}
              onclick={() => toggleFilter(type)}
            >
              {type}
              <span class="tabular-nums opacity-50">{stats[type]}</span>
            </button>
          {/each}
        </div>

        <div class="flex items-center gap-4">
          <Label class="text-muted-foreground">
            <Checkbox bind:checked={showTimestamps} />
            Timestamps
          </Label>
          <Label class="text-muted-foreground">
            <Checkbox bind:checked={autoScroll} />
            Auto-scroll
          </Label>
          <Button
            variant="destructive-outline"
            size="sm"
            class="gap-2"
            onclick={clearPackets}
            disabled={packets.length === 0}
          >
            <Icon icon="trash" size="md" />
            Clear
          </Button>
        </div>
      </div>

      <div
        class="relative flex-1 overflow-hidden rounded-xl border border-border/50 bg-card"
      >
        {#if filteredPackets.length === 0}
          <div class="flex h-full items-center justify-center">
            <p class="text-sm text-muted-foreground">No packets captured yet</p>
          </div>
        {:else}
          <VirtualList
            bind:this={listInstance}
            class="h-full font-mono text-sm"
            data={filteredPackets}
            key="id"
            estimateSize={32}
          >
            {#snippet children({ data: packet }: { data: PacketEntry })}
              <button
                class="group flex w-full items-start border-b border-border/40 px-3 py-1.5 text-left transition-colors last:border-b-0 hover:bg-secondary/40"
                onclick={() => copyPacket(packet.content)}
                title="Click to copy"
              >
                {#if showTimestamps}
                  <span
                    class="w-[88px] shrink-0 pt-px text-[11px] tabular-nums text-muted-foreground/60"
                  >
                    {formatTimestamp(packet.timestamp)}
                  </span>
                {/if}
                <span
                  class={cn(
                    "w-[46px] shrink-0 text-right text-[12px] font-medium",
                    prefixClass(packet.type),
                  )}
                >
                  {packet.type}
                </span>
                <span
                  class="ml-2.5 flex-1 whitespace-pre-wrap break-all text-[12px] leading-relaxed text-foreground/90"
                >
                  {packet.content}
                </span>
              </button>
            {/snippet}
          </VirtualList>
        {/if}
      </div>
    </div>
  </AppFrame.Body>
</AppFrame.Root>
