<script lang="ts">
  import { onMount, tick } from "svelte";
  import { commandOverlayState, scriptState } from "@game/state.svelte";
  import { VirtualList } from "@vexed/ui";
  import { motionScale, motionFade } from "@vexed/ui/motion";
  import ChevronDown from "lucide-svelte/icons/chevron-down";
  import ChevronRight from "lucide-svelte/icons/chevron-right";
  import X from "lucide-svelte/icons/x";
  import { cn } from "@shared/cn";

  let overlay: HTMLDivElement;
  let listContainer: HTMLDivElement;
  // svelte-ignore non_reactive_update
  let virtualList: VirtualList<string>;

  let resizeObserver: ResizeObserver | null = null;
  let overlayRef: HTMLDivElement | null = null;
  let wasVisible = false;

  $effect(() => {
    scriptState.showOverlay = commandOverlayState.isVisible;
  });

  $effect(() => {
    const isVisible = commandOverlayState.isVisible;
    
    if (isVisible && !wasVisible) {
      tick().then(() => {
        if (overlay) {
          overlayRef = overlay;
          commandOverlayState.loadPosition(overlay);
          tick().then(() => ensureWithinViewport());
        }
      });
    }
    
    if (!isVisible && wasVisible && overlayRef) {
      commandOverlayState.savePosition(overlayRef);
    }
    
    wasVisible = isVisible;
  });

  $effect(() => {
    if (
      commandOverlayState.lastIndex >= 0 &&
      listContainer &&
      commandOverlayState.listVisible &&
      virtualList
    ) {
      scrollActiveItemIntoView();
    }
  });

  function handleDragStart(ev: MouseEvent) {
    if (ev.button !== 0) return;

    if (
      (ev.target as HTMLElement).classList.contains("command-overlay-control")
    )
      return;

    commandOverlayState.setDragging(true);

    const rect = overlay.getBoundingClientRect();
    commandOverlayState.dragOffset = {
      x: ev.clientX - rect.left,
      y: ev.clientY - rect.top,
    };
  }

  function handleDragMove(ev: MouseEvent) {
    if (!commandOverlayState.isDragging) return;

    let x = ev.clientX - commandOverlayState.dragOffset.x;
    let y = ev.clientY - commandOverlayState.dragOffset.y;

    const { width, height } = overlay.getBoundingClientRect();
    const { innerWidth, innerHeight } = window;

    x = Math.max(0, Math.min(x, innerWidth - width));

    const topNav = document.getElementById("topnav-container");
    const topNavBottom = topNav?.getBoundingClientRect().bottom ?? 0;

    const minY = Math.max(0, Math.round(topNavBottom));
    y = Math.max(minY, Math.min(y, innerHeight - height));

    overlay.style.left = `${x}px`;
    overlay.style.top = `${y}px`;

    updateMaxHeightConstraint(y);
  }

  function handleDragEnd() {
    if (!commandOverlayState.isDragging) return;

    commandOverlayState.setDragging(false);

    ensureWithinViewport();
    commandOverlayState.savePosition(overlay);
  }

  function handleToggleVisibility(ev: MouseEvent) {
    ev.stopPropagation();
    commandOverlayState.toggleListVisibility();
    commandOverlayState.savePosition(overlay);
    ensureWithinViewport();
  }

  function handleContextMenu(ev: MouseEvent) {
    ev.preventDefault();
    commandOverlayState.toggleListVisibility();
    commandOverlayState.savePosition(overlay);
    ensureWithinViewport();
  }

  function handleDoubleClick(ev: MouseEvent) {
    if (
      (ev.target as HTMLElement).classList.contains("command-overlay-control")
    )
      return;

    commandOverlayState.toggleListVisibility();
    commandOverlayState.savePosition(overlay);
    ensureWithinViewport();
  }

  function scrollActiveItemIntoView() {
    if (!virtualList || commandOverlayState.lastIndex < 0) return;

    tick().then(() => {
      virtualList!.scrollToIndex(commandOverlayState.lastIndex);
    });
  }

  function handleWheel(ev: WheelEvent) {
    const target = ev.currentTarget as HTMLElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    const delta = ev.deltaY;

    const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
    const atTop = scrollTop <= 0;

    if (!(delta > 0 && atBottom) && !(delta < 0 && atTop)) {
      ev.stopPropagation();
    }
  }

  function getContentMaxHeight() {
    const itemHeight = 30;
    const headerHeight = 36;
    const listVpadding = 8;
    const calculatedHeight =
      commandOverlayState.commandStrings.length * itemHeight +
      headerHeight +
      listVpadding;
    return calculatedHeight + 10;
  }

  function ensureWithinViewport() {
    if (!overlay) return;

    const rect = overlay.getBoundingClientRect();
    const { innerWidth, innerHeight } = window;

    if (rect.right > innerWidth) {
      const newLeft = Math.max(0, innerWidth - rect.width);
      overlay.style.left = `${newLeft}px`;
    }

    const topNav = document.getElementById("topnav-container");
    const topNavBottom = topNav?.getBoundingClientRect().bottom ?? 0;
    const minTop = Math.max(0, Math.round(topNavBottom));

    let newTop = rect.top;
    if (rect.bottom > innerHeight) {
      newTop = Math.max(minTop, innerHeight - rect.height);
      overlay.style.top = `${newTop}px`;
    }

    const available = Math.max(80, innerHeight - Math.max(minTop, newTop) - 8);
    const contentMaxHeight = getContentMaxHeight();
    const finalMaxHeight = Math.min(available, contentMaxHeight);
    overlay.style.maxHeight = `${finalMaxHeight}px`;

    const currentHeight = rect.height;
    if (currentHeight > finalMaxHeight) {
      overlay.style.height = `${finalMaxHeight}px`;
    }

    commandOverlayState.savePosition(overlay);
  }

  function updateMaxHeightConstraint(topOverride?: number) {
    if (!overlay) return;
    const { innerHeight } = window;
    const rect = overlay.getBoundingClientRect();
    const topNav = document.getElementById("topnav-container");
    const topNavBottom = topNav?.getBoundingClientRect().bottom ?? 0;
    const minTop = Math.max(0, Math.round(topNavBottom));
    const top = topOverride ?? rect.top;
    const available = Math.max(80, innerHeight - Math.max(minTop, top) - 8);
    const contentMaxHeight = getContentMaxHeight();
    const finalMaxHeight = Math.min(available, contentMaxHeight);
    overlay.style.maxHeight = `${finalMaxHeight}px`;
    if (rect.height > finalMaxHeight) {
      overlay.style.height = `${finalMaxHeight}px`;
    }
  }

  $effect(() => {
    if (!overlay) return;

    resizeObserver = new ResizeObserver(() => ensureWithinViewport());
    resizeObserver.observe(overlay);

    return () => {
      resizeObserver?.disconnect();
      resizeObserver = null;
    };
  });

  $effect(() => {
    if (!listContainer) return;

    listContainer.addEventListener("wheel", handleWheel, { passive: true });

    return () => {
      listContainer.removeEventListener("wheel", handleWheel);
    };
  });

  onMount(() => {
    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("resize", ensureWithinViewport);

    return () => {
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("resize", ensureWithinViewport);
    };
  });
