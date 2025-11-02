import { writeFile } from "@vexed/fs-utils";
import type { TipcInstance } from "@vexed/tipc";
import type { WebContents } from "electron";
import { BrowserWindow, dialog } from "electron";
import { LEVEL_LABELS } from "../../shared/constants";
import type { AppLogEntry } from "../../shared/types";
import type { RendererHandlers } from "../tipc";
import { windowStore } from "../windows";

function getStoreRefFromSender(webContents: WebContents) {
  const logsWindow = BrowserWindow.fromWebContents(webContents);
  if (!logsWindow) return null;

  const parentWindow = logsWindow.getParentWindow();
  if (!parentWindow) return null;

  const storeRef = windowStore.get(parentWindow.id);
  if (!storeRef) return null;

  return { logsWindow, parentWindow, storeRef };
}

function formatLogEntry(entry: AppLogEntry): string {
  const timestamp = new Date(entry.timestamp).toISOString();
  const level = LEVEL_LABELS[entry.level] ?? `level-${entry.level}`;
  const sanitizedSource = entry.sourceId?.startsWith("file://")
    ? entry.sourceId.slice("file://".length)
    : (entry.sourceId ?? "renderer");
  const parts = sanitizedSource.split(/[/\\]/);
  const sourceName = parts[parts.length - 1] ?? sanitizedSource;
  const hasLine = Number.isFinite(entry.lineNumber) && entry.lineNumber > 0;
  const source = hasLine ? `${sourceName}:${entry.lineNumber}` : sourceName;
  return `[${timestamp}] [${level.toUpperCase()}] ${source} ${entry.message}`;
}

function serialize(entries: AppLogEntry[]): string {
  return entries.map((entry) => formatLogEntry(entry)).join("\n");
}

export function createAppLogsTipcRouter(tipcInstance: TipcInstance) {
  return {
    clear: tipcInstance.procedure.action(async ({ context }) => {
      const ref = getStoreRefFromSender(context.sender);
      if (!ref) return { success: false, error: "STORE_NOT_FOUND" } as const;

      if (!ref.storeRef.app.logHistory.length)
        return { success: false, error: "EMPTY" } as const;

      ref.storeRef.app.logHistory.length = 0;

      const rendererHandlers = context.getRendererHandlers<RendererHandlers>(
        ref.logsWindow,
      );
      rendererHandlers.appLogs.reset.send();

      return { success: true } as const;
    }),
    saveToFile: tipcInstance.procedure.action(async ({ context }) => {
      const ref = getStoreRefFromSender(context.sender);
      if (!ref) return { success: false, error: "STORE_NOT_FOUND" } as const;

      if (!ref.storeRef.app.logHistory.length)
        return { success: false, error: "EMPTY" } as const;

      const isoTimestamp = new Date().toISOString();
      const timestamp = isoTimestamp.replaceAll(":", "-").replaceAll(".", "-");
      const defaultPath = `app-logs-${timestamp}.txt`;

      const { canceled, filePath } = await dialog.showSaveDialog(
        ref.logsWindow,
        {
          defaultPath,
          filters: [{ name: "Text Files", extensions: ["txt"] }],
        },
      );

      if (canceled || !filePath)
        return { success: false, canceled: true } as const;

      try {
        const content = serialize(ref.storeRef.app.logHistory);
        await writeFile(filePath, content);
        return { success: true, filePath } as const;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "UNKNOWN",
        } as const;
      }
    }),
  } as const;
}
