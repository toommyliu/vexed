package grimoire.game
{
	import grimoire.*;

	public class Inventory 
	{
		public function Inventory() 
		{
			
		}
		
		public static function GetInventoryItems():String
		{
			return JSON.stringify(Root.Game.world.myAvatar.items);
		}
		
		public static function GetItemByName(name:String):Object
		{
			for each (var item:Object in Root.Game.world.myAvatar.items)
			{
				if (item.sName.toLowerCase() == name.toLowerCase())
				{
					return item;
				}
			}
			return null;
		}
		
		public static function GetItemByName2(name:String):String 
		{
			return JSON.stringify(GetItemByName(name));
		}
		
		public static function GetItemByID(id:int):Object
		{
			for each (var item:Object in Root.Game.world.myAvatar.items)
			{
				if (item.ItemID == id)
				{
					return item;
				}
			}
			return null;
		}
		
		public static function InventorySlots():int
		{
			return Root.Game.world.myAvatar.objData.iBagSlots;
		}
		
		public static function UsedInventorySlots():int
		{
			return Root.Game.world.myAvatar.items.length;
		}
	}
}
