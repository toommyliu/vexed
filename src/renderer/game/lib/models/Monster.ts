/**
 * Represents a monster.
 */
export class Monster {
	public constructor(
		/**
		 * Data about this monster.
		 */ public data: MonsterData,
	) {}

	/**
	 * The monMapID of the monster.
	 */
	public get monMapId(): number {
		return this.data.MonMapID;
	}

	/**
	 * The global ID of the monster.
	 */
	public get id(): number {
		return this.data.MonID;
	}

	/**
	 * The level of the monster.
	 */
	public get level(): number {
		return this.data.iLvl;
	}

	/**
	 * The state of the monster.
	 */
	public get state(): number {
		return this.data.intState;
	}

	/**
	 * The race of the monster.
	 */
	public get race(): string {
		return this.data.sRace;
	}

	/**
	 * The name of the monster.
	 */
	public get name(): string {
		return this.data.strMonName;
	}

	/**
	 * The monster's current HP.
	 */
	public get hp(): number {
		return this.data.intHP;
	}

	/**
	 * The monster's max HP.
	 */
	public get maxHP(): number {
		return this.data.intHPMax;
	}

	/**
	 * Whether the monster is alive.
	 */
	public get alive(): boolean {
		return this.hp > 0;
	}
}

export type MonsterData = {
	MonID: number;
	MonMapID: number;
	iLvl: number;
	intHP: number;
	intHPMax: number;
	intState: number;
	sRace: string;
	strMonName: string;
};
