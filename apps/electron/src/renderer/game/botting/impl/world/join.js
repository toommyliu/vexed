module.exports = {
	id: COMMANDS.WORLD.JOIN,
	execute: async (botEngine, map) => {
		await bot.waitUntil(
			() => world.isActionAvailable(GameAction.Transfer),
			null,
			-1,
		);
		swf.Join(map);
		await bot.waitUntil(() => world.name === map.split('-')[0], null, -1);
	},
};
