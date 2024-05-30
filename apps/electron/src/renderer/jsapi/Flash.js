class Flash {
	/**
	 * @param {Bot} bot
	 */
	constructor(bot) {
		this.bot = bot;
	}

	/**
	 * Calls a game function, whether this be an interop function or an internal function.
	 * @param {string|Function} fn
	 * @param  {...any} args
	 * @returns {any|null}
	 */
	call(fn, ...args) {
		let _fn;
		let _args = args;
		let out;

		if (typeof fn === "function") {
			// interop function
			_fn = fn;
		} else if (typeof fn === "string") {
			// args[0] is the path
			// args[1-n] are the actual args for the game function
			_fn = args.length === 0 ? window.swf.callGameFunction0 : window.swf.callGameFunction;
			_args = [fn];
		}

		// call it
		try {
			out = _fn(..._args);
		} catch (error) {
			console.error(error);
			return null;
		}

		if (typeof out === "string") {
			// boolean
			if (['"True"', '"False"'].includes(out)) return out === '"True"';

			// void
			if (out === "undefined") return;

			return JSON.parse(out);
		}

		return out;
	}

	/**
	 * Gets an actionscript object at the given location.
	 * @param {string} path The path of the object, relative to Game.
	 * @param {boolean} [parse=false] Whether to call JSON.parse on the return value.
	 * @returns {any|null}
	 */
	get(path, parse = false) {
		try {
			const out = window.swf.getGameObject(path);
			if (parse) return JSON.parse(out);

			return out;
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	/**
	 * Gets an static actionscript object at the given location
	 * @param {string} path The path of the object, relative to Game.
	 * @param {boolean} [parse=false] Whether to call JSON.parse on the return value.
	 * @returns {any|null}
	 */
	getStatic(path, parse = false, defaultValue = null) {
		try {
			const out = window.swf.getGameObjectS(path);
			if (parse) return JSON.parse(out);

			return out;
		} catch (error) {
			console.error(error);
			return defaultValue;
		}
	}

	/**
	 * Sets an actionscript object at the given location.
	 * @param {string} path The path of the object, relative to Game.
	 * @param {any} value The value to set.
	 * @returns {void}
	 */
	set(path, value) {
		try {
			window.swf.setGameObject(path, value);
		} catch (error) {
			console.error(error);
		}
	}
}
