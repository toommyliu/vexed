/**
 * Represents a game faction.
 */
class Faction {
	data: FactionData;

	constructor(data: FactionData) {
		/**
		 * Data about this faction.
		 * @type {FactionData}
		 */
		this.data = data;
	}

	/**
	 * The ID of the faction.
	 * @returns {number}
	 */
	get id() {
		return this.data.FactionID;
	}

	/**
	 * The in-game name of the faction.
	 * @returns {string}
	 */
	get name() {
		return this.data.sName;
	}

	/**
	 * The rank that the player has achieved in this faction.
	 * @returns {number}
	 */
	get rank() {
		return this.data.iRank;
	}

	/**
	 * The total amount of rep the player has for this faction.
	 * @returns {number}
	 */
	get totalRep() {
		return this.data.iRep;
	}

	/**
	 * The amount of rep the player has for their current rank.
	 * @returns {number}
	 */
	get rep() {
		return this.data.iSpillRep;
	}

	/**
	 * The total required rep for the player to rank up.
	 * @returns {number}
	 */
	get requiredRep() {
		return this.data.iRepToRank;
	}

	/**
	 * The remaining amount of rep required for the player to rank up.
	 * @type {number}
	 */
	get remainingRep() {
		return this.requiredRep - this.rep;
	}
}

export default Faction;

/**
 * @typedef {Object} FactionData
 * @property {string} CharFactionID
 * @property {string} sName The name of the faction.
 * @property {number} iRep The total amount of rep the player has for this faction.
 * @property {number} iSpillRep The amount of rep the player has for their current rank.
 * @property {number} iRank The rank that the player has achieved in this faction.
 * @property {string} FactionID The ID of the faction.
 * @property {number} iRepToRank The total required rep for the player to rank up.
 */
type FactionData = {
	CharFactionID: string;
	sName: string;
	iRep: number;
	iSpillRep: number;
	iRank: number;
	FactionID: string;
	iRepToRank: number;
};