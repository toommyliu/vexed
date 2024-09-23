import { Item, type ItemData } from './Item';

export class ShopItem extends Item {
	public constructor(public override data: ShopItemData) {
		super(data);
	}
}

/**
 * Represents the data structure for an item.
 */
export type ShopItemData = ItemData & {
	/**
	 * Faction ID associated with the item.
	 */
	FactionID: string;
	/**
	 * Shop item id.
	 */
	ShopItemID: string;
	/**
	 * Whether the item can be placed in a house.
	 */
	bHouse: string;
	iClass: string;
	iQSindex: string;
	iQSvalue: string;
	iQtyRemain: string;
	iReqCP: string;
	iReqRep: string;
	/**
	 * Faction associated with the item.
	 */
	sFaction: string;
};
