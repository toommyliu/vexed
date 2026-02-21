import { join } from "path";
import { readFile } from "@vexed/fs";
import { Result } from "better-result";
import { dialog, type BrowserWindow, type OpenDialogOptions } from "electron";
import { DOCUMENTS_PATH } from "../constants";
import { createLogger } from "./logger";

const logger = createLogger("service:scripts");

const DIALOG_OPTIONS: OpenDialogOptions = {
  defaultPath: join(DOCUMENTS_PATH, "Bots"),
  properties: ["openFile"],
  filters: [{ name: "Bots", extensions: ["js"] }],
  message: "Select a script to load",
  title: "Select a script to load",
};
const SCRIPT_ERROR_LISTENER_TIMEOUT_MS = 15_000;
const activeScriptErrorListeners = new Map<number, () => void>();

export type ScriptLoadResult = {
  fromManager: boolean;
  path: string;
};

export type ScriptError = "FILE_READ_FAILED" | "SCRIPT_EXEC_FAILED";

async function selectScriptPath(
  window?: BrowserWindow,
): Promise<string | null> {
  try {
    const res = window
      ? await dialog.showOpenDialog(window, DIALOG_OPTIONS)
      : await dialog.showOpenDialog(DIALOG_OPTIONS);
    if (res?.canceled || !res?.filePaths?.[0]) return null;
    return res.filePaths[0];
  } catch (error) {
    logger.error("Failed to show open dialog", error);
    return null;
  }
}

async function loadAndRun(
  window: BrowserWindow,
  scriptPath?: string,
): Promise<Result<ScriptLoadResult | null, ScriptError>> {
  let fromManager = false;
  let path: string | null = null;

  // If the script path is provided, we are loading from Manager
  if (scriptPath) {
    path = scriptPath;
    fromManager = true;
  } else {
    path = await selectScriptPath(window);
  }

  if (!path) return Result.ok(null);

  try {
    const contentResult = await readFile(path);
    if (contentResult.isErr()) {
      logger.error("Failed to read script file", {
        path,
        error: contentResult.error,
      });
      return Result.err("FILE_READ_FAILED" as ScriptError);
    }

    const content = contentResult.value;
    if (content.length === 0) {
      logger.error("Failed to read script file (empty)", { path });
      return Result.err("FILE_READ_FAILED" as ScriptError);
    }

    setupErrorListener(window);

    // Reset to clean state
    await window.webContents.executeJavaScript(
      "window.context.setCommands([]);window.context.commandIndex=0;",
    );

    // Load the script
    await window.webContents.executeJavaScript(content);
    return Result.ok({ fromManager, path });
  } catch (error) {
    logger.error("Failed to load or run script", error);
    return Result.err("SCRIPT_EXEC_FAILED" as ScriptError);
  }
}

function setupErrorListener(window: BrowserWindow) {
  const webContentsId = window.webContents.id;

  activeScriptErrorListeners.get(webContentsId)?.();

  let timeout: NodeJS.Timeout | null = null;
  let disposed = false;

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    window.webContents.removeListener("console-message", onConsoleMessage);

    if (activeScriptErrorListeners.get(webContentsId) === dispose) {
      activeScriptErrorListeners.delete(webContentsId);
    }
  };

  const onConsoleMessage = async (
    _event: unknown,
    level: number,
    message: string,
    line: number,
  ) => {
    if (level !== 3 || !message.startsWith("Uncaught")) return;

    dispose();

    const args = message.slice("Uncaught".length).split(":");
    const err = args[0] ?? "Error";
    const parsedMessage = args
      .join(" ")
      .slice(err.length + 1)
      .trim();

    if (parsedMessage.startsWith("Invalid args")) {
      const split = parsedMessage.split(";");
      const cmd = split[1] ?? "unknown";
      const commandMessage = split[2] ?? "invalid arguments";

      try {
        await window.webContents.executeJavaScript(
          "window.context.setCommands([])",
        );
        await dialog.showMessageBox(window, {
          message: `"cmd.${cmd}()" threw an error: ${commandMessage}`,
          type: "error",
        });
      } catch {}

      return;
    }

    await dialog.showMessageBox(window, {
      message: err,
      detail: `${parsedMessage} (line ${line})`,
      type: "error",
    });
  };

  window.webContents.on("console-message", onConsoleMessage);
  window.webContents.once("destroyed", dispose);
  timeout = setTimeout(dispose, SCRIPT_ERROR_LISTENER_TIMEOUT_MS);
  activeScriptErrorListeners.set(webContentsId, dispose);
}

export const scriptService = {
  loadAndRun,
  selectScriptPath,
};
