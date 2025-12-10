<script lang="ts">
  import Kbd from "@vexed/ui/Kbd";
  import Search from "lucide-svelte/icons/search";
  import Command from "lucide-svelte/icons/command";
  import X from "lucide-svelte/icons/x";

  import { equalsIgnoreCase } from "@shared/string"; 
  import { cn } from "@shared/cn";
  import { IS_MAC } from "@shared/constants";
  import { WindowIds } from "@shared/types";
  import { client } from "@shared/tipc";

  interface CommandItem {
    id: string;
    label: string;
    category: string;
    hotkey: string;
    action: () => void;
  }

  interface Props {
    open?: boolean;
    onClose?: () => void;
    scriptLoaded?: boolean;
    scriptRunning?: boolean;
    onToggleScript?: () => void;
    onLoadScript?: () => void;
    onToggleOverlay?: () => void;
    hotkeyValues?: Record<string, string>;
  }

  let {
    open = $bindable(false),
    onClose,
    scriptLoaded = false,
    scriptRunning = false,
    onToggleScript,
    onLoadScript,
    onToggleOverlay,
    hotkeyValues = {},
  }: Props = $props();

  let searchQuery = $state("");
  let selectedIndex = $state(0);
  let inputRef = $state<HTMLInputElement | null>(null);

  const commands = $derived<CommandItem[]>([
    {
      id: "load-script",
      label: "Load Script",
      category: "Scripts",
      hotkey: hotkeyValues["load-script"] ?? "",
      action: () => { onLoadScript?.(); },
    },
    {
      id: "toggle-script",
      label: scriptRunning ? "Stop Script" : "Start Script",
      category: "Scripts",
      hotkey: hotkeyValues["toggle-script"] ?? "",
      action: () => { if (scriptLoaded) onToggleScript?.(); },
    },
    {
      id: "toggle-command-overlay",
      label: "Toggle Command Overlay",
      category: "Scripts",
      hotkey: hotkeyValues["toggle-command-overlay"] ?? "",
      action: () => { onToggleOverlay?.(); },
    },
    {
      id: "toggle-dev-tools",
      label: "Toggle Dev Tools",
      category: "Scripts",
      hotkey: hotkeyValues["toggle-dev-tools"] ?? "",
      action: () => { void client.scripts.toggleDevTools(); },
    },
    {
      id: "open-environment",
      label: "Environment",
      category: "Application",
      hotkey: hotkeyValues["open-environment"] ?? "",
      action: () => { void client.game.launchWindow(WindowIds.Environment); },
    },
    {
      id: "open-app-logs",
      label: "Logs",
      category: "Application",
      hotkey: hotkeyValues["open-app-logs"] ?? "",
      action: () => { void client.game.launchWindow(WindowIds.AppLogs); },
    },
    {
      id: "open-hotkeys",
      label: "Hotkeys",
      category: "Application",
      hotkey: "",
      action: () => { void client.game.launchWindow(WindowIds.Hotkeys); },
    },
    {
      id: "open-fast-travels",
      label: "Fast Travels",
      category: "Tools",
      hotkey: hotkeyValues["open-fast-travels"] ?? "",
      action: () => { void client.game.launchWindow(WindowIds.FastTravels); },
    },
    {
      id: "open-loader-grabber",
      label: "Loader/Grabber",
      category: "Tools",
      hotkey: hotkeyValues["open-loader-grabber"] ?? "",
      action: () => { void client.game.launchWindow(WindowIds.LoaderGrabber); },
    },
    {
      id: "open-follower",
      label: "Follower",
      category: "Tools",
      hotkey: hotkeyValues["open-follower"] ?? "",
      action: () => { void client.game.launchWindow(WindowIds.Follower); },
    },
    {
      id: "open-packet-logger",
      label: "Packet Logger",
      category: "Packets",
      hotkey: hotkeyValues["open-packet-logger"] ?? "",
      action: () => { void client.game.launchWindow(WindowIds.PacketLogger); },
    },
    {
      id: "open-packet-spammer",
      label: "Packet Spammer",
      category: "Packets",
      hotkey: hotkeyValues["open-packet-spammer"] ?? "",
      action: () => { void client.game.launchWindow(WindowIds.PacketSpammer); },
    },
  ]);

  const filteredCommands = $derived(
    searchQuery.trim()
      ? commands.filter(
          (cmd) =>
            equalsIgnoreCase(cmd.label, searchQuery) ||
            equalsIgnoreCase(cmd.category, searchQuery)
        )
      : commands
  );

  const groupedCommands = $derived(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const cmd of filteredCommands) {
      groups[cmd.category] = groups[cmd.category] ?? [];
      groups[cmd.category]!.push(cmd);
    }
    return groups;
  });

  function handleClose() {
    open = false;
    searchQuery = "";
    selectedIndex = 0;
    onClose?.();
  }

  function executeCommand(cmd: CommandItem) {
    cmd.action();
    handleClose();
  }

  function handleKeydown(ev: KeyboardEvent) {
    if (ev.key === "Escape") {
      ev.preventDefault();
      handleClose();
      return;
    }

    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filteredCommands.length - 1);
      return;
    }

    if (ev.key === "ArrowUp") {
      ev.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      return;
    }

    if (ev.key === "Enter") {
      ev.preventDefault();
      const cmd = filteredCommands[selectedIndex];
      if (cmd) executeCommand(cmd);
      return;
    }
  }

  $effect(() => {
    if (open && inputRef) {
      inputRef.focus();
    }
  });

  $effect(() => {
    if (searchQuery !== undefined) {
      selectedIndex = 0;
    }
  });
