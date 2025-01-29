import { IPC_EVENTS } from '../../../common/ipc-events';
import { Bot } from '../api/Bot';

const bot = Bot.getInstance();

let listener: ((packet: string) => void) | null = null;

const fn = (ev: MessageEvent, packet: string) => {
	(ev.target as MessagePort).postMessage({
		event: IPC_EVENTS.PACKET_LOGGER_PACKET,
		args: { packet },
	});
};

export default async function handler(ev: MessageEvent) {
	const { event } = ev.data;

	if (event === IPC_EVENTS.PACKET_LOGGER_START) {
		listener = (packet: string) => fn(ev, packet);
		bot.on('packetFromClient', listener);
	} else if (event === IPC_EVENTS.PACKET_LOGGER_STOP) {
		bot.off('packetFromClient', listener!);
		listener = null;
	}
}
