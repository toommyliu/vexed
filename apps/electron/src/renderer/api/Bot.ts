import { EventEmitter } from 'events';
import { Auth } from './Auth';
import { Bank } from './Bank';
import { Combat } from './Combat';
import { Drops } from './Drops';
import { House } from './House';
import { Inventory } from './Inventory';
import { Packets } from './Packets';
import { Player } from './Player';
import { Quests } from './Quests';
import { Settings } from './Settings';
import { Shops } from './Shop';
import { TempInventory } from './TempInventory';
import { World } from './World';
import { AutoRelogin } from './util/AutoRelogin';
import { Flash } from './util/Flash';
import { TimerManager } from './util/TimerManager';

export class Bot extends EventEmitter {
	#ac: AbortController | null = null;

	public static _instance: Bot | null = null;

	public auth: InstanceType<typeof Auth>;

	public bank: InstanceType<typeof Bank>;

	public combat: InstanceType<typeof Combat>;

	public drops: InstanceType<typeof Drops>;

	public house: InstanceType<typeof House>;

	public inventory: InstanceType<typeof Inventory>;

	public player: InstanceType<typeof Player>;

	public packets: InstanceType<typeof Packets>;

	public quests: InstanceType<typeof Quests>;

	public settings: InstanceType<typeof Settings>;

	public shops: InstanceType<typeof Shops>;

	public tempInventory: InstanceType<typeof TempInventory>;

	public world: InstanceType<typeof World>;

	public autoRelogin: InstanceType<typeof AutoRelogin>;

	public flash: InstanceType<typeof Flash>;

	public timerManager: InstanceType<typeof TimerManager>;

	public constructor() {
		super();

		if (Bot._instance) {
			throw new Error('Bot is a singleton, use Bot.getInstance()');
		}

		Bot._instance = this;

		this.autoRelogin = new AutoRelogin(this);
		this.flash = new Flash();
		this.timerManager = new TimerManager();

		this.auth = new Auth(this);
		this.bank = new Bank(this);
		this.combat = new Combat(this);
		this.drops = new Drops(this);
		this.house = new House(this);
		this.inventory = new Inventory(this);
		this.player = new Player(this);
		this.packets = new Packets(this);
		this.quests = new Quests(this);
		this.settings = new Settings(this);
		this.shops = new Shops(this);
		this.tempInventory = new TempInventory(this);
		this.world = new World(this);
	}

	/**
	 * @param ms - The number of milliseconds to wait.
	 */
	public async sleep(ms: number): Promise<void> {
		return new Promise<void>((resolve) => {
			const id = this.timerManager.setTimeout(() => {
				this.timerManager.clearTimeout(id);
				resolve();
			}, ms);
		});
	}

	/**
	 * Waits until the condition is met.
	 *
	 * @param condition - The condition to wait for until it returns true.
	 * @param prerequisite - The prerequisite to be checked before waiting for the condition.
	 * @param timeout - The maximum number of iterations to wait. -1 to wait indefinitely.
	 */
	public async waitUntil(
		condition: () => boolean,
		prerequisite: (() => boolean) | null = null,
		timeout = 15,
	): Promise<void> {
		let iterations = 0;

		let prerequisiteResult = prerequisite ? prerequisite() : true;
		let conditionResult = condition();
		let timeoutResult = iterations < timeout || timeout === -1;

		while (prerequisiteResult && !conditionResult && timeoutResult) {
			await this.sleep(1_000);
			iterations++;

			prerequisiteResult = prerequisite ? prerequisite() : true;
			conditionResult = condition();
			timeoutResult = iterations < timeout || timeout === -1;
		}
	}

	/**
	 * Raises the running flag. While this does not start a script, it setups various tasks used during a script's runtime.
	 * For example, the auto relogin background task.
	 */
	public start(): void {
		if (this.#ac) {
			console.log('Bot is already started');
			return;
		}

		this.emit('start');
		this.#ac = new AbortController();
	}

	/**
	 * Lowers the running flag. While this does not stop a script, it removes any background tasks that were set up on start.
	 */
	public stop(): void {
		if (!this.#ac) {
			console.log('Bot is already stopped or not running');
			return;
		}

		this.emit('stop');
		this.#ac = null;
	}

	/**
	 * Whether the bot is "running".
	 */
	public get running(): boolean {
		if (!this.#ac) {
			return false;
		}

		return !this.#ac.signal.aborted;
	}

	/**
	 * Gets the singleton instance of the Bot class.
	 */
	public static getInstance(): Bot {
		Bot._instance ??= new Bot();
		return Bot._instance;
	}
}

// Prevent these from being overwritten
Object.defineProperty(window, 'Bot', { value: Bot });
Object.defineProperty(window, 'bot', { value: Bot.getInstance() });
Object.defineProperty(window, 'auth', { value: Bot.getInstance().auth });
Object.defineProperty(window, 'bank', { value: Bot.getInstance().bank });
Object.defineProperty(window, 'combat', { value: Bot.getInstance().combat });
Object.defineProperty(window, 'drops', { value: Bot.getInstance().drops });
Object.defineProperty(window, 'flash', { value: Bot.getInstance().flash });
Object.defineProperty(window, 'house', { value: Bot.getInstance().house });
Object.defineProperty(window, 'inventory', {
	value: Bot.getInstance().inventory,
});
Object.defineProperty(window, 'player', { value: Bot.getInstance().player });
Object.defineProperty(window, 'packets', { value: Bot.getInstance().packets });
Object.defineProperty(window, 'quests', { value: Bot.getInstance().quests });
Object.defineProperty(window, 'settings', {
	value: Bot.getInstance().settings,
});
Object.defineProperty(window, 'shops', { value: Bot.getInstance().shops });
Object.defineProperty(window, 'tempInventory', {
	value: Bot.getInstance().tempInventory,
});
Object.defineProperty(window, 'world', { value: Bot.getInstance().world });
