import { AsyncQueue } from '@sapphire/async-queue';
import { Bot } from '../api/Bot';
import type { Command } from './command';

type QueuedCommand = {
	args: unknown[];
	command: Command;
};

export class CommandQueue {
	private readonly queue: AsyncQueue;

	private commands: QueuedCommand[];

	private isRunning: boolean;

	private readonly interval: number;

	public constructor(options: { interval?: number } = {}) {
		this.queue = new AsyncQueue();
		this.commands = [];
		this.isRunning = false;
		this.interval = options.interval ?? 1_000;
	}

	public addCommand(command: Command, ...args: unknown[]) {
		this.commands.push({ command, args });
	}

	public get isEmpty() {
		return this.commands.length === 0;
	}

	public async start() {
		if (this.isRunning) return;
		this.isRunning = true;

		const bot = Bot.getInstance();
		if (!bot.player.isLoaded()) {
			logger.info('Waiting for player to load');
			await bot.waitUntil(() => bot.player.isLoaded(), null, -1);
			logger.info('Player loaded');
		}

		let index = 0;

		while (index < this.commands.length && this.isRunning) {
			await this.queue.wait();
			try {
				const queuedCommand = this.commands[index];
				if (queuedCommand) {
					const { command, args } = queuedCommand;
					const result = command.execute(...args);
					if (result instanceof Promise) {
						await result;
					}
				}

				await new Promise((resolve) => {
					setTimeout(resolve, this.interval);
				});
			} finally {
				this.queue.shift();
				++index;
			}
		}

		this.isRunning = false;
		logger.info('bot finished');
	}

	public async stop() {
		logger.info('bot stopping');
		this.isRunning = false;
		this.queue.abortAll();
		this.commands = [];
	}
}
