import { join } from 'path';
import { app, BrowserWindow, dialog } from 'electron/main';
import { readFile } from 'fs-extra';
import { WINDOW_IDS } from '../../common/constants';
import { ipcMain } from '../../common/ipc';
import { IPC_EVENTS } from '../../common/ipc-events';
import { Logger } from '../../common/logger';
import type { FastTravel } from '../../common/types';
import { FileManager } from '../FileManager';
import { recursivelyApplySecurityPolicy } from '../util/recursivelyApplySecurityPolicy';
import { mgrWindow, store } from '../windows';
import { ArgsError } from '../../renderer/game/botting/ArgsError';

const fm = FileManager.getInstance();
const logger = Logger.get('IpcGame');

const PUBLIC = join(__dirname, '../../../public');

const getWindow = (
  windows: ReturnType<typeof store.get>,
  windowId: WindowId | undefined,
) => {
  if (!windows) return undefined;

  switch (windowId) {
    case WINDOW_IDS.FAST_TRAVELS:
      return windows!.tools.fastTravels;
    case WINDOW_IDS.LOADER_GRABBER:
      return windows!.tools.loaderGrabber;
    case WINDOW_IDS.FOLLOWER:
      return windows!.tools.follower;
    case WINDOW_IDS.PACKETS_LOGGER:
      return windows!.packets.logger;
    case WINDOW_IDS.PACKETS_SPAMMER:
      return windows!.packets.spammer;
    case undefined:
      // no target was provided, default to the game window
      return windows.game;
  }
};

ipcMain.answerRenderer(IPC_EVENTS.MSGBROKER, async (data, browserWindow) => {
  const parent = browserWindow.getParentWindow();
  // if there is no parent, then it must be the parent window
  const windowStoreId = parent?.id ?? browserWindow.id;
  const windows = store.get(windowStoreId);

  if (!windows) {
    logger.info(`no windows found for id: ${windowStoreId}`);
    return;
  }

  const targetWindow = getWindow(windows, data.windowId);
  if (!targetWindow || targetWindow?.isDestroyed()) {
    logger.info(`target window not found: ${data.windowId ?? 'game'}`);
    return;
  }

  logger.info(
    `forwarding event "${data.ipcEvent}" to ${data.windowId ?? 'game'}`,
    data,
  );

  // relay the message to the target window and forward the
  // response back to the sender if possible.
  //
  // to return a response: the target renderer must .answerMain() and
  // return a value, otherwise, the promise resolves with undefined
  return ipcMain.callRenderer(targetWindow, data.ipcEvent, data.data);
});

ipcMain.answerRenderer(IPC_EVENTS.LOGIN_SUCCESS, async ({ username }) => {
  if (!mgrWindow) return;

  logger.info(`user ${username} successfully logged in`);

  await ipcMain
    .callRenderer(mgrWindow, IPC_EVENTS.ENABLE_BUTTON, {
      username,
    })
    .catch(() => {});
});

