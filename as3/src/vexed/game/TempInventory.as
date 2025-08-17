package vexed.game {
  import vexed.Main;

  public class TempInventory {
    private static var game:Object = Main.getInstance().getGame();

    public static function getItems():Array {
      return game.world.myAvatar.tempitems;
    }

    public static function getItem(item:*):Object {
      if (!item)
        return null;

      var items:Array = game.world.myAvatar.tempitems;
      if (items is Array) {
        var ret:Object;
        if (item is String) {
          item = item.toLowerCase();
          for each (ret in items) {
            if (ret.sName.toLowerCase() === item)
              return ret;
          }
        }
        else if (item is int) {
          for each (ret in items) {
            if (ret.ItemID === item)
              return ret;
          }
        }
      }

      return null;
    }

    public static function contains(item:*, quantity:int = 1):Boolean {
      var itemObj:Object = getItem(item);
      if (!itemObj) {
        return false;
      }

      return itemObj.iQty >= quantity;
    }
  }
}