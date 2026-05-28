import { BrowserWindow } from "electron";
import { Effect, Scope } from "effect";
import { WindowIpcChannels } from "../../../shared/ipc";
import { isWindowId } from "../../../shared/windows";
import { WindowService } from "../../window/WindowService";
import { MainIpc } from "../MainIpc";

export const registerWindowIpcHandlers = (): Effect.Effect<
  void,
  never,
  MainIpc | Scope.Scope | WindowService
> =>
  Effect.gen(function* () {
    const ipc = yield* MainIpc;

    yield* ipc.handle(WindowIpcChannels.open, (event, id) =>
      Effect.gen(function* () {
        if (!isWindowId(id)) {
          return yield* Effect.fail(
            new Error(`Unknown app window: ${String(id)}`),
          );
        }

        const senderWindowId = BrowserWindow.fromWebContents(event.sender)?.id;
        const windows = yield* WindowService;
        yield* windows.openWindow(id, senderWindowId);
      }),
    );

    yield* ipc.handle(WindowIpcChannels.requestCloseGameWindow, (event) =>
      Effect.gen(function* () {
        const senderWindow = BrowserWindow.fromWebContents(event.sender);
        if (!senderWindow) {
          return;
        }

        const windows = yield* WindowService;
        const gameWindowId = yield* windows.getGameWindowId(senderWindow.id);
        if (gameWindowId === undefined) {
          return;
        }

        yield* windows.requestCloseGameWindow(gameWindowId);
      }),
    );
  });
