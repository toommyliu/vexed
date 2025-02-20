import { Mutex } from 'async-mutex';
import { IPC_EVENTS } from '../../../common/ipc-events';
import { Bot } from '../lib/Bot';
import { type SetIntervalAsyncTimer } from '../lib/util/TimerManager';

const mutex = new Mutex();
let intervalId: SetIntervalAsyncTimer | null = null;
let index = 0;

const bot = Bot.getInstance();

function stopInterval() {
	if (intervalId) {
		const tmp = intervalId;
		void bot.timerManager.clearInterval(tmp);
		intervalId = null;
		index = 0;
	}
}

export default async function handler(ev: MessageEvent) {
	if (ev.data.event === IPC_EVENTS.PACKET_SPAMMER_START) {
		stopInterval();

		const { args } = ev.data;

		// test packets: %xt%zm%cmd%1%tfer%me%yulgar%
		// %xt%zm%moveToCell%my_id%Enter%Spawn%

		intervalId = bot.timerManager.setInterval(async () => {
			if (!bot.player.isReady()) return;

			await mutex.runExclusive(() => {
				bot.packets.sendServer(args.packets[index]);
				index = (index + 1) % args.packets.length;
			});
		}, args.delay ?? 1_000);
	} else if (ev.data.event === IPC_EVENTS.PACKET_SPAMMER_STOP) {
		stopInterval();
	}
}
