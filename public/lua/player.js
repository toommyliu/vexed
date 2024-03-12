function cls() {
	try {
		return JSON.parse(window.swf.Class());
	} catch {
		return null;
	}
}

function state() {
	try {
		return JSON.parse(window.swf.State());
	} catch {
		return null;
	}
}

function health() {
	try {
		return Number.parseInt(window.swf.Health(), 10);
	} catch {
		return null;
	}
}

function maxHealth() {
	try {
		return Number.parseInt(window.swf.HealthMax(), 10);
	} catch {
		return null;
	}
}

function mana() {
	try {
		return Number.parseInt(window.swf.Mana(), 10);
	} catch {
		return null;
	}
}

function maxMana() {
	try {
		return Number.parseInt(window.swf.ManaMax(), 10);
	} catch {
		return null;
	}
}

function map() {
	try {
		return JSON.parse(window.swf.Map());
	} catch {
		return null;
	}
}

function level() {
	try {
		return Number.parseInt(window.swf.Level(), 10);
	} catch {
		return null;
	}
}

function gold() {
	try {
		return Number.parseInt(window.swf.Gold(), 10);
	} catch {
		return null;
	}
}

function hasTarget() {
	try {
		return JSON.parse(window.swf.HasTarget());
	} catch {
		return false;
	}
}

function isAfk() {
	try {
		return JSON.parse(window.swf.IsAfk());
	} catch {
		return false;
	}
}

function allSkillsAvailable() {
	try {
		return JSON.parse(window.swf.AllSkillsAvailable());
	} catch {
		return false;
	}
}

function isSkillAvailable(idx) {
	try {
		return window.swf.SkillAvailable(idx);
	} catch {
		return false;
	}
}

function position() {
	try {
		// [x,y]
		return JSON.parse(window.swf.Position());
	} catch {
		return null;
	}
}

function walk(x, y) {
	try {
		window.swf.WalkToPoint(x, y);
	} catch {}
}

function cancelAutoAttack() {
	try {
		window.swf.CancelAutoAttack();
	} catch {}
}

function cancelTarget() {
	try {
		window.swf.CancelTarget();
	} catch {}
}

function cancelTargetSelf() {
	try {
		window.swf.CancelTargetSelf();
	} catch {}
}

function toggleMute() {
	try {
		window.swf.ToggleMute();
	} catch {}
}

function attack(param1) {
	try {
		window.swf.Attack(param1);
	} catch {}
}

function rest() {
	try {
		window.swf.Rest();
	} catch {}
}

function join(map, cell, pad) {
	if (!cell) {
		cell = 'Enter';
	}

	if (!pad) {
		pad = 'Spawn';
	}

	try {
		window.swf.Join(map, cell, pad);
	} catch {}
}

function equip(param1 /* item id */) {
	try {
		window.swf.Equip(param1);
	} catch {}
}

function equipPotion(param1 /* item id */, param2 /* desc */, param3 /* file */, param4 /* name */) {
	try {
		window.swf.EquipPotion(param1, param2, param3, param4);
	} catch {}
}

function goto(param1) {
	try {
		window.swf.Goto(param1);
	} catch {}
}

function useBoost(param1) {
	try {
		window.swf.UseBoost(param1);
	} catch {}
}

function useSkill(param1) {
	try {
		window.swf.UseSkill(param1);
	} catch {}
}

function forceUseSkill(param1) {
	try {
		window.swf.ForceUseSkill(param1);
	} catch {}
}

function getMapItem(param1) {
	try {
		return JSON.parse(window.swf.GetMapItem(param1));
	} catch {
		return null;
	}
}

function hasActiveBoost() {
	try {
		return JSON.parse(window.swf.HasActiveBoost());
	} catch {
		return false;
	}
}

function userId() {
	try {
		return JSON.parse(window.swf.UserId());
	} catch {
		return null;
	}
}

function charId() {
	try {
		return JSON.parse(window.swf.CharId());
	} catch {
		return null;
	}
}

function gender() {
	try {
		return JSON.parse(window.swf.Gender());
	} catch {
		return null;
	}
}

function setEquip(param1, param2) {
	try {
		window.swf.SetEquip(param1, param2);
	} catch {}
}

function getEquip() {
	try {
		return window.swf.GetEquip();
	} catch {
		return null;
	}
}

function buff() {
	try {
		window.swf.Buff();
	} catch {}
}

function get() {
	try {
		return window.swf.PlayerData();
	} catch {
		return null;
	}
}

function factions() {
	try {
		return JSON.parse(window.swf.GetFactions());
	} catch {
		return null;
	}
}

function changeName(param1) {
	try {
		window.swf.ChangeName(param1);
	} catch {}
}

function changeGuild(param1) {
	try {
		window.swf.ChangeGuild(param1);
	} catch {}
}

function setTargetPlayer(param1 /* player name */) {
	try {
		window.swf.SetTargetPlayer(param1);
	} catch {}
}

function changeAccessLevel(param1) {
	/**
	 * "Non Member"
	 * "Member"
	 * "Moderator", "60"
	 * "30"
	 * "40"
	 * "50"
	 */
	try {
		window.swf.ChangeAccessLevel(param1);
	} catch {}
}

function getTargetHealth() {
	try {
		return Number.parseInt(window.swf.TargetHealth(), 10);
	} catch {
		return null;
	}
}

function isPlayerInMyCell(param1) {
	try {
		return JSON.parse(window.swf.CheckPlayerInMyCell(param1));
	} catch {
		return false;
	}
}

function getSkillCooldown(param1) {
	try {
		return Number.parseInt(window.swf.GetSkillCooldown(param1), 10);
	} catch {
		return null;
	}
}

function setSkillCooldown(param1, param2) {
	try {
		window.swf.SetSkillCooldown(param1, param2);
	} catch {}
}

function setSkillRange(param1, param2) {
	try {
		window.swf.SetSkillRange(param1, param2);
	} catch {}
}

function setSkillMana(param1, param2) {
	try {
		window.swf.SetSkillMana(param1, param2);
	} catch {}
}

function setTargetPvp(param1) {
	try {
		window.swf.SetTargetPvp(param1);
	} catch {}
}

function getAvatars() {
	try {
		return JSON.parse(window.swf.Avatars());
	} catch {
		return null;
	}
}

function isMember() {
	try {
		return JSON.parse(window.swf.IsMember());
	} catch {
		return false;
	}
}

function isAvatarReady() {
	try {
		return JSON.parse(window.swf.IsAvatarLoadComplete());
	} catch {
		return false;
	}
}

module.exports = {
	cls,
	state,
	health,
	maxHealth,
	mana,
	maxMana,
	map,
	level,
	gold,
	hasTarget,
	join,
	isAfk,
	allSkillsAvailable,
	isSkillAvailable,
	position,
	walk,
	cancelAutoAttack,
	cancelTarget,
	cancelTargetSelf,
	toggleMute,
	attack,
	rest,
	equip,
	equipPotion,
	goto,
	useBoost,
	useSkill,
	forceUseSkill,
	getMapItem,
	hasActiveBoost,
	userId,
	charId,
	gender,
	setEquip,
	getEquip,
	buff,
	get,
	factions,
	changeName,
	changeGuild,
	setTargetPlayer,
	changeAccessLevel,
	getTargetHealth,
	isPlayerInMyCell,
	getSkillCooldown,
	setSkillCooldown,
	setSkillRange,
	setSkillMana,
	setTargetPvp,
	getAvatars,
	isMember,
	isAvatarReady,
};
