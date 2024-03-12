function get_cell() {
	try {
		return JSON.parse(window.swf.Cell());
	} catch {
		return null;
	}
}

function get_pad() {
	try {
		return JSON.parse(window.swf.Pad());
	} catch {
		return null;
	}
}

function get_cells() {
	try {
		return JSON.parse(window.swf.GetCells());
	} catch {
		return [];
	}
}

function get_room_id() {
	try {
		return JSON.parse(window.swf.RoomId());
	} catch {
		return null;
	}
}

function get_room_number() {
	try {
		return JSON.parse(window.swf.RoomNumber());
	} catch {
		return -1;
	}
}

function get_players() {
	try {
		return JSON.parse(window.swf.Players());
	} catch {
		return [];
	}
}

function get_player(param1) {
	try {
		return JSON.parse(window.swf.GetPlayer(param1));
	} catch {
		return null;
	}
}

function is_player_in_cell(param1, param2) {
	try {
		return JSON.parse(window.swf.CheckPlayerCell(param1, param2));
	} catch {
		return false;
	}
}

function get_room_name() {
	try {
		const res = JSON.parse(swf.getGameObject('world.strAreaName'));
		return res.split('-')[0];
	} catch {
		return null;
	}
}

module.exports = {
	get_cell,
	get_pad,
	get_cells,
	get_room_id,
	get_room_name,
	get_room_number,
	get_players,
	get_player,
	is_player_in_cell,
};
