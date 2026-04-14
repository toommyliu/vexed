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
      return ItemLookup.find(game.world.myAvatar.houseitems, item);
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
