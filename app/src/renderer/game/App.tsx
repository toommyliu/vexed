import { Effect, Fiber } from "effect";
import { Monster } from "@vexed/game";
import { createSignal, onCleanup } from "solid-js";
import { runtime } from "./flash/Runtime";
import { Combat } from "./flash/Services/Combat";
import { AutoZone } from "./flash/Services/AutoZone";
import { Quests } from "./flash/Services/Quests";
import { Packet } from "./flash/Services/Packet";
import { Settings } from "./flash/Services/Settings";
import { Auth } from "./flash/Services/Auth";
import { World } from "./flash/Services/World";
import type { PacketListenerDisposer } from "./flash/Services/Packet";

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
  const [worldVisible, setWorldVisible] = createSignal(true);
  const [testClientPacket, setTestClientPacket] = createSignal("%xt%hello%");
  const [testServerPacket, setTestServerPacket] = createSignal("%xt%zm%cmd%");
  const [clientPacketType, setClientPacketType] = createSignal<
    "str" | "json" | "xml"
  >("str");
  const [serverPacketType, setServerPacketType] = createSignal<
    "String" | "Json"
  >("String");
  const [demoUsername, setDemoUsername] = createSignal("");
  let activeCombatFiber: Fiber.Fiber<void, unknown> | undefined;
  let packetLogDisposer: PacketListenerDisposer | undefined;

  const testBridge = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const auth = yield* Auth;
          yield* Effect.log({
            username: yield* auth.getUsername(),
            password: yield* auth.getPassword(),
          });
        }),
      )
      .catch((error) => {
        console.error("Bridge error:", error);
      });
  };

  const inspectWorld = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const quests = yield* Quests;
          const result = yield* quests.accept(11, false);
          console.log("Accept result:", result);
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
            packetLogDisposer = yield* packet.packetFromServer((rawPacket) =>
              Effect.sync(() => {
                console.log("[Server Packet]", rawPacket);
              }),
            );
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

  const handleEnemyMagnet = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const settings = yield* Settings;
          yield* settings.enemyMagnet();
          console.log("Enemy magnet activated");
        }),
      )
      .catch((error) => {
        console.error("Enemy magnet error:", error);
      });
  };

  const handleInfiniteRange = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const settings = yield* Settings;
          yield* settings.infiniteRange();
          console.log("Infinite range activated");
        }),
      )
      .catch((error) => {
        console.error("Infinite range error:", error);
      });
  };

  const handleProvokeCell = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const settings = yield* Settings;
          yield* settings.provokeCell();
          console.log("Provoke cell activated");
        }),
      )
      .catch((error) => {
        console.error("Provoke cell error:", error);
      });
  };

  const handleSkipCutscenes = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const settings = yield* Settings;
          yield* settings.skipCutscenes();
          console.log("Skip cutscenes activated");
        }),
      )
      .catch((error) => {
        console.error("Skip cutscenes error:", error);
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

  const handleToggleWorldVisible = () => {
    const newVisible = !worldVisible();
    setWorldVisible(newVisible);
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const settings = yield* Settings;
          yield* settings.setWorldVisible(newVisible);
          console.log("World", newVisible ? "visible" : "hidden");
        }),
      )
      .catch((error) => {
        console.error("Toggle world visible error:", error);
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

  onCleanup(() => {
    stopCombatTask();
    packetLogDisposer?.();
  });

  return (
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
            "border-radius": "4px",
          }}
        >
          {overlayVisible() ? "-" : "+"}
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
            <button
              onClick={handleEnemyMagnet}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                background: "#8b5cf6",
                border: "none",
                color: "white",
                "border-radius": "4px",
              }}
            >
              Enemy Magnet
            </button>
            <button
              onClick={handleInfiniteRange}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                background: "#8b5cf6",
                border: "none",
                color: "white",
                "border-radius": "4px",
              }}
            >
              Infinite Range
            </button>
            <button
              onClick={handleProvokeCell}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                background: "#8b5cf6",
                border: "none",
                color: "white",
                "border-radius": "4px",
              }}
            >
              Provoke Cell
            </button>
            <button
              onClick={handleSkipCutscenes}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
                background: "#8b5cf6",
                border: "none",
                color: "white",
                "border-radius": "4px",
              }}
            >
              Skip Cutscenes
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
                checked={worldVisible()}
                onChange={handleToggleWorldVisible}
                style={{ cursor: "pointer" }}
              />
              World Visible
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
        </>
      )}
    </div>
  );
}
