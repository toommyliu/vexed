<script lang="ts">
  import { onMount, tick, untrack } from "svelte";
  import { gameState, optionsPanelState } from "~/game/state.svelte";
  import { Checkbox, Input, Label } from "@vexed/ui";
  import Kbd from "@vexed/ui/Kbd";
  import * as NumberField from "@vexed/ui/NumberField";
  import { motionScale, motionFade } from "@vexed/ui/motion";
  import X from "lucide-svelte/icons/x";
  import { cn } from "~/shared/cn";
  import { Bot } from "~/game/lib/Bot";

  const bot = Bot.getInstance();

  // svelte-ignore non_reactive_update
  let panel: HTMLDivElement;
  let panelRef: HTMLDivElement | null = null;
  let wasVisible = false;

  let customName = $state("");
  let customGuild = $state("");

  let nameDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const name = customName;
    untrack(() => {
      if (nameDebounceTimer) clearTimeout(nameDebounceTimer);
      nameDebounceTimer = setTimeout(() => {
        bot.settings.customName = name || null;
      }, 300);
    });
    return () => {
      if (nameDebounceTimer) clearTimeout(nameDebounceTimer);
    };
  });

  let guildDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const guild = customGuild;
    untrack(() => {
      if (guildDebounceTimer) clearTimeout(guildDebounceTimer);
      guildDebounceTimer = setTimeout(() => {
        bot.settings.customGuild = guild || null;
      }, 300);
    });
    return () => {
      if (guildDebounceTimer) clearTimeout(guildDebounceTimer);
    };
  });

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
  let resizeDirection = $state<ResizeDirection>(null);
  let resizeStart = { x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 };

  const MIN_WIDTH = 320;
  const MIN_HEIGHT = 160;

  type Props = {
    hotkeyValues: Record<string, string>;
  };

  let { hotkeyValues }: Props = $props();

  const options = [
    { key: "infiniteRange", label: "Infinite Range", hotkeyId: "toggle-infinite-range" },
    { key: "provokeCell", label: "Provoke Cell", hotkeyId: "toggle-provoke-cell" },
    { key: "enemyMagnet", label: "Enemy Magnet", hotkeyId: "toggle-enemy-magnet" },
    { key: "lagKiller", label: "Lag Killer", hotkeyId: "toggle-lag-killer" },
    { key: "hidePlayers", label: "Hide Players", hotkeyId: "toggle-hide-players" },
    { key: "skipCutscenes", label: "Skip Cutscenes", hotkeyId: "toggle-skip-cutscenes" },
    { key: "disableFx", label: "Disable FX", hotkeyId: "toggle-disable-fx" },
    { key: "disableCollisions", label: "Disable Collisions", hotkeyId: "toggle-disable-collisions" },
    { key: "counterAttack", label: "Anti-Counter", hotkeyId: "toggle-anti-counter" },
    { key: "disableDeathAds", label: "Disable Death Ads", hotkeyId: "toggle-disable-death-ads" },
  ] as const;

  $effect(() => {
    const isVisible = optionsPanelState.isVisible;

    if (isVisible && !wasVisible) {
      tick().then(() => {
        if (panel) {
          panelRef = panel;
          optionsPanelState.loadPosition(panel);
          tick().then(() => ensureWithinViewport());
        }
      });
    }

    if (!isVisible && wasVisible && panelRef) {
      optionsPanelState.savePosition(panelRef);
    }

    wasVisible = isVisible;
  });

  function handleDragStart(ev: MouseEvent) {
    if (ev.button !== 0) return;
    if ((ev.target as HTMLElement).closest(".panel-control")) return;
    if ((ev.target as HTMLElement).closest(".resize-handle")) return;

    optionsPanelState.setDragging(true);

    const rect = panel.getBoundingClientRect();
    optionsPanelState.dragOffset = {
      x: ev.clientX - rect.left,
      y: ev.clientY - rect.top,
    };
  }

  function handleDragMove(ev: MouseEvent) {
    if (resizeDirection) {
      handleResizeMove(ev);
      return;
    }

    if (!optionsPanelState.isDragging) return;

    let x = ev.clientX - optionsPanelState.dragOffset.x;
    let y = ev.clientY - optionsPanelState.dragOffset.y;

    const { width, height } = panel.getBoundingClientRect();
    const { innerWidth, innerHeight } = window;

    x = Math.max(0, Math.min(x, innerWidth - width));

    const topNav = document.querySelector("#topnav-container");
    const topNavBottom = topNav?.getBoundingClientRect().bottom ?? 0;
    const minY = Math.max(0, Math.round(topNavBottom));
    y = Math.max(minY, Math.min(y, innerHeight - height));

    panel.style.left = `${x}px`;
    panel.style.top = `${y}px`;
  }

  function handleDragEnd() {
    if (resizeDirection) {
      resizeDirection = null;
      optionsPanelState.savePosition(panel);
      return;
    }

    if (!optionsPanelState.isDragging) return;

    optionsPanelState.setDragging(false);
    ensureWithinViewport();
    optionsPanelState.savePosition(panel);
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
    if (!resizeDirection) return;

    const { innerWidth, innerHeight } = window;
    const deltaX = ev.clientX - resizeStart.x;
    const deltaY = ev.clientY - resizeStart.y;

    let newWidth = resizeStart.width;
    let newHeight = resizeStart.height;
    let newLeft = resizeStart.left;
    let newTop = resizeStart.top;

    const topNav = document.getElementById("topnav-container");
    const topNavBottom = topNav?.getBoundingClientRect().bottom ?? 0;
    const minTop = Math.max(0, Math.round(topNavBottom));

    if (resizeDirection.includes("e")) {
      const maxWidth = innerWidth - newLeft;
      newWidth = Math.min(maxWidth, Math.max(MIN_WIDTH, resizeStart.width + deltaX));
    }

    if (resizeDirection.includes("w")) {
      const potentialLeft = resizeStart.left + deltaX;
      const clampedLeft = Math.max(0, potentialLeft);
      const potentialWidth = resizeStart.width + (resizeStart.left - clampedLeft);
      if (potentialWidth >= MIN_WIDTH) {
        newWidth = potentialWidth;
        newLeft = clampedLeft;
      }
    }

    if (resizeDirection.includes("s")) {
      const maxHeight = innerHeight - newTop;
      newHeight = Math.min(maxHeight, Math.max(MIN_HEIGHT, resizeStart.height + deltaY));
    }

    if (resizeDirection.includes("n")) {
      const potentialTop = resizeStart.top + deltaY;
      const clampedTop = Math.max(minTop, potentialTop);
      const potentialHeight = resizeStart.height + (resizeStart.top - clampedTop);
      if (potentialHeight >= MIN_HEIGHT) {
        newHeight = potentialHeight;
        newTop = clampedTop;
      }
    }

    panel.style.width = `${newWidth}px`;
    panel.style.height = `${newHeight}px`;
    panel.style.left = `${newLeft}px`;
    panel.style.top = `${newTop}px`;
  }

  function ensureWithinViewport() {
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    const { innerWidth, innerHeight } = window;

    const topNav = document.getElementById("topnav-container");
    const topNavBottom = topNav?.getBoundingClientRect().bottom ?? 0;
    const minTop = Math.max(0, Math.round(topNavBottom));

    let newLeft = rect.left;
    let newTop = rect.top;
    let newWidth = rect.width;
    let newHeight = rect.height;

    // clamp position
    if (newLeft < 0) newLeft = 0;
    if (newTop < minTop) newTop = minTop;
    
    // clamp dimensions
    const maxWidth = innerWidth - newLeft;
    const maxHeight = innerHeight - newTop;

    if (newWidth > maxWidth) {
      newWidth = Math.max(MIN_WIDTH, maxWidth);
      if (newWidth > maxWidth) {
        newLeft = Math.max(0, innerWidth - newWidth);
      }
    }

    if (newHeight > maxHeight) {
      newHeight = Math.max(MIN_HEIGHT, maxHeight);
      if (newHeight > maxHeight) {
        newTop = Math.max(minTop, innerHeight - newHeight);
      }
    }

    // ensure right edge doesn't exceed viewport
    if (newLeft + newWidth > innerWidth) {
      newLeft = Math.max(0, innerWidth - newWidth);
    }

    // ensure bottom edge doesn't exceed viewport
    if (newTop + newHeight > innerHeight) {
      newTop = Math.max(minTop, innerHeight - newHeight);
    }

    panel.style.left = `${newLeft}px`;
    panel.style.top = `${newTop}px`;
    panel.style.width = `${newWidth}px`;
    panel.style.height = `${newHeight}px`;

    optionsPanelState.savePosition(panel);
  }

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

