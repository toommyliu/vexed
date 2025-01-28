package vexed.game
{
  import vexed.Main;

  public class Inventory
  {
    private static var game:Object = Main.getInstance().getGame();

    public static function getItems():Array
    {
      return game.world.myAvatar.items;
    }

    public static function getItem(key:*):Object
    {
      if (!key)
        return null;

      if (game.world.myAvatar.items is Array && game.world.myAvatar.items.length > 0)
      {
        var item:Object;
        var items:Array = game.world.myAvatar.items;
        if (key is String)
        {
          key = key.toLowerCase();
          for each (item in items)
          {
            if (item.sName.toLowerCase() === key)
              return item;
          }
        }
        else if (key is int)
        {
          for each (item in items)
          {
            if (item.ItemID === key)
              return item;
          }
        }
      }

      return null;
    }

    public static function contains(key:*, quantity:int):Boolean
    {
      if (!key)
        return false;

      if (quantity is int && quantity <= 0)
        return false;

      var item:Object = getItem(key);
      if (!item)
        return false;

      if (!quantity)
        return true;

      return item.iQty >= quantity;
    }

    public static function getSlots():int
    {
      return game.world.myAvatar.objData.iBagSlots;
    }

    public static function getUsedSlots():int
    {
      return game.world.myAvatar.items.length;
    }

    public static function equip(key:*):Boolean
    {
      var item:Object = getItem(key);
      if (!item)
      {
        return false;
      }

      game.world.sendEquipItemRequest({ItemID: item.ItemID});
      return true;
    }

    public static function equipConsumable(itemId:int, sDesc:String, sFile:String, sName:String):Boolean
    {
      if (!itemId || !sDesc || !sFile || !sName)
      {
        return false;
      }

      var item:Object = getItem(itemId);
      if (!item)
      {
        return false;
      }

      game.world.equipUseableItem({ItemID: item.ItemID, sDesc: sDesc, sFile: sFile, sName: sName});
      return true;
    }
  }
}