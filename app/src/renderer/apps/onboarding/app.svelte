<script lang="ts">
  import { cn, Icon } from "@vexed/ui";
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
  import { client } from "~/shared/tipc";
  import { applyCustomTheme, getColorScheme } from "../../shared/theme";

  const AUTO = "Auto (first available)";
  const SETTINGS_SAVE_DEBOUNCE_MS = 250;

  let activeTab = $state("appearance");
  let isLoading = $state(true);
  let saveTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingSettingsPayload: Settings | null = null;
  let flushPromise: Promise<void> | null = null;

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

  // Immediately apply theme changes locally for responsiveness
  // and then debounce the persistence to avoid excessive I/O ops
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

<div class="flex h-screen w-screen overflow-hidden bg-background">
  {#if isLoading}
    <div class="flex h-full w-full items-center justify-center">
      <Icon icon="loader" size="lg" spin />
    </div>
  {:else}
    <div class="flex h-full w-full flex-row">
      <nav
        class="flex w-[200px] shrink-0 flex-col gap-1 border-r border-border/50 bg-muted/5 px-3 py-6"
      >
        <h1
          class="mb-4 px-2 text-[11px] font-bold uppercase text-muted-foreground/50"
        >
          Settings
        </h1>
        <button
          class={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
            {
              "bg-muted text-foreground": activeTab === "behaviors",
              "text-muted-foreground hover:bg-muted/30 hover:text-foreground":
                activeTab !== "behaviors",
            },
          )}
          onclick={() => (activeTab = "behaviors")}
        >
          <Icon icon="wrench" size="xs" />
          Behaviors
        </button>
        <button
          class={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
            {
              "bg-muted text-foreground": activeTab === "appearance",
              "text-muted-foreground hover:bg-muted/30 hover:text-foreground":
                activeTab !== "appearance",
            },
          )}
          onclick={() => (activeTab = "appearance")}
        >
          <Icon icon="pencil" size="xs" />
          Appearance
        </button>
        <button
          class={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
            {
              "bg-muted text-foreground": activeTab === "application",
              "text-muted-foreground hover:bg-muted/30 hover:text-foreground":
                activeTab !== "application",
            },
          )}
          onclick={() => (activeTab = "application")}
        >
          <Icon icon="settings" size="xs" />
          Application
        </button>
      </nav>

      <main
        class="custom-scrollbar flex-1 overflow-y-auto px-4 py-6 focus-visible:outline-none"
      >
        {#if activeTab === "behaviors"}
          <BehaviorsSection />
        {:else if activeTab === "appearance"}
          <AppearanceSection />
        {:else if activeTab === "application"}
          <ApplicationSection />
        {/if}
      </main>
    </div>
  {/if}
</div>
