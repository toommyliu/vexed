package vexed.game {
  import vexed.Main;

  public class Bank {
    // BankController game.world.bankinfo

    private static var game:Object = Main.getInstance().getGame();

    private static var loaded:Boolean = false;

    public static function getItems():Array {
      return game.world.bankinfo.items;
    }

    public static function getItem(item:*):Object {
      if (!item)
        return null;

      var items:Array = game.world.bankinfo.items;
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

    public static function loadItems(force:Boolean = false):void {
      if (loaded && !force) {
        return;
      }

      game.sfc.sendXtMessage("zm", "loadBank", ["All"], "str", game.world.curRoom);
      loaded = true;
    }

    public static function getSlots():int {
      return game.world.myAvatar.objData.iBankSlots;
    }

    public static function getUsedSlots():int {
      return game.world.myAvatar.iBankCount;
    }

    public static function deposit(key:*):Boolean {
      var item:Object = Inventory.getItem(key);
      if (!item) {
        return false;
      }

      game.world.sendBankFromInvRequest(item);
      return true;
    }

    public static function open():void {
      // first loads the bank items if not already loaded
      // then toggles the bank window
      game.world.toggleBank();
    }
  }
}