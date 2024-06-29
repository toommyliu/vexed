module.exports = {
	id: COMMANDS.WORLD.MOVE_TO_CELL,
	execute: async (botEngine, cell, pad) => {
		swf.Jump(cell, pad ?? 'Spawn');
	},
};
