import { Data, Effect, Layer } from "effect";
import { expect, test } from "vitest";
import { Army } from "../../army/Services/Army";
import { AutoRelogin } from "../../features/Services/AutoRelogin";
import { AutoZone } from "../../features/Services/AutoZone";
import { Auth, type AuthShape } from "../../flash/Services/Auth";
import { Bank } from "../../flash/Services/Bank";
import { Bridge, type BridgeShape } from "../../flash/Services/Bridge";
import { Combat } from "../../flash/Services/Combat";
import { Drops } from "../../flash/Services/Drops";
import { Environment } from "../../environment/Services/Environment";
import {
  GameEvents,
  type GameEvent,
  type GameEventHandler,
  type GameEventsShape,
} from "../../flash/Services/GameEvents";
import { House } from "../../flash/Services/House";
import { Inventory } from "../../flash/Services/Inventory";
import { Outfits } from "../../flash/Services/Outfits";
import { Packet } from "../../flash/Services/Packet";
import { Player } from "../../flash/Services/Player";
import { Quests } from "../../flash/Services/Quests";
import { Settings } from "../../flash/Services/Settings";
import { Shops } from "../../flash/Services/Shops";
import { TempInventory } from "../../flash/Services/TempInventory";
import { Wait } from "../../flash/Services/Wait";
import { World } from "../../flash/Services/World";
import { ScriptRunner } from "../Services/ScriptRunner";
import type { ScriptRunnerShape } from "../Services/ScriptRunner";
import type { ScriptDiagnostic } from "../Types";
import { ScriptRunnerLive } from "./ScriptRunner";

class ScriptRunnerEventTestError extends Data.TaggedError(
  "ScriptRunnerEventTestError",
)<{
  readonly cause?: unknown;
  readonly message: string;
}> {}

type HandlerStore = {
  [K in GameEvent]?: Set<GameEventHandler<K>>;
};

const makeGameEvents = (): GameEventsShape => {
  const handlers: HandlerStore = {};

  return {
    started: true,
    on(event, handler) {
      return Effect.sync(() => {
        const registered =
          (handlers[event] as Set<typeof handler> | undefined) ??
          new Set<typeof handler>();
        registered.add(handler);
        handlers[event] = registered as HandlerStore[typeof event];

        let disposed = false;
        return () => {
          if (disposed) {
            return;
          }

          disposed = true;
          registered.delete(handler);
        };
      });
    },
    emit(event, payload) {
      const registered = handlers[event] as
        | Set<GameEventHandler<typeof event>>
        | undefined;
      return Effect.forEach(
        registered ? Array.from(registered) : [],
        (handler) =>
          handler(payload).pipe(Effect.catchCause(() => Effect.void)),
        { discard: true },
      ).pipe(Effect.asVoid);
    },
  };
};

const makeEffectProxy = <A>(): A =>
  new Proxy(
    {},
    {
      get() {
        return () => Effect.succeed(undefined);
      },
    },
  ) as A;

const extensionPacket = (cmd = "event") => ({
  cmd,
  data: {},
  packetType: "json" as const,
  raw: "",
  type: "extension" as const,
});

const makeAuth = (): AuthShape => ({
  connectTo: () =>
    Effect.succeed({
      message: "connected",
      retryable: false,
      status: "connected",
    } as const),
  getLoginSession: () =>
    Effect.succeed({
      bSuccess: 1,
      iUpg: 0,
      servers: [],
      sToken: "password",
      unm: "Hero",
    }),
  getPassword: () => Effect.succeed("password"),
  getServers: () => Effect.succeed([]),
  getUsername: () => Effect.succeed("Hero"),
  isLoggedIn: () => Effect.succeed(true),
  isTemporarilyKicked: () => Effect.succeed(false),
  login: () => Effect.void,
  logout: () => Effect.void,
});

const makeBridge = (): BridgeShape => ({
  call: () => Effect.succeed(undefined as never),
  callGameFunction: () => Effect.succeed(undefined),
  onConnection(handler) {
    return Effect.sync(() => {
      handler("OnConnection");
      return () => undefined;
    });
  },
});

const makeWindow = () =>
  ({
    ipc: {
      scripting: {
        onExecute: () => () => undefined,
        onStop: () => () => undefined,
      },
      windows: {
        requestCloseGameWindow: () => undefined,
      },
    },
    swf: {},
  }) as unknown as Window;

const makeRuntimeLayer = (events: GameEventsShape) =>
  ScriptRunnerLive.pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.succeed(Army)(makeEffectProxy()),
        Layer.succeed(Auth)(makeAuth()),
        Layer.succeed(AutoRelogin)(makeEffectProxy()),
        Layer.succeed(AutoZone)(makeEffectProxy()),
        Layer.succeed(Bank)(makeEffectProxy()),
        Layer.succeed(Bridge)(makeBridge()),
        Layer.succeed(Combat)(makeEffectProxy()),
        Layer.succeed(Drops)(makeEffectProxy()),
        Layer.succeed(Environment)(makeEffectProxy()),
        Layer.succeed(GameEvents)(events),
        Layer.succeed(House)(makeEffectProxy()),
        Layer.succeed(Inventory)(makeEffectProxy()),
        Layer.succeed(Outfits)(makeEffectProxy()),
        Layer.succeed(Packet)(makeEffectProxy()),
        Layer.succeed(Player)(makeEffectProxy()),
        Layer.succeed(Quests)(makeEffectProxy()),
        Layer.succeed(Settings)(makeEffectProxy()),
        Layer.succeed(Shops)(makeEffectProxy()),
        Layer.succeed(TempInventory)(makeEffectProxy()),
        Layer.succeed(Wait)(makeEffectProxy()),
        Layer.succeed(World)(makeEffectProxy()),
      ),
    ),
  );

