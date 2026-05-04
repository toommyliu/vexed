import "./style.css";
import { Effect } from "effect";
import {
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  type JSX,
} from "solid-js";
import {
  DEFAULT_APPEARANCE,
  DEFAULT_HOTKEYS,
  DEFAULT_PREFERENCES,
  type AppSettings,
} from "../../../shared/settings";
import type { WindowId } from "../../../shared/windows";
import { runtime } from "./Runtime";
import { Settings, type SettingsShape } from "./flash/Services/Settings";
import { AutoRelogin } from "./features/Services/AutoRelogin";
import { GameTopNav } from "./GameTopNav";
import { createGameCommands } from "./commands";
import { GameHotkeys } from "./hotkeys";
import { getGameLoadState, subscribeGameLoadState } from "./loadState";
import type { GameTopNavMenu, TopNavOptionItem } from "./topNavOptions";

const formatScriptStatus = (
  loaded: boolean,
  running: boolean,
  currentCommand: RunningScriptCommand | null,
) => {
  if (running && currentCommand) {
    return `Running #${currentCommand.index} ${currentCommand.name}`;
  }

  if (running) {
    return "Running";
  }

  return loaded ? "Loaded" : "No script loaded";
};

const defaultSettings: AppSettings = {
  preferences: DEFAULT_PREFERENCES,
  appearance: DEFAULT_APPEARANCE,
  hotkeys: DEFAULT_HOTKEYS,
};

