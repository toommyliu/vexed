/* eslint-disable no-unused-vars */

const Flash = {
	call(fn, ...args) {
		// interop function?
		let _fn;
		let out;
		if (typeof fn === 'function') {
			_fn = fn;
		} else if (typeof fn === 'string') {
			_fn = args.length === 0 ? window.swf.callGameFunction0 : window.swf.callGameFunction;
		}

		// call it
		try {
			out = _fn(...args);
		} catch (error) {
			console.error('error', error);
			return null;
		}

		if (typeof out === 'string') {
			// boolean
			if (out?.toLowerCase() === '"true"' || out?.toLowerCase() === '"false"') {
				return out.toLowerCase() === '"true"';
			}

			// void
			if (out === 'undefined') {
				return;
			}

			return JSON.parse(out);
		}

		return out;
	},
	get(path) {
		try {
			return JSON.parse(window.swf.getGameObject(path));
		} catch (error) {
			console.error(error);
			return null;
		}
	},
	getStatic(path) {
		try {
			return JSON.parse(window.swf.getGameObjectS(path));
		} catch (error) {
			console.error(error);
			return null;
		}
	},
};

const Auth = {
	get username() {
		if (!Auth.loggedIn) return null;
		return Flash.call(window.swf.GetUsername);
	},
	get password() {
		if (!Auth.loggedIn) return null;
		return Flash.call(window.swf.GetPassword);
	},
	get loggedIn() {
		return Flash.call(window.swf.IsLoggedIn);
	},
	login: (username, password) => {
		if (username && password) {
			Flash.call(window.swf.FixLogin, username, password);
		} else {
			Flash.call(window.swf.Login);
		}
	},
	logout: () => Flash.call(window.swf.Logout),
	get servers() {
		return Flash.call(window.swf.getGameObject, 'serialCmd.servers');
	},
	resetServers: () => Flash.call(window.swf.ResetServers),
	connect: (name) => Flash.call(window.swf.Connect, name),
};

const Bank = {
	get items() {
		return Flash.call(window.swf.GetBankItems);
	},
	get availableSlots() {
		return Flash.call(window.swf.BankSlots);
	},
	get usedSlots() {
		return Flash.call(window.swf.UsedBankSlots);
	},
	get totalSlots() {
		return Bank.availableSlots - Bank.usedSlots;
	},
	deposit: (name) => Flash.call(window.swf.TransferToBank, name),
	withdraw: (name) => Flash.call(window.swf.TransferToInventory, name),
	swap: (out_item, in_item) => Flash.call(window.swf.BankSwap, in_item, out_item),
	open() {
		Flash.call(window.swf.ShowBank);
	},
};

const Combat = {
	attack: (target) => Flash.call(window.swf.AttackMonster, target),
	useSkill: (idx) => Flash.call(window.swf.UseSkill, String(idx)),
	cancelTarget: () => Flash.call(window.swf.CancelTarget),
	cancelAutoAttack: () => Flash.call(window.swf.CancelAutoAttack),
};

const House = {
	get items() {
		return Flash.call(window.swf.GetHouseItems);
	},
	get totalSlots() {
		return Flash.call(window.swf.HouseSlots);
	},
};

const Inventory = {
	get items() {
		return Flash.call(window.swf.GetInventoryItems);
	},
	get totalSlots() {
		return Flash.call(window.swf.InventorySlots);
	},
	get usedSlots() {
		return Flash.call(window.swf.UsedInventorySlots);
	},
	get availableSlots() {
		return Inventory.totalSlots - Inventory.usedSlots;
	},
};

const Map = {
	get players() {
		return Flash.call(window.swf.Players);
	},
	get visibleMonsters() {
		return Flash.call(window.swf.GetVisibleMonstersInCell);
	},
	get availableMonsters() {
		return Flash.call(window.swf.GetMonstersInCell);
	},
	reload: () => Flash.call(window.swf.ReloadMap),
	get isLoading() {
		return !Flash.call(window.swf.MapLoadComplete);
	},
	get cells() {
		return Flash.call(window.swf.GetCells);
	},
	setSpawnpoint: () => Flash.call(window.swf.SetSpawnPoint),
	get roomId() {
		return Flash.call(window.swf.RoomId);
	},
	get roomNumber() {
		return Flash.call(window.swf.RoomNumber);
	},
	get name() {
		return Flash.call(window.swf.Map);
	},
	get position() {
		return Flash.call(window.swf.Position);
	},
	walkTo: (x, y) => Flash.call(window.swf.WalkToPoint, x, y),
	jump: (cell, pad = 'Spawn') => Flash.call(window.swf.Jump, cell, pad),
	join: (map_name, cell = 'Enter', pad = 'Spawn') => Flash.call(window.swf.Join, map_name, cell, pad),
	goto: (name) => Flash.call(window.swf.GoTo, name),
	get cell() {
		return Flash.call(window.swf.Cell);
	},
	get pad() {
		return Flash.call(window.swf.Pad);
	},
};

const TempInventory = {
	get items() {
		return Flash.call(window.swf.GetTempItems);
	},
};

const Quests = {
	get getQuestTree() {
		return Flash.call(window.swf.QuestTree);
	},
	accept: (questId) => Flash.call(window.swf.Accept, String(questId)),
	complete: (questId) => Flash.call(window.swf.Complete, String(questId)),
	load: (questIdOrIds) => {
		if (questIdOrIds.includes(',')) {
			Flash.call(window.swf.LoadQuests, questIdOrIds);
		} else {
			Flash.call(window.swf.LoadQuest, questIdOrIds);
		}
	},
	get(questIds) {
		Flash.call(window.swf.GetQuests, questIds.join(','));
	},
	isInProgress: (questId) => Flash.call(window.swf.IsInProgress, String(questId)),
	canComplete: (questId) => Flash.call(window.swf.CanComplete, String(questId)),
	isAvailable: (questId) => Flash.call(window.swf.IsAvailable, String(questId)),
};

const Player = {
	get bank() {
		return Bank;
	},
	get inventory() {
		return Inventory;
	},
	get house() {
		return House;
	},
	get tempInventory() {
		return TempInventory;
	},
	get factions() {
		return Flash.call(window.swf.GetFactions);
	},
	get quests() {
		return Quests;
	},
	get className() {
		return Flash.call(window.swf.Class);
	},
	get state() {
		return Flash.call(window.swf.State);
	},
	get hp() {
		return Flash.call(window.swf.Health);
	},
	get maxHp() {
		return Flash.call(window.swf.HealthMax);
	},
	get isAlive() {
		return Player.hp > 0;
	},
	get mp() {
		return Flash.call(window.swf.Mana);
	},
	get maxMp() {
		return Flash.call(window.swf.ManaMax);
	},
	get level() {
		return Flash.call(window.swf.Level);
	},
	get gold() {
		return Flash.call(window.swf.Gold);
	},
	get isAfk() {
		return Flash.call(window.swf.IsAfk);
	},
	get isMember() {
		return Flash.call(window.swf.IsMember);
	},
};

const Settings = {
	setInfiniteRange: () => Flash.call(window.swf.SetInfiniteRange),
	setProvokeMonsters: () => Flash.call(window.swf.SetProvokeMonsters),
	setEnemyMagnet: () => Flash.call(window.swf.SetEnemyMagnet),
	setLagKiller: (on) => Flash.call(window.swf.SetLagKiller, on ? 'True' : 'False'),
	hidePlayers: () => Flash.call(window.swf.DestroyPlayers),
	skipCutscenes: () => Flash.call(window.swf.SetSkipCutscenes),
};
