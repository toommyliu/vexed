<script lang="ts">
  import { motionScale, motionFade } from "@vexed/ui/motion";
  import { cn } from "@vexed/ui/util";
  import X from "@vexed/ui/icons/X";

  import { onMount, tick } from "svelte";
  import type { Snippet } from "svelte";

  type PanelState = {
    isVisible: boolean;
    isDragging: boolean;
    dragOffset: { x: number; y: number };
    show: () => void;
    hide: () => void;
    toggle: () => void;
    setDragging: (dragging: boolean) => void;
    savePosition: (panel: HTMLDivElement) => void;
    loadPosition: (panel: HTMLDivElement) => void;
  };

  type ResizeDirection =
    | "n"
    | "s"
    | "e"
    | "w"
    | "ne"
    | "nw"
    | "se"
    | "sw"
    | null;

  type Props = {
    title?: string;
    panelState: PanelState;
    minWidth?: number;
    minHeight?: number;
    defaultWidth?: number;
    class?: string;
    headerClass?: string;
    showClose?: boolean;
    canResize?: boolean;
    onheaderdblclick?: (ev: MouseEvent) => void;
    onheadercontextmenu?: (ev: MouseEvent) => void;
    header?: Snippet;
    children?: Snippet;
  };

  let {
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

  let resizeDirection = $state<ResizeDirection>(null);
  let resizeStart = { x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 };

  let topNav: HTMLElement | null = null;
  let cachedBoundingRect: DOMRect | null = null;
  let frameId: number | null = null;

  $effect(() => {
    const isVisible = panelState.isVisible;

    if (isVisible && !wasVisible) {
      tick().then(() => {
        if (panel) {
          panelRef = panel;
          panelState.loadPosition(panel);
          tick().then(() => ensureWithinViewport());
        }
      });
    }

    if (!isVisible && wasVisible && panelRef) {
      panelState.savePosition(panelRef);
    }

    wasVisible = isVisible;
  });

  function handleDragStart(ev: MouseEvent) {
    if (ev.button !== 0) return;
    if ((ev.target as HTMLElement).closest(".panel-control")) return;
    if ((ev.target as HTMLElement).closest("[data-resize]")) return;

    panelState.setDragging(true);

    cachedBoundingRect = panel.getBoundingClientRect();
    panelState.dragOffset = {
      x: ev.clientX - cachedBoundingRect.left,
      y: ev.clientY - cachedBoundingRect.top,
    };
  }

  function handleDragMove(ev: MouseEvent) {
    if (resizeDirection) {
      handleResizeMove(ev);
      return;
    }

    if (!panelState.isDragging || !panel) return;

    if (frameId) cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(() => {
      let x = ev.clientX - panelState.dragOffset.x;
      let y = ev.clientY - panelState.dragOffset.y;

      const { width, height } =
        cachedBoundingRect || panel.getBoundingClientRect();
      const { innerWidth, innerHeight } = window;

      const topNavBottom = topNav?.getBoundingClientRect().bottom ?? 0;
      const minY = Math.max(0, Math.round(topNavBottom));

      x = Math.max(0, Math.min(x, innerWidth - width));
      y = Math.max(minY, Math.min(y, innerHeight - height));

      panel.style.left = `${x}px`;
      panel.style.top = `${y}px`;
    });
  }

  function handleDragEnd() {
    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }

    if (resizeDirection) {
      resizeDirection = null;
      panelState.savePosition(panel);
      return;
    }

    if (!panelState.isDragging) return;

    panelState.setDragging(false);
    ensureWithinViewport();
    panelState.savePosition(panel);
    cachedBoundingRect = null;
  }

  function handleResizeStart(ev: MouseEvent, direction: ResizeDirection) {
    if (ev.button !== 0) return;
    ev.stopPropagation();

    resizeDirection = direction;
    const rect = panel.getBoundingClientRect();
    resizeStart = {
      x: ev.clientX,
      y: ev.clientY,
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top,
    };
  }

  function handleResizeMove(ev: MouseEvent) {
    if (!resizeDirection || !panel) return;

    const currentDirection = resizeDirection;
    if (frameId) cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(() => {
      const { innerWidth, innerHeight } = window;
      const deltaX = ev.clientX - resizeStart.x;
      const deltaY = ev.clientY - resizeStart.y;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newLeft = resizeStart.left;
      let newTop = resizeStart.top;

      const topNavBottom = topNav?.getBoundingClientRect().bottom ?? 0;
      const minTop = Math.max(0, Math.round(topNavBottom));

      if (currentDirection.includes("e")) {
        const maxWidth = innerWidth - newLeft;
        newWidth = Math.min(
          maxWidth,
          Math.max(minWidth, resizeStart.width + deltaX),
        );
      }

      if (currentDirection.includes("w")) {
        const potentialLeft = resizeStart.left + deltaX;
        const clampedLeft = Math.max(0, potentialLeft);
        const potentialWidth =
          resizeStart.width + (resizeStart.left - clampedLeft);
        if (potentialWidth >= minWidth) {
          newWidth = potentialWidth;
          newLeft = clampedLeft;
        }
      }

      if (currentDirection.includes("s")) {
        const maxHeight = innerHeight - newTop;
        newHeight = Math.min(
          maxHeight,
          Math.max(minHeight, resizeStart.height + deltaY),
        );
      }

      if (currentDirection.includes("n")) {
        const potentialTop = resizeStart.top + deltaY;
        const clampedTop = Math.max(minTop, potentialTop);
        const potentialHeight =
          resizeStart.height + (resizeStart.top - clampedTop);
        if (potentialHeight >= minHeight) {
          newHeight = potentialHeight;
          newTop = clampedTop;
        }
      }

      panel.style.width = `${newWidth}px`;
      panel.style.height = `${newHeight}px`;
      panel.style.left = `${newLeft}px`;
      panel.style.top = `${newTop}px`;
    });
  }

  function ensureWithinViewport() {
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    const { innerWidth, innerHeight } = window;

    const topNavBottom = topNav?.getBoundingClientRect().bottom ?? 0;
    const minTop = Math.max(0, Math.round(topNavBottom));

    let newLeft = rect.left;
    let newTop = rect.top;
    let newWidth = rect.width;
    let newHeight = rect.height;

    if (newLeft < 0) newLeft = 0;
    if (newTop < minTop) newTop = minTop;

    const maxWidth = innerWidth - newLeft;
    const maxHeight = innerHeight - newTop;

    if (newWidth > maxWidth) {
      newWidth = Math.max(minWidth, maxWidth);
      if (newWidth > maxWidth) {
        newLeft = Math.max(0, innerWidth - newWidth);
      }
    }

    if (newHeight > maxHeight) {
      newHeight = Math.max(minHeight, maxHeight);
      if (newHeight > maxHeight) {
        newTop = Math.max(minTop, innerHeight - newHeight);
      }
    }

    if (newLeft + newWidth > innerWidth) {
      newLeft = Math.max(0, innerWidth - newWidth);
    }

    if (newTop + newHeight > innerHeight) {
      newTop = Math.max(minTop, innerHeight - newHeight);
    }

    panel.style.left = `${newLeft}px`;
    panel.style.top = `${newTop}px`;
    panel.style.width = `${newWidth}px`;
    panel.style.height = `${newHeight}px`;

    panelState.savePosition(panel);
  }

  onMount(() => {
    topNav = document.getElementById("topnav-container");
    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("resize", ensureWithinViewport);

    return () => {
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("resize", ensureWithinViewport);
      if (frameId) cancelAnimationFrame(frameId);
    };
  });
