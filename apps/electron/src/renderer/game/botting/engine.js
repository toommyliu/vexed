var { AsyncQueue } = require('@sapphire/async-queue');
var { TimerManager } = require('@sapphire/timer-manager');

class BotEngine {
	#queue = new AsyncQueue();
	#timer = null;
	#index = 0;
	#commands = [];
	pause = false;
	on = false;

	constructor() {
		this.#commands = [
			// {
			// 	type: COMMANDS.WORLD.JOIN,
			// 	args: ['ledgermayne-100000'],
			// },
			// {
			// 	type: COMMANDS.WORLD.MOVE_TO_CELL,
			// 	args: ['r2', 'Right'],
			// },
			// {
			// 	type: COMMANDS.WORLD.JOIN,
			// 	args: ['escherion-100000'],
			// },
			// {
			// 	type: COMMANDS.WORLD.MOVE_TO_CELL,
			// 	args: ['Boss', 'Left'],
			// },
			// {
			// 	type: COMMANDS.WORLD.JOIN,
			// 	args: ['yulgar-100000'],
			// },
			{
				type: COMMANDS.WORLD.JOIN,
				args: ['battleontown-100000'],
			},
			{
				type: COMMANDS.COMBAT.KILL,
				args: ['frogzard'],
			},
			{
				type: COMMANDS.WORLD.JOIN,
				args: ['lair-100000'],
			},
		];
	}

	start() {
		if (this.on) {
			console.log('on');
			return;
		}
		this.on = true;
		this.#index = 0;
		this.addTimer();
		console.log('[bot]', this.#commands);
	}

	addTimer() {
		if (!this.on) {
			return console.log('ret');
		}
		this.#timer = TimerManager.setTimeout(async () => {
			if (this.pause) {
				return;
			}
			if (this.on) {
				console.log('tick');
			}
			if (this.#index >= this.#commands.length) {
				console.log('[bot]stop');
				this.stop();
				return;
			}

			await this.#queue.wait();

			const cmd = this.#commands[this.#index];
			console.log(new Date(), `[bot]cmd:${cmd.type}`, cmd.args);

			const prefix = cmd.type.split(':')[0];
			let fn;

			switch (prefix) {
				case 'combat':
					fn = this.#handleCombatCommand;
					break;
				case 'world':
					fn = this.#handleWorldCommand;
					break;
			}

			await fn.call(this, cmd).then(() => {
				this.#index++;
				this.#queue.shift();
				TimerManager.clearTimeout(this.#timer);
				this.addTimer();
			});
		}, 1000);
	}

	stop() {
		this.#index = 0;
		// this.#commands = [];
		TimerManager.clearTimeout(this.#timer);
		this.#timer = null;
		this.pause = false;
		this.on = false;
		this.#queue.abortAll();
	}

	async #handleCombatCommand(cmd) {
		switch (cmd.type) {
			case COMMANDS.COMBAT.KILL:
				console.log('hi');
				let i = 1;
				// don't let the next command run
				this.pause = true;
				let once = false;
				const queue = new AsyncQueue();
				const timer = TimerManager.setInterval(async () => {
					await queue.wait();
					if (!combat.hasTarget()) {
						combat.attack(cmd.args[0]);
					}
					if (combat.hasTarget()) {
						swf.UseSkill(i++);
						if (i > 4) {
							i = 1;
						}
					}
					if (
						swf.IsMonsterAvailable(cmd.args[0]) === '"False"' &&
						!combat.hasTarget() &&
						!once
					) {
						once = true;
						console.log(new Date(), 'waiting');
						const timer_ = TimerManager.setTimeout(() => {
							//continue to next command
							this.pause = false;
							// re-queue the main 'thread'
							this.addTimer();
							TimerManager.clearInterval(timer);
							TimerManager.clearTimeout(timer_);
							console.log(new Date(), 'pause=false');
						}, 1000);
					}

					queue.shift();
				}, 150);
				break;
		}
	}
	async #handleWorldCommand(cmd) {
		switch (cmd.type) {
			case COMMANDS.WORLD.JOIN:
				await bot.waitUntil(
					() => world.isActionAvailable(GameAction.Transfer),
					null,
					-1,
				);
				swf.Join(cmd.args[0]);
				await bot.waitUntil(
					() => world.name === cmd.args[0].split('-')[0],
					null,
					-1,
				);
				break;
			case COMMANDS.WORLD.MOVE_TO_CELL:
				swf.Jump(cmd.args[0], cmd.args[1] ?? 'Spawn');
				await bot.waitUntil(
					() => player.cell === cmd.args[0],
					null,
					-1,
				);
				break;
		}
	}
}

var botEngine = new BotEngine();
