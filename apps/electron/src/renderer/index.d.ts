import type Bot from './api/Bot';

declare global {
	var bot: Bot;
	var swf: GameSWF;

	type Account = { username: string; password: string; server?: string };
	type StringBoolean = '"True"' | '"False"';

	type GameSWF = {
		//Player
		IsLoggedIn: () => string;
		Cell: () => String;
		Pad: () => String;
		Class: () => String;
		State: () => number;
		Health: () => number;
		HealthMax: () => number;
		Mana: () => number;
		ManaMax: () => number;
		Map: () => string;
		Level: () => number;
		Gold: () => number;
		HasTarget: () => string;
		IsAfk: () => string;
		AllSkillsAvailable: () => number;
		SkillAvailable: (skillIndex: String) => number;
		Position: () => [number, number];
		WalkToPoint: (xPosition: string, yPosition: string) => void;
		CancelAutoAttack: () => void;
		CancelTarget: () => void;
		CancelTargetSelf: () => void;
		MuteToggle: (param1: boolean) => void;
		AttackMonster: (monsterName: string) => void;
		AttackMonsterByMonMapId: (monMapId: string) => void;
		Jump: (cell: string, pad: string = 'Spawn') => void;
		Rest: () => void;
		Join: (
			mapName: string,
			cell: string = 'Enter',
			pad: string = 'Spawn',
		) => void;
		Equip: (itemID: string) => void;
		EquipPotion: (
			itemId: string,
			sDesc: string,
			sFile: string,
			sName: string,
		) => void;
		GoTo: (username: string) => void;
		UseBoost: (itemID: string) => void;
		UseSkill: (skillIndex: string) => void;
		ForceUseSkill: (skillIndex: string) => void;
		GetMapItem: (itemID: string) => void;
		Logout: () => void;
		HasActiveBoost: (
			boost: 'gold' | 'xp' | 'rep' | 'class' | string,
		) => string;
		UserID: () => number;
		CharID: () => number;
		Gender: () => string;
		//TODO:
		SetEquip: (param1: String, param2: Object) => void;
		//TODO:
		GetEquip: (itemID: string) => JSON;
		//TODO:
		PlayerData: () => JSON;
		//TODO:
		GetFactions: () => JSON;
		ChangeName: (name: string) => void;
		ChangeGuild: (guild: string) => void;
		SetTargetPlayer: (username: string) => void;
		ChangeAccessLevel: (
			accessLevel:
				| 'Non Member'
				| 'Member'
				| 'Moderator'
				| '30'
				| '40'
				| '50'
				| '60',
		) => void;
		GetTargetHealth: () => number;
		GetSkillCooldown: (skillIndex: string) => number;
		SetTargetPvP: (username: string) => void;
		//TODO:
		GetAvatars: () => JSON;
		IsMember: () => string;
		GetAurasValue: (self: 'True' | 'False', auraName: string) => number;
		ChangeColorName: (color: number) => void;
		GetAccessLevel: (username: string) => number;
		IsPlayerLoaded: () => string;
		//World
		MapLoadComplete: () => string;
		ReloadMap: () => void;
		LoadMap: (swf: string) => void;
		PlayersInMap: () => string;
		IsActionAvailable: (actionName: string) => StringBoolean;
		GetMonstersInCell: () => string;
		GetVisibleMonstersInCell: () => string;
		GetMonsterHealth: (monsterName: string) => string;
		SetSpawnPoint: () => void;
		IsMonsterAvailable: (monsterName: string) => StringBoolean;
		IsMonsterAvailableByMonMapID: (monMapID: string) => StringBoolean;
		GetSkillName: (skillIndex: string) => string;
		GetCells: () => string;
		GetCellPads: () => string;
		GetItemTree: () => string;
		RoomId: () => string;
		RoomNumber: () => string;
		Players: () => string;
		PlayerByName: (target: string) => string;
		SetWalkSpeed: (walkSpeed: string) => void;
		GetCellPlayers: (playerName: string) => StringBoolean;
		CheckCellPlayer: (playerName: string, cell: string) => StringBoolean;
		GetPlayerHealth: (target: string) => string;
		GetPlayerHealthPercentage: (target: string) => string;
		RejectDrop: (itemName: string) => void;
		//Quests
		IsInProgress: (questID: string) => StringBoolean;
		Complete: (
			questID: string,
			qty: number = 1,
			itemID: string = '-1',
			special: string = 'True' | 'False',
		) => void;
		Accept: (questID: string) => void;
		LoadQuest: (questID: string) => void;
		LoadQuests: (questIDs: string) => void;
		GetQuests: (questIDs: string) => void;
		GetQuestTree: () => string;
		CanComplete: (questID: string) => StringBoolean;
		IsAvailable: (questID: string) => StringBoolean;
		//Shops
		GetShops: () => string;
		LoadShop: (shopID: string) => void;
		LoadHairShop: (shopID: string) => void;
		LoadArmorCustomizer: () => void;
		SellItem: (itemName: string) => void;
		ResetShopInfo: () => void;
		IsShopLoaded: () => StringBoolean;
		BuyItem: (itemName: string) => void;
		BuyItemQty: (itemName: string, qty: number) => void;
		BuyItemQtyById: (
			qty: number,
			itemID: number,
			shopItemID: number,
		) => void;
		//Bank
		GetBank: () => void;
		GetBankItems: () => string;
		GetBankItemByName: (itemName: string) => string;
		BankSlots: () => number;
		UsedBankSlots: () => number;
		TransferToBank: (itemName: string) => void;
		TransferToInventory: (itemName: string) => void;
		BankSwap: (invItemName: string, bankItemName: string) => void;
		ShowBank: () => void;
		LoadBankItems: () => void;
		//Inventory
		GetInventoryItems: () => string;
		GetInventoryItemByName: (itemName: string) => string;
		InventorySlots: () => number;
		UsedInventorySlots: () => number;
		//TempInventory
		GetTempItems: () => string;
		ItemIsInTemp: (itemName: string) => string;
		//House
		GetHouseItems: () => string;
		HouseSlots: () => number;
		//AutoRelogin
		IsTemporarilyKicked: () => StringBoolean;
		Login: () => void;
		FixLogin: (username: string, password: string) => void;
		ResetServers: () => StringBoolean;
		AreServersLoaded: () => StringBoolean;
		Connect: (name: string) => void;
		//Settings
		SetInfiniteRange: () => void;
		SetProvokeMonsters: () => void;
		SetEnemyMagnet: () => void;
		SetLagKiller: (state: string) => void;
		HidePlayers: (on: boolean) => void;
		SetSkipCutscenes: () => void;
		//Root
		SetFPS: (fps: string) => void;
		RealAddress: () => string;
		RealPort: () => string;
		GetUsername: () => string;
		GetPassword: () => string;
		SetTitle: (title: string) => void;
		SendMessage: (msg: string) => void;
		IsConnMCBackButtonVisible: () => StringBoolean;
		GetConnMC: () => string;
		HideConnMC: () => void;
		//Caller
		getGameObject: (path: string) => string;
		getGameObjectS: (path: string) => string;
		setGameObject: (path: string, value: unknown) => void;
		getArrayObject: (path: string, index: number) => string;
		setArrayObject: (path: string, index: number, value: unknown) => void;
		callGameFunction: (path: string, ...args: unknown[]) => void;
		callGameFunction0: (path: string) => void;
		selectArrayObjects: (path: string, selector: string) => string;
		isNull: (path: string) => StringBoolean;
		sendClientPacket: (
			packet: string,
			type: 'xml' | 'json' | 'str',
		) => void;
	};

	interface Window {
		Bot: InstanceType<Bot>;
		bot: InstanceType<typeof Bot>;
		auth: InstanceType<typeof import('./api/Auth')>;
		bank: InstanceType<typeof import('./api/Bank')>;
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
		tempInventory: InstanceType<typeof import('./api/TempInventory')>;
		world: InstanceType<typeof import('./api/World')>;

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

		packetFromServer: ([packet]: [string]) => Awaited<void> | void;
		packetFromClient([packet]: [string]): Awaited<void> | void;
		connection: ([state]: [string]) => void;
		progress: ([percentage]: [number]) => void;
		account?: Account;
	}
}
