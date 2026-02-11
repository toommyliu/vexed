<script lang="ts">
  import Mousetrap from "mousetrap";
  import { onMount } from "svelte";
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

  import { parseKeyboardEvent } from "~/shared/hotkeys/input";
  import {
    HOTKEY_SECTIONS,
    findConflicts,
    getActionForHotkey,
    type HotkeySection,
    type HotkeyId,
  } from "~/shared/hotkeys/schema";
  import {
    loadHotkeys as fetchHotkeys,
    saveHotkey,
    restoreDefaults as restoreDefaultHotkeys,
  } from "~/shared/hotkeys/storage";
  import type { Platform } from "~/shared/types";
  import { client } from "~/shared";

  type RecordingState = {
    isRecording: boolean;
    actionId: HotkeyId | null;
    lastPressedKey: string;
    isClearing: boolean;
  };

  let hotkeysSections = $state<HotkeySection[]>(
    HOTKEY_SECTIONS.map((s) => ({
      ...s,
      items: s.items.map((i) => ({ ...i, value: i.defaultValue })),
    })),
  );

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
    try {
      hotkeysSections = await fetchHotkeys();
    } catch (error) {
      console.error("Failed to load hotkeys", error);
    }
  }

  function startRecording(actionId: HotkeyId) {
    if (recordingState.isRecording) return;
    recordingState.isRecording = true;
    recordingState.actionId = actionId;
    recordingState.lastPressedKey = "";
    recordingState.isClearing = false;
    Mousetrap.reset();
  }

  // TODO: don't update UI if saving hotkey fails

  async function confirmRecording(combination: string) {
    if (!recordingState.isRecording || !recordingState.actionId) return;
    if (!combination || combination.trim() === "") return;

    const actionId = recordingState.actionId as HotkeyId;
    const conflictingAction = getActionForHotkey(combination, hotkeysSections);
    if (
      conflictingAction &&
      conflictingAction !== getActionNameById(actionId)
    ) {
      return;
    }

    const item = findHotkeyItemById(actionId);
    if (!item) return;

    item.value = combination;
    stopRecording();
    await saveHotkey(item.id, combination);
  }

  async function clearHotkey() {
    if (!recordingState.isRecording || !recordingState.actionId) return;

    const actionId = recordingState.actionId as HotkeyId;
    const item = findHotkeyItemById(actionId);
    if (!item) return;

    item.value = "";
    await saveHotkey(item.id, "");
    stopRecording();
  }

  async function restoreDefaults() {
    console.log("Restoring defaults...");
    stopRecording();
    try {
      await restoreDefaultHotkeys();
      await loadHotkeys();
    } catch (error) {
      console.error("Failed to restore defaults", error);
    }
  }

  function findHotkeyItemById(actionId: HotkeyId) {
    for (const section of hotkeysSections) {
      for (const item of section.items) {
        if (item.id === actionId) return item;
      }
    }

    return null;
  }

  function getActionNameById(actionId: HotkeyId): string | null {
    const item = findHotkeyItemById(actionId);
    return item?.label ?? null;
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

    // Enter to confirm recording
    if (ev.key === "Enter" && recordingState.lastPressedKey) {
      const actionId = recordingState.actionId as HotkeyId;
      if (!actionId) return;

      const conflictingAction = getActionForHotkey(
        recordingState.lastPressedKey,
        hotkeysSections,
      );
      if (
        !conflictingAction ||
        conflictingAction === getActionNameById(actionId)
      ) {
        confirmRecording(recordingState.lastPressedKey);
      }

      return;
    }

    // Parse key press
    const combination = parseKeyboardEvent(ev, platform!);
    if (combination) {
      recordingState.lastPressedKey = combination;
      recordingState.isClearing = false;
    }
  }

  onMount(async () => {
    try {
      platform = await client.app.platform();
      await loadHotkeys();
    } catch (error) {
      console.error("Failed to load hotkeys", error);
    }

    if (hotkeysSections?.length > 0) activeSection = hotkeysSections[0]!.name;
  });
</script>

<svelte:window on:keydown={(ev) => onKeyDown(ev)} />

