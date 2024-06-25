var { Mutex } = require('async-mutex');

class BotEngine {
	#ac = null;
	#index = 0;

	#mutex = new Mutex();

	constructor() {
		super();

		this.commands = [];
		this.restartOnFinish = false;
	}

	get active() {
		return this.#ac && !this.#ac.signal.aborted;
	}

	async start() {
		if (this.#ac || this.active) {
			throw new Error('cant do that...');
		}

		this.#ac = new AbortController();

		console.log('bot engine started.');
		console.log(`running '${this.commands.length}' commands.`)

		while (this.active) {
			await this.#mutex.runExclusive(async () => {
				const cmd = this.commands[this.#index];

                console.log(new Date(), `executing command #${this.#index + 1}: ${cmd.id}`);

                const retval = cmd.execute(this);
                if (retval instanceof Promise) {
                    await retval;
                }

                this.#index++;

                if (this.#index >= this.commands.length) {
                    console.log('calling stop');
                    this.stop();
                    return;
                }

				await new Promise((r) => setTimeout(r, 1000));
			});
		}

		console.log('bot engine done.');
	}

	stop() {
		if (!this.active) {
			throw new Error('commands runner is not on');
		}

		this.commands = [];
		this.#index = 0;
		this.#ac.abort();
		this.#ac = null;

		console.log('stopped');
	}
}

class BotCommand {
	id;

	execute() {
		throw new Error(`${this.id} is not implemented yet`);
	}
}

class KillCommand extends BotCommand {
	id = 'combat:kill';
	name = 'Frogzard';
	#index = 1;
	#ac = new AbortController();

	async execute() {
		const bot = Bot.getInstance();
		const name = this.name;

		await bot.waitUntil(() => bot.world.isMonsterAvailable(name), null, -1);

		combat.attack(name);

		const intervalID = setInterval(() => {
			if (!combat.hasTarget()) {
				this.#ac.abort();
				console.log('stop = true');
				clearInterval(intervalID);
			}
		}, 0);

		while (!this.#ac.signal.aborted) {
			if (!combat.hasTarget()) {
				combat.attack(name);
			}

			combat.useSkill(this.#index++);
			if (this.#index >= 4) {
				this.#index = 1;
			}

			await bot.sleep(150);
		}

		combat.cancelAttack();
		combat.cancelTarget();

		console.log('kill finished');
	}
}

class DummyCommand extends BotCommand {
	id = 'util:dummy';

	execute() {
		console.log('hello from dummy');
	}
}

const botEngine = new BotEngine();
