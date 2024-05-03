class Flash {
	static call(fn, ...args) {
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
			console.error(error);
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
	}

	static get(path) {
		try {
			return window.swf.getGameObject(path);
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	static getStatic(path) {
		try {
			return window.swf.getGameObjectS(path);
		} catch (error) {
			console.error(error);
			return null;
		}
	}
}




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