const withRunnerEvents = async <A>(
  body: (
    runner: ScriptRunnerShape,
    events: GameEventsShape,
  ) => Effect.Effect<A, unknown>,
): Promise<A> => {
  const hadWindow = "window" in globalThis;
  const previousWindow = globalThis.window;
  const events = makeGameEvents();

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: makeWindow(),
  });

  try {
    return await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const runner = yield* ScriptRunner;
          yield* Effect.sleep("10 millis");
          return yield* body(runner, events);
        }),
      ).pipe(Effect.provide(makeRuntimeLayer(events))),
    );
  } finally {
    if (hadWindow) {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: previousWindow,
      });
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  }
};

const waitForDiagnostics = (
  runner: ScriptRunnerShape,
  predicate: (diagnostics: readonly ScriptDiagnostic[]) => boolean,
): Effect.Effect<readonly ScriptDiagnostic[], ScriptRunnerEventTestError> =>
  Effect.gen(function* () {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const diagnostics = yield* runner.diagnostics();
      if (predicate(diagnostics)) {
        return diagnostics;
      }

      yield* Effect.sleep("10 millis");
    }

    return yield* new ScriptRunnerEventTestError({
      message: "timed out waiting for script diagnostics",
    });
  });

const waitUntilNotRunning = (
  runner: ScriptRunnerShape,
): Effect.Effect<void, ScriptRunnerEventTestError> =>
  Effect.gen(function* () {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (!(yield* runner.isRunning())) {
        return;
      }

      yield* Effect.sleep("10 millis");
    }

    return yield* new ScriptRunnerEventTestError({
      message: "timed out waiting for script to stop",
    });
  });

const diagnosticMessages = (diagnostics: readonly ScriptDiagnostic[]) =>
  diagnostics.map((diagnostic) => diagnostic.message);

test("script events on dispatches normalized semantic payloads", async () => {
  const diagnostics = await withRunnerEvents((runner, events) =>
    Effect.gen(function* () {
      yield* runner.run(
        `
const { api, script } = require("vexed");

module.exports = function* run() {
  yield* api.events.on("monsterDeath", (event) => {
    script.log("death:" + event.monMapId);
  });
  script.log("ready");
  yield* script.sleep(200);
};
`,
        { name: "events-on" },
      );

      yield* waitForDiagnostics(runner, (diagnostics) =>
        diagnosticMessages(diagnostics).includes("ready"),
      );
      yield* events.emit("monsterDeath", {
        monMapId: 7,
        packet: extensionPacket("addGoldExp"),
      });

      const diagnostics = yield* waitForDiagnostics(runner, (diagnostics) =>
        diagnosticMessages(diagnostics).includes("death:7"),
      );
      yield* runner.stop("test complete");
      return diagnostics;
    }),
  );

  expect(diagnosticMessages(diagnostics)).toContain("death:7");
});

test("script events once disposes after the first matching event", async () => {
  const diagnostics = await withRunnerEvents((runner, events) =>
    Effect.gen(function* () {
      yield* runner.run(
        `
const { api, script } = require("vexed");

module.exports = function* run() {
  yield* api.events.once("monsterDeath", (event) => {
    script.log("once:" + event.monMapId);
  });
  script.log("ready");
  yield* script.sleep(200);
};
`,
        { name: "events-once" },
      );

      yield* waitForDiagnostics(runner, (diagnostics) =>
        diagnosticMessages(diagnostics).includes("ready"),
      );
      yield* events.emit("monsterDeath", {
        monMapId: 1,
        packet: extensionPacket("addGoldExp"),
      });
      yield* events.emit("monsterDeath", {
        monMapId: 2,
        packet: extensionPacket("addGoldExp"),
      });
      yield* Effect.sleep("50 millis");

      const diagnostics = yield* runner.diagnostics();
      yield* runner.stop("test complete");
      return diagnostics;
    }),
  );

  expect(diagnosticMessages(diagnostics).filter((message) =>
    message.startsWith("once:"),
  )).toEqual(["once:1"]);
});

