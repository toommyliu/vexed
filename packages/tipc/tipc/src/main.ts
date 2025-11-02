import { v4 as uuid } from "@lukeed/uuid";
import { BrowserWindow, WebContents, ipcMain, IpcMainEvent } from "electron";
import {
  ActionFunction,
  RendererHandlers,
  RendererHandlersCaller,
  Route,
  RouterType,
} from "./types";
import { tipc } from "./tipc";

export { tipc };

export const registerIpcMain = (router: RouterType) => {
  const walk = (obj: RouterType, prefix = "") => {
    for (const [key, val] of Object.entries(obj)) {
      const channel = prefix ? `${prefix}.${key}` : key;
      if ("action" in val) {
        const route = val as Route;
        ipcMain.handle(channel, (e, payload) => {
          const senderWindow = BrowserWindow.fromWebContents(e.sender) ?? null;
          const senderParentWindow = senderWindow?.getParentWindow() ?? null;

          const context = {
            sender: e.sender,
            senderWindow,
            senderParentWindow,
            getRendererHandlers: <T extends RendererHandlers>(
              target?: WebContents | BrowserWindow | null,
            ): RendererHandlersCaller<T> => {
              const resolvedTarget = target ?? e.sender;
              const contents =
                resolvedTarget instanceof BrowserWindow
                  ? resolvedTarget.webContents
                  : resolvedTarget;

              return getRendererHandlers<T>(contents);
            },
          };

          return route.action({
            context,
            input: payload,
          });
        });
      } else {
        walk(val as RouterType, channel);
      }
    }
  };

  walk(router);
};

type ProxyLeaf = {
  send: (...args: unknown[]) => void;
  invoke: (...args: unknown[]) => Promise<unknown>;
};

type ProxyHandler = ProxyLeaf & Record<string, unknown>;

export const getRendererHandlers = <T extends RendererHandlers>(
  target: WebContents | BrowserWindow | null,
) => {
  const contents =
    target instanceof BrowserWindow ? target.webContents : target;

  const makeProxy = (prefix = ""): ProxyHandler => {
    return new Proxy({} as ProxyHandler, {
      get: (_target, prop) => {
        const name = prop.toString();
        const channel = prefix ? `${prefix}.${name}` : name;

        const nested = makeProxy(channel);

        const leaf: ProxyLeaf = {
          send: (...args: unknown[]) => {
            if (contents && !contents.isDestroyed())
              contents.send(channel, ...args);
          },
          invoke: async (...args: unknown[]) => {
            if (!contents || contents.isDestroyed()) {
              return Promise.reject(
                new Error("WebContents is null or destroyed"),
              );
            }

            const id = uuid();
            return new Promise((resolve, reject) => {
              ipcMain.once(
                id,
                (
                  _event: IpcMainEvent,
                  payload: { error?: unknown; result?: unknown },
                ) => {
                  const { error, result } = payload || {};
                  if (error) {
                    reject(error);
                  } else {
                    resolve(result);
                  }
                },
              );

              contents.send(channel, id, ...args);
            });
          },
        };

        return new Proxy(leaf, {
          get(_, key) {
            if (key in leaf) {
              return leaf[key as keyof ProxyLeaf];
            }
            return nested[key as keyof ProxyHandler];
          },
        });
      },
    });
  };

  return makeProxy() as RendererHandlersCaller<T>;
};

export * from "./types";
