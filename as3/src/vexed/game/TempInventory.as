package vexed.game
{
  import vexed.Main;

  public class TempInventory
  {
    private static var game:Object = Main.getInstance().getGame();

    public static function getItems():Array
    {
      return game.world.myAvatar.tempitems;
    }

    public static function getItem(key:*):Object
    {
      if (!key)
        return null;

      if (game.world.myAvatar.tempitems is Array && game.world.myAvatar.tempitems.length > 0)
      {
        var item:Object;
        var items:Array = game.world.myAvatar.tempitems;
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
  }
}