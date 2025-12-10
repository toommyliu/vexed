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

  <div class="flex-1 overflow-auto">
    <div class="mx-auto max-w-xl px-6 py-4">
      {#each hotkeysSections as section, sectionIndex}
        {@const isExpanded = activeSection === section.name}
        <div class={cn(sectionIndex > 0 && "mt-1")}>
          <button
            class="group flex w-full items-center gap-2 rounded-md bg-secondary/20 px-2 py-1.5 text-left transition-colors hover:bg-secondary/40"
            onclick={() => (activeSection = isExpanded ? null : section.name)}
          >
            {#if getSectionIcon(section.icon)}
              {@const Icon = getSectionIcon(section.icon)}
              <Icon class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {/if}
            <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {section.name}
            </span>
            <svg
              class={cn(
                "ml-auto h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-150",
                isExpanded && "rotate-180"
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {#if isExpanded}
            <div class="mt-1 space-y-px pl-1">
              {#each section.items as item}
                <button
                  class="group/row flex w-full cursor-pointer items-center justify-between rounded-md bg-transparent px-2 py-2 text-left transition-colors hover:bg-secondary/30"
                  onclick={() => startRecording(item.id)}
                >
                  <span class="text-sm text-foreground">{item.label}</span>
                  <div class="flex min-w-[120px] items-center justify-end gap-2">
                    {#if item.value}
                      <div class="flex items-center gap-1.5">
                        {#each formatHotkey(item.value).split("+") as keyPart, idx}
                          {#if idx > 0}
                            <span class="text-muted-foreground/50 text-xs">+</span>
                          {/if}
                          <Kbd class="transition-all group-hover/row:border-primary/40 group-hover/row:bg-muted/70">
                            {keyPart}
                          </Kbd>
                        {/each}
                      </div>
                      <svg
                        class="h-3.5 w-3.5 text-muted-foreground/0 transition-all group-hover/row:text-muted-foreground/60"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                      </svg>
                    {:else}
                      <span class="inline-flex h-6 items-center rounded border border-dashed border-muted-foreground/30 px-2.5 text-[11px] font-medium text-muted-foreground transition-colors group-hover/row:border-primary/50 group-hover/row:text-primary">
                        Click to set
                      </span>
                      <div class="w-3.5"></div>
                    {/if}
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
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
