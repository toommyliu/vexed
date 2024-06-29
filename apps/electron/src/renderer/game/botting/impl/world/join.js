module.exports = {
	id: COMMANDS.WORLD.JOIN,
	execute: async (bot, map) => {
		await bot.waitUntil(
			() => swf.IsActionAvailable('tfer') === '"True"',
			null,
			-1,
		);
		swf.Join(map);
		await bot.waitUntil(() => JSON.parse(swf.Map()) === map.split('-')[0], null, -1);
	},
};
