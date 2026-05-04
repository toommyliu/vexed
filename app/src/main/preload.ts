import { contextBridge, ipcRenderer } from "electron";
import {
  ScriptingIpcChannels,
  WindowIpcChannels,
  type AppBridge,
  type ScriptExecutePayload,
} from "../shared/ipc";
import type { WindowId } from "../shared/windows";

const bridge: AppBridge = {
  scripting: {
    openFile: async () => {
      return (await ipcRenderer.invoke(
        ScriptingIpcChannels.openFile,
      )) as ScriptExecutePayload | null;
    },
    readFile: async (path: string) => {
      return (await ipcRenderer.invoke(
        ScriptingIpcChannels.readFile,
        path,
      )) as ScriptExecutePayload;
    },
    onExecute: (listener) => {
      const subscription = (_event: unknown, payload: ScriptExecutePayload) => {
        listener(payload);
      };

      ipcRenderer.on(ScriptingIpcChannels.execute, subscription);

      return () => {
        ipcRenderer.removeListener(ScriptingIpcChannels.execute, subscription);
      };
    },
    onStop: (listener) => {
      const subscription = (_event: unknown) => {
        listener();
      };

      ipcRenderer.on(ScriptingIpcChannels.stop, subscription);

      return () => {
        ipcRenderer.removeListener(ScriptingIpcChannels.stop, subscription);
      };
    },
  },
  windows: {
    open: async (id: WindowId) => {
      await ipcRenderer.invoke(WindowIpcChannels.open, id);
    },
  },
};

contextBridge.exposeInMainWorld("ipc", bridge);
