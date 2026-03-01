<script lang="ts">
  import Mousetrap from "mousetrap";
  import { onMount } from "svelte";
  import { AlertDialog, Button, Icon, Kbd } from "@vexed/ui";
  import { cn } from "@vexed/ui/util";

  import { parseKeyboardEvent } from "~/shared/hotkeys/input";
  import {
    findConflicts,
    getHotkeySections,
    getActionForHotkey,
    type HotkeyConflict,
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

  type HotkeyItemRef = {
    item: HotkeySection["items"][number];
    itemIndex: number;
    sectionIndex: number;
  };

  type RecordingState = {
    actionId: HotkeyId | null;
    isRecording: boolean;
    lastPressedKey: string;
  };

  function hydrateSectionValues(sections: HotkeySection[]): HotkeySection[] {
    return sections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        value: item.defaultValue,
      })),
    }));
  }

  let hotkeysSections = $state<HotkeySection[]>([]);

  const recordingState = $state<RecordingState>({
    isRecording: false,
    actionId: null,
    lastPressedKey: "",
  });
  let activeSection = $state<string | null>(null);
  let dialogOpen = $state(false);
  let pendingSaveByAction = $state<Record<HotkeyId, boolean>>(
    {} as Record<HotkeyId, boolean>,
  );
  let rowErrorByAction = $state<Record<HotkeyId, string | null>>(
    {} as Record<HotkeyId, string | null>,
  );
  let uiError = $state<string | null>(null);
  const conflicts = $derived(findConflicts(hotkeysSections));
  const conflictByLabel = $derived(
    conflicts.reduce(
      (map: Map<string, HotkeyConflict>, conflict: HotkeyConflict) => {
        for (const label of conflict.labels) map.set(label, conflict);
        return map;
      },
      new Map<string, HotkeyConflict>(),
    ),
  );
  const sectionConflictCountByName = $derived(
    hotkeysSections.reduce(
      (map: Map<string, number>, section: HotkeySection) => {
        map.set(
          section.name,
          section.items.filter((item) => conflictByLabel.has(item.label))
            .length,
        );
        return map;
      },
      new Map<string, number>(),
    ),
  );
  let platform = $state<Platform>();

  async function loadHotkeys() {
    uiError = null;
    try {
      hotkeysSections = await fetchHotkeys(platform!);
    } catch (error) {
      uiError = "Failed to load hotkeys. Showing last known values.";
      console.error("Failed to load hotkeys", error);
    }
  }

  function getItemById(actionId: HotkeyId): HotkeyItemRef | null {
    for (const [sectionIndex, section] of hotkeysSections.entries()) {
      for (const [itemIndex, item] of section.items.entries()) {
        if (item.id !== actionId) continue;
        return { sectionIndex, itemIndex, item };
      }
    }
    return null;
  }

  function getActionNameById(actionId: HotkeyId): string | null {
    return getItemById(actionId)?.item.label ?? null;
  }

  function getConflictForLabel(label: string): HotkeyConflict | null {
    return conflictByLabel.get(label) ?? null;
  }

  function isActionPending(actionId: HotkeyId): boolean {
    return pendingSaveByAction[actionId] ?? false;
  }

  function setActionPending(actionId: HotkeyId, pending: boolean) {
    pendingSaveByAction = {
      ...pendingSaveByAction,
      [actionId]: pending,
    };
  }

  function setRowError(actionId: HotkeyId, message: string | null) {
    rowErrorByAction = {
      ...rowErrorByAction,
      [actionId]: message,
    };
  }

  function clearAllRowErrors() {
    rowErrorByAction = {} as Record<HotkeyId, string | null>;
  }

  function updateHotkeyValue(actionId: HotkeyId, value: string) {
    hotkeysSections = hotkeysSections.map((section) => ({
      ...section,
      items: section.items.map((item) =>
        item.id === actionId ? { ...item, value } : item,
      ),
    }));
  }

  function beginRecording(actionId: HotkeyId) {
    if (recordingState.isRecording) return;
    if (isActionPending(actionId)) return;
    setRowError(actionId, null);

    recordingState.isRecording = true;
    recordingState.actionId = actionId;
    recordingState.lastPressedKey = "";
    Mousetrap.reset();
  }

  function cancelRecording() {
    recordingState.isRecording = false;
    recordingState.actionId = null;
    recordingState.lastPressedKey = "";
  }

  function setRecordedCombination(combination: string) {
    if (!recordingState.isRecording || !recordingState.actionId) return;
    recordingState.lastPressedKey = combination;
  }

  function getRecordingConflict(actionId: HotkeyId, hotkey: string): boolean {
    const actionLabel = getActionNameById(actionId);
    if (!actionLabel) return false;
    const conflictingAction = getActionForHotkey(hotkey, hotkeysSections);
    return Boolean(conflictingAction && conflictingAction !== actionLabel);
  }

  async function saveWithRollback(actionId: HotkeyId, nextValue: string) {
    if (isActionPending(actionId)) return;
    const itemRef = getItemById(actionId);
    if (!itemRef) return;
    const previousValue = itemRef.item.value ?? "";
    setActionPending(actionId, true);
    setRowError(actionId, null);
    updateHotkeyValue(actionId, nextValue);
    try {
      const saved = await saveHotkey(actionId, nextValue, platform!);
      if (!saved) {
        updateHotkeyValue(actionId, previousValue);
        setRowError(actionId, "Could not save this hotkey. Reverted.");
      }
    } catch (error) {
      updateHotkeyValue(actionId, previousValue);
      setRowError(actionId, "Could not save this hotkey. Reverted.");
      console.error("Failed to save hotkey", error);
    } finally {
      setActionPending(actionId, false);
    }
  }

  async function confirmRecording() {
    if (!recordingState.isRecording || !recordingState.actionId) return;
    const actionId = recordingState.actionId;
    const combination = recordingState.lastPressedKey.trim();
    if (!combination) return;
    if (getRecordingConflict(actionId, combination)) return;
    cancelRecording();
    await saveWithRollback(actionId, combination);
  }

  async function clearRecordedHotkey() {
    if (!recordingState.isRecording || !recordingState.actionId) return;
    const actionId = recordingState.actionId;
    cancelRecording();
    await saveWithRollback(actionId, "");
  }

  async function restoreDefaults() {
    cancelRecording();
    uiError = null;
    clearAllRowErrors();
    try {
      const restored = await restoreDefaultHotkeys();
      if (!restored) {
        uiError = "Failed to restore default hotkeys.";
        return;
      }
      await loadHotkeys();
    } catch (error) {
      uiError = "Failed to restore default hotkeys.";
      console.error("Failed to restore defaults", error);
    }
  }

  // TODO: find substitution
  // function getSectionIcon(icon: string) {
  //   switch (icon) {
  //     case "general":
  //       return Settings;
  //     case "application":
  //       return AppWindow;
  //     case "scripts":
  //       return Code;
  //     case "tools":
  //       return Wrench;
  //     case "packets":
  //       return Radio;
  //     default:
  //       return Inbox;
  //   }
  // }

  function onKeyDown(ev: KeyboardEvent) {
    if (!recordingState.isRecording) return;
    if (!document.hasFocus() || document.hidden) return;
    const currentPlatform = platform;
    if (!currentPlatform) return;

    ev.preventDefault();
    ev.stopPropagation();

    if (ev.key === "Escape") {
      cancelRecording();
      return;
    }

    if (ev.key === "Backspace") {
      void clearRecordedHotkey();
      return;
    }

    // Enter to confirm recording
    if (ev.key === "Enter" && recordingState.lastPressedKey) {
      const actionId = recordingState.actionId;
      if (!actionId) return;
      if (!getRecordingConflict(actionId, recordingState.lastPressedKey))
        void confirmRecording();

      return;
    }

    // Parse key press
    const combination = parseKeyboardEvent(ev, currentPlatform);
    if (combination) {
      setRecordedCombination(combination);
    }
  }

  onMount(async () => {
    const platformRes = await Promise.allSettled([client.app.getPlatform()]);
    const platformResult = platformRes[0];
    if (platformResult.status === "fulfilled") {
      const currentPlatform = platformResult.value;
      platform = currentPlatform;
      hotkeysSections = hydrateSectionValues(
        getHotkeySections(currentPlatform),
      );
      await loadHotkeys();
    } else console.error("Failed to get platform", platformResult.reason);
    if (platformResult.status === "rejected") await loadHotkeys();
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
          cancelRecording();
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
      {#if uiError}
        <div
          class="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {uiError}
        </div>
      {/if}
      {#each hotkeysSections as section, sectionIndex (section.name)}
        {@const sectionConflictCount =
          sectionConflictCountByName.get(section.name) ?? 0}
        {@const isExpanded = activeSection === section.name}
        <div class={cn(sectionIndex > 0 && "mt-1")}>
          <button
            class="group flex w-full items-center gap-2 rounded-md bg-secondary/20 px-2 py-1.5 text-left transition-colors hover:bg-secondary/40"
            onclick={() => {
              if (recordingState.isRecording) cancelRecording();
              activeSection = isExpanded ? null : section.name;
            }}
          >
            <!-- {#if getSectionIcon(section.icon)} -->
            <!-- {@const Icon = getSectionIcon(section.icon)} -->
            <!-- <Icon class="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> -->
            <!-- {/if} -->
            <span
              class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              {section.name}
            </span>

            {#if sectionConflictCount > 0}
              <div
                class="flex items-center gap-1.5 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive"
              >
                <Icon icon="triangle_alert" size="2xs" />
                <span
                  >{sectionConflictCount}
                  {sectionConflictCount === 1 ? "conflict" : "conflicts"}</span
                >
              </div>
            {/if}
            <Icon
              icon="chevron_down"
              class={cn(
                "ml-auto text-muted-foreground/60",
                isExpanded && "rotate-180",
              )}
              size="sm"
            />
          </button>

          {#if isExpanded}
            <div class="mt-1 space-y-px pl-1">
              {#each section.items as item (item.id)}
                {@const isRecordingThis =
                  recordingState.isRecording &&
                  recordingState.actionId === item.id}
                {@const pendingSave = isActionPending(item.id)}
                {@const rowError = rowErrorByAction[item.id]}
                {@const itemConflict = getConflictForLabel(item.label)}
                <div
                  class={cn(
                    "group/row flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors",
                    isRecordingThis
                      ? "relative bg-primary/5"
                      : "cursor-pointer bg-transparent hover:bg-secondary/30",
                    pendingSave && "cursor-not-allowed opacity-60",
                  )}
                  onclick={() =>
                    !isRecordingThis && !pendingSave && beginRecording(item.id)}
                  onkeydown={(ev) => {
                    if (!isRecordingThis && !pendingSave && ev.key === "Enter")
                      beginRecording(item.id);
                  }}
                  role="button"
                  tabindex="0"
                >
                  <div class="flex items-center gap-3">
                    <span class="text-sm text-foreground">{item.label}</span>
                    {#if itemConflict && !isRecordingThis}
                      {@const otherActions = itemConflict.labels.filter(
                        (label) => label !== item.label,
                      )}
                      <span
                        class="flex items-center gap-1 text-[10px] font-medium text-destructive/70"
                      >
                        <Icon icon="triangle_alert" size="2xs" />
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
                        getRecordingConflict(
                          item.id,
                          recordingState.lastPressedKey,
                        )}
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
                        {pendingSave ? "Saving..." : "Click to bind"}
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
                {#if rowError}
                  <div class="mt-1 px-2.5 text-[11px] text-destructive/80">
                    {rowError}
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
          void restoreDefaults();
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
