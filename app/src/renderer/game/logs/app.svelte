<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import { fade } from "svelte/transition";
  import { client, handlers } from "@shared/tipc";
  import type { AppLogEntry } from "@shared/types";

  const LEVEL_LABELS: Record<number, string> = {
    0: "log",
    1: "warn",
    2: "error",
    3: "info",
    4: "debug",
  };
  const LEVEL_CLASSES: Record<number, string> = {
    0: "text-gray-200",
    1: "text-amber-300",
    2: "text-red-300",
    3: "text-sky-300",
    4: "text-purple-300",
  };

  let entries: AppLogEntry[] = [];
  let autoScroll = true;
  let statusMessage = "";
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let isSaving = false;
  let isClearing = false;
  let isCopyingAll = false;
  let logsContainer: HTMLDivElement | null = null;

  handlers.appLogs.init.listen(({ entries: val }) => {
    entries = val;
    void scrollToBottom(true);
  });

  handlers.appLogs.append.listen((entry) => {
    entries = [...entries, entry];
    void scrollToBottom();
  });

  handlers.appLogs.reset.listen(() => {
    entries = [];
    showStatus("Logs cleared.");
  });

  onDestroy(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });

  onMount(() => {
    void scrollToBottom(true);
  });

  const getLevelLabel = (level: number): string => LEVEL_LABELS[level] ?? `level-${level}`;
  const getLevelClass = (level: number): string => LEVEL_CLASSES[level] ?? "text-gray-300";
  const formatTimestamp = (timestamp: number): string =>
    new Date(timestamp).toLocaleTimeString();

  function formatSource(sourceId: string, lineNumber: number): string {
    if (!sourceId) return "renderer";
    const sanitized = sourceId.startsWith("file://")
      ? sourceId.replace("file://", "")
      : sourceId;
    const parts = sanitized.split(/[\\/]/);
    const fileName = parts[parts.length - 1] || sanitized;
    const hasLine = Number.isFinite(lineNumber) && lineNumber > 0;
    return hasLine ? `${fileName}:${lineNumber}` : fileName;
  }

  function stripLeadingTimestamp(entry: AppLogEntry): string {
    const msg = (entry.message || "").trimStart();
    if (!msg) return msg;

    const regexp =
      /^\s*\[?\s*([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.]+Z|[0-9]{4}-[0-9]{2}-[0-9]{2}[ T][0-9:.]+|T?[0-9]{1,2}:[0-9]{2}(?::[0-9]{2}(?:\.[0-9]+)?)?)\s*\]?\s*(?:[:\-–—]{1,2}|::|\||\/)??\s*/i;

    return msg.replace(regexp, "").trimStart();
  }

  function formatEntryForCopy(entry: AppLogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = getLevelLabel(entry.level).toUpperCase();
    const source = formatSource(entry.sourceId, entry.lineNumber);
    const message = stripLeadingTimestamp(entry);
    const prefix = `[${timestamp}] [${level}] ${source} :: `;
    return `${prefix}${message}`;
  }

  function showStatus(message: string, duration = 1500) {
    statusMessage = message;
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      statusMessage = "";
    }, duration);
  }

  async function copyEntry(entry: AppLogEntry) {
    try {
      await navigator.clipboard.writeText(formatEntryForCopy(entry));
      showStatus("Log copied to clipboard.");
    } catch (error) {
      console.error("Failed to copy log entry", error);
      showStatus("Copy failed.");
    }
  }

  async function copyAll() {
    if (!entries.length) return;
    isCopyingAll = true;
    try {
      const content = entries.map(formatEntryForCopy).join("\n");
      await navigator.clipboard.writeText(content);
      showStatus("Logs copied to clipboard.");
    } catch (error) {
      console.error("Failed to copy logs", error);
      showStatus("Copy failed.");
    } finally {
      isCopyingAll = false;
    }
  }

  async function clearLogs() {
    if (!entries.length || isClearing) return;
    isClearing = true;
    try {
      const result = await client.appLogs.clear();
      if (result?.success !== true) {
        if (result?.error === "EMPTY") {
          showStatus("No logs to clear.");
        } else {
          showStatus("Clear failed.");
        }
      }
    } catch (error) {
      console.error("Failed to clear logs", error);
      showStatus("Clear failed.");
    } finally {
      isClearing = false;
    }
  }

  async function saveLogs() {
    if (!entries.length || isSaving) return;
    isSaving = true;
    try {
      const result = await client.appLogs.saveToFile();
      if (result?.success) {
        showStatus("Logs saved.");
      } else if (result?.canceled) {
        showStatus("Save canceled.");
      } else if (result?.error === "EMPTY") {
        showStatus("No logs to save.");
      } else if (result?.error) {
        showStatus("Save failed.");
      } else {
        showStatus("Save complete.");
      }
    } catch (error) {
      console.error("Failed to save logs", error);
      showStatus("Save failed.");
    } finally {
      isSaving = false;
    }
  }

  async function scrollToBottom(force = false) {
    if (!force && !autoScroll) return;
    await tick(); // wait for DOM updates so the container height is accurate
    const container = logsContainer;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }
