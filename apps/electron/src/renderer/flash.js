class Flash {
	static call(fn, ...args) {
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

	static get(path) {
		try {
			return window.swf.getGameObject(path);
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	static getStatic(path) {
		try {
			return window.swf.getGameObjectS(path);
		} catch (error) {
			console.error(error);
			return null;
		}
	}
}