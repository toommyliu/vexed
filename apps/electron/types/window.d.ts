interface Window {
	swf: {
		//Player
		IsLoggedIn: () => string;
		Cell: () => string;
		Pad: () => string;
		Class: () => string;
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
		SkillAvailable: (param1: string /* skill idx */) => number;
		Position: () => string;
		WalkToPoint: (param1: string /* x */, param2: string /* y */) => void;
		SetWalkSpeed: (param1: string /* walk speed */) => void;
		CancelAutoAttack: () => void;
		CancelTarget: () => void;
		CancelTargetSelf: () => void;
		MuteToggle: (param1: boolean /* on */) => void;
		AttackMonster: (param1: string /* monster name */) => void;
		AttackMonsterByMonMapId: (param1: string /* monster map id */) => void;
		Jump: (param1: string /* cell */, param2: string /* pad, default Spawn */) => void;
		Rest: () => void;
		Join: (
			param1: string /* map */,
			param2: string /* cell, default Enter */,
			param3: string /* pad, default Spawn */,
		) => void;
		Equip: (param1: string /* item id */) => void;
		EquipPotion: (
			param1: string /* item id */,
			param2: string /* sDesc */,
			param3: string /* sFile */,
			param4: string /* sName */,
		) => void;
		GoTo: (param1: string /* player name? */) => void;
		UseBoost: (param1: string /* item id */) => void;
		UseSkill: (param1: string /* skill idx */) => void;
		ForceUseSkill: (param1: string /* skill idx */) => void;
		GetMapItem: (param1: string /* unknown */) => void;
		Logout: () => void;
		HasActiveBoost: (param1: string /* boost type, gold, xp, rep or class */) => void;
		UserID: () => number;
		CharID: () => number;
		Gender: () => string;
		SetEquip: (param1: string, param2: object) => void;
		GetEquip: (param1: number) => string;
		Buff: () => void;
		PlayerData: () => object;
		GetFactions: () => string;
		ChangeName: (param1: string /* name */) => void;
		ChangeGuild: (param1: string /* guild */) => void;
		SetTargetPlayer: (param1: string /* player name */) => void;
		ChangeAccessLevel: (param1: string /* Non Member, Member, Moderator/60, 30, 40, 50 */) => void;
		GetTargetHealth: () => number;
		CheckPlayerInMyCell: (param1: string) => string; // this seems useless
		GetSkillCooldown: (param1: string /* skill idx */) => string;
		SetSkillCooldown: (param1: string /* skill idx */, param2: string /* cooldown */) => void;
		SetSkillRange: (param1: string /* skill idx */, param2: string /* range */) => void;
		SetSkillMana: (param1: string /* skill idx */, param2: string /* mana */) => void;
		SetTargetPvP: (param1: string /* player name */) => void;
		GetAvatars: () => string;
		IsMember: () => string;
		GetAurasValue: (
			param1: string /* "True" then on self, otherwise Target */,
			param2: string /* aura name */,
		) => number;
		ChangeColorName: (param1: string /* color */) => void;
		GetAccessLevel: (param1: string /* player name */) => number;
		//World
		ReloadMap: () => void;
		LoadMap: (param1: string) => void;
		PlayersInMap: () => string;
		IsActionAvailable: (param1: string /* see enum */) => string;
		GetMonstersInCell: () => string;
		GetVisibleMonstersInCell: () => string;
		GetMonsterHealth: (param1: string /* monster name */) => string;
		SetSpawnPoint: () => void;
		IsMonsterAvailable: (param1: string /* monster name */) => string;
		IsMonsterAvailableByMonMapID: (param1: string /* monster map id */) => string;
		GetSkillName: (param1: string /* skill idx */) => string;
		GetCells: () => string;
		GetItemTree: () => string;
		RoomId: () => string;
		RoomNumber: () => string;
		Players: () => string;
		PlayerByName: (param1: string /* player name */) => string;
		GetCellPlayers: (param1: string /* player name */) => string;
		CheckCellPlayer: (param1: string /* player name */, param2: string /* cell */) => string;
		MapLoadComplete: () => string;
		GetPlayerHealth: (param1: string /* player name */) => string;
		GetPlayerHealthPercentage: (param1: string) => string;
		RejectDrop: (param1: string /* item name */, param2: string /* item id */) => void;
		//Quests
		IsInProgress: (param1: string /* quest id */) => string;
		Complete: (
			param1: string,
			param2: number /* default 1 */,
			param3: string /* default -1 */,
			param4: string /* default False */,
		) => void;
		Accept: (param1: string /* quest id */) => void;
		LoadQuest: (param1: string /* quest id */) => void;
		LoadQuests: (param1: string /* quest ids, joined by comma */) => void;
		GetQuests: (param1: string /* quest ids, joined by comma */) => void;
		GetQuestTree: () => string;
		CanComplete: (param1: string /* quest id */) => string;
		IsAvailable: (param1: string /* quest id */) => string;
		//Shops
		GetShops: () => string;
		LoadShop: (param1: string /* shop id */) => void;
		LoadHairShop: (param1: string /* hair shop id */) => void;
		LoadArmorCustomizer: () => void;
		SellItem: (param1: string /* item name */) => void;
		ResetShopInfo: () => void;
		IsShopLoaded: () => string;
		BuyItem: (param1: string /* item name */) => void;
		BuyItemQty: (param1: string /* item name */, param2: string /* quantity */) => void;
		BuyItemQtyById: (param1: number /* quantity */, param2: number /* item id */, param3: number /* shop id */) => void;
		//Bank
		GetBank: () => void;
		GetBankItems: () => string;
		GetBankItemByName: (param1: string /* item name */) => string;
		BankSlots: () => number;
		UsedBankSlots: () => number;
		TransferToBank: (param1: string /* inventory item name */) => void;
		TransferToInventory: (param1: string /* bank item name */) => void;
		BankSwap: (param1: string /* inventory item name */, param2: string /* bank item name */) => void;
		ShowBank: () => void;
		LoadBankItems: () => void;
		//Inventory
		GetInventoryItems: () => string;
		GetInventoryItemByName: (param1: string /* inventory item name */) => string;
		InventorySlots: () => number;
		UsedInventorySlots: () => number;
		//TempInventory
		GetTempItems: () => string;
		ItemIsInTemp: (param1: string /* item name */, param2: string /* quantity, * or count */) => string;
		//House
		GetHouseItems: () => string;
		HouseSlots: () => number;
		//AutoRelogin
		IsTemporarilyKicked: () => string;
		Login: () => void;
		FixLogin: (param1: string /* username */, param2: string /* password */) => void;
		ResetServers: () => string;
		AreServersLoaded: () => string;
		Connect: (param1: string /* server name */) => void;
		//Settings
		SetInfiniteRange: () => void;
		SetProvokeMonsters: () => void;
		SetEnemyMagnet: () => void;
		SetLagKiller: (param1: string /* True / False */) => void;
		DestroyPlayers: () => void;
		SetSkipCutscenes: () => void;
		//param1/Root
		SetFPS: (param1: string /* string */) => void;
		RealAddress: () => string;
		RealPort: () => string;
		ServerName: () => string;
		GetUsername: () => string;
		GetPassword: () => string;
		SetTitle: (param1: string /* title */) => void;
		SendMessage: (param1: string /* msg */) => void;
		IsConnMCBackButtonVisible: () => string;
		GetConnMC: () => string;
		HideConnMC: () => void;
		//Caller
		getGameObject: (param1: string) => string;
		getGameObjectS: (param1: string) => string;
		setGameObject: (param1: string, param2: unknown) => void;
		getArrayObject: (param1: string, param2: number) => string;
		setArrayObject: (param1: string, param2: number, param3: unknown) => void;
		callGameFunction: (param1: string, ...args: unknown[]) => string;
		callGameFunction0: (param1: string) => string; // callGameFunction 0 args
		selectArrayObjects: (param1: string, param2: string) => string;
		isNull: (param1: string) => string;
		sendClientPacket: (param1: string, param2: string /* xml, json, str */) => void;
	};
	wasmoon: typeof import('wasmoon');
	lua_factory?: InstanceType<typeof import('wasmoon').LuaFactory>;
	lua?: InstanceType<typeof import('wasmoon').LuaEngine>;
}
