import { Data, Effect, Layer } from "effect";
import { expect, test } from "vitest";
import { Auth, type AuthShape } from "../Services/Auth";
import { Bridge, type BridgeShape } from "../Services/Bridge";
import {
  PacketDomain,
  type PacketDomainEventMap,
  type PacketDomainShape,
} from "../Services/PacketDomain";
import { PacketLive } from "./Packet";
import { PacketDomainLive } from "./PacketDomain";
import { WorldLive } from "./World";

type PacketWindow = Pick<Window, "packetFromServer">;

class PacketDomainTestError extends Data.TaggedError("PacketDomainTestError")<{
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
  getUsername: () => Effect.succeed("Main"),
  getPassword: () => Effect.succeed("password"),
  getLoginSession: () =>
    Effect.succeed({
      bSuccess: 1,
      iUpg: 0,
      servers: [],
      sToken: "password",
      unm: "Main",
    }),
  isLoggedIn: () => Effect.succeed(true),
  isTemporarilyKicked: () => Effect.succeed(false),
  login: () => Effect.void,
  logout: () => Effect.void,
} satisfies AuthShape;

const runtimeLayer = PacketDomainLive.pipe(
  Layer.provide(
    Layer.mergeAll(
      PacketLive.pipe(Layer.provide(Layer.succeed(Bridge)(bridge))),
      WorldLive.pipe(Layer.provide(Layer.succeed(Bridge)(bridge))),
      Layer.succeed(Auth)(auth),
    ),
  ),
);

const withPacketDomain = async <A>(
  body: (packetDomain: PacketDomainShape) => Effect.Effect<A, unknown>,
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
          const packetDomain = yield* PacketDomain;
          return yield* body(packetDomain);
        }),
      ).pipe(Effect.provide(runtimeLayer)),
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

const emitServerPacket = (raw: string): void => {
  const handler = (window as PacketWindow).packetFromServer;
  if (typeof handler !== "function") {
    throw new PacketDomainTestError({
      message: "window.packetFromServer was not registered",
    });
  }

  handler(raw);
};

const waitForEvent = <A>(promise: Promise<A>) =>
  Effect.tryPromise({
    try: () =>
      Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          setTimeout(
            () =>
              reject(
                new PacketDomainTestError({
                  message: "timed out waiting for event",
                }),
              ),
            500,
          );
        }),
      ]),
    catch: (cause) =>
      cause instanceof PacketDomainTestError
        ? cause
        : new PacketDomainTestError({
            cause,
            message: "event wait failed",
          }),
  });

test("packet domain emits animation message events with monster ids", async () => {
  const event = await withPacketDomain((packetDomain) =>
    Effect.gen(function* () {
      let resolveEvent:
        | ((event: PacketDomainEventMap["animationMessage"]) => void)
        | undefined;
      const observed = new Promise<PacketDomainEventMap["animationMessage"]>(
        (resolve) => {
          resolveEvent = resolve;
        },
      );

      yield* packetDomain.on("animationMessage", (messageEvent) =>
        Effect.sync(() => resolveEvent?.(messageEvent)),
      );

      emitServerPacket(
        '{"t":"xt","b":{"o":{"cmd":"ct","anims":[{"msg":"defense shattering","tInf":"m:2"}]}}}',
      );

      return yield* waitForEvent(observed);
    }),
  );

  expect(event.message).toBe("defense shattering");
  expect(event.monMapId).toBe(2);
});

test("packet domain emits monster aura add and remove events", async () => {
  const events = await withPacketDomain((packetDomain) =>
    Effect.gen(function* () {
      const observed: Array<PacketDomainEventMap["auraAdded" | "auraRemoved"]> =
        [];
      let resolveEvents:
        | ((
            events: Array<PacketDomainEventMap["auraAdded" | "auraRemoved"]>,
          ) => void)
        | undefined;
      const done = new Promise<
        Array<PacketDomainEventMap["auraAdded" | "auraRemoved"]>
      >((resolve) => {
        resolveEvents = resolve;
      });

      const pushEvent = (
        event: PacketDomainEventMap["auraAdded" | "auraRemoved"],
      ) => {
        observed.push(event);
        if (observed.length === 2) {
          resolveEvents?.(observed);
        }
      };

      yield* packetDomain.on("auraAdded", (event) =>
        Effect.sync(() => pushEvent(event)),
      );
      yield* packetDomain.on("auraRemoved", (event) =>
        Effect.sync(() => pushEvent(event)),
      );

      emitServerPacket(
        '{"t":"xt","b":{"o":{"cmd":"ct","a":[{"cmd":"aura+","tInf":"m:2","auras":[{"icon":"iwd1,ied1","isNew":true,"nam":"Focus"}]},{"cmd":"aura-","tInf":"m:2","aura":{"nam":"Focus"}}]}}}',
      );

      return yield* waitForEvent(done);
    }),
  );

  expect(events).toMatchObject([
    {
      aura: { icon: "iwd1,ied1" },
      auraName: "Focus",
      targetId: 2,
      targetType: "monster",
    },
    { auraName: "Focus", targetId: 2, targetType: "monster" },
  ]);
});
