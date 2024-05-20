class Collection extends Map {
	/**
	 * Similar to Array#find, but for Maps.
	 * @param {Function} fn - The function to test each value.
	 */
	find(fn) {
		for (const [key, val] of this) {
			if (fn(val, key, this)) return val;
		}

		return undefined;
	}

	/**
	 * Similar to Array#findKey, but for Maps.
	 * @param {Function} fn - The function to test each value.
	 */
	findKey(fn) {
		for (const [key, val] of this) {
			if (fn(val, key, this)) return key;
		}

		return undefined;
	}
}
