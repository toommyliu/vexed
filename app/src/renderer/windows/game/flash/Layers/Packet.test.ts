import { Data, Effect, Layer } from "effect";
import { expect, test } from "vitest";
import { Bridge, type BridgeShape } from "../Services/Bridge";
import { Packet, type PacketShape } from "../Services/Packet";
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

const withPacket = async <A>(
  body: (packet: PacketShape) => Effect.Effect<A, unknown>,
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
          PacketLive.pipe(Layer.provide(Layer.succeed(Bridge)(bridge))),
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
