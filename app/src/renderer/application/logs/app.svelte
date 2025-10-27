<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import { fade } from "svelte/transition";
  import { client, handlers } from "@shared/tipc";
  import type { AppLogEntry } from "@shared/types";
  import { LEVEL_LABELS } from "@/shared/constants";
  import log from "electron-log";

  const logger = log.scope("app/logs");

  const LEVEL_CLASSES: Record<number, string> = {
    0: "text-gray-400",
    1: "text-gray-300",
    2: "text-yellow-400",
    3: "text-red-400",
  };
  const TIMESTAMP_REGEX =
    /^\s*\[?\s*([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.]+Z|[0-9]{4}-[0-9]{2}-[0-9]{2}[ T][0-9:.]+|T?[0-9]{1,2}:[0-9]{2}(?::[0-9]{2}(?:\.[0-9]+)?)?)\s*\]?\s*(?:[:\-–—]{1,2}|::|\||\/)??\s*/i;

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
    updateStatus("Logs cleared.");
  });

  onMount(() => {
    void scrollToBottom(true);
  });
  onDestroy(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });

  const getLevelLabel = (level: number): string =>
    LEVEL_LABELS[level] ?? `level-${level}`;
  const getLevelClass = (level: number): string =>
    LEVEL_CLASSES[level] ?? "text-gray-300";
  const formatTimestamp = (timestamp: number): string => {
    const d = new Date(timestamp);
    const isToday = d.toDateString() === new Date().toDateString();
    return isToday
      ? d.toLocaleTimeString()
      : `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

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

    return msg.replace(TIMESTAMP_REGEX, "").trimStart();
  }

  function formatEntryForCopy(entry: AppLogEntry): string {
    const timestamp = formatTimestamp(entry.timestamp);
    const level = getLevelLabel(entry.level).toUpperCase();
    const message = stripLeadingTimestamp(entry);
    return `[${timestamp}] [${level}] ${message}`;
  }

  function updateStatus(message: string) {
    statusMessage = message;
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      statusMessage = "";
    }, 1_500);
  }

  async function copyEntry(entry: AppLogEntry) {
    try {
      await navigator.clipboard.writeText(formatEntryForCopy(entry));
      updateStatus("Log copied to clipboard.");
    } catch (error) {
      logger.error("Failed to copy log.", error);
      updateStatus("Copy failed.");
    }
  }

  async function copyAll() {
    if (!entries.length) return;

    isCopyingAll = true;
    try {
      const content = entries.map(formatEntryForCopy).join("\n");
      await navigator.clipboard.writeText(content);
      updateStatus("Logs copied to clipboard.");
    } catch (error) {
      logger.error("Failed to copy logs.", error);
      updateStatus("Copy failed.");
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
          updateStatus("No logs to clear.");
        } else {
          updateStatus("Clear failed.");
        }
      }
    } catch (error) {
      logger.error("Failed to clear logs.", error);
      updateStatus("Clear failed.");
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
        updateStatus("Logs saved.");
      } else if (result?.canceled) {
        updateStatus("Save canceled.");
      } else if (result?.error === "EMPTY") {
        updateStatus("No logs to save.");
      } else if (result?.error) {
        updateStatus("Save failed.");
      } else {
        updateStatus("Save complete.");
      }
    } catch (error) {
      logger.error("Failed to save logs.", error);
      updateStatus("Save failed.");
    } finally {
      isSaving = false;
    }
  }

  async function scrollToBottom(force = false) {
    if (!force && !autoScroll) return;

    await tick();

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
