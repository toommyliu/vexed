import { IPC_EVENTS } from '../../../common/ipc-events';

let cb: ((packet: string) => void) | null;

const onClientPacket = (ev: MessageEvent, packet: string) => {
	(ev.target as MessagePort).postMessage({
		event: IPC_EVENTS.PACKET_LOGGER_PACKET,
		args: { packet },
	});
};

export default async function handler(ev: MessageEvent) {
	const { event } = ev.data;

	if (event === IPC_EVENTS.PACKET_LOGGER_START) {
		cb = (packet: string) => onClientPacket(ev, packet);
		bot.on('packetFromClient', cb);
	} else if (event === IPC_EVENTS.PACKET_LOGGER_STOP) {
		bot.off('packetFromClient', cb!);
		cb = null;
	}
}
