import { ipcRenderer } from 'electron/renderer';
import { IPC_EVENTS } from '../../common/ipc-events';
import { addGoldExp } from './handlers/json/addGoldExp';
import { ct } from './handlers/json/ct';
import { dropItem } from './handlers/json/dropItem';

const { auth, player } = bot;

window.packetFromServer = async ([packet]: [string]) => {
	bot.emit('packetFromServer', packet);

	const isXT = packet.startsWith('%xt%');
	const isJSON = packet.startsWith('{');

	if (isXT) {
		const args = packet.split('%');
		const cmd = args[2];
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
		document.querySelector('#cells') as HTMLSelectElement,
		document.querySelector('#pads') as HTMLSelectElement,
		document.querySelector('#x') as HTMLButtonElement,
		document.querySelector('#bank') as HTMLButtonElement,
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

window.progress = async ([percentage]: [number]) => {
	if (
		percentage === 100 &&
		window?.account?.username &&
		window?.account?.password
	) {
		await bot.sleep(1_000);
		auth.login(window.account.username, window.account.password);
		if (window.account.server) {
			await bot.waitUntil(() => auth.servers.length > 0);
			auth.connectTo(window.account.server);
			await bot.waitUntil(() => player.isReady());
			ipcRenderer.send(IPC_EVENTS.LOGIN_SUCCESS, window.account.username);
		}

		delete window.account;
	}
};
