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
			if (!bot.player.isReady()) {
				return;
			}

			await bot.world.join(
				`${args.map}-${args.roomNumber}`,
				args.cell ?? 'Enter',
				args.pad ?? 'Spawn',
				1,
			);
			ev.source!.postMessage(
				{
					event: 'tools:fasttravel:ready',
				},
				{ targetOrigin: '*' },
			);
			break;
	}
});
