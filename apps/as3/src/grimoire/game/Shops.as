﻿package grimoire.game
{
	import grimoire.*;

	public class Shops
	{
		public function Shops()
		{

		}

		public static var LoadedShops:Array = [];

		public static function OnShopLoaded(shop:Object):void
		{
			var loadedShop:Object = new Object();
			loadedShop.Location = shop.Location;
			loadedShop.sName = shop.sName;
			loadedShop.ShopID = shop.ShopID;
			loadedShop.items = [];
			var i:int = 0;
			while (i < shop.items.length)
			{
				loadedShop.items.push(shop.items[i]);
				i++;
			}
			LoadedShops.push(loadedShop);
		}

		public static function ResetShopInfo():void
		{
			Root.Game.world.shopinfo = null;
		}

		public static function IsShopLoaded():String
		{
			return (Root.Game.world.shopinfo != null &&
				   Root.Game.world.shopinfo.items != null &&
				   Root.Game.world.shopinfo.items.length > 0) ? Root.TrueString : Root.FalseString;
		}

		public static function BuyItem(itemName:String):void
		{
			var item:Object = GetShopItem(itemName.toLowerCase());
			if (item != null)
				Root.Game.world.sendBuyItemRequest(item);
		}

		public static function BuyItemQty(itemName:String, qty:int):void
        {
            var item:Object = GetShopItem(itemName.toLowerCase());
            if (item != null)
			{
                var buy:Object = new Object();
                buy.accept = 1;
                buy.iQty   = qty;
                buy.iSel   = item;
                Root.Game.world.sendBuyItemRequestWithQuantity(buy);
            }
        }

		public static function BuyItemQtyById(qty:int, itemID:int, shopItemID:int):void
        {
            var item:Object = GetShopItemById(itemID, shopItemID);
            if (item != null)
			{
                var buy:Object = new Object();
                buy.accept = 1;
                buy.iQty   = qty;
                buy.iSel   = item;
                Root.Game.world.sendBuyItemRequestWithQuantity(buy);
            }
        }

		public static function GetShopItem(name:String):Object
		{
			var i:int = 0;
			while (i < Root.Game.world.shopinfo.items.length)
			{
				var item:Object = Root.Game.world.shopinfo.items[i];
				if (item.sName.toLowerCase() == name)
					return item;
				i++;
			}
			return null;
		}


		public static function GetShopItemById(itemId:int, shopItemId:int):Object
		{
			var i:int = 0;
			while (i < Root.Game.world.shopinfo.items.length)
			{
				var item:Object = Root.Game.world.shopinfo.items[i];
				if (item.ItemID == itemId && item.ShopItemID == shopItemId)
					return item;
				i++;
			}
			return null;
		}

		public static function GetShops():String
		{
			return JSON.stringify(LoadedShops);
		}

		public static function Load(shopID:String):void
		{
			Root.Game.world.sendLoadShopRequest(parseInt(shopID));
		}

		public static function LoadHairShop(shopID:String):void
		{
			Root.Game.world.sendLoadHairShopRequest(parseInt(shopID));
		}

		public static function LoadArmorCustomizer():void
		{
			Root.Game.openArmorCustomize();
		}

		public static function SellItem(itemName:String):void
		{
			var item:Object = Inventory.GetItemByName(itemName);
			Root.Game.world.sendSellItemRequest(item);
		}
	}
}