ipcMain.answerRenderer(
  IPC_EVENTS.ACTIVATE_WINDOW,
  async ({ windowId }, browserWindow) => {
    const windows = store.get(browserWindow.id);
    if (!windows) {
      logger.info(
        `${windowId} (${browserWindow.id}) does not belong to any store?`,
      );
      return;
      // return false;
    }

    let ref: BrowserWindow | null = null;
    let path: string | null = null;
    let width: number;
    let height: number;

    switch (windowId) {
      case WINDOW_IDS.FAST_TRAVELS:
        ref = windows.tools.fastTravels;
        path = join(PUBLIC, 'game/tools/fast-travels/index.html');
        width = 510;
        height = 494;
        break;
      case WINDOW_IDS.LOADER_GRABBER:
        ref = windows.tools.loaderGrabber;
        path = join(PUBLIC, 'game/tools/loader-grabber/index.html');
        width = 478;
        height = 689;
        break;
      case WINDOW_IDS.FOLLOWER:
        ref = windows.tools.follower;
        path = join(PUBLIC, 'game/tools/follower/index.html');
        width = 402;
        height = 499;
        break;
      case WINDOW_IDS.PACKETS_LOGGER:
        ref = windows.packets.logger;
        path = join(PUBLIC, 'game/packets/logger/index.html');
        width = 560;
        height = 286;
        break;
      case WINDOW_IDS.PACKETS_SPAMMER:
        ref = windows.packets.spammer;
        path = join(PUBLIC, 'game/packets/spammer/index.html');
        width = 596;
        height = 325;
        break;
    }

    // Restore the previously created window
    if (ref && !ref?.isDestroyed()) {
      logger.info(`restoring window for ${windowId}`);
      ref.show();
      ref.focus();
      return;
      // return true;
    }

    logger.info(`creating new window for ${windowId}`);

    // Create it
    const window = new BrowserWindow({
      title: '',
      webPreferences: {
        contextIsolation: false,
        nodeIntegration: true,
      },
      // Parent is required in order to maintain parent-child relationships and for ipc calls
      // Moving the parent also moves the child, as well as minimizing it
      parent: browserWindow,
      width: width!,
      minWidth: width!,
      minHeight: height!,
      height: height!,
      // When a child window is minimized, the parent window is also minimized,
      // which is not desired. See https://github.com/electron/electron/issues/26031
      minimizable: false,
      show: false,
    });

    // Update the store immediately, to ensure window can get its string id ASAP through IPC
    switch (windowId) {
      case WINDOW_IDS.FAST_TRAVELS:
        windows.tools.fastTravels = window;
        break;
      case WINDOW_IDS.LOADER_GRABBER:
        windows.tools.loaderGrabber = window;
        break;
      case WINDOW_IDS.FOLLOWER:
        windows.tools.follower = window;
        break;
      case WINDOW_IDS.PACKETS_LOGGER:
        windows.packets.logger = window;
        break;
      case WINDOW_IDS.PACKETS_SPAMMER:
        windows.packets.spammer = window;
        break;
    }

    if (!app.isPackaged) {
      window.webContents.openDevTools({ mode: 'right' });
    }

    recursivelyApplySecurityPolicy(window);

    window.on('ready-to-show', () => {
      window.show();
    });

    // don't close the window, just hide it
    window.on('close', (ev) => {
      ev.preventDefault();
      window.hide();
    });

    await window.loadFile(path!);
    // return true;
  },
);

ipcMain.answerRenderer(IPC_EVENTS.LOAD_SCRIPT, async (_, browserWindow) => {
  try {
    const res = await dialog.showOpenDialog(browserWindow, {
      defaultPath: join(fm.basePath, 'Bots'),
      properties: ['openFile'],
      filters: [{ name: 'Bots', extensions: ['js'] }],
      message: 'Select a script to load',
      title: 'Select a script to load',
    });

    if (res.canceled || !res.filePaths[0]) return;

    const file = res.filePaths[0]!;
    const content = await readFile(file, 'utf8');

    // the error is thrown in the renderer
    // so we need to listen for it here and handle it
    browserWindow.webContents.once(
      'console-message',
      async (_, level, message, line) => {
        const args = message.slice('Uncaught'.length).split(':');

        const err = args[0]!; // Error
        const _msg = args
          .join(' ')
          .slice(err!.length + 1)
          .trim();

        // bad args to a command
        if (level === 3 && _msg.startsWith('Invalid args')) {
          const split = _msg.split(';'); // Invalid args;delay;ms is required
          const cmd = split[1]!; // delay
          const cmd_msg = split[2]!; // ms is required

          try {
            // reset the commands
            await browserWindow.webContents.executeJavaScript(
              'window.context._commands = []',
            );

            // ideally, this traces to the line of the (user) script back to
            // where the error occured, not where the error is thrown internally
            await dialog.showMessageBox(browserWindow, {
              message: `"cmd.${cmd}()" threw an error: ${cmd_msg}`,
              type: 'error',
            });
          } catch {}
        } else {
          // some generic error (syntax, etc)
          await dialog
            .showMessageBox(browserWindow, {
              message: err,
              detail: `${_msg} (line ${line})`,
              type: 'error',
            })
            .catch(() => {});
        }
      },
    );

    await browserWindow.webContents.executeJavaScript(content);
    await ipcMain.callRenderer(browserWindow, IPC_EVENTS.SCRIPT_LOADED);
  } catch {}

  browserWindow.webContents.removeAllListeners('console-message');
});

ipcMain.answerRenderer(IPC_EVENTS.READ_FAST_TRAVELS, async () => {
  try {
    return (await fm.readJson(fm.fastTravelsPath)) as FastTravel[];
  } catch {
    return fm.defaultFastTravels;
  }
});

ipcMain.answerRenderer(IPC_EVENTS.TOGGLE_DEV_TOOLS, (_, browserWindow) => {
  try {
    if (!browserWindow.isDestroyed())
      browserWindow.webContents.toggleDevTools();
  } catch {}
});
