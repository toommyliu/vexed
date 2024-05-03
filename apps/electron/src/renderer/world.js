
class World {
	static get players() {
		return Flash.call(window.swf.Players);
	}

	static get visibleMonsters() {
		return Flash.call(window.swf.GetVisibleMonstersInCell);
	}

	static get availableMonsters() {
		return Flash.call(window.swf.GetMonstersInCell);
	}

	static reload() {
		Flash.call(window.swf.ReloadMap);
	}

	static get isLoading() {
		return !Flash.call(window.swf.MapLoadComplete);
	}

	static get cells() {
		return Flash.call(window.swf.GetCells);
	}

	static setSpawnpoint() {
		Flash.call(window.swf.SetSpawnPoint);
	}

	static get roomId() {
		return Flash.call(window.swf.RoomId);
	}

	static get roomNumber() {
		return Flash.call(window.swf.RoomNumber);
	}

	static get name() {
		return Flash.call(window.swf.Map);
	}

	static get position() {
		return Flash.call(window.swf.Position);
	}

	static walkTo(x, y) {
		Flash.call(window.swf.WalkToPoint, x, y);
	}

	static jump(cell, pad = 'Spawn') {
		Flash.call(window.swf.Jump, cell, pad);
	}

	static join(map_name, cell = 'Enter', pad = 'Spawn') {
		Flash.call(window.swf.Join, map_name, cell, pad);
	}

	static goto(name) {
		Flash.call(window.swf.GoTo, name);
	}

	static get cell() {
		return Flash.call(window.swf.Cell);
	}

	static get pad() {
		return Flash.call(window.swf.Pad);
	}
}