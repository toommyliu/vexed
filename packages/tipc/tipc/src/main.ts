import { v4 as uuid } from "@lukeed/uuid";
import { WebContents, ipcMain } from "electron";
import { RendererHandlers, RouterType } from "./types";
import { tipc } from "./tipc";

export { tipc };

export const registerIpcMain = (router: RouterType) => {
  const walk = (obj: RouterType, prefix = "") => {
    for (const [key, val] of Object.entries(obj)) {
      const channel = prefix ? `${prefix}.${key}` : key;
      if ("action" in (val as any)) {
        const route = val as { action: any };
        ipcMain.handle(channel, (e, payload) => {
          return route.action({
            context: { sender: e.sender },
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

export const getRendererHandlers = <T extends RendererHandlers>(
  contents: WebContents,
) => {
  const makeProxy = (prefix = ""): any => {
    return new Proxy({} as any, {
      get: (_target, prop) => {
        const name = prop.toString();
        const channel = prefix ? `${prefix}.${name}` : name;

        const nested = makeProxy(channel);

        const leaf = {
          send: (...args: any[]) => {
            if (contents && !contents.isDestroyed())
              contents.send(channel, ...args);
          },
          invoke: async (...args: any[]) => {
            const id = uuid();
            return new Promise((resolve, reject) => {
              ipcMain.once(
                id,
                (_event: any, payload: { error?: any; result?: any }) => {
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
              return (leaf as any)[key];
            }
            return (nested as any)[key];
          },
        });
      },
    });
  };

  return makeProxy();
};

export * from "./types";
