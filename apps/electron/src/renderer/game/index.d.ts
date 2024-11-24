import type { Bot } from './api/Bot';

type StringBoolean = '"False"' | '"True"';

declare global {
	const bot: Bot;
	const swf: GameSWF;

	type Account = { password: string; server?: string; username: string };

	type GameSWF = {
		// Player
		IsLoggedIn(): string;
		Cell(): string;
		Pad(): string;
		Class(): string;
		State(): number;
		Health(): number;
		HealthMax(): number;
		Mana(): number;
		ManaMax(): number;
		Map(): string;
		Level(): number;
		Gold(): number;
		HasTarget(): string;
		IsAfk(): string;
		AllSkillsAvailable(): number;
		SkillAvailable(skillIndex: string): number;
		Position(): [number, number];
		WalkToPoint(xPosition: string, yPosition: string): void;
		CancelAutoAttack(): void;
		CancelTarget(): void;
		CancelTargetSelf(): void;
		MuteToggle(param1: boolean): void;
		AttackMonster(monsterName: string): void;
		AttackMonsterByMonMapId(monMapId: string): void;
		Jump(cell: string, pad: string): void;
		Rest(): void;
		Join(mapName: string, cell: string, pad: string): void;
		Equip(itemId: string): void;
		EquipPotion(
			itemId: string,
			sDesc: string,
			sFile: string,
			sName: string,
		): void;
		GoTo(username: string): void;
		UseBoost(itemId: string): void;
		UseSkill(skillIndex: string): void;
		ForceUseSkill(skillIndex: string): void;
		GetMapItem(itemId: string): void;
		Logout(): void;
		HasActiveBoost(boost: 'gold' | 'xp' | 'rep' | 'class' | string): string;
		UserID(): number;
		CharID(): number;
		Gender(): string;
		// TODO:
		SetEquip(param1: string, param2: Object): void;
		// TODO:
		GetEquip(itemId: string): JSON;
		// TODO:
		PlayerData(): JSON;
		// TODO:
		GetFactions(): JSON;
		ChangeName(name: string): void;
		ChangeGuild(guild: string): void;
		SetTargetPlayer(username: string): void;
		ChangeAccessLevel(
			accessLevel:
				| 'Non Member'
				| 'Member'
				| 'Moderator'
				| '30'
				| '40'
				| '50'
				| '60',
		): void;
		GetTargetHealth(): number;
		GetSkillCooldown(skillIndex: string): number;
		SetTargetPvP(username: string): void;
		// TODO:
		GetAvatars(): JSON;
		IsMember(): string;
		GetAurasValue(self: 'True' | 'False', auraName: string): number;
		ChangeColorName(color: number): void;
		GetAccessLevel(username: string): number;
		IsPlayerLoaded(): string;
		// World
		MapLoadComplete(): string;
		ReloadMap(): void;
		LoadMap(swf: string): void;
		PlayersInMap(): string;
		IsActionAvailable(actionName: string): StringBoolean;
		GetMonstersInCell(): string;
		GetVisibleMonstersInCell(): string;
		GetMonsterHealth(monsterName: string): string;
		SetSpawnPoint(): void;
		IsMonsterAvailable(monsterName: string): StringBoolean;
		IsMonsterAvailableByMonMapID(monMapID: string): StringBoolean;
		GetSkillName(skillIndex: string): string;
		GetCells(): string;
		GetCellPads(): string;
		GetItemTree(): string;
		RoomId(): string;
		RoomNumber(): string;
		Players(): string;
		PlayerByName(target: string): string;
		SetWalkSpeed(walkSpeed: string): void;
		GetCellPlayers(playerName: string): StringBoolean;
		CheckCellPlayer(playerName: string, cell: string): StringBoolean;
		GetPlayerHealth(target: string): string;
		GetPlayerHealthPercentage(target: string): string;
		RejectDrop(itemName: string, itemId: string): void;
		// Quests
		IsInProgress(questId: string): StringBoolean;
		Complete(
			questId: string,
			qty: number,
			itemId: string,
			special: string,
		): void;
		Accept(questId: string): void;
		LoadQuest(questId: string): void;
		LoadQuests(questIds: string): void;
		GetQuests(questIds: string): void;
		GetQuestTree(): string;
		CanComplete(questId: string): StringBoolean;
		IsAvailable(questId: string): StringBoolean;
		// Shops
		GetShops(): string;
		LoadShop(shopId: string): void;
		LoadHairShop(shopId: string): void;
		LoadArmorCustomizer(): void;
		SellItem(itemName: string): void;
		ResetShopInfo(): void;
		IsShopLoaded(): StringBoolean;
		BuyItem(itemName: string): void;
		BuyItemQty(itemName: string, qty: number): void;
		BuyItemQtyById(qty: number, itemId: number, shopitemId: number): void;
		// Bank
		GetBank(): void;
		GetBankItems(): string;
		GetBankItemByName(itemName: string): string;
		BankSlots(): number;
		UsedBankSlots(): number;
		TransferToBank(itemName: string): void;
		TransferToInventory(itemName: string): void;
		BankSwap(invItemName: string, bankItemName: string): void;
		ShowBank(): void;
		LoadBankItems(): void;
		// Inventory
		GetInventoryItems(): string;
		GetInventoryItemByName(itemName: string): string;
		InventorySlots(): number;
		UsedInventorySlots(): number;
		// TempInventory
		GetTempItems(): string;
		ItemIsInTemp(itemName: string): string;
		// House
		GetHouseItems(): string;
		HouseSlots(): number;
		// AutoRelogin
		IsTemporarilyKicked(): StringBoolean;
		Login(): void;
		FixLogin(username: string, password: string): void;
		ResetServers(): StringBoolean;
		AreServersLoaded(): StringBoolean;
		Connect(name: string): void;
		// Settings
		SetInfiniteRange(): void;
		SetProvokeMonsters(): void;
		SetEnemyMagnet(): void;
		SetLagKiller(state: string): void;
		HidePlayers(on: boolean): void;
		SetSkipCutscenes(): void;
		// Root
		SetFPS(fps: string): void;
		RealAddress(): string;
		RealPort(): string;
		GetUsername(): string;
		GetPassword(): string;
		SetTitle(title: string): void;
		SendMessage(msg: string): void;
		IsConnMCBackButtonVisible(): StringBoolean;
		GetConnMC(): string;
		HideConnMC(): void;
		// Caller
		getGameObject(path: string): string;
		getGameObjectS(path: string): string;
		setGameObject(path: string, value: unknown): void;
		getArrayObject(path: string, index: number): string;
		setArrayObject(path: string, index: number, value: unknown): void;
		callGameFunction(path: string, ...args: unknown[]): void;
		callGameFunction0(path: string): void;
		selectArrayObjects(path: string, selector: string): string;
		isNull(path: string): StringBoolean;
		sendClientPacket(packet: string, type: 'xml' | 'json' | 'str'): void;
	};

	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
	interface Window {
		Bot: InstanceType<Bot>;
		bot: InstanceType<typeof Bot>;
		auth: InstanceType<typeof import('./api/Auth').Auth>;
		bank: InstanceType<typeof import('./api/Bank').Bank>;
		combat: InstanceType<typeof import('./api/Combat')>;
		drops: InstanceType<typeof import('./api/Drops')>;
		house: InstanceType<typeof import('./api/House')>;
		flash: InstanceType<typeof import('./api/util/Flash')>;
		inventory: InstanceType<typeof import('./api/Inventory')>;
		player: InstanceType<typeof import('./api/Player')>;
		packets: InstanceType<typeof import('./api/Packets')>;
		quests: InstanceType<typeof import('./api/Quests')>;
		settings: InstanceType<typeof import('./api/Settings')>;
		shops: InstanceType<typeof import('./api/Shops')>;
		tempInventory: InstanceType<
			typeof import('./api/TempInventory').TempInventory
		>;
		world: InstanceType<typeof import('./api/World')>;

		swf: GameSWF;

		packetFromServer([packet]: [string]): Promise<void> | void;
		packetFromClient([packet]: [string]): Promise<void> | void;
		connection([state]: [string]): void;
		progress([percentage]: [number]): void;
		account?: Account;
	};
}
