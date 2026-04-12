import { Effect, Fiber, Option } from "effect";
import { createSignal, onCleanup } from "solid-js";
import { runtime } from "./flash/runtime";
import { Drops } from "./flash/Services/Drops";
import { Combat } from "./flash/Services/Combat";
import { WorldState } from "./flash/Services/WorldState";

export default function App() {
  const [count, setCount] = createSignal(0);
  const [targetName, setTargetName] = createSignal("");
  let activeKillFiber: Fiber.Fiber<void, unknown> | undefined;

  const testBridge = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const worldState = yield* WorldState;
          const me = yield* worldState.getSelf();
          console.log("me", me);
          console.log(me.toJSON());
          console.log(me.toString());
          if (Option.isSome(me)) {
            console.log(me.value);
          } else {
            console.log("no me");
          }
        }),
      )
      .catch((error) => {
        console.error("Bridge error:", error);
      });
  };

  const inspectWorldState = () => {
    void runtime
      .runPromise(
        Effect.gen(function* () {
          const worldState = yield* WorldState;
          const state = yield* worldState.debug();
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
        <button onClick={inspectWorldState}>inspect world state</button>
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
    </div>
  );
}
