import type {
  AppBridge,
  ScriptExecutePayload,
} from "../../shared/ipc";

declare global {
  // Item id or name
  type ItemIdentifierToken = number | string;
  type ConnectionStatus = "OnConnection" | "OnConnectionLost";

  type MonsterName =
	| string
	| `id'${number}`
	| `id.${number}`
    | `id:${number}`
    | `id-${number}`;
  type MonsterMapID = number;
  type MonsterIdentifierToken = MonsterName | MonsterMapID;
  type Skill = number | string;


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
    readonly ipc: AppBridge;
    cmd?: ScriptGlobalApi;
  }
}

export {};
