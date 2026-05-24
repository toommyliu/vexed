/* @refresh reload */
import "../../polyfills";
import "./entrypoint";
import "./style.css";
import { Spinner, Toaster, createToastController } from "@vexed/ui";
import { mountWindow } from "../mount";
import { Data, Effect, Fiber } from "effect";
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  Show,
  type JSX,
} from "solid-js";
import {
  DEFAULT_APPEARANCE,
  DEFAULT_HOTKEYS,
  DEFAULT_PREFERENCES,
  type AppSettings,
} from "../../../shared/settings";
import {
  DEFAULT_COMBAT_PROFILE_ID,
  DEFAULT_COMBAT_PROFILE_LIBRARY,
  autoAttackStateToProfileRef,
  findCombatProfileByRef,
  type CombatProfileAutoAttackMode,
  type CombatProfileLibrary,
} from "../../../shared/combat-profiles";
import type {
  AccountGameLaunchPayload,
  FastTravelsRequestMessage,
  FollowerStartPayload,
  ScriptExecutePayload,
} from "../../../shared/ipc";
import { fastTravelMapTarget } from "../../../shared/fast-travels";
import type { WindowId } from "../../../shared/windows";
import { runtime } from "./Runtime";
import { installPacketsBridge } from "./packetsBridge";
import { installLoaderGrabberBridge } from "./loaderGrabberBridge";
import { Settings, type SettingsShape } from "./flash/Services/Settings";
import { Auth } from "./flash/Services/Auth";
import { SwfMethodNotFoundError, SwfUnavailableError } from "./flash/Errors";
import { Bank } from "./flash/Services/Bank";
import { Combat } from "./flash/Services/Combat";
import { Drops } from "./flash/Services/Drops";
import { House } from "./flash/Services/House";
import { Inventory } from "./flash/Services/Inventory";
import { Outfits } from "./flash/Services/Outfits";
import { Packet } from "./flash/Services/Packet";
import { Player } from "./flash/Services/Player";
import { Quests } from "./flash/Services/Quests";
import { Shops } from "./flash/Services/Shops";
import { TempInventory } from "./flash/Services/TempInventory";
import { World } from "./flash/Services/World";
import { Army } from "./army/Services/Army";
import { Environment } from "./environment/Services/Environment";
import {
  AutoAttack,
  type AutoAttackState,
} from "./features/Services/AutoAttack";
import {
  AutoRelogin,
  type AutoReloginState,
} from "./features/Services/AutoRelogin";
import {
  AutoZone,
  type AutoZoneState,
  type AutoZoneSupportedMap,
} from "./features/Services/AutoZone";
import { Follower } from "./features/Services/Follower";
import {
  TopNav,
  TopNavHiddenOptionsMenu,
  type TopNavOptionsMenuContentProps,
} from "./TopNav";
import { createGameCommands, type GameCommand } from "./commands";
import { GameHotkeys } from "./hotkeys";
import {
  getGameLoadState,
  onGameLoaded,
  subscribeGameLoadState,
} from "./loadState";
import {
  findTopNavOption,
  type GameTopNavMenu,
  type TopNavOptionItem,
} from "./topNavOptions";
import { ScriptRunner } from "./scripting/Services/ScriptRunner";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly NODE_ENV?: string;
    }
  }
}

const ACCOUNT_SCRIPT_STATUS_POLL_MS = 1000;
const AUTO_RELOGIN_DEFAULT_DELAY_MS = 3000;
const AUTO_RELOGIN_MAX_DELAY_MS = 300_000;
const DEFAULT_CELL = "Enter";
const DEFAULT_PAD = "Spawn";
const MS_PER_SECOND = 1000;
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

