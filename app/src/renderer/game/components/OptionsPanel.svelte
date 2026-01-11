<script lang="ts">
  import { untrack } from "svelte";
  import { gameState, optionsPanelState } from "~/game/state.svelte";
  import { Checkbox, Input, Label } from "@vexed/ui";
  import Kbd from "@vexed/ui/Kbd";
  import * as NumberField from "@vexed/ui/NumberField";
  import { Bot } from "~/game/lib/Bot";
  import FloatingPanel from "./FloatingPanel.svelte";

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

  type Props = {
    hotkeyValues: Record<string, string>;
  };

  let { hotkeyValues }: Props = $props();

  const options = [
    { key: "infiniteRange", label: "Infinite Range", hotkeyId: "toggle-infinite-range" },
    { key: "provokeCell", label: "Provoke Cell", hotkeyId: "toggle-provoke-cell" },
    { key: "enemyMagnet", label: "Enemy Magnet", hotkeyId: "toggle-enemy-magnet" },
    { key: "lagKiller", label: "Lag Killer", hotkeyId: "toggle-lag-killer" },
    { key: "hidePlayers", label: "Hide Players", hotkeyId: "toggle-hide-players" },
    { key: "skipCutscenes", label: "Skip Cutscenes", hotkeyId: "toggle-skip-cutscenes" },
    { key: "disableFx", label: "Disable FX", hotkeyId: "toggle-disable-fx" },
    { key: "disableCollisions", label: "Disable Collisions", hotkeyId: "toggle-disable-collisions" },
    { key: "counterAttack", label: "Anti-Counter", hotkeyId: "toggle-anti-counter" },
    { key: "disableDeathAds", label: "Disable Death Ads", hotkeyId: "toggle-disable-death-ads" },
  ] as const;
</script>

<FloatingPanel
  title="Options"
  panelState={optionsPanelState}
  class="options-panel-container"
  defaultWidth={340}
>
  <div class="panel-content">
    <div class="options-grid">
      {#each options as option (option.key)}
      {@const hotkey = hotkeyValues[option.hotkeyId]}
        <Label class="option-row">
          <Checkbox
            checked={gameState[option.key]}
            onCheckedChange={(checked) => {
              gameState[option.key] = checked === true;
            }}
          />
          <span class="option-label-text">{option.label}</span>
          <Kbd hotkey={hotkey ?? ""} />
        </Label>
      {/each}
    </div>

    <div class="inputs-section">
      <div class="inputs-row">
        <div class="option-row-input">
          <span class="option-label">Walk Speed</span>
          <NumberField.Root
            value={gameState.walkSpeed}
            onValueChange={(v) => {
              if (!Number.isNaN(v)) gameState.walkSpeed = v;
            }}
            min={1}
            max={100}
            step={1}
            class="input-field"
          >
            <NumberField.Input class="input-inner" />
          </NumberField.Root>
        </div>

        <div class="option-row-input">
          <span class="option-label">FPS</span>
          <NumberField.Root
            value={gameState.fps}
            onValueChange={(v) => {
              if (!Number.isNaN(v)) gameState.fps = v;
            }}
            min={1}
            max={60}
            step={1}
            class="input-field"
          >
            <NumberField.Input class="input-inner" />
          </NumberField.Root>
        </div>
      </div>

      <div class="option-row-text">
        <span class="option-label">Custom Name</span>
        <Input
          bind:value={customName}
          placeholder="Display name"
          size="sm"
          class="text-input"
          spellcheck={false}
        />
      </div>

      <div class="option-row-text">
        <span class="option-label">Custom Guild</span>
        <Input
          bind:value={customGuild}
          placeholder="Display guild"
          size="sm"
          class="text-input"
          spellcheck={false}
        />
      </div>
    </div>
  </div>
</FloatingPanel>

<style>
  :global(.options-panel-container) {
    width: 340px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15) !important;
  }

  :global(.options-panel-container > .p-3) {
    padding: 0 !important;
  }

  .panel-content {
    padding: 12px;
    height: 100%;
    overflow: auto;
  }

  .options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 4px;
  }

  .inputs-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgb(var(--border));
  }

  .inputs-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
  }

  :global(.option-row) {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: background-color 0.1s ease;
    white-space: nowrap;
    overflow: hidden;
  }

  :global(.option-row:hover) {
    background-color: rgb(var(--accent));
  }

  .option-label-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .option-row-input {
    display: flex;
    align-items: center;
    padding: 4px 6px;
    font-size: 12px;
    gap: 8px;
  }

  .option-label {
    color: rgb(var(--foreground));
    flex-shrink: 0;
    white-space: nowrap;
  }

  .option-row-text .option-label {
    min-width: 90px;
    width: 90px;
  }

  :global(.input-field) {
    width: 56px;
    flex-shrink: 0;
  }

  :global(.input-inner) {
    height: 24px;
    padding: 0;
    font-size: 11px;
    text-align: center;
    line-height: 24px;
    border-radius: 6px;
  }

  .option-row-text {
    display: grid;
    grid-template-columns: 90px 1fr;
    align-items: center;
    padding: 4px 6px;
    font-size: 12px;
    gap: 8px;
  }

  :global(.text-input) {
    display: flex;
    flex: 1;
    min-width: 0;
    height: 24px;
    font-size: 11px;
    border-radius: 6px;
    color: rgb(var(--foreground));
  }
</style>
