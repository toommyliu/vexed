module.exports = {
	id: COMMANDS.WORLD.MOVE_TO_CELL,
	execute: async (bot, cell, pad) => {
		swf.Jump(cell, pad ?? 'Spawn');
	},
};
