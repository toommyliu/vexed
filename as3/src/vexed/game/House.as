package vexed.game {
  import vexed.Main;

  [BridgeNamespace("house")]
  public class House {
    private static var game:Object = Main.getInstance().getGame();

    [BridgeExport]
    public static function getItems():Array {
      return game.world.myAvatar.houseitems;
    }

    [BridgeExport]
    public static function getItem(item:*):Object {
      if (!item)
        return null;

      var items:Array = game.world.myAvatar.houseitems;
      if (items is Array) {
        var itemObj:Object;
        if (item is String) {
          item = item.toLowerCase();
          for each (itemObj in items) {
            if (itemObj.sName.toLowerCase() === item)
              return itemObj;
          }
        }
        else if (item is int) {
          for each (itemObj in items) {
            if (itemObj.ItemID === item)
              return itemObj;
          }
        }
      }

      return null;
    }

    [BridgeExport]
    public static function getSlots():int {
      return game.world.myAvatar.objData.iHouseSlots;
    }

    [BridgeExport]
    public static function getUsedSlots():int {
      return game.world.myAvatar.houseitems.length;
    }
  }
}
