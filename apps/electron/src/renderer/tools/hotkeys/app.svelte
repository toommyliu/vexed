<script lang="ts">
  import Mousetrap from "mousetrap";
  import { onDestroy, onMount } from "svelte";
  import Config from "@vexed/config";
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
  import { DEFAULT_HOTKEYS, HOTKEYS_PATH } from "@/shared";

  let config = $state<Config<HotkeyConfig> | null>(null);
  let hotkeysSections = $state<HotkeySection[]>(createHotkeyConfig());
  let recordingState = $state<RecordingState>({
    isRecording: false,
    actionId: null,
    lastPressedKey: "",
    isClearing: false,
  });

  let conflicts = $derived(findConflicts(hotkeysSections));

  async function saveHotkeyConfig() {
    if (!config) return;

    try {
      for (const section of hotkeysSections) {
        for (const item of section.items) {
          config.set(item.configKey, item.value);
        }
      }

      await config.save();
      // console.log("Hotkey configuration saved successfully");
    } catch (error) {
      // console.error("Failed to save hotkey configuration:", error);
    }
  }

  async function loadHotkeysFromConfig() {
    if (!config) return;

    try {
      // console.log("Loading hotkeys from config...");

      for (const section of hotkeysSections) {
        for (const item of section.items) {
          const hotkeyValue = config.get(item.configKey as any, "")! as string;

          if (hotkeyValue && isValidHotkey(hotkeyValue)) {
            // console.log(`Setting ${item.configKey} from config:`, hotkeyValue);
            item.value = hotkeyValue;
          } else {
            item.value = "";
          }
        }
      }

      // console.log(hotkeysSections);
      // console.log("Hotkeys loaded successfully from config");
    } catch (error) {
      console.error("Failed to load hotkeys from config:", error);
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

    // console.log("Started recording for action:", actionId);
  }

  async function confirmRecording(combination: string) {
    if (!recordingState.isRecording || !recordingState.actionId) return;

    if (!combination || combination.trim() === "") {
      // console.log("Empty combination provided, blocking");
      return;
    }

    const conflictingAction = getActionForHotkey(combination, hotkeysSections);
    if (
      conflictingAction &&
      conflictingAction !== getActionNameById(recordingState.actionId)
    ) {
      // console.log("Combination already exists, blocking");
      return;
    }

    // console.log(
    //   `confirmRecording called with combination: ${combination} for action: ${recordingState.actionId}`,
    // );

    const item = findHotkeyItemById(recordingState.actionId);
    if (item) {
      item.value = combination;
      // console.log(`Assigned ${recordingState.actionId}: ${combination}`);
    } else {
      // console.error(`Unknown action ID: ${recordingState.actionId}`);
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

    // console.log(`Clearing hotkey for action: ${recordingState.actionId}`);

    const item = findHotkeyItemById(recordingState.actionId);
    if (item) {
      item.value = "";
      // console.log(`Cleared hotkey for ${recordingState.actionId}`);
    } else {
      // console.error(`Unknown action ID: ${recordingState.actionId}`);
    }

    await saveHotkeyConfig();
    stopRecording();
  }

  function findHotkeyItemById(actionId: string) {
    for (const section of hotkeysSections) {
      for (const item of section.items) {
        if (item.id === actionId) {
          return item;
        }
      }
    }
    return null;
  }

  function getActionNameById(actionId: string): string | null {
    const item = findHotkeyItemById(actionId);
    return item ? item.label : null;
  }

  function stopRecording() {
    // console.log("Stopping recording...");

    recordingState.isRecording = false;
    recordingState.actionId = null;
    recordingState.lastPressedKey = "";
    recordingState.isClearing = false;

    // console.log("Recording stopped");
  }

  onMount(async () => {
    config = new Config<HotkeyConfig>({
      configName: "hotkeys",
      cwd: HOTKEYS_PATH,
      defaults: DEFAULT_HOTKEYS,
    });
    await config.load();

    // console.log("config loaded:", config.getAll());

    await loadHotkeysFromConfig();
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

    // console.log("Recording key:", ev.key, "with modifiers:", {
    //   ctrl: ev.ctrlKey,
    //   alt: ev.altKey,
    //   shift: ev.shiftKey,
    //   meta: ev.metaKey,
    // });

    // Stop recording on Escape
    if (ev.key === "Escape") {
      stopRecording();
      return;
    }

    // Clear hotkey on Backspace
    if (ev.key === "Backspace") {
      clearHotkey();
      return;
    }

    const combination = parseKeyboardEvent(ev);
    if (combination) {
      recordingState.lastPressedKey = combination;
      recordingState.isClearing = false;
      // console.log("Set lastPressedKey to:", combination);
    }
  }}
/>

<main class="bg-background-primary flex min-h-screen select-none flex-col">
  <div class="mx-auto w-full max-w-6xl flex-grow p-4">
    {#if conflicts.length > 0}
      <div class="mb-4 rounded-md border border-red-600/50 bg-red-900/30 p-3">
        <div class="flex items-start space-x-3">
          <div class="rounded bg-red-500/20 p-1">
            <svg
              class="h-4 w-4 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="font-medium text-red-300">Hotkey Conflicts Detected</h3>
            <p class="mt-1 text-sm text-red-200/80">
              The following hotkeys are assigned to multiple actions: <span
                class="font-mono">{conflicts.join(", ")}</span
              >
            </p>
            <p class="text-xs text-gray-600">
              Hotkeys have been disabled until the conflict is resolved.
            </p>
          </div>
        </div>
      </div>
    {/if}

    <div class="grid auto-cols-auto auto-rows-auto space-y-4">
      {#each hotkeysSections as section}
        <div
          class="bg-background-secondary rounded-md border border-zinc-700/50 shadow-lg backdrop-blur-sm"
        >
          <div class="border-b border-zinc-700/30 px-4 py-3">
            <div class="flex items-center space-x-3">
              <div class="rounded-md bg-blue-500/20 p-2">
                {#if section.name === "General"}
                  <svg
                    class="h-5 w-5 text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                {:else if section.name === "Scripts"}
                  <svg
                    class="h-5 w-5 text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                {:else if section.name === "Tools"}
                  <svg
                    class="h-5 w-5 text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                {:else}
                  <svg
                    class="h-5 w-5 text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                {/if}
              </div>
              <div>
                <h2 class="text-lg font-semibold text-white">
                  {section.name}
                </h2>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {#each section.items as item}
              <div
                class="group relative rounded-md border border-zinc-600/40 bg-zinc-800/30 p-3 transition-all duration-200 hover:border-zinc-500/60 hover:bg-zinc-700/40"
              >
                <div class="flex items-center justify-between">
                  <div class="text-sm font-medium text-white">{item.label}</div>

                  <div class="hotkey-container flex items-center">
                    {#if item.value}
                      <div class="relative flex items-center">
                        <div
                          class="rounded-md bg-gray-800/50 px-2 py-1 font-mono text-xs text-white"
                          ondblclick={() => startRecording(item.id)}
                          title="Double-click to edit"
                          role="button"
                          tabindex="0"
                        >
                          {formatHotkey(item.value)}
                        </div>

                        <button
                          class="ml-2 rounded-md bg-gray-800/50 p-1 text-white transition-all duration-200 hover:bg-gray-700/60"
                          onclick={() => startRecording(item.id)}
                          title="Edit hotkey"
                          aria-label="Edit hotkey"
                        >
                          <svg
                            class="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                      </div>
                    {:else}
                      <div class="flex items-center">
                        <div class="mr-2 text-xs text-zinc-500">Not set</div>
                        <button
                          class="rounded-md bg-gradient-to-r from-emerald-600 to-emerald-700 px-2 py-1 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:from-emerald-500 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                          onclick={() => startRecording(item.id)}
                        >
                          Set
                        </button>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
</main>

{#if recordingState.isRecording}
  <div
    class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
    style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; transform: none;"
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
      class="bg-background-secondary relative mx-4 w-full max-w-md rounded-md border border-zinc-700/50 p-4 shadow-xl"
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
        <h3 class="text-xl font-semibold text-white">Recording Hotkey</h3>
        <p class="mt-1 text-gray-400">
          Press any key combination for: <span class="font-medium text-blue-300"
            >{getActionNameById(recordingState.actionId || "")}</span
          >
        </p>
      </div>

      <div class="mb-4 rounded-md border border-zinc-600/50 bg-zinc-800/30 p-4">
        <div class="text-center">
          <div class="flex min-h-[3rem] items-center justify-center">
            {#if recordingState.isClearing}
              <div class="flex items-center space-x-2 text-green-400">
                <svg
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span class="text-sm font-medium"
                  >Hotkey cleared successfully</span
                >
              </div>
            {:else if recordingState.lastPressedKey}
              <div class="flex items-center space-x-2">
                {#each formatHotkey(recordingState.lastPressedKey).split("+") as keyPart, index}
                  {#if index > 0}
                    <span class="text-zinc-400">+</span>
                  {/if}
                  <kbd
                    class="rounded-md bg-zinc-600 px-3 py-2 font-mono text-sm font-medium text-white shadow-md"
                  >
                    {keyPart}
                  </kbd>
                {/each}
              </div>
            {:else}
              <div class="flex items-center space-x-2 text-zinc-500">
                <div
                  class="h-2 w-2 animate-pulse rounded-full bg-blue-400"
                ></div>
                <span class="text-sm">Waiting for key input...</span>
              </div>
            {/if}
          </div>
        </div>
      </div>

      {#if recordingState.lastPressedKey && getActionForHotkey(recordingState.lastPressedKey, hotkeysSections) && getActionForHotkey(recordingState.lastPressedKey, hotkeysSections) !== getActionNameById(recordingState.actionId || "")}
        <div class="mb-4 rounded-md border border-red-600/50 bg-red-900/30 p-3">
          <div class="flex items-center space-x-2">
            <svg
              class="h-4 w-4 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            <div class="flex-1">
              <div class="text-sm font-medium text-red-300">
                Conflict Detected
              </div>
              <div class="text-xs text-red-200/80">
                This hotkey is already assigned to "{getActionForHotkey(
                  recordingState.lastPressedKey,
                  hotkeysSections,
                )}"
              </div>
            </div>
          </div>
        </div>
      {/if}

      <div class="flex space-x-3">
        <button
          onclick={stopRecording}
          class="flex-1 rounded-md border border-zinc-600/50 bg-zinc-800/30 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all duration-200 hover:bg-zinc-700/40 focus:outline-none focus:ring-2 focus:ring-zinc-500/50"
        >
          Cancel
        </button>

        {#if recordingState.lastPressedKey}
          <button
            onclick={() => confirmRecording(recordingState.lastPressedKey)}
            class="flex-1 rounded-md bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:from-blue-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:from-zinc-600 disabled:to-zinc-500 disabled:opacity-50"
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
            <div class="flex items-center justify-center space-x-2">
              <svg
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Confirm</span>
            </div>
          </button>
        {/if}
      </div>

      <div class="mt-4 rounded-md border border-zinc-600/30 bg-zinc-700/20 p-3">
        <div class="mb-1 flex items-center space-x-2">
          <svg
            class="h-4 w-4 text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span class="text-sm font-medium text-zinc-300">Tips</span>
        </div>
        <div class="space-y-1 text-xs text-zinc-400">
          <p>
            Press <kbd class="rounded bg-zinc-600 px-1.5 py-0.5 text-white"
              >Esc</kbd
            > to cancel
          </p>
          <p>
            Press <kbd class="rounded bg-zinc-600 px-1.5 py-0.5 text-white"
              >Backspace</kbd
            > to clear the hotkey
          </p>
          <p>
            Use modifier keys {isMac ? "(⌘, ⌥, ⇧)" : "(Ctrl, Alt, Shift)"} for better
            combinations
          </p>
          <p>
            Avoid system shortcuts like {isMac ? "⌘C, ⌘V" : "Ctrl+C, Ctrl+V"}
          </p>
        </div>
      </div>
    </div>
  </div>
{/if}
