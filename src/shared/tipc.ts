import { createClient, createEventHandlers } from "@egoist/tipc/renderer";
import { ipcRenderer } from "electron";
import type { RendererHandlers, TipcRouter } from "../main/tipc";

export const client = createClient<TipcRouter>({
  ipcInvoke: async (...args) => ipcRenderer.invoke(...args),
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
