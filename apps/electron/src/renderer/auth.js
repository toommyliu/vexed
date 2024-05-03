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
			if (typeof username !== 'string') throw new Error('username must be a string');
			if (typeof password !== 'string') throw new Error('password must be a string');
			Flash.call(window.swf.FixLogin, username, password);
		} else {
			if (!Auth.username && !Auth.password) throw new Error('login manually once before calling Auth#login');
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
		return Flash.call(window.swf.ResetServers);
	}

	static connect(name) {
		if (typeof name !== 'string') throw new Error('server name must be a string');
		if (!Auth.servers.find((s) => s.sName.toLowerCase() === name.toLowerCase()))
			throw new Error('server name not found in list');

		Flash.call(window.swf.Connect, name);
	}
}