</script>

{#if panelState.isVisible}
  <div
    bind:this={panel}
    class={cn(
      "fixed left-5 top-10 z-[9999] flex min-h-[160px] min-w-[280px] select-none flex-col overflow-hidden rounded-[10px] border border-border bg-popover shadow-lg",
      panelState.isDragging && "cursor-grabbing opacity-95",
      resizeDirection && "opacity-95",
      className,
    )}
    style="width: {defaultWidth}px;"
    in:motionScale={{ duration: 120, start: 0.96, opacity: 0 }}
    out:motionFade={{ duration: 80 }}
  >
    {#if canResize}
      <!-- Resize handles -->
      <div
        data-resize
        role="presentation"
        class="absolute left-1.5 right-1.5 top-0 z-10 h-1 cursor-n-resize"
        onmousedown={(ev) => handleResizeStart(ev, "n")}
      ></div>
      <div
        data-resize
        role="presentation"
        class="absolute bottom-0 left-1.5 right-1.5 z-10 h-1 cursor-s-resize"
        onmousedown={(ev) => handleResizeStart(ev, "s")}
      ></div>
      <div
        data-resize
        role="presentation"
        class="absolute bottom-1.5 right-0 top-1.5 z-10 w-1 cursor-e-resize"
        onmousedown={(ev) => handleResizeStart(ev, "e")}
      ></div>
      <div
        data-resize
        role="presentation"
        class="absolute bottom-1.5 left-0 top-1.5 z-10 w-1 cursor-w-resize"
        onmousedown={(ev) => handleResizeStart(ev, "w")}
      ></div>
      <div
        data-resize
        role="presentation"
        class="absolute right-0 top-0 z-10 h-2 w-2 cursor-ne-resize"
        onmousedown={(ev) => handleResizeStart(ev, "ne")}
      ></div>
      <div
        data-resize
        role="presentation"
        class="absolute left-0 top-0 z-10 h-2 w-2 cursor-nw-resize"
        onmousedown={(ev) => handleResizeStart(ev, "nw")}
      ></div>
      <div
        data-resize
        role="presentation"
        class="absolute bottom-0 right-0 z-10 h-2 w-2 cursor-se-resize"
        onmousedown={(ev) => handleResizeStart(ev, "se")}
      ></div>
      <div
        data-resize
        role="presentation"
        class="absolute bottom-0 left-0 z-10 h-2 w-2 cursor-sw-resize"
        onmousedown={(ev) => handleResizeStart(ev, "sw")}
      ></div>
    {/if}

    <!-- Header -->
    <div
      class={cn(
        "flex h-5 shrink-0 cursor-grab select-none items-center justify-between whitespace-nowrap rounded-t-[10px] border-b border-border bg-gradient-to-br from-primary/10 to-muted px-3 py-2 text-xs font-medium text-foreground",
        headerClass,
      )}
      onmousedown={handleDragStart}
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
        <span class="mr-2 flex-1 text-foreground">{title}</span>
      {/if}

      <div class="flex items-center gap-1">
        {#if showClose}
          <button
            class="panel-control flex h-5 w-5 cursor-pointer items-center justify-center rounded border-none bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
            onclick={(ev) => {
              ev.stopPropagation();
              panelState.savePosition(panel);
              panelState.hide();
            }}
            aria-label="Close"
          >
            <X class="size-3" />
          </button>
        {/if}
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-3">
      {@render children?.()}
    </div>
  </div>
{/if}
