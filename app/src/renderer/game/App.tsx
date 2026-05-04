import "../styles.css";
import { Effect } from "effect";
import {
  For,
  Show,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  type JSX,
} from "solid-js";
import {
  Button,
  Checkbox,
  Input,
  Kbd,
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
  cn,
} from "@vexed/ui";
import { runtime } from "./Runtime";
import { Settings, type SettingsShape } from "./flash/Services/Settings";
import { AutoRelogin } from "./features/Services/AutoRelogin";
import { getGameLoadState, subscribeGameLoadState } from "./loadState";
import { gameWindowGroups, type WindowId } from "../../shared/windows";

type OpenMenu =
  | "windows"
  | "scripts"
  | "options"
  | "relogin"
  | "pads"
  | "cells";

const defaultPads = [
  "Center",
  "Spawn",
  "Left",
  "Right",
  "Top",
  "Bottom",
  "Up",
  "Down",
] as const;

const placeholderCells = ["Enter"] as const;

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

export default function App(): JSX.Element {
  const [openMenu, setOpenMenu] = createSignal<OpenMenu | null>(null);
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

  let settingsStateDisposer: (() => void) | undefined;
  let autoReloginStateDisposer: (() => void) | undefined;

  const setMenuOpen =
    (menu: OpenMenu) =>
    (details: { readonly open: boolean }): void => {
      setOpenMenu(details.open ? menu : null);
    };

  const toggleMenu =
    (menu: OpenMenu): JSX.EventHandler<HTMLButtonElement, MouseEvent> =>
    (event) => {
      event.preventDefault();
      setOpenMenu((current) => (current === menu ? null : menu));
    };

  const openWindow = (id: WindowId) => {
    void window.ipc.windows.open(id).catch((error: unknown) => {
      console.error(`Failed to open window ${id}:`, error);
    });
    setOpenMenu(null);
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

  const optionItems = createMemo(() => [
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
      id: "disable-collisions",
      label: "Disable Collisions",
      checked: !collisionsEnabled(),
      onSelect: handleToggleCollisions,
    },
    {
      id: "disable-death-ads",
      label: "Disable Death Ads",
      checked: !deathAdsVisible(),
      onSelect: handleToggleDeathAds,
    },
  ]);

  onMount(() => {
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
      <div id="topnav-container" class="game-topnav-container">
        <nav id="topnav" class="game-topnav" aria-label="Game controls">
          <div class="game-topnav__left">
            <Menu
              open={openMenu() === "windows"}
              onOpenChange={setMenuOpen("windows")}
            >
              <MenuTrigger
                class="game-topnav__trigger"
                data-expanded={openMenu() === "windows" ? "" : undefined}
                onClick={toggleMenu("windows")}
              >
                Windows
              </MenuTrigger>
              <MenuContent class="game-menu game-menu--mega" portal={false}>
                <div class="game-menu__mega-grid">
                  <For each={gameWindowGroups}>
                    {(group) => (
                      <MenuGroup class="game-menu__group">
                        <MenuLabel>{group.name}</MenuLabel>
                        <For each={group.items}>
                          {(item) => (
                            <MenuItem
                              class="game-menu__item"
                              onSelect={() => openWindow(item.id)}
                              value={item.id}
                            >
                              <span class="game-menu__item-label">
                                {item.label}
                              </span>
                            </MenuItem>
                          )}
                        </For>
                      </MenuGroup>
                    )}
                  </For>
                </div>
              </MenuContent>
            </Menu>

            <div class="game-topnav__divider" />

            <Menu
              open={openMenu() === "scripts"}
              onOpenChange={setMenuOpen("scripts")}
            >
              <MenuTrigger
                class="game-topnav__trigger"
                data-expanded={openMenu() === "scripts" ? "" : undefined}
                onClick={toggleMenu("scripts")}
              >
                Scripts
              </MenuTrigger>
              <MenuContent class="game-menu game-menu--scripts" portal={false}>
                <MenuGroup>
                  <MenuItem
                    class="game-menu__item"
                    onSelect={() => void loadScript()}
                    value="load-script"
                  >
                    <span class="game-menu__item-label">Load Script</span>
                    <Kbd>Cmd/Ctrl+O</Kbd>
                  </MenuItem>
                  <MenuItem
                    class="game-menu__item"
                    disabled={!scriptLoaded() || scriptRunning()}
                    onSelect={startScript}
                    value="start-script"
                  >
                    <span class="game-menu__item-label">Start</span>
                  </MenuItem>
                  <MenuItem
                    class="game-menu__item"
                    disabled={!scriptRunning()}
                    onSelect={stopScript}
                    value="stop-script"
                    variant="destructive"
                  >
                    <span class="game-menu__item-label">Stop</span>
                    <Kbd>Cmd/Ctrl+Shift+X</Kbd>
                  </MenuItem>
                </MenuGroup>
                <MenuSeparator />
                <div class="game-menu__status">
                  <span>{scriptStatus()}</span>
                  <span>{scriptCommandCount()} commands</span>
                  <Show when={scriptDiagnosticsCount() > 0}>
                    <span>{scriptDiagnosticsCount()} diagnostics</span>
                  </Show>
                </div>
              </MenuContent>
            </Menu>

            <Menu
              open={openMenu() === "options"}
              onOpenChange={setMenuOpen("options")}
            >
              <MenuTrigger
                class="game-topnav__trigger"
                data-expanded={openMenu() === "options" ? "" : undefined}
                onClick={toggleMenu("options")}
              >
                Options
              </MenuTrigger>
              <MenuContent class="game-menu game-menu--options" portal={false}>
                <div class="game-options-grid">
                  <For each={optionItems()}>
                    {(option) => (
                      <MenuCheckboxItem
                        checked={option.checked}
                        class="game-menu__item"
                        onClick={option.onSelect}
                        value={option.id}
                      >
                        {option.label}
                      </MenuCheckboxItem>
                    )}
                  </For>
                </div>
                <MenuSeparator />
                <div class="game-menu__fields">
                  <label class="game-menu__field">
                    <span>Walk Speed</span>
                    <Input
                      size="sm"
                      value={walkSpeed()}
                      onBlur={handleSetWalkSpeed}
                      onInput={(event) =>
                        setWalkSpeed(event.currentTarget.value)
                      }
                    />
                  </label>
                  <label class="game-menu__field">
                    <span>FPS</span>
                    <Input
                      size="sm"
                      value={frameRate()}
                      onBlur={handleSetFrameRate}
                      onInput={(event) =>
                        setFrameRate(event.currentTarget.value)
                      }
                    />
                  </label>
                  <label class="game-menu__field game-menu__field--wide">
                    <span>Custom Name</span>
                    <Input
                      size="sm"
                      value={customName()}
                      onBlur={handleSetCustomName}
                      onInput={(event) =>
                        setCustomName(event.currentTarget.value)
                      }
                    />
                  </label>
                  <label class="game-menu__field game-menu__field--wide">
                    <span>Custom Guild</span>
                    <Input
                      size="sm"
                      value={customGuild()}
                      onBlur={handleSetCustomGuild}
                      onInput={(event) =>
                        setCustomGuild(event.currentTarget.value)
                      }
                    />
                  </label>
                </div>
              </MenuContent>
            </Menu>

            <Menu
              open={openMenu() === "relogin"}
              onOpenChange={setMenuOpen("relogin")}
            >
              <MenuTrigger
                class={cn(
                  "game-topnav__trigger",
                  autoReloginEnabled() && "game-topnav__trigger--success",
                )}
                data-expanded={openMenu() === "relogin" ? "" : undefined}
                onClick={toggleMenu("relogin")}
              >
                Auto Relogin
              </MenuTrigger>
              <MenuContent class="game-menu game-menu--relogin" portal={false}>
                <div class="game-menu__status">
                  <span>
                    {autoReloginCaptured()
                      ? `${autoReloginUsername() || "Captured user"}${
                          autoReloginServer() ? ` @ ${autoReloginServer()}` : ""
                        }`
                      : "No captured session"}
                  </span>
                  <Show when={autoReloginAttempting()}>
                    <span>Attempting reconnect</span>
                  </Show>
                  <Show when={autoReloginLastError()}>
                    {(error) => <span class="game-menu__error">{error()}</span>}
                  </Show>
                </div>
                <MenuSeparator />
                <MenuItem
                  class="game-menu__item"
                  onSelect={handleCaptureAutoReloginSession}
                  value="capture-session"
                >
                  Capture Current Session
                </MenuItem>
                <MenuItem
                  class="game-menu__item"
                  disabled={!autoReloginCaptured() && !autoReloginEnabled()}
                  onSelect={handleToggleAutoRelogin}
                  value="toggle-autorelogin"
                  variant={autoReloginEnabled() ? "destructive" : "default"}
                >
                  {autoReloginEnabled() ? "Disable" : "Enable"}
                </MenuItem>
                <MenuSeparator />
                <label class="game-menu__field">
                  <span>Delay ms</span>
                  <Input
                    size="sm"
                    value={autoReloginDelayMs()}
                    onBlur={handleSetAutoReloginDelay}
                    onInput={(event) =>
                      setAutoReloginDelayMs(event.currentTarget.value)
                    }
                  />
                </label>
              </MenuContent>
            </Menu>

            <Button
              class={cn(
                "game-topnav__button",
                scriptRunning() && "game-topnav__button--danger",
                scriptLoaded() &&
                  !scriptRunning() &&
                  "game-topnav__button--success",
              )}
              disabled={!scriptLoaded()}
              onClick={scriptRunning() ? stopScript : startScript}
              size="xs"
              variant="ghost"
            >
              {scriptRunning() ? "Stop" : "Start"}
            </Button>
          </div>

          <div class="game-topnav__right">
            <Checkbox
              checked={autoAttackEnabled()}
              onChange={(event) =>
                setAutoAttackEnabled(event.currentTarget.checked)
              }
            >
              Auto
            </Checkbox>

            <div class="game-topnav__divider" />

            <Menu
              open={openMenu() === "pads"}
              onOpenChange={setMenuOpen("pads")}
            >
              <MenuTrigger class="game-topnav__select-trigger" disabled>
                Spawn
              </MenuTrigger>
              <MenuContent class="game-menu game-menu--compact" portal={false}>
                <For each={defaultPads}>
                  {(pad) => (
                    <MenuItem class="game-menu__item" disabled value={pad}>
                      {pad}
                    </MenuItem>
                  )}
                </For>
              </MenuContent>
            </Menu>

            <Menu
              open={openMenu() === "cells"}
              onOpenChange={setMenuOpen("cells")}
            >
              <MenuTrigger
                class="game-topnav__select-trigger game-topnav__select-trigger--cell"
                disabled
              >
                Enter
              </MenuTrigger>
              <MenuContent class="game-menu game-menu--compact" portal={false}>
                <For each={placeholderCells}>
                  {(cell) => (
                    <MenuItem class="game-menu__item" disabled value={cell}>
                      {cell}
                    </MenuItem>
                  )}
                </For>
              </MenuContent>
            </Menu>

            <div class="game-topnav__divider" />

            <Button
              class="game-topnav__button"
              disabled
              size="xs"
              variant="ghost"
            >
              Bank
            </Button>
          </div>
        </nav>
      </div>

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