test("script events waitFor supports predicates and timeout", async () => {
  const diagnostics = await withRunnerEvents((runner, events) =>
    Effect.gen(function* () {
      yield* runner.run(
        `
const { api, script } = require("vexed");
const { Option } = require("effect");

module.exports = function* run() {
  script.log("ready");
  const quest = yield* api.events.waitFor("questComplete", {
    timeout: "200 millis",
    predicate: (event) => event.QuestID === 42,
  });
  script.log(Option.isSome(quest) ? "quest:" + quest.value.QuestID : "quest:timeout");

  const afk = yield* api.events.waitFor("afk", { timeout: "10 millis" });
  script.log(Option.isNone(afk) ? "afk:timeout" : "afk:unexpected");
};
`,
        { name: "events-wait-for" },
      );

      yield* waitForDiagnostics(runner, (diagnostics) =>
        diagnosticMessages(diagnostics).includes("ready"),
      );
      yield* events.emit("questComplete", {
        QuestID: 1,
        bSuccess: 1,
        packet: extensionPacket("ccqr"),
        rewardObj: {},
        sName: "Other Quest",
      });
      yield* events.emit("questComplete", {
        QuestID: 42,
        bSuccess: 1,
        packet: extensionPacket("ccqr"),
        rewardObj: {
          iCP: 0,
          intCoins: 0,
          intExp: 0,
          intGold: 0,
          typ: "q",
        },
        sName: "Twilly's New Staff",
      });

      return yield* waitForDiagnostics(runner, (diagnostics) => {
        const messages = diagnosticMessages(diagnostics);
        return messages.includes("quest:42") && messages.includes("afk:timeout");
      });
    }),
  );

  expect(diagnosticMessages(diagnostics)).toEqual(
    expect.arrayContaining(["quest:42", "afk:timeout"]),
  );
});

test("script event subscriptions are cleaned up when scripts finish", async () => {
  const diagnostics = await withRunnerEvents((runner, events) =>
    Effect.gen(function* () {
      yield* runner.run(
        `
const { api, script } = require("vexed");

module.exports = function* run() {
  yield* api.events.on("monsterDeath", () => {
    script.log("late-event");
  });
  script.log("registered");
};
`,
        { name: "events-cleanup" },
      );

      yield* waitForDiagnostics(runner, (diagnostics) =>
        diagnosticMessages(diagnostics).includes("registered"),
      );
      yield* waitUntilNotRunning(runner);
      yield* events.emit("monsterDeath", {
        monMapId: 7,
        packet: extensionPacket("addGoldExp"),
      });
      yield* Effect.sleep("50 millis");

      return yield* runner.diagnostics();
    }),
  );

  expect(diagnosticMessages(diagnostics)).not.toContain("late-event");
});

test("script event handler failures become diagnostics without unsubscribing", async () => {
  const diagnostics = await withRunnerEvents((runner, events) =>
    Effect.gen(function* () {
      yield* runner.run(
        `
const { api, script } = require("vexed");
const { Effect } = require("effect");

module.exports = function* run() {
  yield* api.events.on("monsterDeath", function* (event) {
    script.log("attempt:" + event.monMapId);
    yield* Effect.fail("boom");
  });
  script.log("ready");
  yield* script.sleep(300);
};
`,
        { name: "events-diagnostics" },
      );

      yield* waitForDiagnostics(runner, (diagnostics) =>
        diagnosticMessages(diagnostics).includes("ready"),
      );
      yield* events.emit("monsterDeath", {
        monMapId: 1,
        packet: extensionPacket("addGoldExp"),
      });
      yield* events.emit("monsterDeath", {
        monMapId: 2,
        packet: extensionPacket("addGoldExp"),
      });

      const diagnostics = yield* waitForDiagnostics(runner, (diagnostics) => {
        const messages = diagnosticMessages(diagnostics);
        return (
          messages.includes("attempt:2") &&
          messages.some((message) =>
            message.includes("api.events.monsterDeath event handler failed"),
          )
        );
      });
      yield* runner.stop("test complete");
      return diagnostics;
    }),
  );

  const messages = diagnosticMessages(diagnostics);
  expect(messages).toEqual(expect.arrayContaining(["attempt:1", "attempt:2"]));
  expect(messages.some((message) =>
    message.includes("api.events.monsterDeath event handler failed"),
  )).toBe(true);
});

test("script event queues drop overflow with diagnostics", async () => {
  const diagnostics = await withRunnerEvents((runner, events) =>
    Effect.gen(function* () {
      yield* runner.run(
        `
const { api, script } = require("vexed");

module.exports = function* run() {
  yield* api.events.on("packetFromClient", function* () {
    yield* script.sleep(500);
  });
  script.log("ready");
  yield* script.sleep(500);
};
`,
        { name: "events-overflow" },
      );

      yield* waitForDiagnostics(runner, (diagnostics) =>
        diagnosticMessages(diagnostics).includes("ready"),
      );

      for (let index = 0; index < 2_000; index += 1) {
        yield* events.emit("packetFromClient", `%xt%zm%mv%1%${index}%0%`);
      }

      const diagnostics = yield* waitForDiagnostics(runner, (diagnostics) =>
        diagnosticMessages(diagnostics).some((message) =>
          message.includes("Dropped api.events.packetFromClient callback event"),
        ),
      );
      yield* runner.stop("test complete");
      return diagnostics;
    }),
  );

  expect(diagnosticMessages(diagnostics).some((message) =>
    message.includes("Dropped api.events.packetFromClient callback event"),
  )).toBe(true);
});
