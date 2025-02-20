type ConditionalReturn<T> = T extends any ? T : T | null;

/**
 * Utilities to make interacting with the Flash api easier.
 */
export class Flash {
	/**
	 * Calls a game function, whether this be an interop function or an internal function. If "fn" is a string, it will be treated as an actionscript path.
	 *
	 * @param fn - The function to call.
	 * @param args - The arguments to pass to the function.
	 * @returns If the provided function returned a value, it will be conditionally parsed to a primitive based on its result. Otherwise, null is returned.
	 */
	public call<T>(fn: Function | string, ...args: any[]): T;
	public call(fn: Function | string, ...args: any[]): any | null;
	public call<T = any>(
		fn: Function | string,
		...args: any[]
	): ConditionalReturn<T> {
		let _fn: Function;
		let _args = args;
		let out: any;

		if (typeof fn === 'function') {
			// interop function
			_fn = fn;
		} else if (typeof fn === 'string') {
			// args[0] is the path
			_fn =
				args.length === 0
					? // eslint-disable-next-line @typescript-eslint/unbound-method
						swf.callGameFunction0
					: // eslint-disable-next-line @typescript-eslint/unbound-method
						swf.callGameFunction;
			// args[1-n] are the actual args for the function
			_args = [fn, ...args];
		}

		// call it
		try {
			out = _fn!(..._args);
		} catch {
			return null as ConditionalReturn<T>;
		}

		if (typeof out === 'string') {
			// boolean
			if (['"True"', '"False"'].includes(out)) {
				return (out === '"True"') as ConditionalReturn<T>;
			}

			// void
			if (out === 'undefined') {
				return undefined as ConditionalReturn<T>;
			}

			if (out.startsWith('{') || out.startsWith('['))
				return JSON.parse(out) as ConditionalReturn<T>;

			return out as ConditionalReturn<T>;
		}

		return out as ConditionalReturn<T>;
	}

	/**
	 * Gets an actionscript object at the given location.
	 *
	 * @param path - The path of the object, relative to Game.
	 * @param parse - Whether to call JSON.parse on the return value.
	 */
	public get<T = any>(path: string, parse = false): T | null {
		try {
			const out = swf.getGameObject(path);
			if (parse) {
				return JSON.parse(out) as T;
			}

			return out as T;
		} catch {
			return null;
		}
	}

	/**
	 * Gets an actionscript object at the given location.
	 *
	 * @param path - The path of the object, relative to Game.
	 * @param parse -  Whether to call JSON.parse on the return value.
	 */
	public getStatic<T = any>(
		path: string,
		parse = false,
		defaultValue = null,
	): T | null {
		try {
			const out = swf.getGameObjectS(path);
			if (parse) {
				return JSON.parse(out) as T;
			}

			return out as T;
		} catch {
			return defaultValue;
		}
	}

	/**
	 * Sets an actionscript object at the given location.
	 *
	 * @param path - The path of the object, relative to Game.
	 * @param value - The value to set.
	 */
	public set(path: string, value: any): void {
		try {
			swf.setGameObject(path, value);
		} catch {}
	}

	/**
	 * Determines whether an actionscript path is null.
	 *
	 * @param path - The path of the game object.
	 */
	public isNull(path: string): boolean {
		return this.call(() => swf.isNull(path));
	}
}
