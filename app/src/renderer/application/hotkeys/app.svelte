<script lang="ts">
  import Mousetrap from "mousetrap";
  import { onDestroy, onMount } from "svelte";
  import Config from "@vexed/config";
  import { AlertDialog, Button, Kbd } from "@vexed/ui";
  import { cn } from "@vexed/ui/util";
  import Settings from "lucide-svelte/icons/settings";
  import AppWindow from "lucide-svelte/icons/app-window";
  import Code from "lucide-svelte/icons/code";
  import Wrench from "lucide-svelte/icons/wrench";
  import Radio from "lucide-svelte/icons/radio";
  import Inbox from "lucide-svelte/icons/inbox";
  import AlertTriangle from "lucide-svelte/icons/triangle-alert";
  import ChevronDown from "lucide-svelte/icons/chevron-down";
  import RotateCcw from "lucide-svelte/icons/rotate-ccw";

  import { client } from "~/shared/tipc";
  import type { HotkeyConfig } from "~/shared/types";
  import type { HotkeySection, RecordingState } from "./types";
  import {
    isValidHotkey,
    parseKeyboardEvent,
    createHotkeyConfig,
    findConflicts,
    getActionForHotkey,
  } from "./utils";
  import { DEFAULT_HOTKEYS, DOCUMENTS_PATH } from "~/shared";
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
  let confirmDialogOpen = $state(false);

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
      // Force reactivity update
      hotkeysSections = [...hotkeysSections];
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

  async function restoreDefaults() {
    logger.info("Restoring defaults...");
    if (!config) {
      logger.warn("No config available, aborting restore.");
      return;
    }

    stopRecording();

    config.clear();
    await config.save();
    
    await config.reload();
    
    await loadHotkeysFromConfig();
    await client.hotkeys.reloadHotkeys();
    logger.info("Hotkeys restored to defaults.");
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

    if (hotkeysSections?.length > 0) {
      activeSection = hotkeysSections[0]!.name;
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

    if (ev.key === "Enter" && recordingState.lastPressedKey) {
      const conflictingAction = getActionForHotkey(recordingState.lastPressedKey, hotkeysSections);
      if (!conflictingAction || conflictingAction === getActionNameById(recordingState.actionId || "")) {
        confirmRecording(recordingState.lastPressedKey);
      }
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
      <button
        class="group flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-all hover:bg-secondary/50 hover:text-foreground"
        onclick={() => (confirmDialogOpen = true)}
      >
        <RotateCcw class="h-3 w-3 transition-transform duration-300 group-hover:-rotate-180" />
        <span>Restore Defaults</span>
      </button>
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
            <ChevronDown
              class={cn(
                "ml-auto h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-150",
                isExpanded && "rotate-180"
              )}
            />
          </button>

          {#if isExpanded}
            <div class="mt-1 space-y-px pl-1">
              {#each section.items as item}
                {@const isRecordingThis = recordingState.isRecording && recordingState.actionId === item.id}
                {@const hasConflict = isRecordingThis && recordingState.lastPressedKey && getActionForHotkey(recordingState.lastPressedKey, hotkeysSections) && getActionForHotkey(recordingState.lastPressedKey, hotkeysSections) !== item.label}
                <div
                  class={cn(
                    "group/row flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors",
                    isRecordingThis 
                      ? "bg-secondary/50" 
                      : "bg-transparent hover:bg-secondary/30 cursor-pointer"
                  )}
                  onclick={() => !isRecordingThis && startRecording(item.id)}
                  onkeydown={(ev) => {
                    if (!isRecordingThis && ev.key === "Enter") startRecording(item.id);
                  }}
                  role="button"
                  tabindex="0"
                >
                  <span class="text-sm text-foreground">{item.label}</span>
                  <div class="flex h-6 min-w-[100px] items-center justify-end gap-2">
                    {#if isRecordingThis}
                      {#if recordingState.lastPressedKey}
                        <Kbd hotkey={recordingState.lastPressedKey} class={hasConflict ? "border-destructive/50 text-destructive" : ""} />
                      {:else}
                        <span class="text-xs text-muted-foreground">Type shortcut...</span>
                      {/if}
                    {:else if item.value}
                      <Kbd hotkey={item.value} class="transition-all group-hover/row:border-primary/40 group-hover/row:bg-muted/70" />
                    {:else}
                      <span class="text-xs text-muted-foreground/50 group-hover/row:text-muted-foreground">
                        Add shortcut
                      </span>
                    {/if}
                  </div>
                </div>
                {#if isRecordingThis}
                  <div class="flex items-center gap-3 px-2 pb-1 text-[10px] text-muted-foreground/70">
                    <span><Kbd>Esc</Kbd> cancel</span>
                    <span><Kbd>Backspace</Kbd> clear</span>
                    {#if recordingState.lastPressedKey}
                      <span><Kbd>Enter</Kbd> confirm</span>
                    {/if}
                  </div>
                {/if}
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>

<AlertDialog.Root bind:open={confirmDialogOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Restore Default Hotkeys?</AlertDialog.Title>
      <AlertDialog.Description>
        This will reset all hotkey bindings to their default values. Any custom hotkeys you've configured will be lost.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <Button
        variant="ghost"
        size="sm"
        onclick={() => (confirmDialogOpen = false)}
      >
        Cancel
      </Button>
      <AlertDialog.Action
        class="inline-flex h-8 items-center justify-center rounded-md bg-destructive px-3 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
        onclick={restoreDefaults}
      >
        Restore Defaults
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
