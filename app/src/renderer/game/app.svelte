<script lang="ts">
  import "./entrypoint";
  import { gameState, scriptState, commandOverlayState } from "./state.svelte";
  import process from "process";
  import { client, handlers } from "@shared/tipc";
  import { cn } from "@shared/cn";
  import { WindowIds } from "@shared/types";
  import { Bot } from "./lib/Bot";
  import { startAutoAggro, stopAutoAggro } from "./autoaggro";
  import { onMount, onDestroy } from "svelte";
  import type { HotkeyConfig } from "@shared/types";
  import Mousetrap from "mousetrap";
  import { createHotkeyConfig, isValidHotkey } from "../tools/hotkeys/utils";
  import type { HotkeySection } from "../tools/hotkeys/types";
  import { interval } from "@vexed/utils";
  import Config from "@vexed/config";
  import { DEFAULT_HOTKEYS, DOCUMENTS_PATH } from "@shared/constants";

  import CommandOverlay from "./components/CommandOverlay.svelte";
  import IconCheckmark from "./components/IconCheckmark.svelte";

  const DEFAULT_PADS = [
    "Center",
    "Spawn",
    "Left",
    "Right",
    "Top",
    "Bottom",
    "Up",
    "Down",
  ] as const;
  const bot = Bot.getInstance();

  let swfPath = $state<string>();

  let config = $state<Config<HotkeyConfig> | null>(null);
  let openDropdown = $state<string | null>(null);
  let hotkeysSections = $state<HotkeySection[]>(createHotkeyConfig());

  let autoAggroEnabled = $state(false);
  let autoEnabled = $state(false);

  let gameConnected = $state(false);
  bot.on("login", () => (gameConnected = true));
  bot.on("logout", () => (gameConnected = false));

  let topNavVisible = $state(true);

  let availableCells = $state<string[]>([]);
  let currentSelectedCell = $state<string>("");
  let currentSelectedPad = $state<string>("");
  let prevRoomId = $state<number>(-1);
  let validPads = $state<
    {
      name: string;
      isValid: boolean;
    }[]
  >([]);

  function jumpToCell(cell: string) {
    if (!bot.player.isReady()) return;
    bot.flash.call(() => swf.playerJump(cell, bot.player.pad ?? "Spawn"));

    currentSelectedCell = cell;
    updatePads();
  }
  function jumpToPad(pad: string) {
    if (!bot.player.isReady()) return;
    bot.flash.call(() => swf.playerJump(bot.player.cell ?? "Enter", pad));
    currentSelectedPad = pad;
  }

  function updateCells() {
    if (!bot.player.isReady() || bot.world.roomId === prevRoomId) return;

    availableCells = bot.world.cells || [];
    currentSelectedCell = bot.player.cell || "";
    prevRoomId = bot.world.roomId || -1;
  }

  function updatePads() {
    if (!bot.player.isReady()) return;

    const cellPads = bot.world.cellPads || [];
    validPads = DEFAULT_PADS.map((pad) => ({
      name: pad,
      isValid: cellPads.includes(pad),
    }));
    currentSelectedPad = bot.player.pad ?? "Spawn";
  }

  function startScript() {
    if (!window.context.commands.length || window.context.isRunning()) return;

    window.context.removeAllListeners("end");

    const onEnd = () => {
      scriptState.isRunning = false;
      window.context.removeListener("end", onEnd);
    };

    void window.context.start();
    scriptState.isRunning = true;
    window.context.on("end", onEnd);
  }

  function stopScript() {
    if (!window.context.isRunning()) return;

    window.context.stop();
    scriptState.isRunning = false;
  }

  handlers.scripts.scriptLoaded.listen((fromManager) => {
    scriptState.isLoaded = true;

    commandOverlayState.updateCommands(
      window.context.commands,
      window.context.commandIndex,
    );
    commandOverlayState.show();

    scriptState.showOverlay = true;

    // Auto start script if loaded from manager
    if (
      fromManager &&
      window.context.commands.length &&
      !window.context.isRunning()
    ) {
      startScript();
    }
  });

  function toggleDropdown(dropdownName: string) {
    openDropdown = openDropdown === dropdownName ? null : dropdownName;
  }

  function toggleScript() {
    if (!scriptState.isLoaded) return;

    if (scriptState.isRunning) {
      stopScript();
    } else {
      startScript();
    }
  }

  async function loadHotkeysFromConfig() {
    if (!config) {
      console.log("Config is null, cannot load hotkeys");
      return;
    }

    // Unbind all
    Mousetrap.reset();

    try {
      for (const section of hotkeysSections) {
        for (const item of section.items) {
          const hotkeyValue = config.get(item.configKey as any, "")! as string;

          if (hotkeyValue && isValidHotkey(hotkeyValue)) {
            item.value = hotkeyValue;
          } else {
            item.value = "";
          }
        }
      }
    } catch (error) {
      console.error("Failed to load hotkeys from config:", error);
    }
  }

  function setupHotkeyHandlers() {
    for (const section of hotkeysSections) {
      for (const item of section.items) {
        if (!item.value || !isValidHotkey(item.value)) continue;

        Mousetrap.bind(item.value, (ev) => {
          // Prevent hotkeys from triggering if any text field is focused
          // But we don't call ev.preventDefault() here, so the input can still be typed
          if (bot.flash.call(() => swf.isTextFieldFocused())) return;

          ev.preventDefault();
          handleHotkeyAction(item.id);
        });
      }
    }
  }

  const toggleBank = () => {
    if (!bot.player.isReady()) return;

    if (bot.bank.isOpen()) {
      bot.flash.call(() => swf.bankOpen());
    } else {
      bot.bank.open();
    }
  };

  const toggleAutoAggro = () => {
    if (autoAggroEnabled) {
      stopAutoAggro();
      autoAggroEnabled = false;
    } else {
      startAutoAggro();
      autoAggroEnabled = true;
    }
  };

  function handleHotkeyAction(actionId: string) {
    switch (actionId) {
      case "toggle-bank":
        toggleBank();
        break;

      case "toggle-auto-aggro":
        toggleAutoAggro();
        break;

      case "toggle-top-bar":
        topNavVisible = !topNavVisible;
        break;

      case "load-script":
        void client.scripts.loadScript({ scriptPath: "" });
        break;

      case "toggle-script":
        toggleScript();
        break;

      case "toggle-command-overlay":
        commandOverlayState.toggle();
        break;

      case "toggle-dev-tools":
        void client.scripts.toggleDevTools();
        break;

      case "open-fast-travels":
        void client.game.launchWindow(WindowIds.FastTravels);
        break;

      case "open-loader-grabber":
        void client.game.launchWindow(WindowIds.LoaderGrabber);
        break;

      case "open-follower":
        void client.game.launchWindow(WindowIds.Follower);
        break;

      case "open-packet-logger":
        void client.game.launchWindow(WindowIds.PacketLogger);
        break;

      case "open-packet-spammer":
        void client.game.launchWindow(WindowIds.PacketSpammer);
        break;
    }
  }

  $effect(() => {
    if (autoEnabled) {
      let idx = 0;
      void interval(async (_, stop) => {
        if (!autoEnabled) {
          stop();
          return;
        }

        if (!bot.player.isReady()) return;
        if (bot.world.availableMonsters.length) {
          if (!bot.combat.hasTarget()) {
            bot.combat.attack("*");
          }
          bot.combat.useSkill(idx++, true, false);
          if (idx > 4) idx = 0;
        }
      }, 150);
    }
  });

  onMount(async () => {
    const ret = await client.game.getAssetPath();
    swfPath = ret;

    await import("./tipc/tipc-fast-travels");
    await import("./tipc/tipc-follower");
    await import("./tipc/tipc-loader-grabber");
    await import("./tipc/tipc-packet-logger");
    await import("./tipc/tipc-packet-spammer");
  });

  window.addEventListener(
    "gameLoaded",
    async () => {
      config = new Config<HotkeyConfig>({
        configName: "hotkeys",
        cwd: DOCUMENTS_PATH,
        defaults: DEFAULT_HOTKEYS,
      });
      await config.load();
      await loadHotkeysFromConfig();
      setupHotkeyHandlers();
    },
    { once: true },
  );

  onDestroy(() => {
    Mousetrap.reset();
  });

  handlers.hotkeys.updateHotkey.handle(async () => {
    await config?.reload();
    await loadHotkeysFromConfig();
    setupHotkeyHandlers();
  });