{#if optionsPanelState.isVisible}
  <div
    bind:this={panel}
    class={cn(
      "options-panel",
      optionsPanelState.isDragging && "dragging",
      resizeDirection && "resizing"
    )}
    in:motionScale={{ duration: 120, start: 0.96, opacity: 0 }}
    out:motionFade={{ duration: 80 }}
  >
    <div role="presentation" class="resize-handle resize-n" onmousedown={(ev) => handleResizeStart(ev, "n")}></div>
    <div role="presentation" class="resize-handle resize-s" onmousedown={(ev) => handleResizeStart(ev, "s")}></div>
    <div role="presentation" class="resize-handle resize-e" onmousedown={(ev) => handleResizeStart(ev, "e")}></div>
    <div role="presentation" class="resize-handle resize-w" onmousedown={(ev) => handleResizeStart(ev, "w")}></div>
    <div role="presentation" class="resize-handle resize-ne" onmousedown={(ev) => handleResizeStart(ev, "ne")}></div>
    <div role="presentation" class="resize-handle resize-nw" onmousedown={(ev) => handleResizeStart(ev, "nw")}></div>
    <div role="presentation" class="resize-handle resize-se" onmousedown={(ev) => handleResizeStart(ev, "se")}></div>
    <div role="presentation" class="resize-handle resize-sw" onmousedown={(ev) => handleResizeStart(ev, "sw")}></div>

    <div
      class="panel-header"
      onmousedown={handleDragStart}
      role="toolbar"
      tabindex="0"
    >
      <span class="panel-header-text">Options</span>

      <div class="panel-header-controls">
        <button
          class="panel-control panel-close"
          onclick={(ev) => {
            ev.stopPropagation();
            optionsPanelState.savePosition(panel);
            optionsPanelState.hide();
          }}
          aria-label="Close"
        >
          <X class="size-3" />
        </button>
      </div>
    </div>

    <div class="panel-content">
      <div class="options-grid">
        {#each options as option (option.key)}
        {@const hotkey = hotkeyValues[option.hotkeyId]}
          <Label class="option-row">
            <Checkbox
              checked={gameState[option.key]}
              onCheckedChange={(checked) => {
                gameState[option.key] = checked === true;
              }}
            />
            <span class="option-label-text">{option.label}</span>
            <Kbd hotkey={hotkey ?? ""} />
          </Label>
        {/each}
      </div>

      <div class="inputs-section">
        <div class="inputs-row">
          <div class="option-row-input">
            <span class="option-label">Walk Speed</span>
            <NumberField.Root
              value={gameState.walkSpeed}
              onValueChange={(v) => {
                if (!Number.isNaN(v)) gameState.walkSpeed = v;
              }}
              min={1}
              max={100}
              step={1}
              class="input-field"
            >
              <NumberField.Input class="input-inner" />
            </NumberField.Root>
          </div>

          <div class="option-row-input">
            <span class="option-label">FPS</span>
            <NumberField.Root
              value={gameState.fps}
              onValueChange={(v) => {
                if (!Number.isNaN(v)) gameState.fps = v;
              }}
              min={1}
              max={60}
              step={1}
              class="input-field"
            >
              <NumberField.Input class="input-inner" />
            </NumberField.Root>
          </div>
        </div>

        <div class="option-row-text">
          <span class="option-label">Custom Name</span>
          <Input
            bind:value={customName}
            placeholder="Display name"
            size="sm"
            class="text-input"
            spellcheck={false}
          />
        </div>

        <div class="option-row-text">
          <span class="option-label">Custom Guild</span>
          <Input
            bind:value={customGuild}
            placeholder="Display guild"
            size="sm"
            class="text-input"
            spellcheck={false}
          />
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .options-panel {
    position: fixed;
    top: 40px;
    left: 20px;
    width: 340px;
    min-width: 280px;
    min-height: 160px;
    background-color: rgb(var(--popover));
    border: 1px solid rgb(var(--border));
    border-radius: 10px;
    z-index: 9999;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    user-select: none;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .options-panel.dragging {
    cursor: grabbing;
    opacity: 0.95;
  }

  .options-panel.resizing {
    opacity: 0.95;
  }

  /* Resize handles */
  .resize-handle {
    position: absolute;
    z-index: 10;
  }

  .resize-n {
    top: 0;
    left: 6px;
    right: 6px;
    height: 4px;
    cursor: n-resize;
  }

  .resize-s {
    bottom: 0;
    left: 6px;
    right: 6px;
    height: 4px;
    cursor: s-resize;
  }

  .resize-e {
    right: 0;
    top: 6px;
    bottom: 6px;
    width: 4px;
    cursor: e-resize;
  }

  .resize-w {
    left: 0;
    top: 6px;
    bottom: 6px;
    width: 4px;
    cursor: w-resize;
  }

  .resize-ne {
    top: 0;
    right: 0;
    width: 8px;
    height: 8px;
    cursor: ne-resize;
  }

  .resize-nw {
    top: 0;
    left: 0;
    width: 8px;
    height: 8px;
    cursor: nw-resize;
  }

  .resize-se {
    bottom: 0;
    right: 0;
    width: 8px;
    height: 8px;
    cursor: se-resize;
  }

  .resize-sw {
    bottom: 0;
    left: 0;
    width: 8px;
    height: 8px;
    cursor: sw-resize;
  }

  .panel-header {
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
    flex-shrink: 0;
    height: 20px;
  }

  .panel-header-text {
    flex: 1;
    margin-right: 8px;
    color: rgb(var(--foreground));
  }

  .panel-header-controls {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .panel-control {
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
    transition: background-color 0.12s ease, color 0.12s ease;
  }

  .panel-control:hover {
    color: rgb(var(--foreground));
    background-color: rgb(var(--accent));
  }

  .panel-close:hover {
    color: rgb(var(--destructive));
  }

  .panel-content {
    padding: 12px;
    flex: 1;
    overflow: auto;
  }

  .options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 4px;
  }

  .inputs-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgb(var(--border));
  }

  .inputs-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
  }

  :global(.option-row) {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: background-color 0.1s ease;
    white-space: nowrap;
    overflow: hidden;
  }

  :global(.option-row:hover) {
    background-color: rgb(var(--accent));
  }

  .option-label-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .option-row-input {
    display: flex;
    align-items: center;
    padding: 4px 6px;
    font-size: 12px;
    gap: 8px;
  }

  .option-label {
    color: rgb(var(--foreground));
    flex-shrink: 0;
    white-space: nowrap;
  }

  .option-row-text .option-label {
    min-width: 90px;
    width: 90px;
  }

  :global(.input-field) {
    width: 56px;
    flex-shrink: 0;
  }

  :global(.input-inner) {
    height: 24px;
    padding: 0;
    font-size: 11px;
    text-align: center;
    line-height: 24px;
    border-radius: 6px;
  }

  .option-row-text {
    display: grid;
    grid-template-columns: 90px 1fr;
    align-items: center;
    padding: 4px 6px;
    font-size: 12px;
    gap: 8px;
  }

  :global(.text-input) {
    display: flex;
    flex: 1;
    min-width: 0;
    height: 24px;
    font-size: 11px;
    border-radius: 6px;
    color: rgb(var(--foreground));
  }
</style>
