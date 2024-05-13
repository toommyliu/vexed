class Flash {
	/**
	 * @param {Bot} instance
	 */
	constructor(instance) {
		this.instance = instance;
	}

	/**
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
			if (out?.toLowerCase() === '"true"' || out?.toLowerCase() === '"false"') {
				return out.toLowerCase() === '"true"';
			}

			// void
			if (out === 'undefined') {
				return;
			}

			return JSON.parse(out);
		}

		return out;
	}

	/**
	 * @param {string} path
	 * @param {boolean} [parse=false]
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
	 * @param {string} path
	 * @param {boolean} [parse=false]
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
	 * @param {string} path
	 * @param {any} value
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
