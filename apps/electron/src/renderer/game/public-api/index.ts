import { Bot } from '../api/Bot';
import { CommandQueue } from '../command-queue';
import { logger } from '../../../common/logger';

const logWithTime = (message: string) => {
	logger.info(message);
};

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
