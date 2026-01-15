import { createClient, createEventHandlers } from "@vexed/tipc/renderer";
import { ipcRenderer } from "electron";
import type { RendererHandlers, TipcRouter } from "../main/tipc";

export const client = createClient<TipcRouter>({
  ipcInvoke: async (...args) => {
    try {
      return await ipcRenderer.invoke(...args);
    } catch (error) {
      console.error("IPC invoke error:", error);
      throw error;
    }
  },
  ipcSend: (channel: string, ...args: unknown[]) => {
    try {
      ipcRenderer.send(channel, ...args);
    } catch (error) {
      console.error("IPC send error:", error);
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
