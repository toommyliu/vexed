<script lang="ts">
  import { motionScale, motionFade } from "@vexed/ui/motion";
  import { Button, Icon } from "@vexed/ui";
  import { cn } from "@vexed/ui/util";

  import { onMount, tick, type Snippet } from "svelte";

  type PanelState = {
    dragOffset: { x: number; y: number };
    hide(): void;
    isDragging: boolean;
    isVisible: boolean;
    loadPosition(panel: HTMLDivElement): void;
    savePosition(panel: HTMLDivElement): void;
    setDragging(dragging: boolean): void;
  };

  type ResizeDirection =
    | "e"
    | "n"
    | "ne"
    | "nw"
    | "s"
    | "se"
    | "sw"
    | "w"
    | null;

  type Props = {
    canResize?: boolean;
    children?: Snippet;
    class?: string;
    defaultWidth?: number;
    header?: Snippet;
    headerClass?: string;
    minHeight?: number;
    minWidth?: number;
    onheadercontextmenu?(this: void, ev: MouseEvent): void;
    onheaderdblclick?(this: void, ev: MouseEvent): void;
    panelState: PanelState;
    showClose?: boolean;
    title?: string;
  };

  const {
    title = "",
    panelState,
    minWidth = 320,
    minHeight = 160,
    defaultWidth = 340,
    class: className = "",
    headerClass = "",
    showClose = true,
    canResize = true,
    onheaderdblclick,
    onheadercontextmenu,
    header,
    children,
  }: Props = $props();

  // svelte-ignore non_reactive_update
  let panel: HTMLDivElement;
  let panelRef: HTMLDivElement | null = null;
  let wasVisible = false;

  let activeInteraction: "drag" | "resize" | null = null;
  let activePointerId: number | null = null;
  let activePointerTarget: HTMLElement | null = null;

  let resizeDirection = $state<ResizeDirection>(null);
  let resizeStart = { x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 };

  let panelRect = { x: 0, y: 0, width: 0, height: 0 };

  let topNav: HTMLElement | null = null;

  let topNavBottom = 0;
  let topNavObserver: ResizeObserver | null = null;

  let frameId: number | null = null;

  function applyRect(x: number, y: number, width?: number, height?: number) {
    panel.style.left = `${x}px`;
    panel.style.top = `${y}px`;
    panelRect.x = x;
    panelRect.y = y;
    if (width !== undefined) {
      panel.style.width = `${width}px`;
      panelRect.width = width;
    }
    if (height !== undefined) {
      panel.style.height = `${height}px`;
      panelRect.height = height;
    }
  }

  $effect(() => {
    const isVisible = panelState.isVisible;

    if (isVisible && !wasVisible) {
      void tick().then(() => {
        if (panel) {
          panelRef = panel;
          panelState.loadPosition(panel);
          // Sync panelRect after position is loaded.
          const rect = panel.getBoundingClientRect();
          panelRect = {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          };
        }
      });
    }

    if (!isVisible && wasVisible && panelRef) {
      panelState.savePosition(panelRef);
    }

    wasVisible = isVisible;
  });

  function handleDragStart(ev: PointerEvent) {
    if (ev.button !== 0) return;
    if (
      (ev.target as HTMLElement).closest("[data-panel-control], .panel-control")
    )
      return;
    if ((ev.target as HTMLElement).closest("[data-resize]")) return;

    activeInteraction = "drag";
    activePointerId = ev.pointerId;
    activePointerTarget = ev.currentTarget as HTMLElement;
    activePointerTarget.setPointerCapture(ev.pointerId);

    panelState.setDragging(true);
    ev.preventDefault();

    // One read on gesture start is fine — not in a hot loop.
    const rect = panel.getBoundingClientRect();
    panelRect = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };
    panelState.dragOffset = {
      x: ev.clientX - rect.left,
      y: ev.clientY - rect.top,
    };
  }

  function handlePointerMove(ev: PointerEvent) {
    if (activePointerId !== ev.pointerId) return;

    if (activeInteraction === "resize") {
      handleResizeMove(ev);
      return;
    }

    if (activeInteraction !== "drag" || !panelState.isDragging || !panel) {
      return;
    }

    if (frameId) cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(() => {
      const { innerWidth, innerHeight } = window;

      const x = Math.max(
        0,
        Math.min(
          ev.clientX - panelState.dragOffset.x,
          innerWidth - panelRect.width,
        ),
      );
      const y = Math.max(
        topNavBottom, // cached — no reflow
        Math.min(
          ev.clientY - panelState.dragOffset.y,
          innerHeight - panelRect.height,
        ),
      );

      applyRect(x, y);
    });
  }

  function handlePointerEnd(ev: PointerEvent) {
    if (activePointerId !== ev.pointerId) return;

    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }

    if (resizeDirection || activeInteraction === "resize") {
      resizeDirection = null;
    }

    if (panelState.isDragging) {
      panelState.setDragging(false);
    }

    ensureWithinViewport();
    panelState.savePosition(panel);

    if (activePointerTarget?.hasPointerCapture(ev.pointerId)) {
      activePointerTarget.releasePointerCapture(ev.pointerId);
    }

    activeInteraction = null;
    activePointerId = null;
    activePointerTarget = null;
  }

  function handleResizeStart(ev: PointerEvent, direction: ResizeDirection) {
    if (ev.button !== 0) return;
    ev.stopPropagation();

    activeInteraction = "resize";
    activePointerId = ev.pointerId;
    activePointerTarget = ev.currentTarget as HTMLElement;
    activePointerTarget.setPointerCapture(ev.pointerId);

    resizeDirection = direction;
    ev.preventDefault();

    // One read on gesture start — not in a hot loop.
    const rect = panel.getBoundingClientRect();
    panelRect = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };
    resizeStart = {
      x: ev.clientX,
      y: ev.clientY,
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top,
    };
  }

  function handleResizeMove(ev: PointerEvent) {
    if (!resizeDirection || !panel) return;

    const dir = resizeDirection;
    if (frameId) cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(() => {
      const { innerWidth, innerHeight } = window;
      const dx = ev.clientX - resizeStart.x;
      const dy = ev.clientY - resizeStart.y;

      let left = resizeStart.left;
      let top = resizeStart.top;
      let width = resizeStart.width;
      let height = resizeStart.height;

      if (dir.includes("e")) {
        width = Math.min(innerWidth - left, Math.max(minWidth, width + dx));
      }

      if (dir.includes("s")) {
        height = Math.min(innerHeight - top, Math.max(minHeight, height + dy));
      }

      if (dir.includes("w")) {
        const newLeft = Math.max(0, left + dx);
        const newWidth = width + (left - newLeft);
        if (newWidth >= minWidth) {
          width = newWidth;
          left = newLeft;
        }
      }

      if (dir.includes("n")) {
        const newTop = Math.max(topNavBottom, top + dy); // cached — no reflow
        const newHeight = height + (top - newTop);
        if (newHeight >= minHeight) {
          height = newHeight;
          top = newTop;
        }
      }

      applyRect(left, top, width, height);
    });
  }

  function ensureWithinViewport() {
    if (!panel) return;

    // One read here is acceptable — this runs only on pointer-up or window resize.
    const rect = panel.getBoundingClientRect();
    panelRect = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };

    const { innerWidth, innerHeight } = window;
    let { x, y, width, height } = panelRect;

    width = Math.max(minWidth, Math.min(width, innerWidth));
    height = Math.max(minHeight, Math.min(height, innerHeight - topNavBottom));
    x = Math.max(0, Math.min(x, innerWidth - width));
    y = Math.max(topNavBottom, Math.min(y, innerHeight - height));

    applyRect(x, y, width, height);
    panelState.savePosition(panel);
  }

  onMount(() => {
    topNav = document.querySelector("#topnav-container");

    if (topNav) {
      topNavBottom = topNav.getBoundingClientRect().bottom;
      topNavObserver = new ResizeObserver((entries) => {
        topNavBottom = entries[0]?.contentRect.bottom ?? 0;
      });
      topNavObserver.observe(topNav);
    }

    window.addEventListener("resize", ensureWithinViewport);

    return () => {
      window.removeEventListener("resize", ensureWithinViewport);
      topNavObserver?.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
    };
  });
