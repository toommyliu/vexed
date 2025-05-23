import { ipcRenderer } from "../../../common/ipc";
import { IPC_EVENTS } from "../../../common/ipc-events";

const packets: PacketEntry[] = [];

let on = false;
let currentFilter: PacketFilter = "all";
let showTimestamps = false;
let autoScroll = true;

const stats = {
  client: 0,
  server: 0,
  pext: 0,
};

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

function displayPacket(packet: PacketEntry): void {
  if (currentFilter !== "all" && currentFilter !== packet.type) {
    return;
  }

  const container = document.querySelector("#logger")!;
  const packetDiv = document.createElement("div");
  packetDiv.title = "Click to copy packet";
  packetDiv.className =
    "line mb-1 flex flex-wrap items-start rounded px-2 py-1 transition-colors duration-150 hover:bg-zinc-800 cursor-pointer font-mono";
  packetDiv.dataset["type"] = packet.type;
  packetDiv.dataset["timestamp"] = packet.timestamp.toString();

  if (showTimestamps) {
    const span = document.createElement("span");
    span.className = "text-xs font-mono text-gray-500 flex-shrink-0 w-24 mr-1";
    span.textContent = formatTimestamp(packet.timestamp);
    packetDiv.append(span);
  }

  const packetTypeSpan = document.createElement("span");
  packetTypeSpan.className = `text-xs font-mono ${getPacketTypeColor(packet.type)} flex-shrink-0 w-16 mr-2`;
  packetTypeSpan.textContent = `[${packet.type.toUpperCase()}]`;

  const packetContentSpan = document.createElement("span");
  packetContentSpan.className =
    "font-mono text-xs text-white flex-1 whitespace-pre-wrap";
  packetContentSpan.textContent = packet.content;

  packetDiv.append(packetTypeSpan);
  packetDiv.append(packetContentSpan);

  packetDiv.addEventListener("click", async () => {
    await navigator.clipboard.writeText(packet.content);
  });

  container.append(packetDiv);
  if (autoScroll) {
    container.scrollTo(0, container.scrollHeight);
  }
}

function filterPackets(): void {
  const container = document.querySelector("#logger")!;
  container.innerHTML = "";

  for (const packet of packets) {
    if (currentFilter === "all" || packet.type === currentFilter) {
      displayPacket(packet);
    }
  }
}

function updateStatistics(): void {
  document.querySelector("#all-badge")!.textContent = (
    stats.client +
    stats.server +
    stats.pext
  ).toString();

  document.querySelector("#client-badge")!.textContent =
    stats.client.toString();
  document.querySelector("#server-badge")!.textContent =
    stats.server.toString();
  document.querySelector("#pext-badge")!.textContent = stats.pext.toString();
}

function setActiveTab(activeTabId: string): void {
  const tabButtons = document.querySelectorAll(".tab-button");
  for (const btn of tabButtons) {
    btn.classList.remove("active", "text-blue-400");
    btn.classList.add("text-gray-400");
  }

  const activeTab = document.querySelector(`#${activeTabId}`);
  if (activeTab) {
    activeTab.classList.add("active", "text-blue-400");
    activeTab.classList.remove("text-gray-400");
  }
}

