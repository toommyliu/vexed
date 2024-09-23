package grimoire.game
{
	import grimoire.*;

	public class Bank extends Object
	{

		public function Bank()
		{
			return;
		}

		public static function GetBankItems() : String
		{
			return JSON.stringify(Root.Game.world.bankinfo.items);
		}

		public static function BankSlots() : int
		{
			return Root.Game.world.myAvatar.objData.iBankSlots;
		}

		public static function UsedBankSlots() : int
		{
			return Root.Game.world.myAvatar.iBankCount;
		}

		public static function TransferToBank(itemName:String):void
		{
			var item:Object = Inventory.GetItemByName(itemName);
			if (item != null)
			{
				Root.Game.world.sendBankFromInvRequest(item);
			}
		}

		public static function TransferToInventory(itemName:String):void
		{
			var item:Object = GetItemByName(itemName);
			if (item != null)
			{
				Root.Game.world.sendBankToInvRequest(item);
			}
		}

		public static function BankSwap(invItemName:String, bankItemName:String):void
		{
			var invItem:Object = Inventory.GetItemByName(invItemName);
			if (invItem == null) { return; }

			var bankItem:Object = GetItemByName(bankItemName);
			if (bankItem == null) { return; }

			Root.Game.world.sendBankSwapInvRequest(bankItem, invItem);
		}

		public static function GetItemByName(itemName:String):Object
		{
			if (Root.Game.world.bankinfo.items != null && Root.Game.world.bankinfo.items.length > 0)
			{
				for each (var item:Object in Root.Game.world.bankinfo.items)
				{
					if (item.sName.toLowerCase() == itemName.toLowerCase())
					{
						return item;
					}
				}
			}
			return null;
		}

		public static function GetItemByName2(itemName:String):String
		{
			return JSON.stringify(GetItemByName(itemName));
		}

		public static function Show() : void
		{
			Root.Game.world.toggleBank();
		}

		public static function GetBank() : void
		{
			Root.Game.getBank();
		}

		public static function LoadBankItems() : void
		{
			Root.Game.sfc.sendXtMessage("zm", "loadBank", ["All"], "str", Root.Game.world.curRoom);
		}

	}
}
