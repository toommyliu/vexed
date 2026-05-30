/* @refresh reload */
import "../../polyfills";
import "./style.css";
import { createHotkey } from "@tanstack/solid-hotkeys";
import { createVirtualizer, type VirtualItem } from "@tanstack/solid-virtual";
import {
  Icon,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AppShell,
  Button,
  type ButtonProps,
  Checkbox,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  IconButton,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Kbd,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  PillButton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipIconButton,
} from "@vexed/ui";
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  type JSX,
} from "solid-js";
import {
  PACKET_LOG_BUFFER_LIMIT,
  PACKET_PLACEHOLDER_DEFINITIONS,
  PACKET_QUEUE_DEFAULT_DELAY_MS,
  PacketCaptureTypes,
  PacketSendTargets,
  clampPacketQueueDelay,
  isPacketSendTarget,
  normalizePacketText,
  type PacketCapturedPayload,
  type PacketCaptureType,
  type PacketSendTarget,
} from "../../../shared/packets";
import { makeRandomId } from "../../../shared/random-id";
import { SectionPanel } from "../../components/SectionPanel";
import { downloadText } from "../../lib/download";
import { mountWindow } from "../mount";
import { splitTextMatches } from "../../lib/text";
import {
  formatPacketLogEntries,
  formatPacketTimestamp,
} from "./logFormatting";
import {
  QUEUE_PACKET_EMPTY_ERROR,
  isValidQueuePacketDraft,
  replaceQueuePacketAt,
} from "./queueState";

type ActiveTab = "log" | "send";
const LOG_ROW_HEIGHT_COMPACT = 34;
const LOG_ROW_OVERSCAN = 8;
const LOG_ROW_WRAPPED_APPROX_CHAR_WIDTH = 7.2;
const LOG_ROW_WRAPPED_FIXED_WIDTH = 184;
const LOG_ROW_WRAPPED_FIXED_WIDTH_WITH_TIMESTAMP = 290;
const LOG_ROW_WRAPPED_TEXT_LINE_HEIGHT = 18;
const LOG_ROW_WRAPPED_VERTICAL_CHROME = 11;
const LOG_ROW_WRAPPED_MAX_HEIGHT = 220;

interface PacketLogEntry {
  readonly id: string;
  readonly raw: string;
  readonly text: string;
  readonly timestamp: number;
  readonly type: PacketCaptureType;
}

interface PacketLogEmptyState {
  readonly description?: string;
  readonly title: string;
}

interface PacketLogVirtualRow {
  readonly entry: PacketLogEntry;
  readonly item: VirtualItem;
}

const packetTypeLabels: Record<PacketCaptureType, string> = {
  client: "Client",
  extension: "Extension",
  server: "Server",
};

const sendTargetLabels: Record<PacketSendTarget, string> = {
  "client-json": "Client JSON",
  "client-str": "Client str",
  "client-xml": "Client XML",
  "server-json": "Server JSON",
  "server-string": "Server string",
};

const sendTargetOptions = PacketSendTargets.map((target) => ({
  label: sendTargetLabels[target],
  value: target,
}));

const packetPlaceholderHelp = `Placeholders resolve when packets are sent: ${PACKET_PLACEHOLDER_DEFINITIONS.map(
  (definition) => definition.token,
).join(", ")}.`;

const createEntryId = (): string => makeRandomId();

const includesSearch = (value: string, query: string): boolean =>
  value.toLocaleLowerCase().includes(query.toLocaleLowerCase());

const estimateWrappedLogRowHeight = (
  entry: PacketLogEntry,
  viewportWidth: number,
  includeTimestamp: boolean,
): number => {
  const fixedWidth = includeTimestamp
    ? LOG_ROW_WRAPPED_FIXED_WIDTH_WITH_TIMESTAMP
    : LOG_ROW_WRAPPED_FIXED_WIDTH;
  const packetWidth = Math.max(80, viewportWidth - fixedWidth);
  const charsPerLine = Math.max(
    1,
    Math.floor(packetWidth / LOG_ROW_WRAPPED_APPROX_CHAR_WIDTH),
  );
  const textLineCount = entry.text
    .split(/\r\n|\r|\n/)
    .reduce(
      (count, line) =>
        count + Math.max(1, Math.ceil(line.length / charsPerLine)),
      0,
    );

  return Math.min(
    LOG_ROW_WRAPPED_MAX_HEIGHT,
    Math.max(
      LOG_ROW_HEIGHT_COMPACT,
      Math.ceil(
        textLineCount * LOG_ROW_WRAPPED_TEXT_LINE_HEIGHT +
          LOG_ROW_WRAPPED_VERTICAL_CHROME,
      ),
    ),
  );
};

function PacketSenderLabelHelp(): JSX.Element {
  return (
    <span class="packets-sender__label-help">
      <Label for="packet-input">Packet</Label>
      <Tooltip
        closeDelay={0}
        openDelay={200}
        positioning={{ placement: "top" }}
      >
        <TooltipTrigger
          asChild={(triggerProps) => (
            <Button
              {...(triggerProps({
                "aria-label": "Packet placeholders",
                children: <Icon icon="help_circle" class="button__icon" />,
                class: "packets-placeholder-help-button",
                size: "icon-sm",
                type: "button",
                variant: "ghost",
              } as ButtonProps) as ButtonProps)}
            />
          )}
        />
        <TooltipContent>{packetPlaceholderHelp}</TooltipContent>
      </Tooltip>
    </span>
  );
}

