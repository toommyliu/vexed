module.exports = {
	id: COMMANDS.WORLD.JUMP,
	execute: async (bot, cell, pad) => {
		Player.jump(cell, pad ?? 'Spawn');
	},
};
