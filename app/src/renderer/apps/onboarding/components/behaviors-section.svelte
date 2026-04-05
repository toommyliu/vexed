<script lang="ts">
  import { PillButton, Select } from "@vexed/ui";

  import { settings } from "../state/settings.svelte";
  import { servers } from "../state/servers";
</script>

<div class="mx-auto flex max-w-2xl flex-col gap-10">
  <section class="flex flex-col gap-3">
    <div
      class="flex flex-col gap-0 divide-y divide-border/30 rounded-md bg-transparent"
    >
      <div class="flex items-center justify-between px-2 py-3">
        <div class="flex flex-col">
          <span class="text-[13px] font-medium text-foreground"
            >Launch Mode</span
          >
          <span class="text-[12px] text-muted-foreground/80"
            >Choose how the application starts</span
          >
        </div>
        <div class="flex gap-[2px]">
          <PillButton
            size="sm"
            class="h-7 px-3 text-[12px]"
            variant={settings.launchMode === "game" ? "default" : "ghost"}
            onclick={() => (settings.launchMode = "game")}
          >
            Game
          </PillButton>
          <PillButton
            size="sm"
            class="h-7 px-3 text-[12px]"
            variant={settings.launchMode === "manager" ? "default" : "ghost"}
            onclick={() => (settings.launchMode = "manager")}
          >
            Manager
          </PillButton>
        </div>
      </div>
      <div class="flex items-center justify-between px-2 py-3">
        <div class="flex flex-col">
          <span class="text-[13px] font-medium text-foreground"
            >Fallback Server</span
          >
          <span class="text-[12px] text-muted-foreground/80"
            >Server used if autorelogin fails</span
          >
        </div>
        <div class="flex w-[200px] justify-end">
          <Select.Root bind:value={settings.fallbackServer} class="w-full">
            <Select.Trigger class="h-8 w-full bg-transparent text-xs" size="sm">
              <Select.Value placeholder="Auto"
                >{settings.fallbackServer}</Select.Value
              >
            </Select.Trigger>
            <Select.Content class="max-h-52">
              <Select.Item class="text-xs" value="Auto (first available)"
                >Auto</Select.Item
              >
              {#each $servers as server (server.sName)}
                <Select.Item class="text-xs" value={server.sName}>
                  {server.sName}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
      </div>
    </div>
  </section>
</div>
