export type ActionContext = {
    sender: Electron.WebContents;
};
export type ActionFunction<TInput = any, TResult = any> = (args: {
    context: ActionContext;
    input: TInput;
}) => Promise<TResult>;
export interface RouterType {
    [key: string]: {
        action: ActionFunction;
    } | RouterType;
}
type IsProcedure<T> = T extends {
    action: ActionFunction;
} ? true : false;
export type ClientFromRouter<Router extends RouterType> = {
    [K in keyof Router]: IsProcedure<Router[K]> extends true ? Router[K] extends {
        action: infer A;
    } ? A extends (options: {
        context: any;
        input: infer P;
    }) => Promise<infer R> ? (input: P) => Promise<R> : never : never : Router[K] extends RouterType ? ClientFromRouter<Router[K]> : never;
};
export type RendererHandlers = Record<string, (...args: any[]) => any>;
export type RendererHandlersListener<T extends RendererHandlers> = {
    [K in keyof T]: {
        listen: (handler: (...args: Parameters<T[K]>) => void) => () => void;
        handle: (handler: T[K]) => () => void;
    };
};
export type RendererHandlersCaller<T extends RendererHandlers> = {
    [K in keyof T]: {
        send: (...args: Parameters<T[K]>) => void;
        invoke: (...args: Parameters<T[K]>) => Promise<Awaited<ReturnType<T[K]>>>;
    };
};
export {};
