<script lang="ts">
  import { Icon, Kbd } from "@vexed/ui";
  import { cn } from "@vexed/ui/util";
  import { equalsIgnoreCase, fuzzyMatchIgnoreCase } from "@vexed/utils";
  import { get } from "svelte/store";

  import { getUiCommands, type UiCommandSpec } from "../actions";
  import { platform } from "../state/index.svelte";
  import { handlers } from "~/shared/tipc";

  type Props = {
    hotkeyValues?: Record<string, string>;
    onClose?(): void;
    open?: boolean;
  };

  let { open = $bindable(false), onClose, hotkeyValues = {} }: Props = $props();

  let searchQuery = $state("");
  let selectedIndex = $state(0);
  let inputRef = $state<HTMLInputElement | null>(null);
  let mouseMoved = $state(false);

  const commands = $derived.by<UiCommandSpec[]>(() =>
    getUiCommands(hotkeyValues),
  );

  const filteredCommands = $derived(
    searchQuery.trim()
      ? commands.filter(
          (cmd) =>
            fuzzyMatchIgnoreCase(cmd.label, searchQuery) ||
            fuzzyMatchIgnoreCase(cmd.category, searchQuery),
        )
      : commands,
  );

  const groupedCommands = $derived(() => {
    const groups: Record<string, UiCommandSpec[]> = {};
    for (const cmd of filteredCommands) {
      groups[cmd.category] = groups[cmd.category] ?? [];
      groups[cmd.category]!.push(cmd);
    }
    return groups;
  });

  function handleClose() {
    open = false;
    searchQuery = "";
    selectedIndex = 0;
    onClose?.();
  }

  function executeCommand(cmd: UiCommandSpec, shouldClose = false) {
    cmd.run();
    if (shouldClose) handleClose();
  }

  function scrollSelectedIntoView(index: number) {
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-command-index="${index}"]`);
      el?.scrollIntoView({ block: "nearest" });
    });
  }

  function handleKeydown(ev: KeyboardEvent) {
    if (ev.key === "Escape") {
      ev.preventDefault();
      handleClose();
      return;
    }

    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      const newIndex = Math.min(selectedIndex + 1, filteredCommands.length - 1);
      selectedIndex = newIndex;
      scrollSelectedIntoView(newIndex);
      return;
    }

    if (ev.key === "ArrowUp") {
      ev.preventDefault();
      const newIndex = Math.max(selectedIndex - 1, 0);
      selectedIndex = newIndex;
      scrollSelectedIntoView(newIndex);
      return;
    }

    if (ev.key === "Enter") {
      ev.preventDefault();
      const cmd = filteredCommands[selectedIndex];
      const modifier = get(platform).isMac ? ev.metaKey : ev.ctrlKey;
      if (cmd) executeCommand(cmd, modifier);
    }
  }

  $effect(() => {
    if (open && inputRef) inputRef.focus();
  });

  $effect(() => {
    if (searchQuery !== undefined) selectedIndex = 0;
  });

  handlers.game.openCommandPalette.listen(() => {
    open = true;
  });
</script>

<svelte:window
  onkeydown={(ev) => {
    if (open) return;
    const modifier = get(platform).isMac ? ev.metaKey : ev.ctrlKey;
    if (modifier && equalsIgnoreCase(ev.key, "k")) {
      ev.preventDefault();
      open = true;
    }
  }}
/>

{#if open}
  <div
    class="fixed inset-0 z-[99999] flex items-start justify-center pt-[15vh]"
    role="dialog"
    aria-modal="true"
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="absolute inset-0 bg-black/60" onclick={handleClose}></div>

    <div
      class="command-palette elevation-2 relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-border bg-popover shadow-2xl backdrop-blur-xl"
    >
      <div class="flex items-center gap-3 border-b border-border px-4 py-3">
        <Icon icon="search" class="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          bind:this={inputRef}
          type="text"
          placeholder="Search commands..."
          class="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          bind:value={searchQuery}
          onkeydown={handleKeydown}
        />
        <button
          class="flex h-5 w-5 items-center justify-center rounded bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onclick={handleClose}
        >
          <Icon icon="x" class="h-3.5 w-3.5" />
        </button>
      </div>

      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="max-h-[50vh] overflow-y-auto p-2"
        onscroll={() => (mouseMoved = false)}
        onmousemove={() => (mouseMoved = true)}
      >
        {#if filteredCommands.length === 0}
          <div class="px-3 py-8 text-center text-sm text-muted-foreground">
            No commands found
          </div>
        {:else}
          {#each Object.entries(groupedCommands()) as [category, items] (category)}
            <div class="mb-2 last:mb-0">
              <div
                class="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {category}
              </div>
              {#each items as cmd (cmd.id)}
                {@const globalIndex = filteredCommands.indexOf(cmd)}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                  class={cn(
                    "flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors",
                    globalIndex === selectedIndex
                      ? "bg-primary/20 text-foreground"
                      : "text-foreground/80 hover:bg-accent",
                  )}
                  data-command-index={globalIndex}
                  onclick={(ev) =>
                    executeCommand(
                      cmd,
                      get(platform).isMac ? ev.metaKey : ev.ctrlKey,
                    )}
                  onmouseenter={() =>
                    mouseMoved && (selectedIndex = globalIndex)}
                >
                  <span class="text-sm">{cmd.label}</span>
                  <Kbd hotkey={cmd.hotkey} />
                </div>
              {/each}
            </div>
          {/each}
        {/if}
      </div>

      <div
        class="flex items-center justify-between border-t border-border px-4 py-2 text-[10px] text-muted-foreground"
      >
        <div class="flex items-center gap-3">
          <span class="flex items-center gap-1">
            <Kbd>↑↓</Kbd>
            <span>navigate</span>
          </span>
          <span class="flex items-center gap-1">
            <Kbd>↵</Kbd>
            <span>run</span>
          </span>
          <span class="flex items-center gap-1">
            <Kbd>{$platform.isMac ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>↵</Kbd>
            <span>run & close</span>
          </span>
          <span class="flex items-center gap-1">
            <Kbd>esc</Kbd>
            <span>close</span>
          </span>
        </div>
        <div class="flex items-center gap-1 text-muted-foreground/60">
          <!-- TODO: use the Command symbol instead? -->
          <Icon icon="command" class="h-3 w-3" />
          <span>K</span>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .command-palette {
    animation: palette-in 0.15s ease-out;
  }

  @keyframes palette-in {
    from {
      opacity: 0;
      transform: scale(0.96) translateY(-8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
</style>
