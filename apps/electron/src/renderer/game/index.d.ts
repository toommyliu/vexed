import type { WINDOW_IDS, WindowId } from '../../common/constants';
import type PortMonitor from '../../common/port-monitor';
import type { Bot } from './api/Bot';
import type { ShopInfo } from './api/Shop';
import type { AvatarData } from './api/struct/Avatar';
import type { FactionData } from './api/struct/Faction';
import type { ItemData } from './api/struct/Item';
import type { MonsterData } from './api/struct/Monster';
import type { QuestData } from './api/struct/Quest';
import type { ServerData } from './api/struct/Server';

type Nullable<T> = T | null;

declare global {
	const bot: Bot;
	const swf: GameSWF;

	type Account = { password: string; server?: string; username: string };

	type WindowId = (typeof WINDOW_IDS)[keyof typeof WINDOW_IDS];

	/* eslint-disable typescript-sort-keys/interface */
	type GameSWF = {
		getGameObject(path: string): string;
		getGameObjectS(path: string): string;
		setGameObject(path: string, value: unknown): void;
		getArrayObject(path: string, index: number): string;
		setArrayObject(path: string, index: number, value: unknown): void;
		callGameFunction(path: string, ...args: unknown[]): void;
		callGameFunction0(path: string): void;
		selectArrayObjects(path: string, selector: string): string;
		isNull(path: string): boolean;
		sendClientPacket(packet: string, type: 'json' | 'str' | 'xml'): void;

		authIsLoggedIn(): boolean;
		authIsTemporarilyKicked(): boolean;
		authLogin(username: string, password: string): void;
		authLogout(): void;
		authGetServers(): ServerData[];
		authConnectTo(server: string): void;

		bankGetItems(): ItemData[];
		bankGetItem(key: number | string): ItemData | null;
		bankContains(key: number | string, quantity?: number): boolean;
		bankLoadItems(): void;
		bankGetSlots(): number;
		bankGetUsedSlots(): number;
		bankDeposit(key: number | string): boolean;
		bankWithdraw(key: number | string): boolean;
		bankSwap(invKey: number | string, bankKey: number | string): boolean;
		bankOpen(): void;
		bankIsOpen(): boolean;

		combatHasTarget(): boolean;
		combatGetTarget(): Record<string, unknown> | null;
		combatUseSkill(index: number): void;
		combatForceUseSkill(index: number): void;
		combatCanUseSkill(index: number): boolean;
		combatGetSkillCooldownRemaining(index: number): number;
		combatCancelAutoAttack(): void;
		combatCancelTarget(): void;
		combatAttackMonster(name: string): void;
		combatAttackMonsterById(monMapId: int): void;

		dropStackAcceptDrop(itemId: number): void;
		dropStackRejectDrop(itemName: string, itemId: number): void;
		dropStackIsUsingCustomDrops(): boolean;
		dropStackSetCustomDropsUiState(on: boolean): void;
		dropStackIsCustomDropsUiOpen(): boolean;

		houseGetItems(): ItemData[];
		houseGetItem(key: number | string): Nullable<ItemData>;
		houseContains(
			key: number | string,
			quantity: number | undefined,
		): boolean;
		houseGetSlots(): number;

		inventoryGetItems(): ItemData[];
		inventoryGetItem(key: number | string): Nullable<ItemData>;
		inventoryContains(
			key: number | string,
			quantity: number | undefined,
		): boolean;
		inventoryGetSlots(): number;
		inventoryGetUsedSlots(): number;
		inventoryEquip(key: number | string): boolean;
		inventoryEquipConsumable(
			itemId: number,
			sDesc: string,
			sFile: string,
			sName: string,
		): boolean;

		playerJoinMap(
			map: string,
			cell: string | null,
			pad: string | null,
		): void;
		playerGetMap(): string;
		playerJump(cell: string, pad: string | null): void;
		playerGetCell(): string;
		playerGetPad(): string;
		playerGetFactions(): FactionData[];
		playerGetState(): number;
		playerGetHp(): number;
		playerGetMaxHp(): number;
		playerGetMp(): number;
		playerGetMaxMp(): number;
		playerGetLevel(): number;
		playerGetGold(): number;
		playerIsMember(): boolean;
		playerIsAfk(): boolean;
		playerGetPosition(): [number, number];
		playerWalkTo(x: number, y: number, walkSpeed?: number): void;
		playerRest(): void;
		playerUseBoost(itemId: int): boolean;
		playerHasActiveBoost(boost: string): boolean;
		playerGetClassName(): string;
		playerGetUserId(): number;
		playerGetCharId(): number;
		playerGetGender(): string;
		playerGetData(): Record<string, unknown>;
		playerIsLoaded(): boolean;
		playerGoTo(name: string): void;

		questsIsInProgress(questId: number): boolean;
		questsComplete(
			questId: number,
			turnIns?: number,
			itemId?: number,
			special?: boolean,
		): void;
		questsAccept(questId: number): void;
		questsLoad(questId: number): void;
		questsGet(questId: number): Nullable<Record<string, unknown>>;
		questsGetTree(): QuestData[];
		questsIsOneTimeQuestDone(questId: number): boolean;

		settingsInfiniteRange(): void;
		settingsProvokeMap(): void;
		settingsProvokeCell(): void;
		settingsEnemyMagnet(): void;
		settingsLagKiller(on: boolean): void;
		settingsSkipCutscenes(): void;
		settingsSetName(name: string): void;
		settingsSetGuild(name: string): void;
		settingsSetWalkSpeed(speed: number): void;
		settingsSetAccessLevel(
			accessLevel:
				| '30'
				| '40'
				| '50'
				| '60'
				| 'Member'
				| 'Moderator'
				| 'Non Member',
		);
		settingsSetDeathAds(on: boolean): void;
		settingsSetDisableCollisions(on: boolean): void;
		settingsSetDisableFX(on: boolean): void;
		settingsSetHidePlayers(on: boolean): void;

		shopGetInfo(): Nullable<ShopInfo>;
		shopGetItems(): ItemData[];
		shopGetItem(key: number | string): Nullable<ItemData>;
		shopBuyByName(name: string, quantity?: number): boolean;
		shopBuyById(id: number | string, quantity?: number): boolean;
		shopSellByName(name: string, quantity?: number): boolean;
		shopSellById(id: number | string, quantity?: number): boolean;
		shopLoad(shopId: number): void;
		shopLoadHairShop(shopId: number): void;
		shopLoadAmorCustomize(): void;

		tempInventoryGetItems(): ItemData[];
		tempInventoryGetItem(key: number | string): Nullable<ItemData>;
		tempInventoryContains(key: number | string, quantity?: number): boolean;

		worldIsLoaded(): boolean;
		worldGetPlayerNames(): string[];
		worldGetPlayers(): Record<string, AvatarData>[];
		worldGetPlayer(name: string): Nullable<AvatarData>;
		worldIsPlayerInCell(name: string, cell?: string): boolean;
		worldIsActionAvailable(gameAction: string): boolean;
		worldGetCellMonsters(): MonsterData[];
		worldGetMonsterByName(key: string | '*'): Nullable<MonsterData>;
		worldGetMonsterByMonMapId(key: number): Nullable<MonsterData>;
		worldIsMonsterAvailable(key: number | string | '*'): boolean;
		worldGetCells(): string[];
		worldGetCellPads(): string[];
		worldGetItemTree(): ItemData[];
		worldGetRoomId(): number;
		worldGetRoomNumber(): number;
		worldReload(): void;
		worldLoadSwf(swf: string): void;
		worldGetMapItem(itemId: number): void;
		worldSetSpawnPoint(cell?: string, pad?: string): void;
	};
	/* eslint-enable typescript-sort-keys/interface */

	/* eslint-disable @typescript-eslint/consistent-type-definitions */
	interface Window {
		/* eslint-disable typescript-sort-keys/interface */
		Bot: InstanceType<typeof Bot>;

		auth: ReturnType<(typeof Bot)['auth']>;
		bank: ReturnType<(typeof Bot)['bank']>;
		combat: ReturnType<(typeof Bot)['combat']>;
		drops: ReturnType<(typeof Bot)['drops']>;
		house: ReturnType<(typeof Bot)['house']>;
		inventory: ReturnType<(typeof Bot)['inventory']>;
		quests: ReturnType<(typeof Bot)['quests']>;
		player: ReturnType<(typeof Bot)['player']>;
		packets: ReturnType<(typeof Bot)['packets']>;
		settings: ReturnType<(typeof Bot)['settings']>;
		shops: ReturnType<(typeof Bot)['shops']>;
		tempInventory: ReturnType<(typeof Bot)['tempInventory']>;
		world: ReturnType<(typeof Bot)['world']>;

		// utilities

		flash: ReturnType<(typeof Bot)['flash']>;
		autoRelogin: ReturnType<(typeof Bot)['autoRelogin']>;
		timerManager: ReturnType<(typeof Bot)['timerManager']>;

		// interop
		debug(...args: string[]): void;
		packetFromClient(packet: [string]): Promise<void> | void;
		packetFromServer(packet: [string]): Promise<void> | void;
		loaded(): Promise<void> | void;
		connection(state: [string]): void;

		swf: GameSWF;

		// other
		ports: Map<WindowId, MessagePort>;
		portMonitors: Map<WindowId, PortMonitor>;
		scriptBlob?: Blob | null;
		account?: Account;
		/* eslint-enable typescript-sort-keys/interface */
	}
	/* eslint-enable @typescript-eslint/consistent-type-definitions */
}
