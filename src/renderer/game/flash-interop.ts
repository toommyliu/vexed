import process from 'process';
import { ipcRenderer } from '../../common/ipc';
import { IPC_EVENTS } from '../../common/ipc-events';
import { Logger } from '../../common/logger';
import { Bot } from './lib/Bot';
import { addGoldExp } from './networking/json/add-gold-exp';
import { ct } from './networking/json/ct';
import { dropItem } from './networking/json/drop-item';

const logger = Logger.get('FlashInterop');
const bot = Bot.getInstance();

window.packetFromServer = async ([packet]: [string]) => {
  bot.emit('packetFromServer', packet);

  if (packet.startsWith('%xt%')) {
    const args = packet.split('%');
    const cmd = args[2];

    if (!cmd) return;

    switch (cmd) {
      case 'respawnMon':
        break;

      case 'exitArea': {
        const playerName = args[5];
        bot.emit('playerLeave', playerName);
        break;
      }

      default:
        break;
    }
  }

  if (packet.startsWith('{')) {
    try {
      const pkt = JSON.parse(packet);
      const cmd = pkt.b.o.cmd;

      switch (cmd) {
        case 'addGoldExp':
          await addGoldExp(bot, pkt);
          break;
        case 'ct':
          ct(bot, pkt);
          break;
        case 'dropItem':
          dropItem(bot, pkt);
          break;
      }
    } catch (error) {
      // this threw once and i cant repro
      logger.error(
        `Failed to parse JSON packet:\nOriginal packet: ${packet}\nError: ${error}`,
      );
    }
  }
};

window.packetFromClient = async ([packet]: [string]) => {
  bot.emit('packetFromClient', packet);
};

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

    // ipcRenderer.send(IPC_EVENTS.LOGIN_SUCCESS, user);
  }
};

window.flashDebug = (...args: string[]) => {
  logger.info(...args);
};