function App(): JSX.Element {
  let packetSearchInput: HTMLInputElement | undefined;
  let editingQueueTextarea: HTMLTextAreaElement | undefined;

  const [activeTab, setActiveTab] = createSignal<ActiveTab>("log");
  const [captureRunning, setCaptureRunning] = createSignal(false);
  const [queueRunning, setQueueRunning] = createSignal(false);
  const [packets, setPackets] = createSignal<readonly PacketLogEntry[]>([]);
  const [selectedPacketId, setSelectedPacketId] = createSignal<string | null>(
    null,
  );
  const [search, setSearch] = createSignal("");
  const [showTimestamps, setShowTimestamps] = createSignal(false);
  const [autoScroll, setAutoScroll] = createSignal(true);
  const [wrapPackets, setWrapPackets] = createSignal(false);
  const [filters, setFilters] = createSignal<
    Record<PacketCaptureType, boolean>
  >({
    client: true,
    extension: true,
    server: true,
  });
  const [sendText, setSendText] = createSignal("");
  const [sendTarget, setSendTarget] =
    createSignal<PacketSendTarget>("server-string");
  const [delayMs, setDelayMs] = createSignal(
    String(PACKET_QUEUE_DEFAULT_DELAY_MS),
  );
  const [queue, setQueue] = createSignal<readonly string[]>([]);
  const [selectedQueueIndex, setSelectedQueueIndex] = createSignal<
    number | null
  >(null);
  const [editingQueueIndex, setEditingQueueIndex] = createSignal<number | null>(
    null,
  );
  const [editingQueueText, setEditingQueueText] = createSignal("");
  const [confirmKeyboardSendOpen, setConfirmKeyboardSendOpen] =
    createSignal(false);
  const [pendingKeyboardSendPacket, setPendingKeyboardSendPacket] =
    createSignal<string | null>(null);
  const [error, setError] = createSignal("");
  const [notice, setNotice] = createSignal("");
  const [logViewportWidth, setLogViewportWidth] = createSignal(0);
  const [allPacketsCopied, setAllPacketsCopied] = createSignal(false);
  const [copiedPacketId, setCopiedPacketId] = createSignal<string | null>(null);
  const [queuedPacketId, setQueuedPacketId] = createSignal<string | null>(null);
  let logViewport: HTMLDivElement | undefined;
  let allPacketsCopiedTimer: number | undefined;
  let copiedPacketTimer: number | undefined;
  let queuedPacketTimer: number | undefined;

  createHotkey(
    "/",
    (event) => {
      if (event.repeat) {
        return;
      }

      packetSearchInput?.focus();
      packetSearchInput?.select();
    },
    {
      eventType: "keydown",
      conflictBehavior: "replace",
      ignoreInputs: true,
    },
  );

  const filteredPackets = createMemo(() => {
    const activeFilters = filters();
    const query = search().trim();
    return packets().filter((entry) => {
      if (!activeFilters[entry.type]) {
        return false;
      }

      return query === "" || includesSearch(entry.text, query);
    });
  });

  const logEmptyState = createMemo<PacketLogEmptyState>(() => {
    if (packets().length === 0) {
      return {
        title: captureRunning() ? "Waiting for packets" : "Capture is stopped",
      };
    }

    const hasSearch = search().trim() !== "";
    const hasTypeFilter = PacketCaptureTypes.some((type) => !filters()[type]);

    if (hasSearch && hasTypeFilter) {
      return {
        title: "No packets match these filters",
      };
    }

    if (hasSearch) {
      return {
        title: "No packets match this search",
      };
    }

    if (hasTypeFilter) {
      return {
        description:
          "Enable Client, Server, or Extension to show captured packets.",
        title: "All captured packets are hidden",
      };
    }

    return {
      title: captureRunning() ? "Waiting for packets" : "Capture is stopped",
    };
  });

  const selectedPacket = createMemo(() =>
    packets().find((entry) => entry.id === selectedPacketId()),
  );

  const stats = createMemo(() => {
    const counts: Record<PacketCaptureType, number> = {
      client: 0,
      extension: 0,
      server: 0,
    };
    for (const entry of packets()) {
      counts[entry.type] += 1;
    }
    return counts;
  });

  const parsedDelayMs = createMemo(() => clampPacketQueueDelay(delayMs()));
  const trimmedSendText = createMemo(() => sendText().trim());
  const hasUnsavedQueueEdit = createMemo(() => editingQueueIndex() !== null);
  const canSend = createMemo(
    () => trimmedSendText().length > 0 && !queueRunning(),
  );
  const canQueue = createMemo(
    () => queue().length > 0 && !queueRunning() && !hasUnsavedQueueEdit(),
  );
  const logVirtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
    get count() {
      return filteredPackets().length;
    },
    estimateSize: (index) => {
      const entry = filteredPackets()[index];
      if (!entry || !wrapPackets()) {
        return LOG_ROW_HEIGHT_COMPACT;
      }

      return estimateWrappedLogRowHeight(
        entry,
        logViewportWidth(),
        showTimestamps(),
      );
    },
    getItemKey: (index) => filteredPackets()[index]?.id ?? index,
    getScrollElement: () => logViewport ?? null,
    measureElement: (element) => {
      if (!wrapPackets()) {
        return LOG_ROW_HEIGHT_COMPACT;
      }

      const index = Number(element.getAttribute("data-index"));
      const entry = Number.isInteger(index) ? filteredPackets()[index] : null;
      return entry
        ? estimateWrappedLogRowHeight(
            entry,
            logViewportWidth(),
            showTimestamps(),
          )
        : LOG_ROW_WRAPPED_MAX_HEIGHT;
    },
    overscan: LOG_ROW_OVERSCAN,
    useAnimationFrameWithResizeObserver: true,
  });

  const logVirtualRows = createMemo<readonly PacketLogVirtualRow[]>(() => {
    const entries = filteredPackets();
    const rows: PacketLogVirtualRow[] = [];

    for (const item of logVirtualizer.getVirtualItems()) {
      if (!item) {
        continue;
      }

      const entry = entries[item.index];
      if (entry) {
        rows.push({ entry, item });
      }
    }

    return rows;
  });

  createEffect(() => {
    wrapPackets();
    showTimestamps();
    Math.round(logViewportWidth());
    logVirtualizer.measure();
  });

  const setOperationError = (message: string, cause: unknown): void => {
    console.error(message, cause);
    setNotice("");
    setError(cause instanceof Error ? cause.message : message);
  };

  const toggleFilter = (type: PacketCaptureType): void => {
    setFilters((current) => ({ ...current, [type]: !current[type] }));
  };

  const addCapturedPacket = (payload: PacketCapturedPayload): void => {
    const entry: PacketLogEntry = {
      id: createEntryId(),
      raw: payload.packet,
      text: normalizePacketText(payload.packet, payload.type),
      timestamp: payload.capturedAt,
      type: payload.type,
    };

    setPackets((current) => {
      const next = [...current, entry];
      return next.length > PACKET_LOG_BUFFER_LIMIT
        ? next.slice(next.length - PACKET_LOG_BUFFER_LIMIT)
        : next;
    });

    if (autoScroll()) {
      requestAnimationFrame(() => {
        const lastIndex = filteredPackets().length - 1;
        if (lastIndex >= 0) {
          logVirtualizer.scrollToIndex(lastIndex, { align: "end" });
        }
      });
    }
  };

  const toggleCapture = async (): Promise<void> => {
    setError("");
    setNotice("");
    const nextRunning = !captureRunning();
    setCaptureRunning(nextRunning);

    try {
      if (nextRunning) {
        await window.ipc.packets.startCapture();
      } else {
        await window.ipc.packets.stopCapture();
      }
    } catch (cause) {
      setCaptureRunning(!nextRunning);
      setOperationError("Packet capture request failed", cause);
    }
  };

  const clearPackets = (): void => {
    setPackets([]);
    setSelectedPacketId(null);
    setCopiedPacketId(null);
    setQueuedPacketId(null);
  };

  const markPacketCopied = (id: string): void => {
    if (copiedPacketTimer !== undefined) {
      window.clearTimeout(copiedPacketTimer);
    }

    setCopiedPacketId(id);
    copiedPacketTimer = window.setTimeout(() => {
      setCopiedPacketId((current) => (current === id ? null : current));
      copiedPacketTimer = undefined;
    }, 900);
  };

  const markPacketQueued = (id: string): void => {
    if (queuedPacketTimer !== undefined) {
      window.clearTimeout(queuedPacketTimer);
    }

    setQueuedPacketId(id);
    queuedPacketTimer = window.setTimeout(() => {
      setQueuedPacketId((current) => (current === id ? null : current));
      queuedPacketTimer = undefined;
    }, 900);
  };

  const markAllPacketsCopied = (): void => {
    if (allPacketsCopiedTimer !== undefined) {
      window.clearTimeout(allPacketsCopiedTimer);
    }

    setAllPacketsCopied(true);
    allPacketsCopiedTimer = window.setTimeout(() => {
      setAllPacketsCopied(false);
      allPacketsCopiedTimer = undefined;
    }, 900);
  };

  const copyText = async (value: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice("");
      setError("");
      return true;
    } catch (cause) {
      setOperationError("Copy failed", cause);
      return false;
    }
  };

  const copyPacket = async (entry: PacketLogEntry): Promise<void> => {
    setSelectedPacketId(entry.id);
    if (await copyText(entry.text)) {
      markPacketCopied(entry.id);
    }
  };

  const normalizeDelayInput = (): void => {
    setDelayMs(String(parsedDelayMs()));
  };

  const copyAllCaptured = (): void => {
    const content = formatPacketLogEntries(packets(), showTimestamps());
    if (content) {
      void copyText(content).then((copied) => {
        if (copied) {
          markAllPacketsCopied();
        }
      });
    }
  };

  const exportVisible = (): void => {
    const content = formatPacketLogEntries(filteredPackets(), true);
    if (content) {
      downloadText("packets.txt", content);
    }
  };

  const copySelectedToSender = (): void => {
    const entry = selectedPacket();
    if (!entry) {
      return;
    }

    setSendText(entry.text);
    setActiveTab("send");
  };

  const addPacketToQueue = (entry: PacketLogEntry): void => {
    if (queueRunning()) {
      return;
    }

    setQueue((current) => [...current, entry.text]);
    setSelectedPacketId(entry.id);
    markPacketQueued(entry.id);
    setNotice("");
    setError("");
  };

  const sendPacket = async (packet = trimmedSendText()): Promise<void> => {
    if (!packet || queueRunning()) {
      return;
    }

    setError("");
    setNotice("");
    try {
      await window.ipc.packets.send({
        packet,
        target: sendTarget(),
      });
    } catch (cause) {
      setOperationError("Packet send failed", cause);
    }
  };

  const addQueuePacket = (): void => {
    const packet = trimmedSendText();
    if (!packet || queueRunning()) {
      return;
    }

    setQueue((current) => [...current, packet]);
    setSendText("");
  };

  const requestKeyboardSend = (): void => {
    const packet = trimmedSendText();
    if (!packet || queueRunning()) {
      return;
    }

    setPendingKeyboardSendPacket(packet);
    setConfirmKeyboardSendOpen(true);
  };

  const confirmKeyboardSend = (): void => {
    const packet = pendingKeyboardSendPacket();
    setPendingKeyboardSendPacket(null);
    setConfirmKeyboardSendOpen(false);
    if (packet) {
      void sendPacket(packet);
    }
  };

  const handleSenderKeyDown: JSX.EventHandler<
    HTMLTextAreaElement,
    KeyboardEvent
  > = (event) => {
    if (event.key !== "Enter" || event.isComposing || event.shiftKey) {
      return;
    }

    if (event.metaKey || event.ctrlKey) {
      event.preventDefault();
      requestKeyboardSend();
      return;
    }

    if (event.altKey) {
      return;
    }

    event.preventDefault();
    addQueuePacket();
  };

  const cancelQueuePacketEdit = (): void => {
    setEditingQueueIndex(null);
    setEditingQueueText("");
    setError("");
    setNotice("");
  };

  const focusEditingQueueTextarea = (): void => {
    requestAnimationFrame(() => {
      editingQueueTextarea?.focus();
      editingQueueTextarea?.select();
    });
  };

  const startQueuePacketEditAt = (index: number): void => {
    const currentEditingIndex = editingQueueIndex();
    if (queueRunning() || currentEditingIndex !== null) {
      return;
    }

    const packet = queue()[index];
    if (packet === undefined) {
      return;
    }

    setEditingQueueIndex(index);
    setEditingQueueText(packet);
    setSelectedQueueIndex(index);
    setError("");
    setNotice("");
    focusEditingQueueTextarea();
  };

  const startQueuePacketEdit = (): void => {
    const index = selectedQueueIndex();
    if (index !== null) {
      startQueuePacketEditAt(index);
    }
  };

  const saveQueuePacketEdit = (): void => {
    const index = editingQueueIndex();
    if (index === null || queueRunning()) {
      return;
    }

    const packet = editingQueueText().trim();
    if (!isValidQueuePacketDraft(packet)) {
      setNotice("");
      setError(QUEUE_PACKET_EMPTY_ERROR);
      focusEditingQueueTextarea();
      return;
    }

    setQueue((current) => replaceQueuePacketAt(current, index, packet));
    setSelectedQueueIndex(index);
    cancelQueuePacketEdit();
    setError("");
    setNotice("");
  };

  const handleQueueEditorKeyDown: JSX.EventHandler<
    HTMLTextAreaElement,
    KeyboardEvent
  > = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelQueuePacketEdit();
      return;
    }

    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      (event.metaKey || event.ctrlKey)
    ) {
      event.preventDefault();
      saveQueuePacketEdit();
    }
  };

  const removeQueuePacket = (): void => {
    const index = selectedQueueIndex();
    if (index === null || queueRunning() || hasUnsavedQueueEdit()) {
      return;
    }

    setQueue((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
    setSelectedQueueIndex(null);
  };

  const moveQueuePacket = (offset: -1 | 1): void => {
    const index = selectedQueueIndex();
    const current = queue();
    if (index === null || queueRunning() || hasUnsavedQueueEdit()) {
      return;
    }

    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= current.length) {
      return;
    }

    const next = [...current];
    const [packet] = next.splice(index, 1);
    if (packet === undefined) {
      return;
    }
    next.splice(nextIndex, 0, packet);
    setQueue(next);
    setSelectedQueueIndex(nextIndex);
  };

  const clearQueue = (): void => {
    if (queueRunning() || hasUnsavedQueueEdit()) {
      return;
    }
    setQueue([]);
    setSelectedQueueIndex(null);
  };

  const startQueue = async (): Promise<void> => {
    if (!canQueue()) {
      return;
    }

    setQueueRunning(true);
    setError("");
    setNotice("");
    try {
      await window.ipc.packets.startQueue({
        delayMs: parsedDelayMs(),
        packets: queue(),
        target: sendTarget(),
      });
    } catch (cause) {
      setQueueRunning(false);
      setOperationError("Packet queue start failed", cause);
    }
  };

  const stopQueue = async (): Promise<void> => {
    if (!queueRunning()) {
      return;
    }

    setQueueRunning(false);
    try {
      await window.ipc.packets.stopQueue();
    } catch (cause) {
      setQueueRunning(true);
      setOperationError("Packet queue stop failed", cause);
    }
  };

  const handleRuntimeStatus = (status: {
    readonly captureRunning: boolean;
    readonly queueRunning: boolean;
    readonly stoppedReason?: string;
  }): void => {
    setCaptureRunning(status.captureRunning);
    setQueueRunning(status.queueRunning);
    if (status.queueRunning) {
      cancelQueuePacketEdit();
    }
    if (status.stoppedReason) {
      setNotice(status.stoppedReason);
    }
  };

  const updateLogViewportMetrics = (): void => {
    if (!logViewport) {
      return;
    }

    setLogViewportWidth(logViewport.clientWidth);
  };

  const renderPacketText = (text: string): JSX.Element => {
    const query = search().trim();
    if (query === "") {
      return text;
    }

    return (
      <For each={splitTextMatches(text, query)}>
        {(segment) =>
          segment.match ? (
            <mark class="packets-log-row__match">{segment.text}</mark>
          ) : (
            segment.text
          )
        }
      </For>
    );
  };

  const PacketLogRowView = (props: {
    readonly entry: PacketLogEntry;
  }): JSX.Element => {
    return (
      <div
        class="packets-log-row"
        classList={{
          "packets-log-row--copied": copiedPacketId() === props.entry.id,
        }}
      >
        <button
          class="packets-log-row__content"
          classList={{
            "packets-log-row__content--timestamp": showTimestamps(),
            "packets-log-row__content--wrapped": wrapPackets(),
          }}
          onClick={() => {
            void copyPacket(props.entry);
          }}
          title="Click to copy"
          type="button"
        >
          <Show when={showTimestamps()}>
            <span class="packets-log-row__time">
              {formatPacketTimestamp(props.entry.timestamp)}
            </span>
          </Show>
          <span
            class={`packets-log-row__type packets-log-row__type--${props.entry.type}`}
          >
            {packetTypeLabels[props.entry.type]}
          </span>
          <span class="packets-log-row__packet">
            {renderPacketText(props.entry.text)}
          </span>
          <span
            aria-live="polite"
            aria-label={
              copiedPacketId() === props.entry.id ? "Copied" : undefined
            }
            class="packets-log-row__copy-feedback"
            classList={{
              "packets-log-row__copy-feedback--visible":
                copiedPacketId() === props.entry.id,
            }}
          >
            <Icon icon="check" aria-hidden="true" />
          </span>
        </button>
        <TooltipIconButton
          aria-label={
            queuedPacketId() === props.entry.id
              ? "Added to queue"
              : "Add packet to queue"
          }
          class={`packets-log-row__queue-button${
            queuedPacketId() === props.entry.id
              ? " packets-log-row__queue-button--queued"
              : ""
          }`}
          disabled={queueRunning()}
          onClick={() => addPacketToQueue(props.entry)}
          tooltip={
            queuedPacketId() === props.entry.id
              ? "Added to queue"
              : "Add packet to queue"
          }
        >
          <span class="packets-log-row__queue-icon packets-log-row__queue-icon--plus">
            <Icon icon="plus" class="button__icon" />
          </span>
          <span class="packets-log-row__queue-icon packets-log-row__queue-icon--check">
            <Icon icon="check" class="button__icon" />
          </span>
        </TooltipIconButton>
      </div>
    );
  };

  onMount(() => {
    const unsubscribeCaptured =
      window.ipc.packets.onCaptured(addCapturedPacket);
    const unsubscribeStatus = window.ipc.packets.onStatus(handleRuntimeStatus);
    const resizeObserver = new ResizeObserver(updateLogViewportMetrics);
    if (logViewport) {
      resizeObserver.observe(logViewport);
      updateLogViewportMetrics();
    }

    onCleanup(() => {
      if (allPacketsCopiedTimer !== undefined) {
        window.clearTimeout(allPacketsCopiedTimer);
      }
      if (copiedPacketTimer !== undefined) {
        window.clearTimeout(copiedPacketTimer);
      }
      if (queuedPacketTimer !== undefined) {
        window.clearTimeout(queuedPacketTimer);
      }

      unsubscribeCaptured();
      unsubscribeStatus();
      resizeObserver.disconnect();
      if (captureRunning()) {
        void window.ipc.packets.stopCapture().catch((cause: unknown) => {
          console.error("Failed to stop packet capture on cleanup:", cause);
        });
      }
      if (queueRunning()) {
        void window.ipc.packets.stopQueue().catch((cause: unknown) => {
          console.error("Failed to stop packet queue on cleanup:", cause);
        });
      }
    });
  });

  return (
    <Tabs
      style={{ display: "contents" }}
      value={activeTab()}
      onValueChange={(details) => setActiveTab(details.value as ActiveTab)}
    >
      <AppShell class="packets-window">
        <AppShell.Header class="packets-header">
          <AppShell.HeaderLeft>
            <AppShell.Title>Packets</AppShell.Title>
            <TabsList class="packets-tabs__list">
              <TabsTrigger value="log">Log</TabsTrigger>
              <TabsTrigger value="send">Send</TabsTrigger>
            </TabsList>
          </AppShell.HeaderLeft>
          <AppShell.HeaderRight>
            <Show when={activeTab() === "log"}>
              <div class="packets-header__actions">
                <Button
                  aria-label={
                    allPacketsCopied()
                      ? "Copied captured packets"
                      : "Copy all captured packets"
                  }
                  class="packets-copy-button"
                  classList={{
                    "packets-copy-button--copied": allPacketsCopied(),
                  }}
                  disabled={packets().length === 0}
                  onClick={copyAllCaptured}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <span
                    aria-hidden="true"
                    class="packets-copy-button__icon-stack"
                  >
                    <span class="packets-copy-button__icon packets-copy-button__icon--copy">
                      <Icon icon="copy" class="button__icon" />
                    </span>
                    <span class="packets-copy-button__icon packets-copy-button__icon--check">
                      <Icon icon="check" class="button__icon" />
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    class="packets-copy-button__label-stack"
                  >
                    <span class="packets-copy-button__label packets-copy-button__label--copy">
                      Copy all
                    </span>
                    <span class="packets-copy-button__label packets-copy-button__label--copied">
                      Copied
                    </span>
                  </span>
                </Button>
                <Button
                  aria-label="Export visible packets"
                  disabled={filteredPackets().length === 0}
                  onClick={exportVisible}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Icon icon="download" class="button__icon" />
                  <span class="packets-header__button-label">Export</span>
                </Button>
                <Button
                  aria-label={
                    captureRunning() ? "Stop capture" : "Start capture"
                  }
                  onClick={() => void toggleCapture()}
                  size="sm"
                  type="button"
                  variant={captureRunning() ? "destructive-outline" : "default"}
                >
                  {captureRunning() ? (
                    <Icon icon="square" class="button__icon" />
                  ) : (
                    <Icon icon="play" class="button__icon" />
                  )}
                  <span class="packets-header__button-label">
                    {captureRunning() ? "Stop capture" : "Start capture"}
                  </span>
                </Button>
              </div>
            </Show>
            <Show when={activeTab() === "send"}>
              <div class="packets-header__actions">
                <Button
                  aria-label={queueRunning() ? "Stop queue" : "Start queue"}
                  disabled={!queueRunning() && !canQueue()}
                  onClick={() =>
                    void (queueRunning() ? stopQueue() : startQueue())
                  }
                  size="sm"
                  type="button"
                  variant={queueRunning() ? "destructive-outline" : "default"}
                >
                  {queueRunning() ? (
                    <Icon icon="square" class="button__icon" />
                  ) : (
                    <Icon icon="play" class="button__icon" />
                  )}
                  <span class="packets-header__button-label">
                    {queueRunning() ? "Stop queue" : "Start queue"}
                  </span>
                </Button>
              </div>
            </Show>
          </AppShell.HeaderRight>
        </AppShell.Header>

        <AppShell.Body class="packets-body" scroll={false}>
          <div class="packets-shell">
            <Show when={error() !== "" || notice() !== ""}>
              <div
                classList={{
                  "packets-message": true,
                  "packets-message--error": error() !== "",
                }}
              >
                <span>{error() || notice()}</span>
                <IconButton
                  aria-label="Dismiss message"
                  onClick={() => {
                    setError("");
                    setNotice("");
                  }}
                  size="icon-xs"
                  type="button"
                  variant="ghost"
                >
                  <Icon icon="x" class="button__icon" />
                </IconButton>
              </div>
            </Show>

            <div class="packets-tabs">
              <TabsContent class="packets-tabs__content" value="log">
                <div class="packets-log-grid">
                  <div class="packets-log-tools">
                    <InputGroup class="packets-search">
                      <InputGroupAddon>
                        <Icon icon="search" aria-hidden="true" />
                      </InputGroupAddon>
                      <InputGroupInput
                        ref={(element) => {
                          packetSearchInput = element;
                        }}
                        aria-label="Search packets"
                        placeholder="Search packets..."
                        value={search()}
                        onInput={(event) =>
                          setSearch(event.currentTarget.value)
                        }
                      />
                      <InputGroupAddon
                        align="inline-end"
                        class="packets-search__shortcut"
                      >
                        <Kbd>/</Kbd>
                      </InputGroupAddon>
                    </InputGroup>

                    <div class="packets-log-actions">
                      <Tooltip closeDelay={0} openDelay={200}>
                        <TooltipTrigger
                          asChild={(triggerProps) => (
                            <Button
                              {...(triggerProps({
                                children: "Use in sender",
                                disabled: !selectedPacket(),
                                onClick: copySelectedToSender,
                                size: "sm",
                                type: "button",
                                variant: "outline",
                              } as ButtonProps) as ButtonProps)}
                            />
                          )}
                        />
                        <TooltipContent>
                          Copies the selected packet into the sender without
                          sending it.
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <div class="packets-options-row">
                      <Checkbox
                        checked={showTimestamps()}
                        onChange={(event) =>
                          setShowTimestamps(event.currentTarget.checked)
                        }
                      >
                        Timestamps
                      </Checkbox>
                      <Checkbox
                        checked={autoScroll()}
                        onChange={(event) =>
                          setAutoScroll(event.currentTarget.checked)
                        }
                      >
                        Auto-scroll
                      </Checkbox>
                      <Checkbox
                        checked={wrapPackets()}
                        onChange={(event) =>
                          setWrapPackets(event.currentTarget.checked)
                        }
                      >
                        Wrap
                      </Checkbox>
                      <Button
                        disabled={packets().length === 0}
                        onClick={clearPackets}
                        size="sm"
                        type="button"
                        variant="destructive-outline"
                      >
                        <Icon icon="trash_2" class="button__icon" />
                        Clear
                      </Button>
                    </div>
                  </div>

                  <SectionPanel
                    class="packets-panel"
                    title="Log"
                    titleAccessory={
                      <div class="packets-filter-row packets-filter-row--header">
                        <For each={PacketCaptureTypes}>
                          {(type) => (
                            <PillButton
                              aria-label={`${packetTypeLabels[type]} packets`}
                              class="packets-filter-button"
                              pressed={filters()[type]}
                              onClick={() => toggleFilter(type)}
                            >
                              <span class="packets-filter-button__label">
                                {packetTypeLabels[type]}
                              </span>
                              <span class="packets-filter-button__count">
                                {stats()[type]}
                              </span>
                            </PillButton>
                          )}
                        </For>
                      </div>
                    }
                  >
                    <div
                      class="packets-log-list"
                      classList={{
                        "packets-log-list--wrapped": wrapPackets(),
                      }}
                      ref={logViewport}
                    >
                      <Show
                        when={filteredPackets().length > 0}
                        fallback={
                          <Empty class="packets-empty">
                            <EmptyHeader>
                              <EmptyTitle class="packets-empty__title">
                                {logEmptyState().title}
                              </EmptyTitle>
                              <Show when={logEmptyState().description}>
                                {(description) => (
                                  <EmptyDescription class="packets-empty__description">
                                    {description()}
                                  </EmptyDescription>
                                )}
                              </Show>
                            </EmptyHeader>
                          </Empty>
                        }
                      >
                        <div
                          class="packets-log-virtual"
                          style={{
                            height: `${logVirtualizer.getTotalSize()}px`,
                          }}
                        >
                          <For each={logVirtualRows()}>
                            {(row) => (
                              <div
                                class="packets-log-virtual__item"
                                ref={(element) => {
                                  // TanStack reads data-index synchronously during measurement.
                                  element.setAttribute(
                                    "data-index",
                                    String(row.item.index),
                                  );
                                  logVirtualizer.measureElement(element);
                                }}
                                style={{
                                  height: `${row.item.size}px`,
                                  top: `${row.item.start}px`,
                                }}
                              >
                                <PacketLogRowView entry={row.entry} />
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>
                    </div>
                  </SectionPanel>
                </div>
              </TabsContent>

              <TabsContent class="packets-tabs__content" value="send">
                <div class="packets-send-layout">
                  <div class="packets-send-tools">
                    <div class="packets-send-target">
                      <Label for="packet-target">Send as</Label>
                      <Select
                        class="packets-select"
                        ids={{ trigger: "packet-target" }}
                        items={sendTargetOptions}
                        value={[sendTarget()]}
                        onValueChange={(details) => {
                          const value = details.value[0];
                          if (isPacketSendTarget(value)) {
                            setSendTarget(value);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <span class="select__value">
                            {sendTargetLabels[sendTarget()]}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <For each={sendTargetOptions}>
                            {(target) => (
                              <SelectItem value={target.value}>
                                {target.label}
                              </SelectItem>
                            )}
                          </For>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div class="packets-send-grid">
                    <SectionPanel class="packets-panel" title="Sender">
                      <form
                        class="packets-sender"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void sendPacket();
                        }}
                      >
                        <div class="packets-sender__field">
                          <PacketSenderLabelHelp />
                          <div class="packets-sender__textarea-wrapper">
                            <Textarea
                              disabled={queueRunning()}
                              id="packet-input"
                              onKeyDown={handleSenderKeyDown}
                              onInput={(event) =>
                                setSendText(event.currentTarget.value)
                              }
                              placeholder="Enter packet payload..."
                              value={sendText()}
                            />
                          </div>
                        </div>

                        <div class="packets-sender__actions">
                          <Button disabled={!canSend()} size="sm" type="submit">
                            Send once
                          </Button>
                          <Button
                            disabled={!canSend()}
                            onClick={addQueuePacket}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <Icon icon="plus" class="button__icon" />
                            Add to queue
                          </Button>
                        </div>
                      </form>
                    </SectionPanel>

                    <SectionPanel class="packets-panel" title="Queue">
                      <div class="packets-queue">
                        <div class="packets-queue__toolbar">
                          <div class="packets-queue-delay">
                            <Label for="packet-queue-delay">Delay</Label>
                            <Input
                              aria-label="Queue delay"
                              disabled={queueRunning()}
                              id="packet-queue-delay"
                              min={0}
                              onBlur={normalizeDelayInput}
                              onInput={(event) =>
                                setDelayMs(event.currentTarget.value)
                              }
                              step={100}
                              type="number"
                              value={delayMs()}
                            />
                            <span>ms</span>
                          </div>
                        </div>

                        <div class="packets-queue__list">
                          <Show
                            when={queue().length > 0}
                            fallback={
                              <Empty class="packets-empty">
                                Queue is empty
                              </Empty>
                            }
                          >
                            <For each={queue()}>
                              {(packet, index) => (
                                <Show
                                  when={editingQueueIndex() === index()}
                                  fallback={
                                    <button
                                      class="packets-queue-row"
                                      classList={{
                                        "packets-queue-row--selected":
                                          selectedQueueIndex() === index(),
                                      }}
                                      disabled={queueRunning()}
                                      onDblClick={(event) => {
                                        event.preventDefault();
                                        startQueuePacketEditAt(index());
                                      }}
                                      onClick={() =>
                                        setSelectedQueueIndex(
                                          selectedQueueIndex() === index()
                                            ? null
                                            : index(),
                                        )
                                      }
                                      type="button"
                                    >
                                      <span class="packets-queue-row__index">
                                        {String(index() + 1).padStart(2, "0")}
                                      </span>
                                      <span class="packets-queue-row__packet">
                                        {packet}
                                      </span>
                                    </button>
                                  }
                                >
                                  <div class="packets-queue-row packets-queue-row--editing">
                                    <span class="packets-queue-row__index">
                                      {String(index() + 1).padStart(2, "0")}
                                    </span>
                                    <div class="packets-queue-row__editor">
                                      <Textarea
                                        ref={(element) => {
                                          editingQueueTextarea = element;
                                        }}
                                        aria-label={`Edit queue packet ${
                                          index() + 1
                                        }`}
                                        disabled={queueRunning()}
                                        onInput={(event) =>
                                          setEditingQueueText(
                                            event.currentTarget.value,
                                          )
                                        }
                                        onKeyDown={handleQueueEditorKeyDown}
                                        value={editingQueueText()}
                                      />
                                      <div class="packets-queue-row__edit-actions">
                                        <TooltipIconButton
                                          aria-label="Save packet edit"
                                          disabled={queueRunning()}
                                          onClick={saveQueuePacketEdit}
                                          tooltip="Save"
                                        >
                                          <Icon
                                            icon="check"
                                            class="button__icon"
                                          />
                                        </TooltipIconButton>
                                        <TooltipIconButton
                                          aria-label="Cancel packet edit"
                                          disabled={queueRunning()}
                                          onClick={cancelQueuePacketEdit}
                                          tooltip="Cancel"
                                        >
                                          <Icon icon="x" class="button__icon" />
                                        </TooltipIconButton>
                                      </div>
                                    </div>
                                  </div>
                                </Show>
                              )}
                            </For>
                          </Show>
                        </div>

                        <div class="packets-queue__actions">
                          <div class="packets-queue__actions-group">
                            <TooltipIconButton
                              aria-label="Move packet up"
                              disabled={
                                selectedQueueIndex() === null ||
                                queueRunning() ||
                                hasUnsavedQueueEdit()
                              }
                              onClick={() => moveQueuePacket(-1)}
                              tooltip="Move up"
                            >
                              <Icon icon="arrow_up" class="button__icon" />
                            </TooltipIconButton>
                            <TooltipIconButton
                              aria-label="Move packet down"
                              disabled={
                                selectedQueueIndex() === null ||
                                queueRunning() ||
                                hasUnsavedQueueEdit()
                              }
                              onClick={() => moveQueuePacket(1)}
                              tooltip="Move down"
                            >
                              <Icon icon="arrow_down" class="button__icon" />
                            </TooltipIconButton>
                            <TooltipIconButton
                              aria-label="Edit packet"
                              disabled={
                                selectedQueueIndex() === null ||
                                queueRunning() ||
                                editingQueueIndex() !== null
                              }
                              onClick={startQueuePacketEdit}
                              tooltip="Edit"
                            >
                              <Icon icon="pencil" class="button__icon" />
                            </TooltipIconButton>
                          </div>
                          <div class="packets-queue__actions-group">
                            <TooltipIconButton
                              aria-label="Remove packet"
                              disabled={
                                selectedQueueIndex() === null ||
                                queueRunning() ||
                                hasUnsavedQueueEdit()
                              }
                              onClick={removeQueuePacket}
                              tooltip="Remove"
                            >
                              <Icon icon="trash_2" class="button__icon" />
                            </TooltipIconButton>
                            <Button
                              disabled={
                                queue().length === 0 ||
                                queueRunning() ||
                                hasUnsavedQueueEdit()
                              }
                              onClick={clearQueue}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              Clear
                            </Button>
                          </div>
                        </div>
                      </div>
                    </SectionPanel>
                  </div>
                </div>
              </TabsContent>
            </div>

            <AlertDialog
              open={confirmKeyboardSendOpen()}
              onOpenChange={(details) => {
                setConfirmKeyboardSendOpen(details.open);
                if (!details.open) {
                  setPendingKeyboardSendPacket(null);
                }
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Send packet once?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This immediately sends the current packet as{" "}
                    {sendTargetLabels[sendTarget()]}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel size="sm">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={!pendingKeyboardSendPacket() || queueRunning()}
                    onClick={confirmKeyboardSend}
                    size="sm"
                  >
                    Send once
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </AppShell.Body>
      </AppShell>
    </Tabs>
  );
}

mountWindow(() => <App />);
