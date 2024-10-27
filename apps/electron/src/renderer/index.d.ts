import type { Bot } from './api/Bot';

type StringBoolean = '"False"' | '"True"';

declare global {
	const bot: Bot;
	const swf: GameSWF;

	type Account = { password: string; server?: string; username: string };

	/* eslint-disable typescript-sort-keys/interface */
	type GameSWF = {
		// Auras
		compareAuras(
			target: string,
			operator: string,
			auraName: string,
			auraValue: int,
		): StringBoolean;
		getSubjectAuras(subject: string): string;
		// Auth
		connectTo(name: string): StringBoolean;
		// Combat
		canUseSkill(index: int): StringBoolean;
		useSkill(index: int): StringBoolean;
		untargetSelf(): void;
		attackMonsterByMonMapID(id: int): StringBoolean;
		attackMonsterByName(name: string): StringBoolean;
		attackPlayer(name: string): StringBoolean;
		// Drops
		isUsingCustomDropsUI(): boolean;
		isCustomDropsOpen(): boolean;
		openCustomDropsUI(): void;
		getDropStack(): string;
		/**
		 * @param whitelist - The items to pickup, delimited by a comma
		 */
		pickupDrops(whitelist: string): void;
		/**
		 * @param whitelist - The items to keep, delimited by a comma
		 */
		rejectExcept(whitelist: string): void;
		// World
		getMonsterInCell(name: string): string;
		availableMonstersInCell(): string;
		walkTo(xPos: int, yPos: int, walkSpeed: int): void;
		getCellPads(): string;
		// Settings
		magnetize(): void;
		infiniteRange(): void;
		skipCutscenes(): void;
		setLagKiller(on: boolean): void;
		setDeathAds(on: boolean): void;
		// Modules
		enableMod(name: string): void;
		disableMod(name: string): void;
		// Interop
		getGameObject(path: string): string;
		getGameObjectS(path: string): string;
		getGameObjectKey(path: string, key: string): string;
		setGameObject(path: string, value: unknown): void;
		setGameObjectKey(path: string, key: string, value: string): void;
		getArrayObject(path: string, index: int): string;
		setArrayObject(path: string, index: int, value: string): void;
		callGameFunction(path: string, ...args: string[]): string;
		callGameFunction0(path: string): string;
		selectArrayObjects(path: string, selector: string): string;
		isNull(path: string): StringBoolean;
	};
	/* eslint-enable typescript-sort-keys/interface */

	/* eslint-disable typescript-sort-keys/interface, @typescript-eslint/consistent-type-definitions, @typescript-eslint/consistent-type-imports */
	interface Window {
		Bot: InstanceType<Bot>;
		bot: InstanceType<typeof Bot>;
		auth: InstanceType<typeof import('./api/Auth').Auth>;
		bank: InstanceType<typeof import('./api/Bank').Bank>;
		combat: InstanceType<typeof import('./api/Combat').Combat>;
		drops: InstanceType<typeof import('./api/Drops').Drops>;
		house: InstanceType<typeof import('./api/House').House>;
		flash: InstanceType<typeof import('./api/util/Flash').Flash>;
		inventory: InstanceType<typeof import('./api/Inventory').Inventory>;
		player: InstanceType<typeof import('./api/Player').Player>;
		packets: InstanceType<typeof import('./api/Packets').Packets>;
		quests: InstanceType<typeof import('./api/Quests').Quests>;
		settings: InstanceType<typeof import('./api/Settings').Settings>;
		shops: InstanceType<typeof import('./api/Shop').Shops>;
		tempInventory: InstanceType<
			typeof import('./api/TempInventory').TempInventory
		>;
		world: InstanceType<typeof import('./api/World').World>;

		windows: {
			game: WindowProxy;
			tools: {
				fastTravels: WindowProxy | null;
				loaderGrabber: WindowProxy | null;
				follower: WindowProxy | null;
			};
			packets: {
				logger: WindowProxy | null;
				spammer: WindowProxy | null;
			};
		};

		swf: GameSWF;

		packetFromServer([packet]: [string]): Promise<void> | void;
		packetFromClient([packet]: [string]): Promise<void> | void;
		connection([state]: [string]): void;

		account?: Account;
	}
	/* eslint-enable typescript-sort-keys/interface */
}
