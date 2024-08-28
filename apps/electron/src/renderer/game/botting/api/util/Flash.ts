/**
 * Utilities to make interacting with the Flash api easier.
 */
class Flash {
	/**
	 * Calls a game function, whether this be an interop function or an internal function. If "fn" is a string, it will be treated as an actionscript path.
	 * @param {string|Function} fn The function to call.
	 * @param  {...any} args The arguments to pass to the function.
	 * @returns {any|null} If the provided function returned a value, it will be conditionally parsed to a primitive based on its result. Otherwise, null is returned.
	 */
	call(fn: string | Function, ...args: any[]): any | null {
		let _fn;
		let _args = args;
		let out;

		if (typeof fn === 'function') {
			// interop function
			_fn = fn;
		} else if (typeof fn === 'string') {
			// args[0] is the path
			_fn =
				args.length === 0
					? swf.callGameFunction0
					: swf.callGameFunction;
			// args[1-n] are the actual args for the function
			_args = [fn, ...args];
		}

		// call it
		try {
			out = _fn(..._args);
		} catch (error) {
			// console.error(error);
			return null;
		}

		if (typeof out === 'string') {
			// boolean
			if (['"True"', '"False"'].includes(out)) {
				return out === '"True"';
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
	 * Gets an actionscript object at the given location.
	 * @param {string} path The path of the object, relative to Game.
	 * @param {boolean} [parse=false] Whether to call JSON.parse on the return value.
	 * @returns {any|null}
	 */
	get(path: string, parse = false): any | null {
		try {
			const out = swf.getGameObject(path);
			if (parse) {
				return JSON.parse(out);
			}

			return out;
		} catch (error) {
			//console.error(error);
			return null;
		}
	}

	/**
	 * Gets an actionscript object at the given location
	 * @param {string} path The path of the object, relative to Game.
	 * @param {boolean} [parse=false] Whether to call JSON.parse on the return value.
	 * @returns {any|null}
	 */
	getStatic(path: string, parse = false, defaultValue = null): any | null {
		try {
			const out = swf.getGameObjectS(path);
			if (parse) {
				return JSON.parse(out);
			}

			return out;
		} catch (error) {
			// console.error(error);
			return defaultValue;
		}
	}

	/**
	 * Sets an actionscript object at the given location.
	 * @param {string} path The path of the object, relative to Game.
	 * @param {any} value The value to set.
	 * @returns {void}
	 */
	set(path: string, value: any): void {
		try {
			swf.setGameObject(path, value);
		} catch (error) {
			// console.error(error);
		}
	}

	/**
	 * Determines whether an actionscript path is null.
	 * @param {string} path The path of the game object.
	 * @returns {boolean}
	 */
	isNull(path: string): boolean {
		return this.call(swf.isNull, path);
	}
}

export default Flash;