class AccountLaunchError extends Data.TaggedError("AccountLaunchError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

const accountLaunchError = (
  message: string,
  cause?: unknown,
): AccountLaunchError =>
  new AccountLaunchError(
    cause === undefined ? { message } : { message, cause },
  );

const formatAccountLaunchError = (error: unknown): string => {
  if (error instanceof AccountLaunchError) {
    return error.message;
  }

  if (error instanceof Error && error.message !== "") {
    return error.message;
  }

  return "Account launch failed";
};

const uniqueNonEmpty = (values: readonly string[]): string[] => [
  ...new Set(values.map((value) => value.trim()).filter(Boolean)),
];

const formatDelaySeconds = (delayMs: number): string =>
  String(delayMs / MS_PER_SECOND);

const parseDelaySecondsToMs = (value: string): number => {
  const seconds = Number.parseFloat(value);
  return Number.isFinite(seconds)
    ? Math.min(
        AUTO_RELOGIN_MAX_DELAY_MS,
        Math.max(0, Math.round(seconds * MS_PER_SECOND)),
      )
    : Number.NaN;
};

const formatScriptStatus = (loaded: boolean, running: boolean) => {
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

type DebugEvalMode = "script" | "internal";

interface DevDebugEvaluatorProps {
  readonly applyLoadedScript: (source: string, name: string) => void;
  readonly refreshScriptMeta: () => Promise<void>;
}

const createDebugScriptSource = (source: string): string =>
  source.includes("module.exports")
    ? source
    : `module.exports = function* debug({ api, script, features, std }) {
${source}
};`;

const formatEvalValue = (value: unknown): string => {
  if (value === undefined) {
    return "undefined";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
};

const formatEvalError = (error: unknown): string =>
  error instanceof Error && error.message !== ""
    ? error.message
    : String(error);

const DevDebugEvaluator =
  process.env.NODE_ENV === "development"
    ? (props: DevDebugEvaluatorProps): JSX.Element => {
        const DEBUG_EVAL_OUTPUT_LIMIT = 2000;
        const DEBUG_EVAL_SOURCE_NAME = "debug-eval.js";
        const DEFAULT_SCRIPT_DEBUG_SOURCE = `const cell = yield* api.player.getCell();
script.log(\`Cell: \${cell}\`);`;
        const DEFAULT_INTERNAL_DEBUG_SOURCE = `return yield* services.player.getCell();`;
        const DEBUG_PANEL_MARGIN_PX = 12;
        const DEBUG_PANEL_MIN_WIDTH_PX = 320;
        const DEBUG_PANEL_MIN_HEIGHT_PX = 220;
        const DEBUG_PANEL_DEFAULT_WIDTH_PX = 432;
        const DEBUG_PANEL_DEFAULT_HEIGHT_PX = 360;
        const EffectFunction = Function as unknown as new (
          ...args: string[]
        ) => (
          services: Record<string, unknown>,
          effect: typeof Effect,
        ) => Effect.Effect<unknown, unknown>;
        type DebugPanelFrame = {
          readonly height: number;
          readonly width: number;
          readonly x: number;
          readonly y: number;
        };

        const [open, setOpen] = createSignal(false);
        const [mode, setMode] = createSignal<DebugEvalMode>("script");
        const [scriptSource, setScriptSource] = createSignal(
          DEFAULT_SCRIPT_DEBUG_SOURCE,
        );
        const [internalSource, setInternalSource] = createSignal(
          DEFAULT_INTERNAL_DEBUG_SOURCE,
        );
        const [status, setStatus] = createSignal("Idle");
        const [output, setOutput] = createSignal("");
        const [running, setRunning] = createSignal(false);
        const clampPanelFrame = (frame: DebugPanelFrame): DebugPanelFrame => {
          const maxWidth = Math.max(
            DEBUG_PANEL_MIN_WIDTH_PX,
            window.innerWidth - DEBUG_PANEL_MARGIN_PX * 2,
          );
          const maxHeight = Math.max(
            DEBUG_PANEL_MIN_HEIGHT_PX,
            window.innerHeight - DEBUG_PANEL_MARGIN_PX * 2,
          );
          const width = Math.min(
            Math.max(frame.width, DEBUG_PANEL_MIN_WIDTH_PX),
            maxWidth,
          );
          const height = Math.min(
            Math.max(frame.height, DEBUG_PANEL_MIN_HEIGHT_PX),
            maxHeight,
          );

          return {
            height,
            width,
            x: Math.min(
              Math.max(frame.x, DEBUG_PANEL_MARGIN_PX),
              Math.max(
                DEBUG_PANEL_MARGIN_PX,
                window.innerWidth - width - DEBUG_PANEL_MARGIN_PX,
              ),
            ),
            y: Math.min(
              Math.max(frame.y, DEBUG_PANEL_MARGIN_PX),
              Math.max(
                DEBUG_PANEL_MARGIN_PX,
                window.innerHeight - height - DEBUG_PANEL_MARGIN_PX,
              ),
            ),
          };
        };
        const createInitialPanelFrame = (): DebugPanelFrame => {
          const width = Math.min(
            DEBUG_PANEL_DEFAULT_WIDTH_PX,
            Math.max(
              DEBUG_PANEL_MIN_WIDTH_PX,
              window.innerWidth - DEBUG_PANEL_MARGIN_PX * 2,
            ),
          );
          const height = Math.min(
            DEBUG_PANEL_DEFAULT_HEIGHT_PX,
            Math.max(
              DEBUG_PANEL_MIN_HEIGHT_PX,
              window.innerHeight - DEBUG_PANEL_MARGIN_PX * 2,
            ),
          );

          return clampPanelFrame({
            height,
            width,
            x: window.innerWidth - width - DEBUG_PANEL_MARGIN_PX,
            y: window.innerHeight - height - DEBUG_PANEL_MARGIN_PX,
          });
        };
        const [panelFrame, setPanelFrame] = createSignal<DebugPanelFrame>(
          createInitialPanelFrame(),
        );
        let panelElement: HTMLDivElement | undefined;
        let panelResizeObserver: ResizeObserver | undefined;
        let cleanupPanelPointer: (() => void) | undefined;

        const currentSource = () =>
          mode() === "script" ? scriptSource() : internalSource();

        onMount(() => {
          const handleResize = () => {
            setPanelFrame(clampPanelFrame);
          };
          panelResizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0];
            const borderBoxSize = entry?.borderBoxSize[0];
            const width =
              borderBoxSize === undefined
                ? panelElement?.offsetWidth
                : borderBoxSize.inlineSize;
            const height =
              borderBoxSize === undefined
                ? panelElement?.offsetHeight
                : borderBoxSize.blockSize;

            if (width === undefined || height === undefined) {
              return;
            }

            setPanelFrame((frame) =>
              clampPanelFrame({
                ...frame,
                height: Math.round(height),
                width: Math.round(width),
              }),
            );
          });

          window.addEventListener("resize", handleResize);
          onCleanup(() => {
            cleanupPanelPointer?.();
            panelResizeObserver?.disconnect();
            window.removeEventListener("resize", handleResize);
          });
        });

        createEffect(() => {
          const element = panelElement;
          const observer = panelResizeObserver;
          if (!open() || element === undefined || observer === undefined) {
            return;
          }

          observer.observe(element);
          onCleanup(() => {
            observer.unobserve(element);
          });
        });

        const truncateOutput = (value: string): string =>
          value.length <= DEBUG_EVAL_OUTPUT_LIMIT
            ? value
            : `${value.slice(0, DEBUG_EVAL_OUTPUT_LIMIT)}...`;

        const runInternalEval = (source: string): Promise<unknown> =>
          runtime.runPromise(
            Effect.gen(function* () {
              const army = yield* Army;
              const auth = yield* Auth;
              const autoAttack = yield* AutoAttack;
              const autoRelogin = yield* AutoRelogin;
              const autoZone = yield* AutoZone;
              const bank = yield* Bank;
              const combat = yield* Combat;
              const drops = yield* Drops;
              const environment = yield* Environment;
              const house = yield* House;
              const inventory = yield* Inventory;
              const outfits = yield* Outfits;
              const packet = yield* Packet;
              const player = yield* Player;
              const quests = yield* Quests;
              const settings = yield* Settings;
              const shops = yield* Shops;
              const tempInventory = yield* TempInventory;
              const world = yield* World;
              const services = {
                army,
                auth,
                autoAttack,
                autoRelogin,
                autoZone,
                bank,
                combat,
                drops,
                environment,
                house,
                inventory,
                outfits,
                packet,
                player,
                quests,
                settings,
                shops,
                tempInventory,
                world,
              };
              const compileInternalEval = new EffectFunction(
                "services",
                "Effect",
                `"use strict";
return Effect.gen(function* debugInternalEval() {
${source}
});`,
              );

              return yield* compileInternalEval(services, Effect);
            }),
          );

        const loadAsScript = () => {
          if (running()) {
            return;
          }

          if (mode() !== "script") {
            setStatus("Script API mode required to load");
            return;
          }

          const source = currentSource().trim();
          if (source === "") {
            setStatus("No code to load");
            return;
          }

          props.applyLoadedScript(
            createDebugScriptSource(source),
            DEBUG_EVAL_SOURCE_NAME,
          );
          setStatus("Loaded into script runner");
          setOutput("");
          void props.refreshScriptMeta();
        };

        const runEval = () => {
          if (running()) {
            return;
          }

          const source = currentSource().trim();
          if (source === "") {
            setStatus("No code to evaluate");
            setOutput("");
            return;
          }

          const evalMode = mode();
          setRunning(true);
          setStatus(`Running ${evalMode} eval`);
          setOutput("");

          const task =
            evalMode === "script"
              ? runtime.runPromise(
                  Effect.gen(function* () {
                    const runner = yield* ScriptRunner;
                    yield* runner.run(createDebugScriptSource(source), {
                      name: DEBUG_EVAL_SOURCE_NAME,
                    });
                    return "Script eval started";
                  }),
                )
              : runInternalEval(source);

          void task
            .then((value) => {
              setStatus("Eval complete");
              setOutput(truncateOutput(formatEvalValue(value)));
              void props.refreshScriptMeta();
            })
            .catch((error: unknown) => {
              setStatus("Eval failed");
              setOutput(truncateOutput(formatEvalError(error)));
              void props.refreshScriptMeta();
            })
            .finally(() => {
              setRunning(false);
            });
        };

        const startPanelDrag: JSX.EventHandler<HTMLElement, PointerEvent> = (
          event,
        ) => {
          if (event.button !== 0) {
            return;
          }

          event.preventDefault();
          cleanupPanelPointer?.();
          const startFrame = panelFrame();
          const startX = event.clientX;
          const startY = event.clientY;
          event.currentTarget.setPointerCapture(event.pointerId);

          const handlePointerMove = (moveEvent: PointerEvent) => {
            setPanelFrame(
              clampPanelFrame({
                ...startFrame,
                x: startFrame.x + moveEvent.clientX - startX,
                y: startFrame.y + moveEvent.clientY - startY,
              }),
            );
          };
          const handlePointerUp = () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
            window.removeEventListener("pointercancel", handlePointerUp);
            cleanupPanelPointer = undefined;
          };

          cleanupPanelPointer = handlePointerUp;
          window.addEventListener("pointermove", handlePointerMove);
          window.addEventListener("pointerup", handlePointerUp, { once: true });
          window.addEventListener("pointercancel", handlePointerUp, {
            once: true,
          });
        };

        const handlePanelKeyDown: JSX.EventHandler<
          HTMLElement,
          KeyboardEvent
        > = (event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            event.stopPropagation();

            if (event.shiftKey) {
              loadAsScript();
            } else {
              runEval();
            }
            return;
          }

          if (event.key !== "Escape" && event.key !== "Tab") {
            event.stopPropagation();
          }
        };

        return (
          <aside
            aria-label="Debug evaluator"
            style={{
              bottom: open() ? undefined : "0.75rem",
              display: "grid",
              gap: "0.5rem",
              left: open() ? `${panelFrame().x}px` : undefined,
              position: "fixed",
              right: open() ? undefined : "0.75rem",
              top: open() ? `${panelFrame().y}px` : undefined,
              "z-index": "10002",
              "pointer-events": "auto",
            }}
          >
            <Show
              when={open()}
              fallback={
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  style={{
                    "background-color": "var(--color-primary)",
                    border: "1px solid rgba(var(--border), 0.8)",
                    "border-radius": "var(--radius-sm)",
                    color: "var(--color-primary-foreground)",
                    cursor: "pointer",
                    "font-size": "var(--text-sm)",
                    padding: "0.375rem 0.625rem",
                  }}
                >
                  Debug Eval
                </button>
              }
            >
              <div
                ref={panelElement}
                onKeyDown={handlePanelKeyDown}
                style={{
                  "background-color": "rgb(var(--popover))",
                  border: "1px solid var(--color-border)",
                  "border-radius": "var(--radius-md)",
                  "box-sizing": "border-box",
                  "box-shadow":
                    "0 16px 44px rgba(var(--black), 0.22), 0 2px 8px rgba(var(--black), 0.12)",
                  color: "rgb(var(--popover-foreground))",
                  display: "grid",
                  gap: "0.5rem",
                  "grid-template-rows": "auto minmax(0, 1fr) auto auto",
                  height: `${panelFrame().height}px`,
                  "min-height": `${DEBUG_PANEL_MIN_HEIGHT_PX}px`,
                  "min-width": `${DEBUG_PANEL_MIN_WIDTH_PX}px`,
                  "max-height": `calc(100vh - ${panelFrame().y + DEBUG_PANEL_MARGIN_PX}px)`,
                  "max-width": `calc(100vw - ${panelFrame().x + DEBUG_PANEL_MARGIN_PX}px)`,
                  overflow: "hidden",
                  padding: "0.625rem",
                  position: "relative",
                  resize: "both",
                  width: `${panelFrame().width}px`,
                }}
              >
                <div
                  onPointerDown={startPanelDrag}
                  style={{
                    "align-items": "center",
                    cursor: "move",
                    display: "flex",
                    gap: "0.5rem",
                    "justify-content": "space-between",
                    "touch-action": "none",
                    "user-select": "none",
                  }}
                >
                  <strong style={{ "font-size": "var(--text-sm)" }}>
                    Debug Eval
                  </strong>
                  <div
                    onPointerDown={(event) => event.stopPropagation()}
                    style={{ display: "flex", gap: "0.375rem" }}
                  >
                    <select
                      aria-label="Debug eval mode"
                      value={mode()}
                      onChange={(event) =>
                        setMode(event.currentTarget.value as DebugEvalMode)
                      }
                      style={{
                        "background-color": "var(--color-background)",
                        border: "1px solid var(--color-border)",
                        "border-radius": "var(--radius-sm)",
                        color: "var(--color-foreground)",
                        "font-size": "var(--text-sm)",
                        padding: "0.25rem 0.375rem",
                      }}
                    >
                      <option value="script">Script API</option>
                      <option value="internal">Internal API</option>
                    </select>
                    <button
                      aria-label="Close debug evaluator"
                      type="button"
                      onClick={() => setOpen(false)}
                      style={{
                        "background-color": "transparent",
                        border: "1px solid var(--color-border)",
                        "border-radius": "var(--radius-sm)",
                        color: "var(--color-foreground)",
                        cursor: "pointer",
                        padding: "0.25rem 0.5rem",
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
                <textarea
                  aria-label="Debug eval code"
                  spellcheck={false}
                  value={currentSource()}
                  onInput={(event) => {
                    if (mode() === "script") {
                      setScriptSource(event.currentTarget.value);
                    } else {
                      setInternalSource(event.currentTarget.value);
                    }
                  }}
                  style={{
                    "background-color": "var(--color-background)",
                    border: "1px solid var(--color-border)",
                    "border-radius": "var(--radius-sm)",
                    "box-sizing": "border-box",
                    color: "var(--color-foreground)",
                    "font-family": "var(--font-mono)",
                    "font-size": "var(--text-sm)",
                    height: "100%",
                    "min-height": "0",
                    padding: "0.5rem",
                    resize: "none",
                    width: "100%",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    gap: "0.375rem",
                    "justify-content": "flex-end",
                  }}
                >
                  <button
                    type="button"
                    disabled={running()}
                    onClick={runEval}
                    title="Run (Cmd/Ctrl+Enter)"
                    style={{
                      "background-color": "var(--color-primary)",
                      border: "1px solid rgba(var(--border), 0.8)",
                      "border-radius": "var(--radius-sm)",
                      color: "var(--color-primary-foreground)",
                      cursor: running() ? "not-allowed" : "pointer",
                      padding: "0.375rem 0.625rem",
                    }}
                  >
                    {running() ? "Running" : "Eval"}
                  </button>
                  <button
                    type="button"
                    disabled={mode() !== "script" || running()}
                    onClick={loadAsScript}
                    title="Load (Cmd/Ctrl+Shift+Enter)"
                    style={{
                      "background-color": "var(--color-background)",
                      border: "1px solid var(--color-border)",
                      "border-radius": "var(--radius-sm)",
                      color: "var(--color-foreground)",
                      cursor:
                        mode() === "script" && !running()
                          ? "pointer"
                          : "not-allowed",
                      padding: "0.375rem 0.625rem",
                    }}
                  >
                    Load
                  </button>
                </div>
                <div
                  style={{
                    color: "var(--color-muted-foreground)",
                    display: "grid",
                    "font-size": "var(--text-xs)",
                    gap: "0.375rem",
                  }}
                >
                  <span>{status()}</span>
                  <Show when={output() !== ""}>
                    <pre
                      style={{
                        "background-color": "rgba(var(--muted), 0.62)",
                        border: "1px solid rgba(var(--border), 0.75)",
                        "border-radius": "var(--radius-sm)",
                        color: "var(--color-foreground)",
                        "font-family": "var(--font-mono)",
                        margin: "0",
                        "max-height": "9rem",
                        overflow: "auto",
                        padding: "0.5rem",
                        "white-space": "pre-wrap",
                        "word-break": "break-word",
                      }}
                    >
                      {output()}
                    </pre>
                  </Show>
                </div>
              </div>
            </Show>
          </aside>
        );
      }
    : undefined;

export default function App(props: {
  readonly initialSettings?: AppSettings | null;
}): JSX.Element {
  const initialSettings = props.initialSettings ?? defaultSettings;
  const [settings, setSettings] = createSignal<AppSettings>(initialSettings);
  const [gameLoaded, setGameLoaded] = createSignal(getGameLoadState().loaded);
  const [playerReady, setPlayerReady] = createSignal(false);
  const [autoAttackEnabled, setAutoAttackEnabled] = createSignal(false);
  const [followerEnabled, setFollowerEnabled] = createSignal(false);
  const [autoAttackProfileLabel, setAutoAttackProfileLabel] =
    createSignal("Generic");
  const [autoAttackLastError, setAutoAttackLastError] = createSignal("");
  const [combatProfileLibrary, setCombatProfileLibrary] =
    createSignal<CombatProfileLibrary>(DEFAULT_COMBAT_PROFILE_LIBRARY);
  const [scriptName, setScriptName] = createSignal("");
  const [scriptSource, setScriptSource] = createSignal("");
  const [scriptLoaded, setScriptLoaded] = createSignal(false);
  const [scriptRunning, setScriptRunning] = createSignal(false);
  const [scriptStatus, setScriptStatus] = createSignal("No script loaded");
  const [scriptDiagnosticsCount, setScriptDiagnosticsCount] = createSignal(0);
  const [scriptUsePrivateRooms, setScriptUsePrivateRooms] = createSignal(false);

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
  const [antiCounterEnabled, setAntiCounterEnabled] = createSignal(false);
  const [autoZoneEnabled, setAutoZoneEnabled] = createSignal(false);
  const [autoZoneMap, setAutoZoneMap] = createSignal<
    AutoZoneSupportedMap | undefined
  >(undefined);

  const [autoReloginEnabled, setAutoReloginEnabled] = createSignal(false);
  const [autoReloginCaptured, setAutoReloginCaptured] = createSignal(false);
  const [autoReloginAttempting, setAutoReloginAttempting] = createSignal(false);
  const [autoReloginWaitingDelay, setAutoReloginWaitingDelay] =
    createSignal(false);
  const [autoReloginToggling, setAutoReloginToggling] = createSignal(false);
  const [autoReloginDelaySeconds, setAutoReloginDelaySeconds] = createSignal(
    formatDelaySeconds(AUTO_RELOGIN_DEFAULT_DELAY_MS),
  );
  const [autoReloginServer, setAutoReloginServer] = createSignal("");
  const [autoReloginServers, setAutoReloginServers] = createSignal<string[]>(
    [],
  );
  const [autoReloginLastError, setAutoReloginLastError] = createSignal("");
  const [autoReloginAttemptsRemaining, setAutoReloginAttemptsRemaining] =
    createSignal<number | null>(null);
  const [openTopNavMenu, setOpenTopNavMenu] =
    createSignal<GameTopNavMenu | null>(null);
  const [topBarVisible, setTopBarVisible] = createSignal(true);
  const [cells, setCells] = createSignal<readonly string[]>([DEFAULT_CELL]);
  const [pads] = createSignal<readonly string[]>(DEFAULT_PADS);
  const [validPads, setValidPads] = createSignal<readonly string[]>([]);
  const [selectedCell, setSelectedCell] = createSignal(DEFAULT_CELL);
  const [selectedPad, setSelectedPad] = createSignal(DEFAULT_PAD);
  const [travelBusy, setTravelBusy] = createSignal(false);
  const hotkeyToasts = createToastController({
    defaultDuration: 1200,
    limit: 1,
  });

  let settingsStateDisposer: (() => void) | undefined;
  let autoAttackStateDisposer: (() => void) | undefined;
  let autoZoneStateDisposer: (() => void) | undefined;
  let autoReloginStateDisposer: (() => void) | undefined;
  let packetsBridgeController:
    | ReturnType<typeof installPacketsBridge>
    | undefined;
  let autoAttackToggleInFlight = false;
  let fastTravelRequestChain = Promise.resolve();
  let cleanedUp = false;
  const accountLaunchFibers = new Set<Fiber.Fiber<void, unknown>>();
  const assignDisposer =
    (slot: "settings" | "autoAttack" | "autoZone" | "autoRelogin") =>
    (dispose: () => void) => {
      if (cleanedUp) {
        dispose();
        return;
      }

      if (slot === "settings") {
        settingsStateDisposer = dispose;
      } else if (slot === "autoAttack") {
        autoAttackStateDisposer = dispose;
      } else if (slot === "autoZone") {
        autoZoneStateDisposer = dispose;
      } else {
        autoReloginStateDisposer = dispose;
      }
    };

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

  const waitForAccountScriptStopEffect = (
    payload: AccountGameLaunchPayload,
    name: string,
  ) =>
    Effect.gen(function* () {
      let lastMessage = "";
      const runner = yield* ScriptRunner;

      while (true) {
        yield* Effect.sleep(`${ACCOUNT_SCRIPT_STATUS_POLL_MS} millis`);

        const isRunning = yield* runner.isRunning();

        if (!isRunning) {
          setScriptRunning(false);
          setScriptStatus(`Stopped ${name}`);
          updateAccountLaunchStatus(payload, "stopped", `Stopped ${name}`);
          return;
        }

        const nextMessage = formatScriptStatus(true, true);
        setScriptRunning(true);
        setScriptStatus(nextMessage);

        if (nextMessage !== lastMessage) {
          updateAccountLaunchStatus(payload, "running", nextMessage);
          lastMessage = nextMessage;
        }
      }
    });

  const runAccountLaunch = (payload: AccountGameLaunchPayload) =>
    Effect.gen(function* () {
      updateAccountLaunchStatus(payload, "starting", "Waiting for game loader");
      yield* Effect.promise(() => waitForLoadedGame());

      const autoRelogin = yield* AutoRelogin;
      const outcome = yield* autoRelogin.login({
        username: payload.account.username,
        password: payload.account.password,
        ...(payload.server === undefined ? {} : { server: payload.server }),
      });

      if (outcome.stage === "server-select") {
        updateAccountLaunchStatus(
          payload,
          "stopped",
          payload.script
            ? "Select a server to run the script"
            : "Waiting for server selection",
        );
        void refreshScriptMeta();
        return;
      }

      if (!payload.script) {
        setScriptRunning(false);
        setScriptStatus("Player ready");
        updateAccountLaunchStatus(payload, "running", "Player ready");
        void refreshScriptMeta();
        return;
      }

      const script = payload.script;
      const name = script.name ?? script.path ?? "script";
      const runner = yield* ScriptRunner;
      yield* Effect.sync(() => {
        applyLoadedScript(script.source, name);
      });
      updateAccountLaunchStatus(payload, "running", `Running ${name}`);
      yield* runner
        .run(script.source, {
          name,
        })
        .pipe(
          Effect.mapError((error) =>
            accountLaunchError(
              error instanceof Error ? error.message : "Failed to run script",
              error,
            ),
          ),
        );
      setScriptRunning(true);
      setScriptStatus(`Running ${name}`);
      updateAccountLaunchStatus(payload, "running", `Running ${name}`);
      yield* waitForAccountScriptStopEffect(payload, name);
      void refreshScriptMeta();
    }).pipe(
      Effect.catch((error: unknown) =>
        Effect.sync(() => {
          console.error("Failed to run account launch:", error);
          updateAccountLaunchStatus(
            payload,
            "failed",
            formatAccountLaunchError(error),
          );
          void refreshScriptMeta();
        }),
      ),
    );

  const handleAccountLaunch = (payload: AccountGameLaunchPayload) => {
    const fiber = runtime.runFork(runAccountLaunch(payload));
    accountLaunchFibers.add(fiber);
    let removeObserver: (() => void) | undefined;
    let observerCompleted = false;
    removeObserver = fiber.addObserver(() => {
      observerCompleted = true;
      removeObserver?.();
      accountLaunchFibers.delete(fiber);
    });
    if (observerCompleted) {
      removeObserver();
    }
  };

  const applyLoadedScript = (source: string, name: string) => {
    setScriptName(name);
    setScriptSource(source);
    setScriptLoaded(true);
  };

  const applyAppSettings = (settings: AppSettings) => {
    setSettings(settings);
  };

  const applyScriptPayload = async (
    payload: ScriptExecutePayload,
  ): Promise<string> => {
    const name = payload.name ?? payload.path ?? "script";
    applyLoadedScript(payload.source, name);
    return name;
  };

  const refreshScriptMeta = async () => {
    try {
      const { isRunning, diagnostics, options } = await runtime.runPromise(
        Effect.gen(function* () {
          const runner = yield* ScriptRunner;
          const [isRunning, diagnostics, options] = yield* Effect.all([
            runner.isRunning(),
            runner.diagnostics(),
            runner.getOptions(),
          ]);
          return { isRunning, diagnostics, options };
        }),
      );

      setScriptRunning(isRunning);
      setScriptDiagnosticsCount(diagnostics.length);
      setScriptUsePrivateRooms(options.usePrivateRooms);
      setScriptStatus(formatScriptStatus(scriptLoaded(), isRunning));
    } catch (error) {
      console.error("Failed to refresh script metadata", error);
      setScriptStatus("Failed to refresh script state");
    }
  };

  const loadScript = async () => {
    try {
      const payload = await window.ipc.scripting.openFile();
      if (!payload) {
        setScriptStatus("Open script cancelled");
        return;
      }

      const name = await applyScriptPayload(payload);
      setScriptStatus(`Loaded ${name}`);
      void refreshScriptMeta();
    } catch (error) {
      console.error("Failed to load script", error);
      setScriptLoaded(false);
      setScriptStatus("Failed to load script");
    }
  };

  const startScript = () => {
    const source = scriptSource().trim();
    if (!source) {
      setScriptStatus("No script loaded");
      return;
    }

    const name = scriptName() || "script";
    setScriptStatus(`Starting ${name}`);
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const runner = yield* ScriptRunner;
          yield* runner.run(source, { name });
        }),
      )
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
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const runner = yield* ScriptRunner;
          yield* runner.stop("ui request");
        }),
      )
      .catch((error) => {
        console.error("Failed to stop script", error);
      })
      .finally(() => {
        void refreshScriptMeta();
      });
    setScriptStatus("Stop requested");
  };

  const handleToggleScriptPrivateRooms = () => {
    const nextEnabled = !scriptUsePrivateRooms();
    setScriptUsePrivateRooms(nextEnabled);
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const runner = yield* ScriptRunner;
          yield* runner.setUsePrivateRooms(nextEnabled);
        }),
      )
      .catch((error) => {
        console.error("Failed to update script private room option", error);
        setScriptUsePrivateRooms(!nextEnabled);
      })
      .finally(() => {
        void refreshScriptMeta();
      });
  };

  const canApplyGameSettings = () => gameLoaded() && playerReady();

  const runSettingsEffect = (
    label: string,
    effect: (settings: SettingsShape) => Effect.Effect<void, unknown>,
  ) => {
    if (!canApplyGameSettings()) {
      return;
    }

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

  const refreshPlayerReadyState = () => {
    if (!getGameLoadState().loaded) {
      setPlayerReady(false);
      packetsBridgeController?.stopActive("Game is not loaded");
      return;
    }

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const player = yield* Player;
          return yield* player.isReady();
        }),
      )
      .then((isReady) => {
        const wasReady = playerReady();
        setPlayerReady(isReady);
        if (isReady && !wasReady) {
          refreshTravelOptions();
        } else if (!isReady && wasReady) {
          packetsBridgeController?.stopActive("Player disconnected");
        }
      })
      .catch((error) => {
        setPlayerReady(false);
        packetsBridgeController?.stopActive("Player readiness check failed");
        console.error("Refresh player ready state error:", error);
      });
  };

  const refreshTravelOptions = () => {
    if (!getGameLoadState().loaded || !playerReady()) {
      return;
    }

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const player = yield* Player;
          const isReady = yield* player.isReady();
          if (!isReady) {
            return null;
          }

          const world = yield* World;
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

  const handleToggleAntiCounter = () => {
    const nextEnabled = !antiCounterEnabled();
    setAntiCounterEnabled(nextEnabled);
    runSettingsEffect("Toggle anti-counter", (settings) =>
      settings.setAntiCounterEnabled(nextEnabled),
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
    const name = customName().trim();
    if (name === "") {
      return;
    }

    setCustomName(name);
    runSettingsEffect("Set custom name", (settings) =>
      settings.setCustomName(name),
    );
  };

  const handleSetCustomGuild = () => {
    const guild = customGuild().trim();
    if (guild === "") {
      return;
    }

    setCustomGuild(guild);
    runSettingsEffect("Set custom guild", (settings) =>
      settings.setCustomGuild(guild),
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

  const autoAttackConfiguredProfileLabel = createMemo(() => {
    const library = combatProfileLibrary();
    const state = library.autoAttack;

    if (state.mode === "generic") {
      return "Generic";
    }

    if (state.mode === "selected" && state.selectedProfileId) {
      const profile = findCombatProfileByRef(library, {
        mode: "selected",
        profileId: state.selectedProfileId,
      });
      return `Profile: ${profile.label}`;
    }

    return "Match class";
  });

  const applyAutoAttackState = (state: AutoAttackState) => {
    setAutoAttackEnabled(state.enabled);
    setAutoAttackProfileLabel(
      state.profileLabel ?? autoAttackConfiguredProfileLabel(),
    );
    setAutoAttackLastError(state.lastError ?? "");
  };

  const refreshAutoAttackState = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const autoAttack = yield* AutoAttack;
          return yield* autoAttack.getState();
        }),
      )
      .then(applyAutoAttackState)
      .catch((error) => {
        console.error("Refresh auto attack state error:", error);
      });
  };

  const syncEnabledAutoAttackProfile = (library: CombatProfileLibrary) => {
    if (!autoAttackEnabled()) {
      setAutoAttackProfileLabel(autoAttackConfiguredProfileLabel());
      return;
    }

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const autoAttack = yield* AutoAttack;
          return yield* autoAttack.enable({
            library,
            profileRef: autoAttackStateToProfileRef(library.autoAttack),
          });
        }),
      )
      .then(applyAutoAttackState)
      .catch((error) => {
        console.error("Sync auto attack profile error:", error);
        refreshAutoAttackState();
      });
  };

  const applyCombatProfileLibrary = (library: CombatProfileLibrary) => {
    setCombatProfileLibrary(library);
    syncEnabledAutoAttackProfile(library);
  };

  const handleToggleAutoAttack = () => {
    if (autoAttackToggleInFlight) {
      return;
    }

    autoAttackToggleInFlight = true;
    const nextEnabled = !autoAttackEnabled();
    setAutoAttackEnabled(nextEnabled);

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const autoAttack = yield* AutoAttack;
          return nextEnabled
            ? yield* autoAttack.enable({
                library: combatProfileLibrary(),
                profileRef: autoAttackStateToProfileRef(
                  combatProfileLibrary().autoAttack,
                ),
              })
            : yield* autoAttack.disable();
        }),
      )
      .then(applyAutoAttackState)
      .catch((error) => {
        console.error("Toggle auto attack error:", error);
        refreshAutoAttackState();
      })
      .finally(() => {
        autoAttackToggleInFlight = false;
      });
  };

  const handleToggleFollower = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const follower = yield* Follower;
          return yield* follower.toggle(combatProfileLibrary());
        }),
      )
      .then((state) => {
        setFollowerEnabled(state.enabled || state.running);
        void window.ipc.follower.publishState(state).catch((error) => {
          console.error("Follower state publish error:", error);
        });
      })
      .catch((error) => {
        console.error("Toggle follower error:", error);
      });
  };

  const handleSelectAutoAttackProfile = (
    mode: CombatProfileAutoAttackMode,
    selectedProfileId?: string,
  ) => {
    void window.ipc.combatProfiles
      .setAutoAttack(
        mode === "selected" && selectedProfileId
          ? { mode, selectedProfileId }
          : { mode },
      )
      .then(applyCombatProfileLibrary)
      .catch((error: unknown) => {
        console.error("Set auto attack profile error:", error);
      });
  };

  const applyAutoZoneState = (state: AutoZoneState) => {
    setAutoZoneEnabled(state.enabled);
    setAutoZoneMap(state.map);
  };

  const refreshAutoZoneState = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const autoZone = yield* AutoZone;
          return yield* autoZone.getState();
        }),
      )
      .then(applyAutoZoneState)
      .catch((error) => {
        console.error("Refresh autozone state error:", error);
      });
  };

  const handleToggleAutoZone = () => {
    const nextEnabled = !autoZoneEnabled();
    setAutoZoneEnabled(nextEnabled);

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const autoZone = yield* AutoZone;
          yield* autoZone.setEnabled(nextEnabled);
          return yield* autoZone.getState();
        }),
      )
      .then(applyAutoZoneState)
      .catch((error) => {
        console.error("Toggle autozone error:", error);
        refreshAutoZoneState();
      });
  };

  const handleSelectAutoZoneMap = (map: AutoZoneSupportedMap | undefined) => {
    setAutoZoneMap(map);

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const autoZone = yield* AutoZone;
          yield* autoZone.setMap(map);
          return yield* autoZone.getState();
        }),
      )
      .then(applyAutoZoneState)
      .catch((error) => {
        console.error("Set autozone map error:", error);
        refreshAutoZoneState();
      });
  };

  const applyAutoReloginState = (state: AutoReloginState) => {
    setAutoReloginEnabled(state.enabled);
    setAutoReloginCaptured(state.captured);
    setAutoReloginAttempting(state.attempting);
    setAutoReloginWaitingDelay(state.waitingDelay);
    setAutoReloginDelaySeconds(formatDelaySeconds(state.delayMs));
    setAutoReloginServer(state.server ?? "");
    setAutoReloginLastError(state.lastError ?? "");
    setAutoReloginAttemptsRemaining(state.attemptsRemaining ?? null);
  };

  const isSwfBridgeNotReadyError = (error: unknown): boolean =>
    error instanceof SwfUnavailableError ||
    error instanceof SwfMethodNotFoundError;

  const refreshAutoReloginState = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const autoRelogin = yield* AutoRelogin;
          return yield* autoRelogin.getState();
        }),
      )
      .then(applyAutoReloginState)
      .catch((error) => {
        console.error("Refresh autorelogin state error:", error);
      });
  };

  const handleToggleAutoRelogin = () => {
    if (autoReloginToggling()) {
      return;
    }

    const nextEnabled = !autoReloginEnabled();
    setAutoReloginToggling(true);
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
      .then(applyAutoReloginState)
      .catch((error) => {
        console.error("Toggle autorelogin error:", error);
        refreshAutoReloginState();
      })
      .finally(() => {
        setAutoReloginToggling(false);
      });
  };

  const refreshAutoReloginServers = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const auth = yield* Auth;
          return yield* auth.getServers();
        }),
      )
      .then((servers) => {
        setAutoReloginServers(
          servers
            .map((server) => server.name)
            .filter((serverName) => serverName.trim() !== ""),
        );
      })
      .catch((error) => {
        if (isSwfBridgeNotReadyError(error)) {
          setAutoReloginServers([]);
          return;
        }

        console.error("Refresh autorelogin servers error:", error);
      });
  };

  const handleSelectAutoReloginServer = (serverName: string) => {
    setAutoReloginServer(serverName);

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const autoRelogin = yield* AutoRelogin;
          return yield* autoRelogin.setServer(serverName);
        }),
      )
      .then(applyAutoReloginState)
      .catch((error) => {
        console.error("Set autorelogin server error:", error);
        refreshAutoReloginState();
      });
  };

  const handleSetAutoReloginDelay = () => {
    const delayMs = parseDelaySecondsToMs(autoReloginDelaySeconds());
    if (!Number.isFinite(delayMs)) {
      refreshAutoReloginState();
      return;
    }

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const autoRelogin = yield* AutoRelogin;
          return yield* autoRelogin.setDelay(delayMs);
        }),
      )
      .then(applyAutoReloginState)
      .catch((error) => {
        console.error("Set autorelogin delay error:", error);
        refreshAutoReloginState();
      });
  };

  const optionItems = createMemo<readonly TopNavOptionItem[]>(() => {
    const disabled = !canApplyGameSettings();

    return [
      {
        id: "infinite-range",
        label: "Infinite Range",
        checked: infiniteRangeEnabled(),
        disabled,
        onSelect: handleToggleInfiniteRange,
      },
      {
        id: "provoke-cell",
        label: "Provoke Cell",
        checked: provokeCellEnabled(),
        disabled,
        onSelect: handleToggleProvokeCell,
      },
      {
        id: "enemy-magnet",
        label: "Enemy Magnet",
        checked: enemyMagnetEnabled(),
        disabled,
        onSelect: handleToggleEnemyMagnet,
      },
      {
        id: "lag-killer",
        label: "Lag Killer",
        checked: lagKillerEnabled(),
        disabled,
        onSelect: handleToggleLagKiller,
      },
      {
        id: "hide-players",
        label: "Hide Players",
        checked: !otherPlayersVisible(),
        disabled,
        onSelect: handleTogglePlayersVisible,
      },
      {
        id: "skip-cutscenes",
        label: "Skip Cutscenes",
        checked: skipCutscenesEnabled(),
        disabled,
        onSelect: handleToggleSkipCutscenes,
      },
      {
        id: "anti-counter",
        label: "Anti-Counter",
        checked: antiCounterEnabled(),
        disabled,
        onSelect: handleToggleAntiCounter,
      },
      {
        id: "disable-fx",
        label: "Disable FX",
        checked: !effectsEnabled(),
        disabled,
        onSelect: handleToggleEffects,
      },
      {
        id: "collisions",
        label: "Collisions",
        checked: collisionsEnabled(),
        disabled,
        onSelect: handleToggleCollisions,
      },
      {
        id: "death-ads",
        label: "Death Ads",
        checked: deathAdsVisible(),
        disabled,
        onSelect: handleToggleDeathAds,
      },
    ];
  });

  const gameCommands = createGameCommands({
    bindings: () => settings().hotkeys.bindings,
    loadScript,
    startScript,
    stopScript,
    scriptLoaded,
    scriptRunning,
    autoAttackEnabled,
    followerEnabled,
    toggleAutoAttack: handleToggleAutoAttack,
    toggleFollower: handleToggleFollower,
    toggleBank: () => {
      if (canApplyGameSettings()) {
        handleOpenBank();
      }
    },
    optionItems,
    openWindow,
    toggleTopNavMenu: (menu) =>
      setOpenTopNavMenu((current) => (current === menu ? null : menu)),
    toggleTopBarVisible: () => {
      setOpenTopNavMenu(null);
      setTopBarVisible((visible) => !visible);
    },
  });

  const getHotkeyToastTitle = (command: GameCommand): string | null => {
    const option = findTopNavOption(optionItems(), command.id);
    if (option !== undefined) {
      return `${option.label} ${option.checked ? "On" : "Off"}`;
    }

    return null;
  };

  const handleHotkeyCommandRun = (command: GameCommand): void => {
    if (openTopNavMenu() === "options") return;

    const title = getHotkeyToastTitle(command);
    if (title === null) return;

    hotkeyToasts.info(title, {
      dismissible: false,
      id: "game-hotkey-feedback",
    });
  };

  createEffect(() => {
    document.documentElement.toggleAttribute(
      "data-top-bar-hidden",
      !topBarVisible(),
    );
  });

  createEffect(() => {
    if (openTopNavMenu() === "options") {
      hotkeyToasts.closeAll();
    }
  });

  onCleanup(() => {
    document.documentElement.removeAttribute("data-top-bar-hidden");
  });

  const publishFollowerState = () =>
    runtime
      .runPromise(
        Effect.gen(function* () {
          const follower = yield* Follower;
          return yield* follower.getState();
        }),
      )
      .then((state) => window.ipc.follower.publishState(state))
      .catch((error: unknown) => {
        console.error("Failed to publish follower state:", error);
      });

  const getFollowerState = () =>
    runtime.runPromise(
      Effect.gen(function* () {
        const follower = yield* Follower;
        return yield* follower.getState();
      }),
    );

  const getFollowerMe = () =>
    runtime.runPromise(
      Effect.gen(function* () {
        const auth = yield* Auth;
        return yield* auth
          .getUsername()
          .pipe(Effect.catch(() => Effect.succeed("")));
      }),
    );

  const startFollower = (payload: FollowerStartPayload) =>
    runtime.runPromise(
      Effect.gen(function* () {
        const autoAttack = yield* AutoAttack;
        const follower = yield* Follower;
        const autoAttackState = yield* autoAttack.disable();
        applyAutoAttackState(autoAttackState);
        return yield* follower.start({
          config: payload,
          library: combatProfileLibrary(),
        });
      }),
    );

  const stopFollower = () =>
    runtime.runPromise(
      Effect.gen(function* () {
        const follower = yield* Follower;
        return yield* follower.stop();
      }),
    );

  const respondFastTravel = (
    requestId: string,
    response:
      | { readonly ok: true }
      | { readonly ok: false; readonly error: string },
  ) =>
    window.ipc.fastTravels.respond({
      requestId,
      ...response,
    });

  const runFastTravelRequest = async (
    request: FastTravelsRequestMessage,
  ): Promise<void> => {
    if (cleanedUp) {
      await respondFastTravel(request.requestId, {
        ok: false,
        error: "Game window is shutting down",
      });
      return;
    }

    if (request.kind !== "warp") {
      await respondFastTravel(request.requestId, {
        ok: false,
        error: `Unsupported fast travel request: ${String(request.kind)}`,
      });
      return;
    }

    try {
      await runtime.runPromise(
        Effect.gen(function* () {
          const player = yield* Player;
          const ready = yield* player.isReady();
          if (!ready) {
            throw new Error("Player is not ready");
          }

          const { location } = request.payload;
          yield* player.joinMap(
            fastTravelMapTarget(request.payload),
            location.cell,
            location.pad,
          );
        }),
      );
      await respondFastTravel(request.requestId, { ok: true });
    } catch (error: unknown) {
      console.error("Fast travel request failed:", error);
      const message =
        error instanceof Error && error.message !== ""
          ? error.message
          : "Fast travel failed";
      await respondFastTravel(request.requestId, {
        ok: false,
        error: message,
      });
    }
  };

  const handleFastTravelRequest = (
    request: FastTravelsRequestMessage,
  ): void => {
    fastTravelRequestChain = fastTravelRequestChain
      .catch((error: unknown) => {
        console.error("Fast travel request chain failed:", error);
      })
      .then(() => runFastTravelRequest(request));
    void fastTravelRequestChain.catch((error: unknown) => {
      console.error("Fast travel request handling failed:", error);
    });
  };

  onMount(() => {
    const unsubscribeAppSettings =
      window.ipc.settings.onChanged(applyAppSettings);
    const unsubscribeAccountLaunch =
      window.ipc.accounts.onGameLaunch(handleAccountLaunch);
    const unsubscribeCombatProfiles = window.ipc.combatProfiles.onChanged(
      applyCombatProfileLibrary,
    );
    const unsubscribeScriptExecute = window.ipc.scripting.onExecute(
      (payload) => {
        void applyScriptPayload(payload)
          .then((name) => {
            setScriptStatus(`Running ${name}`);
            void refreshScriptMeta();
          })
          .catch((error) => {
            console.error("Failed to load script payload", error);
            setScriptLoaded(false);
            setScriptStatus("Failed to load script");
          });
      },
    );
    const unsubscribeScriptStop = window.ipc.scripting.onStop(() => {
      setScriptRunning(false);
      setScriptStatus("Stop requested");
      void refreshScriptMeta();
    });
    const unsubscribeFollowerGetState =
      window.ipc.follower.onGetStateRequest(getFollowerState);
    const unsubscribeFollowerMe =
      window.ipc.follower.onMeRequest(getFollowerMe);
    const unsubscribeFollowerStart =
      window.ipc.follower.onStartRequest(startFollower);
    const unsubscribeFollowerStop =
      window.ipc.follower.onStopRequest(stopFollower);
    const unsubscribeFastTravels = window.ipc.fastTravels.onRequest(
      handleFastTravelRequest,
    );
    const packetsBridge = installPacketsBridge(runtime);
    const loaderGrabberBridge = installLoaderGrabberBridge(runtime);
    packetsBridgeController = packetsBridge;
    let followerStateDisposer: (() => void) | undefined;

    if (props.initialSettings === undefined || props.initialSettings === null) {
      void window.ipc.settings
        .get()
        .then(applyAppSettings)
        .catch((error) => {
          console.error("Failed to load app settings:", error);
        });
    }

    void window.ipc.combatProfiles
      .getState()
      .then(applyCombatProfileLibrary)
      .catch((error) => {
        console.error("Failed to load combat profiles:", error);
      });

    const disposeGameLoadState = subscribeGameLoadState((state) => {
      setGameLoaded(state.loaded);
      if (!state.loaded) {
        setPlayerReady(false);
        packetsBridge.stopActive("Game reloaded");
      }
    });

    refreshPlayerReadyState();
    const playerReadyStateInterval = setInterval(refreshPlayerReadyState, 1200);

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
            setAntiCounterEnabled(state.antiCounterEnabled);
          });
        }),
      )
      .then(assignDisposer("settings"))
      .catch((error) => {
        console.error("Settings state subscription error:", error);
      });

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const autoAttack = yield* AutoAttack;
          return yield* autoAttack.onState(applyAutoAttackState);
        }),
      )
      .then(assignDisposer("autoAttack"))
      .catch((error) => {
        console.error("AutoAttack state subscription error:", error);
      });

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const autoRelogin = yield* AutoRelogin;
          return yield* autoRelogin.onState(applyAutoReloginState);
        }),
      )
      .then(assignDisposer("autoRelogin"))
      .catch((error) => {
        console.error("AutoRelogin state subscription error:", error);
      });

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const autoZone = yield* AutoZone;
          return yield* autoZone.onState(applyAutoZoneState);
        }),
      )
      .then(assignDisposer("autoZone"))
      .catch((error) => {
        console.error("AutoZone state subscription error:", error);
      });

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const follower = yield* Follower;
          return yield* follower.onState((state) => {
            setFollowerEnabled(state.enabled || state.running);
            void window.ipc.follower.publishState(state).catch((error) => {
              console.error("Follower state publish error:", error);
            });
          });
        }),
      )
      .then((disposeFollowerState) => {
        if (cleanedUp) {
          disposeFollowerState();
          return;
        }

        followerStateDisposer = disposeFollowerState;
        void publishFollowerState();
      })
      .catch((error) => {
        console.error("Follower state subscription error:", error);
      });

    onCleanup(() => {
      unsubscribeAppSettings();
      unsubscribeAccountLaunch();
      unsubscribeCombatProfiles();
      unsubscribeScriptExecute();
      unsubscribeScriptStop();
      unsubscribeFollowerGetState();
      unsubscribeFollowerMe();
      unsubscribeFollowerStart();
      unsubscribeFollowerStop();
      unsubscribeFastTravels();
      packetsBridge.dispose();
      loaderGrabberBridge.dispose();
      packetsBridgeController = undefined;
      followerStateDisposer?.();
      disposeGameLoadState();
      clearInterval(scriptMetaInterval);
      clearInterval(playerReadyStateInterval);
    });
  });

  onCleanup(() => {
    cleanedUp = true;
    for (const fiber of accountLaunchFibers) {
      runtime.runFork(Fiber.interrupt(fiber));
    }
    accountLaunchFibers.clear();
    settingsStateDisposer?.();
    autoAttackStateDisposer?.();
    autoZoneStateDisposer?.();
    autoReloginStateDisposer?.();
  });

  const topNavOptionsMenuProps: TopNavOptionsMenuContentProps = {
    hotkeyBindings: () => settings().hotkeys.bindings,
    hotkeyPlatform: window.ipc.platform.os,
    optionItems,
    gameLoaded,
    playerReady,
    walkSpeed,
    setWalkSpeed,
    handleSetWalkSpeed,
    frameRate,
    setFrameRate,
    handleSetFrameRate,
    customName,
    setCustomName,
    handleSetCustomName,
    customGuild,
    setCustomGuild,
    handleSetCustomGuild,
  };

  return (
    <main class="game-shell">
      <Toaster
        class="game-toast-banner"
        controller={hotkeyToasts}
        placement="top-center"
      />
      <GameHotkeys
        commands={() => gameCommands}
        onCommandRun={handleHotkeyCommandRun}
      />
      <Show when={!topBarVisible()}>
        <TopNavHiddenOptionsMenu
          {...topNavOptionsMenuProps}
          open={() => openTopNavMenu() === "options"}
          setOpen={(open) => setOpenTopNavMenu(open ? "options" : null)}
        />
      </Show>
      <Show when={topBarVisible()}>
        <TopNav
          openMenu={openTopNavMenu}
          setOpenMenu={setOpenTopNavMenu}
          hotkeyBindings={topNavOptionsMenuProps.hotkeyBindings}
          hotkeyPlatform={topNavOptionsMenuProps.hotkeyPlatform}
          autoAttackEnabled={autoAttackEnabled}
          autoAttackProfileLabel={autoAttackProfileLabel}
          autoAttackConfiguredProfileLabel={autoAttackConfiguredProfileLabel}
          autoAttackLastError={autoAttackLastError}
          combatProfiles={() =>
            combatProfileLibrary().profiles.filter(
              (profile) => profile.id !== DEFAULT_COMBAT_PROFILE_ID,
            )
          }
          autoAttackMode={() => combatProfileLibrary().autoAttack.mode}
          selectedAutoAttackProfileId={() =>
            combatProfileLibrary().autoAttack.selectedProfileId
          }
          handleToggleAutoAttack={handleToggleAutoAttack}
          handleSelectAutoAttackProfile={handleSelectAutoAttackProfile}
          gameLoaded={gameLoaded}
          playerReady={playerReady}
          scriptLoaded={scriptLoaded}
          scriptRunning={scriptRunning}
          scriptStatus={scriptStatus}
          scriptDiagnosticsCount={scriptDiagnosticsCount}
          scriptUsePrivateRooms={scriptUsePrivateRooms}
          loadScript={loadScript}
          startScript={startScript}
          stopScript={stopScript}
          handleToggleScriptPrivateRooms={handleToggleScriptPrivateRooms}
          optionItems={topNavOptionsMenuProps.optionItems}
          walkSpeed={topNavOptionsMenuProps.walkSpeed}
          setWalkSpeed={topNavOptionsMenuProps.setWalkSpeed}
          handleSetWalkSpeed={topNavOptionsMenuProps.handleSetWalkSpeed}
          frameRate={topNavOptionsMenuProps.frameRate}
          setFrameRate={topNavOptionsMenuProps.setFrameRate}
          handleSetFrameRate={topNavOptionsMenuProps.handleSetFrameRate}
          customName={topNavOptionsMenuProps.customName}
          setCustomName={topNavOptionsMenuProps.setCustomName}
          handleSetCustomName={topNavOptionsMenuProps.handleSetCustomName}
          customGuild={topNavOptionsMenuProps.customGuild}
          setCustomGuild={topNavOptionsMenuProps.setCustomGuild}
          handleSetCustomGuild={topNavOptionsMenuProps.handleSetCustomGuild}
          autoZoneEnabled={autoZoneEnabled}
          autoZoneMap={autoZoneMap}
          handleToggleAutoZone={handleToggleAutoZone}
          handleSelectAutoZoneMap={handleSelectAutoZoneMap}
          autoReloginEnabled={autoReloginEnabled}
          autoReloginCaptured={autoReloginCaptured}
          autoReloginAttempting={autoReloginAttempting}
          autoReloginWaitingDelay={autoReloginWaitingDelay}
          autoReloginToggling={autoReloginToggling}
          autoReloginDelaySeconds={autoReloginDelaySeconds}
          setAutoReloginDelaySeconds={setAutoReloginDelaySeconds}
          autoReloginServer={autoReloginServer}
          autoReloginServers={autoReloginServers}
          autoReloginLastError={autoReloginLastError}
          autoReloginAttemptsRemaining={autoReloginAttemptsRemaining}
          handleToggleAutoRelogin={handleToggleAutoRelogin}
          handleRefreshAutoReloginServers={refreshAutoReloginServers}
          handleSelectAutoReloginServer={handleSelectAutoReloginServer}
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
      </Show>
      {process.env.NODE_ENV === "development" && DevDebugEvaluator ? (
        <DevDebugEvaluator
          applyLoadedScript={applyLoadedScript}
          refreshScriptMeta={refreshScriptMeta}
        />
      ) : null}

      <section
        id="loader-container"
        class="game-loader"
        classList={{ "game-loader--hidden": gameLoaded() }}
        aria-hidden={gameLoaded() ? "true" : undefined}
        aria-live="polite"
      >
        <div class="game-loader__content">
          <Spinner class="game-loader__spinner" size="xl" />
          <span id="progress-text" class="game-loader__text">
            Loading...
          </span>
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
