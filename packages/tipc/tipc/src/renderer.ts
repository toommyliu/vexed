import "@tybys/electron-ipc-handle-invoke/renderer";
import { IpcRenderer, IpcRendererEvent } from "electron";
import type {
  RouterType,
  RendererHandlers,
  RendererHandlersListener,
} from "./types";

export const createClient = <Router extends RouterType>({
  ipcInvoke,
}: {
  ipcInvoke: IpcRenderer["invoke"];
}) => {
  const makeProxy = (prefix = ""): any => {
    // function target so the proxy is callable at every level
    const fn = (input: any) => ipcInvoke(prefix, input);

    return new Proxy(fn, {
      get: (_t, prop) => {
        const name = prop.toString();
        const channel = prefix ? `${prefix}.${name}` : name;
        return makeProxy(channel);
      },
    });
  };

  return new Proxy(() => {}, {
    get: (_, prop) => makeProxy(prop.toString()),
  });
};

export const createEventHandlers = <T extends RendererHandlers>({
  on,

  send,
}: {
  on: (
    channel: string,
    handler: (event: IpcRendererEvent, ...args: any[]) => void,
  ) => () => void;

  send: IpcRenderer["send"];
}) => {
  const makeProxy = (prefix = "") =>
    new Proxy<any>({} as any, {
      get: (_target: any, prop: any) => {
        const name = prop.toString();
        const channel = prefix ? `${prefix}.${name}` : name;

        // Return a nested proxy for namespaces
        const nested = makeProxy(channel);

        // Return the listener/handler object for leaf functions
        const leaf = {
          listen: (handler: any) =>
            on(channel, (event, ...args) => handler(...args)),

          handle: (handler: any) =>
            on(channel, async (event, id: string, ...args) => {
              try {
                const result = await handler(...args);
                send(id, { result });
              } catch (error) {
                send(id, { error });
              }
            }),
        };

        // Use a proxy that merges nested namespaces with leaf methods
        return new Proxy(leaf, {
          get(_, key) {
            // Accessing listen/handle
            if (key in leaf) return (leaf as any)[key];
            // Otherwise return nested namespace
            return (nested as any)[key];
          },
        });
      },
    });

  return makeProxy() as RendererHandlersListener<T>;
};
