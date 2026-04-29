export const ScriptingIpcChannels = {
  execute: "scripting:execute",
  stop: "scripting:stop",
  openFile: "scripting:open-file",
  readFile: "scripting:read-file",
} as const;

export interface ScriptExecutePayload {
  readonly source: string;
  readonly path?: string;
  readonly name?: string;
}

export interface IpcInvokeDefinition<
  TArgs extends ReadonlyArray<unknown>,
  TReturn,
> {
  readonly args: TArgs;
  readonly return: TReturn;
}

export interface ScriptingInvokeChannels {
  readonly [ScriptingIpcChannels.openFile]: IpcInvokeDefinition<
    [],
    ScriptExecutePayload | null
  >;
  readonly [ScriptingIpcChannels.readFile]: IpcInvokeDefinition<
    [path: string],
    ScriptExecutePayload
  >;
}

export interface ScriptingRendererEventChannels {
  readonly [ScriptingIpcChannels.execute]: [payload: ScriptExecutePayload];
  readonly [ScriptingIpcChannels.stop]: [];
}

export interface ScriptingBridge {
  openFile(): Promise<ScriptExecutePayload | null>;
  readFile(path: string): Promise<ScriptExecutePayload>;
  onExecute(listener: (payload: ScriptExecutePayload) => void): () => void;
  onStop(listener: () => void): () => void;
}

export interface AppBridge {
  readonly scripting: ScriptingBridge;
}