</script>

<svelte:window
  onkeydown={(ev) => {
    if (open) return;

    const modifier = IS_MAC ? ev.metaKey : ev.ctrlKey;
    if (modifier && equalsIgnoreCase(ev.key, "k")) {
      ev.preventDefault();
      open = true;
    }
  }}
/>

{#if open}
  <div
    class="fixed inset-0 z-[99999] flex items-start justify-center pt-[15vh]"
    role="dialog"
    aria-modal="true"
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="absolute inset-0 bg-black/60 backdrop-blur-sm"
      onclick={handleClose}
    ></div>

    <div
      class="command-palette relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-border bg-popover shadow-2xl backdrop-blur-xl elevation-2"
    >
      <div class="flex items-center gap-3 border-b border-border px-4 py-3">
        <Search class="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          bind:this={inputRef}
          type="text"
          placeholder="Search commands..."
          class="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          bind:value={searchQuery}
          onkeydown={handleKeydown}
        />
        <button
          class="flex h-5 w-5 items-center justify-center rounded bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onclick={handleClose}
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </div>

      <div class="max-h-[50vh] overflow-y-auto p-2">
        {#if filteredCommands.length === 0}
          <div class="px-3 py-8 text-center text-sm text-muted-foreground">
            No commands found
          </div>
        {:else}
          {#each Object.entries(groupedCommands()) as [category, items]}
            <div class="mb-2 last:mb-0">
              <div
                class="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {category}
              </div>
              {#each items as cmd (cmd.id)}
                {@const globalIndex = filteredCommands.indexOf(cmd)}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                  class={cn(
                    "flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors",
                    globalIndex === selectedIndex
                      ? "bg-primary/20 text-foreground"
                      : "text-foreground/80 hover:bg-accent"
                  )}
                  onclick={() => executeCommand(cmd)}
                  onmouseenter={() => (selectedIndex = globalIndex)}
                >
                  <span class="text-sm">{cmd.label}</span>
                  <Kbd hotkey={cmd.hotkey} />
                </div>
              {/each}
            </div>
          {/each}
        {/if}
      </div>

      <div
        class="flex items-center justify-between border-t border-border px-4 py-2 text-[10px] text-muted-foreground"
      >
        <div class="flex items-center gap-3">
          <span class="flex items-center gap-1">
            <Kbd>↑↓</Kbd>
            <span>navigate</span>
          </span>
          <span class="flex items-center gap-1">
            <Kbd>↵</Kbd>
            <span>select</span>
          </span>
          <span class="flex items-center gap-1">
            <Kbd>esc</Kbd>
            <span>close</span>
          </span>
        </div>
        <div class="flex items-center gap-1 text-muted-foreground/60">
          <Command class="h-3 w-3" />
          <span>K</span>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .command-palette {
    animation: palette-in 0.15s ease-out;
  }

  @keyframes palette-in {
    from {
      opacity: 0;
      transform: scale(0.96) translateY(-8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
</style>
