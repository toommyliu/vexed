package vexed.game
{
  import vexed.Main;

  public class Settings
  {
    private static var game:Object = Main.getInstance().getGame();

    public static function infiniteRange():void
    {
      for (var i:int = 0; i <= 5; i++)
      {
        game.world.actions.active[i].range = 20000;
      }
    }

    public static function provokeMap():void
    {
      var monMapIds:Array = [];
      for (var idx:* in game.world.monTree)
      {
        var mon:Object = game.world.monTree[idx];
        monMapIds.push(mon.MonMapID);
      }

      game.world.aggroMons(monMapIds);
    }

    public static function provokeCell():void
    {
      game.world.aggroAllMon();
    }

    public static function enemyMagnet():void
    {
      if (game.world.myAvatar.target != null)
      {
        game.world.myAvatar.target.pMC.x = game.world.myAvatar.pMC.x;
        game.world.myAvatar.target.pMC.y = game.world.myAvatar.pMC.y;
      }
    }

    public static function lagKiller(on:Boolean):void
    {
      game.world.visible = on;
    }

    public static function skipCutscenes():void
    {
      while (game.mcExtSWF.numChildren > 0)
      {
        game.mcExtSWF.removeChildAt(0);
      }
      game.showInterface();
    }

    // Player
    // ChangeName
    // ChangeGuild
    // SetWalkSpeed
    // ChangeAccessLevel
  }
}