</script>

<main class="flex h-screen flex-col bg-background-primary text-gray-200">
  <header
    class="flex flex-wrap items-center justify-between space-x-3 border-b border-gray-800/50 bg-background-secondary px-4 py-2"
  >
    <div class="flex items-center space-x-2">
      <h1 class="text-sm font-semibold text-gray-100">App Logs</h1>
      {#if statusMessage}
        <p
          transition:fade={{ duration: 150 }}
          class="flex min-h-[1rem] items-center text-xs text-gray-400"
        >
          {statusMessage}
        </p>
      {/if}
    </div>
    <div class="flex flex-wrap items-center space-x-2 text-xs">
      <label class="ml-3 flex cursor-pointer items-center text-gray-400">
        <input
          type="checkbox"
          bind:checked={autoScroll}
          class="h-4 w-4 rounded border-gray-600 bg-background-primary"
          style="margin-right: 8px;"
        />
        Auto scroll
      </label>
      <button
        class="rounded bg-gray-700/40 px-3 py-1 font-medium transition hover:bg-gray-600/50 disabled:cursor-not-allowed disabled:opacity-50"
        onclick={() => void copyAll()}
        disabled={entries.length === 0 || isCopyingAll}
      >
        Copy all
      </button>
      <button
        class="rounded bg-gray-700/40 px-3 py-1 font-medium transition hover:bg-gray-600/50 disabled:cursor-not-allowed disabled:opacity-50"
        onclick={() => void saveLogs()}
        disabled={entries.length === 0 || isSaving}
      >
        Save to file
      </button>
      <button
        class="rounded bg-red-700/60 px-3 py-1 font-medium transition hover:bg-red-600/70 disabled:cursor-not-allowed disabled:opacity-50"
        onclick={() => void clearLogs()}
        disabled={entries.length === 0 || isClearing}
      >
        Clear
      </button>
    </div>
  </header>

  <section class="flex-1 overflow-hidden bg-background-primary">
    {#if entries.length > 0}
      <div
        class="logs-list"
        style="height: 100%; width: 100%; overflow-y: auto;"
        bind:this={logsContainer}
      >
        {#each entries as entry, index (`${entry.timestamp}-${index}`)}
          <div class="border-b border-gray-800/60 px-4 py-2">
            <button
              type="button"
              class="w-full cursor-pointer rounded bg-transparent text-left transition hover:bg-gray-800/50 focus:bg-gray-800/50 focus:outline-none"
              title="Click to copy this log"
              onclick={() => void copyEntry(entry)}
            >
              <div
                class="flex flex-wrap items-center space-x-2 font-mono text-[11px] uppercase tracking-wide text-gray-400"
              >
                <span>[{formatTimestamp(entry.timestamp)}]</span>
                <span class={getLevelClass(entry.level)}>
                  {getLevelLabel(entry.level)}
                </span>
                <span class="text-gray-500">
                  {formatSource(entry.sourceId, entry.lineNumber)}
                </span>
              </div>
              <div
                class="mt-1 whitespace-pre-wrap break-words font-mono text-xs text-gray-100"
              >
                {stripLeadingTimestamp(entry)}
              </div>
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
  }

  :global(.logs-list) {
    height: 100%;
    overflow-y: auto;
    background-color: transparent;
  }

  :global(.logs-list button:focus) {
    outline: none;
  }
</style>
