<script lang="ts">
  import { Kbd, Menu } from "@vexed/ui";
  import { cn } from "@vexed/ui/util";
  import { getUiCommands, type UiCommandSpec } from "../actions";

  const { class: className, ...restProps } = $props<{ class?: string }>();

  const commands = $derived.by<UiCommandSpec[]>(() => getUiCommands());

  const categories = $derived.by(() => {
    const cats = ["Application", "Tools", "Packets"] as const;
    return cats.map((name) => ({
      name,
      items: commands.filter((cmd) => cmd.category === name),
    }));
  });
</script>

<Menu.Content class="bg-popover p-0 ring-1 ring-foreground/10" {...restProps}>
  <div class="grid grid-cols-3">
    {#each categories as { name, items } (name)}
      <Menu.Group class={cn("flex min-w-[170px] flex-col gap-1 p-1")}>
        <Menu.Label class="text-[12px] font-medium text-muted-foreground">
          {name}
        </Menu.Label>
        <div class="flex flex-col gap-0.5">
          {#each items as item (item.id)}
            <Menu.Item
              onSelect={() => item.run()}
              class="group h-7 w-full justify-between gap-4 px-2 text-xs font-medium text-foreground/80 hover:text-foreground data-[highlighted]:bg-accent/50"
            >
              <span class="truncate">{item.label}</span>
              {#if item.hotkey}
                <div
                  class="ms-auto flex items-center opacity-80 group-hover:opacity-100"
                >
                  <Kbd hotkey={item.hotkey} />
                </div>
              {/if}
            </Menu.Item>
          {/each}
        </div>
      </Menu.Group>
    {/each}
  </div>
</Menu.Content>
