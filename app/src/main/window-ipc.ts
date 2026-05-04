import { BrowserWindow, ipcMain } from "electron";
import { Effect } from "effect";
import { WindowIpcChannels } from "../shared/ipc";
import { isWindowId } from "../shared/windows";
import { WindowService, type WindowEffectRunner } from "./windows";

let windowIpcRegistered = false;

export const registerWindowIpcHandlers = (
  runWindowEffect: WindowEffectRunner,
): void => {
  if (windowIpcRegistered) {
    return;
  }

  ipcMain.handle(WindowIpcChannels.open, async (event, id: unknown) => {
    if (!isWindowId(id)) {
      throw new Error(`Unknown app window: ${String(id)}`);
    }

    const senderWindowId = BrowserWindow.fromWebContents(event.sender)?.id;
    await runWindowEffect(
      Effect.gen(function* () {
        const windows = yield* WindowService;
        yield* windows.openWindow(id, senderWindowId);
      }),
    );
  });

  windowIpcRegistered = true;
};
