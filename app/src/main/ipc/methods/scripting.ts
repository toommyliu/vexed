import { BrowserWindow, dialog, type OpenDialogOptions } from "electron";
import { Effect, Scope } from "effect";
import {
  ScriptingIpcChannels,
  type ScriptExecutePayload,
} from "../../../shared/ipc";
import { MainIpc } from "../MainIpc";
import { WorkspaceFiles } from "../../workspace/WorkspaceFiles";

const getEventWindow = (senderId?: number): BrowserWindow | null => {
  if (senderId !== undefined) {
    for (const win of BrowserWindow.getAllWindows()) {
      if (win.webContents.id === senderId) {
        return win;
      }
    }
  }

  const focused = BrowserWindow.getFocusedWindow();
  if (focused) {
    return focused;
  }

  const [first] = BrowserWindow.getAllWindows();
  return first ?? null;
};

const openScriptDialog = async (
  win: BrowserWindow | null,
  scriptsDir: string,
): Promise<string | null> => {
  const options: OpenDialogOptions = {
    title: "Open script",
    defaultPath: scriptsDir,
    filters: [
      { name: "JavaScript", extensions: ["js", "cjs"] },
      { name: "All Files", extensions: ["*"] },
    ],
    properties: ["openFile"],
  };

  const result =
    win === null
      ? await dialog.showOpenDialog(options)
      : await dialog.showOpenDialog(win, options);

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0] ?? null;
};

export const registerScriptingIpcHandlers = (): Effect.Effect<
  void,
  never,
  MainIpc | Scope.Scope | WorkspaceFiles
> =>
  Effect.gen(function* () {
    const ipc = yield* MainIpc;

    yield* ipc.handle(ScriptingIpcChannels.openFile, (event) =>
      Effect.gen(function* () {
        const workspace = yield* WorkspaceFiles;
        const path = yield* Effect.promise(() =>
          openScriptDialog(
            getEventWindow(event.sender.id),
            workspace.scriptsDir,
          ),
        );
        if (path === null) {
          return null;
        }

        return yield* workspace.readScript(path);
      }),
    );

    yield* ipc.handle(ScriptingIpcChannels.readFile, (_event, path) =>
      Effect.gen(function* () {
        if (typeof path !== "string" || path.trim() === "") {
          return yield* Effect.fail(new Error("Invalid script path"));
        }

        const workspace = yield* WorkspaceFiles;
        return (yield* workspace.readScript(
          path.trim(),
        )) satisfies ScriptExecutePayload;
      }),
    );
  });
