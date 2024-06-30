var { AsyncQueue } = require('@sapphire/async-queue');
var { TimerManager } = require('@sapphire/timer-manager');

module.exports = {
	id: COMMANDS.COMBAT.KILL,
	execute: async (bot, name) => {
		// TODO: counter attack

		bot.pause();

		let once = false;
		let i = 1;

		const queue = new AsyncQueue();
		const ac = new AbortController();

		const timer = TimerManager.setInterval(async () => {
			await queue.wait({ signal: ac.signal });

			if (!Player.hasTarget() && !once) {
				if (World.isMonsterAvailable(name)) {
					Player.attack(name);
					once = true;
				}
			}

			Player.useSkill(i++);
			if (i > 4) {
				i = 1;
			}

			queue.shift();
		}, 150);

		const timer2 = TimerManager.setInterval(() => {
			if (!once) {
				return;
			}

			if (!Player.hasTarget()) {
				ac.abort();
				TimerManager.clearInterval(timer);

				bot.resume();
				bot.addTimer();

				TimerManager.clearInterval(timer2);
			}
		});
	},
};
