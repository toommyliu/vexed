interface ScriptExecutePayload {
  readonly source: string;
  readonly path?: string;
  readonly name?: string;
}

declare global {
  // Item id or name
  type ItemIdentifierToken = number | string;
  type ConnectionStatus = "OnConnection" | "OnConnectionLost";

  interface RunningScriptCommand {
    readonly sourceName: string;
    readonly index: number;
    readonly name: string;
  }

  interface ScriptGlobalApi {
    run(source: string, name?: string): void;
    stop(): void;
    open(): Promise<ScriptExecutePayload | null>;
    readFile(path: string): Promise<ScriptExecutePayload>;
    runFile(path: string): Promise<void>;
    listCommands(): Promise<ReadonlyArray<string>>;
    isRunning(): Promise<boolean>;
    currentCommand(): Promise<RunningScriptCommand | null>;
  }

  interface Window {
    cmd?: ScriptGlobalApi;
  }
}

export {};
