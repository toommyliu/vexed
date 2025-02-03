import { AsyncQueue } from '@sapphire/async-queue';
import { Bot } from '../api/Bot';
import type { Command } from './command';
import { LabelCommand, type GotoLabelCommand } from './misc';

export class CommandExecutor {
	private readonly queue: AsyncQueue;

	private commands: Command[];

	private _isRunning: boolean;

	private delay: number;

	public readonly labels: Map<string, number>;

	private _index: number;

	public constructor(options: { delay?: number } = {}) {
		this.queue = new AsyncQueue();
		this.commands = [];
		this._isRunning = false;
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

	public get isRunning() {
		return this._isRunning;
	}

	public async start() {
		if (this._isRunning) return;
		this._isRunning = true;
		this._index = 0;

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

		while (this._index < this.commands.length && this._isRunning) {
			await this.queue.wait();
			try {
				const queuedCommand = this.commands[this._index];
				if (!queuedCommand) {
					break;
				}

				const command = queuedCommand;

				logger.info(
					`${command.toString()} (${this._index + 1}/${this.commands.length})`,
				);

				if (command.id === 'misc:goto-label') {
					const jmpIndex = this.labels.get(
						(command as GotoLabelCommand).label,
					);
					if (jmpIndex === undefined) {
						logger.error(
							`label "${(command as GotoLabelCommand).label}" not found...`,
						);
					} else {
						this._index = jmpIndex;
						continue;
					}
				} else {
					const result = command.execute();
					if (result instanceof Promise) {
						await result;
					}

					await new Promise((resolve) => {
						setTimeout(resolve, this.delay);
					});
				}
			} finally {
				this.queue.shift();
			}

			++this._index;
		}

		logger.info('bot finished');
		this._isRunning = false;
	}

	public async stop() {
		logger.info('bot stopping');
		this._stop();
	}

	private _stop() {
		this._isRunning = false;
		this.queue.abortAll();
		this.commands = [];
		this.labels.clear();
		this._index = 0;
	}
}
