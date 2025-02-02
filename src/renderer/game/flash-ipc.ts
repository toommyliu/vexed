import { ipcRenderer } from 'electron';
import { IPC_EVENTS } from '../../common/ipc-events';
import { Bot } from './api/Bot';
import { addGoldExp } from './handlers/json/addGoldExp';
import { ct } from './handlers/json/ct';
import { dropItem } from './handlers/json/dropItem';

const bot = Bot.getInstance();
const { auth, player } = bot;

window.packetFromServer = async ([packet]: [string]) => {
	bot.emit('packetFromServer', packet);

	const isXT = packet.startsWith('%xt%');
	const isJSON = packet.startsWith('{');

	if (isXT) {
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

	if (isJSON) {
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
	if (window?.account?.username && window?.account?.password) {
		console.log('Logging in with:', window.account.username);

		await bot.sleep(1_000);
		auth.login(window.account.username, window.account.password);
		if (window.account.server) {
			await bot.waitUntil(() => auth.servers.length > 0);

			auth.connectTo(window.account.server);
			await bot.waitUntil(() => player.isReady());

			// Let the manager know we're logged in and ready
			ipcRenderer.send(IPC_EVENTS.LOGIN_SUCCESS, window.account.username);
		}

		delete window.account;
	}
};

ipcRenderer.on(IPC_EVENTS.LOGIN, async (_, account) => {
	console.log('Got an account to login with, setting that now.');
	window.account = account;
});