</script>

{#if commandOverlayState.isVisible}
  <div
    bind:this={overlay}
    id="command-overlay"
    class={cn(
      "command-overlay",
      !commandOverlayState.listVisible && "collapsed",
      commandOverlayState.isDragging && "dragging"
    )}
    in:motionScale={{ duration: 120, start: 0.96, opacity: 0 }}
    out:motionFade={{ duration: 80 }}
  >
    <div
      class="command-overlay-header"
      onmousedown={handleDragStart}
      oncontextmenu={handleContextMenu}
      ondblclick={handleDoubleClick}
      role="toolbar"
      tabindex="0"
    >
      <span class="command-overlay-header-text">
        {commandOverlayState.headerText}
      </span>

      <div class="command-overlay-header-controls">
        <button
          class="command-overlay-control"
          onclick={handleToggleVisibility}
          aria-label={commandOverlayState.listVisible ? "Collapse" : "Expand"}
        >
          {#if commandOverlayState.listVisible}
            <ChevronDown class="size-3.5" />
          {:else}
            <ChevronRight class="size-3.5" />
          {/if}
        </button>

        <button
          class="command-overlay-control command-overlay-close"
          onclick={(ev) => {
            ev.stopPropagation();
            commandOverlayState.savePosition(overlay);
            commandOverlayState.hide();
          }}
          aria-label="Close"
        >
          <X class="size-3" />
        </button>
      </div>
    </div>

    {#if commandOverlayState.listVisible}
      <div
        bind:this={listContainer}
        class="command-list-container"
      >
        {#if commandOverlayState.commandStrings.length > 0}
          <VirtualList
            bind:this={virtualList}
            data={commandOverlayState.commandStrings}
            key={(_item: string, index: number) => `command-${index}`}
            smoothScroll={true}
            overflow={0}
          >
            {#snippet children({
              data: command,
              index,
            }: {
              data: string;
              index: number;
            })}
              <div
                class={cn(
                  "command-item",
                  index === commandOverlayState.lastIndex && "active"
                )}
              >
                {command}
              </div>
            {/snippet}
          </VirtualList>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .command-overlay {
    position: fixed;
    top: 40px;
    left: 20px;
    background-color: rgb(var(--popover));
    border: 1px solid rgb(var(--border));
    border-radius: 10px;
    padding: 0;
    min-width: 260px;
    width: 320px;
    z-index: 9999;
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.15),
      0 0 1px rgba(0, 0, 0, 0.05);
    resize: both;
    overflow: hidden;
    min-height: 40px;
    max-height: calc(100vh - 16px);
    box-sizing: border-box;
    user-select: none;
    transition: box-shadow 0.12s ease;
  }

  .command-overlay:hover {
    box-shadow:
      0 6px 16px rgba(0, 0, 0, 0.2),
      0 0 1px rgba(0, 0, 0, 0.08);
  }

  .command-overlay.collapsed {
    resize: none;
    overflow: visible;
    min-width: auto;
    width: auto !important;
    height: auto !important;
    min-height: 0;
  }

  .command-overlay.dragging {
    cursor: grabbing;
    user-select: none;
    opacity: 0.95;
  }

  .command-overlay-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, rgba(106, 118, 222, 0.12) 0%, rgb(var(--muted)) 100%);
    padding: 8px 12px;
    cursor: grab;
    color: rgb(var(--foreground));
    border-bottom: 1px solid rgb(var(--border));
    border-radius: 10px 10px 0 0;
    user-select: none;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 500;
    height: 20px;
  }

  .command-overlay-header-text {
    flex: 1;
    margin-right: 8px;
    color: rgb(var(--foreground));
  }

  .command-overlay-header-controls {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .command-overlay-control {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgb(var(--muted-foreground));
    border-radius: 4px;
    border: none;
    background: transparent;
    transition:
      background-color 0.12s ease,
      color 0.12s ease;
  }

  .command-overlay-control:hover {
    color: rgb(var(--foreground));
    background-color: rgb(var(--accent));
  }

  .command-overlay-close:hover {
    color: rgb(var(--destructive));
    background-color: rgb(var(--accent));
  }

  .command-overlay.collapsed .command-overlay-header {
    border-radius: 10px;
    border-bottom: none;
  }

  .command-list-container {
    color: rgb(var(--foreground));
    height: calc(100% - 36px);
    user-select: none;
    scrollbar-width: none;
  }

  .command-list-container :global(.virtual-scroll-root) {
    box-sizing: border-box;
    padding: 4px 6px;
  }

  .command-list-container :global(*) {
    scrollbar-width: none;
  }

  .command-list-container :global(*::-webkit-scrollbar) {
    width: 0;
    height: 0;
    background: transparent;
  }

  .command-item {
    padding: 6px 10px;
    font-size: 11px;
    font-family: "SF Mono", "Monaco", "Menlo", "Consolas", monospace;
    cursor: default;
    user-select: none;
    background-color: transparent;
    margin-bottom: 2px;
    border-radius: 6px;
    border-left: 3px solid transparent;
    transition: background-color 0.1s ease, border-color 0.1s ease;
    display: flex;
    align-items: center;
    color: rgb(var(--foreground));
  }

  .command-item.active {
    background-color: rgb(var(--accent));
    border-left-color: rgb(var(--primary));
    color: rgb(var(--foreground));
  }

  .command-item:hover:not(.active) {
    background-color: rgb(var(--muted));
  }

  :global(.virtual-scroll-root) {
    height: 100% !important;
  }
</style>
