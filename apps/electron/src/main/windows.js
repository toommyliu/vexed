const { join } = require('path');
const { BrowserWindow, session } = require('electron');

const RENDERER = join(__dirname, '../renderer');

const windows = new Map();

const userAgent =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36';

async function createGame(account = null) {
  const window = new BrowserWindow({
    width: 966,
    height: 552,
    title: account?.username ?? '',
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      plugins: true,
    },
  });

  window.webContents.setUserAgent(userAgent);
  session.defaultSession.webRequest.onBeforeSendHeaders(
    (details, callback) => {
      details.requestHeaders['User-Agent'] = userAgent;
      details.requestHeaders.artixmode = 'launcher';
      details.requestHeaders['x-requested-with'] =
        'ShockwaveFlash/32.0.0.371';
      details.requestHeaders['origin'] = 'https://game.aq.com';
      details.requestHeaders['sec-fetch-site'] = 'same-origin';
      callback({ requestHeaders: details.requestHeaders, cancel: false });
    },
  );

  await window
    .loadFile(join(RENDERER, 'game/game.html'))
    .catch((error) => console.log('error', error));
  window.webContents.openDevTools({ mode: 'right' });
  window.maximize();
}

module.exports = {
  createGame,
};
