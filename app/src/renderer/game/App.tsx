import { Effect, Option } from "effect";
import { createSignal } from "solid-js";
import { runtime } from "./flash/runtime";
import { WorldState } from "./flash/Services/WorldState";
import { Drops } from "./flash/Services/Drops";

export default function App() {
  const [count, setCount] = createSignal(0);

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
      </div>
    </div>
  );
}
