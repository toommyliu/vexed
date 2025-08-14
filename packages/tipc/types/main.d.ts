import "@tybys/electron-ipc-handle-invoke/main";
import { WebContents } from "electron";
import { RendererHandlers, RendererHandlersCaller, RouterType } from "./types";
import { tipc } from "./tipc";
export { tipc };
export declare const registerIpcMain: (router: RouterType) => void;
export declare const getRendererHandlers: <T extends RendererHandlers>(contents: WebContents) => RendererHandlersCaller<T>;
export * from "./types";
