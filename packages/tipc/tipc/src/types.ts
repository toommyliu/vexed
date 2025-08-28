export type ActionContext = {
  sender: Electron.WebContents
}

export type ActionFunction<TInput = any, TResult = any> = (args: {
  context: ActionContext
  input: TInput
}) => Promise<TResult>

// A route is a leaf with an action. A RouterType can be nested arbitrarily.
export type Route = { action: ActionFunction }
export interface RouterType {
  [key: string]: Route | RouterType
}

export type ClientFromRouter<Router extends RouterType> = {
  [K in keyof Router]: Router[K] extends {
    action: (options: { context: any; input: infer P }) => Promise<infer R>
  }
    ? (input: P) => Promise<R>
    : Router[K] extends RouterType
    ? ClientFromRouter<Router[K]>
    : never
}

// Renderer handlers can also be nested. A value is either a handler function or another nested map.
export interface RendererHandlers {
  [key: string]: ((...args: any[]) => any) | RendererHandlers
}

export type RendererHandlersListener<T extends RendererHandlers> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? {
        listen: (handler: (...args: Parameters<T[K]>) => void) => () => void
        handle: (handler: T[K]) => () => void
      }
    : T[K] extends RendererHandlers
    ? RendererHandlersListener<T[K]>
    : never
}

export type RendererHandlersCaller<T extends RendererHandlers> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? {
        send: (...args: Parameters<T[K]>) => void
        invoke: (
          ...args: Parameters<T[K]>
        ) => Promise<Awaited<ReturnType<T[K]>>>
      }
    : T[K] extends RendererHandlers
    ? RendererHandlersCaller<T[K]>
    : never
}
