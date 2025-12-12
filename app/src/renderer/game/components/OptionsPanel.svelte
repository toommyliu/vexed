<script lang="ts">
  import { onMount, tick } from "svelte";
  import { gameState, optionsPanelState } from "@game/state.svelte";
  import { Checkbox, Input, Label } from "@vexed/ui";
  import * as NumberField from "@vexed/ui/NumberField";
  import { motionScale, motionFade } from "@vexed/ui/motion";
  import X from "lucide-svelte/icons/x";
  import { cn } from "@shared/cn";
  import { Bot } from "@game/lib/Bot";

  const bot = Bot.getInstance();

  let panel: HTMLDivElement;
  let panelRef: HTMLDivElement | null = null;
  let wasVisible = false;

  let customName = $state("");
  let customGuild = $state("");

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

  const MIN_WIDTH = 280;
  const MIN_HEIGHT = 160;

  const options = [
    { key: "infiniteRange", label: "Infinite Range" },
    { key: "provokeCell", label: "Provoke Cell" },
    { key: "enemyMagnet", label: "Enemy Magnet" },
    { key: "lagKiller", label: "Lag Killer" },
    { key: "hidePlayers", label: "Hide Players" },
    { key: "skipCutscenes", label: "Skip Cutscenes" },
    { key: "disableFx", label: "Disable FX" },
    { key: "disableCollisions", label: "Disable Collisions" },
    { key: "counterAttack", label: "Anti-Counter" },
    { key: "disableDeathAds", label: "Disable Death Ads" },
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

    const topNav = document.getElementById("topnav-container");
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
      newWidth = Math.max(MIN_WIDTH, resizeStart.width + deltaX);
    }
    if (resizeDirection.includes("w")) {
      const potentialWidth = resizeStart.width - deltaX;
      if (potentialWidth >= MIN_WIDTH) {
        newWidth = potentialWidth;
        newLeft = resizeStart.left + deltaX;
      }
    }
    if (resizeDirection.includes("s")) {
      newHeight = Math.max(MIN_HEIGHT, resizeStart.height + deltaY);
    }
    if (resizeDirection.includes("n")) {
      const potentialHeight = resizeStart.height - deltaY;
      const potentialTop = resizeStart.top + deltaY;
      if (potentialHeight >= MIN_HEIGHT && potentialTop >= minTop) {
        newHeight = potentialHeight;
        newTop = potentialTop;
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

    if (rect.right > innerWidth) {
      const newLeft = Math.max(0, innerWidth - rect.width);
      panel.style.left = `${newLeft}px`;
    }

    const topNav = document.getElementById("topnav-container");
    const topNavBottom = topNav?.getBoundingClientRect().bottom ?? 0;
    const minTop = Math.max(0, Math.round(topNavBottom));

    if (rect.top < minTop) {
      panel.style.top = `${minTop}px`;
    }

    if (rect.bottom > innerHeight) {
      const newTop = Math.max(minTop, innerHeight - rect.height);
      panel.style.top = `${newTop}px`;
    }

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
    <!-- Resize handles -->
    <div class="resize-handle resize-n" onmousedown={(e) => handleResizeStart(e, "n")}></div>
    <div class="resize-handle resize-s" onmousedown={(e) => handleResizeStart(e, "s")}></div>
    <div class="resize-handle resize-e" onmousedown={(e) => handleResizeStart(e, "e")}></div>
    <div class="resize-handle resize-w" onmousedown={(e) => handleResizeStart(e, "w")}></div>
    <div class="resize-handle resize-ne" onmousedown={(e) => handleResizeStart(e, "ne")}></div>
    <div class="resize-handle resize-nw" onmousedown={(e) => handleResizeStart(e, "nw")}></div>
    <div class="resize-handle resize-se" onmousedown={(e) => handleResizeStart(e, "se")}></div>
    <div class="resize-handle resize-sw" onmousedown={(e) => handleResizeStart(e, "sw")}></div>

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
          <Label class="option-row">
            <Checkbox
              checked={gameState[option.key]}
              onCheckedChange={(checked) => {
                gameState[option.key] = checked === true;
              }}
            />
            <span>{option.label}</span>
          </Label>
        {/each}

        <div class="option-row-numeric">
          <span class="option-label">Walk Speed</span>
          <NumberField.Root
            value={gameState.walkSpeed}
            onValueChange={(v) => {
              if (!Number.isNaN(v)) gameState.walkSpeed = v;
            }}
            min={1}
            max={100}
            step={1}
            class="number-field-root"
          >
            <NumberField.Input class="number-field-input" />
          </NumberField.Root>
        </div>

        <div class="option-row-numeric">
          <span class="option-label">FPS</span>
          <NumberField.Root
            value={gameState.fps}
            onValueChange={(v) => {
              if (!Number.isNaN(v)) gameState.fps = v;
            }}
            min={1}
            max={60}
            step={1}
            class="number-field-root"
          >
            <NumberField.Input class="number-field-input" />
          </NumberField.Root>
        </div>

        <div class="option-row-text">
          <span class="option-label">Custom Name</span>
          <Input
            bind:value={customName}
            placeholder="Display name"
            size="sm"
            class="text-input"
            onblur={() => {
              bot.settings.customName = customName || null;
            }}
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
            onblur={() => {
              bot.settings.customGuild = customGuild || null;
            }}
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

  :global(.option-row) {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 6px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: background-color 0.1s ease;
  }

  :global(.option-row:hover) {
    background-color: rgb(var(--accent));
  }

  .option-row-numeric {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 6px;
    font-size: 12px;
    gap: 8px;
  }

  .option-label {
    color: rgb(var(--foreground));
    flex-shrink: 0;
  }

  :global(.number-field-root) {
    width: 56px;
    flex-shrink: 0;
  }

  :global(.number-field-input) {
    height: 22px;
    padding: 0 4px;
    font-size: 11px;
    text-align: center;
    border-radius: 4px;
  }

  .option-row-text {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 6px;
    font-size: 12px;
    gap: 8px;
    grid-column: 1 / -1;
  }

  :global(.text-input) {
    flex: 1;
    min-width: 0;
    height: 22px;
    font-size: 11px;
    color: rgb(var(--foreground));
  }
</style>
