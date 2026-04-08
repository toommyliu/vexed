import { Effect, Layer } from "effect";
import { Bridge } from "../Services/Bridge";
import { Player } from "../Services/Player";
import type { PlayerShape } from "../Services/Player";

const make = Effect.gen(function* () {
  const bridge = yield* Bridge;

  return {
    isLoggedIn: () => {
      return bridge.call('auth.isLoggedIn');
    },
    useSkill: (skillId: string) => {
      return Effect.gen(function* () {
        const connected = yield* bridge.call('auth.isLoggedIn');
        if (!connected) {
          return;
        }
        return yield* bridge.call('combat.useSkill', [skillId]);
      });
    },
  } satisfies PlayerShape;
});

export const PlayerLive = Layer.effect(Player, make);
