/**
 * The base for all things item-related.
 */
export class Item {
	public constructor(
		/**
		 * Data about this item
		 */
		public data: ItemData,
	) {}

	/**
	 * The ID of the item.
	 */
	public get id(): number {
		return this.data.ItemID;
	}

	/**
	 * The name of the item.
	 */
	public get name(): string {
		return this.data.sName;
	}

	/**
	 * The description of the item.
	 */
	public get description(): string {
		return this.data.sDesc;
	}

	/**
	 * The quantity of the item in this stack.
	 */
	public get quantity(): number {
		return this.data.iQty;
	}

	/**
	 * The maximum stack size this item can exist in.
	 */
	public get maxStack(): number {
		return this.data.iStk;
	}

	/**
	 * Indicates if the item is a member/upgrade only item.
	 */
	public isUpgrade(): boolean {
		return this.data.bUpg === 1;
	}

	/**
	 * Indicates if the item is an AC item.
	 */
	public isAC(): boolean {
		return this.data.bCoins === 1;
	}

	/**
	 * The category of the item.
	 */
	public get category(): string {
		return this.data.sType;
	}

	/**
	 * Whether the item is a temporary item.
	 */
	public isTemp(): boolean {
		return this.data.bTemp === 1;
	}

	/**
	 * The group of the item.
	 * co = Armor, ba = Cape, he = Helm, pe = Pet, Weapon = Weapon
	 */
	public get itemGroup(): string {
		return this.data.sES;
	}

	/**
	 * The name of the source file of the item.
	 */
	public get fileName(): string {
		return this.data.sLink;
	}

	/**
	 * The link to the source file of the item
	 */
	public get fileLink(): string {
		return this.data.sFile;
	}

	/**
	 * The meta value of the item (used for boosts).
	 */
	public get meta(): Record<string, number> {
		return this.data.sMeta
			.split(',')
			.reduce<Record<string, number>>((acc, cur) => {
				const [key, value] = cur.split(':') as [string, string];
				acc[key] = Number.parseFloat(value);
				return acc;
			}, {});
	}

	/**
	 * Whether the item is at its maximum stack size.
	 */
	public isMaxed(): boolean {
		return this.quantity === this.maxStack;
	}
}

export type ItemData = {
	CharID: number;
	CharItemID: number;
	EnhDPS: number;
	EnhID: number;
	EnhLvl: number;
	EnhPatternID: number;
	EnhRng: number;
	EnhRty: number;
	ItemID: number;
	bBank: number;
	bCoins: number;
	bEquip: number;
	bStaff: number;
	bTemp: number;
	bUpg: number;
	dPurchase: string;
	iCost: number;
	iDPS: number;
	iHrs: number;
	iLvl: number;
	iQty: number;
	iRng: number;
	iRty: number;
	iStk: number;
	iType: number;
	sDesc: string;
	sES: string;
	sElmt: string;
	sFile: string;
	sIcon: string;
	sLink: string;
	sMeta: string;
	sName: string;
	sType: string;
};