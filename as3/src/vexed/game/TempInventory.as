package vexed.game {
  import vexed.Main;

  [BridgeNamespace("tempInventory")]
  public class TempInventory {
    private static var game:Object = Main.getInstance().getGame();

    [BridgeExport]
    public static function getItems():Array {
      return game.world.myAvatar.tempitems;
    }

    [BridgeExport]
    public static function getItem(item:*):Object {
      return ItemLookup.find(game.world.myAvatar.tempitems, item);
    }

    [BridgeExport]
    public static function contains(item:*, quantity:int = 1):Boolean {
      var itemObj:Object = getItem(item);
      if (!itemObj) {
        return false;
      }

      return itemObj.iQty >= quantity;
    }
  }
}
