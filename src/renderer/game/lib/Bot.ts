import { EventEmitter } from 'events';
import { CommandExecutor } from '../botting/commands/command-executor';
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
import type { Monster } from './models/Monster';
import { AutoRelogin } from './util/AutoRelogin';
import { Flash } from './util/Flash';
import { TimerManager } from './util/TimerManager';

export class Bot extends EventEmitter {
	/**
	 * This event is emitted when the player logs in.
	 *
	 * @eventProperty
	 */
	public readonly login!: () => void;

	/**
	 * This event is emitted when the player logs out.
	 *
	 * @eventProperty
	 */
	public readonly logout!: () => void;

	/**
	 * This event is emitted when a script is started.
	 *
	 * @eventProperty
	 */
	public readonly start!: () => void;

	/**
	 * This event is emitted when a script is stopped.
	 *
	 * @eventProperty
	 */
	public readonly stop!: () => void;

	/**
	 * This event is emitted when an error occurs during a script.
	 *
	 * @eventProperty
	 */
	public readonly error!: (error: Error) => void;

	/**
	 * This event is emitted when a monster has died.
	 *
	 * @eventProperty
	 */
	public readonly monsterDeath!: (monster: Monster) => void;

	/**
	 * This event is emitted when a monster has respawned.
	 *
	 * @eventProperty
	 */
	public readonly monsterRespawn!: (monster: Monster) => void;

	/**
	 * This event is emitted when a packet is received from the server.
	 *
	 * @eventProperty
	 */
	public readonly packetFromServer!: (packet: string) => void;

	/**
	 * This event is emitted when a packet is sent to the server.
	 *
	 * @eventProperty
	 */
	public readonly packetFromClient!: (packet: string) => void;

	/**
	 * This event is emitted when a player leaves the room.
	 *
	 * @eventProperty
	 */
	public readonly playerLeave!: (playerName: string) => void;

	/**
	 * The AbortController instance.
	 */
	public ac: AbortController | null = null;

	/**
	 * The singleton instance of the Bot class.
	 */
	public static _instance: Bot | null = null;

	/**
	 * The Auth API class instance.
	 */
	public auth: InstanceType<typeof Auth>;

	/**
	 * The Bank API class instance.
	 */
	public bank: InstanceType<typeof Bank>;

	/**
	 * The Combat API class instance.
	 */
	public combat: InstanceType<typeof Combat>;

	/**
	 * The Drops API class instance.
	 */
	public drops: InstanceType<typeof Drops>;

	/**
	 * The House API class instance.
	 */
	public house: InstanceType<typeof House>;

	/**
	 * The Inventory API class instance.
	 */
	public inventory: InstanceType<typeof Inventory>;

	/**
	 * The local Player API class instance.
	 */
	public player: InstanceType<typeof Player>;

	/**
	 * The Packets API class instance.
	 */
	public packets: InstanceType<typeof Packets>;

	/**
	 * The Quests API class instance.
	 */
	public quests: InstanceType<typeof Quests>;

	/**
	 * The Settings API class instance.
	 */
	public settings: InstanceType<typeof Settings>;

	/**
	 * The Shops API class instance.
	 */
	public shops: InstanceType<typeof Shops>;

	/**
	 * The TempInventory API class instance.
	 */
	public tempInventory: InstanceType<typeof TempInventory>;

	/**
	 * The World API class instance.
	 */
	public world: InstanceType<typeof World>;

	/**
	 * The AutoRelogin API class instance.
	 */
	public autoRelogin: InstanceType<typeof AutoRelogin>;

	/**
	 * The Flash API class instance.
	 */
	public flash: InstanceType<typeof Flash>;

	/**
	 * The TimerManager API class instance.
	 */
	public timerManager: InstanceType<typeof TimerManager>;

	public executor: InstanceType<typeof CommandExecutor>;

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

		this.executor = new CommandExecutor();
	}

	/**
	 * Pauses execution for a specified amount of time.
	 *
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
		timeout: number = 15,
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

		await this.sleep(250);
	}

	/**
	 * Whether the bot is running.
	 */
	public isRunning(): boolean {
		return this.ac !== null && !this.ac.signal.aborted;
	}

	/**
	 * Used to keep track of the current AbortController signal.
	 */
	public get signal(): AbortSignal | null {
		return this.ac?.signal ?? null;
	}

	/**
	 * Gets the singleton instance of the Bot class.
	 */
	public static getInstance(): Bot {
		Bot._instance ??= new Bot();
		return Bot._instance;
	}
}
// @ts-expect-error debugging
window.Bot = Bot;
