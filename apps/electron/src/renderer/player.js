
class Player {
	static get bank() {
		return Bank;
	}

	static get inventory() {
		return Inventory;
	}

	static get house() {
		return House;
	}

	static get tempInventory() {
		return TempInventory;
	}

	static get factions() {
		return Flash.call(window.swf.GetFactions);
	}

	static get quests() {
		return Quests;
	}

	static get className() {
		return Flash.call(window.swf.Class);
	}

	static get state() {
		return Flash.call(window.swf.State);
	}

	static get hp() {
		return Flash.call(window.swf.Health);
	}

	static get maxHp() {
		return Flash.call(window.swf.HealthMax);
	}

	static get isAlive() {
		return Player.hp > 0;
	}

	static get mp() {
		return Flash.call(window.swf.Mana);
	}

	static get maxMp() {
		return Flash.call(window.swf.ManaMax);
	}

	static get level() {
		return Flash.call(window.swf.Level);
	}

	static get gold() {
		return Flash.call(window.swf.Gold);
	}

	static get isAfk() {
		return Flash.call(window.swf.IsAfk);
	}

	static get isMember() {
		return Flash.call(window.swf.IsMember);
	}
}