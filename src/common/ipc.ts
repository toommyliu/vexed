import {
  ipcMain as ogIpcMain,
  ipcRenderer as ogIpcRenderer,
} from "electron-better-ipc";
import type { IPC_EVENTS } from "./ipc-events";
import type { FastTravel } from "./types";

export const ipcRenderer: TypedRendererIpc = {
  callMain: async (channel, data?: unknown) => {
    if (data === undefined) {
      return ogIpcRenderer.callMain(channel);
    }

    return ogIpcRenderer.callMain(channel, data);
  },
  answerMain: (channel, handler) =>
    ogIpcRenderer.answerMain(channel, async (data) => handler(data as any)),
  removeListener: (channel, handler) =>
    ogIpcRenderer.removeListener(channel, handler),
  on: (channel, handler) =>
    ogIpcRenderer.on(channel, (_event, data) => handler(data)),
  once: (channel, handler) =>
    ogIpcRenderer.once(channel, (_event, data) => handler(data)),
  removeAllListeners: (channel) => ogIpcRenderer.removeAllListeners(channel),
};

export const ipcMain: TypedMainIpc = {
  callRenderer: async (browserWindow, channel, data?) => {
    if (!data) {
      return ogIpcMain.callRenderer(browserWindow, channel);
    }

    return ogIpcMain.callRenderer(browserWindow, channel, data);
  },
  answerRenderer: (channel, handler) =>
    ogIpcMain.answerRenderer(channel, async (data, browserWindow) =>
      handler(data as TypedIpcEvents[typeof channel]["args"], browserWindow),
    ),
  removeListener: (channel, handler) =>
    ogIpcMain.removeListener(channel, handler),
  on: (channel, handler) =>
    ogIpcMain.on(channel, (_event, data) => handler(data)),
  once: (channel, handler) =>
    ogIpcMain.once(channel, (_event, data) => handler(data)),
  removeAllListeners: (channel) => ogIpcMain.removeAllListeners(channel),
};

type TypedRendererIpc = {
  answerMain<K extends keyof TypedIpcEvents>(
    channel: K,
    callback: (
      data: TypedIpcEvents[K]["args"] extends undefined
        ? never
        : TypedIpcEvents[K]["args"],
    ) => TypedIpcEvents[K]["response"] extends undefined
      ? Promise<void> | void
      : Promise<TypedIpcEvents[K]["response"]> | TypedIpcEvents[K]["response"],
  ): () => void;

  // For events without args
  callMain<K extends keyof TypedIpcEvents>(
    channel: K &
      keyof {
        [P in keyof TypedIpcEvents as TypedIpcEvents[P]["args"] extends undefined
          ? P
          : never]: true;
      },
  ): Promise<TypedIpcEvents[K]["response"]>;

  // For events with args
  callMain<K extends keyof TypedIpcEvents>(
    channel: K,
    data: TypedIpcEvents[K]["args"] extends undefined
      ? never
      : TypedIpcEvents[K]["args"],
  ): Promise<TypedIpcEvents[K]["response"]>;

  on<K extends keyof TypedIpcEvents>(
    channel: K,
    listener: (
      data: TypedIpcEvents[K]["args"] extends undefined
        ? never
        : TypedIpcEvents[K]["args"],
    ) => void,
  ): void;

  once<K extends keyof TypedIpcEvents>(
    channel: K,
    listener: (
      data: TypedIpcEvents[K]["args"] extends undefined
        ? never
        : TypedIpcEvents[K]["args"],
    ) => void,
  ): void;

  removeAllListeners(channel: keyof TypedIpcEvents): void;

  removeListener<K extends keyof TypedIpcEvents>(
    channel: K,
    listener: (
      data: TypedIpcEvents[K]["args"] extends undefined
        ? never
        : TypedIpcEvents[K]["args"],
    ) => void,
  ): void;
};

type TypedMainIpc = {
  // Answer to renderer process
  answerRenderer<K extends keyof TypedIpcEvents>(
    channel: K,
    callback: (
      data: TypedIpcEvents[K]["args"],
      browserWindow: Electron.BrowserWindow,
    ) => TypedIpcEvents[K]["response"] extends undefined
      ? Promise<void> | void
      : Promise<TypedIpcEvents[K]["response"]> | TypedIpcEvents[K]["response"],
  ): () => void;

  // For events without args
  callRenderer<K extends keyof TypedIpcEvents>(
    window: Electron.BrowserWindow,
    channel: K &
      keyof {
        [P in keyof TypedIpcEvents as TypedIpcEvents[P]["args"] extends undefined
          ? P
          : never]: true;
      },
  ): Promise<TypedIpcEvents[K]["response"]>;

  // For events with args
  callRenderer<K extends keyof TypedIpcEvents>(
    window: Electron.BrowserWindow,
    channel: K,
    data: TypedIpcEvents[K]["args"] extends undefined
      ? never
      : TypedIpcEvents[K]["args"],
  ): Promise<TypedIpcEvents[K]["response"]>;

  on<K extends keyof TypedIpcEvents>(
    channel: K,
    listener: (data: TypedIpcEvents[K]["args"]) => void,
  ): void;

  once<K extends keyof TypedIpcEvents>(
    channel: K,
    listener: (data: TypedIpcEvents[K]["args"]) => void,
  ): void;

  removeAllListeners(channel: keyof TypedIpcEvents): void;

  removeListener<K extends keyof TypedIpcEvents>(
    channel: K,
    listener: (data: TypedIpcEvents[K]["args"]) => void,
  ): void;
};