</script>

<svelte:window
  on:click={(ev) => {
    const target = ev.target as HTMLElement;

    if (target.closest("[id$='-dropdowncontent']") || target.closest(".group"))
      return;

    openDropdown = null;
  }}
  on:mousedown={(ev) => {
    if ((ev.target as HTMLElement).id === "swf") openDropdown = null;
  }}
  on:keydown={(ev) => {
    const isMac = process.platform === "darwin";
    const isWindows = process.platform === "win32";

    if (
      ((isMac && ev.metaKey) /* cmd */ ||
        (isWindows && ev.ctrlKey)) /* ctrl */ &&
      (ev.target as HTMLElement).id === "swf"
    ) {
      switch (ev.key.toLowerCase()) {
        case "w":
        case "q":
          window.close();
          break;
        case "r":
          if (ev.shiftKey) {
            window.location.reload();
          }

          break;
      }
    }
  }}
  on:beforeunload={async () => {
    await client.scripts.gameReload();
  }}
/>

<main
  class="bg-background-primary m-0 flex h-screen flex-col overflow-hidden text-white focus:outline-none"
>
  {#if topNavVisible}
    <div
      id="topnav-container"
      class="bg-background-primary relative z-[10000] min-h-8 border-b border-gray-800/50 backdrop-blur-sm"
    >
      <div
        id="topnav"
        class="flex w-full flex-row items-center justify-between"
      >
        <div class="flex flex-row items-center">
          <div class="group relative inline-block cursor-pointer">
            <button
              class="rounded-md px-2 py-2 text-xs font-medium transition-all duration-200 hover:bg-gray-700/50"
              onclick={(ev) => {
                ev.stopPropagation();
                toggleDropdown("scripts");
              }}
            >
              Scripts
            </button>
            <div
              class="bg-background-secondary absolute z-[9999] mt-1 min-w-40 rounded-lg border border-gray-700/50 text-xs shadow-2xl backdrop-blur-md"
              style:display={openDropdown === "scripts" ? "block" : "none"}
            >
              <button
                class="
                flex w-full items-center px-4 py-2 text-left text-xs transition-colors duration-150 first:rounded-t-lg hover:bg-gray-700/50"
                onclick={() =>
                  void client.scripts.loadScript({
                    scriptPath: "",
                  })}
              >
                Load
              </button>
              <button
                class={cn(
                  "flex w-full items-center px-4 py-2 text-left text-xs transition-colors duration-150",
                  !scriptState.isLoaded &&
                    "pointers-events-none cursor-not-allowed opacity-50",
                )}
                onclick={toggleScript}
                disabled={!scriptState.isLoaded}
              >
                {scriptState.isRunning ? "Stop" : "Start"}
              </button>
              <button
                class="flex w-full items-center px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
                onclick={() =>
                  (scriptState.showOverlay = !scriptState.showOverlay)}
              >
                {scriptState.showOverlay ? "Hide Overlay" : "Show Overlay"}
              </button>
              <button
                class="flex w-full items-center px-4 py-2 text-left text-xs transition-colors duration-150 last:rounded-b-lg hover:bg-gray-700/50"
                onclick={() => void client.scripts.toggleDevTools()}
              >
                Toggle Dev Tools
              </button>
            </div>
          </div>

          <div
            class="group relative inline-block cursor-pointer"
            id="tools-dropdown"
          >
            <button
              class="rounded-md px-2 py-2 text-xs font-medium transition-all duration-200 hover:bg-gray-700/50"
              id="tools"
              onclick={(ev) => {
                ev.stopPropagation();
                toggleDropdown("tools");
              }}
            >
              Tools
            </button>
            <div
              class="bg-background-secondary absolute z-[9999] mt-1 min-w-40 rounded-lg border border-gray-700/50 text-xs shadow-2xl backdrop-blur-md"
              style:display={openDropdown === "tools" ? "block" : "none"}
              id="tools-dropdowncontent"
            >
              <button
                class="flex w-full items-center px-4 py-2 text-left text-xs transition-colors duration-150 first:rounded-t-lg hover:bg-gray-700/50"
                onclick={() =>
                  void client.game.launchWindow(WindowIds.FastTravels)}
              >
                Fast Travels
              </button>
              <button
                class="flex w-full items-center px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
                onclick={() =>
                  void client.game.launchWindow(WindowIds.LoaderGrabber)}
              >
                Loader/Grabber
              </button>
              <button
                class="flex w-full items-center px-4 py-2 text-left text-xs transition-colors duration-150 last:rounded-b-lg hover:bg-gray-700/50"
                onclick={() =>
                  void client.game.launchWindow(WindowIds.Follower)}
              >
                Follower
              </button>
              <button
                class="flex w-full items-center px-4 py-2 text-left text-xs transition-colors duration-150 last:rounded-b-lg hover:bg-gray-700/50"
                onclick={() => void client.game.launchWindow(WindowIds.Hotkeys)}
              >
                Hotkeys
              </button>
            </div>
          </div>

          <div
            class="group relative inline-block cursor-pointer"
            id="packets-dropdown"
          >
            <button
              class="rounded-md px-2 py-2 text-xs font-medium transition-all duration-200 hover:bg-gray-700/50"
              id="packets"
              onclick={(ev) => {
                ev.stopPropagation();
                toggleDropdown("packets");
              }}
            >
              Packets
            </button>
            <div
              class="bg-background-secondary absolute z-[9999] mt-1 min-w-40 rounded-lg border border-gray-700/50 text-xs shadow-2xl backdrop-blur-md"
              style:display={openDropdown === "packets" ? "block" : "none"}
              id="packets-dropdowncontent"
            >
              <button
                class="flex w-full items-center px-4 py-2 text-left text-xs transition-colors duration-150 first:rounded-t-lg hover:bg-gray-700/50"
                onclick={() =>
                  void client.game.launchWindow(WindowIds.PacketLogger)}
              >
                Logger
              </button>
              <button
                class="flex w-full items-center px-4 py-2 text-left text-xs transition-colors duration-150 last:rounded-b-lg hover:bg-gray-700/50"
                onclick={() =>
                  void client.game.launchWindow(WindowIds.PacketSpammer)}
              >
                Spammer
              </button>
            </div>
          </div>

          <div
            class="group relative inline-block cursor-pointer"
            id="options-dropdown"
          >
            <button
              class="rounded-md px-2 py-2 text-xs font-medium transition-all duration-200 hover:bg-gray-700/50"
              id="options"
              onclick={(ev) => {
                ev.stopPropagation();
                toggleDropdown("options");
              }}
            >
              Options
            </button>
            <div
              class="bg-background-secondary absolute z-[9999] mt-1 min-w-48 rounded-lg border border-gray-700/50 text-xs shadow-2xl backdrop-blur-md"
              style:display={openDropdown === "options" ? "block" : "none"}
              id="options-dropdowncontent"
              role="menu"
              tabindex="0"
            >
              <button
                class="group flex w-full items-center justify-between px-4 py-2 text-left text-xs transition-colors duration-150 first:rounded-t-lg hover:bg-gray-700/50"
                id="option-infinite-range"
                class:option-active={gameState.infiniteRange}
                onclick={() =>
                  (gameState.infiniteRange = !gameState.infiniteRange)}
              >
                <span>Infinite Range</span>
                <IconCheckmark />
              </button>
              <button
                class="flex w-full items-center justify-between px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
                id="option-provoke-map"
                class:option-active={gameState.provokeMap}
                onclick={() => (gameState.provokeMap = !gameState.provokeMap)}
              >
                <span>Provoke Map</span>
                <IconCheckmark />
              </button>
              <button
                class="flex w-full items-center justify-between px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
                id="option-provoke-cell"
                class:option-active={gameState.provokeCell}
                onclick={() => (gameState.provokeCell = !gameState.provokeCell)}
              >
                <span>Provoke Cell</span>
                <IconCheckmark />
              </button>
              <button
                class="flex w-full items-center justify-between px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
                id="option-enemy-magnet"
                class:option-active={gameState.enemyMagnet}
                onclick={() => (gameState.enemyMagnet = !gameState.enemyMagnet)}
              >
                <span>Enemy Magnet</span>
                <IconCheckmark />
              </button>
              <button
                class="flex w-full items-center justify-between px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
                id="option-lag-killer"
                class:option-active={gameState.lagKiller}
                onclick={() => (gameState.lagKiller = !gameState.lagKiller)}
              >
                <span>Lag Killer</span>
                <IconCheckmark />
              </button>
              <button
                class="flex w-full items-center justify-between px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
                id="option-hide-players"
                class:option-active={gameState.hidePlayers}
                onclick={() => (gameState.hidePlayers = !gameState.hidePlayers)}
              >
                <span>Hide Players</span>
                <IconCheckmark />
              </button>
              <button
                class="flex w-full items-center justify-between px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
                id="option-skip-cutscenes"
                class:option-active={gameState.skipCutscenes}
                onclick={() =>
                  (gameState.skipCutscenes = !gameState.skipCutscenes)}
              >
                <span>Skip Cutscenes</span>
                <IconCheckmark />
              </button>
              <button
                class="flex w-full items-center justify-between px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
                id="option-disable-fx"
                class:option-active={gameState.disableFx}
                onclick={() => (gameState.disableFx = !gameState.disableFx)}
              >
                <span>Disable FX</span>
                <IconCheckmark />
              </button>
              <button
                class="flex w-full items-center justify-between px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
                id="option-disable-collisions"
                class:option-active={gameState.disableCollisions}
                onclick={() =>
                  (gameState.disableCollisions = !gameState.disableCollisions)}
              >
                <span>Disable Collisions</span>
                <IconCheckmark />
              </button>
              <div
                class="flex w-full cursor-default items-center justify-between px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
                id="option-walkspeed"
                onclick={(ev) => ev.stopPropagation()}
                onkeydown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    gameState.walkSpeed = Number.parseInt(
                      (ev.target as HTMLInputElement).value,
                    );
                  }
                }}
                role="button"
                tabindex="0"
              >
                <span class="text-white">Walk Speed</span>
                <input
                  type="number"
                  class="walkspeed-input rounded border border-gray-600/50 bg-gray-700/50 px-2 py-1 text-xs text-white transition-all duration-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50"
                  bind:value={gameState.walkSpeed}
                  min="0"
                  max="99"
                  onclick={(ev) => ev.stopPropagation()}
                  onkeydown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault();
                      gameState.walkSpeed = Number.parseInt(
                        (ev.target as HTMLInputElement).value,
                      );
                    }
                  }}
                />
              </div>
              <div
                class="flex w-full cursor-default items-center justify-between px-4 py-2 text-left text-xs transition-colors duration-150 last:rounded-b-lg hover:bg-gray-700/50"
                id="option-fps"
                onclick={(ev) => ev.stopPropagation()}
                onkeydown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    gameState.fps = Number.parseInt(
                      (ev.target as HTMLInputElement).value,
                    );
                  }
                }}
                role="button"
                tabindex="0"
              >
                <span class="text-white">FPS</span>
                <input
                  type="number"
                  class="walkspeed-input rounded border border-gray-600/50 bg-gray-700/50 px-2 py-1 text-xs text-white transition-all duration-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50"
                  bind:value={gameState.fps}
                  min="10"
                  max="120"
                  onclick={(ev) => ev.stopPropagation()}
                />
              </div>
            </div>
          </div>

          <div
            class="group relative inline-block cursor-pointer"
            id="autoaggro-dropdown"
          >
            <button
              class="rounded-md px-2 py-2 text-xs font-medium transition-all duration-200 hover:bg-gray-700/50"
              id="autoaggro"
              onclick={(ev) => {
                ev.stopPropagation();
                toggleDropdown("autoaggro");
              }}
            >
              Auto Aggro
            </button>
            <div
              class="bg-background-secondary absolute z-[9999] mt-1 min-w-40 rounded-lg border border-gray-700/50 text-xs shadow-2xl backdrop-blur-md"
              style:display={openDropdown === "autoaggro" ? "block" : "none"}
              id="autoaggro-dropdowncontent"
            >
              <button
                class="flex w-full items-center justify-between rounded-lg px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
                onclick={() => toggleAutoAggro()}
                class:option-active={autoAggroEnabled}
              >
                <span>Enabled</span>
                <IconCheckmark />
              </button>
            </div>
          </div>
        </div>
        <div class="ml-auto mr-2 flex flex-row items-center">
          <div class="ml-1.5 flex space-x-2">
            <label
              class="mr-1 flex cursor-pointer select-none items-center text-xs text-white"
            >
              <input
                type="checkbox"
                bind:checked={autoEnabled}
                class="bg-background-primary h-4 w-4 rounded border-gray-500/30 focus:outline-none focus:ring-0"
              />
              <span class="ml-1.5">Auto</span>
            </label>
            <div
              class="relative inline-block h-[25px] w-[86px] cursor-pointer"
              id="pads-dropdown"
            >
              <button
                class="bg-background-primary h-full w-full rounded border border-gray-500/30 p-0 text-xs transition-all duration-200 hover:border-gray-400/50"
                class:cursor-not-allowed={!gameConnected}
                class:opacity-50={!gameConnected}
                id="pads"
                disabled={!gameConnected}
                onclick={(ev) => {
                  ev.stopPropagation();
                  updatePads();
                  toggleDropdown("pads");
                }}
              >
                {currentSelectedPad}
              </button>
              <div
                class="bg-background-secondary absolute top-full z-[9999] mt-1 min-w-40 rounded-lg border border-gray-700/50 text-xs shadow-2xl backdrop-blur-md"
                style:display={openDropdown === "pads" ? "block" : "none"}
                id="pads-dropdowncontent"
                onmouseenter={() => (openDropdown = "pads")}
                onmouseleave={() => (openDropdown = null)}
                role="menu"
                tabindex="0"
              >
                {#each validPads as pad}
                  <button
                    class={cn(
                      "bg-background-secondary flex w-full items-center px-4 py-2 text-left transition-colors duration-150 hover:bg-gray-700/50",
                      pad.isValid && "text-green-500 hover:text-green-500",
                    )}
                    class:first:rounded-t-lg={validPads.indexOf(pad) === 0}
                    class:last:rounded-b-lg={validPads.indexOf(pad) ===
                      validPads.length - 1}
                    onclick={() => jumpToPad(pad.name)}
                  >
                    {pad.name}
                  </button>
                {/each}
              </div>
            </div>
            <div
              class="relative inline-block h-[25px] w-[86px] cursor-pointer"
              id="cells-dropdown"
            >
              <button
                class="bg-background-primary h-full w-full rounded border border-gray-500/30 p-0 text-xs transition-all duration-200 hover:border-gray-400/50"
                class:cursor-not-allowed={!gameConnected}
                class:opacity-50={!gameConnected}
                id="cells"
                disabled={!gameConnected}
                onclick={(ev) => {
                  ev.stopPropagation();
                  updateCells();
                  toggleDropdown("cells");
                }}
              >
                {currentSelectedCell}
              </button>
              <div
                class="bg-background-primary absolute top-full z-[9999] mt-1 max-h-[25vh] min-w-40 overflow-y-auto overflow-x-hidden rounded-lg border border-gray-700/50 text-xs shadow-2xl backdrop-blur-md"
                style:display={openDropdown === "cells" ? "block" : "none"}
                id="cells-dropdowncontent"
                onmouseenter={() => (openDropdown = "cells")}
                onmouseleave={() => (openDropdown = null)}
                role="menu"
                tabindex="0"
              >
                {#each availableCells as cell}
                  <button
                    class="flex w-full items-center px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700"
                    class:first:rounded-t-lg={availableCells.indexOf(cell) ===
                      0}
                    class:last:rounded-b-lg={availableCells.indexOf(cell) ===
                      availableCells.length - 1}
                    onclick={() => jumpToCell(cell)}
                  >
                    {cell}
                  </button>
                {/each}
              </div>
            </div>
          </div>
          <div class="ml-1.5 flex space-x-1">
            <button
              class="bg-background-primary mt-[3px] flex h-[25px] min-w-0 items-center justify-center rounded border border-gray-500/30 px-[8px] py-0 text-xs text-white transition-all duration-200 hover:border-gray-400/50"
              class:cursor-not-allowed={!gameConnected}
              class:opacity-50={!gameConnected}
              disabled={!gameConnected}
              onclick={() => {
                if (!bot.player.isReady()) return;

                updateCells();
                updatePads();

                currentSelectedCell = bot.player.cell ?? "Enter";
                currentSelectedPad = bot.player.pad ?? "Spawn";

                bot.flash.call(() =>
                  swf.playerJump(currentSelectedCell, currentSelectedPad),
                );
              }}
            >
              x
            </button>
            <button
              class="bg-background-primary mt-[3px] flex h-[25px] min-w-0 items-center justify-center rounded border border-gray-500/30 px-[8px] py-0 text-xs text-white transition-all duration-200 hover:border-gray-400/50"
              class:cursor-not-allowed={!gameConnected}
              class:opacity-50={!gameConnected}
              disabled={!gameConnected}
              onclick={async () => {
                if (!bot.player.isReady()) return;

                if (bot.bank.isOpen()) {
                  bot.flash.call(() => swf.bankOpen());
                } else {
                  await bot.bank.open();
                }
              }}
            >
              Bank
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <div
    class="bg-background-primary flex min-h-screen flex-col items-center justify-center"
    id="loader-container"
  >
    <div class="w-full max-w-md px-8">
      <div class="space-y-6">
        <div class="flex justify-center">
          <div
            class="border-t-progress-blue h-8 w-8 animate-spin rounded-full border-2 border-gray-600"
          ></div>
        </div>
        <div class="text-center">
          <span id="progress-text" class="text-sm font-medium text-gray-300">
            Loading...
          </span>
        </div>
      </div>
    </div>
  </div>

  <div
    class="invisible relative opacity-0"
    id="game-container"
    style="height: {topNavVisible
      ? 'calc(100vh - var(--topnav-height) - 2px)'
      : '100vh'}"
  >
    {#if swfPath}
      <embed
        id="swf"
        src={`${swfPath}/loader.swf`}
        class="absolute left-0 top-0 h-full w-full rounded-lg shadow-2xl"
      />
    {/if}
  </div>
</main>

<CommandOverlay />

<style>
  :global(:root) {
    --topnav-height: 36px;
    --bg-primary: #111113;
    --bg-secondary: #18191b;
    --accent-blue: #3b82f6;
    --accent-green: #10b981;
    --accent-orange: #f59e0b;
    --border-color: rgba(107, 114, 128, 0.3);
    --hover-bg: rgba(107, 114, 128, 0.1);
  }

  :global(*) {
    user-select: none;
  }

  :global(:focus) {
    outline: none;
  }

  :global(button) {
    display: inline-block;
    padding: 8px 16px;
    vertical-align: middle;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    background-color: inherit;
    text-align: center;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;
  }

  :global(button:hover) {
    background-color: var(--hover-bg) !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  :global([id$="-dropdowncontent"] > button:hover) {
    transform: none;
    box-shadow: none;
  }

  :global(#option-walkspeed:hover, #option-fps:hover) {
    background-color: var(--hover-bg);
  }

  :global(.walkspeed-input) {
    width: 60px;
    height: 24px;
    background-color: rgba(55, 65, 81, 0.5);
    color: white;
    border: 1px solid rgba(107, 114, 128, 0.5);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    transition: all 0.2s ease;
  }

  :global(.walkspeed-input:focus) {
    border-color: var(--accent-blue);
    box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.5);
    background-color: rgba(55, 65, 81, 0.7);
  }

  :global(#topnav > div.ml-auto.mr-2.flex.items-center.gap-4) {
    margin-top: -5px;
  }

  :global(#cells-dropdowncontent),
  :global(#pads-dropdowncontent) {
    position: absolute;
    top: var(--topnav-height);
    margin-top: -6px;
    width: inherit;
    min-width: 160px;
    max-height: 50vh !important;
    height: auto !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    z-index: 1000;
  }

  :global(#cells-dropdowncontent::-webkit-scrollbar),
  :global(#pads-dropdowncontent::-webkit-scrollbar) {
    width: 6px;
  }

  :global(#cells-dropdowncontent::-webkit-scrollbar-track),
  :global(#pads-dropdowncontent::-webkit-scrollbar-track) {
    background: rgba(34, 34, 34, 0.5);
    border-radius: 3px;
  }

  :global(#cells-dropdowncontent::-webkit-scrollbar-thumb),
  :global(#pads-dropdowncontent::-webkit-scrollbar-thumb) {
    background: rgba(85, 85, 85, 0.8);
    border-radius: 3px;
  }

  :global(#cells-dropdowncontent::-webkit-scrollbar-thumb:hover),
  :global(#pads-dropdowncontent::-webkit-scrollbar-thumb:hover) {
    background: rgba(119, 119, 119, 0.9);
  }

  :not(.option-active) .option-checkmark {
    display: none;
  }

  :global(.option-active:hover .option-checkmark) {
    display: block;
  }
</style>