async function toggleCapture(isActive: boolean) {
  on = isActive;

  const btn = document.querySelector("#toggle-capture") as HTMLButtonElement;
  const textSpan = document.querySelector(
    "#toggle-capture-text",
  ) as HTMLSpanElement;

  if (isActive) {
    btn.classList.remove("bg-green-700", "hover:bg-green-600");
    btn.classList.add("bg-red-700", "hover:bg-red-600");
    textSpan.textContent = "Stop";

    await ipcRenderer
      .callMain(IPC_EVENTS.MSGBROKER, {
        ipcEvent: IPC_EVENTS.PACKET_LOGGER_START,
      })
      .catch(() => {});
  } else {
    btn.classList.remove("bg-red-700", "hover:bg-red-600");
    btn.classList.add("bg-green-700", "hover:bg-green-600");
    textSpan.textContent = "Start";

    await ipcRenderer
      .callMain(IPC_EVENTS.MSGBROKER, {
        ipcEvent: IPC_EVENTS.PACKET_LOGGER_STOP,
      })
      .catch(() => {});
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  // Tab functionality
  {
    const handleTabClick = (btn: Element) => {
      const tabId = btn.id;
      currentFilter = tabId.replace("tab-", "") as PacketFilter;
      setActiveTab(tabId);
      filterPackets();
    };

    const tabButtons = document.querySelectorAll(".tab-button");
    for (const btn of tabButtons) {
      btn.addEventListener("click", () => handleTabClick(btn));
    }
  }

  // Toggle timestamps
  {
    const btn = document.querySelector(
      "#toggle-timestamps",
    ) as HTMLButtonElement;
    btn.addEventListener("click", () => {
      showTimestamps = !showTimestamps;

      if (showTimestamps) {
        btn.classList.add("bg-blue-700", "border-blue-600");
        btn.classList.remove("bg-zinc-800", "border-zinc-700");
      } else {
        btn.classList.remove("bg-blue-700", "border-blue-600");
        btn.classList.add("bg-zinc-800", "border-zinc-700");
      }

      filterPackets();
    });
  }

  // Toggle auto-scroll
  {
    const btn = document.querySelector(
      "#toggle-autoscroll",
    ) as HTMLButtonElement;
    btn.addEventListener("click", () => {
      autoScroll = !autoScroll;

      if (autoScroll) {
        btn.classList.add("bg-blue-700", "border-blue-600");
        btn.classList.remove("bg-zinc-800", "border-zinc-700");
      } else {
        btn.classList.remove("bg-blue-700", "border-blue-600");
        btn.classList.add("bg-zinc-800", "border-zinc-700");
      }
    });
  }

  // Save button
  {
    const btn = document.querySelector("#save") as HTMLButtonElement;
    btn.addEventListener("click", async () => {
      if (!packets.length) return;

      const filteredPackets = packets.filter(
        (packet) => currentFilter === "all" || packet.type === currentFilter,
      );

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
    });
  }

  // Copy all button
  {
    const btn = document.querySelector("#copy-all") as HTMLButtonElement;
    btn.addEventListener("click", async () => {
      const filteredPackets = packets.filter(
        (packet) => currentFilter === "all" || packet.type === currentFilter,
      );

      const content = filteredPackets
        .map((packet) => {
          const timestamp = showTimestamps
            ? `[${formatTimestamp(packet.timestamp)}] `
            : "";
          return `${timestamp}[${packet.type.toUpperCase()}] ${packet.content}`;
        })
        .join("\n");

      await navigator.clipboard.writeText(content).catch(() => {});
    });
  }

  // Clear button
  {
    const btn = document.querySelector("#clear") as HTMLButtonElement;
    btn.addEventListener("click", () => {
      document.querySelector("#logger")!.innerHTML = "";
      packets.length = 0;

      // Reset stats
      stats.client = 0;
      stats.server = 0;
      stats.pext = 0;
      updateStatistics();
    });
  }

  // Start/Stop toggle button
  {
    const toggleBtn = document.querySelector(
      "#toggle-capture",
    ) as HTMLButtonElement;
    toggleBtn.addEventListener("click", async () => {
      await toggleCapture(!on);
    });
  }

  ipcRenderer.answerMain(
    IPC_EVENTS.PACKET_LOGGER_PACKET_CLIENT,
    async (args) => {
      if (!on) return;

      const packet: PacketEntry = {
        content: formatPacket(args.packet, "client"),
        type: "client",
        timestamp: Date.now(),
      };

      packets.push(packet);
      stats.client++;
      updateStatistics();
      displayPacket(packet);
    },
  );
});

ipcRenderer.answerMain(IPC_EVENTS.PACKET_LOGGER_PACKET_SERVER, async (args) => {
  if (!on) return;

  const packet: PacketEntry = {
    content: formatPacket(args.packet, "server"),
    type: "server",
    timestamp: Date.now(),
  };

  packets.push(packet);
  stats.server++;
  updateStatistics();
  displayPacket(packet);
});

ipcRenderer.answerMain(IPC_EVENTS.PACKET_LOGGER_PACKET_PEXT, async (args) => {
  if (!on) return;

  const packet: PacketEntry = {
    content: formatPacket(args.packet, "pext"),
    type: "pext",
    timestamp: Date.now(),
  };

  packets.push(packet);
  stats.pext++;
  updateStatistics();
  displayPacket(packet);
});

ipcRenderer.answerMain(IPC_EVENTS.PACKET_LOGGER_PACKET, async (args) => {
  if (!on) return;

  const packet: PacketEntry = {
    content: formatPacket(args.packet, "client"),
    type: "client",
    timestamp: Date.now(),
  };

  packets.push(packet);
  stats.client++;
  updateStatistics();
  displayPacket(packet);
});

ipcRenderer.answerMain(IPC_EVENTS.REFRESHED, async () => {
  if (on) {
    await toggleCapture(false);
  }
});

window.addEventListener("beforeunload", async () => {
  if (on) {
    await ipcRenderer.callMain(IPC_EVENTS.MSGBROKER, {
      ipcEvent: IPC_EVENTS.PACKET_LOGGER_STOP,
    });
  }
});

type PacketType = "client" | "pext" | "server";
type PacketFilter = PacketType | "all";
type PacketEntry = {
  content: string;
  timestamp: number;
  type: PacketType;
};
