<script lang="ts">
  import Mousetrap from "mousetrap";
  import { onDestroy, onMount } from "svelte";
  import Config from "@vexed/config";
  import { Button, Kbd } from "@vexed/ui";
  import { cn } from "@vexed/ui/util";
  import Settings from "lucide-svelte/icons/settings";
  import AppWindow from "lucide-svelte/icons/app-window";
  import Code from "lucide-svelte/icons/code";
  import Wrench from "lucide-svelte/icons/wrench";
  import Radio from "lucide-svelte/icons/radio";
  import Inbox from "lucide-svelte/icons/inbox";
  import AlertTriangle from "lucide-svelte/icons/triangle-alert";
  import Check from "lucide-svelte/icons/check";


  import { client } from "@shared/tipc";
  import type { HotkeyConfig } from "@shared/types";
  import type { HotkeySection, RecordingState } from "./types";
  import {
    isMac,
    isValidHotkey,
    formatHotkey,
    parseKeyboardEvent,
    createHotkeyConfig,
    findConflicts,
    getActionForHotkey,
  } from "./utils";
  import { DEFAULT_HOTKEYS, DOCUMENTS_PATH } from "@/shared";
  import log from "electron-log";

  const logger = log.scope("tools/hotkeys");

  let config = $state<Config<HotkeyConfig> | null>(null);
  let hotkeysSections = $state<HotkeySection[]>(createHotkeyConfig());
  let recordingState = $state<RecordingState>({
    isRecording: false,
    actionId: null,
    lastPressedKey: "",
    isClearing: false,
  });
  let activeSection = $state<string | null>(null);

  let conflicts = $derived(findConflicts(hotkeysSections));

  async function saveHotkeyConfig() {
    if (!config) return;

    try {
      for (const section of hotkeysSections) {
        for (const item of section.items) {
          // @ts-expect-error
          config.set(item.configKey, item.value);
        }
      }

      await config.save();
      logger.info("Hotkey configuration saved successfully.");
    } catch (error) {
      logger.error("Failed to save hotkey configuration.", error);
    }
  }

  async function loadHotkeysFromConfig() {
    if (!config) return;

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
      logger.error("Failed to load hotkeys from config.", error);
    }
  }

  function startRecording(actionId: string) {
    if (recordingState.isRecording) {
      return;
    }

    recordingState.isRecording = true;
    recordingState.actionId = actionId;
    recordingState.lastPressedKey = "";
    recordingState.isClearing = false;

    Mousetrap.reset();
  }

  async function confirmRecording(combination: string) {
    if (!recordingState.isRecording || !recordingState.actionId) return;
    if (!combination || combination.trim() === "") return;

    const conflictingAction = getActionForHotkey(combination, hotkeysSections);
    if (
      conflictingAction &&
      conflictingAction !== getActionNameById(recordingState.actionId)
    ) {
      return;
    }

    const item = findHotkeyItemById(recordingState.actionId);
    if (item) {
      item.value = combination;
    }

    stopRecording();
    await saveHotkeyConfig();
    await client.hotkeys.updateHotkey({
      id: item!.id,
      value: combination,
    });
  }

  async function clearHotkey() {
    if (!recordingState.isRecording || !recordingState.actionId) return;

    const item = findHotkeyItemById(recordingState.actionId);
    if (item) {
      item.value = "";
    }

    await saveHotkeyConfig();
    await client.hotkeys.updateHotkey({
      id: item!.id,
      value: "",
    });
    stopRecording();
  }



  function findHotkeyItemById(actionId: string) {
    for (const section of hotkeysSections) {
      for (const item of section.items) {
        if (item.id === actionId) return item;
      }
    }

    return null;
  }

  function getActionNameById(actionId: string): string | null {
    const item = findHotkeyItemById(actionId);
    return item ? item.label : null;
  }

  function stopRecording() {
    recordingState.isRecording = false;
    recordingState.actionId = null;
    recordingState.lastPressedKey = "";
    recordingState.isClearing = false;
  }

  function getSectionIcon(icon: string) {
    switch (icon) {
      case "general":
        return Settings;
      case "application":
        return AppWindow;
      case "scripts":
        return Code;
      case "tools":
        return Wrench;
      case "packets":
        return Radio;
      default:
        return Inbox;
    }
  }

  onMount(async () => {
    config = new Config<HotkeyConfig>({
      configName: "hotkeys",
      cwd: DOCUMENTS_PATH,
      defaults: DEFAULT_HOTKEYS,
    });
    await config.load();
    await loadHotkeysFromConfig();

    if (hotkeysSections.length > 0) {
      activeSection = hotkeysSections[0].name;
    }
  });

  onDestroy(() => {
    Mousetrap.reset();
  });
</script>

<svelte:window
  on:keydown={(ev) => {
    if (!recordingState.isRecording) return;

    if (!document.hasFocus() || document.hidden) return;

    ev.preventDefault();
    ev.stopPropagation();

    if (ev.key === "Escape") {
      stopRecording();
      return;
    }

    if (ev.key === "Backspace") {
      clearHotkey();
      return;
    }

    const combination = parseKeyboardEvent(ev);
    if (combination) {
      recordingState.lastPressedKey = combination;
      recordingState.isClearing = false;
    }
  }}
/>

