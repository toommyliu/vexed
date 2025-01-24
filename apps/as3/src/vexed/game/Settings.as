package vexed.game
{
  import vexed.Main;
  import flash.filters.GlowFilter;

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

    public static function setName(name:String):void
    {
      if (!name || !(name is String))
        return;

      name = name.toUpperCase();

      game.world.myAvatar.pMC.pname.ti.text = name;
      game.ui.mcPortrait.strName.text = name;
      game.world.myAvatar.objData.strUsername = name;
      game.world.myAvatar.pMC.pAV.objData.strUsername = name;
    }

    public static function setGuild(name:String):void
    {
      if (!name || !(name is String))
        return;

      name = name.toUpperCase();

      // Player isn't in a guild
      if (game.world.myAvatar.objData.guild == null)
      {
        game.world.myAvatar.objData.guild = new Object();
      }

      game.world.myAvatar.pMC.pname.tg.text = name;
      game.world.myAvatar.objData.guild.Name = name;
      game.world.myAvatar.pMC.pAV.objData.guild.Name = name;
    }

    public static function setWalkSpeed(speed:int):void
    {
      if (!speed || !(speed is int))
        return;

      game.world.WALKSPEED = speed;
    }

    public static function setAccessLevel(accessLevel:String):void
    {
      if (!accessLevel)
        return;

      if (accessLevel == "Non Member")
      {
        game.world.myAvatar.pMC.pname.ti.textColor = 16777215;
        game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
        game.world.myAvatar.objData.iUpgDays = -1;
        game.world.myAvatar.objData.iUpg = 0;
      }
      else if (accessLevel == "Member")
      {
        game.world.myAvatar.pMC.pname.ti.textColor = 9229823;
        game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
        game.world.myAvatar.objData.iUpgDays = 30;
        game.world.myAvatar.objData.iUpg = 1;
      }
      else if (accessLevel == "Moderator" || accessLevel == "60")
      {
        // Yellow
        game.world.myAvatar.pMC.pname.ti.textColor = 16698168;
        game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
        game.world.myAvatar.objData.intAccessLevel = 60;
      }
      else if (accessLevel == "30")
      {
        // Dark Green
        game.world.myAvatar.pMC.pname.ti.textColor = 52881;
        game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
        game.world.myAvatar.objData.intAccessLevel = 30;
      }
      else if (accessLevel == "40")
      {
        // Light Green
        game.world.myAvatar.pMC.pname.ti.textColor = 5308200;
        game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
        game.world.myAvatar.objData.intAccessLevel = 40;
      }
      else if (accessLevel == "50")
      {
        // Purple
        game.world.myAvatar.pMC.pname.ti.textColor = 12283391;
        game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
        game.world.myAvatar.objData.intAccessLevel = 50;
      }
    }

    // Player
    // ChangeName
    // ChangeGuild
    // SetWalkSpeed
    // ChangeAccessLevel
  }
}