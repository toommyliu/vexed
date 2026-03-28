<script lang="ts">
  import { Kbd, Menu } from "@vexed/ui";
  import { getUiCommands, type UiCommandSpec } from "../actions";

  const commands = $derived.by<UiCommandSpec[]>(() => getUiCommands());

  const applicationItems = $derived.by(() =>
    commands.filter((cmd) => cmd.category === "Application"),
  );
  const toolsItems = $derived.by(() =>
    commands.filter((cmd) => cmd.category === "Tools"),
  );
  const packetsItems = $derived.by(() =>
    commands.filter((cmd) => cmd.category === "Packets"),
  );
</script>

<div class="grid grid-cols-3">
  <!-- Application Column -->
  <div class="min-w-[160px] border-r border-border/20 p-1">
    <Menu.Label
      class="mb-1 px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground/40"
    >
      Application
    </Menu.Label>
    <div class="flex flex-col gap-0.5">
      {#each applicationItems as item (item.id)}
        <Menu.Item
          class="h-7 w-full justify-between gap-4 px-2 text-xs font-medium text-foreground/70 transition-colors hover:text-foreground data-[highlighted]:bg-muted/80"
          onSelect={() => item.run()}
        >
          <span>{item.label}</span>
          <Kbd hotkey={item.hotkey} />
        </Menu.Item>
      {/each}
    </div>
  </div>

  <!-- Tools Column -->
  <div class="min-w-[160px] border-r border-border/20 p-1">
    <Menu.Label
      class="mb-1 px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground/40"
    >
      Tools
    </Menu.Label>
    <div class="flex flex-col gap-0.5">
      {#each toolsItems as item (item.id)}
        <Menu.Item
          class="h-7 w-full justify-between gap-4 px-2 text-xs font-medium text-foreground/70 transition-colors hover:text-foreground data-[highlighted]:bg-muted/80"
          onSelect={() => item.run()}
        >
          <span>{item.label}</span>
          <Kbd hotkey={item.hotkey} />
        </Menu.Item>
      {/each}
    </div>
  </div>

  <!-- Packets Column -->
  <div class="min-w-[160px] p-1">
    <Menu.Label
      class="mb-1 px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground/40"
    >
      Packets
    </Menu.Label>
    <div class="flex flex-col gap-0.5">
      {#each packetsItems as item (item.id)}
        <Menu.Item
          class="h-7 w-full justify-between gap-4 px-2 text-xs font-medium text-foreground/70 transition-colors hover:text-foreground data-[highlighted]:bg-muted/80"
          onSelect={() => item.run()}
        >
          <span>{item.label}</span>
          <Kbd hotkey={item.hotkey} />
        </Menu.Item>
      {/each}
    </div>
  </div>
</div>
