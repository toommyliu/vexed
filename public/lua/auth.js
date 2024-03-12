class auth {
	static is_logged_in() {
		try {
			return JSON.parse(window.swf.isLoggedIn());
		} catch {
			return false;
		}
	}

	static is_kicked() {
		try {
			return JSON.parse(window.swf.isKicked());
		} catch {
			return false;
		}
	}

	static get_servers() {
		try {
			return JSON.parse(window.swf.getGameObject('serialCmd.servers'));
		} catch {
			return [];
		}
	}

	static connect_to(server) {
		try {
			window.swf.connectToServer(server);
		} catch {}
	}

	static click_server(server) {
		try {
			return JSON.parse(window.swf.clickServer(server));
		} catch {}
	}
}

module.exports = auth;
