<script lang="ts">
  import { cn } from "../../../shared";
  import { client, handlers } from "../../../shared/tipc";
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

  function getPacketTypeColor(type: PacketType): string {
    switch (type) {
      case "client":
        return "text-blue-400";
      case "server":
        return "text-green-400";
      case "pext":
        return "text-purple-400";
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
      // simulatePackets();
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
      console.log("Packet copied to clipboard");
    } catch (err) {
      console.error("Failed to copy packet:", err);
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
      console.log("All packets copied to clipboard");
    } catch (err) {
      console.error("Failed to copy packets:", err);
    }
  }

  function clearPackets() {
    packets.length = 0;
    stats.client = 0;
    stats.server = 0;
    stats.pext = 0;
  }

  handlers.packetLoggerPacket.listen((packet) => {
    if (!on) {
      console.log("not on");
      return;
    }

    const type = packet.type as PacketType;
    addPacket(packet.packet, type);
  });

  handlers.gameReloaded.listen(() => stop());
</script>

<div class="bg-background-primary min-h-screen select-none text-gray-200">
  <div class="mx-auto box-border w-full max-w-5xl p-4">
    <div
      class="bg-background-secondary mb-3 flex w-max flex-wrap border-b border-zinc-800 pb-1"
    >
      <button
        onclick={() => (currentFilter = "all")}
        class={cn(
          "tab-button flex items-center text-sm font-medium transition-all duration-200 hover:text-blue-300",
          currentFilter === "all" ? "active text-blue-400" : "text-gray-400",
        )}
      >
        <span>All</span>
        <span
          class="ml-1.5 rounded bg-zinc-700 px-1.5 py-0.5 text-xs text-gray-300"
        >
          {totalPackets}
        </span>
      </button>
      <button
        onclick={() => (currentFilter = "client")}
        class={cn(
          "tab-button flex items-center text-sm font-medium transition-all duration-200 hover:text-gray-300",
          currentFilter === "client" ? "active text-blue-400" : "text-gray-400",
        )}
      >
        <span>packetFromClient</span>
        <span
          class="ml-1.5 rounded bg-zinc-700 px-1.5 py-0.5 text-xs text-gray-300"
        >
          {stats.client}
        </span>
      </button>
      <button
        onclick={() => (currentFilter = "server")}
        class={cn(
          "tab-button flex items-center text-sm font-medium transition-all duration-200 hover:text-gray-300",
          currentFilter === "server" ? "active text-blue-400" : "text-gray-400",
        )}
      >
        <span>packetFromServer</span>
        <span
          class="ml-1.5 rounded bg-zinc-700 px-1.5 py-0.5 text-xs text-gray-300"
        >
          {stats.server}
        </span>
      </button>
      <button
        onclick={() => (currentFilter = "pext")}
        class={cn(
          "tab-button flex items-center text-sm font-medium transition-all duration-200 hover:text-gray-300",
          currentFilter === "pext" ? "active text-blue-400" : "text-gray-400",
        )}
      >
        <span>pext</span>
        <span
          class="ml-1.5 rounded bg-zinc-700 px-1.5 py-0.5 text-xs text-gray-300"
        >
          {stats.pext}
        </span>
      </button>
    </div>

    <div class="mb-4">
      <div
        bind:this={loggerElement}
        class="h-[350px] w-full resize-y rounded-md border border-zinc-800 bg-gray-800/50 p-3 shadow-md hover:border-zinc-700"
      >
        {#each filteredPackets as packet (packet.id)}
          <div
            class="line mb-1 flex cursor-pointer flex-wrap items-start rounded px-2 py-1 font-mono transition-colors duration-150 hover:bg-zinc-800"
            onclick={() => copyPacket(packet.content)}
            onkeydown={(ev) => {
              if (ev.key === "Enter") {
                ev.preventDefault();
                copyPacket(packet.content);
              }
            }}
            role="button"
            tabindex="0"
            title="Click to copy packet"
          >
            {#if showTimestamps}
              <span
                class="mr-1 w-24 flex-shrink-0 font-mono text-xs text-gray-500"
              >
                {formatTimestamp(packet.timestamp)}
              </span>
            {/if}
            <span
              class="font-mono text-xs {getPacketTypeColor(
                packet.type,
              )} mr-2 w-16 flex-shrink-0"
            >
              [{packet.type.toUpperCase()}]
            </span>
            <span
              class="flex-1 whitespace-pre-wrap font-mono text-xs text-white"
            >
              {packet.content}
            </span>
          </div>
        {/each}
      </div>
    </div>

    <div
      class="action-buttons-container flex flex-wrap items-start justify-between"
    >
      <div class="action-button-group flex flex-1 flex-wrap space-x-2">
        <button
          onclick={saveToFile}
          class="action-button border border-zinc-700 bg-zinc-800 shadow-sm hover:bg-zinc-700 hover:shadow-md"
        >
          <span>Save To File</span>
        </button>
        <button
          onclick={copyAll}
          class="action-button border border-zinc-700 bg-zinc-800 shadow-sm hover:bg-zinc-700 hover:shadow-md"
        >
          <span>Copy All</span>
        </button>
        <button
          onclick={clearPackets}
          class="action-button border border-zinc-700 bg-zinc-800 shadow-sm hover:bg-zinc-700 hover:shadow-md"
        >
          <span>Clear</span>
        </button>
        <button
          onclick={() => (showTimestamps = !showTimestamps)}
          class={cn(
            "action-button",
            showTimestamps
              ? "border-blue-600 bg-blue-700 hover:bg-blue-600"
              : "border-zinc-700 bg-zinc-800 hover:bg-zinc-700",
          )}
        >
          <span>Show Timestamps</span>
        </button>
        <button
          onclick={() => (autoScroll = !autoScroll)}
          class={cn(
            "action-button",
            autoScroll
              ? "border-blue-600 bg-blue-700 hover:bg-blue-600"
              : "border-zinc-700 bg-zinc-800 shadow-sm hover:bg-zinc-700 hover:shadow-md",
          )}
        >
          <span>Auto-Scroll</span>
        </button>
      </div>
      <div class="toggle-capture-wrapper">
        <button
          onclick={toggleCapture}
          class={cn(
            "action-button text-white shadow-sm hover:shadow-md",
            on
              ? "bg-red-700 hover:bg-red-600"
              : "bg-green-700 hover:bg-green-600",
          )}
        >
          <span>{on ? "Stop" : "Start"}</span>
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .tab-button {
    background-color: #18181b;
    border-radius: 4px 4px 0 0;
    padding: 8px 12px;
    margin-right: 4px;
    margin-bottom: 2px;
  }
  .tab-button:hover {
    background-color: #27272a;
  }
  .tab-button.active {
    position: relative;
    background-color: #27272a;
  }
  .tab-button.active::after {
    content: "";
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: #3b82f6;
    border-radius: 1px;
  }

  .resize-y {
    resize: vertical;
    overflow: auto;
    min-height: 200px;
    max-height: 80vh;
    transition: none;
  }
  .line {
    width: 100%;
    max-width: 100%;
    word-wrap: break-word;
    display: flex;
    align-items: flex-start;
    gap: 0.25rem;
  }
  .line > span:first-child {
    margin-right: 0.25rem;
  }
  .line > span:last-child {
    flex: 1;
    min-width: 0;
  }

  .action-button {
    position: relative;
    overflow: hidden;
    padding: 6px 12px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    min-width: fit-content;
  }
  .action-button span {
    white-space: nowrap;
  }
  .action-button::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  @media (max-width: 768px) {
    .action-button {
      padding: 6px 8px;
      font-size: 13px;
    }
  }
  @media (max-width: 640px) {
    .action-buttons-container {
      flex-direction: column-reverse;
      width: 100%;
    }
    .action-button-group {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 8px;
      width: 100%;
      margin-top: 8px;
    }
    .action-button-group .action-button {
      width: 100%;
      justify-content: center;
    }
    .space-x-2 > :not([hidden]) ~ :not([hidden]) {
      margin-left: 0;
    }
    .toggle-capture-wrapper {
      width: 100%;
    }
    .toggle-capture-wrapper .action-button {
      width: 100%;
      justify-content: center;
    }
  }
</style>
