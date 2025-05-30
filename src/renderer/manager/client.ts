import { createClient } from "@egoist/tipc/renderer";
import { ipcRenderer } from "electron";
import type { Router } from "../../main/tipc/manager";

export const client = createClient<Router>({
  ipcInvoke: async (...args) => ipcRenderer.invoke(...args),
});
