package vexed.game {
  import vexed.Main;
  import vexed.util.Util;

  public class TempInventory {
    private static var game:Object = Main.getInstance().getGame();

    public static function getItem(item:*):Object {
      return Util.findItem(game.world.myAvatar.tempitems, item);
    }

    public static function contains(item:*, quantity:int = 1):Boolean {
      return Util.hasItem(game.world.myAvatar.tempitems, item, quantity)
    }
  }
}