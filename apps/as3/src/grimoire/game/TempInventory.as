package grimoire.game
{
	import grimoire.*;

	public class TempInventory
	{
		public static function getTempItems():String
		{
			return JSON.stringify(Root.Game.world.myAvatar.tempitems);
		}

		public static function getTempItem(itemIdentifier:String):Object
		{
			itemIdentifier = itemIdentifier.toLowerCase();
			for each (var item:Object in Root.Game.world.myAvatar.tempitems)
			{
				if (item.sName.toLowerCase() == itemIdentifier || item.ItemID == itemIdentifier)
				{
					return item;
				}
			}
			return null;
		}

		public static function isItemInTemp(itemIdentifier:String, itemQty:String):String
		{
			var item:Object = getTempItem(itemIdentifier);
			if (item == null)
			{
				return Root.FalseString;
			}
			return (itemQty == "*") ? Root.TrueString : ((item.iQty >= parseInt(itemQty)) ? Root.TrueString : Root.FalseString);
		}
	}
}
