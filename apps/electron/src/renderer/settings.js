class Settings {
	static setInfiniteRange() {
		Flash.call(window.swf.SetInfiniteRange);
	}

	static setProvokeMonsters() {
		Flash.call(window.swf.SetProvokeMonsters);
	}

	static setEnemyMagnet() {
		Flash.call(window.swf.SetEnemyMagnet);
	}

	static setLagKiller(on) {
		Flash.call(window.swf.SetLagKiller, on ? 'True' : 'False');
	}

	static hidePlayers() {
		Flash.call(window.swf.DestroyPlayers);
	}

	static skipCutscenes() {
		Flash.call(window.swf.SetSkipCutscenes);
	}
}
