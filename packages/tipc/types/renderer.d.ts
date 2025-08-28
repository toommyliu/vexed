import "@tybys/electron-ipc-handle-invoke/renderer";
import { IpcRenderer, IpcRendererEvent } from "electron";
import type { ClientFromRouter, RouterType, RendererHandlers, RendererHandlersListener } from "./types";
export declare const createClient: <Router extends RouterType>({ ipcInvoke, }: {
    ipcInvoke: IpcRenderer["invoke"];
}) => ClientFromRouter<Router>;
export declare const createEventHandlers: <T extends RendererHandlers>({ on, send, }: {
    on: (channel: string, handler: (event: IpcRendererEvent, ...args: any[]) => void) => () => void;
    send: IpcRenderer["send"];
}) => RendererHandlersListener<T>;
