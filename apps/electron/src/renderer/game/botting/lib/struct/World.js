class World {
	static isMonsterAvailable(id) {
		if (
			["id'", 'id.', 'id:', 'id-'].some((prefix) => id.startsWith(prefix))
		) {
			const monMapID = id.substring(3);
			return Flash.call(swf.IsMonsterAvailableByMonMapID, monMapID);
		}

		return Flash.call(swf.IsMonsterAvailable, id);
	}

	static get players() {
		return Flash.call(swf.Players);
	}

	static get cellMonsters() {
		return Flash.call(swf.GetMonstersInCell);
	}

	static get mapMonsters() {
		return JSON.parse(swf.selectArrayObjects('world.monsters', 'objData'));
	}

	static reload() {
		Flash.call(swf.ReloadMap);
	}

	static loadSWF(swf) {
		Flash.call(swf.LoadMap, swf);
	}

	static get loading() {
		return !Flash.call(swf.MapLoadComplete);
	}

	static get cells() {
		return Flash.call(swf.GetCells);
	}

	static get id() {
		return Flash.call(swf.RoomId);
	}

	static get roomNumber() {
		return Flash.call(swf.RoomNumber);
	}

	static isActionAvailable(action) {
		return Flash.call(swf.IsActionAvailable, action);
	}
}

const GameAction = Object.freeze({
	/** Loading a shop. */
	LoadShop: 'loadShop',
	/** Loading an enhancement shop. */
	LoadEnhShop: 'loadEnhShop',
	/** Loading a hair shop. */
	LoadHairShop: 'loadHairShop',
	/** Equipping an item. */
	EquipItem: 'equipItem',
	/** Unequipping an item. */
	UnequipItem: 'unequipItem',
	/** Buying an item. */
	BuyItem: 'buyItem',
	/** Selling an item. */
	SellItem: 'sellItem',
	/** Getting a map item (i.e. via the getMapItem packet). */
	GetMapItem: 'getMapItem',
	/** Sending a quest completion packet. */
	TryQuestComplete: 'tryQuestComplete',
	/** Accepting a quest. */
	AcceptQuest: 'acceptQuest',
	/** I don't know... */
	DoIA: 'doIA',
	/** Resting. */
	Rest: 'rest',
	/** I don't know... */
	Who: 'who',
	/** Joining another map. */
	Transfer: 'tfer',
});
