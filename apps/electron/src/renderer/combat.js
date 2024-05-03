class Combat {
	static attack(target) {
		Flash.call(window.swf.AttackMonster, target);
	}

	static useSkill(idx) {
		Flash.call(window.swf.UseSkill, String(idx));
	}

	static cancelTarget() {
		Flash.call(window.swf.CancelTarget);
	}

	static cancelAutoAttack() {
		Flash.call(window.swf.CancelAutoAttack);
	}
}
