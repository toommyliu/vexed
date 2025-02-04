import { AsyncQueue } from '@sapphire/async-queue';
import { Bot } from '../api/Bot';
import type { Command } from './command';
import { LabelCommand } from './misc';

export class CommandExecutor {
	private readonly queue: AsyncQueue;

	private commands: Command[];

	private delay: number;

	public readonly labels: Map<string, number>;

	private _index: number;

	private ac: AbortController | null = null;

	public constructor(options: { delay?: number } = {}) {
		this.queue = new AsyncQueue();
		this.commands = [];
		this.delay = options.delay ?? 1_000;
		this.labels = new Map();
		this._index = 0;
	}

	public get index() {
		return this._index;
	}

	public set index(index: number) {
		this._index = index;
	}

	public setDelay(delay: number) {
		this.delay = delay;
	}

	public addCommand(command: Command) {
		this.commands.push(command);
	}

	public get isEmpty() {
		return this.commands.length === 0;
	}

	public isRunning() {
		return this.ac !== null && !this.ac.signal.aborted;
	}

	public async start() {
		this._index = 0;
		this.ac = new AbortController();

		for (const [index, cmd] of this.commands
			.filter(
				(cmd) => cmd.id === 'misc:label' && cmd instanceof LabelCommand,
			)
			.entries()) {
			const label = (cmd as LabelCommand).label;

			if (this.labels.has(label)) {
				logger.warn(`label "${label}" already exists, overriding...`);
			}

			this.labels.set(label, index);
		}

		const bot = Bot.getInstance();
		if (!bot.player.isLoaded()) {
			logger.info('waiting for load');
			await bot.waitUntil(() => bot.player.isLoaded(), null, -1);
			logger.info('player loaded');
		}

		while (this._index < this.commands.length && this.isRunning) {
			if (this.ac.signal.aborted) break;

			await this.queue.wait();

			if (this.ac.signal.aborted) break;

			try {
				const command = this.commands[this._index];
				if (!command) {
					break;
				}

				logger.info(
					`${command.toString()}(${this._index + 1}/${this.commands.length})`,
				);

				if (this.ac.signal.aborted) break;

				const result = command.execute();
				if (result instanceof Promise) {
					await result;
				}

				if (this.ac.signal.aborted) break;

				await new Promise((resolve) => {
					setTimeout(resolve, this.delay);
				});

				if (this.ac.signal.aborted) break;
			} finally {
				this.queue.shift();
			}

			if (!this.ac.signal.aborted) ++this._index;
		}

		logger.info('bot finished');
		this.ac.abort();
		this.ac = null;
	}

	public async stop() {
		logger.info('bot stopping');
		this._stop();
	}

	private _stop() {
		this.queue.abortAll();
		this.commands = [];
		this.labels.clear();
		this._index = 0;
		this.ac?.abort();
	}
}
