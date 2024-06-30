module.exports = {
	id: COMMANDS.UTIL.SLEEP,
	execute: async (bot, delay) => {
		await bot.sleep(delay);
	},
};
