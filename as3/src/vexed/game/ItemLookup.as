package vexed.game {
  public class ItemLookup {
    public static function toItemId(item:*):Number {
      if (item is int || item is uint || item is Number) {
        return Number(item);
      }

      return NaN;
    }

    public static function find(items:Array, item:*):Object {
      if (!item || !(items is Array)) {
        return null;
      }

      var itemObj:Object;
      if (item is String) {
        var itemName:String = String(item).toLowerCase();
        for each (itemObj in items) {
          if (String(itemObj.sName).toLowerCase() === itemName)
            return itemObj;
        }

        return null;
      }

      var itemId:Number = toItemId(item);
      if (!isNaN(itemId)) {
        for each (itemObj in items) {
          if (Number(itemObj.ItemID) === itemId)
            return itemObj;
        }
      }

      return null;
    }
  }
}
