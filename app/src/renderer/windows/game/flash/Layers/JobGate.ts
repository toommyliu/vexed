import { Effect, Layer } from "effect";
import { JobGate, type JobGateShape } from "../../jobs/Services/JobGate";
import { Player } from "../Services/Player";

const make = Effect.gen(function* () {
  const player = yield* Player;

  const isOpen: JobGateShape["isOpen"] = (runWhen) => {
    if (runWhen === "always") {
      return Effect.succeed(true);
    }

    return player.isReady().pipe(
      Effect.catchCause(() => Effect.succeed(false)),
      Effect.map((ready) => (runWhen === "loggedIn" ? ready : !ready)),
    );
  };

  return { isOpen } satisfies JobGateShape;
});

export const FlashJobGateLive = Layer.effect(JobGate, make);