<div class="bg-background flex h-screen flex-col">
  <header
    class="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 border-b border-border/50 px-6 py-3 backdrop-blur-xl elevation-1"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h1 class="text-foreground text-base font-semibold tracking-tight">
          Hotkeys
        </h1>
      </div>
    </div>
  </header>

  {#if conflicts.length > 0}
    <div class="border-b border-destructive/30 bg-destructive/5 px-6 py-2">
      <div class="flex items-center gap-2 text-sm">
        <AlertTriangle class="h-4 w-4 text-destructive" />
        <span class="text-destructive">
          Conflicts: <span class="font-mono">{conflicts.join(", ")}</span>
        </span>
      </div>
    </div>
  {/if}

  <div class="flex flex-1 overflow-hidden">
    <nav class="w-48 shrink-0 border-r border-border/50 bg-secondary/20 p-2">
      {#each hotkeysSections as section}
        <button
          class={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
            activeSection === section.name
              ? "bg-primary/10 text-primary"
              : "bg-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
          )}
          onclick={() => (activeSection = section.name)}
        >
          {#if getSectionIcon(section.icon)}
            {@const Icon = getSectionIcon(section.icon)}
            <Icon class="h-4 w-4 shrink-0" />
          {/if}
          <span class="truncate">{section.name}</span>
        </button>
      {/each}
    </nav>

    <main class="flex-1 overflow-auto">
      {#each hotkeysSections as section}
        {#if activeSection === section.name}
          <div class="p-4">
            <div class="mb-4 flex items-center gap-2">
            </div>

            <div class="rounded-lg border border-border/50 bg-card overflow-hidden">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-border/30 bg-secondary/30">
                    <th class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Action
                    </th>
                    <th class="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Shortcut
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {#each section.items as item, index}
                    <tr
                      class={cn(
                        "group transition-colors hover:bg-secondary/30",
                        index !== section.items.length - 1 && "border-b border-border/20"
                      )}
                    >
                      <td class="px-4 py-2.5">
                        <span class="text-sm text-foreground">{item.label}</span>
                      </td>
                      <td class="px-4 py-2.5 text-right">
                        {#if item.value}
                          <button
                            class="inline-flex items-center gap-1.5 bg-transparent"
                            onclick={() => startRecording(item.id)}
                          >
                            {#each formatHotkey(item.value).split("+") as keyPart, idx}
                              {#if idx > 0}
                                <span class="text-muted-foreground/50 text-xs">+</span>
                              {/if}
                              <Kbd class="transition-colors group-hover:bg-muted/80">
                                {keyPart}
                              </Kbd>
                            {/each}
                          </button>
                        {:else}
                          <button
                            class="inline-flex h-7 items-center rounded-md border border-dashed border-muted-foreground/30 px-3 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                            onclick={() => startRecording(item.id)}
                          >
                            Record Shortcut
                          </button>
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}
      {/each}
    </main>
  </div>
</div>

{#if recordingState.isRecording}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    onclick={(ev) => {
      if (ev.target === ev.currentTarget) stopRecording();
    }}
    onkeydown={(ev) => {
      if (ev.key === "Escape") {
        stopRecording();
      }
    }}
    role="dialog"
    tabindex="-1"
  >
    <div
      class="relative mx-4 w-full max-w-sm rounded-xl border border-border/50 bg-card p-5 shadow-xl"
      onclick={(ev) => ev.stopPropagation()}
      onkeydown={(ev) => {
        if (ev.key === "Escape") {
          stopRecording();
        }
      }}
      role="dialog"
      tabindex="-1"
    >
      <div class="mb-4 text-center">
        <h3 class="text-base font-semibold text-foreground">
          {getActionNameById(recordingState.actionId || "")}
        </h3>
        <p class="mt-1 text-xs text-muted-foreground">
          Press a key combination
        </p>
      </div>

      <div class="mb-4 rounded-lg border border-border/50 bg-secondary/30 p-4">
        <div class="flex min-h-[2.5rem] items-center justify-center">
          {#if recordingState.isClearing}
            <div class="flex items-center gap-2 text-emerald-400">
              <Check class="h-4 w-4" />
              <span class="text-sm">Cleared</span>
            </div>
          {:else if recordingState.lastPressedKey}
            <div class="flex items-center gap-1.5">
              {#each formatHotkey(recordingState.lastPressedKey).split("+") as keyPart, index}
                {#if index > 0}
                  <span class="text-muted-foreground text-sm">+</span>
                {/if}
                <Kbd>{keyPart}</Kbd>
              {/each}
            </div>
          {:else}
            <div class="flex items-center gap-2 text-muted-foreground">
              <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-primary"></div>
              <span class="text-sm">Listening...</span>
            </div>
          {/if}
        </div>
      </div>

      {#if recordingState.lastPressedKey && getActionForHotkey(recordingState.lastPressedKey, hotkeysSections) && getActionForHotkey(recordingState.lastPressedKey, hotkeysSections) !== getActionNameById(recordingState.actionId || "")}
        <div class="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertTriangle class="h-3.5 w-3.5 shrink-0" />
          <span>
            Already used by "{getActionForHotkey(recordingState.lastPressedKey, hotkeysSections)}"
          </span>
        </div>
      {/if}

      <div class="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          class="flex-1"
          onclick={stopRecording}
        >
          Cancel
        </Button>

        {#if recordingState.lastPressedKey}
          <Button
            size="sm"
            class="flex-1 gap-1.5"
            onclick={() => confirmRecording(recordingState.lastPressedKey)}
            disabled={!!(
              getActionForHotkey(
                recordingState.lastPressedKey,
                hotkeysSections,
              ) &&
              getActionForHotkey(
                recordingState.lastPressedKey,
                hotkeysSections,
              ) !== getActionNameById(recordingState.actionId || "")
            )}
          >
            <Check class="h-3.5 w-3.5" />
            Save
          </Button>
        {/if}
      </div>

      <div class="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span class="flex items-center gap-1.5"><Kbd>Esc</Kbd> cancel</span>
        <span class="flex items-center gap-1.5"><Kbd>Backspace</Kbd> clear</span>
      </div>
    </div>
  </div>
{/if}