<div class="flex h-screen flex-col bg-background">
  <header
    class="elevation-1 sticky top-0 z-10 border-b border-border/50 bg-background/95 px-6 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h1 class="text-base font-semibold tracking-tight text-foreground">
          Hotkeys
        </h1>
      </div>
      <Button
        variant="destructive"
        size="xs"
        onclick={() => {
          stopRecording();
          dialogOpen = true;
        }}
      >
        <span>Restore Defaults</span>
      </Button>
    </div>
  </header>

  <!-- {#if conflicts.length > 0}
    <div class="border-b border-destructive/30 bg-destructive/5 px-6 py-2">
      <div class="flex flex-col gap-1.5 text-sm">
        <div class="flex items-center gap-2">
          <AlertTriangle class="h-4 w-4 text-destructive" />
          <span class="font-medium text-destructive"
            >Hotkey Conflicts Found</span
          >
        </div>
        <div class="flex flex-col gap-1 pl-6">
          {#each conflicts as conflict (conflict.hotkey)}
            <div class="text-xs text-destructive/80">
              <span class="font-mono font-medium text-destructive"
                >{conflict.hotkey}</span
              >
              is assigned to:
              <span class="font-medium">{conflict.labels.join(", ")}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if} -->

  <div class="flex-1 overflow-auto">
    <div class="mx-auto max-w-xl px-6 py-4">
      {#each hotkeysSections as section, sectionIndex (section.name)}
        {@const sectionConflicts = conflicts.filter((c) =>
          section.items.some((i) => c.labels.includes(i.label)),
        )}
        {@const isExpanded = activeSection === section.name}
        <div class={cn(sectionIndex > 0 && "mt-1")}>
          <button
            class="group flex w-full items-center gap-2 rounded-md bg-secondary/20 px-2 py-1.5 text-left transition-colors hover:bg-secondary/40"
            onclick={() => {
              if (recordingState.isRecording) stopRecording();
              activeSection = isExpanded ? null : section.name;
            }}
          >
            {#if getSectionIcon(section.icon)}
              {@const Icon = getSectionIcon(section.icon)}
              <Icon class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {/if}
            <span
              class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              {section.name}
            </span>

            {#if sectionConflicts.length > 0}
              <div
                class="flex items-center gap-1.5 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive"
              >
                <AlertTriangle class="h-2.5 w-2.5" />
                <span
                  >{sectionConflicts.length}
                  {sectionConflicts.length === 1
                    ? "conflict"
                    : "conflicts"}</span
                >
              </div>
            {/if}
            <ChevronDown
              class={cn(
                "ml-auto h-3.5 w-3.5 text-muted-foreground/60",
                isExpanded && "rotate-180",
              )}
            />
          </button>

          {#if isExpanded}
            <div class="mt-1 space-y-px pl-1">
              {#each section.items as item (item.id)}
                {@const isRecordingThis =
                  recordingState.isRecording &&
                  recordingState.actionId === item.id}
                {@const itemConflict = conflicts.find((c) =>
                  c.labels.includes(item.label),
                )}
                <div
                  class={cn(
                    "group/row flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors",
                    isRecordingThis
                      ? "relative bg-primary/5"
                      : "cursor-pointer bg-transparent hover:bg-secondary/30",
                  )}
                  onclick={() => !isRecordingThis && startRecording(item.id)}
                  onkeydown={(ev) => {
                    if (!isRecordingThis && ev.key === "Enter")
                      startRecording(item.id);
                  }}
                  role="button"
                  tabindex="0"
                >
                  <div class="flex items-center gap-3">
                    <span class="text-sm text-foreground">{item.label}</span>
                    {#if itemConflict && !isRecordingThis}
                      {@const otherActions = itemConflict.labels.filter(
                        (l) => l !== item.label,
                      )}
                      <span
                        class="flex items-center gap-1 text-[10px] font-medium text-destructive/70"
                      >
                        <AlertTriangle class="h-2.5 w-2.5" />
                        {otherActions.join(", ")}
                      </span>
                    {/if}
                  </div>
                  <div
                    class={cn(
                      "flex h-7 min-w-[110px] items-center justify-end gap-2 rounded-md px-2 transition-all",
                    )}
                  >
                    {#if isRecordingThis}
                      {@const recordingConflict =
                        recordingState.lastPressedKey &&
                        getActionForHotkey(
                          recordingState.lastPressedKey,
                          hotkeysSections,
                        ) &&
                        getActionForHotkey(
                          recordingState.lastPressedKey,
                          hotkeysSections,
                        ) !== item.label}
                      {#if recordingState.lastPressedKey}
                        <span
                          class={cn(
                            "key-pop",
                            recordingConflict && "conflict-shake",
                          )}
                        >
                          <Kbd
                            hotkey={recordingState.lastPressedKey}
                            kbdClass={cn(
                              "transition-all",
                              recordingConflict
                                ? "border-destructive/60 text-destructive shadow-[0_0_8px_hsl(var(--destructive)/0.3)]"
                                : "border-primary/50 shadow-[0_0_6px_hsl(var(--primary)/0.2)]",
                            )}
                          />
                        </span>
                      {:else}
                        <span class="animate-pulse text-xs text-primary"
                          >...</span
                        >
                      {/if}
                    {:else if item.value}
                      <Kbd
                        hotkey={item.value}
                        kbdClass={cn(
                          "transition-all group-hover/row:border-primary/40",
                          itemConflict &&
                            "border-destructive/40 text-destructive",
                        )}
                      />
                    {:else}
                      <span
                        class="text-xs text-muted-foreground/50 group-hover/row:text-muted-foreground"
                      >
                        Click to bind
                      </span>
                    {/if}
                  </div>
                </div>
                {#if isRecordingThis}
                  {@const recordingConflict =
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
                    class="mt-1.5 flex items-center gap-3 rounded-md px-2.5 py-1.5 text-[10px] text-muted-foreground/70"
                  >
                    <span><Kbd>Esc</Kbd> cancel</span>
                    <span><Kbd>Backspace</Kbd> clear</span>
                    {#if recordingState.lastPressedKey}
                      <span
                        class={recordingConflict
                          ? "text-destructive/70"
                          : "text-primary/70"}
                      >
                        <Kbd
                          kbdClass={recordingConflict
                            ? "opacity-40 grayscale"
                            : ""}>Enter</Kbd
                        >
                        {recordingConflict ? "conflict" : "confirm"}
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
