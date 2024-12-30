import { IPC_EVENTS } from '../../../common/ipc-events';

const { world } = bot;

export default async function handler(ev: MessageEvent) {
	if (ev.data.event === IPC_EVENTS.FAST_TRAVEL) {
		const { args } = ev.data;

		if (!bot.player.isReady()) {
			return;
		}

		if (args?.map) {
			const cell = args?.cell ?? 'Enter';
			const pad = args?.pad ?? 'Spawn';
			const roomNumber = args?.roomNumber ?? 100_000;

			await world.join(`${args?.map}-${roomNumber}`, cell, pad);
		}
	}
}
