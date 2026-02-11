<script lang="ts">
  import { Button } from "@vexed/ui";
  import Kbd from "@vexed/ui/Kbd";
  import { getUiCommands, type UiCommandSpec } from "../actions";

  interface Props {
    open?: boolean;
    onClose?: () => void;
    hotkeyValues?: Record<string, string>;
  }

  let { open = false, onClose, hotkeyValues = {} }: Props = $props();

  const commands = $derived.by<UiCommandSpec[]>(() =>
    getUiCommands(hotkeyValues),
  );
  const applicationItems = $derived.by(() =>
    commands.filter((cmd) => cmd.category === "Application"),
  );
  const toolsItems = $derived.by(() =>
    commands.filter((cmd) => cmd.category === "Tools"),
  );
  const packetsItems = $derived.by(() =>
    commands.filter((cmd) => cmd.category === "Packets"),
  );

  function handleItemClick(item: UiCommandSpec) {
    item.run();
    onClose?.();
  }
</script>

{#if open}
  <div
    class="windows-mega-menu elevation-2 absolute left-0 top-full z-[9999] mt-1 grid grid-cols-[auto_auto_auto] gap-0 overflow-hidden rounded-lg border border-border bg-popover"
  >
    <!-- Application Column -->
    <div class="border-r border-border/50 p-2">
      <div
        class="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        Application
      </div>
      {#each applicationItems as item (item.id)}
        <Button
          variant="ghost"
          size="sm"
          class="w-full justify-between gap-2 bg-transparent text-xs hover:bg-accent"
          onclick={() => handleItemClick(item)}
        >
          <span>{item.label}</span>
          <Kbd hotkey={item.hotkey} />
        </Button>
      {/each}
    </div>

    <!-- Tools Column -->
    <div class="border-r border-border/50 p-2">
      <div
        class="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        Tools
      </div>
      {#each toolsItems as item (item.id)}
        <Button
          variant="ghost"
          size="sm"
          class="w-full justify-between gap-2 bg-transparent text-xs hover:bg-accent"
          onclick={() => handleItemClick(item)}
        >
          <span>{item.label}</span>
          <Kbd hotkey={item.hotkey} />
        </Button>
      {/each}
    </div>

    <!-- Packets Column -->
    <div class="p-2">
      <div
        class="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        Packets
      </div>
      {#each packetsItems as item (item.id)}
        <Button
          variant="ghost"
          size="sm"
          class="w-full justify-between gap-2 bg-transparent text-xs hover:bg-accent"
          onclick={() => handleItemClick(item)}
        >
          <span>{item.label}</span>
          <Kbd hotkey={item.hotkey} />
        </Button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .windows-mega-menu {
    animation: menu-in 0.12s ease-out;
  }

  @keyframes menu-in {
    from {
      opacity: 0;
      transform: scale(0.96) translateY(-4px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
</style>
