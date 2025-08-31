<script lang="ts">
  import { onMount } from "svelte";
  import { commandOverlayState, scriptState } from "@game/state.svelte";

  let overlay: HTMLDivElement;
  let listContainer: HTMLDivElement;

  let resizeObserver: ResizeObserver | null = null;

  $effect(() => {
    scriptState.showOverlay = commandOverlayState.isVisible;
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
  }

  function handleContextMenu(ev: MouseEvent) {
    ev.preventDefault();
    commandOverlayState.toggleListVisibility();
    commandOverlayState.savePosition(overlay);
  }

  function handleDoubleClick(ev: MouseEvent) {
    if (
      (ev.target as HTMLElement).classList.contains("command-overlay-control")
    )
      return;

    commandOverlayState.toggleListVisibility();
    commandOverlayState.savePosition(overlay);
  }

  function handleWheel(ev: WheelEvent) {
    const container = listContainer;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const delta = ev.deltaY;

    const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
    const atTop = scrollTop <= 0;

    if (!(delta > 0 && atBottom) && !(delta < 0 && atTop)) ev.stopPropagation();

    setTimeout(() => {
      const activeElement = listContainer.querySelector(
        ".command-item.active",
      ) as HTMLElement;
      if (activeElement) {
        const containerRect = listContainer.getBoundingClientRect();
        const elementRect = activeElement.getBoundingClientRect();

        const isVisible =
          elementRect.top >= containerRect.top &&
          elementRect.bottom <= containerRect.bottom;

        if (!isVisible && window.context?.isRunning?.()) {
          activeElement.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          });
        }
      }
    }, 50);
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
    if (rect.bottom > innerHeight) {
      const newTop = Math.max(minTop, innerHeight - rect.height);
      overlay.style.top = `${newTop}px`;
    }

    // Also ensure overlay is not above the top nav
    if (rect.top < minTop) overlay.style.top = `${minTop}px`;

    commandOverlayState.savePosition(overlay);
  }

  onMount(() => {
    commandOverlayState.loadPosition(overlay);
    // Ensure loaded position doesn't overlap the top nav or fall outside
    // the viewport.
    ensureWithinViewport();

    resizeObserver = new ResizeObserver(() => {
      ensureWithinViewport();
    });
    resizeObserver.observe(document.body);

    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragEnd);

    return () => {
      resizeObserver?.disconnect();

      document.removeEventListener("mouseup", handleDragEnd);
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
        title="Toggle overlay"
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
        title="Hide overlay"
        onclick={(ev) => {
          ev.stopPropagation();
          commandOverlayState.hide();
        }}
        onkeydown={(ev) => {
          if (ev.key === "Enter") {
            ev.preventDefault();
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
    onwheel={handleWheel}
  >
    {#each commandOverlayState.commandStrings as command, index}
      <div
        class="command-item"
        class:active={index === commandOverlayState.lastIndex}
      >
        {command}
      </div>
    {/each}
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
    padding: 8px;
    max-height: 400px;
    overflow-y: auto;
    height: calc(100% - 35px);
    user-select: none;
    scrollbar-width: thin;
    scrollbar-color: #555 #222;
  }
  .command-list-container::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .command-list-container::-webkit-scrollbar-track {
    background: #222;
    border-radius: 4px;
  }
  .command-list-container::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 4px;
  }
  .command-list-container::-webkit-scrollbar-thumb:hover {
    background: #777;
  }
  .command-item {
    padding: 6px 10px;
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
</style>
