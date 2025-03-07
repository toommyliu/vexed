import { join, resolve } from 'path';
import { app, BrowserWindow, session } from 'electron';
import { ARTIX_USERAGENT, BRAND } from '../common/constants';
import { ipcMain } from '../common/ipc';
import { IPC_EVENTS } from '../common/ipc-events';
import { Logger } from '../common/logger';
import { recursivelyApplySecurityPolicy } from './util/recursivelyApplySecurityPolicy';

const PUBLIC = join(__dirname, '../../public/');
const PUBLIC_GAME = join(PUBLIC, 'game/');
const PUBLIC_MANAGER = join(PUBLIC, 'manager/');

const logger = Logger.get('Windows');

export const store: WindowStore = new Map();

// eslint-disable-next-line import-x/no-mutable-exports
export let mgrWindow: BrowserWindow | null;

export async function createAccountManager(): Promise<void> {
  if (mgrWindow) {
    mgrWindow.show();
    mgrWindow.focus();
    return;
  }

  const window = new BrowserWindow({
    width: 966,
    height: 552,
    title: BRAND,
    webPreferences: {
      nodeIntegration: true,
    },
    useContentSize: true,
  });
  window.on('close', (ev) => {
    ev.preventDefault();
    window.hide();
  });

  window.webContents.userAgent = ARTIX_USERAGENT;
  session.defaultSession.webRequest.onBeforeSendHeaders((details, fn) => {
    details.requestHeaders['User-Agent'] = ARTIX_USERAGENT;
    details.requestHeaders['artixmode'] = 'launcher';
    details.requestHeaders['x-requested-with'] = 'ShockwaveFlash/32.0.0.371';
    fn({ requestHeaders: details.requestHeaders, cancel: false });
  });

  mgrWindow = window;

  await window.loadURL(`file://${resolve(PUBLIC_MANAGER, 'index.html')}`);

  if (!app.isPackaged) {
    window.webContents.openDevTools({ mode: 'right' });
  }
}

export async function createGame(
  account: AccountWithServer | null = null,
): Promise<void> {
  const args: string[] = [];
  if (account?.username) {
    args.push(`--username=${account.username}`);
  }

  if (account?.password) {
    args.push(`--password=${account.password}`);
  }

  if (account?.server) {
    args.push(`--server=${account.server}`);
  }

  const window = new BrowserWindow({
    width: 966,
    height: 552,
    title: BRAND,
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: true,
      plugins: true,
      // pass account data to run "Login With Account"
      additionalArguments: args,
      // disable unuseful features
      enableWebSQL: false,
      spellcheck: false,
      webgl: false,
    },
    useContentSize: true,
    // show once everything has loaded (to reduce flickering)
    show: false,
  });

  await window.loadURL(`file://${resolve(PUBLIC_GAME, 'index.html')}`);
  recursivelyApplySecurityPolicy(window);

  if (!app.isPackaged) {
    window.webContents.openDevTools({ mode: 'right' });
  }

  window.on('ready-to-show', () => {
    window.show();
  });

  // track refreshes to sync state across children
  // e.g main window refreshed and follower is on, it should be off
  // to prevent desync
  window.webContents.on('did-finish-load', async () => {
    logger.info('game window re(loaded)');

    const windows = store.get(window.id);

    if (windows) {
      try {
        for (const child of Object.values(windows.tools)) {
          if (child && !child.isDestroyed()) {
            await ipcMain.callRenderer(child!, IPC_EVENTS.REFRESHED);
          }
        }

        for (const child of Object.values(windows.packets)) {
          if (child && !child.isDestroyed()) {
            await ipcMain.callRenderer(child!, IPC_EVENTS.REFRESHED);
          }
        }
      } catch {}
    }
  });

  window.on('close', () => {
    const windows = store.get(window.id);
    if (windows) {
      for (const child of Object.values(windows.tools)) {
        if (child && !child.isDestroyed()) {
          child.destroy();
        }
      }

      for (const child of Object.values(windows.packets)) {
        if (child && !child.isDestroyed()) {
          child.destroy();
        }
      }
    }
  });

  store.set(window.id, {
    game: window,
    tools: { fastTravels: null, loaderGrabber: null, follower: null },
    packets: { logger: null, spammer: null },
  });
}

// TODO: refactor

export type WindowStore = Map<
  number,
  {
    game: BrowserWindow;
    packets: {
      logger: BrowserWindow | null;
      spammer: BrowserWindow | null;
    };
    tools: {
      fastTravels: BrowserWindow | null;
      follower: BrowserWindow | null;
      loaderGrabber: BrowserWindow | null;
    };
  }
>;
