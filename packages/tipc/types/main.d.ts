import "@tybys/electron-ipc-handle-invoke/main";
import { BrowserWindow, WebContents } from "electron";
import { RendererHandlers, RendererHandlersCaller, RouterType } from "./types";
import { tipc } from "./tipc";
export { tipc };
export type TipcInstance = ReturnType<typeof tipc.create>;
export declare const registerIpcMain: (router: RouterType) => void;
export declare const getRendererHandlers: <T extends RendererHandlers>(
  target: WebContents | BrowserWindow | null,
) => RendererHandlersCaller<T>;
export * from "./types";
