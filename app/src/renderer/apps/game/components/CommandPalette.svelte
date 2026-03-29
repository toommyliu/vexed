<script lang="ts">
  import { Icon, Kbd } from "@vexed/ui";
  import { cn } from "@vexed/ui/util";
  import { equalsIgnoreCase, fuzzyMatchIgnoreCase } from "@vexed/utils";
  import { get } from "svelte/store";

  import { getUiCommands, type UiCommandSpec } from "../actions";
  import { platform } from "../state/index.svelte";
  import { handlers } from "~/shared/tipc";

  type Props = {
    onClose?(this: void): void;
    open?: boolean;
  };

  type CommandEntry = UiCommandSpec & {
    filteredIndex: number;
    globalIndex: number;
  };

  type CommandSection = {
    category: string;
    items: CommandEntry[];
  };

  // eslint-disable-next-line prefer-const
  let { open = $bindable(false), onClose }: Props = $props();

  let searchQuery = $state("");
  let selectedIndex = $state(0);
  let inputRef = $state<HTMLInputElement | null>(null);
  let mouseMoved = $state(false);
  const commandItemRefs = $state<HTMLDivElement[]>([]);

  const commands = $derived.by<CommandEntry[]>(() =>
    getUiCommands().map((cmd, globalIndex) => ({
      ...cmd,
      filteredIndex: globalIndex,
      globalIndex,
    })),
  );

  const filteredCommands = $derived.by<CommandEntry[]>(() => {
    const query = searchQuery.trim();
    const filtered = query
      ? commands.filter(
          (cmd) =>
            fuzzyMatchIgnoreCase(cmd.label, query) ||
            fuzzyMatchIgnoreCase(cmd.category, query),
        )
      : commands;

    return filtered.map((cmd, filteredIndex) => ({
      ...cmd,
      filteredIndex,
    }));
  });

  const groupedCommands = $derived.by<CommandSection[]>(() => {
    const groups: CommandSection[] = [];
    const groupIndexByCategory: Record<string, number> = {};

    for (const cmd of filteredCommands) {
      const groupIndex = groupIndexByCategory[cmd.category];
      if (groupIndex === undefined) {
        groupIndexByCategory[cmd.category] = groups.length;
        groups.push({ category: cmd.category, items: [cmd] });
      } else {
        groups[groupIndex]!.items.push(cmd);
      }
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
    const cmd = filteredCommands[index];
    if (!cmd) return;

    requestAnimationFrame(() => {
      commandItemRefs[cmd.globalIndex]?.scrollIntoView({ block: "nearest" });
    });
  }

  function isModifierKey(ev: KeyboardEvent | MouseEvent) {
    return get(platform).isMac ? ev.metaKey : ev.ctrlKey;
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
      if (cmd) executeCommand(cmd, isModifierKey(ev));
    }
  }

  $effect(() => {
    if (open && inputRef) inputRef.focus();
  });

  $effect(() => {
    const maxIndex = filteredCommands.length - 1;
    if (selectedIndex > maxIndex) selectedIndex = Math.max(maxIndex, 0);
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
    if (isModifierKey(ev) && equalsIgnoreCase(ev.key, "k")) {
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
      class="command-palette elevation-2 relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-border bg-popover"
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
          {#each groupedCommands as { category, items } (category)}
            <div class="mb-2 last:mb-0">
              <div
                class="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {category}
              </div>
              {#each items as cmd (cmd.id)}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                  class={cn(
                    "flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors",
                    cmd.filteredIndex === selectedIndex
                      ? "bg-primary/20 text-foreground"
                      : "text-foreground/80 hover:bg-accent",
                  )}
                  bind:this={commandItemRefs[cmd.globalIndex]}
                  onclick={(ev) => executeCommand(cmd, isModifierKey(ev))}
                  onmouseenter={() => mouseMoved && (selectedIndex = cmd.filteredIndex)}
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
