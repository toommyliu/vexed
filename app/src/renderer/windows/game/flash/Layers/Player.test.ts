import { Effect, Layer, Option } from "effect";
import { expect, test } from "vitest";
import { Auth, type AuthShape } from "../Services/Auth";
import { Bridge, type BridgeShape } from "../Services/Bridge";
import { Inventory, type InventoryShape } from "../Services/Inventory";
import {
  Packet,
  type ExtensionPacketHandler,
  type PacketShape,
} from "../Services/Packet";
import { Player, type PlayerShape } from "../Services/Player";
import { Wait, type WaitShape } from "../Services/Wait";
import { World, type WorldShape } from "../Services/World";
import { PlayerLive } from "./Player";

const auth = {
  isLoggedIn: () => Effect.succeed(true),
} as unknown as AuthShape;

const inventory = {} as InventoryShape;

const makeWorld = (state: {
  readonly isLoaded: () => boolean;
  readonly mapName: () => string;
  readonly roomNumber: () => number;
}): WorldShape =>
  ({
    map: {
      isLoaded: () => Effect.succeed(state.isLoaded()),
      getName: () => Effect.succeed(state.mapName()),
      getRoomNumber: () => Effect.succeed(state.roomNumber()),
      getCells: () => Effect.succeed([]),
    },
    players: {
      withSelf: () => Effect.succeed(Option.none()),
    },
  }) as unknown as WorldShape;

const wait = {
  until: (condition) => condition,
  untilSome: (condition) => condition,
  isGameActionAvailable: () => Effect.succeed(true),
  forGameAction: () => Effect.succeed(true),
} as WaitShape;

const makePacket = (state: {
  warningHandler: ExtensionPacketHandler | undefined;
  disposed: boolean;
}): PacketShape =>
  ({
    str(cmd: string, handler: ExtensionPacketHandler) {
      expect(cmd).toBe("warning");
      state.warningHandler = handler;
      return Effect.succeed(() => {
        state.warningHandler = undefined;
        state.disposed = true;
      });
    },
  }) as unknown as PacketShape;

const withPlayer = async <A>(
  services: {
    readonly bridge: BridgeShape;
    readonly packet: PacketShape;
    readonly world: WorldShape;
  },
  body: (player: PlayerShape) => Effect.Effect<A, unknown>,
): Promise<A> =>
  Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const player = yield* Player;
        return yield* body(player);
      }),
    ).pipe(
      Effect.provide(
        PlayerLive.pipe(
          Layer.provide(
            Layer.mergeAll(
              Layer.succeed(Auth)(auth),
              Layer.succeed(Bridge)(services.bridge),
              Layer.succeed(Inventory)(inventory),
              Layer.succeed(Packet)(services.packet),
              Layer.succeed(Wait)(wait),
              Layer.succeed(World)(services.world),
            ),
          ),
        ),
      ),
    ),
  );

test("joinMap returns promptly when the server warns that the target map is invalid", async () => {
  const packetState = {
    warningHandler: undefined as ExtensionPacketHandler | undefined,
    disposed: false,
  };
  const bridgeCalls: unknown[][] = [];

  const bridge = {
    call(path, args) {
      expect(path).toBe("player.joinMap");
      bridgeCalls.push(args ?? []);

      return Effect.gen(function* () {
        const handler = packetState.warningHandler;
        expect(handler).toBeDefined();

        yield* handler!({
          type: "extension",
          raw: "",
          packetType: "str",
          cmd: "warning",
          data: ["warning", "-1", '"highcommand" is an Membership-Only Map.'],
        });
      }) as never;
    },
    callGameFunction: () => Effect.void,
    onConnection: () => Effect.succeed(() => undefined),
  } as BridgeShape;

  await withPlayer(
    {
      bridge,
      packet: makePacket(packetState),
      world: makeWorld({
        isLoaded: () => false,
        mapName: () => "",
        roomNumber: () => 0,
      }),
    },
    (player) => player.joinMap("highcommand"),
  );

  expect(bridgeCalls).toEqual([["highcommand"]]);
  expect(packetState.disposed).toBe(true);
});

test("joinMap ignores invalid-map warnings for other maps", async () => {
  const packetState = {
    warningHandler: undefined as ExtensionPacketHandler | undefined,
    disposed: false,
  };
  let loaded = false;
  const bridgeCalls: unknown[][] = [];

  const bridge = {
    call(path, args) {
      expect(path).toBe("player.joinMap");
      bridgeCalls.push(args ?? []);

      return Effect.gen(function* () {
        const handler = packetState.warningHandler;
        expect(handler).toBeDefined();

        yield* handler!({
          type: "extension",
          raw: "",
          packetType: "str",
          cmd: "warning",
          data: ["warning", "-1", '"highcommand" is an Membership-Only Map.'],
        });

        loaded = true;
      }) as never;
    },
    callGameFunction: () => Effect.void,
    onConnection: () => Effect.succeed(() => undefined),
  } as BridgeShape;

  await withPlayer(
    {
      bridge,
      packet: makePacket(packetState),
      world: makeWorld({
        isLoaded: () => loaded,
        mapName: () => "battleon",
        roomNumber: () => 1,
      }),
    },
    (player) => player.joinMap("battleon"),
  );

  expect(bridgeCalls).toEqual([["battleon"]]);
  expect(loaded).toBe(true);
  expect(packetState.disposed).toBe(true);
});

test("joinMap does not skip transfer when the target uses a different fixed room", async () => {
  const packetState = {
    warningHandler: undefined as ExtensionPacketHandler | undefined,
    disposed: false,
  };
  let roomNumber = 999;
  const bridgeCalls: unknown[][] = [];

  const bridge = {
    call(path, args) {
      expect(path).toBe("player.joinMap");
      bridgeCalls.push(args ?? []);
      roomNumber = 48_392;
      return Effect.void as never;
    },
    callGameFunction: () => Effect.void,
    onConnection: () => Effect.succeed(() => undefined),
  } as BridgeShape;

  await withPlayer(
    {
      bridge,
      packet: makePacket(packetState),
      world: makeWorld({
        isLoaded: () => true,
        mapName: () => "battleon",
        roomNumber: () => roomNumber,
      }),
    },
    (player) => player.joinMap("battleon-48392"),
  );

  expect(bridgeCalls).toEqual([["battleon-48392"]]);
  expect(packetState.disposed).toBe(true);
});
