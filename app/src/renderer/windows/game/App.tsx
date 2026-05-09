/* @refresh reload */
import "../../polyfills";
import "./entrypoint";
import "./style.css";
import { Spinner } from "@vexed/ui";
import { mountWindow } from "../mount";
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
import type { AccountGameLaunchPayload } from "../../../shared/ipc";
import type { WindowId } from "../../../shared/windows";
import { runtime } from "./Runtime";
import { Settings, type SettingsShape } from "./flash/Services/Settings";
import { Auth } from "./flash/Services/Auth";
import { Bank } from "./flash/Services/Bank";
import { Player } from "./flash/Services/Player";
import { World } from "./flash/Services/World";
import { AutoRelogin } from "./features/Services/AutoRelogin";
import { TopNav } from "./TopNav";
import { createGameCommands } from "./commands";
import { GameHotkeys } from "./hotkeys";
import {
  getGameLoadState,
  onGameLoaded,
  subscribeGameLoadState,
} from "./loadState";
import type { GameTopNavMenu, TopNavOptionItem } from "./topNavOptions";

const ACCOUNT_SCRIPT_STATUS_POLL_MS = 1000;
const DEFAULT_CELL = "Enter";
const DEFAULT_PAD = "Spawn";
const DEFAULT_PADS = [
  "Spawn",
  "Center",
  "Left",
  "Right",
  "Top",
  "Bottom",
  "Up",
  "Down",
] as const;

