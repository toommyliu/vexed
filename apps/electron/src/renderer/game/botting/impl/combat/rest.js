module.exports = {
	id: COMMANDS.COMBAT.REST,
	execute: async (bot, full) => {
		await bot.waitUntil(() => World.isActionAvailable(GameAction.Rest));

		while (Player.state === PlayerState.InCombat) {
			Player.jump(Player.cell, Player.pad);
			await bot.sleep(1000);
		}

		Player.rest();

		if (full) {
			bot.pause();
			await bot.waitUntil(() => Player.hp >= Player.maxHP && Player.mp >= Player.maxMP, null, -1);
			bot.resume();
		}
	},
};
