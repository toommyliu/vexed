/**
 * Represents a monster.
 */
class Monster {
	data: MonsterData;

	constructor(data: MonsterData) {
		/**
		 * Data about this monster.
		 * @type {MonsterData}
		 */
		this.data = data;
	}

	/**
	 * The monMapID of the monster.
	 * @returns {number}
	 */
	get monMapID() {
		return this.data.MonMapID;
	}

	/**
	 * The global ID of the monster.
	 * @returns {number}
	 */
	get id() {
		return this.data.MonID;
	}

	/**
	 * The level of the monster.
	 * @returns {number}
	 */
	get level() {
		return this.data.iLvl;
	}

	/**
	 * The state of the monster.
	 * @returns {number}
	 */
	get state() {
		return this.data.intState;
	}

	/**
	 * The race of the monster.
	 * @returns {string}
	 */
	get race() {
		return this.data.sRace;
	}

	/**
	 * The name of the monster.
	 * @returns {string}
	 */
	get name() {
		return this.data.strMonName;
	}

	/**
	 * The monster's current HP.
	 * @returns {number}
	 */
	get hp() {
		return this.data.intHP;
	}

	/**
	 * The monster's max HP.
	 * @returns {number}
	 */
	get maxHP() {
		return this.data.intHPMax;
	}

	/**
	 * Whether the monster is alive.
	 * @returns {boolean}
	 */
	get alive() {
		return this.hp > 0;
	}
}

export default Monster;

/**
 * @typedef {Object} MonsterData
 * @property {number} MonMapID
 * @property {number} iLvl
 * @property {number} intState
 * @property {string} sRace
 * @property {string} strMonName
 * @property {number} intHP
 * @property {number} MonID
 * @property {number} intHPMax
 */
type MonsterData = {
	MonMapID: number;
	iLvl: number;
	intState: number;
	sRace: string;
	strMonName: string;
	intHP: number;
	MonID: number;
	intHPMax: number;
};
