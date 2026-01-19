package vexed.game {
  import vexed.Main;

  public class Player {
    private static var game:Object = Main.getInstance().getGame();

    public static function walkTo(x:int, y:int, walkSpeed:* = null):Boolean {
      if (!x || !y)
        return false;

      if (!walkSpeed)
        walkSpeed = game.world.WALKSPEED;

      game.world.myAvatar.pMC.walkTo(x, y, walkSpeed);
      game.world.moveRequest({mc: game.world.myAvatar.pMC, tx: x, ty: y, sp: walkSpeed});
      return true;
    }

    public static function isLoaded():Boolean {
      return game.world.myAvatar.items.length > 0 && Wrld.isLoaded() && game.world.myAvatar.pMC.artLoaded();
    }
  }
}