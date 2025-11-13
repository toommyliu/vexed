<script lang="ts">
  import { onMount, tick } from "svelte";
  import { commandOverlayState, scriptState } from "@game/state.svelte";
  import { VirtualList } from "@vexed/ui";

  let overlay: HTMLDivElement;
  let listContainer: HTMLDivElement;
  // svelte-ignore non_reactive_update
  let virtualList: VirtualList<string>;

  let resizeObserver: ResizeObserver | null = null;

  $effect(() => {
    scriptState.showOverlay = commandOverlayState.isVisible;
  });

  $effect(() => {
    if (overlay) {
      if (commandOverlayState.isVisible) {
        commandOverlayState.loadPosition(overlay);
        tick().then(() => {
          ensureWithinViewport();
        });
      } else {
        commandOverlayState.savePosition(overlay);
      }
    }
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
    // If not left mouse button
    if (ev.button !== 0) return;

    // If the target is a control element, ignore
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

    // Prevent overlay from being dragged off-screen horizontally
    x = Math.max(0, Math.min(x, innerWidth - width));

    const topNav = document.getElementById("topnav-container");
    const topNavBottom = topNav?.getBoundingClientRect().bottom ?? 0;

    // Ensure the overlay's top is at or below the top nav bottom, and does not
    // overflow the viewport at the bottom.
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
    const itemHeight = 31; // 28px command-item height + 3px margin
    const headerHeight = 35;
    const listVpadding = 10; // 6px top + 4px bottom
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

    // If overlay is outside viewport horizontally
    if (rect.right > innerWidth) {
      const newLeft = Math.max(0, innerWidth - rect.width);
      overlay.style.left = `${newLeft}px`;
    }

    // Determine topnav bottom to prevent overlapping
    const topNav = document.getElementById("topnav-container");
    const topNavBottom = topNav?.getBoundingClientRect().bottom ?? 0;
    const minTop = Math.max(0, Math.round(topNavBottom));

    // If overlay is outside viewport vertically
    let newTop = rect.top;
    if (rect.bottom > innerHeight) {
      newTop = Math.max(minTop, innerHeight - rect.height);
      overlay.style.top = `${newTop}px`;
    }

    // Constrain the max-height so the bottom (and resize handle) stays reachable
    const available = Math.max(80, innerHeight - Math.max(minTop, newTop) - 8);
    const contentMaxHeight = getContentMaxHeight();
    const finalMaxHeight = Math.min(available, contentMaxHeight);
    overlay.style.maxHeight = `${finalMaxHeight}px`;

    // If we currently exceed available space, clamp height to available
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

  onMount(() => {
    if (listContainer)
      listContainer.addEventListener("wheel", handleWheel, { passive: true });

    resizeObserver = new ResizeObserver(() => ensureWithinViewport());
    resizeObserver.observe(overlay);

    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("resize", ensureWithinViewport);

    return () => {
      resizeObserver?.disconnect();

      if (listContainer)
        listContainer.removeEventListener("wheel", handleWheel);

      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("resize", ensureWithinViewport);
    };
  });
</script>

<div
  bind:this={overlay}
  id="command-overlay"
  class="command-overlay"
  class:collapsed={!commandOverlayState.listVisible}
  class:dragging={commandOverlayState.isDragging}
  style:display={commandOverlayState.isVisible ? "block" : "none"}
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
      <div
        class="command-overlay-control"
        onclick={handleToggleVisibility}
        onkeydown={(ev) => {
          if (ev.key === "Enter") {
            ev.preventDefault();
            commandOverlayState.toggle();
          }
        }}
        role="button"
        tabindex="0"
      >
        {commandOverlayState.toggleButtonText}
      </div>

      <div
        class="command-overlay-control command-overlay-close"
        onclick={(ev) => {
          ev.stopPropagation();
          commandOverlayState.savePosition(overlay);
          commandOverlayState.hide();
        }}
        onkeydown={(ev) => {
          if (ev.key === "Enter") {
            ev.preventDefault();
            commandOverlayState.savePosition(overlay);
            commandOverlayState.hide();
          }
        }}
        role="button"
        tabindex="0"
      >
        &#x2715;
      </div>
    </div>
  </div>

  <div
    bind:this={listContainer}
    class="command-list-container"
    style:display={commandOverlayState.listVisible ? "block" : "none"}
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
            class="command-item"
            class:active={index === commandOverlayState.lastIndex}
          >
            {command}
          </div>
        {/snippet}
      </VirtualList>
    {/if}
  </div>
</div>

<style>
  .command-overlay {
    position: fixed;
    background-color: #1a1a1a;
    border: 1px solid #333;
    border-radius: 6px;
    padding: 0;
    min-width: 250px;
    width: 300px;
    display: none;
    opacity: 0.97;
    z-index: 9999;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    resize: both;
    overflow: hidden;
    min-height: 40px;
    max-height: calc(100vh - 16px);
    box-sizing: border-box;
    user-select: none;
    transition:
      opacity 0.2s ease,
      box-shadow 0.2s ease;
  }

  .command-overlay:hover {
    opacity: 0.99;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }

  .command-overlay.collapsed {
    resize: none;
    overflow: visible;
    min-width: auto;
    width: auto !important;
    height: auto !important;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    min-height: 0;
  }

  .command-overlay.dragging {
    cursor: grabbing;
    user-select: none;
    opacity: 0.8;
  }

  .command-overlay-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(to bottom, #36393f, #2a2a2a);
    padding: 8px 10px;
    cursor: grab;
    color: #eee;
    border-bottom: 1px solid #444;
    border-radius: 6px 6px 0 0;
    user-select: none;
    white-space: nowrap;
    font-size: 13px;
    height: 18px;
  }

  .command-overlay-header-text {
    flex: 1;
    margin-right: 8px;
  }

  .command-overlay-header-controls {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .command-overlay-control {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0.7;
    font-size: 14px;
    border-radius: 3px;
    transition:
      background-color 0.2s ease,
      opacity 0.2s ease;
  }

  .command-overlay-control:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.1);
  }

  .command-overlay-close {
    color: #f55;
  }

  .command-overlay-close:hover {
    background-color: rgba(255, 85, 85, 0.2);
  }

  .command-overlay.collapsed .command-overlay-header {
    border-radius: 6px;
    border-bottom: none;
  }

  .command-list-container {
    color: white;
    height: calc(100% - 35px);
    user-select: none;
    scrollbar-width: none;
  }
  .command-list-container :global(.virtual-scroll-root) {
    box-sizing: border-box;
    padding: 6px 6px 4px 8px;
  }
  .command-list-container :global(*) {
    scrollbar-width: none;
  }
  .command-list-container :global(*::-webkit-scrollbar) {
    width: 0;
    height: 0;
    background: transparent;
  }
  .command-list-container :global(*::-webkit-scrollbar-track) {
    background: transparent;
  }
  .command-list-container :global(*::-webkit-scrollbar-thumb) {
    background: transparent;
  }

  .command-item {
    padding: 6px 10px 6px 10px;
    font-size: 13px;
    cursor: default;
    user-select: none;
    background-color: #222;
    margin-bottom: 3px;
    border-radius: 4px;
    border-left: 3px solid transparent;
    transition:
      background-color 0.15s ease,
      border-left-color 0.15s ease;
    display: flex;
    align-items: center;
  }
  .command-item.active {
    background-color: #1a3a5a;
    border-left-color: #3a8ee6;
    font-weight: 500;
  }
  .command-item:hover {
    background-color: #333;
  }

  :global(.virtual-scroll-root) {
    height: 100% !important;
  }
</style>
