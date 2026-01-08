<script lang="ts">
  import Config from "@vexed/config";
  import { interval } from "@vexed/utils";
  import log from "electron-log";
  import Mousetrap from "mousetrap";
  import { onDestroy, onMount } from "svelte";

  import { cn } from "~/shared/cn";
  import {
    DEFAULT_HOTKEYS,
    DOCUMENTS_PATH,
    IS_MAC,
    IS_WINDOWS,
  } from "~/shared/constants";
  import { client, handlers } from "~/shared/tipc";
  import type { HotkeyConfig } from "~/shared/types";
  import { WindowIds } from "~/shared/types";
  import type { HotkeySection } from "../application/hotkeys/types";
  import {
    createHotkeyConfig,
    isValidHotkey,
  } from "../application/hotkeys/utils";
  import "./entrypoint";
  import { Bot } from "./lib/Bot";
  import { AutoReloginJob } from "./lib/jobs/autorelogin";
  import {
    appState,
    autoReloginState,
    commandOverlayState,
    gameState,
    optionsPanelState,
    scriptState,
  } from "./state.svelte";
  import { parseSkillString } from "./util/skillParser";

  import CommandOverlay from "./components/CommandOverlay.svelte";
  import CommandPalette from "./components/CommandPalette.svelte";
  import OptionsPanel from "./components/OptionsPanel.svelte";
  import WindowsMegaMenu from "./components/WindowsMegaMenu.svelte";
 
  import { Button, Checkbox, Label } from "@vexed/ui";
  import Kbd from "@vexed/ui/Kbd";
  import * as Menu from "@vexed/ui/Menu";
  import Play from "lucide-svelte/icons/play";
  import Square from "lucide-svelte/icons/square";

  const logger = log.scope("game/app");

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

  let autoEnabled = $state(false);

  let gameConnected = $state(false);
  bot.on("login", () => (gameConnected = true));
  bot.on("logout", () => (gameConnected = false));

  let reloginServers = $state<string[]>([]);
  let reloginUsername = $derived(bot.auth?.username ?? "");
  let reloginPassword = $derived(bot.auth?.password ?? "");
  let reloginCanEnable = $derived(
    Boolean(reloginUsername && reloginPassword) ||
    Boolean(autoReloginState.username && autoReloginState.password)
  );

  function updateReloginServers() {
    try {
      reloginServers = (bot.auth?.servers ?? []).map((s) => s.name);
    } catch {
      reloginServers = [];
    }
  }

  function enableRelogin(server: string) {
    if (!reloginUsername || !reloginPassword) return;
    autoReloginState.enable(reloginUsername, reloginPassword, server);
    AutoReloginJob.resetForNewCredentials();
  }

  function disableRelogin() {
    autoReloginState.disable();
  }

  let topNavVisible = $state(true);
  let commandPaletteOpen = $state(false);
  let hotkeyValues = $state<Record<string, string>>({});

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
    if (!bot.player.isReady()) return;

    const capturedRoomId = bot.world.roomId;
    if (capturedRoomId === prevRoomId) return;

    const cells = bot.world.cells || [];
    const cell = bot.player.cell || "";

    if (bot.world.roomId !== capturedRoomId) return;

    availableCells = cells;
    currentSelectedCell = cell;
    prevRoomId = capturedRoomId;
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
    if (!config) return;

    // Unbind all
    Mousetrap.reset();

    const newHotkeyValues: Record<string, string> = {};

    try {
      for (const section of hotkeysSections) {
        for (const item of section.items) {
          const hotkeyValue = config.get(item.configKey as any, "")! as string;
          item.value = "";

          if (hotkeyValue && isValidHotkey(hotkeyValue)) {
            item.value = hotkeyValue;
            newHotkeyValues[item.id] = hotkeyValue;
          }
        }
      }

      hotkeyValues = newHotkeyValues;
    } catch (error) {
      logger.error("Failed to load hotkeys from config.", error);
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

  function handleHotkeyAction(actionId: string) {
    switch (actionId) {
      case "toggle-autoattack":
        autoEnabled = !autoEnabled;
        break;

      case "toggle-bank":
        toggleBank();
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

      case "open-app-logs":
        void client.game.launchWindow(WindowIds.AppLogs);
        break;

      case "open-environment":
        void client.game.launchWindow(WindowIds.Environment);
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

      case "toggle-options-panel":
        optionsPanelState.toggle();
        break;

      case "toggle-infinite-range":
        gameState.infiniteRange = !gameState.infiniteRange;
        break;

      case "toggle-provoke-cell":
        gameState.provokeCell = !gameState.provokeCell;
        break;

      case "toggle-enemy-magnet":
        gameState.enemyMagnet = !gameState.enemyMagnet;
        break;

      case "toggle-lag-killer":
        gameState.lagKiller = !gameState.lagKiller;
        break;

      case "toggle-hide-players":
        gameState.hidePlayers = !gameState.hidePlayers;
        break;

      case "toggle-skip-cutscenes":
        gameState.skipCutscenes = !gameState.skipCutscenes;
        break;

      case "toggle-disable-fx":
        gameState.disableFx = !gameState.disableFx;
        break;

      case "toggle-disable-collisions":
        gameState.disableCollisions = !gameState.disableCollisions;
        break;

      case "toggle-anti-counter":
        gameState.counterAttack = !gameState.counterAttack;
        break;

      case "toggle-disable-death-ads":
        gameState.disableDeathAds = !gameState.disableDeathAds;
        break;
    }
  }

  $effect(() => {
    if (autoEnabled) {
      const currentCls = bot.player.className;

      const skillSet =
        appState.skillSets?.get(currentCls) ?? parseSkillString("1;2;3;4|150");
      const skillList = skillSet.skills;
      let idx = 0;

      void interval(async (_, stop) => {
        if (!autoEnabled) {
          stop();
          return;
        }

        if (!bot.player.isReady()) return;
        if (bot.world.availableMonsters.length) {
          if (!bot.combat.hasTarget()) bot.combat.attack("*");

          const skill = skillList[idx];
          if (skill) {
            const skillIndex = skill.index;
            let shouldCast = true;

            if (skill.isHp || skill.isMp) {
              const currPercentage = skill.isHp
                ? bot.player.hpPercentage
                : bot.player.mpPercentage;
              const value = skill.value!;

              shouldCast =
                {
                  ">": currPercentage > value,
                  ">=": currPercentage >= value,
                  "<": currPercentage < value,
                  "<=": currPercentage <= value,
                }[skill.operator!] ?? true;
            }

            if (shouldCast)
              await bot.combat.useSkill(skillIndex, true, skill.isWait);
            idx = (idx + 1) % skillList.length;
          }
        }
      }, skillSet.delay ?? 150);
    }
  });

  onMount(async () => {
    config = new Config<HotkeyConfig>({
      configName: "hotkeys",
      cwd: DOCUMENTS_PATH,
      defaults: DEFAULT_HOTKEYS,
    });
    await config.load();
    await loadHotkeysFromConfig();
    setupHotkeyHandlers();

    const ret = await client.game.getAssetPath();
    swfPath = ret;

    window.addEventListener("openCommandPalette", () => {
      commandPaletteOpen = true;
    });

    await Promise.all([
      import("./tipc/tipc-fast-travels"),
      import("./tipc/tipc-environment"),
      import("./tipc/tipc-follower"),
      import("./tipc/tipc-loader-grabber"),
      import("./tipc/tipc-packet-logger"),
      import("./tipc/tipc-packet-spammer"),
    ]);

    const globalSettings = await client.onboarding.getSettings();
    if (globalSettings.fallbackServer) {
      autoReloginState.fallbackServer = globalSettings.fallbackServer;
    }
  });

  window.addEventListener(
    "gameLoaded",
    async () => {
      const skillSets = await client.game.getSkillSets();

      for (const [className, skillList] of Object.entries(skillSets)) {
        const res = parseSkillString(skillList);
        if (res) appState.skillSets.set(className.toUpperCase(), res);
      }

      try {
        const state = await client.environment.getState();
        bot.environment.applyUpdate({
          questIds: state.questIds,
          itemNames: state.itemNames,
          boosts: state.boosts,
          rejectElse: state.rejectElse,
          autoRegisterRequirements: state.autoRegisterRequirements,
          autoRegisterRewards: state.autoRegisterRewards,
        });
      } catch (error) {
        logger.error("Failed to sync environment.", error);
      }
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
  handlers.hotkeys.reloadHotkeys.handle(async () => {
    await config?.reload();
    await loadHotkeysFromConfig();
    setupHotkeyHandlers();
  });
</script>

<svelte:window
  on:mousedown={(ev) => {
    if ((ev.target as HTMLElement).id === "swf") openDropdown = null;
  }}
  on:keydown={(ev) => {
    if (
      ((IS_MAC && ev.metaKey) /* cmd */ ||
        (IS_WINDOWS && ev.ctrlKey)) /* ctrl */ &&
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
  class="m-0 flex h-screen flex-col overflow-hidden bg-background text-foreground focus:outline-none"
>
  {#if topNavVisible}
    <div
      id="topnav-container"
      class="relative z-[10000] flex h-9 items-center border-b border-border/50 bg-background/95 backdrop-blur-md"
    >
      <div
        id="topnav"
        class="flex h-full w-full flex-row items-center gap-0.5 px-1">
        <div
          class="group relative inline-flex h-full cursor-pointer items-center"
          id="windows-dropdown"
        >
          <button
            class="flex h-7 shrink-0 items-center rounded bg-transparent px-2.5 text-[13px] font-medium text-foreground/80 transition-colors duration-150 hover:bg-accent hover:text-foreground"
            id="windows"
            onclick={(ev) => {
              ev.stopPropagation();
              toggleDropdown("windows");
            }}
          >
            Windows
          </button>
          <WindowsMegaMenu
            open={openDropdown === "windows"}
            onClose={() => (openDropdown = null)}
            {hotkeyValues}
          />
        </div>

        <div class="flex h-full flex-row items-center">
          <Menu.Root
            open={openDropdown === "scripts"}
            onOpenChange={(open) => (openDropdown = open ? "scripts" : null)}
            class="flex h-full items-center"
          >
            <Menu.Trigger class="flex h-7 shrink-0 items-center rounded bg-transparent px-2.5 text-[13px] font-medium text-foreground/80 transition-colors duration-150 hover:bg-accent hover:text-foreground">
              Scripts
            </Menu.Trigger>
            <Menu.Content class="min-w-48 text-[13px]">
              <Menu.Item class="bg-transparent flex items-center justify-between" onclick={() => void client.scripts.loadScript({ scriptPath: "" })}>
                <span>Load Script</span>
                <Kbd hotkey={hotkeyValues["load-script"] ?? ""} class="ml-4" />
              </Menu.Item>
              <Menu.Item class="bg-transparent flex items-center justify-between" onclick={() => commandOverlayState.toggle()}>
                <span>{scriptState.showOverlay ? "Hide Overlay" : "Show Overlay"}</span>
                <Kbd hotkey={hotkeyValues["toggle-command-overlay"] ?? ""} class="ml-4" />
              </Menu.Item>
              <Menu.Item class="bg-transparent flex items-center justify-between" onclick={() => void client.scripts.toggleDevTools()}>
                <span>Dev Tools</span>
                <Kbd hotkey={hotkeyValues["toggle-dev-tools"] ?? ""} class="ml-4" />
              </Menu.Item>
            </Menu.Content>
          </Menu.Root>

          <button
            class="flex h-7 shrink-0 items-center gap-1.5 rounded bg-transparent px-2.5 text-[13px] font-medium text-foreground/80 transition-colors duration-150 hover:bg-accent hover:text-foreground"
            onclick={() => optionsPanelState.toggle()}
              >
            <span>Options</span>
          </button>

          <Menu.Root
            open={openDropdown === "relogin"}
            onOpenChange={(open) => {
              if (open) {
                updateReloginServers();
                openDropdown = "relogin";
              } else {
                openDropdown = null;
              }
            }}
            class="flex h-full items-center"
          >
            <Menu.Trigger
              class={cn(
                "flex h-7 shrink-0 items-center gap-1.5 rounded bg-transparent px-2.5 text-[13px] font-medium transition-all duration-200 hover:bg-accent",
                autoReloginState.enabled
                  ? "text-emerald-400"
                  : "text-foreground/80 hover:text-foreground"
              )}
            >
              <span>Auto Relogin</span>
            </Menu.Trigger>
            <Menu.Content class="w-52 text-[13px]">
              {#if autoReloginState.enabled}
                <div class="px-2 py-1.5 text-xs text-muted-foreground/70 flex items-center gap-2">
                  Username: {autoReloginState.username}
                </div>
                <div class="px-2 py-1.5 text-xs text-muted-foreground/70 flex items-center gap-2">
                  Server: {autoReloginState.server}
                </div>
                <div class="px-2 py-1.5 text-xs text-muted-foreground/70 flex items-center gap-2">
                  Fallback: {autoReloginState.fallbackServer || "Auto"}
                </div>
                <div class="px-2 py-1.5 flex items-center justify-between gap-2">
                  <span class="text-xs text-muted-foreground/70">Delay:</span>
                  <div class="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      class="w-12 h-5 px-1 text-xs text-center rounded border border-border/60 bg-background text-foreground focus:outline-none focus:border-emerald-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={autoReloginState.delay / 1000}
                      onchange={(ev) => {
                        const val = Math.max(1, Math.min(60, Number(ev.currentTarget.value) || 5));
                        autoReloginState.delay = val * 1000;
                        ev.currentTarget.value = String(val);
                      }}
                    />
                    <span class="text-xs text-muted-foreground/70">s</span>
                  </div>
                </div>
                <Menu.Item class="bg-transparent text-red-400 hover:text-red-300" onclick={disableRelogin}>
                  Disable
                </Menu.Item>
              {:else if autoReloginState.username && autoReloginState.password}
                <div class="px-2 py-1.5 text-xs text-muted-foreground/70 flex items-center gap-2">
                  Username: {autoReloginState.username}
                </div>
                <Menu.Separator />
                <Menu.Label class="text-[11px] text-muted-foreground/70 uppercase tracking-wider px-2 py-1.5">
                  Enable for server
                </Menu.Label>
                <div class="max-h-52 overflow-y-auto pr-1">
                  {#each reloginServers as server}
                    <Menu.Item 
                      class={cn(
                        "bg-transparent hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors",
                        server === autoReloginState.server && "text-emerald-400"
                      )}
                      onclick={() => {
                        autoReloginState.server = server;
                        autoReloginState.enabled = true;
                        AutoReloginJob.resetForNewCredentials();
                      }}
                    >
                      {server}{server === autoReloginState.server ? " (last)" : ""}
                    </Menu.Item>
                  {/each}
                </div>
                <Menu.Separator />
                <Menu.Item 
                  class="bg-transparent text-muted-foreground hover:text-foreground"
                  onclick={() => autoReloginState.reset()}
                >
                  Clear Credentials
                </Menu.Item>
              {:else if !reloginCanEnable}
                <div class="px-3 py-3 text-center">
                  <div class="text-muted-foreground/60 text-xs">Log in to enable</div>
                </div>
              {:else}
                <Menu.Label class="text-[11px] text-muted-foreground/70 uppercase tracking-wider px-2 py-1.5">
                  Enable for server
                </Menu.Label>
                <div class="max-h-52 overflow-y-auto pr-1">
                  {#each reloginServers as server}
                    <Menu.Item 
                      class="bg-transparent hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"
                      onclick={() => enableRelogin(server)}
                    >
                      {server}
                    </Menu.Item>
                  {/each}
                </div>
              {/if}
            </Menu.Content>
          </Menu.Root>

          <button
            class={cn(
              "ml-0.5 flex h-6 shrink-0 items-center gap-1 rounded px-2 text-[12px] font-medium transition-colors duration-150",
              !scriptState.isLoaded && "cursor-not-allowed opacity-40",
              scriptState.isLoaded && !scriptState.isRunning && "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30",
              scriptState.isRunning && "bg-amber-600/20 text-amber-400 hover:bg-amber-600/30"
            )}
            disabled={!scriptState.isLoaded}
            onclick={toggleScript}
          >
            {#if scriptState.isRunning}
              <Square class="size-2.5" />
              <span>Stop</span>
            {:else}
              <Play class="size-2.5" />
              <span>Run</span>
            {/if}
          </button>
        </div>

        <div class="ml-auto flex h-full shrink-0 items-center gap-1 pr-1.5">
          <Label class="flex cursor-pointer select-none items-center gap-1.5 text-[12px] text-foreground/70 transition-colors hover:text-foreground">
            <Checkbox bind:checked={autoEnabled} />
            <span>Auto</span>
          </Label>
          <div class="ml-0.5 h-4 w-px bg-border/60"></div>
          <div class="flex items-center gap-1">
            <Menu.Root
              open={openDropdown === "pads"}
              onOpenChange={(open) => {
                if (open) {
                  updatePads();
                  openDropdown = "pads";
                } else {
                  openDropdown = null;
                }
              }}
              class="h-6 w-20"
            >
              <Menu.Trigger
                class="flex h-full w-full items-center justify-between rounded border border-border/60 bg-background px-2 text-[12px] text-foreground/80 transition-colors duration-150 hover:border-border hover:bg-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!gameConnected}
              >
                {currentSelectedPad}
              </Menu.Trigger>
              <Menu.Content align="end" class="min-w-40 text-[12px]">
                {#each validPads as pad}
                  <Menu.Item
                    class={cn("bg-transparent", pad.isValid && pad.name !== currentSelectedPad && "text-emerald-400", pad.name === currentSelectedPad && "bg-accent/50 text-primary font-medium")}
                    onclick={() => jumpToPad(pad.name)}
                  >
                    {pad.name}
                  </Menu.Item>
                {/each}
              </Menu.Content>
            </Menu.Root>
            <Menu.Root
              open={openDropdown === "cells"}
              onOpenChange={(open) => {
                if (open) {
                  updateCells();
                  openDropdown = "cells";
                } else {
                  openDropdown = null;
                }
              }}
              class="h-6 w-20"
            >
              <Menu.Trigger
                class="flex h-full w-full items-center justify-between rounded border border-border/60 bg-background px-2 text-[12px] text-foreground/80 transition-colors duration-150 hover:border-border hover:bg-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!gameConnected}
              >
                {currentSelectedCell}
              </Menu.Trigger>
              <Menu.Content align="end" class="max-h-[25vh] min-w-40 overflow-y-auto text-[12px]">
                {#each availableCells as cell}
                  <Menu.Item class={cn("bg-transparent", cell === currentSelectedCell && "bg-accent/50 text-primary font-medium")} onclick={() => jumpToCell(cell)}>
                    {cell}
                  </Menu.Item>
                {/each}
              </Menu.Content>
            </Menu.Root>
          </div>
          <div class="ml-0.5 h-4 w-px bg-border/60"></div>
          <Button
            variant="ghost"
            size="xs"
            class="h-6 px-2 text-[12px] text-foreground/70 hover:text-foreground"
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
          </Button>
        </div>
      </div>
    </div>
  {/if}

  <div
    class="flex min-h-screen flex-col items-center justify-center bg-background-primary"
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
    class="invisible relative flex-1 opacity-0"
    id="game-container"
  >
    {#if swfPath}
      <embed
        id="swf"
        src={`${swfPath}/loader.swf`}
        class="absolute left-0 top-0 h-full w-full"
      />
    {/if}
  </div>
</main>

<CommandOverlay />
<CommandPalette
  bind:open={commandPaletteOpen}
  scriptLoaded={scriptState.isLoaded}
  scriptRunning={scriptState.isRunning}
  onToggleScript={toggleScript}
  onLoadScript={() => void client.scripts.loadScript({ scriptPath: "" })}
  onToggleOverlay={() => commandOverlayState.toggle()}
  {hotkeyValues}
/>
<OptionsPanel {hotkeyValues} />

<style>
  :global(:root) {
    --topnav-height: 36px;
  }
</style>
