import {
  ipcMain as ogIpcMain,
  ipcRenderer as ogIpcRenderer,
} from 'electron-better-ipc';
import type { IPC_EVENTS } from './ipc-events';
import type { FastTravel } from './types';

// TODO: add a broker method?

export const ipcRenderer: TypedRendererIpc = {
  callMain: async (channel, data?: unknown) => {
    if (data === undefined) {
      return ogIpcRenderer.callMain(channel);
    }

    return ogIpcRenderer.callMain(channel, data);
  },
  // @ts-expect-error i don't even know...
  answerMain: (channel, handler) => ogIpcRenderer.answerMain(channel, handler),
};

export const ipcMain: TypedMainIpc = {
  callRenderer: async (browserWindow, channel, data?) => {
    if (!data) {
      return ogIpcMain.callRenderer(browserWindow, channel);
    }

    return ogIpcMain.callRenderer(browserWindow, channel, data);
  },
  answerRenderer: (channel, handler) =>
    // @ts-expect-error i don't even know...
    ogIpcMain.answerRenderer(channel, handler),
};

type TypedRendererIpc = {
  answerMain<K extends keyof TypedIpcEvents>(
    channel: K,
    callback: (
      data: TypedIpcEvents[K]['args'] extends undefined
        ? never
        : TypedIpcEvents[K]['args'],
    ) => TypedIpcEvents[K]['response'] extends undefined
      ? Promise<void> | void
      : Promise<TypedIpcEvents[K]['response']> | TypedIpcEvents[K]['response'],
  ): () => void;

  // For events without args
  callMain<K extends keyof TypedIpcEvents>(
    channel: K &
      keyof {
        [P in keyof TypedIpcEvents as TypedIpcEvents[P]['args'] extends undefined
          ? P
          : never]: true;
      },
  ): Promise<TypedIpcEvents[K]['response']>;

  // For events with args
  callMain<K extends keyof TypedIpcEvents>(
    channel: K,
    data: TypedIpcEvents[K]['args'] extends undefined
      ? never
      : TypedIpcEvents[K]['args'],
  ): Promise<TypedIpcEvents[K]['response']>;
};

type TypedMainIpc = {
  // Answer to renderer process
  answerRenderer<K extends keyof TypedIpcEvents>(
    channel: K,
    callback: (
      data: TypedIpcEvents[K]['args'],
      browserWindow: Electron.BrowserWindow,
    ) => TypedIpcEvents[K]['response'] extends undefined
      ? Promise<void> | void
      : Promise<TypedIpcEvents[K]['response']> | TypedIpcEvents[K]['response'],
  ): () => void;

  // For events without args
  callRenderer<K extends keyof TypedIpcEvents>(
    window: Electron.BrowserWindow,
    channel: K &
      keyof {
        [P in keyof TypedIpcEvents as TypedIpcEvents[P]['args'] extends undefined
          ? P
          : never]: true;
      },
  ): Promise<TypedIpcEvents[K]['response']>;

  // For events with args
  callRenderer<K extends keyof TypedIpcEvents>(
    window: Electron.BrowserWindow,
    channel: K,
    data: TypedIpcEvents[K]['args'] extends undefined
      ? never
      : TypedIpcEvents[K]['args'],
  ): Promise<TypedIpcEvents[K]['response']>;
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
    args: undefined;
    response: undefined;
  };
  [IPC_EVENTS.SCRIPT_LOADED]: {
    args: undefined;
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
      attackPriority: string;
      copyWalk: boolean;
      name: string;
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

  [IPC_EVENTS.GET_ACCOUNTS]: {
    args: undefined;
    response: Account[];
  };
  [IPC_EVENTS.ADD_ACCOUNT]: {
    args: Account;
    response: { msg: string; success: false } | { success: true };
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
};
