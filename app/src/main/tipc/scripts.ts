import { join } from "path";
import { readFile } from "@vexed/fs-utils";
import type { TipcInstance } from "@vexed/tipc";
import { dialog } from "electron";
import { DOCUMENTS_PATH } from "../../shared/constants";
import type { RendererHandlers } from "../tipc";

export function createScriptsTipcRouter(tipcInstance: TipcInstance) {
  return {
    loadScript: tipcInstance.procedure
      .input<{ scriptPath: string }>()
      .action(async ({ input, context }) => {
        try {
          const scriptPath = input?.scriptPath;
          const browserWindow = context.senderWindow;
          if (!browserWindow) return;

          const handlers = context.getRendererHandlers<RendererHandlers>();

          let file: string;
          let fromManager = false;

          if (scriptPath) {
            file = scriptPath;
            fromManager = true;
          } else {
            const res = await dialog
              .showOpenDialog(browserWindow, {
                defaultPath: join(DOCUMENTS_PATH, "Bots"),
                properties: ["openFile"],
                filters: [{ name: "Bots", extensions: ["js"] }],
                message: "Select a script to load",
                title: "Select a script to load",
              })
              .catch(() => ({ canceled: true, filePaths: [] }));
            if (res?.canceled || !res?.filePaths?.[0]) return;
            file = res.filePaths[0];
          }

          const content = await readFile(file);
          if (!content) return;

          // The error is thrown in the renderer
          // So we need to listen for it here and handle it
          browserWindow.webContents.once(
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
                  await browserWindow.webContents.executeJavaScript(
                    "window.context.setCommands([])",
                  );

                  // Ideally, this traces to the line of the (user) script back to
                  // where the error occurred, not where the error is thrown internally
                  await dialog.showMessageBox(browserWindow, {
                    message: `"cmd.${cmd}()" threw an error: ${cmd_msg}`,
                    type: "error",
                  });
                } catch {}
              } else {
                // Some generic error (SyntaxError, ReferenceError, etc.)
                await dialog.showMessageBox(browserWindow, {
                  message: err,
                  detail: `${_msg} (line ${line})`,
                  type: "error",
                });
              }
            },
          );

          // Reset to clean state
          await context.sender.executeJavaScript(
            "window.context.setCommands([]);window.context.commandIndex=0;",
          );

          // Load the script
          await context.sender.executeJavaScript(content!);
          handlers.scripts.scriptLoaded.send(fromManager);
        } catch {}
      }),
    toggleDevTools: tipcInstance.procedure.action(async ({ context }) => {
      context.senderWindow?.webContents?.toggleDevTools();
    }),
    gameReload: tipcInstance.procedure.action(async ({ context }) => {
      const browserWindow = context.senderWindow;
      if (!browserWindow) return;

      for (const child of browserWindow.getChildWindows()) {
        if (child && !child.isDestroyed()) {
          const rendererHandlers =
            context.getRendererHandlers<RendererHandlers>(child);
          rendererHandlers.game.gameReloaded.send();
        }
      }
    }),
  };
}
