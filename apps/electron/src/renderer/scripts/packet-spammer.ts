import type { SetIntervalAsyncTimer } from '../api/util/TimerManager';

let timer: SetIntervalAsyncTimer<unknown[]> | null = null;
let index = 0;

window.addEventListener('message', async (ev) => {
	if (!ev.data.event.startsWith('packets:spammer')) {
		return;
	}

	const {
		data: { event, args },
	} = ev;

	const eventName = event.split(':')[2];

	if (eventName === 'on') {
		if (timer) {
			await bot.timerManager.clearInterval(timer);
			timer = null;
			await bot.sleep(1000);
		}

		if (args.packets[0] === '') {
			return;
		}

		timer = bot.timerManager.setInterval(
			async () => {
				if (
					!bot.auth.loggedIn ||
					bot.world.loading ||
					!bot.player.loaded
				) {
					return;
				}

				bot.packets.sendServer(args.packets[index]);
				index = (index + 1) % args.packets.length;
			},
			Number.parseInt(args.delay) ?? 1000,
		);
	} else if (eventName === 'off') {
		if (timer) {
			await bot.timerManager.clearInterval(timer);
			timer = null;
			index = 0;
		}
	}
});
