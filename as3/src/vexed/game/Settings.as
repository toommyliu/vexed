package vexed.game {
  import vexed.Main;
  import flash.filters.GlowFilter;
  import vexed.module.CustomName;

  public class Settings {
    private static var game:Object = Main.getInstance().getGame();

    public static function infiniteRange():void {
      for (var i:int = 0; i <= 5; i++) {
        game.world.actions.active[i].range = 20000;
      }
    }

    public static function provokeCell():void {
      game.world.aggroAllMon();
    }

    public static function enemyMagnet():void {
      if (game.world.myAvatar.target != null && game.world.myAvatar.target.npcType == "monster") {
        game.world.myAvatar.target.pMC.x = game.world.myAvatar.pMC.x;
        game.world.myAvatar.target.pMC.y = game.world.myAvatar.pMC.y;
      }
    }

    public static function lagKiller(on:Boolean):void {
      game.world.visible = on;
    }

    public static function skipCutscenes():void {
      game.clearExternamSWF();
    }

    public static function setName(name:String):void {
      CustomName.instance.customName = name || "";
    }

    public static function setGuild(name:String):void {
      CustomName.instance.customGuild = name || "";
    }

    public static function setWalkSpeed(speed:int):void {
      if (!speed)
        return;

      game.world.WALKSPEED = speed;
    }

    public static function setDeathAds(on:Boolean):void {
      game.userPreference.data.bDeathAd = on;
    }
  }
}