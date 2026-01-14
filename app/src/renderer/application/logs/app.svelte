<script lang="ts">
  import { Button, Checkbox, Label } from "@vexed/ui";
  import { cn } from "@vexed/ui/util";
  import { onMount, tick } from "svelte";
  import log from "electron-log";

  import Copy from "lucide-svelte/icons/copy";
  import Download from "lucide-svelte/icons/download";
  import Trash2 from "lucide-svelte/icons/trash-2";
  import ArrowDownToLine from "lucide-svelte/icons/arrow-down-to-line";

  import { client, handlers } from "~/shared/tipc";
  import type { AppLogEntry } from "~/shared/types";
  import { LEVEL_LABELS } from "~/shared/constants";

  const logger = log.scope("app/logs");

  const LEVEL_CLASSES: Record<number, string> = {
    0: "text-muted-foreground",
    1: "text-foreground",
    2: "text-amber-400",
    3: "text-destructive",
  };

  const LEVEL_BADGE_CLASSES: Record<number, string> = {
    0: "bg-muted/50 text-muted-foreground",
    1: "bg-secondary text-foreground",
    2: "bg-amber-500/20 text-amber-400",
    3: "bg-destructive/20 text-destructive",
  };

  const TIMESTAMP_REGEX =
    /^\s*\[?\s*([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.]+Z|[0-9]{4}-[0-9]{2}-[0-9]{2}[ T][0-9:.]+|T?[0-9]{1,2}:[0-9]{2}(?::[0-9]{2}(?:\.[0-9]+)?)?)\s*\]?\s*(?:[:\-–—]{1,2}|::|\||\/)?\s*/i;

  let entries = $state<AppLogEntry[]>([]);
  let autoScroll = $state(true);
  let isSaving = $state(false);
  let isClearing = $state(false);
  let isCopyingAll = $state(false);
  let logsContainer = $state<HTMLDivElement | null>(null);

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
  });

  onMount(() => {
    void scrollToBottom(true);
  });

  function getLevelLabel(level: number): string {
    return LEVEL_LABELS[level] ?? `level-${level}`;
  }

  function getLevelBadgeClass(level: number): string {
    return LEVEL_BADGE_CLASSES[level] ?? "bg-secondary text-foreground";
  }

  function formatTimestamp(timestamp: number): string {
    const d = new Date(timestamp);
    const isToday = d.toDateString() === new Date().toDateString();
    return isToday
      ? d.toLocaleTimeString()
      : `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  }

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

  async function copyEntry(entry: AppLogEntry) {
    try {
      await navigator.clipboard.writeText(formatEntryForCopy(entry));
    } catch (error) {
      logger.error("Failed to copy log.", error);
    }
  }

  async function copyAll() {
    if (!entries.length) return;

    isCopyingAll = true;
    try {
      const content = entries.map(formatEntryForCopy).join("\n");
      await navigator.clipboard.writeText(content);
    } catch (error) {
      logger.error("Failed to copy logs.", error);
    } finally {
      isCopyingAll = false;
    }
  }

  async function clearLogs() {
    if (!entries.length || isClearing) return;

    isClearing = true;
    try {
      await client.appLogs.clear();
    } catch (error) {
      logger.error("Failed to clear logs.", error);
    } finally {
      isClearing = false;
    }
  }

  async function saveLogs() {
    if (!entries.length || isSaving) return;

    isSaving = true;
    try {
      await client.appLogs.saveToFile();
    } catch (error) {
      logger.error("Failed to save logs.", error);
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

<div class="flex h-screen flex-col bg-background">
  <header
    class="elevation-1 sticky top-0 z-10 border-b border-border/50 bg-background/95 px-6 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80"
  >
    <div class="mx-auto flex max-w-7xl items-center justify-between">
      <div class="flex items-center gap-3">
        <h1 class="text-base font-semibold tracking-tight text-foreground">
          App Logs
        </h1>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          class="gap-2 border-border/50"
          onclick={() => void saveLogs()}
          disabled={entries.length === 0 || isSaving}
        >
          <Download class="h-4 w-4" />
          <span class="hidden sm:inline">Save</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="gap-2 border-border/50"
          onclick={() => void copyAll()}
          disabled={entries.length === 0 || isCopyingAll}
        >
          <Copy class="h-4 w-4" />
          <span class="hidden sm:inline">Copy All</span>
        </Button>
        <Button
          variant="destructive"
          size="sm"
          class="gap-2"
          onclick={() => void clearLogs()}
          disabled={entries.length === 0 || isClearing}
        >
          <Trash2 class="h-4 w-4" />
          <span class="hidden sm:inline">Clear</span>
        </Button>
      </div>
    </div>
  </header>

  <main class="flex-1 overflow-hidden p-4 sm:p-6">
    <div class="mx-auto flex h-full max-w-7xl flex-col gap-4">
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted-foreground">
          <span class="font-medium tabular-nums text-foreground"
            >{entries.length}</span
          >
          <span class="text-muted-foreground/70"
            >log{entries.length !== 1 ? "s" : ""}</span
          >
        </span>

        <div class="flex items-center gap-2">
          <Checkbox id="auto-scroll" bind:checked={autoScroll} />
          <Label
            for="auto-scroll"
            class="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground"
          >
            <ArrowDownToLine class="h-3.5 w-3.5" />
            Auto-scroll
          </Label>
        </div>
      </div>

      <div
        class="relative flex-1 overflow-hidden rounded-xl border border-border/50 bg-card"
      >
        {#if entries.length === 0}
          <div class="flex h-full items-center justify-center">
            <p class="text-center text-muted-foreground">No logs yet.</p>
          </div>
        {:else}
          <div
            bind:this={logsContainer}
            class="h-full overflow-auto p-3 font-mono text-sm"
          >
            {#each entries as entry, index (`${entry.timestamp}-${index}`)}
              <div
                class="group flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-secondary/50"
                onclick={() => void copyEntry(entry)}
                onkeydown={(ev) => {
                  if (ev.key === "Enter") {
                    ev.preventDefault();
                    copyEntry(entry);
                  }
                }}
                role="button"
                tabindex="0"
                title="Click to copy"
              >
                <span
                  class="shrink-0 text-xs tabular-nums text-muted-foreground/70"
                >
                  {formatTimestamp(entry.timestamp)}
                </span>
                <span
                  class={cn(
                    "shrink-0 rounded px-1.5 py-0.5 text-xs font-medium uppercase",
                    getLevelBadgeClass(entry.level),
                  )}
                >
                  {getLevelLabel(entry.level)}
                </span>
                <span class="shrink-0 text-xs text-muted-foreground/50">
                  {formatSource(entry.sourceId, entry.lineNumber)}
                </span>
                <span
                  class="flex-1 whitespace-pre-wrap break-words text-foreground"
                >
                  {stripLeadingTimestamp(entry)}
                </span>
                <Copy
                  class="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                />
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </main>
</div>
