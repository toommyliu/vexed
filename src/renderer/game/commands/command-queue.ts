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

	private _isRunning: boolean;

	private delay: number;

	public constructor(options: { delay?: number } = {}) {
		this.queue = new AsyncQueue();
		this.commands = [];
		this._isRunning = false;
		this.delay = options.delay ?? 1_000;
	}

	public setDelay(delay: number) {
		this.delay = delay;
	}

	public addCommand(command: Command, ...args: unknown[]) {
		this.commands.push({ command, args });
	}

	public get isEmpty() {
		return this.commands.length === 0;
	}

	public get isRunning() {
		return this._isRunning;
	}

	public async start() {
		if (this._isRunning) return;
		this._isRunning = true;

		const bot = Bot.getInstance();
		if (!bot.player.isLoaded()) {
			logger.info('waiting for load');
			await bot.waitUntil(() => bot.player.isLoaded(), null, -1);
			logger.info('player loaded');
		}

		let index = 0;

		while (index < this.commands.length && this._isRunning) {
			await this.queue.wait();
			try {
				const queuedCommand = this.commands[index];
				if (!queuedCommand) {
					break;
				}

				const { command, args } = queuedCommand;

				logger.info(
					`${command.id}${args.length > 1 ? args.join(', ') : ''} (${index + 1}/${this.commands.length})`,
				);

				const result = command.execute(...args);
				if (result instanceof Promise) {
					await result;
				}

				await new Promise((resolve) => {
					setTimeout(resolve, this.delay);
				});
			} finally {
				this.queue.shift();
				++index;
			}
		}

		this._isRunning = false;
		logger.info('bot finished');
	}

	public async stop() {
		logger.info('bot stopping');
		this._isRunning = false;
		this.queue.abortAll();
		this.commands = [];
	}
}
