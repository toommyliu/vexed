module.exports = {
	id: COMMANDS.WORLD.JOIN,
	execute: async (bot, map, cell, pad) => {
		while (Player.state === PlayerState.InCombat) {
			Player.jump('Enter', 'Spawn');
			await bot.sleep(1000);
		}

		await bot.waitUntil(
			() => World.isActionAvailable(GameAction.Transfer),
			null,
			15,
		);

		Player.join(map, cell, pad);
		await bot.waitUntil(
			() => !World.loading && Player.map === map.split('-')[0],
			null,
			15,
		);
	},
};
