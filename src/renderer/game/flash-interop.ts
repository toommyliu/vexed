import process from 'process';
import { ipcRenderer } from '../../common/ipc';
import { IPC_EVENTS } from '../../common/ipc-events';
import { Logger } from '../../common/logger';
import { Bot } from './lib/Bot';
import { addGoldExp } from './networking/json/add-gold-exp';
import { ct } from './networking/json/ct';
import { dropItem } from './networking/json/drop-item';
import { initUserData } from './networking/json/init-user-data';

// import { FileManager } from '../../main/FileManager';
// FileManager.getInstance().writeJson(
//   FileManager.getInstance().basePath + '/packets.json',
//   [],
// );

const logger = Logger.get('FlashInterop');
const bot = Bot.getInstance();

// window.clear = () => {
//   FileManager.getInstance().writeJson(
//     FileManager.getInstance().basePath + '/packets.json',
//     [],
//   );
// };

window.packetFromClient = ([packet]: [string]) => {
  bot.emit('packetFromClient', packet);
};

window.packetFromServer = ([packet]: [string]) => {
  bot.emit('packetFromServer', packet);
};

window.pext = async ([packet]) => {
  const pkt = JSON.parse(packet);
  delete pkt.currentTarget;
  delete pkt.target;
  delete pkt.eventPhase;
  delete pkt.bubbles;
  delete pkt.cancelable;
  delete pkt.type;

  Bot.getInstance().emit('pext', pkt);

  // await FileManager.getInstance().appendJson(
  //   FileManager.getInstance().basePath + '/packets.json',
  //   pkt,
  // );

  if (pkt?.params?.type === 'str') {
    const dataObj = pkt?.params?.dataObj; // ['exitArea', '-1', 'ENT_ID', 'PLAYER']

    // const ogPkt = `%xt%${dataObj.join('%')}%`; // %xt%exitArea%-1%ENT_ID%PLAYER%

    switch (dataObj[0]) {
      case 'respawnMon':
        break;
      case 'exitArea':
        bot.emit('playerLeave', dataObj[dataObj.length - 1]);
        break;
    }
  } else if (pkt?.params?.type === 'json') {
    const dataObj = pkt?.params?.dataObj; // { intGold: 8, cmd: '', intExp: 0, bonusGold: 2, typ: 'm' }

    switch (pkt?.params?.dataObj?.cmd) {
      case 'addGoldExp':
        await addGoldExp(bot, dataObj);
        break;
      case 'ct':
        ct(bot, dataObj);
        break;
      case 'dropItem':
        dropItem(bot, dataObj);
        break;
      case 'initUserData':
        console.log('initUserData', dataObj);
        initUserData(bot, dataObj);
        break;
    }
  }
};

// window.packetFromServer = async ([packet]: [string]) => {
//   bot.emit('packetFromServer', packet);

//   if (packet.startsWith('%xt%')) {
//     const args = packet.split('%');
//     const cmd = args[2];

//     if (!cmd) return;

//     switch (cmd) {
//       case 'respawnMon':
//         break;

//       case 'exitArea': {
//         const playerName = args[5];
//         bot.emit('playerLeave', playerName);
//         break;
//       }

//       default:
//         break;
//     }
//   }

//   if (packet.startsWith('{')) {
//     try {
//       const pkt = JSON.parse(packet);
//       const cmd = pkt.b.o.cmd;

//       switch (cmd) {
//         case 'addGoldExp':
//           await addGoldExp(bot, pkt);
//           break;
//         case 'ct':
//           ct(bot, pkt);
//           break;
//         case 'dropItem':
//           dropItem(bot, pkt);
//           break;
//       }
//     } catch (error) {
//       // this threw once and i cant repro
//       logger.error(
//         `Failed to parse JSON packet:\nOriginal packet: ${packet}\nError: ${error}`,
//       );
//     }
//   }
// };

// window.packetFromClient = async ([packet]: [string]) => {
//   bot.emit('packetFromClient', packet);
// };

window.connection = ([state]: [string]) => {
  const elList = [
    document.querySelector('#cells')!,
    document.querySelector('#pads')!,
    document.querySelector('#x')!,
    document.querySelector('#bank')!,
  ];

  for (const el of elList) {
    if (state === 'OnConnection') {
      el.removeAttribute('disabled');
      el.classList.remove('w3-disabled');
    } else if (state === 'OnConnectionLost') {
      el.setAttribute('disabled', '');
      el.classList.add('w3-disabled');
    }
  }

  if (state === 'OnConnection') bot.emit('login');
  else if (state === 'OnConnectionLost') bot.emit('logout');
};

window.loaded = async () => {
  // await ipcRenderer.callMain(IPC_EVENTS.LOADED);

  const username = process.argv.find((arg) => arg.startsWith('--username='));
  const password = process.argv.find((arg) => arg.startsWith('--password='));
  const server = process.argv.find((arg) => arg.startsWith('--server='));

  if (username && password && server) {
    const [, user] = username.split('=');
    const [, pass] = password.split('=');
    const [, serv] = server.split('=');

    if (!user || !pass || !serv) return;

    const ogDelay = bot.autoRelogin.delay;

    bot.autoRelogin.setCredentials(user!, pass!, serv!);
    bot.autoRelogin.delay = 0;

    // auto relogin should have triggered
    await bot.waitUntil(() => bot.player.isReady(), null, -1);

    // reset
    bot.autoRelogin.setCredentials('', '', '');
    bot.autoRelogin.delay = ogDelay;

    logger.info('auto relogin success, responding');
    await ipcRenderer
      .callMain(IPC_EVENTS.LOGIN_SUCCESS, { username: user })
      .catch(() => {});
  }
};

window.flashDebug = (...args: string[]) => {
  logger.info(...args);
};

// @ts-expect-error - provided by flash and properly typed
window.progress = ([percent]: number) => {
  const progressBar = document.querySelector(
    '.progress-bar',
  )! as HTMLDivElement;
  const progressText = document.querySelector(
    '#progressText',
  )! as HTMLDivElement;

  progressBar.style.width = percent + '%';
  progressText.innerText = percent + '%';

  if (percent >= 100) {
    const loaderContainer = document.querySelector(
      '.loader-container',
    )! as HTMLDivElement;
    const gameContainer = document.querySelector(
      '.gameContainer',
    )! as HTMLDivElement;
    const topnavContainer = document.querySelector(
      '.topnav-container',
    )! as HTMLDivElement;

    loaderContainer.style.display = 'none';
    gameContainer.classList.add('game-visible');
    topnavContainer.classList.add('game-visible');
  }
};
