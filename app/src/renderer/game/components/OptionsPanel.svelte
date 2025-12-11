<script lang="ts">
  import { onMount, tick } from "svelte";
  import { gameState, optionsPanelState } from "@game/state.svelte";
  import { Checkbox, Label } from "@vexed/ui";
  import * as NumberField from "@vexed/ui/NumberField";
  import { motionScale, motionFade } from "@vexed/ui/motion";
  import ChevronDown from "lucide-svelte/icons/chevron-down";
  import ChevronRight from "lucide-svelte/icons/chevron-right";
  import X from "lucide-svelte/icons/x";
  import { cn } from "@shared/cn";

  let panel: HTMLDivElement;
  let panelRef: HTMLDivElement | null = null;
  let wasVisible = false;
  let collapsed = $state(false);

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

    optionsPanelState.setDragging(true);

    const rect = panel.getBoundingClientRect();
    optionsPanelState.dragOffset = {
      x: ev.clientX - rect.left,
      y: ev.clientY - rect.top,
    };
  }

  function handleDragMove(ev: MouseEvent) {
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
    if (!optionsPanelState.isDragging) return;

    optionsPanelState.setDragging(false);
    ensureWithinViewport();
    optionsPanelState.savePosition(panel);
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

  const options = [
    { key: "infiniteRange", label: "Infinite Range" },
    { key: "provokeCell", label: "Provoke Cell" },
    { key: "enemyMagnet", label: "Enemy Magnet" },
    { key: "lagKiller", label: "Lag Killer" },
    { key: "hidePlayers", label: "Hide Players" },
    { key: "skipCutscenes", label: "Skip Cutscenes" },
    { key: "disableFx", label: "Disable FX" },
    { key: "disableCollisions", label: "Disable Collisions" },
  ] as const;
</script>

{#if optionsPanelState.isVisible}
  <div
    bind:this={panel}
    class={cn(
      "options-panel",
      collapsed && "collapsed",
      optionsPanelState.isDragging && "dragging"
    )}
    in:motionScale={{ duration: 120, start: 0.96, opacity: 0 }}
    out:motionFade={{ duration: 80 }}
  >
    <div
      class="panel-header"
      onmousedown={handleDragStart}
      ondblclick={() => (collapsed = !collapsed)}
      role="toolbar"
      tabindex="0"
    >
      <span class="panel-header-text">Options</span>

      <div class="panel-header-controls">
        <button
          class="panel-control"
          onclick={(ev) => {
            ev.stopPropagation();
            collapsed = !collapsed;
          }}
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          {#if collapsed}
            <ChevronRight class="size-3.5" />
          {:else}
            <ChevronDown class="size-3.5" />
          {/if}
        </button>

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

    {#if !collapsed}
      <div class="panel-content">
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

        <div class="option-divider"></div>

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
      </div>
    {/if}
  </div>
{/if}

<style>
  .options-panel {
    position: fixed;
    top: 40px;
    left: 20px;
    background-color: rgb(var(--popover));
    border: 1px solid rgb(var(--border));
    border-radius: 10px;
    min-width: 200px;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    user-select: none;
    overflow: hidden;
  }

  .options-panel.collapsed {
    overflow: visible;
  }

  .options-panel.dragging {
    cursor: grabbing;
    opacity: 0.95;
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

  .options-panel.collapsed .panel-header {
    border-radius: 10px;
    border-bottom: none;
  }

  .panel-content {
    padding: 8px;
    display: flex;
    flex-direction: column;
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

  .option-divider {
    height: 1px;
    background-color: rgb(var(--border));
    margin: 4px 0;
  }

  .option-row-numeric {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 6px;
    font-size: 12px;
  }

  .option-label {
    color: rgb(var(--foreground));
  }

  :global(.number-field-root) {
    width: 60px;
  }

  :global(.number-field-input) {
    height: 24px;
    padding: 0 6px;
    font-size: 11px;
    text-align: center;
    border-radius: 4px;
  }
</style>
