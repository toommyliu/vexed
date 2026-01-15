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
export type EventFunction<TInput = any> = (args: {
  context: ActionContext;
  input: TInput;
}) => Promise<void>;
export interface RouterType {
  [key: string]:
    | {
        action: ActionFunction;
      }
    | {
        event: EventFunction;
      }
    | RouterType;
}
type RouteInput<T> = T extends {
  action: (options: { context: any; input: infer P }) => Promise<unknown>;
}
  ? P
  : T extends {
        event: (options: { context: any; input: infer P }) => Promise<void>;
      }
    ? P
    : never;
type RouteResult<T> = T extends {
  action: (options: { context: any; input: any }) => Promise<infer R>;
}
  ? R
  : never;
type ActionClient<TInput, TResult> = {
  (input: TInput): Promise<TResult>;
  send?: (input: TInput) => Promise<void>;
};
type EventClient<TInput> = {
  (input: TInput): Promise<void>;
  send: (input: TInput) => Promise<void>;
};
export type ClientFromRouter<Router extends RouterType> = {
  [K in keyof Router]: Router[K] extends { action: (...args: any[]) => any }
    ? ActionClient<RouteInput<Router[K]>, RouteResult<Router[K]>>
    : Router[K] extends { event: (...args: any[]) => any }
      ? EventClient<RouteInput<Router[K]>>
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
    : Router[K] extends {
          event: (options: { context: any; input: infer P }) => Promise<void>;
        }
      ? P extends void
        ? {
            send: () => void;
            invoke: () => Promise<void>;
          }
        : {
            send: (input: P) => void;
            invoke: (input: P) => Promise<void>;
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
