/* @refresh reload */
import "../../polyfills";
import "./style.css";
import { createHotkey } from "@tanstack/solid-hotkeys";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AppShell,
  AppShellBody,
  AppShellHeader,
  AppShellHeaderLeft,
  AppShellHeaderRight,
  AppShellTitle,
  Button,
  type ButtonProps,
  Card,
  CardContent,
  CardFrame,
  CardFrameHeader,
  CardFrameTitle,
  Checkbox,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  type IconButtonProps,
} from "@vexed/ui";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Download,
  HelpCircle,
  Play,
  Plus,
  Search,
  Square,
  Trash2,
  X,
} from "lucide-solid";
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
import { mountWindow } from "../mount";

type ActiveTab = "log" | "send";
const LOG_ROW_HEIGHT_COMPACT = 34;
const LOG_ROW_OVERSCAN = 8;
const LOG_ROW_WRAPPED_APPROX_CHAR_WIDTH = 7.2;
const LOG_ROW_WRAPPED_FIXED_WIDTH = 184;
const LOG_ROW_WRAPPED_FIXED_WIDTH_WITH_TIMESTAMP = 278;
const LOG_ROW_WRAPPED_TEXT_LINE_HEIGHT = 18;
const LOG_ROW_WRAPPED_VERTICAL_CHROME = 11;
const SEND_TARGET_SELECT_GUTTER = 4;

interface PacketLogEntry {
  readonly id: string;
  readonly raw: string;
  readonly text: string;
  readonly timestamp: number;
  readonly type: PacketCaptureType;
}

interface PacketTextSegment {
  readonly match: boolean;
  readonly text: string;
}

