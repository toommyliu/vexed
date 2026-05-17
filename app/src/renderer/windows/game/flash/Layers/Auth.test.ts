import { Effect, Fiber, Layer } from "effect";
import { TestClock } from "effect/testing";
import { expect, test } from "vitest";
import { Auth } from "../Services/Auth";
import type { AuthShape } from "../Services/Auth";
import { Bridge, type BridgeShape } from "../Services/Bridge";
import type { ConnectToSelectionResult } from "../Types";
import { AuthLive } from "./Auth";

type HarnessOptions = {
  readonly backButtonVisible?: boolean;
  readonly connStageNull?: boolean;
  readonly connText?: string;
  readonly currentLabel?: string;
  readonly selection: ConnectToSelectionResult;
};

const withAuth = async <A>(
  options: HarnessOptions,
  body: (auth: AuthShape) => Effect.Effect<A, unknown>,
  runOptions?: { readonly testClock?: boolean },
): Promise<A> => {
  const bridge = {
    call<K extends keyof Window["swf"]>(
      path: K,
      _args?: Parameters<Window["swf"][K]>,
    ) {
      return Effect.sync(() => {
        if (path === "auth.connectTo") {
          return options.selection as ReturnType<Window["swf"][K]>;
        }

        if (path === "flash.getGameObject") {
          return (options.currentLabel ??
            JSON.stringify("Login")) as ReturnType<Window["swf"][K]>;
        }

        if (path === "flash.isNull") {
          return (options.connStageNull ?? false) as ReturnType<
            Window["swf"][K]
          >;
        }

        if (path === "flash.getConnMcText") {
          return (options.connText ??
            "Connecting to game server...") as ReturnType<Window["swf"][K]>;
        }

        if (path === "flash.isConnMcBackButtonVisible") {
          return (options.backButtonVisible ?? false) as ReturnType<
            Window["swf"][K]
          >;
        }

        throw new Error(`unexpected bridge call: ${String(path)}`);
      });
    },
    callGameFunction() {
      return Effect.void;
    },
    onConnection() {
      return Effect.succeed(() => {});
    },
  } satisfies BridgeShape;

  return await Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const auth = yield* Auth;
        return yield* body(auth);
      }),
    ).pipe(
      Effect.provide(
        runOptions?.testClock === true
          ? Layer.mergeAll(
              AuthLive.pipe(Layer.provide(Layer.succeed(Bridge)(bridge))),
              TestClock.layer(),
            )
          : AuthLive.pipe(Layer.provide(Layer.succeed(Bridge)(bridge))),
      ),
    ),
  );
};

test("connectTo returns connected after selected server reaches game entry", async () => {
  const outcome = await withAuth(
    {
      connStageNull: true,
      currentLabel: JSON.stringify("Game"),
      selection: {
        status: "selected",
        message: "server selected",
        serverName: "Twig",
      },
    },
    (auth) => auth.connectTo("Twig"),
  );

  expect(outcome).toEqual({
    status: "connected",
    message: "connected",
    retryable: false,
    serverName: "Twig",
  });
});

test("connectTo reports full server as retryable immediate failure", async () => {
  const outcome = await withAuth(
    {
      selection: {
        status: "full",
        message: "server is full",
        serverName: "Twig",
      },
    },
    (auth) => auth.connectTo("Twig"),
  );

  expect(outcome).toEqual({
    status: "full",
    message: "server is full",
    retryable: true,
    serverName: "Twig",
  });
});

test("connectTo reports member-only server as non-retryable immediate failure", async () => {
  const outcome = await withAuth(
    {
      selection: {
        status: "member-only",
        message: "account is not authorized for member-only servers",
        serverName: "Twig",
      },
    },
    (auth) => auth.connectTo("Twig"),
  );

  expect(outcome.retryable).toBe(false);
  expect(outcome.status).toBe("member-only");
});

test("connectTo reports missing server as non-retryable immediate failure", async () => {
  const outcome = await withAuth(
    {
      selection: {
        status: "not-found",
        message: "server was not found",
      },
    },
    (auth) => auth.connectTo("Twig"),
  );

  expect(outcome).toEqual({
    status: "not-found",
    message: "server was not found",
    retryable: false,
  });
});

test("connectTo reports visible connection error as terminal retryable failure", async () => {
  const outcome = await withAuth(
    {
      backButtonVisible: true,
      connText: "Login Failed!",
      selection: {
        status: "selected",
        message: "server selected",
        serverName: "Twig",
      },
    },
    (auth) => auth.connectTo("Twig"),
  );

  expect(outcome).toEqual({
    status: "connection-error",
    message: "Login Failed!",
    retryable: true,
    serverName: "Twig",
  });
});

test("connectTo times out when selected server never reaches a terminal state", async () => {
  const outcome = await withAuth(
    {
      selection: {
        status: "selected",
        message: "server selected",
        serverName: "Twig",
      },
    },
    (auth) =>
      Effect.gen(function* () {
        const fiber = yield* Effect.forkDetach(auth.connectTo("Twig"), {
          startImmediately: true,
        });
        yield* Effect.yieldNow;
        yield* TestClock.adjust("16 seconds");
        return yield* Fiber.join(fiber);
      }),
    { testClock: true },
  );

  expect(outcome).toEqual({
    status: "timeout",
    message: "timed out connecting to server",
    retryable: true,
    serverName: "Twig",
  });
});
