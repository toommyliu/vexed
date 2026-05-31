import { Data, Effect, Layer } from "effect";
import { expect, test } from "vitest";
import { Auth, type AuthShape } from "../Services/Auth";
import { Bridge, type BridgeShape } from "../Services/Bridge";
import { Packet, type PacketShape } from "../Services/Packet";
import { World, type WorldShape } from "../Services/World";
import { PacketLive } from "./Packet";

type PacketWindow = Pick<
  Window,
  "onExtensionResponse" | "packetFromClient" | "packetFromServer"
>;

class PacketTestError extends Data.TaggedError("PacketTestError")<{
  readonly cause?: unknown;
  readonly message: string;
}> {}

const bridge = {
  call<K extends keyof Window["swf"]>(
    _path: K,
    _args?: Parameters<Window["swf"][K]>,
  ) {
    return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
  },
  callGameFunction(_functionName: string, ..._args: ReadonlyArray<unknown>) {
    return Effect.void;
  },
  onConnection(_handler: (status: ConnectionStatus) => void) {
    return Effect.succeed(() => undefined);
  },
} satisfies BridgeShape;

const auth = {
  connectTo: () =>
    Effect.succeed({
      message: "connected",
      retryable: false,
      status: "connected",
    } as const),
  getServers: () => Effect.succeed([]),
  getUsername: () => Effect.succeed("Artix"),
  getPassword: () => Effect.succeed("password"),
  getLoginSession: () =>
    Effect.succeed({
      bSuccess: 1,
      iUpg: 0,
      servers: [],
      sToken: "password",
      unm: "Artix",
    }),
  isLoggedIn: () => Effect.succeed(true),
  isTemporarilyKicked: () => Effect.succeed(false),
  login: () => Effect.void,
  logout: () => Effect.void,
} satisfies AuthShape;

const world = {
  map: {
    getId: () => Effect.succeed(12),
    getName: () => Effect.succeed("battleon"),
    getRoomNumber: () => Effect.succeed(34_567),
  },
} as unknown as WorldShape;

const unavailableAuth = {
  ...auth,
  getUsername: () =>
    Effect.die(new PacketTestError({ message: "auth should not be read" })),
} satisfies AuthShape;

const unavailableWorld = {
  map: {
    getId: () =>
      Effect.die(new PacketTestError({ message: "map id should not be read" })),
    getName: () =>
      Effect.die(
        new PacketTestError({ message: "map name should not be read" }),
      ),
    getRoomNumber: () =>
      Effect.die(
        new PacketTestError({ message: "room number should not be read" }),
      ),
  },
} as unknown as WorldShape;

const withPacket = async <A>(
  body: (packet: PacketShape) => Effect.Effect<A, unknown>,
  testBridge: BridgeShape = bridge,
  services: {
    readonly auth?: AuthShape;
    readonly world?: WorldShape;
  } = {},
): Promise<A> => {
  const hadWindow = "window" in globalThis;
  const previousWindow = globalThis.window;
  const testWindow = {} as Window;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: testWindow,
  });

  try {
    return await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const packet = yield* Packet;
          return yield* body(packet);
        }),
      ).pipe(
        Effect.provide(
          PacketLive.pipe(
            Layer.provide(
              Layer.mergeAll(
                Layer.succeed(Auth)(services.auth ?? auth),
                Layer.succeed(Bridge)(testBridge),
                Layer.succeed(World)(services.world ?? world),
              ),
            ),
          ),
        ),
      ),
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

const waitForRawHandler = (promise: Promise<void>) =>
  Effect.tryPromise({
    try: () =>
      Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          setTimeout(
            () =>
              reject(
                new PacketTestError({
                  message: "timed out waiting for raw handler",
                }),
              ),
            1_000,
          );
        }),
      ]),
    catch: (cause) =>
      cause instanceof PacketTestError
        ? cause
        : new PacketTestError({
            cause,
            message: "raw handler wait failed",
          }),
  });

const emitPacketWindowEvent = (key: keyof PacketWindow, raw: string): void => {
  const handler = window[key];
  if (typeof handler !== "function") {
    throw new PacketTestError({
      message: `window.${key} was not registered`,
    });
  }

  handler(raw);
};

test("packetFromClient raw listener runs after internal client handler", async () => {
  const order = await withPacket((packet) =>
    Effect.gen(function* () {
      const calls: Array<string> = [];
      let resolveRaw: () => void = () => undefined;
      const rawObserved = new Promise<void>((resolve) => {
        resolveRaw = resolve;
      });

      yield* packet.client("mv", () =>
        Effect.sync(() => {
          calls.push("internal");
        }),
      );
      yield* packet.packetFromClient(() =>
        Effect.sync(() => {
          calls.push("raw");
          resolveRaw();
        }),
      );

      emitPacketWindowEvent("packetFromClient", "%xt%zm%mv%1%100%200%");
      yield* waitForRawHandler(rawObserved);

      return calls;
    }),
  );

  expect(order).toEqual(["internal", "raw"]);
});

