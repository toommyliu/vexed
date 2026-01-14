<script lang="ts">
  import { Button, Checkbox, cn, Label } from "@vexed/ui";
  import * as Tabs from "@vexed/ui/Tabs";
  import Play from "lucide-svelte/icons/play";
  import Pause from "lucide-svelte/icons/pause";
  import Download from "lucide-svelte/icons/download";
  import Copy from "lucide-svelte/icons/copy";
  import Trash2 from "lucide-svelte/icons/trash-2";

  import { client, handlers } from "~/shared/tipc";
  import { v4 as uuid } from "@lukeed/uuid";
  type PacketType = "client" | "pext" | "server";
  type PacketFilter = PacketType | "all";
  type PacketEntry = {
    id: string;
    content: string;
    timestamp: number;
    type: PacketType;
  };

  let packets = $state<PacketEntry[]>([]);
  let currentFilter = $state<PacketFilter>("all");
  let on = $state(false);
  let showTimestamps = $state(false);
  let autoScroll = $state(true);

  let loggerElement = $state<HTMLDivElement>();

  let stats = $state({
    client: 0,
    server: 0,
    pext: 0,
  });

  let totalPackets = $derived(stats.client + stats.server + stats.pext);
  let filteredPackets = $derived(
    packets.filter(
      (packet) => currentFilter === "all" || packet.type === currentFilter,
    ),
  );

  function formatPacket(data: unknown, type: PacketType): string {
    if (typeof data === "object") {
      return JSON.stringify(data, null, 2);
    }

    if (
      type === "client" &&
      typeof data === "string" &&
      data.startsWith("[Sending - STR]: ")
    ) {
      return data.slice(17);
    }

    return typeof data === "string" ? data : JSON.stringify(data, null, 2);
  }

  function getPacketTypeBadgeClass(type: PacketType): string {
    switch (type) {
      case "client":
        return "bg-blue-500/20 text-blue-400";
      case "server":
        return "bg-emerald-500/20 text-emerald-400";
      case "pext":
        return "bg-violet-500/20 text-violet-400";
    }
  }

  function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const milliseconds = date.getMilliseconds().toString().padStart(3, "0");

    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  async function toggleCapture() {
    on = !on;

    if (on) {
      await client.packetLogger.packetLoggerStart();
    } else {
      await client.packetLogger.packetLoggerStop();
    }
  }

  function addPacket(data: unknown, type: PacketType) {
    if (!on) return;

    const packet: PacketEntry = {
      id: uuid(),
      content: formatPacket(data, type),
      type: type,
      timestamp: Date.now(),
    };

    packets.push(packet);
    stats[type]++;

    if (autoScroll && loggerElement) {
      setTimeout(() => {
        loggerElement!.scrollTo(0, loggerElement!.scrollHeight);
      }, 0);
    }
  }

  async function copyPacket(content: string) {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // ignore
    }
  }

  async function saveToFile() {
    if (!filteredPackets.length) return;

    const content = filteredPackets
      .map((packet) => {
        const timestamp = formatTimestamp(packet.timestamp);
        return `[${timestamp}] [${packet.type.toUpperCase()}] ${packet.content}`;
      })
      .join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "packets.txt";
    a.click();
  }

  async function copyAll() {
    const content = filteredPackets
      .map((packet) => {
        const timestamp = showTimestamps
          ? `[${formatTimestamp(packet.timestamp)}] `
          : "";
        return `${timestamp}[${packet.type.toUpperCase()}] ${packet.content}`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(content);
    } catch {}
  }

  function clearPackets() {
    packets.length = 0;
    stats.client = 0;
    stats.server = 0;
    stats.pext = 0;
  }

  handlers.packetLogger.packet.listen((packet) => {
    if (!on) return;

    const type = packet.type as PacketType;
    addPacket(packet.packet, type);
  });

  handlers.game.gameReloaded.listen(() => {
    on = false;
  });
</script>

<div class="bg-background flex h-screen flex-col">
  <header
    class="elevation-1 border-border/50 bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 border-b px-6 py-3 backdrop-blur-xl"
  >
    <div class="mx-auto flex max-w-7xl items-center justify-between">
      <div class="flex items-center gap-3">
        <h1 class="text-foreground text-base font-semibold tracking-tight">
          Packet Logger
        </h1>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          class="border-border/50 gap-2"
          onclick={saveToFile}
          disabled={filteredPackets.length === 0}
        >
          <Download class="h-4 w-4" />
          <span class="hidden sm:inline">Save</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="border-border/50 gap-2"
          onclick={copyAll}
          disabled={filteredPackets.length === 0}
        >
          <Copy class="h-4 w-4" />
          <span class="hidden sm:inline">Copy All</span>
        </Button>
        <Button
          size="sm"
          variant={on ? "destructive" : "default"}
          class="gap-2"
          onclick={toggleCapture}
        >
          {#if on}
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

  <main class="flex-1 overflow-hidden p-4 sm:p-6">
    <div class="mx-auto flex h-full max-w-7xl flex-col gap-4">
      <Tabs.Root bind:value={currentFilter} class="flex h-full flex-col gap-4">
        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <Tabs.List class="w-fit">
            <Tabs.Trigger value="all" class="gap-2">
              All
              <span
                class="bg-secondary rounded px-1.5 py-0.5 text-xs tabular-nums"
              >
                {totalPackets}
              </span>
            </Tabs.Trigger>
            <Tabs.Trigger value="client" class="gap-2">
              <span class="text-blue-400">Client</span>
              <span
                class="rounded bg-blue-500/20 px-1.5 py-0.5 text-xs tabular-nums text-blue-400"
              >
                {stats.client}
              </span>
            </Tabs.Trigger>
            <Tabs.Trigger value="server" class="gap-2">
              <span class="text-emerald-400">Server</span>
              <span
                class="rounded bg-emerald-500/20 px-1.5 py-0.5 text-xs tabular-nums text-emerald-400"
              >
                {stats.server}
              </span>
            </Tabs.Trigger>
            <Tabs.Trigger value="pext" class="gap-2">
              <span class="text-violet-400">Pext</span>
              <span
                class="rounded bg-violet-500/20 px-1.5 py-0.5 text-xs tabular-nums text-violet-400"
              >
                {stats.pext}
              </span>
            </Tabs.Trigger>
          </Tabs.List>

          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <Checkbox id="show-timestamps" bind:checked={showTimestamps} />
              <Label
                for="show-timestamps"
                class="text-muted-foreground flex cursor-pointer items-center gap-1.5 text-sm"
              >
                Timestamps
              </Label>
            </div>
            <div class="flex items-center gap-2">
              <Checkbox id="auto-scroll" bind:checked={autoScroll} />
              <Label
                for="auto-scroll"
                class="text-muted-foreground flex cursor-pointer items-center gap-1.5 text-sm"
              >
                Auto-scroll
              </Label>
            </div>
            <Button
              variant="ghost"
              size="sm"
              class="text-destructive gap-2"
              onclick={clearPackets}
              disabled={packets.length === 0}
            >
              <Trash2 class="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>

        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">
            <span class="text-foreground font-medium tabular-nums"
              >{filteredPackets.length}</span
            >
            {#if currentFilter !== "all"}
              <span class="text-muted-foreground/70">of {totalPackets}</span>
            {/if}
            <span class="text-muted-foreground/70"
              >packet{filteredPackets.length !== 1 ? "s" : ""}</span
            >
          </span>
        </div>

        <div
          class="border-border/50 bg-card relative flex-1 overflow-hidden rounded-xl border"
        >
          {#if filteredPackets.length === 0}
            <div class="flex h-full items-center justify-center">
              <p class="text-muted-foreground text-center text-sm">
                No packets captured yet
              </p>
            </div>
          {:else}
            <div
              bind:this={loggerElement}
              class="h-full overflow-auto p-3 font-mono text-sm"
            >
              {#each filteredPackets as packet (packet.id)}
                <div
                  class="hover:bg-secondary/50 group flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 transition-colors"
                  onclick={() => copyPacket(packet.content)}
                  onkeydown={(ev) => {
                    if (ev.key === "Enter") {
                      ev.preventDefault();
                      copyPacket(packet.content);
                    }
                  }}
                  role="button"
                  tabindex="0"
                  title="Click to copy"
                >
                  {#if showTimestamps}
                    <span
                      class="text-muted-foreground/70 shrink-0 text-xs tabular-nums"
                    >
                      {formatTimestamp(packet.timestamp)}
                    </span>
                  {/if}
                  <span
                    class={cn(
                      "shrink-0 rounded px-1.5 py-0.5 text-xs font-medium uppercase",
                      getPacketTypeBadgeClass(packet.type),
                    )}
                  >
                    {packet.type}
                  </span>
                  <span
                    class="text-foreground flex-1 whitespace-pre-wrap break-all"
                  >
                    {packet.content}
                  </span>
                  <Copy
                    class="text-muted-foreground h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </Tabs.Root>
    </div>
  </main>
</div>
