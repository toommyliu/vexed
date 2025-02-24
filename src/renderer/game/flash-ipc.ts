import process from 'process';
import { ipcRenderer } from 'electron';
import { IPC_EVENTS } from '../../common/ipc-events';
import { Bot } from './lib/Bot';
import { addGoldExp } from './networking/json/add-gold-exp';
import { ct } from './networking/json/ct';
import { dropItem } from './networking/json/drop-item';

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
	const username = process.argv.find((arg) => arg.startsWith('--username='));
	const password = process.argv.find((arg) => arg.startsWith('--password='));
	const server = process.argv.find((arg) => arg.startsWith('--server='));

	if (username && password) {
		const [, user] = username.split('=');
		const [, pass] = password.split('=');
		const [, serv] = server?.split('=') ?? '';

		logger.info(
			`logging in with ${user}:${pass}${serv ? ` to ${serv}` : ''}`,
		);

		await bot.sleep(1_000);
		auth.login(user!, pass!);

		await bot.waitUntil(
			() => bot.flash.get('mcLogin.currentLabel', true) === 'Servers',
			null,
			-1,
		);
		await bot.sleep(500);

		if (serv) {
			bot.auth.connectTo(serv!);
			await bot.waitUntil(() => player.isReady());
		}

		ipcRenderer.send(IPC_EVENTS.LOGIN_SUCCESS, user);
	}
};

// @ts-expect-error don't care
window.debug = console.log;
