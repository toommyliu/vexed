<script lang="ts">
  import { WindowIds } from "~/shared/types";
  import { client } from "~/shared/tipc";
  import { Button } from "@vexed/ui";
  import Kbd from "@vexed/ui/Kbd";

  interface MenuItem {
    id: string;
    label: string;
    hotkey: string;
    windowId: WindowIds;
  }

  interface Props {
    open?: boolean;
    onClose?: () => void;
    hotkeyValues?: Record<string, string>;
  }

  let { open = false, onClose, hotkeyValues = {} }: Props = $props();

  const applicationItems = $derived<MenuItem[]>([
    {
      id: "open-environment",
      label: "Environment",
      hotkey: hotkeyValues["open-environment"] ?? "",
      windowId: WindowIds.Environment,
    },
    {
      id: "open-app-logs",
      label: "Logs",
      hotkey: hotkeyValues["open-app-logs"] ?? "",
      windowId: WindowIds.AppLogs,
    },
    {
      id: "open-hotkeys",
      label: "Hotkeys",
      hotkey: "",
      windowId: WindowIds.Hotkeys,
    },
  ]);

  const toolsItems = $derived<MenuItem[]>([
    {
      id: "open-fast-travels",
      label: "Fast Travels",
      hotkey: hotkeyValues["open-fast-travels"] ?? "",
      windowId: WindowIds.FastTravels,
    },
    {
      id: "open-loader-grabber",
      label: "Loader/Grabber",
      hotkey: hotkeyValues["open-loader-grabber"] ?? "",
      windowId: WindowIds.LoaderGrabber,
    },
    {
      id: "open-follower",
      label: "Follower",
      hotkey: hotkeyValues["open-follower"] ?? "",
      windowId: WindowIds.Follower,
    },
  ]);

  const packetsItems = $derived<MenuItem[]>([
    {
      id: "open-packet-logger",
      label: "Logger",
      hotkey: hotkeyValues["open-packet-logger"] ?? "",
      windowId: WindowIds.PacketLogger,
    },
    {
      id: "open-packet-spammer",
      label: "Spammer",
      hotkey: hotkeyValues["open-packet-spammer"] ?? "",
      windowId: WindowIds.PacketSpammer,
    },
  ]);

  function handleItemClick(item: MenuItem) {
    void client.game.launchWindow(item.windowId);
    onClose?.();
  }
</script>

{#if open}
  <div
    class="windows-mega-menu absolute left-0 top-full z-[9999] mt-1 grid grid-cols-[auto_auto_auto] gap-0 overflow-hidden rounded-lg border border-border bg-popover shadow-2xl backdrop-blur-xl elevation-2"
  >
    <!-- Application Column -->
    <div class="border-r border-border/50 p-2">
      <div
        class="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        Application
      </div>
      {#each applicationItems as item (item.id)}
        <Button
          variant="ghost"
          size="sm"
          class="w-full justify-between gap-2 text-xs bg-transparent hover:bg-accent"
          onclick={() => handleItemClick(item)}
        >
          <span>{item.label}</span>
          <Kbd hotkey={item.hotkey} />
        </Button>
      {/each}
    </div>

    <!-- Tools Column -->
    <div class="border-r border-border/50 p-2">
      <div
        class="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        Tools
      </div>
      {#each toolsItems as item (item.id)}
        <Button
          variant="ghost"
          size="sm"
          class="w-full justify-between gap-2 text-xs bg-transparent hover:bg-accent"
          onclick={() => handleItemClick(item)}
        >
          <span>{item.label}</span>
          <Kbd hotkey={item.hotkey} />
        </Button>
      {/each}
    </div>

    <!-- Packets Column -->
    <div class="p-2">
      <div
        class="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        Packets
      </div>
      {#each packetsItems as item (item.id)}
        <Button
          variant="ghost"
          size="sm"
          class="w-full justify-between gap-2 text-xs bg-transparent hover:bg-accent"
          onclick={() => handleItemClick(item)}
        >
          <span>{item.label}</span>
          <Kbd hotkey={item.hotkey} />
        </Button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .windows-mega-menu {
    animation: menu-in 0.12s ease-out;
  }

  @keyframes menu-in {
    from {
      opacity: 0;
      transform: scale(0.96) translateY(-4px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
</style>
