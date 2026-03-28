<script lang="ts">
  import "./entrypoint";
  import "./hotkeys";

  import { Result } from "better-result";
  import { interval } from "@vexed/utils";
  import { onMount } from "svelte";

  import { client, handlers } from "~/shared/tipc";

  import { executeAction, loadScript, toggleScript } from "./actions";
  import { Bot } from "./lib/Bot";
  import { AutoReloginJob } from "./lib/jobs/autorelogin";
  import {
    appState,
    autoReloginState,
    commandOverlayState,
    gameState,
    hotkeyState,
    scriptState,
  } from "./state/index.svelte";
  import { platform } from "./state/platform.svelte";
  import { gameLoaded } from "./state/app.svelte";
  import { parseSkillSetJson, type SkillSetJson } from "./util/skillParser";

  import { Button, Checkbox, Label, Icon, Kbd, Menu } from "@vexed/ui";
  import { cn } from "@vexed/ui/util";
  import CommandOverlay from "./components/CommandOverlay.svelte";
  import CommandPalette from "./components/CommandPalette.svelte";
  import OptionsPanel from "./components/OptionsPanel.svelte";
  import WindowsMegaMenu from "./components/WindowsMegaMenu.svelte";

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

  let openDropdown = $state<string | null>(null);

  let gameConnected = $state(false);
  bot.on("login", () => (gameConnected = true));
  bot.on("logout", () => (gameConnected = false));

  let reloginServers = $state<string[]>([]);
  const reloginUsername = $derived(bot.auth?.username ?? "");
  const reloginPassword = $derived(bot.auth?.password ?? "");
  const reloginCanEnable = $derived(
    Boolean(reloginUsername && reloginPassword) ||
      Boolean(autoReloginState.username && autoReloginState.password),
  );

  function updateReloginServers() {
    try {
      reloginServers = (bot.auth?.servers ?? []).map((server) => server.name);
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

  let commandPaletteOpen = $state(false);


  let availableCells = $state<string[]>([]);
  let currentSelectedCell = $state<string>("");
  let currentSelectedPad = $state<string>("");
  let prevRoomId = $state<number>(-1);
  let validPads = $state<
    {
      isValid: boolean;
      name: string;
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

    currentSelectedCell = bot.player.cell ?? "Enter";

    const capturedRoomId = bot.world.roomId;
    if (capturedRoomId === prevRoomId) return;

    const cells = bot.world.cells || [];

    if (bot.world.roomId !== capturedRoomId) return;

    availableCells = cells;
    prevRoomId = capturedRoomId;
  }

  function updatePads() {
    if (!bot.player.isReady()) return;

    currentSelectedPad = bot.player.pad ?? "Spawn";

    const cellPads = bot.world.cellPads || [];
    validPads = DEFAULT_PADS.map((pad) => ({
      name: pad,
      isValid: cellPads.includes(pad),
    }));
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
      toggleScript();
    }
  });

  // TODO: follower should use auto skillsets
  $effect(() => {
    if (gameState.autoAttackEnabled) {
      const currentCls = bot.player.className;

      const skillSet =
        appState.skillSets?.get(currentCls) ??
        parseSkillSetJson({ skills: [1, 2, 3, 4], delay: 150 });
      const skillList = skillSet.skills;
      let idx = 0;

      void interval(async (_, stop) => {
        if (!gameState.autoAttackEnabled) {
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
              await bot.combat.useSkill(skillIndex, false, skill.isWait);
            idx = (idx + 1) % skillList.length;
          }
        }
      }, skillSet.delay ?? 150);
    }
  });

  onMount(async () => {
    const [platformResult, assetPathResult, globalSettingsResult] =
      await Promise.allSettled([
        client.app.getPlatform(),
        client.app.getAssetPath(),
        client.app.getSettings(),
      ]);

    if (platformResult.status === "fulfilled") {
      platform.set(platformResult.value);
    } else console.error("Failed to get platform state", platformResult.reason);

    if (assetPathResult.status === "fulfilled") {
      swfPath = assetPathResult.value;
    } else console.error("Failed to get asset path", assetPathResult.reason);

    if (globalSettingsResult.status === "fulfilled") {
      autoReloginState.fallbackServer =
        globalSettingsResult.value.fallbackServer;
    } else
      console.error("Failed to get app settings", globalSettingsResult.reason);

    await Promise.all([
      import("./tipc/fast-travels.handlers"),
      import("./tipc/environment.handlers"),
      import("./tipc/follower.handlers"),
      import("./tipc/loader-grabber.handlers"),
      import("./tipc/packet-logger.handlers"),
      import("./tipc/packet-spammer.handlers"),
    ]);
  });

  gameLoaded.subscribe(async () => {
    const [skillSetsResult, envStateResult] = await Promise.allSettled([
      client.app.getSkillSets(),
      client.environment.getState(),
    ]);

    // Skill sets
    if (skillSetsResult.status === "fulfilled") {
      const skillSets = Result.deserialize<Record<string, unknown>, string>(
        skillSetsResult.value,
      );
      if (skillSets.isOk()) {
        for (const [className, skillSetJson] of Object.entries(
          skillSets.value,
        )) {
          const res = parseSkillSetJson(skillSetJson as SkillSetJson);
          if (res) appState.skillSets.set(className.toUpperCase(), res);
        }
      } else {
        console.error("Failed to deserialize skill sets", skillSets.error);
      }
    } else {
      console.error("Failed to load skill sets", skillSetsResult.reason);
    }

    // Environment state
    if (envStateResult.status === "fulfilled") {
      const state = envStateResult.value;
      bot.environment.applyUpdate(state);
    } else {
      console.error(
        "Failed to sync up with environment",
        envStateResult.reason,
      );
    }
  });

  window.addEventListener("mousedown", (ev) => {
    const el = ev.target as HTMLElement;
    // If clicking into the game, close the dropdown
    if (el.id === "swf") openDropdown = null;
  });

  window.addEventListener("beforeunload", async () => {
    await client.scripts.gameReload();
  });
