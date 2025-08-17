package vexed.game {
  import vexed.Main;

  public class LiteSettings {
    private const game:Object = Main.getInstance().getGame();
    // optionHandler
    private const cls:Class = Class(Main.getInstance().getGameDomain().getDefinition('liteAssets.handlers.optionHandler'));

    // public static function cmd(param1:MovieClip, param2:String) : void
    // optionHandler.cmd(game, 'Hide UI')
  }
}