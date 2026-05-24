import { Data, Effect } from "effect";
import type {
  GrabbedData,
  LoaderGrabberGrabRequest,
  LoaderGrabberLoadRequest,
} from "../../../shared/loader-grabber";
import type {
  LoaderGrabberRequestMessage,
  LoaderGrabberResponseMessage,
} from "../../../shared/ipc";
import type { runtime as gameRuntime } from "./Runtime";
import { Bank } from "./flash/Services/Bank";
import { Inventory } from "./flash/Services/Inventory";
import { Player } from "./flash/Services/Player";
import { Quests } from "./flash/Services/Quests";
import { Shops } from "./flash/Services/Shops";
import { TempInventory } from "./flash/Services/TempInventory";
import { World } from "./flash/Services/World";

type GameRuntime = typeof gameRuntime;

class LoaderGrabberPlayerNotReadyError extends Data.TaggedError(
  "LoaderGrabberPlayerNotReadyError",
)<{
  readonly message: string;
}> {}

export interface LoaderGrabberBridgeController {
  readonly dispose: () => void;
}

const toRequestError = (cause: unknown): string => {
  const message =
    typeof cause === "object" && cause !== null && "message" in cause
      ? cause.message
      : undefined;
  return typeof message === "string" && message !== ""
    ? message
    : "Loader grabber request failed";
};

const respondLoaderGrabberRequest = (
  response: LoaderGrabberResponseMessage,
): Promise<void> => window.ipc.loaderGrabber.respond(response);

const ensurePlayerReady = Effect.gen(function* () {
  const player = yield* Player;
  const ready = yield* player.isReady();
  if (!ready) {
    return yield* new LoaderGrabberPlayerNotReadyError({
      message: "Player is not ready",
    });
  }
});

const loadEffect = (request: LoaderGrabberLoadRequest) =>
  Effect.gen(function* () {
    yield* ensurePlayerReady;

    if (request.type === "quest") {
      const quests = yield* Quests;
      yield* quests.load(request.id);
      return;
    }

    const shops = yield* Shops;
    if (request.type === "hair-shop") {
      yield* shops.loadHairShop(request.id);
      return;
    }

    if (request.type === "shop") {
      yield* shops.load(request.id);
      return;
    }

    yield* shops.loadArmorCustomize();
  });

const grabEffect = (
  request: LoaderGrabberGrabRequest,
): Effect.Effect<
  GrabbedData | null,
  unknown,
  Bank | Inventory | Player | Quests | Shops | TempInventory | World
> =>
  Effect.gen(function* () {
    yield* ensurePlayerReady;

    if (request.type === "shop") {
      const shops = yield* Shops;
      return yield* shops.getInfo();
    }

    if (request.type === "quest") {
      const quests = yield* Quests;
      const tree = yield* quests.getTree();
      return Array.from(tree.values(), (quest) => quest.data);
    }

    if (request.type === "inventory") {
      const inventory = yield* Inventory;
      const items = yield* inventory.getItems();
      return items.map((item) => item.data);
    }

    if (request.type === "temp-inventory") {
      const tempInventory = yield* TempInventory;
      const items = yield* tempInventory.getItems();
      return items.map((item) => item.data);
    }

    if (request.type === "bank") {
      const bank = yield* Bank;
      const items = yield* bank.getItems();
      return items.map((item) => item.data);
    }

    const world = yield* World;
    if (request.type === "cell-monsters") {
      const monsters = yield* world.map.getCellMonsters();
      return monsters.map((monster) => monster.data);
    }

    const monsters = yield* world.monsters.getAll();
    return Array.from(monsters.values(), (monster) => monster.data);
  });

export const installLoaderGrabberBridge = (
  runtime: GameRuntime,
): LoaderGrabberBridgeController => {
  let disposed = false;
  let requestChain = Promise.resolve();

  const handleRequest = async (
    request: LoaderGrabberRequestMessage,
  ): Promise<void> => {
    try {
      if (request.kind === "load") {
        await runtime.runPromise(
          loadEffect(request.payload).pipe(Effect.asVoid),
        );
        await respondLoaderGrabberRequest({
          ok: true,
          requestId: request.requestId,
        });
        return;
      }

      const value = await runtime.runPromise(grabEffect(request.payload));
      await respondLoaderGrabberRequest({
        ok: true,
        requestId: request.requestId,
        value,
      });
    } catch (cause) {
      await respondLoaderGrabberRequest({
        error: toRequestError(cause),
        ok: false,
        requestId: request.requestId,
      });
    }
  };

  const unsubscribeRequest = window.ipc.loaderGrabber.onRequest((request) => {
    requestChain = requestChain
      .catch((error: unknown) => {
        console.error("Loader grabber request chain failed:", error);
      })
      .then(async () => {
        if (disposed) {
          await respondLoaderGrabberRequest({
            error: "Loader grabber bridge is disposed",
            ok: false,
            requestId: request.requestId,
          });
          return;
        }

        await handleRequest(request);
      });
    void requestChain.catch((error: unknown) => {
      console.error("Loader grabber request handling failed:", error);
    });
  });

  const dispose = (): void => {
    disposed = true;
    unsubscribeRequest();
  };

  return { dispose };
};
