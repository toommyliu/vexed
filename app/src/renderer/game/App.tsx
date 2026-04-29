import { Effect, Fiber } from "effect";
import { Monster } from "@vexed/game";
import { createSignal, onCleanup, onMount } from "solid-js";
import type { JSX } from "solid-js";
import { runtime } from "./flash/Runtime";
import { Combat } from "./flash/Services/Combat";
import { AutoZone } from "./flash/Services/AutoZone";
import { Quests } from "./flash/Services/Quests";
import { Packet } from "./flash/Services/Packet";
import { Settings } from "./flash/Services/Settings";
import { Auth } from "./flash/Services/Auth";
import { World } from "./flash/Services/World";
import { Bank } from "./flash/Services/Bank";
import { Drops } from "./flash/Services/Drops";
import { House } from "./flash/Services/House";
import { Inventory } from "./flash/Services/Inventory";
import { Jobs } from "./flash/Services/Jobs";
import { Player } from "./flash/Services/Player";
import { Shops } from "./flash/Services/Shops";
import { TempInventory } from "./flash/Services/TempInventory";
import { demoScriptName, demoScriptSource } from "./scripting/demoScript";

const flashServiceDebugExamples = [
  {
    label: "settings",
    source: `const state = yield* Settings.getState();
console.log(state);
return state;`,
  },
  {
    label: "position",
    source: `const position = yield* Player.getPosition();
console.log(position);
return position;`,
  },
  {
    label: "target",
    source: `const target = yield* Combat.getTarget();
console.log(target);
return target;`,
  },
  {
    label: "monsters",
    source: `const monsters = yield* World.map.getCellMonsters();
console.log(monsters);
return monsters;`,
  },
  {
    label: "inventory",
    source: `const items = yield* Inventory.getItems();
console.log(items);
return items;`,
  },
  {
    label: "contains item",
    source: `const contains = yield* Inventory.contains("Health Potion");
console.log(contains);
return contains;`,
  },
  {
    label: "multi read",
    source: `const position = yield* Player.getPosition();
const cell = yield* Player.getCell();
const monsters = yield* World.map.getCellMonsters();

return { position, cell, monsters };`,
  },
];

const formatDebugValue = (value: unknown): string => {
  if (value === undefined) {
    return "undefined";
  }

  if (typeof value === "bigint") {
    return `${value}n`;
  }

  if (typeof value === "function") {
    return `[Function ${value.name || "anonymous"}]`;
  }

  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  const seen = new WeakSet<object>();

  return JSON.stringify(
    value,
    (_key, nestedValue) => {
      if (typeof nestedValue === "bigint") {
        return `${nestedValue}n`;
      }

      if (typeof nestedValue === "function") {
        return `[Function ${nestedValue.name || "anonymous"}]`;
      }

      if (typeof nestedValue === "object" && nestedValue !== null) {
        if (seen.has(nestedValue)) {
          return "[Circular]";
        }

        seen.add(nestedValue);
      }

      return nestedValue;
    },
    2,
  ) ?? String(value);
};

