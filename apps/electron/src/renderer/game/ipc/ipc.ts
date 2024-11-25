import { Mutex } from 'async-mutex';
import { ipcRenderer } from 'electron/renderer';
import { IPC_EVENTS } from '../../../common/ipc-events';

const { player, world } = bot;
const mutex = new Mutex();

ipcRenderer.on(IPC_EVENTS.FAST_TRAVEL, async (_, location) => {
	await mutex.runExclusive(async () => {
		if (!player.isReady()) {
			return;
		}

		const { map, cell, pad, roomNumber } = location;

		await world.join(`${map}-${roomNumber}`, cell, pad);
	});
});
