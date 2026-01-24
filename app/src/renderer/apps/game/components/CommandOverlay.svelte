<script lang="ts">
  import { tick } from "svelte";
  import { VirtualList } from "@vexed/ui";
  import ChevronDown from "@vexed/ui/icons/ChevronDown";
  import ChevronRight from "@vexed/ui/icons/ChevronRight";

  import { commandOverlayState, scriptState } from "~/game/state.svelte";
  import type { CommandItem } from "~/game/state.svelte";

  import { cn } from "~/shared/cn";
  import FloatingPanel from "./FloatingPanel.svelte";

  // svelte-ignore non_reactive_update
  let virtualList: VirtualList<CommandItem>;

  $effect(() => {
    scriptState.showOverlay = commandOverlayState.isVisible;
  });

  $effect(() => {
    if (
      commandOverlayState.lastIndex >= 0 &&
      commandOverlayState.listVisible &&
      virtualList
    ) {
      scrollActiveItemIntoView();
    }
  });

  function handleToggleVisibility(ev: MouseEvent) {
    ev.stopPropagation();
    commandOverlayState.toggleListVisibility();
  }

  function handleContextMenu() {
    commandOverlayState.toggleListVisibility();
  }

  function handleDoubleClick(ev: MouseEvent) {
    if (
      (ev.target as HTMLElement).closest(".command-overlay-control")
    )
      return;

    commandOverlayState.toggleListVisibility();
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
</script>

<FloatingPanel
  panelState={commandOverlayState}
  class={cn(
    "command-overlay !min-h-0",
    !commandOverlayState.listVisible && "collapsed"
  )}
  headerClass="command-overlay-header"
  canResize={commandOverlayState.listVisible}
  onheaderdblclick={handleDoubleClick}
  onheadercontextmenu={handleContextMenu}
>
  {#snippet header()}
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
    </div>
  {/snippet}

  {#if commandOverlayState.listVisible}
    <div
      class="command-list-container"
      onwheel={handleWheel}
      role="presentation"
    >
      {#if commandOverlayState.commandItems.length > 0}
        <VirtualList
          bind:this={virtualList}
          data={commandOverlayState.commandItems}
          key={(_item, index: number) => `command-${index}`}
          smoothScroll={true}
          overflow={0}
        >
          {#snippet children({
            data: command,
            index,
          }: {
            data: { index: string; text: string };
            index: number;
          })}
            <div
              class={cn(
                "command-item",
                index === commandOverlayState.lastIndex && "active"
              )}
            >
              <span class="command-index">{command.index}</span>
              <span class="command-text">{command.text}</span>
            </div>
          {/snippet}
        </VirtualList>
      {/if}
    </div>
  {/if}
</FloatingPanel>

<style>
  :global(.command-overlay) {
    min-width: 260px !important;
    width: 320px;
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.15),
      0 0 1px rgba(0, 0, 0, 0.05) !important;
    transition: box-shadow 0.12s ease;
  }

  :global(.command-overlay:hover) {
    box-shadow:
      0 6px 16px rgba(0, 0, 0, 0.2),
      0 0 1px rgba(0, 0, 0, 0.08) !important;
  }

  :global(.command-overlay.collapsed) {
    min-width: auto !important;
    width: auto !important;
    height: auto !important;
  }

  :global(.command-overlay > .p-3) {
    padding: 0 !important;
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
    margin-right: 4px;
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

  .command-list-container {
    color: rgb(var(--foreground));
    height: 100%;
    user-select: none;
  }

  .command-list-container :global(.virtual-scroll-root) {
    box-sizing: border-box;
    padding: 4px 6px;
  }

  .command-item {
    padding: 2px 10px;
    height: 24px;
    font-size: 11px;
    cursor: default;
    user-select: none;
    background-color: rgb(var(--muted) / 0.5);
    margin-bottom: 2px;
    border-radius: 6px;
    border-left: 3px solid transparent;
    transition:
      background-color 0.1s ease,
      border-color 0.1s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    color: rgb(var(--foreground));
  }

  .command-index {
    font-family: "SF Mono", "Monaco", "Menlo", "Consolas", monospace;
    color: rgb(var(--muted-foreground));
    font-size: 10px;
    flex-shrink: 0;
  }

  .command-text {
    font-family: inherit;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
