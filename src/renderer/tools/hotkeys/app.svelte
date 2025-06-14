<script lang="ts">
  import Mousetrap from "mousetrap";
  import process from "process";
  import { onDestroy, onMount } from "svelte";

  const isMac = process.platform === "darwin";

  let scriptLoadKey = $state("");
  let scriptToggleKey = $state("");
  let fastTravelsKey = $state("");
  let loaderGrabberKey = $state("");
  let followerKey = $state("");
  let packetLoggerKey = $state("");
  let packetSpammerKey = $state("");

  let isRecording = $state<string | null>(null);
  let lastPressedKey = $state("");

  // Functions for hotkey actions
  async function loadScript() {
    console.log("Loading script...");
  }

  async function toggleScript() {
    console.log("Toggle script");
  }

  async function openFastTravels() {
    console.log("Opening Fast Travels");
  }

  async function openLoaderGrabber() {
    console.log("Opening Loader/Grabber");
  }

  async function openFollower() {
    console.log("Opening Follower");
  }

  async function openPacketLogger() {
    console.log("Opening Packet Logger");
  }

  async function openPacketSpammer() {
    console.log("Opening Packet Spammer");
  }

  function startRecording(actionName: string) {
    console.log("Starting recording for:", actionName);
    if (isRecording) return;

    isRecording = actionName;
    lastPressedKey = "";

    console.log("Recording state set:", { isRecording });

    Mousetrap.reset();

    const recordingHandler = (ev: KeyboardEvent) => {
      ev.preventDefault();
      ev.stopPropagation();

      console.log("Recording key:", ev.key, "with modifiers:", {
        ctrl: ev.ctrlKey,
        alt: ev.altKey,
        shift: ev.shiftKey,
        meta: ev.metaKey,
      });

      if (ev.key === "Escape") {
        stopRecording();
        return;
      }

      const parts: string[] = [];
      if (ev.ctrlKey) parts.push("ctrl");
      if (ev.altKey) parts.push("alt");
      if (ev.shiftKey) parts.push("shift");
      if (ev.metaKey) parts.push(isMac ? "cmd" : "meta");

      let keyName = ev.key.toLowerCase();
      if (keyName === " ") keyName = "space";
      if (
        keyName === "control" ||
        keyName === "alt" ||
        keyName === "shift" ||
        keyName === "meta"
      ) {
        return;
      }

      parts.push(keyName);
      const combination = parts.join("+");
      lastPressedKey = combination;
      console.log("Set lastPressedKey to:", combination);
    };

    document.addEventListener("keydown", recordingHandler, true);

    (window as any).currentRecordingHandler = recordingHandler;

    console.log("Recording handler added, waiting for keypress...");
  }

  function confirmRecording(combination: string) {
    if (!isRecording) return;

    const actionName = isRecording;
    console.log(
      `confirmRecording called with combination: ${combination} for action: ${actionName}`,
    );

    const allHotkeys = [
      scriptLoadKey,
      scriptToggleKey,
      fastTravelsKey,
      loaderGrabberKey,
      followerKey,
      packetLoggerKey,
      packetSpammerKey,
    ];

    const filteredHotkeys = allHotkeys.filter(
      (key) => getActionForHotkey(key) !== actionName,
    );

    if (filteredHotkeys.includes(combination)) {
      console.log("Combination already exists, blocking");
      return;
    }

    console.log(`Before assignment - scriptLoadKey: ${scriptLoadKey}`);

    switch (actionName) {
      case "Load Script":
        scriptLoadKey = combination;
        console.log(`Assigned scriptLoadKey: ${scriptLoadKey}`);
        break;
      case "Toggle Script":
        scriptToggleKey = combination;
        console.log(`Assigned scriptToggleKey: ${scriptToggleKey}`);
        break;
      case "Open Fast Travels":
        fastTravelsKey = combination;
        console.log(`Assigned fastTravelsKey: ${fastTravelsKey}`);
        break;
      case "Open Loader/Grabber":
        loaderGrabberKey = combination;
        console.log(`Assigned loaderGrabberKey: ${loaderGrabberKey}`);
        break;
      case "Open Follower":
        followerKey = combination;
        console.log(`Assigned followerKey: ${followerKey}`);
        break;
      case "Open Packet Logger":
        packetLoggerKey = combination;
        console.log(`Assigned packetLoggerKey: ${packetLoggerKey}`);
        break;
      case "Open Packet Spammer":
        packetSpammerKey = combination;
        console.log(`Assigned packetSpammerKey: ${packetSpammerKey}`);
        break;
      default:
        console.error(`Unknown action name: ${actionName}`);
        break;
    }

    stopRecording();
  }

  function getActionForHotkey(hotkey: string): string | null {
    if (scriptLoadKey === hotkey) return "Load Script";
    if (scriptToggleKey === hotkey) return "Toggle Script";
    if (fastTravelsKey === hotkey) return "Open Fast Travels";
    if (loaderGrabberKey === hotkey) return "Open Loader/Grabber";
    if (followerKey === hotkey) return "Open Follower";
    if (packetLoggerKey === hotkey) return "Open Packet Logger";
    if (packetSpammerKey === hotkey) return "Open Packet Spammer";
    return null;
  }

  function stopRecording() {
    console.log("Stopping recording...");
    if ((window as any).currentRecordingHandler) {
      document.removeEventListener(
        "keydown",
        (window as any).currentRecordingHandler,
        true,
      );
      delete (window as any).currentRecordingHandler;
      console.log("Recording handler removed");
    }

    isRecording = null;
    lastPressedKey = "";
    registerHotkeys();
    console.log("Recording stopped, hotkeys re-registered");
  }

  function registerHotkeys() {
    Mousetrap.reset();

    try {
      if (scriptLoadKey) {
        Mousetrap.bind(scriptLoadKey, (ev) => {
          if (ev) ev.preventDefault();
          loadScript();
          return false;
        });
      }
      if (scriptToggleKey) {
        Mousetrap.bind(scriptToggleKey, (ev) => {
          if (ev) ev.preventDefault();
          toggleScript();
          return false;
        });
      }
      if (fastTravelsKey) {
        Mousetrap.bind(fastTravelsKey, (ev) => {
          if (ev) ev.preventDefault();
          openFastTravels();
          return false;
        });
      }
      if (loaderGrabberKey) {
        Mousetrap.bind(loaderGrabberKey, (ev) => {
          if (ev) ev.preventDefault();
          openLoaderGrabber();
          return false;
        });
      }
      if (followerKey) {
        Mousetrap.bind(followerKey, (ev) => {
          if (ev) ev.preventDefault();
          openFollower();
          return false;
        });
      }
      if (packetLoggerKey) {
        Mousetrap.bind(packetLoggerKey, (ev) => {
          if (ev) ev.preventDefault();
          openPacketLogger();
          return false;
        });
      }
      if (packetSpammerKey) {
        Mousetrap.bind(packetSpammerKey, (ev) => {
          if (ev) ev.preventDefault();
          openPacketSpammer();
          return false;
        });
      }
    } catch (error) {
      console.error("Error registering hotkeys:", error);
    }
  }

  function getConflicts(): string[] {
    const allHotkeys = [
      scriptLoadKey,
      scriptToggleKey,
      fastTravelsKey,
      loaderGrabberKey,
      followerKey,
      packetLoggerKey,
      packetSpammerKey,
    ].filter((key) => key !== "");

    const conflicts: string[] = [];
    const seen = new Set<string>();

    for (const hotkey of allHotkeys) {
      if (seen.has(hotkey)) {
        conflicts.push(hotkey);
      } else {
        seen.add(hotkey);
      }
    }

    return conflicts;
  }

  function formatHotkey(hotkey: string): string {
    if (!hotkey) return "None";

    return hotkey
      .split("+")
      .map((part) => {
        // Modifier keys
        if (part === "ctrl" || part === "control") return "Ctrl";
        if (part === "alt" || part === "option") return "Alt";
        if (part === "shift") return "Shift";
        if (part === "cmd" || part === "command") return "Cmd";
        if (part === "meta") return isMac ? "Cmd" : "Win";

        // Special keys
        if (part === "space") return "Space";
        if (part === "enter" || part === "return") return "Enter";
        if (part === "tab") return "Tab";
        if (part === "escape" || part === "esc") return "Esc";
        if (part === "backspace") return "Backspace";
        if (part === "delete" || part === "del") return "Delete";
        if (part === "up") return "Up";
        if (part === "down") return "Down";
        if (part === "left") return "Left";
        if (part === "right") return "Right";

        // Function keys
        if (part.match(/^f\d+$/i)) return part.toUpperCase();

        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join("+");
  }

  let hotkeyConfigs = $derived([
    {
      section: "General",
      items: [
        {
          label: "Toggle Bank",
          key: "",
          action: () => {},
          setter: (_value: string) => {},
        },
        {
          label: "Toggle AutoAggro",
          key: "",
          action: () => {},
          setter: (_value: string) => {},
        },
      ],
    },
    {
      section: "Scripts",
      items: [
        {
          label: "Load Script",
          key: scriptLoadKey,
          action: loadScript,
          setter: (value: string) => {
            console.log(
              `Setting scriptLoadKey from ${scriptLoadKey} to ${value}`,
            );
            scriptLoadKey = value;
          },
        },
        {
          label: "Toggle Script",
          key: scriptToggleKey,
          action: toggleScript,
          setter: (value: string) => {
            console.log(
              `Setting scriptToggleKey from ${scriptToggleKey} to ${value}`,
            );
            scriptToggleKey = value;
          },
        },
        {
          label: "Toggle Command Overlay",
          key: "",
          action: () => {},
          setter: (_value: string) => {},
        },
        {
          label: "Toggle Dev Tools",
          key: "",
          action: () => {},
          setter: (_value: string) => {},
        },
      ],
    },
    {
      section: "Tools",
      items: [
        {
          label: "Open Fast Travels",
          key: fastTravelsKey,
          action: openFastTravels,
          setter: (value: string) => {
            console.log(
              `Setting fastTravelsKey from ${fastTravelsKey} to ${value}`,
            );
            fastTravelsKey = value;
          },
        },
        {
          label: "Open Loader/Grabber",
          key: loaderGrabberKey,
          action: openLoaderGrabber,
          setter: (value: string) => {
            console.log(
              `Setting loaderGrabberKey from ${loaderGrabberKey} to ${value}`,
            );
            loaderGrabberKey = value;
          },
        },
        {
          label: "Open Follower",
          key: followerKey,
          action: openFollower,
          setter: (value: string) => {
            console.log(`Setting followerKey from ${followerKey} to ${value}`);
            followerKey = value;
          },
        },
      ],
    },
    {
      section: "Packets",
      items: [
        {
          label: "Open Packet Logger",
          key: packetLoggerKey,
          action: openPacketLogger,
          setter: (value: string) => {
            console.log(
              `Setting packetLoggerKey from ${packetLoggerKey} to ${value}`,
            );
            packetLoggerKey = value;
          },
        },
        {
          label: "Open Packet Spammer",
          key: packetSpammerKey,
          action: openPacketSpammer,
          setter: (value: string) => {
            console.log(
              `Setting packetSpammerKey from ${packetSpammerKey} to ${value}`,
            );
            packetSpammerKey = value;
          },
        },
      ],
    },
  ]);

  let conflicts = $derived(getConflicts());
  $effect(() => {
    registerHotkeys();
  });

  $effect(() => {
    console.log("State changed:", {
      scriptLoadKey,
      scriptToggleKey,
      fastTravelsKey,
      loaderGrabberKey,
      followerKey,
      packetLoggerKey,
      packetSpammerKey,
    });
  });

  onMount(() => {
    registerHotkeys();

    const handleKeyDown = (_ev: KeyboardEvent) => {
      if (
        isRecording ||
        (document.activeElement as HTMLElement)?.tagName === "INPUT"
      )
        return;
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  });

  onDestroy(() => {
    Mousetrap.reset();
    stopRecording();
  });

  function handleKeyDown(event: KeyboardEvent) {
    const key = event.key.toUpperCase();
    for (const section of hotkeyConfigs) {
      for (const item of section.items) {
        if (item.key.toUpperCase() === key) {
          event.preventDefault();
          item.action();
          break;
        }
      }
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<main class="flex min-h-screen select-none flex-col bg-background-primary">
  <div class="mx-auto w-full max-w-6xl flex-grow p-4">
    <!-- Header -->
    <header class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-white">Hotkeys</h1>
        </div>

        <!-- Quick Actions -->
        <div class="flex items-center space-x-2">
          <button
            onclick={() => {
              hotkeyConfigs.forEach((section) => {
                section.items.forEach((item) => {
                  item.setter("");
                });
              });
              registerHotkeys();
            }}
            class="rounded-md border border-red-600/50 bg-red-900/30 px-3 py-1.5 text-sm font-medium text-red-200 transition-all duration-200 hover:bg-red-800/40 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          >
            Clear All
          </button>

          <!-- <button
            onclick={() => {
              const hotkeyData: Record<string, string> = hotkeyConfigs.reduce(
                (acc, section) => {
                  section.items.forEach((item) => {
                    if (item.key) acc[item.label] = item.key;
                  });
                  return acc;
                },
                {} as Record<string, string>,
              );
              console.log("Hotkey export:", hotkeyData);
            }}
            class="rounded-md border border-zinc-600/50 bg-zinc-800/30 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-all duration-200 hover:bg-zinc-700/40 focus:outline-none focus:ring-2 focus:ring-zinc-500/50"
          >
            Export
          </button> -->
        </div>
      </div>
    </header>

    <!-- Conflicts Alert -->
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
          </div>
        </div>
      </div>
    {/if}

    <!-- Hotkey Sections -->
    <div class="grid auto-cols-auto auto-rows-auto space-y-4">
      {#each hotkeyConfigs as section}
        <div
          class="rounded-md border border-zinc-700/50 bg-background-secondary shadow-lg backdrop-blur-sm"
        >
          <!-- Section Header -->
          <div class="border-b border-zinc-700/30 px-4 py-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="rounded-md bg-emerald-500/20 p-2">
                  {#if section.section === "General"}
                    <svg
                      class="h-5 w-5 text-emerald-400"
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
                  {:else if section.section === "Scripts"}
                    <svg
                      class="h-5 w-5 text-emerald-400"
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
                  {:else if section.section === "Tools"}
                    <svg
                      class="h-5 w-5 text-emerald-400"
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
                      class="h-5 w-5 text-emerald-400"
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
                    {section.section}
                  </h2>
                  <!-- <p class="text-sm text-gray-400">
                    {section.items.filter((item) => item.key).length} of {section
                      .items.length} configured
                  </p> -->
                </div>
              </div>
            </div>
          </div>

          <!-- Hotkey Grid -->
          <div class="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {#each section.items as item}
              <div
                class="group relative rounded-md border border-zinc-600/40 bg-zinc-800/30 p-3 transition-all duration-200 hover:border-zinc-500/60 hover:bg-zinc-700/40"
              >
                <div class="flex items-center justify-between">
                  <!-- Action Label -->
                  <div class="text-sm font-medium text-white">{item.label}</div>

                  <!-- Hotkey Display with double-click to edit -->
                  <div class="hotkey-container flex items-center">
                    {#if item.key}
                      <div class="relative flex items-center">
                        <div
                          class="cursor-pointer rounded-md bg-gray-800/50 px-2 py-1 font-mono text-xs text-white transition-all duration-200 hover:bg-gray-700/60"
                          ondblclick={() => startRecording(item.label)}
                          title="Double-click to edit"
                        >
                          {formatHotkey(item.key)}
                        </div>

                        <button
                          class="ml-2 rounded-md bg-gray-800/50 p-1 text-white transition-all duration-200 hover:bg-gray-700/60"
                          onclick={() => startRecording(item.label)}
                          title="Edit hotkey"
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
                          onclick={() => startRecording(item.label)}
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

{#if isRecording}
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
      class="relative mx-4 w-full max-w-md rounded-md border border-zinc-700/50 bg-background-secondary p-4 shadow-xl"
      style="transform: none; margin: 0 auto; max-width: 28rem; position: relative;"
      onclick={(ev) => ev.stopPropagation()}
      onkeydown={(ev) => {
        if (ev.key === "Escape") {
          stopRecording();
        }
      }}
      role="dialog"
      tabindex="-1"
    >
      <!-- Modal Header -->
      <div class="mb-4 text-center">
        <h3 class="text-xl font-semibold text-white">Recording Hotkey</h3>
        <p class="mt-1 text-gray-400">
          Press any key combination for: <span
            class="font-medium text-emerald-300">{isRecording}</span
          >
        </p>
      </div>

      <!-- Key Display Area -->
      <div class="mb-4 rounded-md border border-zinc-600/50 bg-zinc-800/30 p-4">
        <div class="text-center">
          <div class="flex min-h-[3rem] items-center justify-center">
            {#if lastPressedKey}
              <div class="flex items-center space-x-2">
                {#each formatHotkey(lastPressedKey).split("+") as keyPart, index}
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
                  class="h-2 w-2 animate-pulse rounded-full bg-emerald-400"
                ></div>
                <span class="text-sm">Waiting for key input...</span>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Conflict Warning -->
      {#if lastPressedKey && getActionForHotkey(lastPressedKey) && getActionForHotkey(lastPressedKey) !== isRecording}
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
                  lastPressedKey,
                )}"
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Action Buttons -->
      <div class="flex space-x-3">
        <button
          onclick={stopRecording}
          class="flex-1 rounded-md border border-zinc-600/50 bg-zinc-800/30 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all duration-200 hover:bg-zinc-700/40 focus:outline-none focus:ring-2 focus:ring-zinc-500/50"
        >
          Cancel
        </button>

        {#if lastPressedKey}
          <button
            onclick={() => confirmRecording(lastPressedKey)}
            class="flex-1 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:from-emerald-500 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:from-zinc-600 disabled:to-zinc-500 disabled:opacity-50"
            disabled={!!(
              getActionForHotkey(lastPressedKey) &&
              getActionForHotkey(lastPressedKey) !== isRecording
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

      <!-- Help Section -->
      <div class="mt-4 rounded-md border border-zinc-600/30 bg-zinc-700/20 p-3">
        <div class="mb-1 flex items-center space-x-2">
          <svg
            class="h-4 w-4 text-emerald-400"
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
            • Press <kbd class="rounded bg-zinc-600 px-1.5 py-0.5 text-white"
              >Esc</kbd
            > to cancel
          </p>
          <p>
            • Use modifier keys {isMac ? "(⌘, ⌥, ⇧)" : "(Ctrl, Alt, Shift)"} for
            better combinations
          </p>
          <p>
            • Avoid system shortcuts like {isMac ? "⌘C, ⌘V" : "Ctrl+C, Ctrl+V"}
          </p>
        </div>
      </div>
    </div>
  </div>
{/if}
