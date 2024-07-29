const addGoldExp = require('./handlers/json/addGoldExp');
const ct = require('./handlers/json/ct');
const dropItem = require('./handlers/json/dropItem');

/**
 * @type {import('../botting/api/Bot')}
 */
const bot = Bot.getInstance();

async function packetFromServer([packet]) {
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
window.packetFromClient = async ([packet]) => {
	// TODO: fix
	/**
	 * @type {WindowProxy|null}
	 */
	// const wnd = window.windows.packets.logger;
	// if (wnd && !wnd.closed) {
	// 	wnd.postMessage({ event: 'logger:packet', args: packet });
	// }
};
