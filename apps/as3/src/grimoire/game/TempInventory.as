package grimoire.game
{
	import grimoire.*;

	public class TempInventory 
	{

		public function TempInventory() 
		{
			
		}
		
		public static function GetTempItems():String
		{
			return JSON.stringify(Root.Game.world.myAvatar.tempitems);
		}
		
		public static function GetTempItemByName(name:String):Object
		{
			for each (var item:Object in Root.Game.world.myAvatar.tempitems)
			{
				if (item.sName.toLowerCase() == name.toLowerCase())
				{
					return item;
				}
			}
			return null;
		}
		
		public static function ItemIsInTemp(itemName:String, itemQty:String):String
		{
			var item:Object = GetTempItemByName(itemName);
			if (item == null) { return Root.FalseString; }
			
			return (itemQty == "*") ? Root.TrueString : ((item.iQty >= parseInt(itemQty)) ? Root.TrueString : Root.FalseString);
		}
	}
}
