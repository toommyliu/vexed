<script lang="ts">
  import "./entrypoint";
  import { gameState, scriptState } from "./state.svelte";
  import process from "process";
  import { client, handlers } from "../../shared/tipc";
  import { cn } from "../../shared/";
  import { WindowIds } from "../../shared/constants";
  import { Bot } from "./lib/Bot";

  let openDropdown = $state<string | null>(null);

  let scriptBtnText = $derived(scriptState.isRunning ? "Stop" : "Start");

  let overlayButtonText = $derived(
    scriptState.showOverlay ? "Hide Overlay" : "Show Overlay",
  );

  let autoAggroEnabled = $state(false);

  let gameConnected = $state(true);

  // UI state
  let topNavVisible = $state(false);

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

  handlers.scriptLoaded.listen((fromManager) => {
    scriptState.isLoaded = true;

    window.context.overlay.updateCommands(
      window.context.commands,
      window.context.commandIndex,
    );
    window.context.overlay.show();
    scriptState.showOverlay = true;

    // Auto start script if loaded from manager
    if (
      fromManager &&
      window.context.commands.length &&
      !window.context.isRunning()
    ) {
      startScript();
    }

    window.context.overlay.on(
      "display",
      (visible) => (scriptState.showOverlay = visible),
    );
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

  $effect(() => {
    if (!window.context?.overlay) return;

    if (scriptState.showOverlay) window.context.overlay.show();
    else window.context.overlay.hide();
  });

  handlers.doFastTravel.handle(async ({ location }) => {
    const bot = Bot.getInstance();
    if (!bot.player.isReady()) return;

    await bot.world.join(
      `${location.map}-${location.roomNumber}`,
      location.cell,
      location.pad,
    );
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
/>

<main
  class="m-0 flex h-screen flex-col overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white focus:outline-none"
>
  <div
    id="topnav-container"
    class="relative z-[10000] min-h-8 border-b border-gray-800/50 bg-gradient-to-r from-[#111113] to-[#1a1a1c] backdrop-blur-sm"
    class:invisible={!topNavVisible}
    class:opacity-0={!topNavVisible}
  >
    <div id="topnav" class="flex w-full flex-wrap items-center">
      <div class="flex">
        <!-- Scripts Dropdown -->
        <div class="group relative inline-block cursor-pointer">
          <button
            class="mx-1 rounded-md px-4 py-2 text-xs font-medium transition-all duration-200 hover:bg-gray-700/50 hover:shadow-lg"
            onclick={(ev) => {
              ev.stopPropagation();
              toggleDropdown("scripts");
            }}
          >
            Scripts
          </button>
          <div
            class="absolute z-[9999] mt-1 min-w-40 rounded-lg border border-gray-700/50 bg-gray-800/95 text-xs shadow-2xl backdrop-blur-md"
            style:display={openDropdown === "scripts" ? "block" : "none"}
          >
            <button
              class="
                flex w-full items-center px-4 py-2 text-left text-xs transition-colors duration-150 first:rounded-t-lg hover:bg-gray-700/50"
              onclick={() =>
                void client.loadScript({
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
              {scriptBtnText}
            </button>
            <button
              class="flex w-full items-center px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
              onclick={() =>
                (scriptState.showOverlay = !scriptState.showOverlay)}
            >
              {overlayButtonText}
            </button>
            <button
              class="flex w-full items-center px-4 py-2 text-left text-xs transition-colors duration-150 last:rounded-b-lg hover:bg-gray-700/50"
              onclick={() => void client.toggleDevTools()}
            >
              Toggle Dev Tools
            </button>
          </div>
        </div>

        <!-- Tools Dropdown -->
        <div
          class="group relative inline-block cursor-pointer"
          id="tools-dropdown"
        >
          <button
            class="mx-1 rounded-md px-4 py-2 text-xs font-medium transition-all duration-200 hover:bg-gray-700/50 hover:shadow-lg"
            id="tools"
            onclick={(e) => {
              e.stopPropagation();
              toggleDropdown("tools");
            }}
          >
            Tools
          </button>
          <div
            class="absolute z-[9999] mt-1 min-w-40 rounded-lg border border-gray-700/50 bg-gray-800/95 text-xs shadow-2xl backdrop-blur-md"
            style:display={openDropdown === "tools" ? "block" : "none"}
            id="tools-dropdowncontent"
          >
            <button
              class="flex w-full items-center px-4 py-2 text-left text-xs transition-colors duration-150 first:rounded-t-lg hover:bg-gray-700/50"
              onclick={() => void client.launchWindow(WindowIds.FastTravels)}
            >
              Fast Travels
            </button>
            <button
              class="flex w-full items-center px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
              onclick={() => void client.launchWindow(WindowIds.LoaderGrabber)}
            >
              Loader/Grabber
            </button>
            <button
              class="flex w-full items-center px-4 py-2 text-left text-xs transition-colors duration-150 last:rounded-b-lg hover:bg-gray-700/50"
              onclick={() => void client.launchWindow(WindowIds.Follower)}
            >
              Follower
            </button>
          </div>
        </div>

        <!-- Packets Dropdown -->
        <div
          class="group relative inline-block cursor-pointer"
          id="packets-dropdown"
        >
          <button
            class="mx-1 rounded-md px-4 py-2 text-xs font-medium transition-all duration-200 hover:bg-gray-700/50 hover:shadow-lg"
            id="packets"
            onclick={(e) => {
              e.stopPropagation();
              toggleDropdown("packets");
            }}
          >
            Packets
          </button>
          <div
            class="absolute z-[9999] mt-1 min-w-40 rounded-lg border border-gray-700/50 bg-gray-800/95 text-xs shadow-2xl backdrop-blur-md"
            style:display={openDropdown === "packets" ? "block" : "none"}
            id="packets-dropdowncontent"
          >
            <button
              class="flex w-full items-center px-4 py-2 text-left text-xs transition-colors duration-150 first:rounded-t-lg hover:bg-gray-700/50"
              onclick={() => void client.launchWindow(WindowIds.PacketLogger)}
            >
              Logger
            </button>
            <button
              class="flex w-full items-center px-4 py-2 text-left text-xs transition-colors duration-150 last:rounded-b-lg hover:bg-gray-700/50"
              onclick={() => void client.launchWindow(WindowIds.PacketSpammer)}
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
            class="mx-1 rounded-md px-4 py-2 text-xs font-medium transition-all duration-200 hover:bg-gray-700/50 hover:shadow-lg"
            id="options"
            onmouseenter={() => (openDropdown = "options")}
          >
            Options
          </button>
          <div
            class="absolute z-[9999] mt-1 min-w-48 rounded-lg border border-gray-700/50 bg-gray-800/95 text-xs shadow-2xl backdrop-blur-md"
            style:display={openDropdown === "options" ? "block" : "none"}
            id="options-dropdowncontent"
            onmouseenter={() => (openDropdown = "options")}
            onmouseleave={() => (openDropdown = null)}
          >
            <button
              class="group flex w-full items-center justify-between px-4 py-2 text-left text-xs transition-colors duration-150 first:rounded-t-lg hover:bg-gray-700/50"
              id="option-infinite-range"
              class:option-active={gameState.infiniteRange}
              onclick={() =>
                (gameState.infiniteRange = !gameState.infiniteRange)}
            >
              <span>Infinite Range</span>
              {@render OptionCheckmark()}
            </button>
            <button
              class="flex w-full items-center justify-between px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
              id="option-provoke-map"
              class:option-active={gameState.provokeMap}
              onclick={() => (gameState.provokeMap = !gameState.provokeMap)}
            >
              <span>Provoke Map</span>
              {@render OptionCheckmark()}
            </button>
            <button
              class="flex w-full items-center justify-between px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
              id="option-provoke-cell"
              class:option-active={gameState.provokeCell}
              onclick={() => (gameState.provokeCell = !gameState.provokeCell)}
            >
              <span>Provoke Cell</span>
              {@render OptionCheckmark()}
            </button>
            <button
              class="flex w-full items-center justify-between px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
              id="option-enemy-magnet"
              class:option-active={gameState.enemyMagnet}
              onclick={() => (gameState.enemyMagnet = !gameState.enemyMagnet)}
            >
              <span>Enemy Magnet</span>
              {@render OptionCheckmark()}
            </button>
            <button
              class="flex w-full items-center justify-between px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
              id="option-lag-killer"
              class:option-active={gameState.lagKiller}
              onclick={() => (gameState.lagKiller = !gameState.lagKiller)}
            >
              <span>Lag Killer</span>
              {@render OptionCheckmark()}
            </button>
            <button
              class="flex w-full items-center justify-between px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
              id="option-hide-players"
              class:option-active={gameState.hidePlayers}
              onclick={() => (gameState.hidePlayers = !gameState.hidePlayers)}
            >
              <span>Hide Players</span>
              {@render OptionCheckmark()}
            </button>
            <button
              class="flex w-full items-center justify-between px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
              id="option-skip-cutscenes"
              class:option-active={gameState.skipCutscenes}
              onclick={() =>
                (gameState.skipCutscenes = !gameState.skipCutscenes)}
            >
              <span>Skip Cutscenes</span>
              {@render OptionCheckmark()}
            </button>
            <button
              class="flex w-full items-center justify-between px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
              id="option-disable-fx"
              class:option-active={gameState.disableFx}
              onclick={() => (gameState.disableFx = !gameState.disableFx)}
            >
              <span>Disable FX</span>
              {@render OptionCheckmark()}
            </button>
            <button
              class="flex w-full items-center justify-between px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
              id="option-disable-collisions"
              class:option-active={gameState.disableCollisions}
              onclick={() =>
                (gameState.disableCollisions = !gameState.disableCollisions)}
            >
              <span>Disable Collisions</span>
              {@render OptionCheckmark()}
            </button>
            <div
              class="flex w-full cursor-default items-center justify-between px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
              id="option-walkspeed"
              onclick={(ev) => ev.stopPropagation()}
            >
              <span class="text-white">Walk Speed</span>
              <input
                type="number"
                class="walkspeed-input rounded border border-gray-600/50 bg-gray-700/50 px-2 py-1 text-xs text-white transition-all duration-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50"
                bind:value={gameState.walkSpeed}
                min="0"
                max="99"
                onclick={(ev) => ev.stopPropagation()}
              />
            </div>
            <div
              class="flex w-full cursor-default items-center justify-between px-4 py-2 text-left text-xs transition-colors duration-150 last:rounded-b-lg hover:bg-gray-700/50"
              id="option-fps"
              onclick={(ev) => ev.stopPropagation()}
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
            class="mx-1 rounded-md px-4 py-2 text-xs font-medium transition-all duration-200 hover:bg-gray-700/50 hover:shadow-lg"
            id="autoaggro"
            onclick={(e) => {
              e.stopPropagation();
              toggleDropdown("autoaggro");
            }}
          >
            Auto Aggro
          </button>
          <div
            class="absolute z-[9999] mt-1 min-w-40 rounded-lg border border-gray-700/50 bg-gray-800/95 text-xs shadow-2xl backdrop-blur-md"
            style:display={openDropdown === "autoaggro" ? "block" : "none"}
            id="autoaggro-dropdowncontent"
          >
            <button
              class="flex w-full items-center justify-between rounded-lg px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-gray-700/50"
              onclick={() => {
                autoAggroEnabled = !autoAggroEnabled;
                console.log(`Auto Aggro enabled: ${autoAggroEnabled}`);
              }}
              class:option-active={autoAggroEnabled}
            >
              <span>Enabled</span>
              {@render OptionCheckmark()}
            </button>
          </div>
        </div>
      </div>
      <div class="ml-auto mr-2 flex items-center gap-4">
        <div class="ml-1.5 flex gap-1">
          <div
            class="relative mt-1.5 inline-block h-[25px] w-[86px] cursor-pointer"
            id="pads-dropdown"
          >
            <button
              class="h-full w-full rounded border border-gray-500/30 bg-gray-800/50 p-0 text-xs transition-all duration-200 hover:border-gray-400/50"
              class:cursor-not-allowed={!gameConnected}
              class:opacity-50={!gameConnected}
              id="pads"
              disabled={!gameConnected}
              onclick={(e) => {
                e.stopPropagation();
                console.log("Pads button clicked");
                toggleDropdown("pads");
              }}
            >
            </button>
            <div
              class="absolute top-8 text-xs"
              style:display={openDropdown === "pads" ? "block" : "none"}
              id="pads-dropdowncontent"
            >
              <!-- Pads will be populated dynamically -->
            </div>
          </div>
          <div
            class="relative ml-0.5 mt-1.5 inline-block h-[25px] w-[86px] cursor-pointer"
            id="cells-dropdown"
          >
            <button
              class="h-full w-full rounded border border-gray-500/30 bg-gray-800/50 p-0 text-xs transition-all duration-200 hover:border-gray-400/50"
              class:cursor-not-allowed={!gameConnected}
              class:opacity-50={!gameConnected}
              id="cells"
              disabled={!gameConnected}
              onclick={(e) => {
                e.stopPropagation();
                console.log("Cells button clicked");
                toggleDropdown("cells");
              }}
            >
            </button>
            <div
              class="absolute top-8 text-xs"
              class:display={openDropdown === "cells" ? "block" : "none"}
              id="cells-dropdowncontent"
            ></div>
          </div>
        </div>
        <div class="ml-1.5 flex gap-1">
          <button
            class="mt-[5px] flex h-[25px] min-w-0 items-center justify-center rounded border border-gray-500/30 bg-gray-800/50 px-[8px] py-0 text-xs text-white transition-all duration-200 hover:border-gray-400/50"
            class:cursor-not-allowed={!gameConnected}
            class:opacity-50={!gameConnected}
            id="x"
            disabled={!gameConnected}
            onclick={() => {
              console.log("x button clicked");
            }}
          >
            x
          </button>
          <button
            class="mt-[5px] flex h-[25px] min-w-0 items-center justify-center rounded border border-gray-500/30 bg-gray-800/50 px-[8px] py-0 text-xs text-white transition-all duration-200 hover:border-gray-400/50"
            class:cursor-not-allowed={!gameConnected}
            class:opacity-50={!gameConnected}
            id="bank"
            disabled={!gameConnected}
            onclick={() => {
              console.log("Bank button clicked");
            }}
          >
            Bank
          </button>
        </div>
      </div>
    </div>
  </div>

  <div
    class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900"
    id="loader-container"
  >
    <div class="w-full max-w-md px-8">
      <div class="space-y-4">
        <div
          class="flex h-2 w-full overflow-hidden rounded-full bg-gray-800/80 shadow-inner"
        >
          <div
            class="h-full w-0 rounded-full bg-gradient-to-r from-gray-600 to-gray-500 transition-all duration-300 ease-out"
            id="progress-bar"
            style="box-shadow: 0 0 4px rgba(59, 130, 246, 0.15)"
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
    class="invisible opacity-0 transition-all duration-300"
    id="game-container"
  >
    <embed
      id="swf"
      src="../../assets/loader.swf"
      class="absolute left-0 top-0 h-full w-full rounded-lg shadow-2xl"
    />
  </div>
</main>

{#snippet OptionCheckmark()}
  <div
    class="option-checkmark"
    style="background-color: transparent !important; isolation: isolate; position: relative; z-index: 1;"
  >
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="h-4 w-4 text-green-400"
    >
      <path
        d="M5 10.5l4 4 6-8"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </div>
{/snippet}

<style>
  :not(.option-active) .option-checkmark {
    display: none;
  }

  .option-active:hover .option-checkmark {
    display: block;
  }
</style>
