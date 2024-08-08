package grimoire.game
{
	import grimoire.*;

	public class House extends Object
	{

		public function House()
		{
			return;
		}

		public static function GetHouseItems() : String
		{
			return JSON.stringify(Root.Game.world.myAvatar.houseitems);
		}

		public static function HouseSlots() : int
		{
			return Root.Game.world.myAvatar.objData.iHouseSlots;
		}

		public static function GetItemByName(itemName:String) : Object
		{
			if (Root.Game.world.myAvatar.houseitems != null && Root.Game.world.myAvatar.houseitems.length > 0)
			{
				for each (var item:* in Root.Game.world.myAvatar.houseitems)
				{
					
					if (item.sName.toLowerCase() == itemName.toLowerCase())
					{
						return item;
					}
				}
			}
			return null;
		}

	}
}
