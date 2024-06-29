var { AsyncQueue } = require('@sapphire/async-queue');
var { TimerManager } = require('@sapphire/timer-manager');

module.exports = {
	id: COMMANDS.COMBAT.KILL,
	execute: (botEngine, name) => {
		let i = 1;
		// don't let the next command run
		botEngine.pause = true;
		let once = false;
		const queue = new AsyncQueue();
		const timer = TimerManager.setInterval(async () => {
			await queue.wait();
			if (!combat.hasTarget()) {
				combat.attack(name);
			}
			if (combat.hasTarget()) {
				swf.UseSkill(i++);
				if (i > 4) {
					i = 1;
				}
			}
			if (
				swf.IsMonsterAvailable(name) === '"False"' &&
				!combat.hasTarget() &&
				!once
			) {
				once = true;
				console.log(new Date(), 'waiting');
				const timer_ = TimerManager.setTimeout(() => {
					//continue to next command
					botEngine.pause = false;
					// re-queue the main 'thread'
					botEngine.addTimer();
					TimerManager.clearInterval(timer);
					TimerManager.clearTimeout(timer_);
					console.log(new Date(), 'pause=false');
					combat.cancelAttack();
					combat.cancelTarget();
				}, 1000);
			}

			queue.shift();
		}, 150);
	},
};
