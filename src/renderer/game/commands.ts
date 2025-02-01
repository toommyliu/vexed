import { AsyncQueue } from '@sapphire/async-queue';
import { Bot } from './api/Bot';

const logWithTime = (message: string) => {
	window.logger.info(message);
};

export class CommandQueue {
	private readonly queue: AsyncQueue;

	private commands: (() => Promise<void>)[];

	private isRunning: boolean;

	private readonly interval: number;

	public constructor(options: { interval?: number } = {}) {
		this.queue = new AsyncQueue();
		this.commands = [];
		this.isRunning = false;
		this.interval = options.interval ?? 1_000;
	}

	public async enqueue(command: () => Promise<void>) {
		this.commands.push(command);
	}

	public get isEmpty() {
		return this.commands.length === 0;
	}

	public async start() {
		if (this.isRunning) return;
		this.isRunning = true;

		const bot = Bot.getInstance();
		if (!bot.player.isLoaded()) {
			window.logger.info('waiting for player to load');
			await bot.waitUntil(() => bot.player.isLoaded(), null, -1);
			window.logger.info('player loaded');
		}

		while (this.commands.length > 0) {
			await this.queue.wait();
			try {
				const command = this.commands.shift();
				if (command) {
					await command();
				}

				await new Promise((resolve) => {
					setTimeout(resolve, this.interval);
				});
			} finally {
				this.queue.shift();
			}
		}

		this.isRunning = false;
		logWithTime('finished!');
	}

	public async stop() {
		this.isRunning = false;
		this.queue.abortAll();
		this.commands = [];
	}
}

const _bot = Bot.getInstance();

const queue = new CommandQueue({ interval: 1_000 });

const auth = {
	login: (username: string, password: string) => {
		void queue.enqueue(async () => {
			logWithTime(`logging in with ${username}:${password}`);
		});
	},
	logout: () => {
		void queue.enqueue(async () => {
			logWithTime('logging out');
		});
	},
};

const combat = {
	attack: () => {
		void queue.enqueue(async () => {
			logWithTime('attacking');
		});
	},
	kill: (mon: string) => {
		void queue.enqueue(async () => {
			logWithTime(`killing ${mon}`);
			await _bot.combat.kill(mon);
			logWithTime(`killed ${mon}`);
		});
	},
};

const world = {
	join(mapName: string, cell = 'Enter', pad = 'Spawn') {
		void queue.enqueue(async () => {
			logWithTime(`joining ${mapName}`);
			await _bot.world.join(mapName, cell, pad);
			logWithTime(`joined ${mapName}`);
		});
	},
};

const bot = {
	start: () => {
		if (queue.isEmpty) {
			logWithTime('queue is empty');
			return;
		}

		logWithTime('start');
		void queue.start();
	},
	stop: () => {
		void queue.enqueue(async () => {
			void queue.stop();
			logWithTime('stop');
		});
	},
	log: (msg: string) => {
		void queue.enqueue(async () => {
			logWithTime(msg);
		});
	},
	sleep: (ms: number) => {
		void queue.enqueue(async () => {
			bot.log(`sleeping for ${ms}ms`);
			await _bot.sleep(ms);
		});
	},
};

declare global {
	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
	interface Window {
		auth: typeof auth;
		bot: typeof bot;
		combat: typeof combat;
		world: typeof world;
	}
}

window.auth = auth;
window.combat = combat;
window.bot = bot;
window.world = world;
