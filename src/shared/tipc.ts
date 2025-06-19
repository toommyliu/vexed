import { createClient, createEventHandlers } from "@egoist/tipc/renderer";
import { ipcRenderer } from "electron";
import type { RendererHandlers, TipcRouter } from "../main/tipc";

export const client = createClient<TipcRouter>({
  ipcInvoke: async (...args) => {
    try {
      await ipcRenderer.invoke(...args);
    } catch (error) {
      console.error("IPC invoke error:", error);

      if (error instanceof Error) {
        console.error("IPC invoke error message:", error.message);
        console.error("IPC invoke error stack:", error.stack);
      }

      throw error;
    }
  },
});

export const handlers = createEventHandlers<RendererHandlers>({
  on: (channel, handler) => {
    ipcRenderer.on(channel, handler);
    return () => {
      ipcRenderer.removeListener(channel, handler);
    };
  },
  send(channel, ...args) {
    ipcRenderer.send(channel, ...args);
  },
});
