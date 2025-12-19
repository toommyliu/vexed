<script lang="ts">
  import Kbd from "@vexed/ui/Kbd";
  import Command from "lucide-svelte/icons/command";
  import Search from "lucide-svelte/icons/search";
  import X from "lucide-svelte/icons/x";

  import { gameState } from "~/game/state.svelte";
  import { cn } from "~/shared/cn";
  import { IS_MAC } from "~/shared/constants";
  import { equalsIgnoreCase, fuzzyMatchIgnoreCase } from "~/shared/string";
  import { client } from "~/shared/tipc";
  import { WindowIds } from "~/shared/types";

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
  let mouseMoved = $state(false);

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
    {
      id: "toggle-infinite-range",
      label: gameState.infiniteRange ? "Disable Infinite Range" : "Enable Infinite Range",
      category: "Options",
      hotkey: hotkeyValues["toggle-infinite-range"] ?? "",
      action: () => { gameState.infiniteRange = !gameState.infiniteRange; },
    },
    {
      id: "toggle-provoke-cell",
      label: gameState.provokeCell ? "Disable Provoke Cell" : "Enable Provoke Cell",
      category: "Options",
      hotkey: hotkeyValues["toggle-provoke-cell"] ?? "",
      action: () => { gameState.provokeCell = !gameState.provokeCell; },
    },
    {
      id: "toggle-enemy-magnet",
      label: gameState.enemyMagnet ? "Disable Enemy Magnet" : "Enable Enemy Magnet",
      category: "Options",
      hotkey: hotkeyValues["toggle-enemy-magnet"] ?? "",
      action: () => { gameState.enemyMagnet = !gameState.enemyMagnet; },
    },
    {
      id: "toggle-lag-killer",
      label: gameState.lagKiller ? "Disable Lag Killer" : "Enable Lag Killer",
      category: "Options",
      hotkey: hotkeyValues["toggle-lag-killer"] ?? "",
      action: () => { gameState.lagKiller = !gameState.lagKiller; },
    },
    {
      id: "toggle-hide-players",
      label: gameState.hidePlayers ? "Disable Hide Players" : "Enable Hide Players",
      category: "Options",
      hotkey: hotkeyValues["toggle-hide-players"] ?? "",
      action: () => { gameState.hidePlayers = !gameState.hidePlayers; },
    },
    {
      id: "toggle-skip-cutscenes",
      label: gameState.skipCutscenes ? "Disable Skip Cutscenes" : "Enable Skip Cutscenes",
      category: "Options",
      hotkey: hotkeyValues["toggle-skip-cutscenes"] ?? "",
      action: () => { gameState.skipCutscenes = !gameState.skipCutscenes; },
    },
    {
      id: "toggle-disable-fx",
      label: gameState.disableFx ? "Enable FX" : "Disable FX",
      category: "Options",
      hotkey: hotkeyValues["toggle-disable-fx"] ?? "",
      action: () => { gameState.disableFx = !gameState.disableFx; },
    },
    {
      id: "toggle-disable-collisions",
      label: gameState.disableCollisions ? "Enable Collisions" : "Disable Collisions",
      category: "Options",
      hotkey: hotkeyValues["toggle-disable-collisions"] ?? "",
      action: () => { gameState.disableCollisions = !gameState.disableCollisions; },
    },
    {
      id: "toggle-anti-counter",
      label: gameState.counterAttack ? "Disable Anti-Counter" : "Enable Anti-Counter",
      category: "Options",
      hotkey: hotkeyValues["toggle-anti-counter"] ?? "",
      action: () => { gameState.counterAttack = !gameState.counterAttack; },
    },
    {
      id: "toggle-disable-death-ads",
      label: gameState.disableDeathAds ? "Enable Death Ads" : "Disable Death Ads",
      category: "Options",
      hotkey: hotkeyValues["toggle-disable-death-ads"] ?? "",
      action: () => { gameState.disableDeathAds = !gameState.disableDeathAds; },
    },
  ]);

  const filteredCommands = $derived(
    searchQuery.trim()
      ? commands.filter(
          (cmd) =>
            fuzzyMatchIgnoreCase(cmd.label, searchQuery) ||
            fuzzyMatchIgnoreCase(cmd.category, searchQuery)
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

  function executeCommand(cmd: CommandItem, shouldClose = false) {
    cmd.action();
    if (shouldClose) handleClose();
  }

  function scrollSelectedIntoView(index: number) {
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-command-index="${index}"]`);
      el?.scrollIntoView({ block: "nearest" });
    });
  }

  function handleKeydown(ev: KeyboardEvent) {
    if (ev.key === "Escape") {
      ev.preventDefault();
      handleClose();
      return;
    }

    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      const newIndex = Math.min(selectedIndex + 1, filteredCommands.length - 1);
      selectedIndex = newIndex;
      scrollSelectedIntoView(newIndex);
      return;
    }

    if (ev.key === "ArrowUp") {
      ev.preventDefault();
      const newIndex = Math.max(selectedIndex - 1, 0);
      selectedIndex = newIndex;
      scrollSelectedIntoView(newIndex);
      return;
    }

    if (ev.key === "Enter") {
      ev.preventDefault();
      const cmd = filteredCommands[selectedIndex];
      const modifier = IS_MAC ? ev.metaKey : ev.ctrlKey;
      if (cmd) executeCommand(cmd, modifier);
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
      class="absolute inset-0 bg-black/60"
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

      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="max-h-[50vh] overflow-y-auto p-2"
        onscroll={() => (mouseMoved = false)}
        onmousemove={() => (mouseMoved = true)}
      >
        {#if filteredCommands.length === 0}
          <div class="px-3 py-8 text-center text-sm text-muted-foreground">
            No commands found
          </div>
        {:else}
          {#each Object.entries(groupedCommands()) as [category, items]}
            {#key category}
              <div class="mb-2 last:mb-0">
                <div
                  class="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {category}
                </div>
                {#each items as cmd (cmd.id)}
                  {#key cmd.id}
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
                      data-command-index={globalIndex}
                      onclick={(ev) => executeCommand(cmd, IS_MAC ? ev.metaKey : ev.ctrlKey)}
                      onmouseenter={() => mouseMoved && (selectedIndex = globalIndex)}
                    >
                      <span class="text-sm">{cmd.label}</span>
                      <Kbd hotkey={cmd.hotkey} />
                    </div>
                  {/key}
                {/each}
              </div>
            {/key}
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
            <span>run</span>
          </span>
          <span class="flex items-center gap-1">
            <Kbd>{IS_MAC ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>↵</Kbd>
            <span>run & close</span>
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
