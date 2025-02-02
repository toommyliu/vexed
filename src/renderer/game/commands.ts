import { Bot } from './api/Bot';
import { LoginCommand, LogoutCommand } from './commands/auth';
import { StopCommand } from './commands/bot';
import { KillCommand } from './commands/combat';
import { CommandQueue } from './commands/command-queue';
import { JoinCommand } from './commands/world';

const _bot = Bot.getInstance();

const queue = new CommandQueue({ interval: 1_000 });
// @ts-expect-error don't care
_bot.queue = queue;

const auth = {
	login: (username: string, password: string) => {
		queue.addCommand(new LoginCommand(), username, password);
	},
	logout: () => {
		queue.addCommand(new LogoutCommand());
	},
};

const combat = {
	kill: (monster: string) => {
		queue.addCommand(new KillCommand(), monster);
	},
};

const world = {
	join(mapName: string, cell = 'Enter', pad = 'Spawn') {
		queue.addCommand(new JoinCommand(), mapName, cell, pad);
	},
};

const bot = {
	start: () => {
		if (queue.isEmpty) {
			logger.error('queue is empty');
			return;
		}

		logger.info('bot started');
		void queue.start();
	},
	stop: () => {
		queue.addCommand(new StopCommand());
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
