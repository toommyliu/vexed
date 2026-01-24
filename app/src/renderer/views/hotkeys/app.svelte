<script lang="ts">
  import Mousetrap from "mousetrap";
  import { onDestroy, onMount } from "svelte";
  import { AlertDialog, Button, Kbd } from "@vexed/ui";
  import { cn } from "@vexed/ui/util";
  import Settings from "@vexed/ui/icons/Settings";
  import AppWindow from "@vexed/ui/icons/AppWindow";
  import Code from "@vexed/ui/icons/Code";
  import Wrench from "@vexed/ui/icons/Wrench";
  import Radio from "@vexed/ui/icons/Radio";
  import Inbox from "@vexed/ui/icons/Inbox";
  import AlertTriangle from "@vexed/ui/icons/AlertTriangle";
  import ChevronDown from "@vexed/ui/icons/ChevronDown";
  import RotateCcw from "@vexed/ui/icons/RotateCcw";

  import { client } from "~/shared/tipc";
  import type { HotkeySection, RecordingState } from "./types";
  import {
    isValidHotkey,
    parseKeyboardEvent,
    createHotkeyConfig,
    findConflicts,
    getActionForHotkey,
  } from "./utils";
  import { createRendererLogger } from "../../shared/logger";
  import type { Platform } from "~/shared/types";

  const logger = createRendererLogger();

  let hotkeysSections = $state<HotkeySection[]>(createHotkeyConfig());
  let recordingState = $state<RecordingState>({
    isRecording: false,
    actionId: null,
    lastPressedKey: "",
    isClearing: false,
  });
  let activeSection = $state<string | null>(null);
  let dialogOpen = $state(false);
  let conflicts = $derived(findConflicts(hotkeysSections));
  let platform = $state<Platform>();

  async function loadHotkeys() {
    logger.info("loading hotkeys...");

    try {
      const config = await client.hotkeys.all();
      if (!config) return;

      for (const section of hotkeysSections) {
        for (const item of section.items) {
          // @ts-expect-error - dynamic key access
          const hotkeyValue = config[section.name]?.[item.label];
          if (hotkeyValue && isValidHotkey(hotkeyValue)) {
            item.value = hotkeyValue;
          } else {
            item.value = "";
          }
        }
      }
      hotkeysSections = [...hotkeysSections];
    } catch (error) {
      logger.error("Failed to load hotkeys from config.", error);
    }
  }

  function startRecording(actionId: string) {
    if (recordingState.isRecording) return;

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
    if (!item) return;

    item.value = combination;

    stopRecording();
    await client.hotkeys.updateHotkey({
      configKey: item.configKey,
      id: item.id,
      value: combination,
    });
  }

  async function clearHotkey() {
    if (!recordingState.isRecording || !recordingState.actionId) return;

    const item = findHotkeyItemById(recordingState.actionId);
    if (!item) return;

    item.value = "";

    await client.hotkeys.updateHotkey({
      configKey: item.configKey,
      id: item.id,
      value: "",
    });
    stopRecording();
  }

  async function restoreDefaults() {
    logger.info("Restoring defaults...");
    stopRecording();

    try {
      await client.hotkeys.restoreDefaults();
      await loadHotkeys();
    } catch (error) {
      logger.error("Failed to restore defaults", error);
    }
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

  function onKeyDown(ev: KeyboardEvent) {
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
      const conflictingAction = getActionForHotkey(
        recordingState.lastPressedKey,
        hotkeysSections,
      );
      if (
        !conflictingAction ||
        conflictingAction === getActionNameById(recordingState.actionId || "")
      ) {
        confirmRecording(recordingState.lastPressedKey);
      }
      return;
    }

    const combination = parseKeyboardEvent(ev, platform!);
    if (combination) {
      recordingState.lastPressedKey = combination;
      recordingState.isClearing = false;
    }
  }

  onMount(async () => {
    try {
      platform = await client.app.platform();
      console.log("platform", platform);
      await loadHotkeys();
    } catch {}

    if (hotkeysSections?.length > 0) activeSection = hotkeysSections[0]!.name;
  });

  onDestroy(() => {
    Mousetrap.reset();
  });
</script>

<svelte:window on:keydown={(ev) => onKeyDown(ev)} />

