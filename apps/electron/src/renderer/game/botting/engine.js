var { AsyncQueue } = require('@sapphire/async-queue');
var { TimerManager } = require('@sapphire/timer-manager');

class BotEngine {
	#queue = new AsyncQueue();
	#timer = null;
	#index = 0;
	#commands = [];
	#combatTimer = null;
	pause=false;

	constructor() {
		this.#commands = [
			{
				type: COMMANDS.WORLD.JOIN,
				args: ['ledgermayne-100000'],
			},
			{
				type: COMMANDS.WORLD.MOVE_TO_CELL,
				args: ['r2', 'Right'],
			},
			{
				type: COMMANDS.WORLD.JOIN,
				args: ['escherion-100000'],
			},
			{
				type: COMMANDS.WORLD.MOVE_TO_CELL,
				args: ['Boss', 'Left'],
			},
			{
				type: COMMANDS.WORLD.JOIN,
				args: ['yulgar-100000'],
			},
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
			}
		];
	}

	start() {
		this.#index = 0;
		this.addTimer();
	}

	addTimer() {
		this.#timer = TimerManager.setTimeout(async () => {
			if(this.pause){
				return;
			}
			await this.#queue.wait();

			if (this.#index >= this.#commands.length) {
				console.log('[bot]stop');
				this.stop();
				return;
			}

			const cmd = this.#commands[this.#index];
			console.log(new Date(), `[bot]cmd:${cmd.type}`, cmd.args);

			await this.#handleCommand(cmd);

			this.#index++;
			this.#queue.shift();
			TimerManager.clearTimeout(this.#timer);
			this.addTimer();
		}, 1000);
	}

	stop() {
		this.#index = 0;
		// this.#commands = [];
		TimerManager.clearTimeout(this.#timer);
		this.#timer = null;
		this.pause=false;
	}

	async #handleCommand(cmd) {
		switch (cmd.type) {
			case COMMANDS.COMBAT.KILL:
				let i = 1;
				console.log('start');
				this.pause=true;
				const queue=new AsyncQueue();
				this.#combatTimer = TimerManager.setInterval(async()=>{
					console.log('[combattimer] tick');
					await queue.wait();
					if(!combat.hasTarget()){
						combat.attack(cmd.args[0]);
					}
					swf.UseSkill(i++);
					if (i > 4) {
						i = 1;
					}
					if(swf.IsMonsterAvailable(cmd.args[0]) === '"False"'&&!combat.hasTarget()){
						console.log('continue');
						this.pause=false;
						this.addTimer();
						TimerManager.clearInterval(this.#combatTimer);
						this.#combatTimer = null;
					}
					await queue.shift();
				},150);
				break;
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