const uniqueNonEmpty = (values: readonly string[]): string[] => [
  ...new Set(values.map((value) => value.trim()).filter(Boolean)),
];

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
  const [playerLoggedIn, setPlayerLoggedIn] = createSignal(false);
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
  const [cells, setCells] = createSignal<readonly string[]>([DEFAULT_CELL]);
  const [pads] = createSignal<readonly string[]>(DEFAULT_PADS);
  const [validPads, setValidPads] = createSignal<readonly string[]>([]);
  const [selectedCell, setSelectedCell] = createSignal(DEFAULT_CELL);
  const [selectedPad, setSelectedPad] = createSignal(DEFAULT_PAD);
  const [travelBusy, setTravelBusy] = createSignal(false);

  let settingsStateDisposer: (() => void) | undefined;
  let autoReloginStateDisposer: (() => void) | undefined;

  const openWindow = (id: WindowId) => {
    void window.ipc.windows.open(id).catch((error: unknown) => {
      console.error(`Failed to open window ${id}:`, error);
    });
  };

  const updateAccountLaunchStatus = (
    payload: AccountGameLaunchPayload,
    status: "starting" | "running" | "stopped" | "failed",
    message: string,
  ) => {
    void window.ipc.accounts
      .updateScriptStatus({
        username: payload.account.username,
        gameWindowId: payload.gameWindowId,
        status,
        message,
        ...(payload.script === undefined
          ? {}
          : { scriptName: payload.script.name ?? payload.script.path }),
      })
      .catch((error: unknown) => {
        console.error("Failed to update account launch status:", error);
      });
  };

  const waitForAccountScriptStop = async (
    payload: AccountGameLaunchPayload,
    name: string,
  ): Promise<void> => {
    let lastMessage = "";

    while (true) {
      await new Promise((resolve) =>
        setTimeout(resolve, ACCOUNT_SCRIPT_STATUS_POLL_MS),
      );

      if (!window.cmd) {
        throw new Error("Script bridge is not ready");
      }

      const [isRunning, currentCommand] = await Promise.all([
        window.cmd.isRunning(),
        window.cmd.currentCommand(),
      ]);

      if (!isRunning) {
        setScriptRunning(false);
        setScriptStatus(`Stopped ${name}`);
        updateAccountLaunchStatus(payload, "stopped", `Stopped ${name}`);
        return;
      }

      const nextMessage = formatScriptStatus(true, true, currentCommand);
      setScriptRunning(true);
      setScriptStatus(nextMessage);

      if (nextMessage !== lastMessage) {
        updateAccountLaunchStatus(payload, "running", nextMessage);
        lastMessage = nextMessage;
      }
    }
  };

  const waitForLoadedGame = (): Promise<void> => {
    if (getGameLoadState().loaded) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const dispose = onGameLoaded(
        () => {
          dispose();
          resolve();
        },
        { emitCurrent: true },
      );
    });
  };

  const handleAccountLaunch = (payload: AccountGameLaunchPayload) => {
    updateAccountLaunchStatus(payload, "starting", "Waiting for game loader");

    void waitForLoadedGame()
      .then(() =>
        runtime.runPromise(
          Effect.gen(function* () {
            const autoRelogin = yield* AutoRelogin;
            return yield* autoRelogin.login({
              username: payload.account.username,
              password: payload.account.password,
              ...(payload.server === undefined
                ? {}
                : { server: payload.server }),
            });
          }),
        ),
      )
      .then(async (outcome) => {
        if (outcome.stage === "server-select") {
          updateAccountLaunchStatus(
            payload,
            "stopped",
            payload.script
              ? "Select a server to run the script"
              : "Waiting for server selection",
          );
          return;
        }

        if (!payload.script) {
          setScriptRunning(false);
          setScriptStatus("Player ready");
          updateAccountLaunchStatus(payload, "running", "Player ready");
          return;
        }

        if (!window.cmd) {
          throw new Error("Script bridge is not ready");
        }

        const name = payload.script.name ?? payload.script.path ?? "script";
        updateAccountLaunchStatus(payload, "running", `Running ${name}`);
        await window.cmd.run(payload.script.source, name);
        setScriptRunning(true);
        setScriptStatus(`Running ${name}`);
        updateAccountLaunchStatus(payload, "running", `Running ${name}`);
        await waitForAccountScriptStop(payload, name);
      })
      .catch((error: unknown) => {
        console.error("Failed to run account launch:", error);
        updateAccountLaunchStatus(
          payload,
          "failed",
          error instanceof Error ? error.message : "Account launch failed",
        );
      })
      .finally(() => {
        void refreshScriptMeta();
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

  const refreshPlayerLoginState = () => {
    if (!getGameLoadState().loaded) {
      setPlayerLoggedIn(false);
      return;
    }

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const auth = yield* Auth;
          return yield* auth.isLoggedIn();
        }),
      )
      .then((isLoggedIn) => {
        const wasLoggedIn = playerLoggedIn();
        setPlayerLoggedIn(isLoggedIn);
        if (isLoggedIn && !wasLoggedIn) {
          refreshTravelOptions();
        }
      })
      .catch((error) => {
        setPlayerLoggedIn(false);
        console.error("Refresh login state error:", error);
      });
  };

  const refreshTravelOptions = () => {
    if (!getGameLoadState().loaded || !playerLoggedIn()) {
      return;
    }

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const auth = yield* Auth;
          const isLoggedIn = yield* auth.isLoggedIn();
          if (!isLoggedIn) {
            return null;
          }

          const world = yield* World;
          const player = yield* Player;
          const [mapCells, mapPads, currentCell, currentPad] =
            yield* Effect.all([
              world.map.getCells(),
              world.map.getCellPads(),
              player.getCell(),
              player.getPad(),
            ]);

          return { currentCell, currentPad, mapCells, mapPads };
        }),
      )
      .then((result) => {
        if (result === null) {
          return;
        }

        const { currentCell, currentPad, mapCells, mapPads } = result;
        const nextCells = uniqueNonEmpty([...mapCells, currentCell]);
        const nextValidPads = uniqueNonEmpty([currentPad, ...mapPads]);

        setCells(nextCells.length > 0 ? nextCells : [DEFAULT_CELL]);
        setValidPads(nextValidPads);
        setSelectedCell(currentCell || nextCells[0] || DEFAULT_CELL);
        setSelectedPad(currentPad || DEFAULT_PAD);
      })
      .catch((error) => {
        console.error("Refresh travel options error:", error);
      });
  };

  const jumpToCellPad = (cell: string, pad: string) => {
    const targetCell = cell.trim() || DEFAULT_CELL;
    const targetPad = pad.trim();

    setTravelBusy(true);
    setSelectedCell(targetCell);
    if (targetPad) {
      setSelectedPad(targetPad);
    }
    setOpenTopNavMenu(null);

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const player = yield* Player;
          yield* player.jumpToCell(
            targetCell,
            targetPad.length > 0 ? targetPad : undefined,
            true,
          );
          const [currentCell, currentPad] = yield* Effect.all([
            player.getCell(),
            player.getPad(),
          ]);
          return { currentCell, currentPad };
        }),
      )
      .then(({ currentCell, currentPad }) => {
        setSelectedCell(currentCell || targetCell);
        setSelectedPad(currentPad || targetPad || DEFAULT_PAD);
        refreshTravelOptions();
      })
      .catch((error) => {
        console.error("Jump to cell/pad error:", error);
      })
      .finally(() => {
        setTravelBusy(false);
      });
  };

  const handleSelectCell = (cell: string) => {
    jumpToCellPad(cell, selectedPad());
  };

  const handleSelectPad = (pad: string) => {
    jumpToCellPad(selectedCell(), pad);
  };

  const handleOpenBank = () => {
    setOpenTopNavMenu(null);
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const bank = yield* Bank;
          yield* bank.open();
        }),
      )
      .catch((error) => {
        console.error("Open bank error:", error);
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
    const unsubscribeAccountLaunch =
      window.ipc.accounts.onGameLaunch(handleAccountLaunch);

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
      if (!state.loaded) {
        setPlayerLoggedIn(false);
      }
    });

    refreshPlayerLoginState();
    const loginStateInterval = setInterval(refreshPlayerLoginState, 1200);

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
      unsubscribeAccountLaunch();
      disposeGameLoadState();
      clearInterval(scriptMetaInterval);
      clearInterval(loginStateInterval);
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
      <TopNav
        openMenu={openTopNavMenu}
        setOpenMenu={setOpenTopNavMenu}
        hotkeyBindings={() => settings().hotkeys.bindings}
        hotkeyPlatform={window.ipc.platform.os}
        autoAttackEnabled={autoAttackEnabled}
        setAutoAttackEnabled={setAutoAttackEnabled}
        gameLoaded={gameLoaded}
        playerLoggedIn={playerLoggedIn}
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
        cells={cells}
        pads={pads}
        validPads={validPads}
        selectedCell={selectedCell}
        selectedPad={selectedPad}
        travelBusy={travelBusy}
        handleRefreshTravelOptions={refreshTravelOptions}
        handleSelectCell={handleSelectCell}
        handleSelectPad={handleSelectPad}
        handleOpenBank={handleOpenBank}
      />

      <section
        id="loader-container"
        class="game-loader"
        classList={{ "game-loader--hidden": gameLoaded() }}
        aria-hidden={gameLoaded() ? "true" : undefined}
        aria-live="polite"
      >
        <div class="game-loader__content">
          <Spinner class="game-loader__spinner" size="xl" />
          <span id="progress-text">Loading...</span>
        </div>
      </section>

      <section
        id="game-container"
        class="game-viewport"
        classList={{ "game-viewport--loaded": gameLoaded() }}
      >
        <div class="game-visual-cover" aria-hidden="true" />
      </section>
    </main>
  );
}

mountWindow(({ initialSettings }) => <App initialSettings={initialSettings} />);