interface PacketLogEmptyState {
  readonly description?: string;
  readonly title: string;
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

const updateSendTargetSelectPosition = ({
  floatingElement,
}: {
  readonly floatingElement: HTMLElement | null;
}): void => {
  const trigger = document.getElementById("packet-target");
  if (!trigger || !floatingElement) {
    return;
  }

  const triggerRect = trigger.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const content = floatingElement.firstElementChild;
  const contentHeight =
    content instanceof HTMLElement
      ? content.getBoundingClientRect().height || content.scrollHeight
      : floatingElement.getBoundingClientRect().height;
  const bottomY = triggerRect.bottom + SEND_TARGET_SELECT_GUTTER;
  const topY = Math.max(
    SEND_TARGET_SELECT_GUTTER,
    triggerRect.top - contentHeight - SEND_TARGET_SELECT_GUTTER,
  );
  const hasMoreSpaceAbove =
    triggerRect.top > viewportHeight - triggerRect.bottom;
  const shouldOpenAbove =
    bottomY + contentHeight > viewportHeight && hasMoreSpaceAbove;
  const y = shouldOpenAbove ? topY : bottomY;
  const x = Math.min(
    Math.max(SEND_TARGET_SELECT_GUTTER, triggerRect.left),
    Math.max(SEND_TARGET_SELECT_GUTTER, viewportWidth - triggerRect.width),
  );
  const availableHeight = shouldOpenAbove
    ? Math.max(0, triggerRect.top - SEND_TARGET_SELECT_GUTTER)
    : Math.max(0, viewportHeight - y - SEND_TARGET_SELECT_GUTTER);

  floatingElement.style.setProperty("--x", `${Math.round(x)}px`);
  floatingElement.style.setProperty("--y", `${Math.round(y)}px`);
  floatingElement.style.setProperty(
    "--reference-width",
    `${Math.round(triggerRect.width)}px`,
  );
  floatingElement.style.setProperty(
    "--available-width",
    `${Math.max(0, viewportWidth - SEND_TARGET_SELECT_GUTTER * 2)}px`,
  );
  floatingElement.style.setProperty(
    "--available-height",
    `${Math.round(availableHeight)}px`,
  );
  floatingElement.style.setProperty("--z-index", "60");
};

const createEntryId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}:${Math.random().toString(36).slice(2)}`;

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  const ss = date.getSeconds().toString().padStart(2, "0");
  const ms = date.getMilliseconds().toString().padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
};

const includesSearch = (value: string, query: string): boolean =>
  value.toLocaleLowerCase().includes(query.toLocaleLowerCase());

const splitSearchMatches = (
  value: string,
  query: string,
): readonly PacketTextSegment[] => {
  if (query === "") {
    return [{ match: false, text: value }];
  }

  const normalizedValue = value.toLocaleLowerCase();
  const normalizedQuery = query.toLocaleLowerCase();
  const segments: PacketTextSegment[] = [];
  let cursor = 0;

  while (cursor < value.length) {
    const index = normalizedValue.indexOf(normalizedQuery, cursor);
    if (index === -1) {
      segments.push({ match: false, text: value.slice(cursor) });
      break;
    }

    if (index > cursor) {
      segments.push({ match: false, text: value.slice(cursor, index) });
    }

    const endIndex = index + query.length;
    segments.push({ match: true, text: value.slice(index, endIndex) });
    cursor = endIndex;
  }

  return segments;
};

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

  return Math.max(
    LOG_ROW_HEIGHT_COMPACT,
    Math.ceil(
      textLineCount * LOG_ROW_WRAPPED_TEXT_LINE_HEIGHT +
        LOG_ROW_WRAPPED_VERTICAL_CHROME,
    ),
  );
};

const toExportLine = (
  entry: PacketLogEntry,
  includeTimestamp: boolean,
): string => {
  const timestamp = includeTimestamp
    ? `[${formatTimestamp(entry.timestamp)}] `
    : "";
  return `${timestamp}[${entry.type.toUpperCase()}] ${entry.text}`;
};

const downloadText = (filename: string, content: string): void => {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

function Panel(props: {
  readonly action?: JSX.Element;
  readonly title: string;
  readonly titleAccessory?: JSX.Element;
  readonly children: JSX.Element;
}): JSX.Element {
  return (
    <CardFrame class="packets-panel">
      <CardFrameHeader class="packets-panel__header">
        <div class="packets-panel__heading">
          <CardFrameTitle class="packets-panel__title">
            {props.title}
          </CardFrameTitle>
          <Show when={props.titleAccessory}>
            {(titleAccessory) => (
              <div class="packets-panel__title-accessory">
                {titleAccessory()}
              </div>
            )}
          </Show>
        </div>
        <Show when={props.action}>
          {(action) => <div class="packets-panel__actions">{action()}</div>}
        </Show>
      </CardFrameHeader>
      <Card class="packets-panel__body">
        <CardContent class="packets-panel__content">
          {props.children}
        </CardContent>
      </Card>
    </CardFrame>
  );
}

function TooltipIconButton(props: {
  readonly "aria-label": string;
  readonly children: JSX.Element;
  readonly class?: string;
  readonly disabled?: boolean;
  readonly onClick: () => void;
  readonly tooltip: string;
}): JSX.Element {
  return (
    <Tooltip closeDelay={0} openDelay={200} positioning={{ placement: "top" }}>
      <TooltipTrigger
        asChild={(triggerProps) => (
          <IconButton
            {...(triggerProps({
              "aria-label": props["aria-label"],
              children: props.children,
              class: props.class,
              disabled: props.disabled,
              size: "icon-sm",
              type: "button",
              variant: "ghost",
              onClick: props.onClick,
            } as IconButtonProps) as IconButtonProps)}
          />
        )}
      />
      <TooltipContent>{props.tooltip}</TooltipContent>
    </Tooltip>
  );
}

function PacketSenderLabelHelp(): JSX.Element {
  return (
    <span class="packets-sender__label-help">
      <Label for="packet-input">Packet</Label>
      <Tooltip closeDelay={0} openDelay={200} positioning={{ placement: "top" }}>
        <TooltipTrigger
          asChild={(triggerProps) => (
            <Button
              {...(triggerProps({
                "aria-label": "Packet placeholders",
                children: <HelpCircle class="button__icon" />,
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
  const [confirmKeyboardSendOpen, setConfirmKeyboardSendOpen] =
    createSignal(false);
  const [pendingKeyboardSendPacket, setPendingKeyboardSendPacket] =
    createSignal<string | null>(null);
  const [error, setError] = createSignal("");
  const [notice, setNotice] = createSignal("");
  const [logScrollTop, setLogScrollTop] = createSignal(0);
  const [logViewportHeight, setLogViewportHeight] = createSignal(0);
  const [logViewportWidth, setLogViewportWidth] = createSignal(0);
  const [wrappedLogRowHeights, setWrappedLogRowHeights] = createSignal<
    ReadonlyMap<string, number>
  >(new Map());
  const [visiblePacketsCopied, setVisiblePacketsCopied] = createSignal(false);
  const [copiedPacketId, setCopiedPacketId] = createSignal<string | null>(null);
  const [queuedPacketId, setQueuedPacketId] = createSignal<string | null>(null);
  let logViewport: HTMLDivElement | undefined;
  let visiblePacketsCopiedTimer: number | undefined;
  let copiedPacketTimer: number | undefined;
  let queuedPacketTimer: number | undefined;
  let measuredLogLayoutKey = "";

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

  createEffect(() => {
    const layoutKey = `${wrapPackets()}:${Math.round(logViewportWidth())}`;
    if (layoutKey === measuredLogLayoutKey) {
      return;
    }

    measuredLogLayoutKey = layoutKey;
    setWrappedLogRowHeights(new Map());
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
  const canSend = createMemo(
    () => trimmedSendText().length > 0 && !queueRunning(),
  );
  const canQueue = createMemo(() => queue().length > 0 && !queueRunning());
  const virtualPackets = createMemo(() => {
    const entries = filteredPackets();
    const viewportHeight = logViewportHeight();
    const wrapped = wrapPackets();
    const totalHeight = entries.length * LOG_ROW_HEIGHT_COMPACT;
    if (entries.length === 0) {
      return {
        entries: [],
        offsetY: 0,
        totalHeight,
      };
    }

    if (!wrapped) {
      const maxScrollTop = Math.max(0, totalHeight - viewportHeight);
      const effectiveScrollTop = Math.min(logScrollTop(), maxScrollTop);
      const firstVisibleIndex = Math.min(
        entries.length - 1,
        Math.floor(effectiveScrollTop / LOG_ROW_HEIGHT_COMPACT),
      );
      const startIndex = Math.max(0, firstVisibleIndex - LOG_ROW_OVERSCAN);
      const visibleCount =
        Math.ceil(viewportHeight / LOG_ROW_HEIGHT_COMPACT) +
        LOG_ROW_OVERSCAN * 2;
      const endIndex = Math.min(entries.length, startIndex + visibleCount);

      return {
        entries: entries.slice(startIndex, endIndex),
        offsetY: startIndex * LOG_ROW_HEIGHT_COMPACT,
        totalHeight,
      };
    }

    const measuredHeights = wrappedLogRowHeights();
    const includeTimestamp = showTimestamps();
    const viewportWidth = logViewportWidth();
    const rowHeights = entries.map(
      (entry) =>
        measuredHeights.get(entry.id) ??
        estimateWrappedLogRowHeight(entry, viewportWidth, includeTimestamp),
    );
    const rowOffsets: number[] = [];
    let wrappedTotalHeight = 0;
    for (const height of rowHeights) {
      rowOffsets.push(wrappedTotalHeight);
      wrappedTotalHeight += height;
    }

    const maxScrollTop = Math.max(0, wrappedTotalHeight - viewportHeight);
    const effectiveScrollTop = Math.min(logScrollTop(), maxScrollTop);
    let firstVisibleIndex = 0;
    let low = 0;
    let high = entries.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const rowOffset = rowOffsets[mid] ?? 0;
      const rowHeight = rowHeights[mid] ?? LOG_ROW_HEIGHT_COMPACT;
      if (rowOffset + rowHeight > effectiveScrollTop) {
        firstVisibleIndex = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    const startIndex = Math.max(0, firstVisibleIndex - LOG_ROW_OVERSCAN);
    const visibleBottom = effectiveScrollTop + viewportHeight;
    let endIndex = firstVisibleIndex;
    while (
      endIndex < entries.length &&
      (rowOffsets[endIndex] ?? 0) < visibleBottom
    ) {
      endIndex += 1;
    }
    endIndex = Math.min(
      entries.length,
      Math.max(endIndex, firstVisibleIndex + 1) + LOG_ROW_OVERSCAN,
    );

    return {
      entries: entries.slice(startIndex, endIndex),
      offsetY: rowOffsets[startIndex] ?? 0,
      totalHeight: wrappedTotalHeight,
    };
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
        if (logViewport) {
          logViewport.scrollTop = logViewport.scrollHeight;
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

  const markVisiblePacketsCopied = (): void => {
    if (visiblePacketsCopiedTimer !== undefined) {
      window.clearTimeout(visiblePacketsCopiedTimer);
    }

    setVisiblePacketsCopied(true);
    visiblePacketsCopiedTimer = window.setTimeout(() => {
      setVisiblePacketsCopied(false);
      visiblePacketsCopiedTimer = undefined;
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

  const copyVisible = (): void => {
    const content = filteredPackets()
      .map((entry) => toExportLine(entry, showTimestamps()))
      .join("\n");
    if (content) {
      void copyText(content).then((copied) => {
        if (copied) {
          markVisiblePacketsCopied();
        }
      });
    }
  };

  const exportVisible = (): void => {
    const content = filteredPackets()
      .map((entry) => toExportLine(entry, true))
      .join("\n");
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

  const removeQueuePacket = (): void => {
    const index = selectedQueueIndex();
    if (index === null || queueRunning()) {
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
    if (index === null || queueRunning()) {
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
    if (queueRunning()) {
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
    if (status.stoppedReason) {
      setNotice(status.stoppedReason);
    }
  };

  const updateLogViewportMetrics = (): void => {
    if (!logViewport) {
      return;
    }

    setLogScrollTop(logViewport.scrollTop);
    setLogViewportHeight(logViewport.clientHeight);
    setLogViewportWidth(logViewport.clientWidth);
  };

  const recordWrappedLogRowHeight = (id: string, height: number): void => {
    const measuredHeight = Math.max(LOG_ROW_HEIGHT_COMPACT, Math.ceil(height));
    setWrappedLogRowHeights((current) => {
      if (current.get(id) === measuredHeight) {
        return current;
      }

      const next = new Map(current);
      next.set(id, measuredHeight);
      return next;
    });
  };

  const renderPacketText = (text: string): JSX.Element => {
    const query = search().trim();
    if (query === "") {
      return text;
    }

    return (
      <For each={splitSearchMatches(text, query)}>
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
    readonly measureWrapped: boolean;
  }): JSX.Element => {
    let rowElement: HTMLDivElement | undefined;
    let resizeObserver: ResizeObserver | undefined;

    const disconnectResizeObserver = (): void => {
      resizeObserver?.disconnect();
      resizeObserver = undefined;
    };

    const measureRow = (): void => {
      if (!rowElement) {
        return;
      }

      recordWrappedLogRowHeight(
        props.entry.id,
        rowElement.getBoundingClientRect().height,
      );
    };

    createEffect(() => {
      if (!props.measureWrapped || !rowElement) {
        disconnectResizeObserver();
        return;
      }

      measureRow();
      resizeObserver ??= new ResizeObserver(measureRow);
      resizeObserver.observe(rowElement);
    });

    onCleanup(disconnectResizeObserver);

    return (
      <div
        class="packets-log-row"
        classList={{
          "packets-log-row--copied": copiedPacketId() === props.entry.id,
        }}
        ref={rowElement}
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
              {formatTimestamp(props.entry.timestamp)}
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
            <Check aria-hidden="true" />
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
            <Plus class="button__icon" />
          </span>
          <span class="packets-log-row__queue-icon packets-log-row__queue-icon--check">
            <Check class="button__icon" />
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
      if (visiblePacketsCopiedTimer !== undefined) {
        window.clearTimeout(visiblePacketsCopiedTimer);
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
      onValueChange={(details) =>
        setActiveTab(details.value as ActiveTab)
      }
    >
      <AppShell class="packets-window">
        <AppShellHeader class="packets-header">
          <AppShellHeaderLeft>
            <AppShellTitle>Packets</AppShellTitle>
            <TabsList class="packets-tabs__list">
              <TabsTrigger value="log">Log</TabsTrigger>
              <TabsTrigger value="send">Send</TabsTrigger>
            </TabsList>
          </AppShellHeaderLeft>
          <AppShellHeaderRight>
            <Show when={activeTab() === "log"}>
              <div class="packets-header__actions">
                <Button
                  aria-label={
                    visiblePacketsCopied()
                      ? "Copied visible packets"
                      : "Copy visible packets"
                  }
                  class="packets-copy-button"
                  classList={{
                    "packets-copy-button--copied": visiblePacketsCopied(),
                  }}
                  disabled={filteredPackets().length === 0}
                  onClick={copyVisible}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <span aria-hidden="true" class="packets-copy-button__icon-stack">
                    <span class="packets-copy-button__icon packets-copy-button__icon--copy">
                      <Copy class="button__icon" />
                    </span>
                    <span class="packets-copy-button__icon packets-copy-button__icon--check">
                      <Check class="button__icon" />
                    </span>
                  </span>
                  <span aria-hidden="true" class="packets-copy-button__label-stack">
                    <span class="packets-copy-button__label packets-copy-button__label--copy">
                      Copy
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
                  <Download class="button__icon" />
                  <span class="packets-header__button-label">Export</span>
                </Button>
                <Button
                  aria-label={captureRunning() ? "Stop capture" : "Start capture"}
                  onClick={() => void toggleCapture()}
                  size="sm"
                  type="button"
                  variant={captureRunning() ? "destructive-outline" : "default"}
                >
                  {captureRunning() ? (
                    <Square class="button__icon" />
                  ) : (
                    <Play class="button__icon" />
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
                  onClick={() => void (queueRunning() ? stopQueue() : startQueue())}
                  size="sm"
                  type="button"
                  variant={queueRunning() ? "destructive-outline" : "default"}
                >
                  {queueRunning() ? (
                    <Square class="button__icon" />
                  ) : (
                    <Play class="button__icon" />
                  )}
                  <span class="packets-header__button-label">
                    {queueRunning() ? "Stop queue" : "Start queue"}
                  </span>
                </Button>
              </div>
            </Show>
          </AppShellHeaderRight>
        </AppShellHeader>

        <AppShellBody class="packets-body" maxWidth={false} scroll={false}>
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
                  <X class="button__icon" />
                </IconButton>
              </div>
            </Show>

            <div class="packets-tabs">
              <TabsContent class="packets-tabs__content" value="log">
              <div class="packets-log-grid">
                <div class="packets-log-tools">
                  <InputGroup class="packets-search">
                    <InputGroupAddon>
                      <Search aria-hidden="true" />
                    </InputGroupAddon>
                    <InputGroupInput
                      ref={(element) => {
                        packetSearchInput = element;
                      }}
                      aria-label="Search packets"
                      placeholder="Search packets..."
                      value={search()}
                      onInput={(event) => setSearch(event.currentTarget.value)}
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
                      <Trash2 class="button__icon" />
                      Clear
                    </Button>
                  </div>
                </div>

                <Panel
                  title="Log"
                  titleAccessory={
                    <div class="packets-filter-row packets-filter-row--header">
                      <For each={PacketCaptureTypes}>
                        {(type) => (
                          <div
                            class="packets-filter-pill"
                            classList={{
                              "packets-filter-pill--active": filters()[type],
                            }}
                          >
                            <button
                              aria-label={`${packetTypeLabels[type]} packets`}
                              aria-pressed={filters()[type]}
                              class="packets-filter-pill__button"
                              onClick={() => toggleFilter(type)}
                              type="button"
                            >
                              {packetTypeLabels[type]}
                            </button>
                            <span class="packets-filter-pill__count">
                              {stats()[type]}
                            </span>
                          </div>
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
                    onScroll={updateLogViewportMetrics}
                    ref={logViewport}
                  >
                    <Show
                      when={filteredPackets().length > 0}
                      fallback={
                        <div class="packets-empty">
                          <span class="packets-empty__title">
                            {logEmptyState().title}
                          </span>
                          <Show when={logEmptyState().description}>
                            {(description) => (
                              <span class="packets-empty__description">
                                {description()}
                              </span>
                            )}
                          </Show>
                        </div>
                      }
                    >
                      <div
                        class="packets-log-virtual"
                        style={{
                          height: `${virtualPackets().totalHeight}px`,
                        }}
                      >
                        <div
                          class="packets-log-virtual__items"
                          style={{
                            top: `${virtualPackets().offsetY}px`,
                          }}
                        >
                          <For each={virtualPackets().entries}>
                            {(entry) => (
                              <PacketLogRowView
                                entry={entry}
                                measureWrapped={wrapPackets()}
                              />
                            )}
                          </For>
                        </div>
                      </div>
                    </Show>
                  </div>
                </Panel>
              </div>
            </TabsContent>

            <TabsContent class="packets-tabs__content" value="send">
              <div class="packets-send-layout">
                <div class="packets-send-tools">
                  <div class="packets-send-target">
                    <Label for="packet-target">Send as</Label>
                    <Select
                      class="packets-select"
                      items={sendTargetOptions}
                      positioning={{
                        fitViewport: true,
                        sameWidth: true,
                        strategy: "fixed",
                        updatePosition: updateSendTargetSelectPosition,
                      }}
                      value={[sendTarget()]}
                      onValueChange={(details) => {
                        const value = details.value[0];
                        if (isPacketSendTarget(value)) {
                          setSendTarget(value);
                        }
                      }}
                    >
                      <SelectTrigger id="packet-target">
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
                  <Panel title="Sender">
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
                          <Plus class="button__icon" />
                          Add to queue
                        </Button>
                      </div>
                    </form>
                  </Panel>

                  <Panel title="Queue">
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
                            <div class="packets-empty">Queue is empty</div>
                          }
                        >
                          <For each={queue()}>
                            {(packet, index) => (
                              <button
                                class="packets-queue-row"
                                classList={{
                                  "packets-queue-row--selected":
                                    selectedQueueIndex() === index(),
                                }}
                                disabled={queueRunning()}
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
                            )}
                          </For>
                        </Show>
                      </div>

                      <div class="packets-queue__actions">
                        <div class="packets-queue__actions-group">
                          <TooltipIconButton
                            aria-label="Move packet up"
                            disabled={
                              selectedQueueIndex() === null || queueRunning()
                            }
                            onClick={() => moveQueuePacket(-1)}
                            tooltip="Move up"
                          >
                            <ArrowUp class="button__icon" />
                          </TooltipIconButton>
                          <TooltipIconButton
                            aria-label="Move packet down"
                            disabled={
                              selectedQueueIndex() === null || queueRunning()
                            }
                            onClick={() => moveQueuePacket(1)}
                            tooltip="Move down"
                          >
                            <ArrowDown class="button__icon" />
                          </TooltipIconButton>
                        </div>
                        <div class="packets-queue__actions-group">
                          <TooltipIconButton
                            aria-label="Remove packet"
                            disabled={
                              selectedQueueIndex() === null || queueRunning()
                            }
                            onClick={removeQueuePacket}
                            tooltip="Remove"
                          >
                            <Trash2 class="button__icon" />
                          </TooltipIconButton>
                          <Button
                            disabled={queue().length === 0 || queueRunning()}
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
                  </Panel>
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
      </AppShellBody>
    </AppShell>
    </Tabs>
  );
}

mountWindow(() => <App />);
