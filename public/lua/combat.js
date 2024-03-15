class combat {
	static approach_target() {
		try {
			window.swf.callGameFunction('world.approachTarget');
		} catch {}
	}

	static untarget_self() {
		try {
			window.swf.untargetSelf();
		} catch {}
	}

	static cancel_target() {
		try {
			window.swf.callGameFunction('world.cancelTarget');
		} catch {}
	}

	static cancel_auto_attack() {
		try {
			window.swf.callGameFunction('world.cancelAutoAttack');
		} catch {}
	}

	static attack_by_name(name) {
		try {
			window.swf.attackMonsterName(name);
		} catch {}
	}

	static attack_by_id(id) {
		try {
			window.swf.attackById(id);
		} catch {}
	}
}

module.exports = combat;
