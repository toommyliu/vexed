import addGoldExp from './json/addGoldExp';
import ct from './json/ct';
import dropItem from './json/dropItem';

async function packetFromServer([packet]: [string]) {
	bot.emit('packetFromServer', packet);

	const isXT = packet.startsWith('%xt%');
	const isJSON = packet.startsWith('{');

	if (isXT) {
		const args = packet.split('%');
		const cmd = args[2];
		switch (cmd) {
			case 'respawnMon':
				//%xt%respawnMon%-1%6%
				break;
			case 'exitArea':
				const playerName = args[5];
				bot.emit('playerLeave', playerName);
				break;
			case 'uotls':
				break;
			default:
				// console.log(packet);
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
				await ct(bot, pkt);
				break;
			case 'dropItem':
				await dropItem(bot, pkt);
				break;
		}
	}
}

window.packetFromServer = packetFromServer;
window.packetFromClient = async ([packet]: [string]) => {
	bot.emit('packetFromClient', packet);

	/**
	 * @type {WindowProxy|null}
	 */
	const wnd = window.windows.packets.logger;
	if (wnd) {
		wnd.postMessage({ event: 'logger:packet', args: packet });
	}
};

window.connection = ([state]: [string]) => {
	const $cells = document.querySelector('#cells')!;
	const $pads = document.querySelector('#pads')!;
	const $x = document.querySelector('#x')!;
	const $bank = document.querySelector('#bank')!;

	switch (state) {
		case 'OnConnectionLost':
			$cells.setAttribute('disabled', '');
			$pads.setAttribute('disabled', '');
			$x.setAttribute('disabled', '');
			$bank.setAttribute('disabled', '');
			bot.emit('logout');
			break;
		case 'OnConnection':
			$cells.removeAttribute('disabled');
			$pads.removeAttribute('disabled');
			$x.removeAttribute('disabled');
			$bank.removeAttribute('disabled');
			bot.emit('login');
			break;
	}
};
