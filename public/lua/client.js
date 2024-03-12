class client {
	static use_infinite_range() {
		try {
			window.swf.infiniteRange();
		} catch {}
	}

	static disable_death_ads(enable) {
		try {
			window.swf.disableDeathAd(enable);
		} catch {}
	}

	static skip_cutscenes() {
		try {
			window.swf.skipCutscenes();
		} catch {}
	}

	static hide_players(enable) {
		try {
			window.swf.hidePlayers(enable);
		} catch {}
	}

	static magnetize() {
		try {
			window.swf.magnetize();
		} catch {}
	}

	static disable_fx(enable) {
		try {
			window.swf.disableFX(enable);
		} catch {}
	}

	static kill_lag(enable) {
		try {
			window.swf.killLag(enable);
		} catch {}
	}
}

module.exports = client;
