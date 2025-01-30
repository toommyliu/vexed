import { AsyncQueue } from '@sapphire/async-queue';
import { logger } from '../../common/logger';

const logWithTime = (message: string) => {
	logger.info(message);
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
		while (this.commands.length > 0) {
			await this.queue.wait();
			try {
				const command = this.commands.shift();
				if (command) {
					await command();
				}

				// eslint-disable-next-line @typescript-eslint/no-loop-func
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
