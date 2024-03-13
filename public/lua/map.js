class map {
	static get_cell() {
		try {
			return JSON.parse(window.swf.getGameObject('world.strFrame'));
		} catch {
			return undefined;
		}
	}

	static get_pad() {
		try {
			return JSON.parse(window.swf.getGameObject('world.strPad'));
		} catch {
			return undefined;
		}
	}

	static get_name() {
		try {
			return JSON.parse(window.swf.getGameObject('world.strMapName'));
		} catch {
			return undefined;
		}
	}

	static get_id() {
		try {
			return JSON.parse(window.swf.getGameObject('world.curRoom'));
		} catch {
			return undefined;
		}
	}

	static get_player_count() {
		try {
			return JSON.parse(window.swf.getGameObject('world.areaUsers.length'));
		} catch {
			return undefined;
		}
	}

	static get_players() {
		try {
			return JSON.parse(window.swf.getGameObject('world.areaUsers'));
		} catch {
			return undefined;
		}
	}

	static is_loaded() {
		try {
			const inProgress = JSON.parse(window.swf.getGameObject('world.mapLoadInProgress'));
			const isNull = JSON.parse(window.swf.isNull('mcConnDetail.stage'));
			return !inProgress && isNull;
		} catch {
			return undefined;
		}
	}

	static get_cells() {
		try {
			const ret = JSON.parse(window.swf.getGameObject('world.map.currentScene.labels'));
			return ret.map((cell) => cell.name);
		} catch {
			return undefined;
		}
	}

	static jump(cell, pad, autoCorrect = true, clientOnly = false) {
		try {
			window.swf.jumpCorrectRoom(cell, pad, autoCorrect, clientOnly);
		} catch {}
	}

	static join(map, cell = 'Enter', pad = 'Spawn') {
		try {
			window.swf.callGameFunction('world.gotoTown', map, cell, pad);
		} catch {}
	}

	static reload() {
		try {
			window.swf.callGameFunction('world.reloadCurrentMap');
		} catch {}
	}

	static get_item(id) {
		try {
			window.swf.callGameFunction('world.getMapItem', id);
		} catch {
			return undefined;
		}
	}

	// TODO: get map items by using FFDEC

	static walk_to(x, y, speed = 8) {
		try {
			window.swf.walkTo(x, y, speed);
		} catch {}
	}

	static set_spawn_point(cell, pad) {
		try {
			window.swf.callGameFunction('world.setSpawnPoint', cell, pad);
		} catch {}
	}
}

module.exports = map;
