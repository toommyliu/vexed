import { ipcRenderer } from 'electron';
import { IPC_EVENTS } from '../../../common/ipc-events';
import { Bot } from '../lib/Bot';

const bot = Bot.getInstance();

ipcRenderer.on(IPC_EVENTS.FAST_TRAVEL, async (_ev, args: Args) => {
	if (!bot.player.isReady()) return;

	if (args?.map) {
		await bot.world.join(args.map, args?.cell, args?.pad).catch(() => {});
	}
});

type Args = {
	cell?: string;
	map: string;
	pad?: string;
	roomNumber: number;
};
