package vexed.game {
  import vexed.Main;

  public class Inventory {
    private static var game:Object = Main.getInstance().getGame();

    public static function getItems():Array {
      return game.world.myAvatar.items;
    }

    public static function getItem(item:*):Object {
      if (!item)
        return null;

      var items:Array = game.world.myAvatar.items;
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

    public static function contains(item:*, quantity:int = 1):Boolean {
      var itemObj:Object = getItem(item);
      if (!itemObj) {
        return false;
      }

      return itemObj.iQty >= quantity;
    }

    public static function getSlots():int {
      return game.world.myAvatar.objData.iBagSlots;
    }

    public static function getUsedSlots():int {
      return game.world.myAvatar.items.length;
    }

    public static function equip(item:*):Boolean {
      var itemObj:Object = getItem(item);
      if (!itemObj) {
        return false;
      }

      if (itemObj.sType == "Item") {
        var itemId:int = itemObj.ItemID;
        var sDesc:String = itemObj.sDesc;
        var sFile:String = itemObj.sFile;
        var sName:String = itemObj.sName;

        if (!itemId || !sDesc || !sFile || !sName) {
          return false;
        }

        game.world.equipUseableItem({ItemID: itemId, sDesc: sDesc, sFile: sFile, sName: sName});
        return true;
      }

      game.world.sendEquipItemRequest({ItemID: itemObj.ItemID});
      return true;
    }
  }
}