import { Bot } from '../api/Bot';
import type { SetIntervalAsyncTimer } from '../api/util/TimerManager';

export class Context {
	private readonly bot = Bot.getInstance();

	/**
	 * A list of quest ids to watch for.
	 */
	private readonly questIds: Set<number>;

	/**
	 * A list of item ids to watch for.
	 */
	private readonly itemIds: Set<number>;

	/**
	 * A list of boosts ids to consume.
	 */
	private readonly boostIds: Set<number>;

	private questTimer!: SetIntervalAsyncTimer<unknown[]>;

	private itemTimer!: SetIntervalAsyncTimer<unknown[]>;

	private boostTimer!: SetIntervalAsyncTimer<unknown[]>;

	private abortController!: AbortController;

	public constructor() {
		this.questIds = new Set();
		this.itemIds = new Set();
		this.boostIds = new Set();
	}

	public addQuest(questId: number) {
		this.questIds.add(questId);
	}

	public removeQuest(questId: number) {
		this.questIds.delete(questId);
	}

	public addItem(itemId: number) {
		this.itemIds.add(itemId);
	}

	public removeItem(itemId: number) {
		this.itemIds.delete(itemId);
	}

	public isRunning() {
		return Boolean(
			this.abortController && !this.abortController.signal.aborted,
		);
	}

	public async start() {
		this.abortController = new AbortController();

		this.questTimer = this.bot.timerManager.setInterval(async () => {
			if (!this.isRunning()) {
				void this.bot.timerManager.clearInterval(this.questTimer);
				return;
			}

			for (const questId of Array.from(this.questIds)) {
				try {
					if (!swf.questsIsInProgress(questId)) {
						console.log('accept');
						swf.questsAccept(questId);
					}

					if (swf.questsCanCompleteQuest(questId)) {
						console.log('complete');
						void this.bot.quests.complete(questId);
						void this.bot.quests.accept(questId);
					}
				} catch {}
			}
		}, 1_000);

		this.itemTimer = this.bot.timerManager.setInterval(async () => {
			if (!this.isRunning()) {
				void this.bot.timerManager.clearInterval(this.itemTimer);
				return;
			}

			for (const itemId of Array.from(this.itemIds)) {
				try {
					if (this.bot.drops.hasDrop(itemId))
						await this.bot.drops.pickup(itemId);
				} catch {}
			}
		}, 1_000);
	}

	public async stop() {
		this.abortController.abort();
	}
}
