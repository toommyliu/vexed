const map = require('./map');
const inventory = require('./inventory');

class player {
	static get_uid() {
		try {
			return JSON.parse(window.swf.getGameObject('world.myAvatar.uid'));
		} catch {
			return undefined;
		}
	}

	static get_xp() {
		try {
			return JSON.parse(window.swf.getGameObject('world.myAvatar.objData.intExp'));
		} catch {
			return undefined;
		}
	}

	static get_required_xp() {
		try {
			return JSON.parse(window.swf.getGameObject('world.myAvatar.objData.intExpToLevel'));
		} catch {
			return undefined;
		}
	}

	static get_state() {
		try {
			return JSON.parse(window.swf.getGameObject('world.myAvatar.dataLeaf.intState'));
		} catch {
			return undefined;
		}
	}

	static is_in_combat() {
		try {
			return player.get_state() === 2;
		} catch {
			return undefined;
		}
	}

	static is_alive() {
		try {
			return player.get_state() > 0;
		} catch {
			return undefined;
		}
	}

	static is_playing() {
		try {
			return window.swf.isLoggedIn() && player.is_alive();
		} catch {
			return false;
		}
	}

	static get_guild() {
		try {
			return JSON.parse(window.swf.getGameObject('world.myAvatar.objData.guild.Name'));
		} catch {
			return undefined;
		}
	}

	static get_hp() {
		try {
			return JSON.parse(window.swf.getGameObject('world.myAvatar.dataLeaf.intHP'));
		} catch {
			return undefined;
		}
	}

	static get_max_hp() {
		try {
			return JSON.parse(window.swf.getGameObject('world.myAvatar.dataLeaf.intHPMax'));
		} catch {
			return undefined;
		}
	}

	static get_mana() {
		try {
			return JSON.parse(window.swf.getGameObject('world.myAvatar.dataLeaf.intMP'));
		} catch {
			return undefined;
		}
	}

	static get_max_mana() {
		try {
			return JSON.parse(window.swf.getGameObject('world.myAvatar.dataLeaf.intMPMax'));
		} catch {
			return undefined;
		}
	}

	static get_level() {
		try {
			return JSON.parse(window.swf.getGameObject('world.myAvatar.dataLeaf.intLevel'));
		} catch {
			return undefined;
		}
	}

	static get_gold() {
		try {
			return JSON.parse(window.swf.getGameObject('world.myAvatar.objData.intGold'));
		} catch {
			return undefined;
		}
	}

	static get_class_rank() {
		try {
			return JSON.parse(window.swf.getGameObject('world.myAvatar.objData.iRank'));
		} catch {
			return undefined;
		}
	}

	static is_loaded() {
		try {
			const items = window.swf.getGameObject('world.myAvatar.items.length');
			const map_loading = map.is_loaded();
			const art_loaded = window.swf.callGameFunction('world.myAvatar.pMC.artLoaded');
			return items > 0 && !map_loading && art_loaded;
		} catch {
			return false;
		}
	}

	static get_access_level() {
		try {
			return JSON.parse(window.swf.getGameObject('world.myAvatar.objData.intAccessLevel'));
		} catch {
			return undefined;
		}
	}

	static set_access_level(level) {
		try {
			window.swf.setGameObject('world.myAvatar.objData.intAccessLevel', level);
		} catch {}
	}

	static is_afk() {
		try {
			return JSON.parse(window.swf.getGameObject('world.myAvatar.dataLeaf.afk'));
		} catch {
			return false;
		}
	}

	static get_position() {
		try {
			const x = JSON.parse(window.swf.getGameObject('world.myAvatar.pMC.x'));
			const y = JSON.parse(window.swf.getGameObject('world.myAvatar.pMC.y'));

			return { x, y };
		} catch {
			return undefined;
		}
	}

	static get_walk_speed() {
		try {
			return JSON.parse(window.swf.getGameObject('world.WALKSPEED'));
		} catch {
			return undefined;
		}
	}

	static get_scale() {
		try {
			return JSON.parse(window.swf.getGameObject('world.SCALE'));
		} catch {
			return undefined;
		}
	}

	// TODO:
	static set_scale(scale) {
		try {
			return window.swf.callGameFunction('world.SCALE', scale);
		} catch {
			return undefined;
		}
	}

	static get_target() {
		try {
			return JSON.parse(window.swf.getGameObject('world.myAvatar.target.objData'));
		} catch {
			return undefined;
		}
	}

	static get_stats() {
		try {
			return JSON.parse(window.swf.getGameObject('world.myAvatar.dataLeaf.sta'));
		} catch {
			return undefined;
		}
	}

	static rest() {
		try {
			window.swf.callGameFunction('world.rest');
		} catch {}
	}

	static get_class() {
		try {
			return inventory.get_items()?.find((item) => item.bEquip && item.sType === 'Class')?.sName;
		} catch {
			return undefined;
		}
	}
}

module.exports = player;
