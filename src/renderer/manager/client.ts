import { createClient } from "@egoist/tipc/renderer";
import { ipcRenderer } from "electron";
import type { Router } from "../../main/tipc/manager";

export const client = createClient<Router>({
  // pass ipcRenderer.invoke function to the client
  // you can expose it from preload.js in BrowserWindow
  ipcInvoke: async (...args) => ipcRenderer.invoke(...args),
});
