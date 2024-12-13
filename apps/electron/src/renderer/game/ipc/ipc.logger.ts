import { IPC_EVENTS } from '../../../common/ipc-events';

let on = false;

const fn = (ev: MessageEvent, packet: string) => {
	if (!on) return;

	(ev.target as MessagePort).postMessage({
		event: IPC_EVENTS.PACKET_LOGGER_PACKET,
		args: { packet },
	});
};

export default async function handler(ev: MessageEvent) {
	const { event } = ev.data;

	if (event === IPC_EVENTS.PACKET_LOGGER_START) {
		on = true;
		bot.on('packetFromClient', (packet: string) => fn(ev, packet));
	} else if (event === IPC_EVENTS.PACKET_LOGGER_STOP) {
		on = false;
	}
}