test("packetFromServer raw listener runs after internal server handler", async () => {
  const order = await withPacket((packet) =>
    Effect.gen(function* () {
      const calls: Array<string> = [];
      let resolveRaw: () => void = () => undefined;
      const rawObserved = new Promise<void>((resolve) => {
        resolveRaw = resolve;
      });

      yield* packet.server("ct", () =>
        Effect.sync(() => {
          calls.push("internal");
        }),
      );
      yield* packet.packetFromServer(() =>
        Effect.sync(() => {
          calls.push("raw");
          resolveRaw();
        }),
      );

      emitPacketWindowEvent(
        "packetFromServer",
        '{"t":"xt","b":{"o":{"cmd":"ct"}}}',
      );
      yield* waitForRawHandler(rawObserved);

      return calls;
    }),
  );

  expect(order).toEqual(["internal", "raw"]);
});

test("onExtensionResponse raw listener runs after internal extension handler", async () => {
  const order = await withPacket((packet) =>
    Effect.gen(function* () {
      const calls: Array<string> = [];
      let resolveRaw: () => void = () => undefined;
      const rawObserved = new Promise<void>((resolve) => {
        resolveRaw = resolve;
      });

      yield* packet.json("event", () =>
        Effect.sync(() => {
          calls.push("internal");
        }),
      );
      yield* packet.onExtensionResponse(() =>
        Effect.sync(() => {
          calls.push("raw");
          resolveRaw();
        }),
      );

      emitPacketWindowEvent(
        "onExtensionResponse",
        '{"type":"json","dataObj":{"cmd":"event"}}',
      );
      yield* waitForRawHandler(rawObserved);

      return calls;
    }),
  );

  expect(order).toEqual(["internal", "raw"]);
});

test("unparseable packets still reach raw listeners", async () => {
  const observed = await withPacket((packet) =>
    Effect.gen(function* () {
      let rawPacket = "";
      let resolveRaw: () => void = () => undefined;
      const rawObserved = new Promise<void>((resolve) => {
        resolveRaw = resolve;
      });

      yield* packet.packetFromClient((value) =>
        Effect.sync(() => {
          rawPacket = value;
          resolveRaw();
        }),
      );

      emitPacketWindowEvent("packetFromClient", "not a parseable packet");
      yield* waitForRawHandler(rawObserved);

      return rawPacket;
    }),
  );

  expect(observed).toBe("not a parseable packet");
});

test("sendServer resolves supported placeholders before forwarding", async () => {
  const calls: Array<{ readonly functionName: string; readonly args: unknown[] }> =
    [];
  const capturingBridge = {
    ...bridge,
    callGameFunction(functionName: string, ...args: ReadonlyArray<unknown>) {
      calls.push({ args: [...args], functionName });
      return Effect.void;
    },
  } satisfies BridgeShape;

  await withPacket(
    (packet) =>
      packet.sendServer(
        "%xt%zm%cmd%{MAP_ID}%{ROOM_NUMBER}%{MAP_NAME}%{PLAYER_NAME}%ROOM_ID%",
      ),
    capturingBridge,
  );

  expect(calls).toEqual([
    {
      args: ["%xt%zm%cmd%12%34567%battleon%Artix%ROOM_ID%"],
      functionName: "sfc.sendString",
    },
  ]);
});

test("sendServer skips context lookups without supported placeholders", async () => {
  const calls: Array<{ readonly functionName: string; readonly args: unknown[] }> =
    [];
  const capturingBridge = {
    ...bridge,
    callGameFunction(functionName: string, ...args: ReadonlyArray<unknown>) {
      calls.push({ args: [...args], functionName });
      return Effect.void;
    },
  } satisfies BridgeShape;

  await withPacket(
    (packet) => packet.sendServer("%xt%zm%cmd%ROOM_ID%"),
    capturingBridge,
    { auth: unavailableAuth, world: unavailableWorld },
  );

  expect(calls).toEqual([
    {
      args: ["%xt%zm%cmd%ROOM_ID%"],
      functionName: "sfc.sendString",
    },
  ]);
});

test("sendClient resolves supported placeholders before forwarding", async () => {
  const calls: Array<{ readonly args: unknown; readonly path: string }> = [];
  const capturingBridge = {
    ...bridge,
    call<K extends keyof Window["swf"]>(
      path: K,
      args?: Parameters<Window["swf"][K]>,
    ) {
      calls.push({ args, path });
      return Effect.void as Effect.Effect<ReturnType<Window["swf"][K]>>;
    },
  } satisfies BridgeShape;

  await withPacket(
    (packet) => packet.sendClient("{PLAYER_NAME}:{ROOM_NUMBER}", "json"),
    capturingBridge,
  );

  expect(calls).toEqual([
    {
      args: ["Artix:34567", "json"],
      path: "flash.sendClientPacket",
    },
  ]);
});

test("internal handler failure does not prevent raw handlers", async () => {
  const order = await withPacket((packet) =>
    Effect.gen(function* () {
      const calls: Array<string> = [];
      let resolveRaw: () => void = () => undefined;
      const rawObserved = new Promise<void>((resolve) => {
        resolveRaw = resolve;
      });

      yield* packet.client("mv", () =>
        Effect.sync(() => {
          calls.push("internal");
        }).pipe(
          Effect.andThen(
            Effect.die(new PacketTestError({ message: "internal failure" })),
          ),
        ),
      );
      yield* packet.packetFromClient(() =>
        Effect.sync(() => {
          calls.push("raw");
          resolveRaw();
        }),
      );

      emitPacketWindowEvent("packetFromClient", "%xt%zm%mv%1%100%200%");
      yield* waitForRawHandler(rawObserved);

      return calls;
    }),
  );

  expect(order).toEqual(["internal", "raw"]);
});
