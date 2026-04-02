<script lang="ts">
  import { cn, Icon, AppFrame } from "@vexed/ui";
  import { Result } from "better-result";
  import { onMount } from "svelte";
  import type { ServerData } from "@vexed/game";

  import AppearanceSection from "./components/appearance-section.svelte";
  import ApplicationSection from "./components/application-section.svelte";
  import BehaviorsSection from "./components/behaviors-section.svelte";

  import { servers } from "./state/servers";
  import { settings } from "./state/settings.svelte";
  import {
    activeEditScheme,
    customTheme,
    flushQueuedTokenUpdates,
    liveScheme,
  } from "./state/theme-manager";

  import type { Settings } from "~/shared/settings/types";
  import { client, handlers } from "~/shared/tipc";
  import { applyCustomTheme, getColorScheme } from "../../shared/theme";

  const AUTO = "Auto (first available)";
  const SETTINGS_SAVE_DEBOUNCE_MS = 250;

  let activeTab = $state("appearance");
  let isLoading = $state(true);
  let saveTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingSettingsPayload: Settings | null = null;
  let flushPromise: Promise<void> | null = null;

  const applicationTab = $derived.by(() => activeTab === "application");
  const behaviorTab = $derived.by(() => activeTab === "behaviors");
  const appearanceTab = $derived.by(() => activeTab === "appearance");

  function buildSettingsPayload(): Settings {
    return {
      checkForUpdates: settings.checkForUpdates,
      customTheme:
        $state.snapshot($customTheme) /* prevent issues with structuredClone */,
      debug: settings.debug,
      fallbackServer:
        settings.fallbackServer === AUTO ? "" : settings.fallbackServer,
      launchMode: settings.launchMode,
      theme: settings.theme,
    };
  }

  async function persistSettings(payload: Settings): Promise<void> {
    try {
      await client.app.updateSettings(payload);
    } catch (error) {
      console.error("Failed to persist settings", error);
    }
  }

  function queueSettingsPersist(payload: Settings): void {
    pendingSettingsPayload = payload;
    if (saveTimeoutId) clearTimeout(saveTimeoutId);
    saveTimeoutId = setTimeout(() => {
      void flushPendingSettingsPersist();
    }, SETTINGS_SAVE_DEBOUNCE_MS);
  }

  async function flushPendingSettingsPersist(): Promise<void> {
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
      saveTimeoutId = null;
    }
    if (flushPromise) {
      await flushPromise;
      return;
    }

    const run = async (): Promise<void> => {
      while (pendingSettingsPayload) {
        const payload = pendingSettingsPayload;
        pendingSettingsPayload = null;
        await persistSettings(payload);
      }
    };

    flushPromise = run().finally(() => {
      flushPromise = null;
    });
    await flushPromise;
  }

  function handleBeforeUnload(): void {
    flushQueuedTokenUpdates();
    void flushPendingSettingsPersist();
  }

  function handleVisibilityChange(): void {
    if (document.visibilityState === "hidden") {
      flushQueuedTokenUpdates();
      void flushPendingSettingsPersist();
    }
  }

  async function loadData() {
    const [settingsResult, serializedServerData] = await Promise.allSettled([
      client.app.getSettings(),
      client.app.getServers(),
    ]);

    if (settingsResult.status === "fulfilled") {
      const settingsVal = settingsResult.value;
      settings.checkForUpdates = settingsVal.checkForUpdates;
      settings.debug = settingsVal.debug;
      settings.fallbackServer = settingsVal.fallbackServer || AUTO;
      settings.launchMode = settingsVal.launchMode;
      settings.theme = settingsVal.theme;
      customTheme.set(settingsVal.customTheme ?? {});
    } else {
      console.error("Failed to load settings", settingsResult.reason);
    }

    if (serializedServerData.status === "fulfilled") {
      const serverData = Result.deserialize<ServerData[], unknown>(
        serializedServerData.value,
      );
      if (serverData.isOk()) {
        servers.set(serverData.value);
      } else {
        console.error("Failed to load servers", serverData.error);
        servers.set([]);
      }
    }

    activeEditScheme.set(getColorScheme());
    isLoading = false;
  }

  handlers.app.themeUpdated.listen(
    (theme) => {
      console.log(`got theme update: ${theme}`);
      settings.theme = theme;
    },
  );


  onMount(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const schemeObserver = new MutationObserver(() => {
      liveScheme.set(getColorScheme());
    });
    schemeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    void loadData();

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      schemeObserver.disconnect();
      flushQueuedTokenUpdates();
      if (saveTimeoutId) {
        clearTimeout(saveTimeoutId);
        saveTimeoutId = null;
      }
      void flushPendingSettingsPersist();
    };
  });

  $effect(() => {
    if (isLoading) return;
    applyCustomTheme($state.snapshot($customTheme), $liveScheme);
  });

  $effect(() => {
    if (isLoading) return;
    const scheme =
      settings.theme === "light"
        ? "light"
        : settings.theme === "dark"
          ? "dark"
          : getColorScheme();
    document.documentElement.classList.toggle("dark", scheme === "dark");
    liveScheme.set(scheme);
    activeEditScheme.set(scheme);
  });

  $effect(() => {
    if (isLoading) return;
    queueSettingsPersist(buildSettingsPayload());
  });
</script>

{#if isLoading}
  <div class="flex h-screen w-screen items-center justify-center">
    <Icon icon="loader" size="lg" spin />
  </div>
{:else}
  <AppFrame.Root orientation="horizontal">
    <AppFrame.Header
      title="Settings"
      orientation="horizontal"
      class="w-[200px]"
    >
      <div class="flex flex-col gap-1">
        <button
          class={cn(
            "flex w-full items-center justify-start gap-2 rounded-lg px-3 py-1 text-[13px] font-medium",
            {
              "bg-muted text-foreground": applicationTab,
              "text-muted-foreground hover:bg-muted/30 hover:text-foreground":
                !applicationTab,
            },
          )}
          onclick={() => (activeTab = "application")}
          tabindex={0}
        >
          <Icon icon="settings" size="xs" />
          Application
        </button>
        <button
          class={cn(
            "flex w-full items-center justify-start gap-2 rounded-lg px-3 py-1 text-[13px] font-medium",
            {
              "bg-muted text-foreground": behaviorTab,
              "text-muted-foreground hover:bg-muted/30 hover:text-foreground":
                !behaviorTab,
            },
          )}
          onclick={() => (activeTab = "behaviors")}
          tabindex={0}
        >
          <Icon icon="sliders_horizontal" size="xs" />
          Behaviors
        </button>
        <button
          class={cn(
            "flex w-full items-center justify-start gap-2 rounded-lg px-3 py-1 text-[13px] font-medium",
            {
              "bg-muted text-foreground": appearanceTab,
              "text-muted-foreground hover:bg-muted/30 hover:text-foreground":
                !appearanceTab,
            },
          )}
          onclick={() => (activeTab = "appearance")}
          tabindex={0}
        >
          <Icon icon="palette" size="xs" />
          Appearance
        </button>
      </div>
    </AppFrame.Header>
    <AppFrame.Body>
      {#if behaviorTab}
        <BehaviorsSection />
      {:else if appearanceTab}
        <AppearanceSection />
      {:else if applicationTab}
        <ApplicationSection />
      {/if}
    </AppFrame.Body>
  </AppFrame.Root>
{/if}
