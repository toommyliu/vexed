import { join } from "path";
import { readFile } from "@vexed/fs-utils";
import { Result } from "better-result";
import { dialog, type BrowserWindow, type OpenDialogOptions } from "electron";
import { DOCUMENTS_PATH } from "~/shared/constants";
import { createLogger } from "./logger";

const logger = createLogger("service:scripts");

const DIALOG_OPTIONS: OpenDialogOptions = {
  defaultPath: join(DOCUMENTS_PATH, "Bots"),
  properties: ["openFile"],
  filters: [{ name: "Bots", extensions: ["js"] }],
  message: "Select a script to load",
  title: "Select a script to load",
};

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
    const content = await readFile(path);
    if (!content) {
      logger.error("Failed to read script file", { path });
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
  // The error is thrown in the renderer
  // So we need to listen for it here and handle it
  window.webContents.once(
    "console-message",
    async (_, level, message, line) => {
      if (!message.startsWith("Uncaught") || level !== 3) {
        return;
      }

      const args = message.slice("Uncaught".length).split(":");

      const err = args[0]!; // Error
      const _msg = args
        .join(" ")
        .slice(err!.length + 1)
        .trim();

      // ArgsError
      if (level === 3 && _msg.startsWith("Invalid args")) {
        const split = _msg.split(";"); // Invalid args;delay;ms is required
        const cmd = split[1]!; // delay
        const cmd_msg = split[2]!; // ms is required

        try {
          // Reset the commands
          await window.webContents.executeJavaScript(
            "window.context.setCommands([])",
          );

          // Ideally, this traces to the line of the (user) script back to
          // where the error occurred, not where the error is thrown internally
          await dialog.showMessageBox(window, {
            message: `"cmd.${cmd}()" threw an error: ${cmd_msg}`,
            type: "error",
          });
        } catch {}
      } else {
        // Some generic error (SyntaxError, ReferenceError, etc.)
        await dialog.showMessageBox(window, {
          message: err,
          detail: `${_msg} (line ${line})`,
          type: "error",
        });
      }
    },
  );
}

export const scriptService = {
  loadAndRun,
  selectScriptPath,
};
