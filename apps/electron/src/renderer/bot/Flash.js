class Flash {
	/**
	 * @param {Bot} instance
	 */
	constructor(instance) {
		this.instance = instance;
	}

	/**
	 * Calls a game function, whether this be an interop function or an internal function.
	 * @param {string|Function} fn
	 * @param  {...any} args
	 * @returns {any|null}
	 */
	call(fn, ...args) {
		// interop function?
		let _fn;
		let out;
		if (typeof fn === 'function') {
			_fn = fn;
		} else if (typeof fn === 'string') {
			_fn = args.length === 0 ? window.swf.callGameFunction0 : window.swf.callGameFunction;
		}

		// call it
		try {
			out = _fn(...args);
		} catch (error) {
			console.error(error);
			return null;
		}

		if (typeof out === 'string') {
			// boolean
			if (['"true"', '"false"'].includes(out.toLowerCase())) return out.toLowerCase() === '"true"';

			// void
			if (out === 'undefined') {
				return;
			}

			return JSON.parse(out);
		}

		return out;
	}

	/**
	 * Gets an actionscript object at the given location.
	 * @param {string} path - The path of the object, relative to Game.
	 * @param {boolean} [parse=false] - Whether to parse the return value.
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
	 * @param {string} path - The path of the object, relative to Game.
	 * @param {boolean} [parse=false] - Whether to parse the return value.
	 * @returns {any|null}
	 */
	getStatic(path, parse = false) {
		try {
			const out = window.swf.getGameObjectS(path);
			if (parse) return JSON.parse(out);
			return out;
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	/**
	 * Sets an actionscript object at the given location.
	 * @param {string} path - The path of the object, relative to Game.
	 * @param {any} value - The value to set.
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
