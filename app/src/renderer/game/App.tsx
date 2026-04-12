import { Effect, Fiber } from "effect";
import { createSignal, onCleanup } from "solid-js";
import { runtime } from "./flash/runtime";
import { Drops } from "./flash/Services/Drops";
import { Combat } from "./flash/Services/Combat";
import { World } from "./flash/Services/World";
import { AutoZone } from "./flash/Services/AutoZone";
import { Player } from "./flash/Services/Player";

export default function App() {
  const [count, setCount] = createSignal(0);
  const [targetName, setTargetName] = createSignal("");
  const [autoZoneEnabled, setAutoZoneEnabled] = createSignal(true);
  const [autoZoneMap, setAutoZoneMap] = createSignal("ledgermayne");
  let activeKillFiber: Fiber.Fiber<void, unknown> | undefined;

  const testBridge = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const player = yield* Player;
          const hp = yield* player.getHp();
          const maxHp = yield* player.getMaxHp();
          const mp = yield* player.getMp();
          const maxMp = yield* player.getMaxMp();
          const cell = yield* player.getCell();
          const state = yield* player.getState();
          console.log(`HP: ${hp}/${maxHp}, MP: ${mp}/${maxMp}`);
          console.log(`Cell: ${cell}, State: ${state}`);
        }) 
      )
      .catch((error) => {
        console.error("Bridge error:", error);
      });
  };

  const inspectWorld = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const world = yield* World;
          const state = yield* world.debug();
          console.log(state);
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
          const drops = yield* Drops;
          const dropsState = yield* drops.getDrops();
          console.log(dropsState);
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

  const stopKillTarget = () => {
    const fiber = activeKillFiber;
    activeKillFiber = undefined;

    if (!fiber) {
      return;
    }

    void runtime.runPromise(Fiber.interrupt(fiber)).catch((error) => {
      console.error("Interrupt kill error:", error);
    });
  };

  const killTarget = () => {
    const target = targetName().trim();
    if (target === "") {
      return;
    }

    stopKillTarget();

    const fiber = runtime.runFork(
      Effect.gen(function* () {
        const combat = yield* Combat;
        yield* combat.kill(target);
      }).pipe(
        Effect.catch((error) =>
          Effect.sync(() => {
            console.error("Kill error:", error);
          }),
        ),
      ),
    );

    activeKillFiber = fiber;

    void runtime.runPromise(Fiber.await(fiber)).finally(() => {
      if (activeKillFiber === fiber) {
        activeKillFiber = undefined;
      }
    });
  };

  onCleanup(() => {
    stopKillTarget();
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
          onClick={stopKillTarget}
          style={{
            padding: "5px 10px",
            cursor: "pointer",
            background: "#f59e0b",
            border: "none",
            color: "white",
            "border-radius": "4px",
          }}
        >
          disrupt kill
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
