// function logged_in() {
// 	try {
// 		return JSON.parse(window.swf.IsLoggedIn());
// 	} catch {
// 		return false;
// 	}
// }

// function logout() {
// 	try {
// 		window.swf.Logout();
// 	} catch {}
// }

// function get_server_name() {
// 	try {
// 		return window.swf.ServerName();
// 	} catch {
// 		return null;
// 	}
// }

// function is_temp_kicked() {
// 	try {
// 		return JSON.parse(window.swf.IsTempKicked());
// 	} catch {
// 		return false;
// 	}
// }

// function get_servers() {
// 	try {
// 		return window.swf.getGameObject('serialCmd.servers');
// 	} catch {
// 		return [];
// 	}
// }

// function connect(param1) {
// 	try {
// 		window.swf.Connect(param1);
// 	} catch {}
// }

// function login(param1, param2) {
// 	try {
// 		window.swf.FixLogin(param1, param2);
// 	} catch {}
// }

// module.exports = {
// 	logged_in,
// 	logout,
// 	get_server_name,
// 	is_temp_kicked,
// 	get_servers,
// 	connect,
// 	login,
// };

class auth {
	static is_logged_in() {
		try {
			return JSON.parse(window.swf.isLoggedIn());
		} catch {
			return false;
		}
	}
}

module.exports = auth;