<div class="bg-background flex h-screen flex-col">
  <header
    class="bg-background/95 supports-[backdrop-filter]:bg-background/80 border-border/50 elevation-1 sticky top-0 z-10 border-b px-6 py-3 backdrop-blur-xl"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h1 class="text-foreground text-base font-semibold tracking-tight">
          Hotkeys
        </h1>
      </div>
      <button
        class="text-muted-foreground hover:bg-secondary/50 hover:text-foreground group flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-all"
        onclick={() => {
          stopRecording();
          dialogOpen = true;
        }}
      >
        <RotateCcw
          class="h-3 w-3 transition-transform duration-300 group-hover:-rotate-180"
        />
        <span>Restore Defaults</span>
      </button>
    </div>
  </header>

  {#if conflicts.length > 0}
    <div class="border-destructive/30 bg-destructive/5 border-b px-6 py-2">
      <div class="flex items-center gap-2 text-sm">
        <AlertTriangle class="text-destructive h-4 w-4" />
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
            class="bg-secondary/20 hover:bg-secondary/40 group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors"
            onclick={() => {
              if (recordingState.isRecording) stopRecording();
              activeSection = isExpanded ? null : section.name;
            }}
          >
            {#if getSectionIcon(section.icon)}
              {@const Icon = getSectionIcon(section.icon)}
              <Icon class="text-muted-foreground h-3.5 w-3.5 shrink-0" />
            {/if}
            <span
              class="text-muted-foreground text-xs font-medium uppercase tracking-wide"
            >
              {section.name}
            </span>
            <ChevronDown
              class={cn(
                "text-muted-foreground/60 ml-auto h-3.5 w-3.5",
                isExpanded && "rotate-180",
              )}
            />
          </button>

          {#if isExpanded}
            <div class="mt-1 space-y-px pl-1">
              {#each section.items as item}
                {@const isRecordingThis =
                  recordingState.isRecording &&
                  recordingState.actionId === item.id}
                {@const hasConflict =
                  isRecordingThis &&
                  recordingState.lastPressedKey &&
                  getActionForHotkey(
                    recordingState.lastPressedKey,
                    hotkeysSections,
                  ) &&
                  getActionForHotkey(
                    recordingState.lastPressedKey,
                    hotkeysSections,
                  ) !== item.label}
                <div
                  class={cn(
                    "group/row flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors",
                    isRecordingThis
                      ? "bg-primary/5 relative"
                      : "hover:bg-secondary/30 cursor-pointer bg-transparent",
                  )}
                  onclick={() => !isRecordingThis && startRecording(item.id)}
                  onkeydown={(ev) => {
                    if (!isRecordingThis && ev.key === "Enter")
                      startRecording(item.id);
                  }}
                  role="button"
                  tabindex="0"
                >
                  <span class="text-foreground text-sm">{item.label}</span>
                  <div
                    class={cn(
                      "flex h-7 min-w-[110px] items-center justify-end gap-2 rounded-md px-2 transition-all",
                    )}
                  >
                    {#if isRecordingThis}
                      {#if recordingState.lastPressedKey}
                        <span
                          class={cn("key-pop", hasConflict && "conflict-shake")}
                        >
                          <Kbd
                            hotkey={recordingState.lastPressedKey}
                            class={cn(
                              "transition-all",
                              hasConflict
                                ? "border-destructive/60 text-destructive shadow-[0_0_8px_hsl(var(--destructive)/0.3)]"
                                : "border-primary/50 shadow-[0_0_6px_hsl(var(--primary)/0.2)]",
                            )}
                          />
                        </span>
                      {:else}
                        <span class="text-primary animate-pulse text-xs"
                          >...</span
                        >
                      {/if}
                    {:else if item.value}
                      <Kbd
                        hotkey={item.value}
                        class="group-hover/row:border-primary/40 transition-all"
                      />
                    {:else}
                      <span
                        class="text-muted-foreground/50 group-hover/row:text-muted-foreground text-xs"
                      >
                        Click to bind
                      </span>
                    {/if}
                  </div>
                </div>
                {#if isRecordingThis}
                  <div
                    class="text-muted-foreground/70 mt-1.5 flex items-center gap-3 rounded-md px-2.5 py-1.5 text-[10px]"
                  >
                    <span><Kbd>Esc</Kbd> cancel</span>
                    <span><Kbd>Backspace</Kbd> clear</span>
                    {#if recordingState.lastPressedKey}
                      <span
                        class={hasConflict
                          ? "text-destructive/70"
                          : "text-primary/70"}
                      >
                        <Kbd>Enter</Kbd>
                        {hasConflict ? "conflict" : "confirm"}
                      </span>
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

<AlertDialog.Root bind:open={dialogOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Restore Default Hotkeys?</AlertDialog.Title>
      <AlertDialog.Description>
        This will reset all hotkey bindings to their default values. Any custom
        hotkeys you've configured will be lost.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <Button variant="ghost" size="sm" onclick={() => (dialogOpen = false)}>
        No, cancel
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onclick={() => {
          restoreDefaults();
          dialogOpen = false;
        }}
      >
        Yes, restore
      </Button>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<style>
  /* Keystroke pop-in animation */
  .key-pop {
    animation: key-pop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes key-pop {
    0% {
      transform: scale(0.85);
      opacity: 0.5;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* Conflict shake animation */
  .conflict-shake {
    animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
  }

  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    20% {
      transform: translateX(-3px);
    }
    40% {
      transform: translateX(3px);
    }
    60% {
      transform: translateX(-2px);
    }
    80% {
      transform: translateX(2px);
    }
  }
</style>
