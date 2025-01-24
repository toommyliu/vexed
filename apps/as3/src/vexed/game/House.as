package vexed.game
{
  import vexed.Main;

  public class House
  {
    private static var game:Object = Main.getInstance().getGame();

    public static function getItems():Array
    {
      return game.world.myAvatar.houseitems;
    }

    public static function getItem(key:*):Object
    {
      if (!key)
        return null;

      if (game.world.myAvatar.houseitems is Array && game.world.myAvatar.houseitems.length > 0)
      {
        var item:Object;
        var items:Array = game.world.myAvatar.houseitems;
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

    public static function getSlots():int
    {
      return game.world.myAvatar.objData.iHouseSlots;
    }

    public static function getUsedSlots():int
    {
      return game.world.myAvatar.houseitems.length;
    }
  }
}