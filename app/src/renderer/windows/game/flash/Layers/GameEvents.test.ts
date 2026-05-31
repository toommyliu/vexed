import { Effect } from "effect";
import { expect, test } from "vitest";
import { GameEvents, type GameEventsShape } from "../Services/GameEvents";
import { GameEventsLive } from "./GameEvents";

const withGameEvents = async <A>(
  body: (events: GameEventsShape) => Effect.Effect<A, unknown>,
): Promise<A> =>
  Effect.runPromise(
    Effect.gen(function* () {
      const events = yield* GameEvents;
      return yield* body(events);
    }).pipe(Effect.provide(GameEventsLive)),
  );

test("game events dispatches to multiple handlers and supports idempotent disposal", async () => {
  const observed = await withGameEvents((events) =>
    Effect.gen(function* () {
      const values: number[] = [];
      const disposeA = yield* events.on("monsterDeath", (event) =>
        Effect.sync(() => {
          values.push(event.monMapId);
        }),
      );
      yield* events.on("monsterDeath", (event) =>
        Effect.sync(() => {
          values.push(event.monMapId + 10);
        }),
      );

      yield* events.emit("monsterDeath", {
        monMapId: 2,
        packet: {
          cmd: "addGoldExp",
          data: [],
          packetType: "json",
          raw: "",
          type: "extension",
        },
      });

      disposeA();
      disposeA();

      yield* events.emit("monsterDeath", {
        monMapId: 3,
        packet: {
          cmd: "addGoldExp",
          data: [],
          packetType: "json",
          raw: "",
          type: "extension",
        },
      });

      return values;
    }),
  );

  expect(observed).toEqual([2, 12, 13]);
});

test("game events isolates handler failures", async () => {
  const observed = await withGameEvents((events) =>
    Effect.gen(function* () {
      const values: string[] = [];
      yield* events.on("zone", () => Effect.fail(new Error("boom")));
      yield* events.on("zone", (event) =>
        Effect.sync(() => {
          values.push(event.zone);
        }),
      );

      yield* events.emit("zone", {
        map: "battleon",
        zone: "A",
        packet: {
          cmd: "event",
          data: [],
          packetType: "json",
          raw: "",
          type: "extension",
        },
      });

      return values;
    }),
  );

  expect(observed).toEqual(["A"]);
});

test("game events uses dispatch snapshots", async () => {
  const observed = await withGameEvents((events) =>
    Effect.gen(function* () {
      const values: string[] = [];
      let disposeSecond: (() => void) | undefined;
      yield* events.on("packetFromClient", () =>
        Effect.sync(() => {
          values.push("first");
          disposeSecond?.();
        }),
      );
      disposeSecond = yield* events.on("packetFromClient", () =>
        Effect.sync(() => {
          values.push("second");
        }),
      );

      yield* events.emit("packetFromClient", "one");
      yield* events.emit("packetFromClient", "two");

      return values;
    }),
  );

  expect(observed).toEqual(["first", "second", "first"]);
});
