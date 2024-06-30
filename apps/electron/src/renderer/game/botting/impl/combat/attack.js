module.exports = {
	id: COMMANDS.COMBAT.ATTACK,
	execute: (bot, name) => {
		if (World.isMonsterAvailable(name)) {
			Player.attack(name);
		}
	},
};
