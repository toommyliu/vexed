const combat = Object.freeze({
	attack: (monster) => {
		bot.addCommand(COMMANDS.COMBAT.ATTACK, monster);
	},
	kill: (monster) => {
		bot.addCommand(COMMANDS.COMBAT.KILL, monster);
	},
	rest: (full) => {
		bot.addCommand(COMMANDS.COMBAT.REST, full);
	},
	useSkill: (index, force) => {
		bot.addCommand(COMMANDS.COMBAT.USE_SKILL, index, force);
	},
	hasTarget: Player.hasTarget,
	allSkillsAvailable: Player.allSkillsAvailable,
	isSkillAvailable: Player.isSkillAvailable,
	getSkillCooldown: Player.getSkillCooldown,
	cancelAttack: Player.cancelAttack,
	cancelTarget: Player.cancelAttack,
});
