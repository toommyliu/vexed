import { IpcRenderer, IpcRendererEvent } from "electron";
import type {
  ClientFromRouter,
  RouterType,
  RendererHandlers,
  RendererHandlersListener,
} from "./types";

type InvokeFn = (input: unknown) => Promise<unknown>;
type SendFn = (input: unknown) => Promise<void>;
type ProxyFn = InvokeFn & { send?: SendFn } & Record<string, unknown>;

export const createClient = <Router extends RouterType>({
  ipcInvoke,
  ipcSend,
}: {
  ipcInvoke: IpcRenderer["invoke"];
  ipcSend: IpcRenderer["send"];
}): ClientFromRouter<Router> => {
  const makeProxy = (prefix = ""): ProxyFn => {
    // function target so the proxy is callable at every level
    const fn: InvokeFn = (input: unknown) => ipcInvoke(prefix, input);

    return new Proxy(fn, {
      get: (_t, prop) => {
        if (prop === "send") {
          return (input: unknown) => {
            ipcSend(prefix, input);
            return Promise.resolve();
          };
        }

        const name = prop.toString();
        const channel = prefix ? `${prefix}.${name}` : name;
        return makeProxy(channel);
      },
    }) as ProxyFn;
  };

  return new Proxy(() => {}, {
    get: (_, prop) => makeProxy(prop.toString()),
  }) as unknown as ClientFromRouter<Router>;
};

type EventListener = {
  listen: (handler: (...args: unknown[]) => void) => () => void;
  handle: (handler: (...args: unknown[]) => unknown) => () => void;
};

type EventHandler = EventListener & Record<string, unknown>;

export const createEventHandlers = <T extends RendererHandlers>({
  on,
  send,
}: {
  on: (
    channel: string,
    handler: (event: IpcRendererEvent, ...args: unknown[]) => void,
  ) => () => void;

  send: IpcRenderer["send"];
}) => {
  const makeProxy = (prefix = ""): EventHandler => {
    return new Proxy<EventHandler>({} as EventHandler, {
      get: (_target, prop) => {
        const name = prop.toString();
        const channel = prefix ? `${prefix}.${name}` : name;

        // Return a nested proxy for namespaces
        const nested = makeProxy(channel);

        // Return the listener/handler object for leaf functions
        const leaf: EventListener = {
          listen: (handler: (...args: unknown[]) => void) =>
            on(channel, (event, ...args) => handler(...args)),

          handle: (handler: (...args: unknown[]) => unknown) =>
            on(channel, async (event, ...allArgs) => {
              const [id, ...args] = allArgs;
              try {
                const result = await handler(...args);
                send(id as string, { result });
              } catch (error) {
                send(id as string, { error });
              }
            }),
        };

        // Use a proxy that merges nested namespaces with leaf methods
        return new Proxy(leaf, {
          get(_, key) {
            // Accessing listen/handle
            if (key in leaf) return leaf[key as keyof EventListener];

            // Otherwise return nested namespace
            return nested[key as keyof EventHandler];
          },
        });
      },
    });
  };

  return makeProxy() as RendererHandlersListener<T>;
};
