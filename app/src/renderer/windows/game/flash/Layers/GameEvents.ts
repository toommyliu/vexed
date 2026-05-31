import { Effect, Layer } from "effect";
import {
  GameEvents,
  type GameEvent,
  type GameEventHandler,
  type GameEventMap,
  type GameEventsShape,
} from "../Services/GameEvents";
import type { PacketListenerDisposer } from "../Services/Packet";

type HandlerStore = {
  [K in GameEvent]?: Set<GameEventHandler<K>>;
};

const registerHandler = <E extends GameEvent>(
  store: HandlerStore,
  event: E,
  handler: GameEventHandler<E>,
): Effect.Effect<PacketListenerDisposer> =>
  Effect.sync(() => {
    const handlers =
      (store[event] as Set<GameEventHandler<E>> | undefined) ??
      new Set<GameEventHandler<E>>();
    handlers.add(handler);
    store[event] = handlers as HandlerStore[E];

    let disposed = false;
    return () => {
      if (disposed) {
        return;
      }

      disposed = true;
      handlers.delete(handler);
      if (handlers.size === 0) {
        delete store[event];
      }
    };
  });

const emit = <E extends GameEvent>(
  store: HandlerStore,
  event: E,
  payload: GameEventMap[E],
): Effect.Effect<void> => {
  const handlers = store[event] as Set<GameEventHandler<E>> | undefined;
  if (!handlers || handlers.size === 0) {
    return Effect.void;
  }

  const snapshot = Array.from(handlers);
  return Effect.forEach(
    snapshot,
    (handler, handlerIndex) =>
      handler(payload).pipe(
        Effect.catchCause((cause) =>
          Effect.logError({
            message: "game event handler failed",
            event,
            handlerIndex,
            cause,
          }),
        ),
      ),
    { discard: true },
  );
};

const make = Effect.sync(() => {
  const handlers: HandlerStore = {};

  return {
    started: true,
    on: (event, handler) => registerHandler(handlers, event, handler),
    emit: (event, payload) => emit(handlers, event, payload),
  } satisfies GameEventsShape;
});

export const GameEventsLive = Layer.effect(GameEvents, make);