</script>

{#if panelState.isVisible}
  <div
    bind:this={panel}
    class={cn(
      "fixed left-5 top-10 z-[9999] flex min-h-[160px] min-w-[280px] select-none flex-col overflow-hidden rounded-[var(--radius)] bg-popover/95 shadow-md",
      panelState.isDragging && "cursor-grabbing opacity-90",
      resizeDirection && "opacity-95",
      className,
    )}
    role="group"
    aria-label={title || "Floating panel"}
    style="width: {defaultWidth}px;"
    in:motionScale={{ duration: 120, start: 0.96, opacity: 0 }}
    out:motionFade={{ duration: 80 }}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerEnd}
    onpointercancel={handlePointerEnd}
  >
    {#if canResize}
      <!-- Resize handles -->
      <div
        data-resize
        role="presentation"
        class="absolute left-1.5 right-1.5 top-0 z-10 h-1 cursor-n-resize touch-none"
        onpointerdown={(ev) => handleResizeStart(ev, "n")}
      ></div>
      <div
        data-resize
        role="presentation"
        class="absolute bottom-0 left-1.5 right-1.5 z-10 h-1 cursor-s-resize touch-none"
        onpointerdown={(ev) => handleResizeStart(ev, "s")}
      ></div>
      <div
        data-resize
        role="presentation"
        class="absolute bottom-1.5 right-0 top-1.5 z-10 w-1 cursor-e-resize touch-none"
        onpointerdown={(ev) => handleResizeStart(ev, "e")}
      ></div>
      <div
        data-resize
        role="presentation"
        class="absolute bottom-1.5 left-0 top-1.5 z-10 w-1 cursor-w-resize touch-none"
        onpointerdown={(ev) => handleResizeStart(ev, "w")}
      ></div>
      <div
        data-resize
        role="presentation"
        class="absolute right-0 top-0 z-10 h-2 w-2 cursor-ne-resize touch-none"
        onpointerdown={(ev) => handleResizeStart(ev, "ne")}
      ></div>
      <div
        data-resize
        role="presentation"
        class="absolute left-0 top-0 z-10 h-2 w-2 cursor-nw-resize touch-none"
        onpointerdown={(ev) => handleResizeStart(ev, "nw")}
      ></div>
      <div
        data-resize
        role="presentation"
        class="absolute bottom-0 right-0 z-10 h-2 w-2 cursor-se-resize touch-none"
        onpointerdown={(ev) => handleResizeStart(ev, "se")}
      ></div>
      <div
        data-resize
        role="presentation"
        class="absolute bottom-0 left-0 z-10 h-2 w-2 cursor-sw-resize touch-none"
        onpointerdown={(ev) => handleResizeStart(ev, "sw")}
      ></div>
    {/if}

    <!-- Header -->
    <div
      class={cn(
        "flex h-6 shrink-0 cursor-grab touch-none select-none items-center justify-between whitespace-nowrap border-b border-border bg-muted/30 px-2 text-xs font-medium text-foreground",
        headerClass,
      )}
      onpointerdown={handleDragStart}
      ondblclick={onheaderdblclick}
      oncontextmenu={onheadercontextmenu
        ? (ev) => {
            ev.preventDefault();
            onheadercontextmenu(ev);
          }
        : undefined}
      role="toolbar"
      tabindex="0"
    >
      {#if header}
        {@render header()}
      {:else}
        <span class="mr-2 flex-1 truncate text-foreground/90">{title}</span>
      {/if}

      <div class="flex items-center gap-1">
        {#if showClose}
          <Button
            class="panel-control size-5 bg-transparent p-0 text-muted-foreground/80 hover:bg-foreground/10 hover:text-foreground"
            data-panel-control
            variant="ghost"
            size="xs"
            onclick={(ev) => {
              ev.stopPropagation();
              panelState.savePosition(panel);
              panelState.hide();
            }}
          >
            <Icon icon="x" size="2xs" />
          </Button>
        {/if}
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto">
      {@render children?.()}
    </div>
  </div>
{/if}