interface Point {
  readonly x: number;
  readonly y: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getInitialScriptOverlayPosition = (): Point => ({
  x: Math.max(20, window.innerWidth - 612),
  y: 20,
});

export default function App() {
  const [count, setCount] = createSignal(0);
  const [targetName, setTargetName] = createSignal("");
  const [itemNameOrId, setItemNameOrId] = createSignal("");
  const [itemQuantity, setItemQuantity] = createSignal("1");
  const [autoZoneEnabled, setAutoZoneEnabled] = createSignal(true);
  const [autoZoneMap, setAutoZoneMap] = createSignal("ledgermayne");
  const [findMost, setFindMost] = createSignal(false);
  const [packetLoggingEnabled, setPacketLoggingEnabled] = createSignal(false);
  const [overlayVisible, setOverlayVisible] = createSignal(false);
  const [customName, setCustomName] = createSignal("");
  const [customGuild, setCustomGuild] = createSignal("");
  const [walkSpeed, setWalkSpeed] = createSignal("8");
  const [frameRate, setFrameRate] = createSignal("24");
  const [deathAdsEnabled, setDeathAdsEnabled] = createSignal(false);
  const [collisionsEnabled, setCollisionsEnabled] = createSignal(true);
  const [effectsEnabled, setEffectsEnabled] = createSignal(true);
  const [playersVisible, setPlayersVisible] = createSignal(true);
  const [lagKillerEnabled, setLagKillerEnabled] = createSignal(false);
  const [renderPreset, setRenderPreset] =
    createSignal<RenderPreset>("normal");
  const [otherPlayerCosmeticsEnabled, setOtherPlayerCosmeticsEnabled] =
    createSignal(true);
  const [mapAnimationsEnabled, setMapAnimationsEnabled] = createSignal(true);
  const [enemyMagnetEnabled, setEnemyMagnetEnabled] = createSignal(false);
  const [infiniteRangeEnabled, setInfiniteRangeEnabled] = createSignal(false);
  const [provokeCellEnabled, setProvokeCellEnabled] = createSignal(false);
  const [skipCutscenesEnabled, setSkipCutscenesEnabled] = createSignal(false);
  const [testClientPacket, setTestClientPacket] = createSignal("%xt%hello%");
  const [testServerPacket, setTestServerPacket] = createSignal("%xt%zm%cmd%");
  const [clientPacketType, setClientPacketType] = createSignal<
    "str" | "json" | "xml"
  >("str");
  const [serverPacketType, setServerPacketType] = createSignal<
    "String" | "Json"
  >("String");
  const [demoUsername, setDemoUsername] = createSignal("");
  const [flashEvalCode, setFlashEvalCode] = createSignal(
    flashServiceDebugExamples[0]!.source,
  );
  const [flashEvalResult, setFlashEvalResult] = createSignal("No result yet");
  const [flashEvalRunning, setFlashEvalRunning] = createSignal(false);
  let activeCombatFiber: Fiber.Fiber<void, unknown> | undefined;
  let packetLogDisposer: (() => void) | undefined;
  let settingsStateDisposer: (() => void) | undefined;

  const [scriptOverlayVisible, setScriptOverlayVisible] = createSignal(false);
  const [scriptOverlayPosition, setScriptOverlayPosition] = createSignal(
    getInitialScriptOverlayPosition(),
  );
  const [scriptName, setScriptName] = createSignal(demoScriptName);
  const [scriptPath, setScriptPath] = createSignal<string | undefined>(undefined);
  const [scriptSource, setScriptSource] = createSignal(demoScriptSource);
  const [status, setStatus] = createSignal("Ready");
  const [commandCount, setCommandCount] = createSignal(0);
  const [running, setRunning] = createSignal(false);
  const [currentCommand, setCurrentCommand] =
    createSignal<RunningScriptCommand | null>(null);
  let scriptOverlayElement: HTMLDivElement | undefined;
  let scriptOverlayDragOffset: Point | undefined;

  const moveScriptOverlay = (clientX: number, clientY: number) => {
    const overlayWidth = scriptOverlayElement?.offsetWidth ?? 612;
    const overlayHeight = scriptOverlayElement?.offsetHeight ?? 520;
    const maxX = Math.max(0, window.innerWidth - overlayWidth);
    const maxY = Math.max(0, window.innerHeight - overlayHeight);
    const dragOffset = scriptOverlayDragOffset ?? { x: 0, y: 0 };

    setScriptOverlayPosition({
      x: clamp(clientX - dragOffset.x, 0, maxX),
      y: clamp(clientY - dragOffset.y, 0, maxY),
    });
  };

  const startScriptOverlayDrag: JSX.EventHandler<HTMLDivElement, PointerEvent> = (
    event,
  ) => {
    if (event.button !== 0 || !scriptOverlayElement) {
      return;
    }

    const rect = scriptOverlayElement.getBoundingClientRect();
    scriptOverlayDragOffset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const dragScriptOverlay: JSX.EventHandler<HTMLDivElement, PointerEvent> = (
    event,
  ) => {
    if (!scriptOverlayDragOffset) {
      return;
    }

    moveScriptOverlay(event.clientX, event.clientY);
  };

  const stopScriptOverlayDrag: JSX.EventHandler<HTMLDivElement, PointerEvent> = (
    event,
  ) => {
    scriptOverlayDragOffset = undefined;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const testBridge = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const quests = yield* Quests;
          console.log(yield* quests.getTree());
        }),
      )
      .catch((error) => {
        console.error("Bridge error:", error);
      });
  };

  const makeFlashServiceDebugApi = Effect.gen(function* () {
    const auth = yield* Auth;
    const autoZone = yield* AutoZone;
    const bank = yield* Bank;
    const combat = yield* Combat;
    const drops = yield* Drops;
    const house = yield* House;
    const inventory = yield* Inventory;
    const jobs = yield* Jobs;
    const packet = yield* Packet;
    const player = yield* Player;
    const quests = yield* Quests;
    const settings = yield* Settings;
    const shops = yield* Shops;
    const tempInventory = yield* TempInventory;
    const world = yield* World;

    return {
      Auth: auth,
      AutoZone: autoZone,
      Bank: bank,
      Combat: combat,
      Drops: drops,
      House: house,
      Inventory: inventory,
      Jobs: jobs,
      Packet: packet,
      Player: player,
      Quests: quests,
      Settings: settings,
      Shops: shops,
      TempInventory: tempInventory,
      World: world,
      api: {
        auth,
        autoZone,
        bank,
        combat,
        drops,
        house,
        inventory,
        jobs,
        packet,
        player,
        quests,
        settings,
        shops,
        tempInventory,
        world,
      },
      auth,
      autoZone,
      bank,
      combat,
      drops,
      house,
      inventory,
      jobs,
      packet,
      player,
      quests,
      settings,
      shops,
      tempInventory,
      world,
    } satisfies Record<string, unknown>;
  });

  const runFlashEval = () => {
    const source = flashEvalCode();
    setFlashEvalRunning(true);
    setFlashEvalResult("Running...");

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const services = yield* makeFlashServiceDebugApi;
          const program = yield* Effect.try({
            try: () => {
              const evaluate = new Function(
                "services",
                "Effect",
                `"use strict";
const {
  Auth,
  AutoZone,
  Bank,
  Combat,
  Drops,
  House,
  Inventory,
  Jobs,
  Packet,
  Player,
  Quests,
  Settings,
  Shops,
  TempInventory,
  World,
  api,
} = services;

return Effect.gen(function* () {
${source}
});`,
              ) as (
                services: Record<string, unknown>,
                effect: typeof Effect,
              ) => unknown;

              return evaluate(services, Effect);
            },
            catch: (cause) => cause,
          });

          if (Effect.isEffect(program)) {
            return yield* (program as Effect.Effect<unknown, unknown, never>);
          }

          return program;
        }),
      )
      .then((result) => {
        const formatted = formatDebugValue(result);
        setFlashEvalResult(formatted);
        console.log("[Flash Service Eval]", result);
      })
      .catch((error) => {
        console.error("[Flash Service Eval] error:", error);
        setFlashEvalResult(formatDebugValue(error));
      })
      .finally(() => {
        setFlashEvalRunning(false);
      });
  };

  const loadFlashEvalExample = (source: string) => {
    setFlashEvalCode(source);
  };

  const inspectWorld = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const quests = yield* Quests;
          console.log(yield* quests.getTree());
        }),
      )
      .catch((error) => {
        console.error("Inspection error:", error);
      });
  };

  const inspectDrops = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const quests = yield* Quests;
          yield* quests.abandon(11);
        }),
      )
      .catch((error) => {
        console.error("Inspection error:", error);
      });
  };

  const testGetTarget = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const combat = yield* Combat;
          const target = yield* combat.getTarget();
          if (target) {
            console.log(
              "Target type:",
              target instanceof Monster ? "Monster" : "Avatar",
            );
            console.log("Target data:", target);
          }
        }),
      )
      .catch((error) => {
        console.error("GetTarget error:", error);
      });
  };

  const testGetCellMonsters = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const world = yield* World;
          const monsters = yield* world.map.getCellMonsters();
          console.log("Cell monsters:", monsters);
          console.log("Count:", monsters.length);
        }),
      )
      .catch((error) => {
        console.error("GetCellMonsters error:", error);
      });
  };

  const toggleAutoZone = () => {
    const newEnabled = !autoZoneEnabled();
    setAutoZoneEnabled(newEnabled);
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const autoZone = yield* AutoZone;
          yield* autoZone.setEnabled(newEnabled);
          console.log("AutoZone", newEnabled ? "enabled" : "disabled");
        }),
      )
      .catch((error) => {
        console.error("AutoZone toggle error:", error);
      });
  };

  const applyAutoZoneMap = (map: string) => {
    setAutoZoneMap(map);
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const autoZone = yield* AutoZone;
          yield* autoZone.setMap(map as any);
          console.log("AutoZone map set to:", map);
        }),
      )
      .catch((error) => {
        console.error("AutoZone setMap error:", error);
      });
  };

  const togglePacketLogging = () => {
    const newEnabled = !packetLoggingEnabled();
    setPacketLoggingEnabled(newEnabled);

    if (newEnabled) {
      void runtime
        .runPromise(
          Effect.gen(function* () {
            const packet = yield* Packet;
            packetLogDisposer?.();

            const disposeClient = yield* packet.packetFromClient((rawPacket) =>
              Effect.sync(() => {
                console.log("[Client Packet]", rawPacket);
              }),
            );
            const disposeServer = yield* packet.packetFromServer((rawPacket) =>
              Effect.sync(() => {
                console.log("[Server Packet]", rawPacket);
              }),
            );

            packetLogDisposer = () => {
              disposeClient();
              disposeServer();
            };
            console.log("Packet logging enabled");
          }),
        )
        .catch((error) => {
          console.error("Packet logging enable error:", error);
          setPacketLoggingEnabled(false);
        });
    } else {
      packetLogDisposer?.();
      packetLogDisposer = undefined;
      console.log("Packet logging disabled");
    }
  };

  const stopCombatTask = () => {
    const fiber = activeCombatFiber;
    activeCombatFiber = undefined;

    if (!fiber) {
      return;
    }

    void runtime.runPromise(Fiber.interrupt(fiber)).catch((error) => {
      console.error("Interrupt combat task error:", error);
    });
  };

  const startCombatTask = (
    label: string,
    task: Effect.Effect<void, unknown, Combat>,
  ) => {
    stopCombatTask();

    const fiber = runtime.runFork(
      task.pipe(
        Effect.catch((error) =>
          Effect.sync(() => {
            console.error(`${label} error:`, error);
          }),
        ),
      ),
    );

    activeCombatFiber = fiber;

    void runtime.runPromise(Fiber.await(fiber)).finally(() => {
      if (activeCombatFiber === fiber) {
        activeCombatFiber = undefined;
      }
    });
  };

  const parseItemQuantity = (): number | undefined => {
    const value = itemQuantity().trim();
    if (value === "") {
      return undefined;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };

  const killTarget = () => {
    const target = targetName().trim();
    if (target === "") {
      return;
    }

    startCombatTask(
      "Kill",
      Effect.gen(function* () {
        const combat = yield* Combat;
        yield* combat.kill(target, {
          killPriority: ["Stalagbite", "Vath"],
          skillSet: [2, 4],
          skillWait: true,
        });
      }),
    );
  };

  const killForInventoryItem = () => {
    const target = targetName().trim();
    const item = itemNameOrId().trim();
    if (target === "" || item === "") {
      return;
    }

    const quantity = parseItemQuantity();

    startCombatTask(
      "Kill for inventory item",
      Effect.gen(function* () {
        const combat = yield* Combat;
        yield* combat.killForItem(target, item, quantity);
      }),
    );
  };

  const killForTempInventoryItem = () => {
    const target = targetName().trim();
    const item = itemNameOrId().trim();
    if (target === "" || item === "") {
      return;
    }

    const quantity = parseItemQuantity();

    startCombatTask(
      "Kill for temp inventory item",
      Effect.gen(function* () {
        const combat = yield* Combat;
        yield* combat.killForTempItem(target, item, quantity);
      }),
    );
  };

  const huntTarget = () => {
    const target = targetName().trim();
    if (target === "") {
      return;
    }

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const combat = yield* Combat;
          const cell = yield* combat.hunt(target, findMost());
          console.log("Hunt result - cell:", cell);
        }),
      )
      .catch((error) => {
        console.error("Hunt error:", error);
      });
  };

  const testCombatExit = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const combat = yield* Combat;
          const exited = yield* combat.exit();
          console.log("Combat exit result:", exited);
        }),
      )
      .catch((error) => {
        console.error("Combat exit error:", error);
      });
  };

  const handleToggleEnemyMagnet = () => {
    const nextEnabled = !enemyMagnetEnabled();
    setEnemyMagnetEnabled(nextEnabled);

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const settings = yield* Settings;
          yield* settings.setEnemyMagnetEnabled(nextEnabled);
          console.log("Enemy magnet", nextEnabled ? "enabled" : "disabled");
        }),
      )
      .catch((error) => {
        console.error("Toggle enemy magnet error:", error);
      });
  };

  const handleToggleInfiniteRange = () => {
    const nextEnabled = !infiniteRangeEnabled();
    setInfiniteRangeEnabled(nextEnabled);

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const settings = yield* Settings;
          yield* settings.setInfiniteRangeEnabled(nextEnabled);
          console.log("Infinite range", nextEnabled ? "enabled" : "disabled");
        }),
      )
      .catch((error) => {
        console.error("Toggle infinite range error:", error);
      });
  };

  const handleToggleProvokeCell = () => {
    const nextEnabled = !provokeCellEnabled();
    setProvokeCellEnabled(nextEnabled);

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const settings = yield* Settings;
          yield* settings.setProvokeCellEnabled(nextEnabled);
          console.log("Provoke cell", nextEnabled ? "enabled" : "disabled");
        }),
      )
      .catch((error) => {
        console.error("Toggle provoke cell error:", error);
      });
  };

  const handleToggleSkipCutscenes = () => {
    const nextEnabled = !skipCutscenesEnabled();
    setSkipCutscenesEnabled(nextEnabled);

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const settings = yield* Settings;
          yield* settings.setSkipCutscenesEnabled(nextEnabled);
          console.log("Skip cutscenes", nextEnabled ? "enabled" : "disabled");
        }),
      )
      .catch((error) => {
        console.error("Toggle skip cutscenes error:", error);
      });
  };

  const handleSetCustomName = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const settings = yield* Settings;
          yield* settings.setCustomName(customName());
          console.log("Custom name set to:", customName());
        }),
      )
      .catch((error) => {
        console.error("Set custom name error:", error);
      });
  };

  const handleSetCustomGuild = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const settings = yield* Settings;
          yield* settings.setCustomGuild(customGuild());
          console.log("Custom guild set to:", customGuild());
        }),
      )
      .catch((error) => {
        console.error("Set custom guild error:", error);
      });
  };

  const handleSetWalkSpeed = () => {
    const speed = Number.parseFloat(walkSpeed());
    if (Number.isNaN(speed) || speed <= 0) {
      console.error("Invalid walk speed");
      return;
    }

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const settings = yield* Settings;
          yield* settings.setWalkSpeed(speed);
          console.log("Walk speed set to:", speed);
        }),
      )
      .catch((error) => {
        console.error("Set walk speed error:", error);
      });
  };

  const handleSetFrameRate = () => {
    const fps = Number.parseInt(frameRate(), 10);
    if (Number.isNaN(fps) || fps <= 0) {
      console.error("Invalid frame rate");
      return;
    }

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const settings = yield* Settings;
          yield* settings.setFrameRate(fps);
          console.log("Frame rate set to:", fps);
        }),
      )
      .catch((error) => {
        console.error("Set frame rate error:", error);
      });
  };

  const handleToggleDeathAds = () => {
    const newEnabled = !deathAdsEnabled();
    setDeathAdsEnabled(newEnabled);
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const settings = yield* Settings;
          yield* settings.setDeathAdsEnabled(newEnabled);
          console.log("Death ads", newEnabled ? "enabled" : "disabled");
        }),
      )
      .catch((error) => {
        console.error("Toggle death ads error:", error);
      });
  };

  const handleToggleCollisions = () => {
    const newEnabled = !collisionsEnabled();
    setCollisionsEnabled(newEnabled);
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const settings = yield* Settings;
          yield* settings.setCollisionsEnabled(newEnabled);
          console.log("Collisions", newEnabled ? "enabled" : "disabled");
        }),
      )
      .catch((error) => {
        console.error("Toggle collisions error:", error);
      });
  };

  const handleToggleEffects = () => {
    const newEnabled = !effectsEnabled();
    setEffectsEnabled(newEnabled);
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const settings = yield* Settings;
          yield* settings.setEffectsEnabled(newEnabled);
          console.log("Effects", newEnabled ? "enabled" : "disabled");
        }),
      )
      .catch((error) => {
        console.error("Toggle effects error:", error);
      });
  };

  const handleTogglePlayersVisible = () => {
    const newVisible = !playersVisible();
    setPlayersVisible(newVisible);
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const settings = yield* Settings;
          yield* settings.setPlayersVisible(newVisible);
          console.log("Players", newVisible ? "visible" : "hidden");
        }),
      )
      .catch((error) => {
        console.error("Toggle players visible error:", error);
      });
  };

  const handleToggleLagKiller = () => {
    const nextEnabled = !lagKillerEnabled();
    setLagKillerEnabled(nextEnabled);
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const settings = yield* Settings;
          yield* settings.setLagKillerEnabled(nextEnabled);
          console.log("Lag killer", nextEnabled ? "enabled" : "disabled");
        }),
      )
      .catch((error) => {
        console.error("Toggle lag killer error:", error);
      });
  };

  const testSendClientPacket = () => {
    const packet = testClientPacket().trim();
    if (packet === "") {
      return;
    }

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const packetService = yield* Packet;
          yield* packetService.sendClient(packet, clientPacketType());
          console.log(
            "[Demo] Sent client packet:",
            packet,
            "type:",
            clientPacketType(),
          );
        }),
      )
      .catch((error) => {
        console.error("Send client packet error:", error);
      });
  };

  const testSendServerPacket = () => {
    const packet = testServerPacket().trim();
    if (packet === "") {
      return;
    }

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const packetService = yield* Packet;
          yield* packetService.sendServer(packet, serverPacketType());
          console.log(
            "[Demo] Sent server packet:",
            packet,
            "type:",
            serverPacketType(),
          );
        }),
      )
      .catch((error) => {
        console.error("Send server packet error:", error);
      });
  };

  const demoLogin = () => {
    const username = demoUsername().trim();
    if (username === "") {
      console.error("Username cannot be empty");
      return;
    }

    void runtime
      .runPromise(
        Effect.gen(function* () {
          const auth = yield* Auth;
          const password = yield* auth.getPassword();
          yield* auth.login(username, password);
          console.log("[Demo] Login attempted for username:", username);
        }),
      )
      .catch((error) => {
        console.error("Demo login error:", error);
      });
  };

  onMount(() => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const settings = yield* Settings;
          return yield* settings.onState((state) => {
            setCustomName(state.customName ?? "");
            setCustomGuild(state.customGuild ?? "");
            setWalkSpeed(String(state.walkSpeed));
            setFrameRate(String(state.frameRate));
            setDeathAdsEnabled(state.deathAdsEnabled);
            setCollisionsEnabled(state.collisionsEnabled);
            setEffectsEnabled(state.effectsEnabled);
            setPlayersVisible(state.playersVisible);
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
  });

  onCleanup(() => {
    stopCombatTask();
    packetLogDisposer?.();
    settingsStateDisposer?.();
  });


  const refreshMeta = async () => {
    if (!window.cmd) {
      setStatus("cmd global is not ready yet");
      return;
    }

    try {
      const [commands, isRunning, command] = await Promise.all([
        window.cmd.listCommands(),
        window.cmd.isRunning(),
        window.cmd.currentCommand(),
      ]);

      setCommandCount(commands.length);
      setRunning(isRunning);
      setCurrentCommand(command);
    } catch (error) {
      console.error("Failed to refresh scripting metadata", error);
    }
  };

  const loadDemo = () => {
    setScriptName(demoScriptName);
    setScriptPath(undefined);
    setScriptSource(demoScriptSource);
    setStatus("Loaded demo script");
  };

  const openScript = async () => {
    if (!window.cmd) {
      setStatus("cmd global is not ready yet");
      return;
    }

    try {
      const payload = await window.cmd.open();
      if (!payload) {
        setStatus("Open script cancelled");
        return;
      }

      setScriptName(payload.name ?? "external-script");
      setScriptPath(payload.path);
      setScriptSource(payload.source);
      setStatus(`Loaded ${payload.name ?? payload.path ?? "script"}`);
    } catch (error) {
      console.error("Failed to open script", error);
      setStatus("Failed to open script");
    }
  };

  const runScript = () => {
    if (!window.cmd) {
      setStatus("cmd global is not ready yet");
      return;
    }

    const source = scriptSource();
    if (source.trim() === "") {
      setStatus("Script is empty");
      return;
    }

    window.cmd.run(source, scriptName());
    setStatus(`Running ${scriptName()}`);
    void refreshMeta();
  };

  const stopScript = () => {
    if (!window.cmd) {
      setStatus("cmd global is not ready yet");
      return;
    }

    window.cmd.stop();
    setStatus("Stop requested");
    void refreshMeta();
  };

  onMount(() => {
    void refreshMeta();

    const interval = setInterval(() => {
      void refreshMeta();
    }, 1200);

    onCleanup(() => {
      clearInterval(interval);
    });
  });

  return (
    <>
    <div
      style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        background: "rgba(0, 0, 0, 0.7)",
        color: "white",
        "border-radius": "8px",
        "z-index": 100,
        "pointer-events": "auto",
        "font-family": "sans-serif",
      }}
    >
      <div style={{ display: "flex", "align-items": "center", gap: "10px" }}>
        <button
          onClick={() => setOverlayVisible(!overlayVisible())}
          style={{
            padding: "5px 10px",
            cursor: "pointer",
            background: "#374151",
            border: "none",
            color: "white",
            "border-radius": "8px",
            "z-index": 100,
            "pointer-events": "auto",
            "font-family": "sans-serif",
          }}
        >
          Flash Debug {overlayVisible() ? "-" : "+"}
        </button>
        <button
          onClick={() => setScriptOverlayVisible(!scriptOverlayVisible())}
          style={{
            padding: "5px 10px",
            cursor: "pointer",
            background: "#4f46e5",
            border: "none",
            color: "white",
            "border-radius": "8px",
            "z-index": 100,
            "pointer-events": "auto",
            "font-family": "sans-serif",
          }}
        >
          Script {scriptOverlayVisible() ? "-" : "+"}
        </button>
        {overlayVisible() && (
          <>
            <button
              onClick={() => setCount(count() + 1)}
              style={{
                cursor: "pointer",
                background: "#4f46e5",
                border: "none",
                color: "white",
                "border-radius": "4px",
              }}
            >
              count: {count()}
            </button>
            <button onClick={testBridge}>test bridge</button>
            <button onClick={inspectWorld}>inspect world</button>
            <button onClick={inspectDrops}>inspect drops</button>
            <button onClick={testGetTarget}>get target</button>
            <button onClick={testGetCellMonsters}>get cell monsters</button>
            <input
              type="text"
              value={demoUsername()}
              onInput={(e) => setDemoUsername(e.currentTarget.value)}
              placeholder="Demo username"
              style={{
                padding: "5px",
                "border-radius": "4px",
                border: "1px solid #ccc",
                background: "white",
                color: "black",
              }}
            />
            <button
              onClick={demoLogin}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                background: "#10b981",
                border: "none",
                color: "white",
                "border-radius": "4px",
              }}
            >
              demo login
            </button>
            <button
              onClick={togglePacketLogging}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                background: packetLoggingEnabled() ? "#059669" : "#6b7280",
                border: "none",
                color: "white",
                "border-radius": "4px",
              }}
            >
              {packetLoggingEnabled()
                ? "packet logging: ON"
                : "packet logging: OFF"}
            </button>
            <input
              type="text"
              value={targetName()}
              onInput={(e) => setTargetName(e.currentTarget.value)}
              placeholder="Target name or id:123"
              style={{
                padding: "5px",
                "border-radius": "4px",
                border: "1px solid #ccc",
                background: "white",
                color: "black",
              }}
            />
            <button
              onClick={killTarget}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                background: "#dc2626",
                border: "none",
                color: "white",
                "border-radius": "4px",
              }}
            >
              kill
            </button>
            <button
              onClick={stopCombatTask}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                background: "#f59e0b",
                border: "none",
                color: "white",
                "border-radius": "4px",
              }}
            >
              stop combat task
            </button>
            <button
              onClick={testCombatExit}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                background: "#6366f1",
                border: "none",
                color: "white",
                "border-radius": "4px",
              }}
            >
              combat exit
            </button>
          </>
        )}
      </div>
      {overlayVisible() && (
        <>
          <div
            style={{
              display: "flex",
              "align-items": "center",
              gap: "10px",
              "margin-top": "10px",
            }}
          >
            <input
              type="text"
              value={itemNameOrId()}
              onInput={(e) => setItemNameOrId(e.currentTarget.value)}
              placeholder="Item name or id:123"
              style={{
                padding: "5px",
                "border-radius": "4px",
                border: "1px solid #ccc",
                background: "white",
                color: "black",
              }}
            />
            <input
              type="text"
              value={itemQuantity()}
              onInput={(e) => setItemQuantity(e.currentTarget.value)}
              placeholder="Qty (optional, default 1)"
              style={{
                width: "170px",
                padding: "5px",
                "border-radius": "4px",
                border: "1px solid #ccc",
                background: "white",
                color: "black",
              }}
            />
            <button
              onClick={killForInventoryItem}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                background: "#7c3aed",
                border: "none",
                color: "white",
                "border-radius": "4px",
              }}
            >
              kill for inventory item
            </button>
            <button
              onClick={killForTempInventoryItem}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                background: "#0891b2",
                border: "none",
                color: "white",
                "border-radius": "4px",
              }}
            >
              kill for temp item
            </button>
          </div>
          <div
            style={{
              display: "flex",
              "align-items": "center",
              gap: "10px",
              "margin-top": "10px",
            }}
          >
            <label
              style={{ display: "flex", "align-items": "center", gap: "5px" }}
            >
              <input
                type="checkbox"
                checked={findMost()}
                onChange={(e) => setFindMost(e.currentTarget.checked)}
                style={{ cursor: "pointer" }}
              />
              Find most
            </label>
            <button
              onClick={huntTarget}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                background: "#059669",
                border: "none",
                color: "white",
                "border-radius": "4px",
              }}
            >
              hunt
            </button>
          </div>
          <div
            style={{
              display: "flex",
              "align-items": "center",
              gap: "10px",
              "margin-top": "10px",
            }}
          >
            <label
              style={{ display: "flex", "align-items": "center", gap: "5px" }}
            >
              <input
                type="checkbox"
                checked={autoZoneEnabled()}
                onChange={toggleAutoZone}
                style={{ cursor: "pointer" }}
              />
              AutoZone Enabled
            </label>
            <select
              value={autoZoneMap()}
              onInput={(e) => applyAutoZoneMap(e.currentTarget.value)}
              style={{
                padding: "5px",
                "border-radius": "4px",
                border: "1px solid #ccc",
                background: "white",
                color: "black",
                cursor: "pointer",
              }}
            >
              <option value="ledgermayne">ledgermayne</option>
              <option value="moreskulls">moreskulls</option>
              <option value="ultradage">ultradage</option>
              <option value="darkcarnax">darkcarnax</option>
              <option value="astralshrine">astralshrine</option>
            </select>
          </div>
          <div
            style={{
              display: "flex",
              "align-items": "center",
              gap: "10px",
              "margin-top": "10px",
              "flex-wrap": "wrap",
            }}
          >
            <label
              style={{ display: "flex", "align-items": "center", gap: "5px" }}
            >
              <input
                type="checkbox"
                checked={enemyMagnetEnabled()}
                onChange={handleToggleEnemyMagnet}
                style={{ cursor: "pointer" }}
              />
              Enemy Magnet
            </label>
            <label
              style={{ display: "flex", "align-items": "center", gap: "5px" }}
            >
              <input
                type="checkbox"
                checked={infiniteRangeEnabled()}
                onChange={handleToggleInfiniteRange}
                style={{ cursor: "pointer" }}
              />
              Infinite Range
            </label>
            <label
              style={{ display: "flex", "align-items": "center", gap: "5px" }}
            >
              <input
                type="checkbox"
                checked={provokeCellEnabled()}
                onChange={handleToggleProvokeCell}
                style={{ cursor: "pointer" }}
              />
              Provoke Cell
            </label>
            <label
              style={{ display: "flex", "align-items": "center", gap: "5px" }}
            >
              <input
                type="checkbox"
                checked={skipCutscenesEnabled()}
                onChange={handleToggleSkipCutscenes}
                style={{ cursor: "pointer" }}
              />
              Skip Cutscenes
            </label>
          </div>
          <div
            style={{
              display: "flex",
              "align-items": "center",
              gap: "10px",
              "margin-top": "10px",
              "flex-wrap": "wrap",
            }}
          >
            <input
              type="text"
              value={customName()}
              onInput={(e) => setCustomName(e.currentTarget.value)}
              placeholder="Custom Name"
              style={{
                padding: "5px",
                "border-radius": "4px",
                border: "1px solid #ccc",
                background: "white",
                color: "black",
              }}
            />
            <button
              onClick={handleSetCustomName}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                background: "#6366f1",
                border: "none",
                color: "white",
                "border-radius": "4px",
              }}
            >
              Set Name
            </button>
            <input
              type="text"
              value={customGuild()}
              onInput={(e) => setCustomGuild(e.currentTarget.value)}
              placeholder="Custom Guild"
              style={{
                padding: "5px",
                "border-radius": "4px",
                border: "1px solid #ccc",
                background: "white",
                color: "black",
              }}
            />
            <button
              onClick={handleSetCustomGuild}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                background: "#6366f1",
                border: "none",
                color: "white",
                "border-radius": "4px",
              }}
            >
              Set Guild
            </button>
          </div>
          <div
            style={{
              display: "flex",
              "align-items": "center",
              gap: "10px",
              "margin-top": "10px",
              "flex-wrap": "wrap",
            }}
          >
            <input
              type="text"
              value={walkSpeed()}
              onInput={(e) => setWalkSpeed(e.currentTarget.value)}
              placeholder="Walk Speed"
              style={{
                padding: "5px",
                "border-radius": "4px",
                border: "1px solid #ccc",
                background: "white",
                color: "black",
                width: "100px",
              }}
            />
            <button
              onClick={handleSetWalkSpeed}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                background: "#6366f1",
                border: "none",
                color: "white",
                "border-radius": "4px",
              }}
            >
              Set Speed
            </button>
            <input
              type="text"
              value={frameRate()}
              onInput={(e) => setFrameRate(e.currentTarget.value)}
              placeholder="FPS"
              style={{
                padding: "5px",
                "border-radius": "4px",
                border: "1px solid #ccc",
                background: "white",
                color: "black",
                width: "100px",
              }}
            />
            <button
              onClick={handleSetFrameRate}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                background: "#6366f1",
                border: "none",
                color: "white",
                "border-radius": "4px",
              }}
            >
              Set FPS
            </button>
          </div>
          <div
            style={{
              display: "flex",
              "align-items": "center",
              gap: "10px",
              "margin-top": "10px",
              "flex-wrap": "wrap",
            }}
          >
            <label
              style={{ display: "flex", "align-items": "center", gap: "5px" }}
            >
              <input
                type="checkbox"
                checked={deathAdsEnabled()}
                onChange={handleToggleDeathAds}
                style={{ cursor: "pointer" }}
              />
              Death Ads
            </label>
            <label
              style={{ display: "flex", "align-items": "center", gap: "5px" }}
            >
              <input
                type="checkbox"
                checked={collisionsEnabled()}
                onChange={handleToggleCollisions}
                style={{ cursor: "pointer" }}
              />
              Collisions
            </label>
            <label
              style={{ display: "flex", "align-items": "center", gap: "5px" }}
            >
              <input
                type="checkbox"
                checked={effectsEnabled()}
                onChange={handleToggleEffects}
                style={{ cursor: "pointer" }}
              />
              Effects
            </label>
            <label
              style={{ display: "flex", "align-items": "center", gap: "5px" }}
            >
              <input
                type="checkbox"
                checked={playersVisible()}
                onChange={handleTogglePlayersVisible}
                style={{ cursor: "pointer" }}
              />
              Players Visible
            </label>
            <label
              style={{ display: "flex", "align-items": "center", gap: "5px" }}
            >
              <input
                type="checkbox"
                checked={lagKillerEnabled()}
                onChange={handleToggleLagKiller}
                style={{ cursor: "pointer" }}
              />
              Lag Killer
            </label>
          </div>
          <div
            style={{
              display: "flex",
              "align-items": "center",
              gap: "10px",
              "margin-top": "10px",
              "flex-wrap": "wrap",
            }}
          >
            <input
              type="text"
              value={testClientPacket()}
              onInput={(e) => setTestClientPacket(e.currentTarget.value)}
              placeholder="Client packet"
              style={{
                padding: "5px",
                "border-radius": "4px",
                border: "1px solid #ccc",
                background: "white",
                color: "black",
                width: "200px",
              }}
            />
            <select
              value={clientPacketType()}
              onInput={(e) => setClientPacketType(e.currentTarget.value as any)}
              style={{
                padding: "5px",
                "border-radius": "4px",
                border: "1px solid #ccc",
                background: "white",
                color: "black",
                cursor: "pointer",
              }}
            >
              <option value="str">str</option>
              <option value="json">json</option>
              <option value="xml">xml</option>
            </select>
            <button
              onClick={testSendClientPacket}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                background: "#ec4899",
                border: "none",
                color: "white",
                "border-radius": "4px",
              }}
            >
              Send Client
            </button>
            <input
              type="text"
              value={testServerPacket()}
              onInput={(e) => setTestServerPacket(e.currentTarget.value)}
              placeholder="Server packet"
              style={{
                padding: "5px",
                "border-radius": "4px",
                border: "1px solid #ccc",
                background: "white",
                color: "black",
                width: "200px",
              }}
            />
            <select
              value={serverPacketType()}
              onInput={(e) => setServerPacketType(e.currentTarget.value as any)}
              style={{
                padding: "5px",
                "border-radius": "4px",
                border: "1px solid #ccc",
                background: "white",
                color: "black",
                cursor: "pointer",
              }}
            >
              <option value="String">String</option>
              <option value="Json">Json</option>
            </select>
            <button
              onClick={testSendServerPacket}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                background: "#ec4899",
                border: "none",
                color: "white",
                "border-radius": "4px",
              }}
            >
              Send Server
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gap: "8px",
              "margin-top": "10px",
              width: "min(760px, calc(100vw - 40px))",
            }}
          >
            <div
              style={{
                display: "flex",
                "align-items": "center",
                gap: "8px",
                "flex-wrap": "wrap",
              }}
            >
              <span style={{ "font-size": "12px", opacity: 0.85 }}>
                Effect service code
              </span>
              <button
                onClick={runFlashEval}
                disabled={flashEvalRunning()}
                style={{
                  padding: "5px 10px",
                  cursor: flashEvalRunning() ? "default" : "pointer",
                  background: flashEvalRunning() ? "#6b7280" : "#0f766e",
                  border: "none",
                  color: "white",
                  "border-radius": "4px",
                }}
              >
                {flashEvalRunning() ? "Running" : "Run"}
              </button>
              <span style={{ "font-size": "11px", opacity: 0.7 }}>
                Use yield* with Inventory, Player, World, Combat, Settings, api
              </span>
            </div>
            <textarea
              value={flashEvalCode()}
              onInput={(e) => setFlashEvalCode(e.currentTarget.value)}
              rows={10}
              spellcheck={false}
              style={{
                width: "100%",
                resize: "vertical",
                padding: "8px",
                "border-radius": "4px",
                border: "1px solid #555",
                background: "#111827",
                color: "white",
                "font-family": "ui-monospace, Menlo, monospace",
                "font-size": "12px",
              }}
            />
            <div
              style={{
                display: "flex",
                gap: "6px",
                "flex-wrap": "wrap",
              }}
            >
              {flashServiceDebugExamples.map((example) => (
                <button onClick={() => loadFlashEvalExample(example.source)}>
                  {example.label}
                </button>
              ))}
            </div>
            <pre
              style={{
                margin: 0,
                padding: "8px",
                "max-height": "220px",
                overflow: "auto",
                "border-radius": "4px",
                background: "#030712",
                color: "#d1d5db",
                "font-family": "ui-monospace, Menlo, monospace",
                "font-size": "12px",
                "white-space": "pre-wrap",
              }}
            >
              {flashEvalResult()}
            </pre>
          </div>
        </>
      )}
    </div>
    {scriptOverlayVisible() && (
      <div
        ref={scriptOverlayElement}
        style={{
          position: "absolute",
          top: `${scriptOverlayPosition().y}px`,
          left: `${scriptOverlayPosition().x}px`,
          width: "560px",
          padding: "1rem",
          background: "rgba(0, 0, 0, 0.85)",
          color: "white",
          "border-radius": "8px",
          "z-index": 101,
          "pointer-events": "auto",
          "font-family": "sans-serif",
          display: "flex",
          "flex-direction": "column",
          gap: "0.5rem",
        }}
      >
        <div
          onPointerDown={startScriptOverlayDrag}
          onPointerMove={dragScriptOverlay}
          onPointerUp={stopScriptOverlayDrag}
          onPointerCancel={stopScriptOverlayDrag}
          style={{
            "font-weight": "bold",
            cursor: "move",
            "user-select": "none",
            "touch-action": "none",
          }}
        >
          Scripting Demo
        </div>
        <div style={{ "font-size": "12px", opacity: 0.85 }}>
          Commands: {commandCount()} · Running: {running() ? "yes" : "no"}
        </div>
        <div style={{ "font-size": "12px", opacity: 0.8 }}>
          Current command: {" "}
          {currentCommand()
            ? `#${currentCommand()!.index} ${currentCommand()!.name}`
            : "idle"}
        </div>
        <div style={{ "font-size": "12px", opacity: 0.75 }}>
          {scriptPath() ? `Path: ${scriptPath()}` : "Using in-memory script"}
        </div>

        <input
          value={scriptName()}
          onInput={(event) => setScriptName(event.currentTarget.value)}
          placeholder="script name"
          style={{
            padding: "6px 8px",
            border: "1px solid #555",
            "border-radius": "4px",
            background: "#111",
            color: "white",
          }}
        />

        <textarea
          value={scriptSource()}
          onInput={(event) => setScriptSource(event.currentTarget.value)}
          rows={14}
          style={{
            width: "100%",
            resize: "vertical",
            padding: "8px",
            border: "1px solid #555",
            "border-radius": "4px",
            background: "#111",
            color: "white",
            "font-family": "ui-monospace, Menlo, monospace",
            "font-size": "12px",
          }}
        />

        <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
          <button onClick={loadDemo}>Load demo</button>
          <button onClick={() => void openScript()}>Open file...</button>
          <button onClick={runScript}>Run</button>
          <button onClick={stopScript}>Stop</button>
          <button onClick={() => void refreshMeta()}>Refresh</button>
        </div>

        <div style={{ "font-size": "12px", opacity: 0.85 }}>Status: {status()}</div>
        <div style={{ "font-size": "11px", opacity: 0.65 }}>
          Tip: Ctrl/Cmd+O opens a script file. Ctrl/Cmd+Shift+X stops active script.
        </div>
      </div>
    )}
    </>
  );
}
