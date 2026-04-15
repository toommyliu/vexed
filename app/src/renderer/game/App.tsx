import { Effect, Fiber } from "effect";
import { createSignal, onCleanup } from "solid-js";
import { runtime } from "./flash/Runtime";
import { Combat } from "./flash/Services/Combat";
import { AutoZone } from "./flash/Services/AutoZone";
import { Quests } from "./flash/Services/Quests";
import { Inventory } from "./flash/Services/Inventory";
export default function App() {
  const [count, setCount] = createSignal(0);
  const [targetName, setTargetName] = createSignal("");
  const [itemNameOrId, setItemNameOrId] = createSignal("");
  const [itemQuantity, setItemQuantity] = createSignal("1");
  const [autoZoneEnabled, setAutoZoneEnabled] = createSignal(true);
  const [autoZoneMap, setAutoZoneMap] = createSignal("ledgermayne");
  const [findMost, setFindMost] = createSignal(false);
  let activeCombatFiber: Fiber.Fiber<void, unknown> | undefined;

  const testBridge = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const inventory = yield* Inventory;
          const items = yield* inventory.getItems();
          console.log("Inventory items:", items);
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
        yield* combat.kill(target);
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

  onCleanup(() => {
    stopCombatTask();
  });

  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        padding: "1rem",
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
          onClick={() => setCount(count() + 1)}
          style={{
            padding: "5px 10px",
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
      </div>
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
        <label style={{ display: "flex", "align-items": "center", gap: "5px" }}>
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
        <label style={{ display: "flex", "align-items": "center", gap: "5px" }}>
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
    </div>
  );
}
