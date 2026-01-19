package vexed.game {
  import vexed.Main;
  import vexed.util.Util;

  public class Bank {
    private static var game:Object = Main.getInstance().getGame();

    private static var loaded:Boolean = false;

    public static function getItem(item:*):Object {
      return Util.findItem(game.world.bankinfo.items, item);
    }

    public static function contains(item:*, quantity:int = 1):Boolean {
      return Util.hasItem(game.world.bankinfo.items, item, quantity);
    }

    public static function loadItems(force:Boolean = false):void {
      if (loaded && !force) return;
      game.sfc.sendXtMessage("zm", "loadBank", ["All"], "str", game.world.curRoom);
      loaded = true;
    }

    public static function deposit(key:*):Boolean {
      var item:Object = Inventory.getItem(key);
      if (!item) return false;
      game.world.sendBankFromInvRequest(item);
      return true;
    }

    public static function withdraw(key:*):Boolean {
      var item:Object = getItem(key);
      if (!item) return false;
      game.world.sendBankToInvRequest(item); 
      return true;
    }

    public static function swap(invKey:*,bankKey:*):Boolean {
      var item:Object = Inventory.getItem(invKey);
      if (!item) return false;
      var bankItem:Object = getItem(bankKey);
      if (!bankItem) return false;
      game.world.sendBankSwapInvRequest(bankItem, invKey);
      return true;
    }
  }
}