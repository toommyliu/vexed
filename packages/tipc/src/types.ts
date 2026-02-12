export type ActionContext = {
  sender: Electron.WebContents;
  senderWindow: Electron.BrowserWindow | null;
  senderWindowId: number | null;
  getRendererHandlers: <T extends RendererHandlers>(
    target?: Electron.WebContents | Electron.BrowserWindow | null,
  ) => RendererHandlersCaller<T>;
};

export type ActionContextWithSenderWindow = ActionContext & {
  senderWindow: Electron.BrowserWindow;
  senderWindowId: number;
};

export type ActionFunction<
  TInput = any,
  TResult = any,
  TContext extends ActionContext = ActionContext,
> = (args: {
  context: TContext;
  input: TInput;
}) => Promise<TResult>;

export type SendActionFunction<TInput = any> = (args: {
  context: ActionContext;
  input: TInput;
}) => void;

type RouteMeta = {
  requireSenderWindow?: boolean;
};

// A route is a leaf with an action. A RouterType can be nested arbitrarily.
export type Route = {
  action: ActionFunction<any, any, any>;
  __tipcMeta?: RouteMeta;
};
export type SendRoute = { sendAction: SendActionFunction };
export interface RouterType {
  [key: string]: Route | SendRoute | RouterType;
}

export type ClientFromRouter<Router extends RouterType> = {
  [K in keyof Router]: Router[K] extends {
    action: (options: { context: any; input: infer P }) => Promise<infer R>;
  }
    ? ((input: P) => Promise<R>) & { send: (input: P) => void }
    : Router[K] extends {
          sendAction: (options: { context: any; input: infer P }) => void;
        }
      ? (input: P) => void
      : Router[K] extends RouterType
        ? ClientFromRouter<Router[K]>
        : never;
};

// Renderer handlers can also be nested. A value is either a handler function or another nested map.
export interface RendererHandlers {
  [key: string]: ((...args: any[]) => any) | RendererHandlers;
}

export type RendererHandlersListener<T extends RendererHandlers> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? {
        listen: (handler: (...args: Parameters<T[K]>) => void) => () => void;
        handle: (handler: T[K]) => () => void;
      }
    : T[K] extends RendererHandlers
      ? RendererHandlersListener<T[K]>
      : never;
};

export type RendererHandlersCaller<T extends RendererHandlers> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? {
        send: (...args: Parameters<T[K]>) => void;
        invoke: (
          ...args: Parameters<T[K]>
        ) => Promise<Awaited<ReturnType<T[K]>>>;
      }
    : T[K] extends RendererHandlers
      ? RendererHandlersCaller<T[K]>
      : never;
};