export default function App(props: {
  readonly initialSettings?: AppSettings | null;
}): JSX.Element {
  const [settings, setSettings] = createSignal<AppSettings>(
    props.initialSettings ?? defaultSettings,
  );
  const [gameLoaded, setGameLoaded] = createSignal(getGameLoadState().loaded);
  const [autoAttackEnabled, setAutoAttackEnabled] = createSignal(false);
  const [scriptName, setScriptName] = createSignal("");
  const [scriptSource, setScriptSource] = createSignal("");
  const [scriptLoaded, setScriptLoaded] = createSignal(false);
  const [scriptRunning, setScriptRunning] = createSignal(false);
  const [scriptCommandCount, setScriptCommandCount] = createSignal(0);
  const [scriptStatus, setScriptStatus] = createSignal("No script loaded");
  const [scriptDiagnosticsCount, setScriptDiagnosticsCount] = createSignal(0);

  const [customName, setCustomName] = createSignal("");
  const [customGuild, setCustomGuild] = createSignal("");
  const [walkSpeed, setWalkSpeed] = createSignal("8");
  const [frameRate, setFrameRate] = createSignal("24");
  const [deathAdsVisible, setDeathAdsVisible] = createSignal(false);
  const [collisionsEnabled, setCollisionsEnabled] = createSignal(true);
  const [effectsEnabled, setEffectsEnabled] = createSignal(true);
  const [otherPlayersVisible, setOtherPlayersVisible] = createSignal(true);
  const [lagKillerEnabled, setLagKillerEnabled] = createSignal(false);
  const [enemyMagnetEnabled, setEnemyMagnetEnabled] = createSignal(false);
  const [infiniteRangeEnabled, setInfiniteRangeEnabled] = createSignal(false);
  const [provokeCellEnabled, setProvokeCellEnabled] = createSignal(false);
  const [skipCutscenesEnabled, setSkipCutscenesEnabled] = createSignal(false);

  const [autoReloginEnabled, setAutoReloginEnabled] = createSignal(false);
  const [autoReloginCaptured, setAutoReloginCaptured] = createSignal(false);
  const [autoReloginAttempting, setAutoReloginAttempting] = createSignal(false);
  const [autoReloginDelayMs, setAutoReloginDelayMs] = createSignal("3000");
  const [autoReloginUsername, setAutoReloginUsername] = createSignal("");
  const [autoReloginServer, setAutoReloginServer] = createSignal("");
  const [autoReloginLastError, setAutoReloginLastError] = createSignal("");
  const [openTopNavMenu, setOpenTopNavMenu] =
    createSignal<GameTopNavMenu | null>(null);

  let settingsStateDisposer: (() => void) | undefined;
  let autoReloginStateDisposer: (() => void) | undefined;

  const openWindow = (id: WindowId) => {
    void window.ipc.windows.open(id).catch((error: unknown) => {
      console.error(`Failed to open window ${id}:`, error);
    });
  };

  const refreshScriptMeta = async () => {
    if (!window.cmd) {
      setScriptStatus("Script bridge is not ready");
      return;
    }

    try {
      const [commands, isRunning, currentCommand, diagnostics] =
        await Promise.all([
          window.cmd.listCommands(),
          window.cmd.isRunning(),
          window.cmd.currentCommand(),
          window.cmd.diagnostics(),
        ]);

      setScriptCommandCount(commands.length);
      setScriptRunning(isRunning);
      setScriptDiagnosticsCount(diagnostics.length);
      setScriptStatus(
        formatScriptStatus(scriptLoaded(), isRunning, currentCommand),
      );
    } catch (error) {
      console.error("Failed to refresh script metadata", error);
      setScriptStatus("Failed to refresh script state");
    }
  };

  const loadScript = async () => {
    if (!window.cmd) {
      setScriptStatus("Script bridge is not ready");
      return;
    }

    try {
      const payload = await window.cmd.open();
      if (!payload) {
        setScriptStatus("Open script cancelled");
        return;
      }

      setScriptName(payload.name ?? payload.path ?? "script");
      setScriptSource(payload.source);
      setScriptLoaded(true);
      setScriptStatus(`Loaded ${payload.name ?? payload.path ?? "script"}`);
      void refreshScriptMeta();
    } catch (error) {
      console.error("Failed to load script", error);
      setScriptStatus("Failed to load script");
    }
  };

  const startScript = () => {
    if (!window.cmd) {
      setScriptStatus("Script bridge is not ready");
      return;
    }

    const source = scriptSource().trim();
    if (!source) {
      setScriptStatus("No script loaded");
      return;
    }

    const name = scriptName() || "script";
    setScriptStatus(`Starting ${name}`);
    void window.cmd
      .run(source, name)
      .then(() => {
        setScriptRunning(true);
        setScriptStatus(`Running ${name}`);
      })
      .catch((error) => {
        console.error("Failed to start script", error);
        setScriptStatus(`Failed to start ${name}`);
      })
      .finally(() => {
        void refreshScriptMeta();
      });
  };

  const stopScript = () => {
    if (!window.cmd) {
      setScriptStatus("Script bridge is not ready");
      return;
    }

    window.cmd.stop();
    setScriptRunning(false);
    setScriptStatus("Stop requested");
    void refreshScriptMeta();
  };

  const runSettingsEffect = (
    label: string,
    effect: (settings: SettingsShape) => Effect.Effect<void, unknown>,
  ) => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const settings = yield* Settings;
          yield* effect(settings);
        }),
      )
      .catch((error) => {
        console.error(`${label} error:`, error);
      });
  };

  const handleToggleEnemyMagnet = () => {
    const nextEnabled = !enemyMagnetEnabled();
    setEnemyMagnetEnabled(nextEnabled);
    runSettingsEffect("Toggle enemy magnet", (settings) =>
      settings.setEnemyMagnetEnabled(nextEnabled),
    );
  };

  const handleToggleInfiniteRange = () => {
    const nextEnabled = !infiniteRangeEnabled();
    setInfiniteRangeEnabled(nextEnabled);
    runSettingsEffect("Toggle infinite range", (settings) =>
      settings.setInfiniteRangeEnabled(nextEnabled),
    );
  };

  const handleToggleProvokeCell = () => {
    const nextEnabled = !provokeCellEnabled();
    setProvokeCellEnabled(nextEnabled);
    runSettingsEffect("Toggle provoke cell", (settings) =>
      settings.setProvokeCellEnabled(nextEnabled),
    );
  };

  const handleToggleSkipCutscenes = () => {
    const nextEnabled = !skipCutscenesEnabled();
    setSkipCutscenesEnabled(nextEnabled);
    runSettingsEffect("Toggle skip cutscenes", (settings) =>
      settings.setSkipCutscenesEnabled(nextEnabled),
    );
  };

  const handleToggleDeathAds = () => {
    const nextVisible = !deathAdsVisible();
    setDeathAdsVisible(nextVisible);
    runSettingsEffect("Toggle death ads", (settings) =>
      settings.setDeathAdsVisible(nextVisible),
    );
  };

  const handleToggleCollisions = () => {
    const nextEnabled = !collisionsEnabled();
    setCollisionsEnabled(nextEnabled);
    runSettingsEffect("Toggle collisions", (settings) =>
      settings.setCollisionsEnabled(nextEnabled),
    );
  };

  const handleToggleEffects = () => {
    const nextEnabled = !effectsEnabled();
    setEffectsEnabled(nextEnabled);
    runSettingsEffect("Toggle effects", (settings) =>
      settings.setEffectsEnabled(nextEnabled),
    );
  };

  const handleTogglePlayersVisible = () => {
    const nextVisible = !otherPlayersVisible();
    setOtherPlayersVisible(nextVisible);
    runSettingsEffect("Toggle players visible", (settings) =>
      settings.setOtherPlayersVisible(nextVisible),
    );
  };

  const handleToggleLagKiller = () => {
    const nextEnabled = !lagKillerEnabled();
    setLagKillerEnabled(nextEnabled);
    runSettingsEffect("Toggle lag killer", (settings) =>
      settings.setLagKillerEnabled(nextEnabled),
    );
  };

  const handleSetCustomName = () => {
    runSettingsEffect("Set custom name", (settings) =>
      settings.setCustomName(customName()),
    );
  };

  const handleSetCustomGuild = () => {
    runSettingsEffect("Set custom guild", (settings) =>
      settings.setCustomGuild(customGuild()),
    );
  };

  const handleSetWalkSpeed = () => {
    const speed = Number.parseFloat(walkSpeed());
    if (!Number.isFinite(speed) || speed <= 0) {
      setWalkSpeed("8");
      return;
    }

    runSettingsEffect("Set walk speed", (settings) =>
      settings.setWalkSpeed(speed),
    );
  };

  const handleSetFrameRate = () => {
    const fps = Number.parseInt(frameRate(), 10);
    if (!Number.isFinite(fps) || fps <= 0) {
      setFrameRate("24");
      return;
    }

    runSettingsEffect("Set frame rate", (settings) =>
      settings.setFrameRate(fps),
    );
  };

  const refreshAutoReloginState = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const autoRelogin = yield* AutoRelogin;
          return yield* autoRelogin.getState();
        }),
      )
      .then((state) => {
        setAutoReloginEnabled(state.enabled);
        setAutoReloginCaptured(state.captured);
        setAutoReloginAttempting(state.attempting);
        setAutoReloginDelayMs(String(state.delayMs));
        setAutoReloginUsername(state.username ?? "");
        setAutoReloginServer(state.server ?? "");
        setAutoReloginLastError(state.lastError ?? "");
      })
      .catch((error) => {
        console.error("Refresh autorelogin state error:", error);
      });
  };

  const handleToggleAutoRelogin = () => {
    const nextEnabled = !autoReloginEnabled();
    setAutoReloginEnabled(nextEnabled);

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const autoRelogin = yield* AutoRelogin;
          return yield* nextEnabled
            ? autoRelogin.enable()
            : autoRelogin.disable();
        }),
      )
      .then((state) => {
        setAutoReloginEnabled(state.enabled);
        setAutoReloginCaptured(state.captured);
        setAutoReloginAttempting(state.attempting);
        setAutoReloginDelayMs(String(state.delayMs));
        setAutoReloginUsername(state.username ?? "");
        setAutoReloginServer(state.server ?? "");
        setAutoReloginLastError(state.lastError ?? "");
      })
      .catch((error) => {
        console.error("Toggle autorelogin error:", error);
        refreshAutoReloginState();
      });
  };

  const handleCaptureAutoReloginSession = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const autoRelogin = yield* AutoRelogin;
          return yield* autoRelogin.captureCurrentSession();
        }),
      )
      .then(() => refreshAutoReloginState())
      .catch((error) => {
        console.error("Capture autorelogin session error:", error);
        refreshAutoReloginState();
      });
  };

  const handleSetAutoReloginDelay = () => {
    const delayMs = Number.parseInt(autoReloginDelayMs(), 10);
    if (!Number.isFinite(delayMs) || delayMs < 0) {
      refreshAutoReloginState();
      return;
    }

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const autoRelogin = yield* AutoRelogin;
          return yield* autoRelogin.setDelayMs(delayMs);
        }),
      )
      .then((state) => {
        setAutoReloginDelayMs(String(state.delayMs));
        setAutoReloginLastError(state.lastError ?? "");
      })
      .catch((error) => {
        console.error("Set autorelogin delay error:", error);
        refreshAutoReloginState();
      });
  };

  const optionItems = createMemo<readonly TopNavOptionItem[]>(() => [
    {
      id: "infinite-range",
      label: "Infinite Range",
      checked: infiniteRangeEnabled(),
      onSelect: handleToggleInfiniteRange,
    },
    {
      id: "provoke-cell",
      label: "Provoke Cell",
      checked: provokeCellEnabled(),
      onSelect: handleToggleProvokeCell,
    },
    {
      id: "enemy-magnet",
      label: "Enemy Magnet",
      checked: enemyMagnetEnabled(),
      onSelect: handleToggleEnemyMagnet,
    },
    {
      id: "lag-killer",
      label: "Lag Killer",
      checked: lagKillerEnabled(),
      onSelect: handleToggleLagKiller,
    },
    {
      id: "hide-players",
      label: "Hide Players",
      checked: !otherPlayersVisible(),
      onSelect: handleTogglePlayersVisible,
    },
    {
      id: "skip-cutscenes",
      label: "Skip Cutscenes",
      checked: skipCutscenesEnabled(),
      onSelect: handleToggleSkipCutscenes,
    },
    {
      id: "disable-fx",
      label: "Disable FX",
      checked: !effectsEnabled(),
      onSelect: handleToggleEffects,
    },
    {
      id: "collisions",
      label: "Collisions",
      checked: collisionsEnabled(),
      onSelect: handleToggleCollisions,
    },
    {
      id: "death-ads",
      label: "Death Ads",
      checked: deathAdsVisible(),
      onSelect: handleToggleDeathAds,
    },
  ]);

  const gameCommands = createGameCommands({
    bindings: () => settings().hotkeys.bindings,
    loadScript,
    startScript,
    stopScript,
    scriptLoaded,
    scriptRunning,
    setAutoAttackEnabled,
    autoAttackEnabled,
    optionItems,
    openWindow,
    openTopNavMenu: (menu) => setOpenTopNavMenu(menu),
  });

  onMount(() => {
    const unsubscribeAppSettings = window.ipc.settings.onChanged(setSettings);

    if (props.initialSettings === undefined || props.initialSettings === null) {
      void window.ipc.settings
        .get()
        .then(setSettings)
        .catch((error) => {
          console.error("Failed to load app settings:", error);
        });
    }

    const disposeGameLoadState = subscribeGameLoadState((state) => {
      setGameLoaded(state.loaded);
    });

    void refreshScriptMeta();
    const scriptMetaInterval = setInterval(() => {
      void refreshScriptMeta();
    }, 1200);

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const settings = yield* Settings;
          return yield* settings.onState((state) => {
            setCustomName(state.customName ?? "");
            setCustomGuild(state.customGuild ?? "");
            setWalkSpeed(String(state.walkSpeed));
            setFrameRate(String(state.frameRate));
            setDeathAdsVisible(state.deathAdsVisible);
            setCollisionsEnabled(state.collisionsEnabled);
            setEffectsEnabled(state.effectsEnabled);
            setOtherPlayersVisible(state.otherPlayersVisible);
            setLagKillerEnabled(state.lagKillerEnabled);
            setEnemyMagnetEnabled(state.enemyMagnetEnabled);
            setInfiniteRangeEnabled(state.infiniteRangeEnabled);
            setProvokeCellEnabled(state.provokeCellEnabled);
            setSkipCutscenesEnabled(state.skipCutscenesEnabled);
          });
        }),
      )
      .then((dispose) => {
        settingsStateDisposer = dispose;
      })
      .catch((error) => {
        console.error("Settings state subscription error:", error);
      });

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const autoRelogin = yield* AutoRelogin;
          return yield* autoRelogin.onState((state) => {
            setAutoReloginEnabled(state.enabled);
            setAutoReloginCaptured(state.captured);
            setAutoReloginAttempting(state.attempting);
            setAutoReloginDelayMs(String(state.delayMs));
            setAutoReloginUsername(state.username ?? "");
            setAutoReloginServer(state.server ?? "");
            setAutoReloginLastError(state.lastError ?? "");
          });
        }),
      )
      .then((dispose) => {
        autoReloginStateDisposer = dispose;
      })
      .catch((error) => {
        console.error("AutoRelogin state subscription error:", error);
      });

    onCleanup(() => {
      unsubscribeAppSettings();
      disposeGameLoadState();
      clearInterval(scriptMetaInterval);
    });
  });

  onCleanup(() => {
    settingsStateDisposer?.();
    autoReloginStateDisposer?.();
  });

  return (
    <main class="game-shell">
      <GameHotkeys
        bindings={() => settings().hotkeys.bindings}
        commands={() => gameCommands}
      />
      <GameTopNav
        openMenu={openTopNavMenu}
        setOpenMenu={setOpenTopNavMenu}
        hotkeyBindings={() => settings().hotkeys.bindings}
        hotkeyPlatform={window.ipc.platform.os}
        autoAttackEnabled={autoAttackEnabled}
        setAutoAttackEnabled={setAutoAttackEnabled}
        scriptLoaded={scriptLoaded}
        scriptRunning={scriptRunning}
        scriptStatus={scriptStatus}
        scriptCommandCount={scriptCommandCount}
        scriptDiagnosticsCount={scriptDiagnosticsCount}
        loadScript={loadScript}
        startScript={startScript}
        stopScript={stopScript}
        optionItems={optionItems}
        walkSpeed={walkSpeed}
        setWalkSpeed={setWalkSpeed}
        handleSetWalkSpeed={handleSetWalkSpeed}
        frameRate={frameRate}
        setFrameRate={setFrameRate}
        handleSetFrameRate={handleSetFrameRate}
        customName={customName}
        setCustomName={setCustomName}
        handleSetCustomName={handleSetCustomName}
        customGuild={customGuild}
        setCustomGuild={setCustomGuild}
        handleSetCustomGuild={handleSetCustomGuild}
        autoReloginEnabled={autoReloginEnabled}
        autoReloginCaptured={autoReloginCaptured}
        autoReloginAttempting={autoReloginAttempting}
        autoReloginDelayMs={autoReloginDelayMs}
        setAutoReloginDelayMs={setAutoReloginDelayMs}
        autoReloginUsername={autoReloginUsername}
        autoReloginServer={autoReloginServer}
        autoReloginLastError={autoReloginLastError}
        handleCaptureAutoReloginSession={handleCaptureAutoReloginSession}
        handleToggleAutoRelogin={handleToggleAutoRelogin}
        handleSetAutoReloginDelay={handleSetAutoReloginDelay}
      />

      <section
        id="loader-container"
        class="game-loader"
        classList={{ "game-loader--hidden": gameLoaded() }}
        aria-hidden={gameLoaded() ? "true" : undefined}
        aria-live="polite"
      >
        <div class="game-loader__content">
          <div class="game-loader__spinner" aria-hidden="true" />
          <span id="progress-text">Loading...</span>
        </div>
      </section>

      <section
        id="game-container"
        class="game-viewport"
        classList={{ "game-viewport--loaded": gameLoaded() }}
      />
    </main>
  );
}
