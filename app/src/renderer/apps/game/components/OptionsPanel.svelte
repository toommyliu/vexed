<script lang="ts">
  import { untrack } from "svelte";
  import { Checkbox, Input, Label, Kbd, NumberField } from "@vexed/ui";
  import FloatingPanel from "./FloatingPanel.svelte";

  import {
    gameState,
    optionsPanelState,
    hotkeyState,
  } from "../state/index.svelte";

  import { Bot } from "../lib/Bot";

  const bot = Bot.getInstance();

  let customName = $state("");
  let customGuild = $state("");

  let nameDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const name = customName;
    untrack(() => {
      if (nameDebounceTimer) clearTimeout(nameDebounceTimer);
      nameDebounceTimer = setTimeout(() => {
        bot.settings.customName = name || null;
      }, 300);
    });
    return () => {
      if (nameDebounceTimer) clearTimeout(nameDebounceTimer);
    };
  });

  let guildDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const guild = customGuild;
    untrack(() => {
      if (guildDebounceTimer) clearTimeout(guildDebounceTimer);
      guildDebounceTimer = setTimeout(() => {
        bot.settings.customGuild = guild || null;
      }, 300);
    });
    return () => {
      if (guildDebounceTimer) clearTimeout(guildDebounceTimer);
    };
  });

  const options = [
    {
      key: "infiniteRange",
      label: "Infinite Range",
      hotkeyId: "toggle-infinite-range",
    },
    {
      key: "provokeCell",
      label: "Provoke Cell",
      hotkeyId: "toggle-provoke-cell",
    },
    {
      key: "enemyMagnet",
      label: "Enemy Magnet",
      hotkeyId: "toggle-enemy-magnet",
    },
    { key: "lagKiller", label: "Lag Killer", hotkeyId: "toggle-lag-killer" },
    {
      key: "hidePlayers",
      label: "Hide Players",
      hotkeyId: "toggle-hide-players",
    },
    {
      key: "skipCutscenes",
      label: "Skip Cutscenes",
      hotkeyId: "toggle-skip-cutscenes",
    },
    { key: "disableFx", label: "Disable FX", hotkeyId: "toggle-disable-fx" },
    {
      key: "disableCollisions",
      label: "Disable Collisions",
      hotkeyId: "toggle-disable-collisions",
    },
    {
      key: "counterAttack",
      label: "Anti-Counter",
      hotkeyId: "toggle-anti-counter",
    },
    {
      key: "disableDeathAds",
      label: "Disable Death Ads",
      hotkeyId: "toggle-disable-death-ads",
    },
  ] as const;
</script>

<FloatingPanel
  title="Options"
  panelState={optionsPanelState}
  class="w-[340px]"
  defaultWidth={340}
>
  <div class="flex flex-col p-2 h-full overflow-auto gap-2">
    <div class="grid grid-cols-2 gap-x-2 w-full">
      {#each options as option (option.key)}
        {@const hotkey = hotkeyState.values[option.hotkeyId]}
        <Label class="flex items-center gap-2 h-6 px-1.5 rounded cursor-pointer text-xs
                       transition-all duration-100 whitespace-nowrap min-w-0
                       hover:bg-accent/40">
          <Checkbox
            checked={gameState[option.key]}
            onCheckedChange={(details) => {
              gameState[option.key] = details.checked === true;
            }}
          />
          <span class="flex-1 min-w-0 overflow-hidden text-ellipsis text-xs text-foreground/90">
            {option.label}
          </span>
          <Kbd hotkey={hotkey ?? ""} />
        </Label>
      {/each}
    </div>

    <div class="flex flex-col gap-1 mt-0.5 pt-2 border-t border-border/50">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5">
        <div class="grid grid-cols-[80px_1fr] items-center px-1.5 h-6 text-xs gap-x-3 gap-y-0.5">
          <span class="text-[12px] text-foreground/90 text-left shrink-0 whitespace-nowrap">
            Walk Speed
          </span>
          <NumberField.Root
            value={gameState.walkSpeed}
            onValueChange={(val) => {
              if (!Number.isNaN(val)) gameState.walkSpeed = val;
            }}
            min={1}
            max={100}
            step={1}
            class="w-14 shrink-0"
          >
            <NumberField.Input class="number-input" />
          </NumberField.Root>
        </div>

        <div class="grid grid-cols-[80px_1fr] items-center px-1.5 h-6 text-xs gap-x-3 gap-y-0.5">
          <span class="text-[12px] text-foreground/90 text-left shrink-0 whitespace-nowrap">
            FPS
          </span>
          <NumberField.Root
            value={gameState.fps}
            onValueChange={(val) => {
              if (!Number.isNaN(val)) gameState.fps = val;
            }}
            min={1}
            max={60}
            step={1}
            class="w-14 shrink-0"
          >
            <NumberField.Input class="number-input" />
          </NumberField.Root>
        </div>
      </div>

      <div class="grid grid-cols-[80px_1fr] items-center px-1.5 h-6 gap-x-3 gap-y-0.5">
        <span class="text-[12px] text-foreground/90 text-left shrink-0 whitespace-nowrap">
          Custom Name
        </span>
        <Input
          bind:value={customName}
          placeholder="Display name"
          size="sm"
          class="text-input-field"
          spellcheck={false}
        />
      </div>

      <div class="grid grid-cols-[80px_1fr] items-center px-1.5 h-6 gap-x-3 gap-y-0.5">
        <span class="text-[12px] text-foreground/90 text-left shrink-0 whitespace-nowrap">
          Custom Guild
        </span>
        <Input
          bind:value={customGuild}
          placeholder="Display guild"
          size="sm"
          class="text-input-field"
          spellcheck={false}
        />
      </div>

    </div>
  </div>
</FloatingPanel>

<style>
  :global(.number-input) {
    height: 18px;
    padding: 0 4px;
    font-size: 10px;
    text-align: center;
    background-color: rgb(var(--background) / 0.6);
    border-radius: var(--radius);
    transition: background-color 0.15s ease;
    border: none !important;
    outline: none !important;
    color: rgb(var(--foreground));
  }

  :global(.text-input-field) {
    display: flex;
    flex: 1;
    min-width: 0;
    height: 18px;
    background-color: rgb(var(--background) / 0.6);
    transition: background-color 0.15s ease;
    border: none !important;
    overflow: hidden;
    border-radius: var(--radius);
  }

  :global(.text-input-field > input) {
    font-size: 11px;
    padding: 0 8px;
    color: rgb(var(--foreground));
    border: none !important;
    outline: none !important;
    background: transparent !important;
    height: 100% !important;
  }
</style>