function use_infinite_range() {
	try {
		window.swf.SetInfiniteRange();
	} catch {}
}

function set_provoke_monsters() {
	try {
		window.swf.SetProvokeMonsters();
	} catch {}
}

function set_enemy_magnet() {
	try {
		window.swf.SetEnemyMagnet();
	} catch {}
}

function hide_players() {
	try {
		window.swf.HidePlayers();
	} catch {}
}

function skip_cutscenes() {
	try {
		window.swf.SkipCutscenes();
	} catch {}
}

function set_fps(param1) {
	try {
		window.swf.SetFps(param1);
	} catch {}
}

module.exports = {
	use_infinite_range,
	set_provoke_monsters,
	set_enemy_magnet,
	hide_players,
	skip_cutscenes,
	set_fps
}