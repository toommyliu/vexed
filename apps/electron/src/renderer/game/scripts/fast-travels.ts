/**
 * @type {import('../botting/api/Bot')}
 */
const bot = Bot.getInstance();

window.addEventListener('message', async (ev) => {
	if (!ev.data.event.startsWith('tools:fasttravel')) {
		return;
	}

	const {
		data: { event, args },
	} = ev;

	const eventName = event.split(':')[2];

	switch (eventName) {
		case 'join':
			if (!bot.auth.loggedIn || bot.world.loading || !bot.player.loaded) {
				return;
			}

			await bot.world.join(
				`${args.map}-${args.roomNumber}`,
				args.cell ?? 'Enter',
				args.pad ?? 'Spawn',
				1,
			);
			ev.source.postMessage({
				event: 'tools:fasttravel:ready',
			});
			break;
	}
});
