module.exports = {
	id: COMMANDS.COMBAT.USE_SKILL,
	execute: (bot, index, force) => {
        Player.useSkill(index, force);
	},
};
