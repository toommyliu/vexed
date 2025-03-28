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

    public static function provokeMap():void {
      var monMapIds:Array = [];
      for (var idx:* in game.world.monTree) {
        var mon:Object = game.world.monTree[idx];
        monMapIds.push(mon.MonMapID);
      }

      game.world.aggroMons(monMapIds);
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
      if (!name)
        return;

      CustomName.instance.customName = name;
    }

    public static function setGuild(name:String):void {
      if (!name)
        return;

      CustomName.instance.customGuild = name;
    }

    public static function _setName(name:String):void {
      if (!name)
        return;

      name = name.toUpperCase();

      game.world.myAvatar.pMC.pname.ti.text = name;
      game.ui.mcPortrait.strName.text = name;
      game.world.myAvatar.objData.strUsername = name;
      game.world.myAvatar.pMC.pAV.objData.strUsername = name;
    }

    public static function _setGuild(name:String):void {
      if (!name)
        return;

      name = name.toUpperCase();

      // Player isn't in a guild
      if (game.world.myAvatar.objData.guild == null) {
        game.world.myAvatar.objData.guild = new Object();
      }

      game.world.myAvatar.pMC.pname.tg.text = name;
      game.world.myAvatar.objData.guild.Name = name;
      game.world.myAvatar.pMC.pAV.objData.guild.Name = name;
    }

    public static function setWalkSpeed(speed:int):void {
      if (!speed)
        return;

      game.world.WALKSPEED = speed;
    }

    public static function setAccessLevel(accessLevel:String):void {
      if (!accessLevel)
        return;

      switch (accessLevel) {
        case "Non Member":
          game.world.myAvatar.pMC.pname.ti.textColor = 16777215;
          game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
          game.world.myAvatar.objData.iUpgDays = -1;
          game.world.myAvatar.objData.iUpg = 0;
          break;
        case "Member":
          game.world.myAvatar.pMC.pname.ti.textColor = 9229823;
          game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
          game.world.myAvatar.objData.iUpgDays = 30;
          game.world.myAvatar.objData.iUpg = 1;
          break;
        case "Moderator":
        case "60":
          // Yellow
          game.world.myAvatar.pMC.pname.ti.textColor = 16698168;
          game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
          game.world.myAvatar.objData.intAccessLevel = 60;
          break;
        case "30":
          // Dark Green
          game.world.myAvatar.pMC.pname.ti.textColor = 52881;
          game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
          game.world.myAvatar.objData.intAccessLevel = 30;
          break;
        case "40":
          // Light Green
          game.world.myAvatar.pMC.pname.ti.textColor = 5308200;
          game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
          game.world.myAvatar.objData.intAccessLevel = 40;
          break;
        case "50":
          // Purple
          game.world.myAvatar.pMC.pname.ti.textColor = 12283391;
          game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
          game.world.myAvatar.objData.intAccessLevel = 50;
          break;
      }
    }

    public static function setDeathAds(on:Boolean):void {
      game.userPreference.data.bDeathAd = on;
    }
  }
}