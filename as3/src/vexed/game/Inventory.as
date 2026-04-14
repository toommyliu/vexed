package vexed.game {
  import vexed.Main;

  [BridgeNamespace("inventory")]
  public class Inventory {
    private static var game:Object = Main.getInstance().getGame();

    [BridgeExport]
    public static function getItems():Array {
      return game.world.myAvatar.items;
    }

    [BridgeExport]
    public static function getItem(item:*):Object {
      return ItemLookup.find(game.world.myAvatar.items, item);
    }

    [BridgeExport]
    public static function contains(item:*, quantity:int = 1):Boolean {
      var itemObj:Object = getItem(item);
      if (!itemObj) {
        return false;
      }

      return itemObj.iQty >= quantity;
    }

    [BridgeExport]
    public static function getSlots():int {
      return game.world.myAvatar.objData.iBagSlots;
    }

    [BridgeExport]
    public static function getUsedSlots():int {
      return game.world.myAvatar.items.length;
    }

    [BridgeExport]
    public static function equip(item:*):Boolean {
      var itemObj:Object = getItem(item);
      if (!itemObj) {
        return false;
      }

      if (itemObj.sType == "Item") {
        if (!itemObj.ItemID || !itemObj.sDesc || !itemObj.sFile || !itemObj.sName) {
          return false;
        }

        game.world.equipUseableItem(itemObj);
        return true;
      }

      game.world.sendEquipItemRequest({ItemID: itemObj.ItemID});
      return true;
    }
  }
}
