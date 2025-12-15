<script lang="ts">
  import { Switch, Label, Button } from "@vexed/ui";
  import * as Tabs from "@vexed/ui/Tabs";

  import { onMount } from "svelte";

  import { client } from "@shared/tipc";

  let checkForUpdates = $state(false);
  let debug = $state(false);
  let launchMode = $state<"game" | "manager">("game");
  let theme = $state<"dark" | "light" | "system">("dark");
  let isLoading = $state(true);

  onMount(async () => {
    const settings = await client.onboarding.getSettings();
    checkForUpdates = settings.checkForUpdates;
    debug = settings.debug;
    launchMode = settings.launchMode;
    theme = settings.theme;
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
      launchMode,
      theme,
    });
  });

  async function handleSave() {
    await client.onboarding.saveSettings({
      checkForUpdates,
      debug,
      launchMode,
      theme,
    });
  }
</script>

<div class="bg-background flex h-screen flex-col p-4">
  {#if isLoading}
    <div class="flex flex-1 items-center justify-center">
      <p class="text-muted-foreground">Loading...</p>
    </div>
  {:else}
    <div class="flex flex-1 flex-col gap-4">
      <div class="flex items-center justify-between">
        <Label for="checkForUpdates">Check for Updates</Label>
        <Switch id="checkForUpdates" bind:checked={checkForUpdates} />
      </div>

      <div class="flex items-center justify-between">
        <Label for="debug">Debug Mode</Label>
        <Switch id="debug" bind:checked={debug} />
      </div>

      <div class="flex items-center justify-between">
        <Label>Launch Mode</Label>
        <Tabs.Root bind:value={launchMode}>
          <Tabs.List>
            <Tabs.Trigger value="game">Game</Tabs.Trigger>
            <Tabs.Trigger value="manager">Manager</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </div>

      <div class="flex items-center justify-between">
        <Label>Theme</Label>
        <Tabs.Root bind:value={theme}>
          <Tabs.List>
            <Tabs.Trigger value="dark">Dark</Tabs.Trigger>
            <Tabs.Trigger value="light">Light</Tabs.Trigger>
            <Tabs.Trigger value="system">System</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </div>

      <div class="mt-auto pt-4">
        <Button class="w-full" size="sm" onclick={handleSave}>Get Started</Button>
      </div>
    </div>
  {/if}
</div>
