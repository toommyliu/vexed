export type ActionContext = {
  sender: Electron.WebContents;
  senderWindow: Electron.BrowserWindow | null;
  senderParentWindow: Electron.BrowserWindow | null;
  getRendererHandlers: <T extends RendererHandlers>(
    target?: Electron.WebContents | Electron.BrowserWindow | null,
  ) => RendererHandlersCaller<T>;
};
export type ActionFunction<TInput = any, TResult = any> = (args: {
  context: ActionContext;
  input: TInput;
}) => Promise<TResult>;
export interface RouterType {
  [key: string]:
    | {
        action: ActionFunction;
      }
    | RouterType;
}
type IsProcedure<T> = T extends {
  action: ActionFunction;
}
  ? true
  : false;
export type ClientFromRouter<Router extends RouterType> = {
  [K in keyof Router]: IsProcedure<Router[K]> extends true
    ? Router[K] extends {
        action: infer A;
      }
      ? A extends (options: {
          context: any;
          input: infer P;
        }) => Promise<infer R>
        ? (input: P) => Promise<R>
        : never
      : never
    : Router[K] extends RouterType
      ? ClientFromRouter<Router[K]>
      : never;
};

export type RendererHandlersFromRouter<Router extends RouterType> = {
  [K in keyof Router]: Router[K] extends {
    action: (options: { context: any; input: infer P }) => Promise<infer R>;
  }
    ? P extends void
      ? {
          send: () => void;
          invoke: () => Promise<R>;
        }
      : {
          send: (input: P) => void;
          invoke: (input: P) => Promise<R>;
        }
    : Router[K] extends RouterType
      ? RendererHandlersFromRouter<Router[K]>
      : never;
};
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
export {};
