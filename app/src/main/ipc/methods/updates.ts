import { Effect, Scope } from "effect";
import { UpdatesIpcChannels } from "../../../shared/ipc";
import { MainIpc } from "../MainIpc";
import { UpdateChecker } from "../../updates/Updates";

export const registerUpdatesIpcHandlers = (): Effect.Effect<
  void,
  never,
  MainIpc | Scope.Scope | UpdateChecker
> =>
  Effect.gen(function* () {
    const ipc = yield* MainIpc;

    yield* ipc.handle(UpdatesIpcChannels.getState, () =>
      Effect.gen(function* () {
        const updates = yield* UpdateChecker;
        return yield* updates.getState;
      }),
    );

    yield* ipc.handle(UpdatesIpcChannels.check, () =>
      Effect.gen(function* () {
        const updates = yield* UpdateChecker;
        return yield* updates.checkNow({ force: true });
      }),
    );
  });
