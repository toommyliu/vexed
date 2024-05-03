class Auth {
	static get username() {
		if (!Auth.loggedIn) return null;
		return Flash.call(window.swf.GetUsername);
	}

	static get password() {
		if (!Auth.loggedIn) return null;
		return Flash.call(window.swf.GetPassword);
	}

	static get loggedIn() {
		return Flash.call(window.swf.IsLoggedIn);
	}

	static login(username, password) {
		if (username && password) {
			Flash.call(window.swf.FixLogin, username, password);
		} else {
			Flash.call(window.swf.Login);
		}
	}

	static logout() {
		Flash.call(window.swf.Logout);
	}

	static get servers() {
		return Flash.call(window.swf.getGameObject, 'serialCmd.servers');
	}

	static resetServers() {
		Flash.call(window.swf.ResetServers);
	}

	static connect(name) {
		Flash.call(window.swf.Connect, name);
	}
}
