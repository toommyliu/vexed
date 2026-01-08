<script lang="ts">
  import { Switch, Button } from "@vexed/ui";
  import * as Select from "@vexed/ui/Select";
  import { onMount } from "svelte";

  import { client } from "~/shared/tipc";
  import type { ServerData } from "~/shared/types";

  let checkForUpdates = $state(false);
  let debug = $state(false);
  let fallbackServer = $state("");
  let launchMode = $state<"game" | "manager">("game");
  let theme = $state<"dark" | "light" | "system">("dark");
  let isLoading = $state(true);
  let servers = $state<ServerData[]>([]);

  onMount(async () => {
    const [settings, serverData] = await Promise.all([
      client.onboarding.getSettings(),
      client.onboarding.getServers(),
    ]);

    console.log("settings", settings);
    console.log("serverData", serverData);

    checkForUpdates = settings.checkForUpdates;
    debug = settings.debug;
    fallbackServer = settings.fallbackServer;
    launchMode = settings.launchMode;
    theme = settings.theme;
    servers = serverData;
    isLoading = false;
  });

  $effect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  });

  $effect(() => {
    if (isLoading) return;
    client.onboarding.updateSettings({
      checkForUpdates,
      debug,
      fallbackServer,
      launchMode,
      theme,
    });
  });
</script>

<div class="flex h-screen flex-col bg-background p-5 animate-in fade-in slide-in-from-bottom-1 duration-300">
  {#if isLoading}
    <div class="flex flex-1 items-center justify-center">
      <div class="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary"></div>
    </div>
  {:else}
    <div class="flex flex-1 flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <span class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Theme</span>
        <div class="flex gap-1.5">
          <Button
            class="flex-1"
            size="sm"
            variant={theme === "dark" ? "default" : "ghost"}
            onclick={() => (theme = "dark")}
          >
            Dark
          </Button>
          <Button
            class="flex-1"
            size="sm"
            variant={theme === "light" ? "default" : "ghost"}
            onclick={() => (theme = "light")}
          >
            Light
          </Button>
          <Button
            class="flex-1"
            size="sm"
            variant={theme === "system" ? "default" : "ghost"}
            onclick={() => (theme = "system")}
          >
            Auto
          </Button>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Launch Mode</span>
        <div class="flex gap-1.5">
          <Button
            class="flex-1"
            size="sm"
            variant={launchMode === "game" ? "default" : "ghost"}
            onclick={() => (launchMode = "game")}
            title="Launch directly into the game client"
          >
            Game
          </Button>
          <Button
            class="flex-1"
            size="sm"
            variant={launchMode === "manager" ? "default" : "ghost"}
            onclick={() => (launchMode = "manager")}
            title="Launch the account manager to handle multiple accounts"
          >
            Manager
          </Button>
        </div>
      </div>

      <div class="flex flex-col gap-2.5 pt-1">
        <label class="flex cursor-pointer items-center justify-between">
          <span class="text-[13px] text-foreground">Check for Updates</span>
          <Switch bind:checked={checkForUpdates} class="scale-[0.85] origin-right" />
        </label>
        <label class="flex cursor-pointer items-center justify-between">
          <span class="text-[13px] text-foreground">Debug Mode</span>
          <Switch bind:checked={debug} class="scale-[0.85] origin-right" />
        </label>
      </div>

      <div class="flex flex-col gap-1.5 pt-2 border-t border-border/30">
        <span class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Fallback Server
        </span>
        <Select.Root bind:value={fallbackServer}>
          <Select.Trigger class="w-full h-8 text-[13px]">
            <span class="truncate">
              {fallbackServer || "Auto (first available)"}
            </span>
          </Select.Trigger>
          <Select.Content class="max-h-52">
            <Select.Item value="">Auto (first available)</Select.Item>
            {#each servers as server (server.sName)}
              <Select.Item value={server.sName}>
                {server.sName}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
    </div>
  {/if}
</div>
