import { IPC_EVENTS } from '../../../common/ipc-events';
import { Bot } from '../lib/Bot';

const bot = Bot.getInstance();

let on = false;
let hasListener = false;

const fn = (ev: MessageEvent, packet: string) => {
	if (!on) return;

	(ev.target as MessagePort).postMessage({
		event: IPC_EVENTS.PACKET_LOGGER_PACKET,
		args: { packet },
	});
};

export default async function handler(ev: MessageEvent) {
	const { event } = ev.data;

	if (event === IPC_EVENTS.PACKET_LOGGER_START && !hasListener) {
		on = true;
		hasListener = true;
		bot.on('packetFromClient', (packet) => fn(ev, packet));
	} else if (event === IPC_EVENTS.PACKET_LOGGER_STOP) {
		on = false;
	}
}
