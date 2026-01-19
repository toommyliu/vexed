package vexed.game {
  import vexed.Main;
  import vexed.util.Util;

  public class Inventory {
    private static var game:Object = Main.getInstance().getGame();

    public static function getItem(key:*):Object {
      return Util.findItem(game.world.myAvatar.items, key);
    }

    public static function contains(key:*, quantity:int=1):Boolean {
      return Util.hasItem(game.world.myAvatar.items, key, quantity);
    }
  }
}