type TypedIpcEvents = {
  [IPC_EVENTS.MSGBROKER]: {
    args: {
      data?: unknown;
      ipcEvent: IpcChannelEvent;
      windowId?: WindowId;
    };
    response: {
      data: unknown;
    };
  };
  [IPC_EVENTS.REFRESHED]: {
    args: undefined;
    response: undefined;
  };
  [IPC_EVENTS.LOADED]: {
    args: undefined;
    response: undefined;
  };
  [IPC_EVENTS.LOAD_SCRIPT]: {
    args: {
      scriptPath?: string;
    };
    response: undefined;
  };
  [IPC_EVENTS.SCRIPT_LOADED]: {
    args: {
      fromManager: boolean;
    };
    response: undefined;
  };
  [IPC_EVENTS.TOGGLE_DEV_TOOLS]: {
    args: undefined;
    response: undefined;
  };
  [IPC_EVENTS.LOGIN_SUCCESS]: {
    args: {
      username: string;
    };
    response: undefined;
  };
  [IPC_EVENTS.ACTIVATE_WINDOW]: {
    args: {
      windowId: string;
    };
    response: undefined;
  };
  [IPC_EVENTS.FAST_TRAVEL]: {
    args: FastTravel & { roomNumber: number };
    response: undefined;
  };
  [IPC_EVENTS.READ_FAST_TRAVELS]: {
    args: undefined;
    response: FastTravel[];
  };
  [IPC_EVENTS.LOADER_GRABBER_LOAD]: {
    args: {
      id: string;
      type: string;
    };
    response: undefined;
  };
  [IPC_EVENTS.LOADER_GRABBER_GRAB]: {
    args: {
      type: string;
    };
    response: {
      data: unknown;
      type: string;
    };
  };
  [IPC_EVENTS.FOLLOWER_ME]: {
    args: undefined;
    response: { name: string } | null;
  };
  [IPC_EVENTS.FOLLOWER_START]: {
    args: {
      antiCounter: boolean;
      attackPriority: string;
      copyWalk: boolean;
      drops: string;
      name: string;
      quests: string;
      rejectElse: boolean;
      safeSkill: string;
      safeSkillEnabled: boolean;
      safeSkillHp: string;
      skillDelay: string;
      skillList: string;
      skillWait: boolean;
    };
    response: undefined;
  };
  [IPC_EVENTS.FOLLOWER_STOP]: {
    args: undefined;
    response: undefined;
  };
  [IPC_EVENTS.PACKET_LOGGER_START]: {
    args: undefined;
    response: undefined;
  };
  [IPC_EVENTS.PACKET_LOGGER_STOP]: {
    args: undefined;
    response: undefined;
  };
  [IPC_EVENTS.PACKET_LOGGER_PACKET]: {
    args: {
      packet: string;
    };
    response: undefined;
  };
  [IPC_EVENTS.PACKET_SPAMMER_START]: {
    args: {
      delay: number;
      packets: string[];
    };
    response: undefined;
  };
  [IPC_EVENTS.PACKET_SPAMMER_STOP]: {
    args: undefined;
    response: undefined;
  };

  // #region Army
  [IPC_EVENTS.ARMY_INIT]: {
    args: {
      fileName: string;
      playerName: string;
      players: string[];
    };
    response: undefined;
  };
  [IPC_EVENTS.ARMY_JOIN]: {
    args: {
      fileName: string;
      playerName: string;
    };
    response: undefined;
  };
  [IPC_EVENTS.ARMY_START_JOB]: {
    args: undefined;
    response: undefined;
  };
  [IPC_EVENTS.ARMY_FINISH_JOB]: { args: undefined; response: undefined };
  [IPC_EVENTS.ARMY_READY]: {
    args: undefined;
    response: undefined;
  };

  // #region Manager
  [IPC_EVENTS.GET_ACCOUNTS]: {
    args: undefined;
    response: Account[];
  };
  [IPC_EVENTS.ADD_ACCOUNT]: {
    args: Account;
    response: { msg: string; success: false } | { msg?: string; success: true };
  };
  [IPC_EVENTS.REMOVE_ACCOUNT]: {
    args: { username: string };
    response: boolean;
  };
  [IPC_EVENTS.LAUNCH_GAME]: {
    args: AccountWithServer;
    response: undefined;
  };
  [IPC_EVENTS.ENABLE_BUTTON]: {
    args: {
      username: string;
    };
    response: undefined;
  };
  [IPC_EVENTS.MGR_LOAD_SCRIPT]: {
    args: undefined;
    response: string;
  };
};
