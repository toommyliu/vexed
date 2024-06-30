const world = Object.freeze({
	join: (map, cell, pad) => {
		bot.addCommand(COMMANDS.WORLD.JOIN, map, cell, pad);
	},
	jump: (cell, pad) => {
		bot.addCommand(COMMANDS.WORLD.JUMP, cell, pad);
	},
});
