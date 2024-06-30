class Player {
	static get id() {
		return Flash.call(swf.UserID);
	}

	static get bank() {
		return Bank;
	}

	static get inventory() {
		return Inventory;
	}

	static get tempInventory() {
		return TempInventory;
	}

	static get house() {
		return House;
	}

	static get quests() {
		return null;
	}

	static get factions() {
		return Flash.call(swf.GetFactions);
	}

	static get username() {
		return Flash.call(swf.GetUsername);
	}

	static get password() {
		return Flash.call(swf.GetPassword);
	}

	static get className() {
		return Flash.call(swf.Class);
	}

	static get loggedIn() {
		return Flash.call(swf.IsLoggedIn);
	}

	static get cell() {
		return Flash.call(swf.Cell);
	}

	static get pad() {
		return Flash.call(swf.Pad);
	}

	static get state() {
		return Flash.call(swf.State);
	}

	static get hp() {
		return Flash.call(swf.Health);
	}

	static get maxHP() {
		return Flash.call(swf.HealthMax);
	}

	static get alive() {
		return Player.hp > 0;
	}

	static get mp() {
		return Flash.call(swf.Mana);
	}

	static get maxMP() {
		return Flash.call(swf.ManaMax);
	}

	static get map() {
		return Flash.call(swf.Map);
	}

	static get level() {
		return Flash.call(swf.Level);
	}

	static get gold() {
		return Flash.call(swf.Gold);
	}

	static hasTarget() {
		return Flash.call(swf.HasTarget);
	}

	static get allSkillsAvailable() {
		return Flash.call(swf.AllSkillsAvailable);
	}

	static get afk() {
		return Flash.call(swf.IsAfk);
	}

	static get position() {
		return Flash.call(swf.Position);
	}

	static get member() {
		return Flash.call(swf.IsMember);
	}

	static isSkillAvailable(index) {
		return Flash.call(swf.SkillAvailable, index) === 0;
	}

	static getSkillCooldown(index) {
		return Flash.call(swf.GetSkillCooldown, index);
	}

	static changeAccessLevel(al) {
		if (!['Non Member', 'Member', 'Moderator'].some((s) => s === al)) {
			return;
		}

		Flash.call(swf.ChangeAccessLevel, al);
	}

	static get accessLevel() {
		return Flash.call(swf.GetAccessLevel);
	}

	static walkTo(x, y) {
		Flash.call(swf.WalkToPoint, x, y);
	}

	static cancelAttack() {
		Flash.call(swf.CancelAutoAttack);
	}

	static cancelTarget() {
		Flash.call(swf.CancelTarget);
	}

	static attack(id) {
		if (
			["id'", 'id.', 'id:', 'id-'].some((prefix) => id.startsWith(prefix))
		) {
			const monMapID = id.substring(3);
			Flash.call(swf.AttackMonsterByMonMapId, monMapID);
			return;
		}
		Flash.call(swf.AttackMonster, id);
	}

	static setSpawnPoint() {
		Flash.call(swf.SetSpawnPoint);
	}

	static get targetHealth() {
		return Flash.call(swf.GetTargetHealth);
	}

	static jump(cell, pad = 'Spawn') {
		Flash.call(swf.Jump, cell, pad);
	}

	static rest() {
		Flash.call(swf.Rest);
	}

	static join(map, cell = 'Enter', pad = 'Spawn') {
		Flash.call(swf.Join, map, cell, pad);
	}

	static equip(id) {
		Flash.call(swf.Equip, id.toString());
	}

	static equipPotion(id, desc, file, name) {
		Flash.call(swf.EquipPotion, id, dessc, file, name);
	}

	static goto(name) {
		Flash.call(swf.GoTo, name);
	}

	static hasActiveBoost(boost) {
		return Flash.call(swf.HasActiveBoost, boost);
	}

	static useBoost(id) {
		Flash.call(swf.UseBoost, id);
	}

	static useSkill(id, force) {
		if (force) {
			Flash.call(swf.ForceUseSkill, id);
			return;
		}

		Flash.call(swf.UseSkill, id);
	}

	static getMapItem(id) {
		Flash.call(swf.GetMapItem, id);
	}

	static logout() {
		Flash.call(swf.Logout);
	}
}

const PlayerState = Object.freeze({
	Dead: 0,
	Idle: 1,
	InCombat: 2,
});

const AccessLevel = Object.freeze({
	NonMember: 'Non Member',
	Member: 'Member',
	Moderator: 'Moderator',
});

const Boost = Object.freeze({
	Gold: 'gold',
	Exp: 'xp',
	Rep: 'rep',
	Class: 'class',
});
