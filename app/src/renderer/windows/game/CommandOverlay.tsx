import {
  For,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  type Accessor,
  type JSX,
  type Setter,
} from "solid-js";
import { ChevronUp, X } from "lucide-solid";
import type { CommandOverlayLayoutSettings } from "../../../shared/settings";
import type { ScriptCommandDisplayItem } from "./scripting/scriptCommandDisplay";

const ROW_HEIGHT = 28;
const OVERSCAN = 6;
const EDGE_PADDING = 8;
const SCROLL_PADDING = 4;
const MAX_SCROLL_CONTEXT_ROWS = 2;
const MIN_SIZE = { width: 240, height: 96 } as const;
const COLLAPSED_MIN_SIZE = { width: 220, height: 28 } as const;

export interface VirtualRange {
  readonly start: number;
  readonly end: number;
}

export interface OverlayPosition {
  readonly x: number;
  readonly y: number;
}

export interface OverlaySize {
  readonly width: number;
  readonly height: number;
}

export interface CommandOverlayProps {
  readonly commands: Accessor<readonly ScriptCommandDisplayItem[]>;
  readonly activeCommand: Accessor<RunningScriptCommand | null>;
  readonly layout: Accessor<CommandOverlayLayoutSettings>;
  readonly scriptName: Accessor<string>;
  readonly running: Accessor<boolean>;
  readonly setLayout: Setter<CommandOverlayLayoutSettings>;
  readonly onClose: () => void;
  readonly onLayoutCommit: (layout: CommandOverlayLayoutSettings) => void;
}

export const getVirtualRange = (
  total: number,
  scrollTop: number,
  viewportHeight: number,
  rowHeight = ROW_HEIGHT,
  overscan = OVERSCAN,
): VirtualRange => {
  if (total <= 0 || rowHeight <= 0 || viewportHeight <= 0) {
    return { start: 0, end: 0 };
  }

  const visibleStart = Math.floor(scrollTop / rowHeight);
  const visibleEnd = Math.ceil((scrollTop + viewportHeight) / rowHeight);
  return {
    start: Math.max(0, visibleStart - overscan),
    end: Math.min(total, visibleEnd + overscan),
  };
};

export const formatCommandIndex = (index: number, total: number): string => {
  const width = Math.max(2, String(Math.max(1, total)).length);
  return String(index + 1).padStart(width, "0");
};

export const getScrollTopForVisibleIndex = (
  index: number,
  scrollTop: number,
  viewportHeight: number,
  scrollHeight: number,
  rowHeight = ROW_HEIGHT,
  padding = SCROLL_PADDING,
  maxContextRows = MAX_SCROLL_CONTEXT_ROWS,
): number => {
  if (index < 0 || rowHeight <= 0 || viewportHeight <= 0) {
    return scrollTop;
  }

  const maxScrollTop = Math.max(0, scrollHeight - viewportHeight);
  const itemTop = index * rowHeight;
  const itemBottom = itemTop + rowHeight;
  const visibleRows = Math.floor(viewportHeight / rowHeight);
  const contextRows =
    visibleRows <= 2
      ? 0
      : Math.min(maxContextRows, Math.floor((visibleRows - 1) / 2));
  const contextPadding = Math.max(padding, contextRows * rowHeight);
  const visibleTop = scrollTop + contextPadding;
  const visibleBottom = scrollTop + viewportHeight - contextPadding;

  if (itemTop < visibleTop) {
    return Math.max(0, Math.min(maxScrollTop, itemTop - contextPadding));
  }

  if (itemBottom > visibleBottom) {
    return Math.max(
      0,
      Math.min(maxScrollTop, itemBottom + contextPadding - viewportHeight),
    );
  }

  return scrollTop;
};

export const getClampedOverlayPosition = (
  position: OverlayPosition,
  containerSize: { readonly width: number; readonly height: number },
  overlaySize: { readonly width: number; readonly height: number },
  padding = EDGE_PADDING,
): OverlayPosition => {
  const maxX = Math.max(
    padding,
    containerSize.width - overlaySize.width - padding,
  );
  const maxY = Math.max(
    padding,
    containerSize.height - overlaySize.height - padding,
  );

  return {
    x: Math.min(Math.max(position.x, padding), maxX),
    y: Math.min(Math.max(position.y, padding), maxY),
  };
};

