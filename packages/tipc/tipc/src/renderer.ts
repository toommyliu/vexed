import "@tybys/electron-ipc-handle-invoke/renderer"
import { IpcRenderer, IpcRendererEvent } from "electron"
import type { RouterType, RendererHandlers } from "./types"

export const createClient = <Router extends RouterType>({
  ipcInvoke,
}: {
  ipcInvoke: IpcRenderer["invoke"]
}) => {
  const makeProxy = (prefix = ""): any => {
    // function target so the proxy is callable at every level
    const fn = (input: any) => ipcInvoke(prefix, input)

    return new Proxy(fn, {
      get: (_t, prop) => {
        const name = prop.toString()
        const channel = prefix ? `${prefix}.${name}` : name
        return makeProxy(channel)
      },
    })
  }

  return new Proxy(() => {}, {
    get: (_, prop) => makeProxy(prop.toString()),
  })
}

export const createEventHandlers = <T extends RendererHandlers>({
  on,

  send,
}: {
  on: (
    channel: string,
    handler: (event: IpcRendererEvent, ...args: any[]) => void
  ) => () => void

  send: IpcRenderer["send"]
}) => {
  const makeProxy = (prefix = "") =>
    new Proxy<any>({} as any, {
      get: (_, prop) => {
        const name = prop.toString()
        const channel = prefix ? `${prefix}.${name}` : name

        return {
          listen: (handler: any) =>
            on(channel, (event, ...args) => handler(...args)),

          handle: (handler: any) =>
            on(channel, async (event, id: string, ...args) => {
              try {
                const result = await handler(...args)
                send(id, { result })
              } catch (error) {
                send(id, { error })
              }
            }),
        }
      },
    })

  return makeProxy()
}
