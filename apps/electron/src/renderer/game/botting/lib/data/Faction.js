class Faction {
	/**
	 * @type {FactionData}
	 */
	#data;

	constructor(data) {
		this.#data = data;
	}

	/**
	 * The ID of the faction.
	 * @type {number}
	 * @readonly
	 */
	get id() {
		return Number.parseInt(this.#data.FactionID, 10);
	}

	/**
	 * The in-game name of the faction.
	 * @type {string}
	 * @readonly
	 */
	get name() {
		return this.#data.sName;
	}

	/**
	 * The rank that the player has achieved in this faction.
	 * @type {number}
	 * @readonly
	 */
	get rank() {
		return this.#data.iRank;
	}

	/**
	 * The total amount of rep the player has for this faction.
	 * @type {number}
	 * @readonly
	 */
	get totalRep() {
		return this.#data.iRep;
	}

	/**
	 * The amount of rep the player has for their current rank.
	 * @type {number}
	 * @readonly
	 */
	get rep() {
		return this.#data.iSpillRep;
	}

	/**
	 * The total required rep for the player to rank up.
	 * @type {number}
	 * @readonly
	 */
	get requiredRep() {
		return this.#data.iRepToRank;
	}

	/**
	 * The remaining amount of rep required for the player to rank up.
	 * @type {number}
	 * @readonly
	 */
	get remainingRep() {
		return this.requiredRep - this.rep;
	}
}

/**
 * @typedef {Object} FactionData
 * @property {number} FactionID
 * @property {string} sName
 * @property {number} iRank
 * @property {number} iRep
 * @property {number} iSpillRep
 * @property {number} iRepToRank
 */
