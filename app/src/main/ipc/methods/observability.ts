import { Effect, Scope } from "effect";
import { ObservabilityIpcChannels } from "../../../shared/ipc";
import { normalizeObservabilityInput } from "../../../shared/observability";
import { Observability } from "../../app/MainObservability";
import { MainIpc } from "../MainIpc";

export const registerObservabilityIpcHandlers = (): Effect.Effect<
  void,
  never,
  MainIpc | Observability | Scope.Scope
> =>
  Effect.gen(function* () {
    const ipc = yield* MainIpc;

    yield* ipc.handle(ObservabilityIpcChannels.write, (_event, input) =>
      Effect.gen(function* () {
        const observability = yield* Observability;
        yield* observability.write(normalizeObservabilityInput(input));
      }),
    );

    yield* ipc.handle(ObservabilityIpcChannels.snapshot, () =>
      Effect.gen(function* () {
        const observability = yield* Observability;
        return yield* observability.snapshot;
      }),
    );
  });