</script>

<main
  class="m-0 flex h-screen flex-col overflow-hidden bg-background text-foreground focus:outline-none"
>
  {#if gameState.topNavVisible}
    <div
      id="topnav-container"
      class="relative z-[10000] flex h-7 items-center border-b border-border/40 bg-background/95 backdrop-blur-md"
    >
      <div
        id="topnav"
        class="flex h-full w-full flex-row items-center gap-1 px-2"
      >
        <Menu.Root
          open={openDropdown === "windows"}
          onOpenChange={(open) => (openDropdown = open ? "windows" : null)}
        >
          <Menu.Trigger
            class="flex h-6 shrink-0 items-center justify-center rounded-md bg-transparent px-2.5 text-xs font-medium text-foreground/80 transition-colors duration-200 hover:bg-accent hover:text-foreground"
          >
            Windows
          </Menu.Trigger>
          <Menu.Content class="w-max p-0">
            <WindowsMegaMenu />
          </Menu.Content>
        </Menu.Root>

        <div class="flex h-full flex-row items-center gap-1">
          <Menu.Root
            open={openDropdown === "scripts"}
            onOpenChange={(open) => (openDropdown = open ? "scripts" : null)}
          >
            <Menu.Trigger
              class="flex h-6 shrink-0 items-center rounded-md bg-transparent px-2.5 text-xs font-medium text-foreground/80 transition-colors duration-200 hover:bg-accent hover:text-foreground"
            >
              Scripts
            </Menu.Trigger>
            <Menu.Content class="min-w-44 p-1">
              <Menu.Item
                class="flex h-7 w-full items-center justify-between gap-4 px-2 text-xs font-medium"
                onclick={loadScript}
              >
                <span>Load Script</span>
                <Kbd hotkey={hotkeyState.values["load-script"] ?? ""} />
              </Menu.Item>
              <Menu.Item
                class="flex h-7 w-full items-center justify-between gap-4 px-2 text-xs font-medium"
                onclick={() => executeAction("toggle-command-overlay")}
              >
                <span
                  >{scriptState.showOverlay
                    ? "Hide Overlay"
                    : "Show Overlay"}</span
                >
                <Kbd
                  hotkey={hotkeyState.values["toggle-command-overlay"] ?? ""}
                />
              </Menu.Item>
              <Menu.Item
                class="flex h-7 w-full items-center justify-between gap-4 px-2 text-xs font-medium"
                onclick={() => void client.app.toggleDevTools()}
              >
                <span>Dev Tools</span>
                <Kbd
                  hotkey={hotkeyState.values["toggle-dev-tools"] ?? ""}
                />
              </Menu.Item>
            </Menu.Content>
          </Menu.Root>

          <div class="mx-1 h-3 w-px bg-border/40"></div>

          <button
            class="flex h-6 shrink-0 items-center rounded-md bg-transparent px-2.5 text-xs font-medium text-foreground/80 transition-colors duration-200 hover:bg-accent hover:text-foreground"
            onclick={() => executeAction("toggle-options-panel")}
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
          >
            <Menu.Trigger
              class={cn(
                "flex h-6 shrink-0 items-center gap-1.5 rounded-md bg-transparent px-2.5 text-xs font-medium transition-all duration-200 hover:bg-accent",
                autoReloginState.enabled
                  ? "text-success"
                  : "text-foreground/80 hover:text-foreground",
              )}
            >
              <span>Auto Relogin</span>
            </Menu.Trigger>
            <Menu.Content class="min-w-44 p-1">
              {#if autoReloginState.enabled}
                <div
                  class="flex h-7 items-center gap-2 px-2 text-xs font-medium text-muted-foreground/70"
                >
                  User: {autoReloginState.username}
                </div>
                <div
                  class="flex h-7 items-center gap-2 px-2 text-xs font-medium text-muted-foreground/70"
                >
                  Server: {autoReloginState.server}
                </div>
                <div
                  class="flex h-7 items-center gap-2 px-2 text-xs font-medium text-muted-foreground/70"
                >
                  Fallback: {autoReloginState.fallbackServer ?? "Auto"}
                </div>
                <div
                  class="flex h-7 items-center justify-between gap-2 px-2"
                >
                  <span class="text-xs font-medium text-muted-foreground/70"
                    >Delay:</span
                  >
                  <div class="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      class="h-5 w-10 rounded-sm border border-border/60 bg-background px-1 text-center text-[10px] text-foreground focus:border-success/50 focus:outline-none"
                      value={autoReloginState.delay / 1_000}
                      onchange={(ev) => {
                        const val = Math.max(
                          1,
                          Math.min(60, Number(ev.currentTarget.value) || 5),
                        );
                        autoReloginState.delay = val * 1_000;
                        ev.currentTarget.value = String(val);
                      }}
                    />
                    <span class="text-xs font-medium text-muted-foreground/70">s</span>
                  </div>
                </div>
                <Menu.Item
                  class="h-7 px-2 text-xs font-medium text-red-400 hover:text-red-300"
                  onclick={disableRelogin}
                >
                  Disable
                </Menu.Item>
              {:else if autoReloginState.username && autoReloginState.password}
                <div
                  class="flex h-7 items-center gap-2 px-2 text-xs font-medium text-muted-foreground/70"
                >
                  User: {autoReloginState.username}
                </div>
                <Menu.Separator />
                <Menu.Label
                  class="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground/40"
                >
                  Server
                </Menu.Label>
                <div class="max-h-52 overflow-y-auto">
                  {#each reloginServers as server (server)}
                    <Menu.Item
                      class={cn(
                        "h-7 px-2 text-xs font-medium transition-colors hover:text-success",
                        server === autoReloginState.server &&
                          "text-success",
                      )}
                      onclick={() => {
                        autoReloginState.server = server;
                        autoReloginState.enabled = true;
                        AutoReloginJob.resetForNewCredentials();
                      }}
                    >
                      {server}{server === autoReloginState.server
                        ? " (last)"
                        : ""}
                    </Menu.Item>
                  {/each}
                </div>
                <Menu.Separator />
                <Menu.Item
                  class="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                  onclick={() => autoReloginState.reset()}
                >
                  Clear Credentials
                </Menu.Item>
              {:else if !reloginCanEnable}
                <div class="px-2 py-3 text-center">
                  <div class="text-xs font-medium text-muted-foreground/60">
                    Log in to enable
                  </div>
                </div>
              {:else}
                <Menu.Label
                  class="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground/40"
                >
                  Server
                </Menu.Label>
                <div class="max-h-52 overflow-y-auto">
                  {#each reloginServers as server (server)}
                    <Menu.Item
                      class="h-7 px-2 text-xs font-medium transition-colors hover:text-success"
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
              "ml-1 flex h-6 shrink-0 items-center gap-1.5 rounded px-2.5 text-[11px] font-medium shadow-sm transition-all duration-200",
              !scriptState.isLoaded && "cursor-not-allowed opacity-40",
              scriptState.isLoaded &&
                !scriptState.isRunning &&
                "bg-success/15 text-success ring-1 ring-success/20 hover:bg-success/25",
              scriptState.isRunning &&
                "bg-amber-600/15 text-amber-400 ring-1 ring-amber-500/20 hover:bg-amber-600/25",
            )}
            disabled={!scriptState.isLoaded}
            onclick={toggleScript}
          >
            {#if scriptState.isRunning}
              <Icon icon="square" class="size-2.5" />
              <span>Stop</span>
            {:else}
              <Icon icon="play" class="size-2.5" />
              <span>Run</span>
            {/if}
          </button>
        </div>

        <div class="ml-auto flex h-full shrink-0 items-center gap-2 pr-1.5">
          <Label
            class="flex cursor-pointer select-none items-center gap-1.5 text-xs text-foreground/70 transition-colors hover:text-foreground"
          >
            <Checkbox
              bind:checked={gameState.autoAttackEnabled}
              class="size-3.5"
            />
            <span>Auto</span>
          </Label>
          <div class="h-3 w-px bg-border/40"></div>
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
            >
              <Menu.Trigger
                class="flex h-6 w-16 items-center justify-between rounded border border-border/60 bg-background/50 px-2 text-[11px] text-foreground/70 transition-colors duration-200 hover:border-border hover:bg-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!gameConnected}
              >
                {currentSelectedPad}
              </Menu.Trigger>
              <Menu.Content align="end" class="min-w-28 p-1">
                {#each validPads as pad (pad)}
                  <Menu.Item
                    class={cn(
                      "h-7 w-full px-2 text-xs font-medium",
                      pad.isValid &&
                        pad.name !== currentSelectedPad &&
                        "text-success",
                      pad.name === currentSelectedPad &&
                        "bg-accent font-medium text-foreground",
                    )}
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
            >
              <Menu.Trigger
                class="flex h-6 w-20 items-center justify-between rounded border border-border/60 bg-background/50 px-2 text-[11px] text-foreground/70 transition-colors duration-200 hover:border-border hover:bg-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!gameConnected}
              >
                {currentSelectedCell}
              </Menu.Trigger>
              <Menu.Content
                align="end"
                class="max-h-[30vh] min-w-32 overflow-y-auto p-1"
              >
                {#each availableCells as cell (cell)}
                  <Menu.Item
                    class={cn(
                      "h-7 w-full px-2 text-xs font-medium",
                      cell === currentSelectedCell &&
                        "bg-accent font-medium text-foreground",
                    )}
                    onclick={() => jumpToCell(cell)}
                  >
                    {cell}
                  </Menu.Item>
                {/each}
              </Menu.Content>
            </Menu.Root>
          </div>
          <div class="h-3 w-px bg-border/40"></div>
          <Button
            variant="ghost"
            size="xs"
            class="h-6 px-2.5 text-xs text-foreground/70 hover:text-foreground"
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

  <div class="invisible relative flex-1 opacity-0" id="game-container">
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
<CommandPalette bind:open={commandPaletteOpen} />
<OptionsPanel />

<style>
  :global(:root) {
    --topnav-height: 28px;
  }
</style>