export const getClampedOverlaySize = (
  size: OverlaySize,
  position: OverlayPosition,
  containerSize: { readonly width: number; readonly height: number },
  minSize: OverlaySize = MIN_SIZE,
  padding = EDGE_PADDING,
  maxContentHeight = Number.POSITIVE_INFINITY,
): OverlaySize => {
  const maxWidth = Math.max(
    minSize.width,
    containerSize.width - position.x - padding,
  );
  const maxViewportHeight = Math.max(
    minSize.height,
    containerSize.height - position.y - padding,
  );
  const maxHeight = Math.max(
    minSize.height,
    Math.min(maxViewportHeight, maxContentHeight),
  );

  return {
    width: Math.min(Math.max(size.width, minSize.width), maxWidth),
    height: Math.min(Math.max(size.height, minSize.height), maxHeight),
  };
};

export function CommandOverlay(props: CommandOverlayProps): JSX.Element {
  let overlayRef: HTMLElement | undefined;
  let bodyRef: HTMLDivElement | undefined;
  let scrollFrame = 0;
  let boundsFrame = 0;
  let dragState:
    | {
        readonly pointerId: number;
        readonly startClientX: number;
        readonly startClientY: number;
        readonly startX: number;
        readonly startY: number;
      }
    | undefined;
  let resizeState:
    | {
        readonly pointerId: number;
        readonly startClientX: number;
        readonly startClientY: number;
        readonly startWidth: number;
        readonly startHeight: number;
      }
    | undefined;

  const [scrollTop, setScrollTop] = createSignal(0);
  const [viewportHeight, setViewportHeight] = createSignal(0);
  const [dragging, setDragging] = createSignal(false);
  const [resizing, setResizing] = createSignal(false);

  const position = (): OverlayPosition => props.layout().position;
  const size = (): OverlaySize => props.layout().size;
  const collapsed = (): boolean => props.layout().collapsed;

  const resolveNext = <T,>(value: T | ((current: T) => T), current: T): T =>
    typeof value === "function" ? (value as (current: T) => T)(current) : value;

  const setPosition = (
    value: OverlayPosition | ((current: OverlayPosition) => OverlayPosition),
  ) => {
    props.setLayout((current) => ({
      ...current,
      position: resolveNext(value, current.position),
    }));
  };

  const setSize = (
    value: OverlaySize | ((current: OverlaySize) => OverlaySize),
  ) => {
    props.setLayout((current) => ({
      ...current,
      size: resolveNext(value, current.size),
    }));
  };

  const activeIndex = createMemo(() => {
    const current = props.activeCommand();
    if (!current) {
      return -1;
    }

    if (current.sourceName !== props.scriptName()) {
      return -1;
    }

    return props
      .commands()
      .findIndex((command) => command.index === current.index);
  });

  const range = createMemo(() =>
    getVirtualRange(
      props.commands().length,
      scrollTop(),
      viewportHeight(),
      ROW_HEIGHT,
      OVERSCAN,
    ),
  );

  const visibleCommands = createMemo(() => {
    const currentRange = range();
    return props.commands().slice(currentRange.start, currentRange.end);
  });

  const commandCount = createMemo(() => props.commands().length);
  const commandIndexWidth = createMemo(() =>
    Math.max(2, String(Math.max(1, commandCount())).length),
  );

  const collapsedCommand = createMemo(() => {
    const command = props.commands()[activeIndex()];
    if (!command) {
      return "";
    }

    return command.label;
  });

  const syncViewportHeight = () => {
    setViewportHeight(bodyRef?.clientHeight ?? 0);
  };

  const containerSize = ():
    | { readonly width: number; readonly height: number }
    | undefined => {
    const container = overlayRef?.parentElement;
    return container
      ? { width: container.clientWidth, height: container.clientHeight }
      : undefined;
  };

  const renderedOverlaySize = (): OverlaySize => {
    const overlay = overlayRef;
    if (!overlay) {
      return collapsed() ? COLLAPSED_MIN_SIZE : size();
    }

    return {
      width: overlay.offsetWidth,
      height: overlay.offsetHeight,
    };
  };

  const clampOverlayPosition = (nextPosition: OverlayPosition) => {
    const container = containerSize();
    const overlay = overlayRef;
    if (!container || !overlay) {
      return nextPosition;
    }

    return getClampedOverlayPosition(
      nextPosition,
      container,
      renderedOverlaySize(),
    );
  };

  const clampOverlaySize = (nextSize: OverlaySize): OverlaySize => {
    const container = containerSize();
    if (!container) {
      return nextSize;
    }

    return getClampedOverlaySize(
      nextSize,
      position(),
      container,
      MIN_SIZE,
      EDGE_PADDING,
      maxContentHeight(),
    );
  };

  const syncBounds = () => {
    syncViewportHeight();
    if (!collapsed()) {
      setSize((current) => clampOverlaySize(current));
    }
    setPosition((current) => clampOverlayPosition(current));
  };

  const scheduleSyncBounds = () => {
    window.cancelAnimationFrame(boundsFrame);
    boundsFrame = window.requestAnimationFrame(syncBounds);
  };

  const maxContentHeight = (): number => {
    const body = bodyRef;
    const overlay = overlayRef;
    const total = commandCount();

    if (!body || !overlay || total <= 0 || body.clientHeight <= 0) {
      return Number.POSITIVE_INFINITY;
    }

    const bodyStyle = window.getComputedStyle(body);
    const bodyPadding =
      (Number.parseFloat(bodyStyle.paddingTop) || 0) +
      (Number.parseFloat(bodyStyle.paddingBottom) || 0);
    const overlayChromeHeight = overlay.offsetHeight - body.clientHeight;

    return overlayChromeHeight + total * ROW_HEIGHT + bodyPadding;
  };

  const handleDragStart: JSX.EventHandler<HTMLElement, PointerEvent> = (
    event,
  ) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const current = position();
    dragState = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: current.x,
      startY: current.y,
    };
    setDragging(true);
  };

  const handleDragMove: JSX.EventHandler<HTMLElement, PointerEvent> = (
    event,
  ) => {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    setPosition(
      clampOverlayPosition({
        x: dragState.startX + event.clientX - dragState.startClientX,
        y: dragState.startY + event.clientY - dragState.startClientY,
      }),
    );
  };

  const handleDragEnd: JSX.EventHandler<HTMLElement, PointerEvent> = (
    event,
  ) => {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    dragState = undefined;
    setDragging(false);
    props.onLayoutCommit(props.layout());
  };

  const handleResizeStart: JSX.EventHandler<HTMLElement, PointerEvent> = (
    event,
  ) => {
    if (event.button !== 0 || collapsed()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const current = size();
    resizeState = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startWidth: current.width,
      startHeight: current.height,
    };
    setResizing(true);
  };

  const handleResizeMove: JSX.EventHandler<HTMLElement, PointerEvent> = (
    event,
  ) => {
    if (!resizeState || resizeState.pointerId !== event.pointerId) {
      return;
    }

    setSize(
      clampOverlaySize({
        width:
          resizeState.startWidth + event.clientX - resizeState.startClientX,
        height:
          resizeState.startHeight + event.clientY - resizeState.startClientY,
      }),
    );
  };

  const handleResizeEnd: JSX.EventHandler<HTMLElement, PointerEvent> = (
    event,
  ) => {
    if (!resizeState || resizeState.pointerId !== event.pointerId) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    resizeState = undefined;
    setResizing(false);
    syncBounds();
    props.onLayoutCommit(props.layout());
  };

  const toggleCollapsed: JSX.EventHandler<HTMLButtonElement, MouseEvent> = (
    event,
  ) => {
    event.stopPropagation();
    let nextLayout = props.layout();
    props.setLayout((current) => {
      nextLayout = { ...current, collapsed: !current.collapsed };
      return nextLayout;
    });
    props.onLayoutCommit(nextLayout);
    scheduleSyncBounds();
  };

  const closeOverlay: JSX.EventHandler<HTMLButtonElement, MouseEvent> = (
    event,
  ) => {
    event.stopPropagation();
    props.onClose();
  };

  onMount(() => {
    syncBounds();

    if (!bodyRef) {
      return;
    }

    const resizeObserver = new ResizeObserver(syncBounds);
    resizeObserver.observe(bodyRef);
    if (overlayRef) {
      resizeObserver.observe(overlayRef);
    }
    if (overlayRef?.parentElement) {
      resizeObserver.observe(overlayRef.parentElement);
    }
    onCleanup(() => resizeObserver.disconnect());
  });

  createEffect(() => {
    const index = activeIndex();
    const body = bodyRef;
    const height = viewportHeight();

    if (!props.running() || index < 0 || !body || height <= 0) {
      return;
    }

    window.cancelAnimationFrame(scrollFrame);
    scrollFrame = window.requestAnimationFrame(() => {
      const nextScrollTop = getScrollTopForVisibleIndex(
        index,
        body.scrollTop,
        height,
        body.scrollHeight,
      );

      if (body.scrollTop !== nextScrollTop) {
        body.scrollTop = nextScrollTop;
        setScrollTop(nextScrollTop);
      }
    });
  });

  createEffect(() => {
    commandCount();
    collapsed();
    scheduleSyncBounds();
  });

  onCleanup(() => {
    window.cancelAnimationFrame(scrollFrame);
    window.cancelAnimationFrame(boundsFrame);
  });

  return (
    <aside
      ref={overlayRef}
      class="command-overlay"
      data-collapsed={collapsed() ? "" : undefined}
      data-dragging={dragging() ? "" : undefined}
      data-resizing={resizing() ? "" : undefined}
      aria-label={`Loaded commands for ${props.scriptName() || "script"}`}
      style={{
        "block-size": collapsed() ? "auto" : `${size().height}px`,
        "inset-block-start": `${Math.round(position().y)}px`,
        "inset-inline-start": `${Math.round(position().x)}px`,
        "inline-size": `${size().width}px`,
      }}
    >
      <header
        class="command-overlay__header"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
      >
        {!collapsed() && (
          <div class="command-overlay__title-group">
            <span class="command-overlay__title">Commands</span>
          </div>
        )}
        <span
          class="command-overlay__status"
          data-active={collapsed() && collapsedCommand() ? "" : undefined}
        >
          <span class="command-overlay__status-text">
            {collapsed() ? collapsedCommand() : ""}
          </span>
        </span>
        <button
          aria-label={collapsed() ? "Expand commands" : "Collapse commands"}
          class="command-overlay__icon-button"
          data-collapsed={collapsed() ? "" : undefined}
          type="button"
          onClick={toggleCollapsed}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <ChevronUp aria-hidden="true" class="command-overlay__chevron-icon" />
        </button>
        <button
          aria-label="Close command overlay"
          class="command-overlay__icon-button command-overlay__icon-button--close"
          type="button"
          onClick={closeOverlay}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <X aria-hidden="true" class="command-overlay__close-icon" />
        </button>
      </header>

      {!collapsed() && (
        <>
          <div
            ref={bodyRef}
            class="command-overlay__body"
            onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
            style={{
              "--command-overlay-index-width": `${commandIndexWidth()}ch`,
            }}
          >
            <div
              class="command-overlay__spacer"
              style={{ height: `${commandCount() * ROW_HEIGHT}px` }}
            >
              {activeIndex() >= 0 && (
                <div
                  aria-hidden="true"
                  class="command-overlay__active-indicator"
                  style={{
                    height: `${ROW_HEIGHT}px`,
                    transform: `translateY(${activeIndex() * ROW_HEIGHT}px)`,
                  }}
                />
              )}
              <For each={visibleCommands()}>
                {(command) => {
                  const active = () => activeIndex() === command.index;
                  return (
                    <div
                      class="command-overlay__row"
                      aria-current={active() ? "step" : undefined}
                      data-active={active() ? "" : undefined}
                      style={{
                        height: `${ROW_HEIGHT}px`,
                        "inset-block-start": `${command.index * ROW_HEIGHT}px`,
                      }}
                    >
                      <span class="command-overlay__index">
                        {formatCommandIndex(command.index, commandCount())}
                      </span>
                      <span class="command-overlay__command">
                        <span class="command-overlay__name">
                          {command.label}
                        </span>
                      </span>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
          <div
            aria-hidden="true"
            class="command-overlay__resize-handle"
            onPointerDown={handleResizeStart}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
            onPointerCancel={handleResizeEnd}
          />
        </>
      )}
    </aside>
  );
}
