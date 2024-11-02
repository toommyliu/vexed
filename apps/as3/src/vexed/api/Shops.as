package vexed.api
{
	import vexed.Main;

	public class Shops
	{
		private static var game:* = Main.instance.getGame();

		private static var shops:Array = [];

		public static function resetShopInfo():Boolean
		{
			try
			{
				game.world.shopInfo = null;
				return true;
			}
			catch (e:Error)
			{
				return false;
			}
			return false;
		}

		public static function isShopLoaded():Boolean
		{
			return (game.world.shopinfo != null &&
					game.shopinfo.items != null &&
					game.shopinfo.items.length > 0);
		}

		public static function buyItem(name:String):Boolean
		{
			var item:* = getShopItem(name.toLowerCase());
			if (item != null)
			{
				game.world.buyItem(item);
				return true;
			}
			return false;
		}

		public static function buyItemQty(name:String, qty:int):Boolean
		{
			var item:* = getShopItem(name.toLowerCase());
			if (item != null)
			{
				var buy:Object = new Object();
				buy.accept = 1;
				buy.iQty = qty;
				buy.iSel = item;
				game.world.sendBuyItemRequestWithQuantity(buy);
				return true;
			}
			return false;
		}

		public static function buyItemQtyByID(qty:int, itemID:int, shopItemID:int):Boolean
		{
			var item:* = getShopItemByID(itemID, shopItemID);
			if (item != null)
			{
				var buy:Object = new Object();
				buy.accept = 1;
				buy.iQty = qty;
				buy.iSel = item;
				game.world.sendBuyItemRequestWithQuantity(buy);
				return true;
			}
			return false;
		}

		public static function getShopItem(name:String):*
		{
			for (var i:int = 0; i < game.shopinfo.items.length; i++)
			{
				if (game.shopinfo.items[i].strName.toLowerCase() == name)
				{
					return game.shopinfo.items[i];
				}
			}
			return null;
		}

		public static function getShopItemByID(itemID:int, shopItemID:int):*
		{
			for (var i:int = 0; i < game.shopinfo.items.length; i++)
			{
				var item:Object = game.shopinfo.items[i];
				if (item.ItemID == itemID && item.ShopItemID == shopItemID)
				{
					return item;
				}
			}
			return null;
		}
	}
}