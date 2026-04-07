package vexed.game {
  import vexed.Main;
  import flash.filters.GlowFilter;
  import vexed.module.Modules;
  import vexed.module.CustomName;

  [BridgeNamespace("settings")]
  public class Settings {
    private static var game:Object = Main.getInstance().getGame();

    [BridgeExport]
    public static function infiniteRange():void {
      for (var i:int = 0; i <= 5; i++) {
        game.world.actions.active[i].range = 20000;
      }
    }

    [BridgeExport]
    public static function provokeCell():void {
      game.world.aggroAllMon();
    }

    [BridgeExport]
    public static function enemyMagnet():void {
      if (game.world.myAvatar.target != null && game.world.myAvatar.target.npcType == "monster") {
        game.world.myAvatar.target.pMC.x = game.world.myAvatar.pMC.x;
        game.world.myAvatar.target.pMC.y = game.world.myAvatar.pMC.y;
      }
    }

    [BridgeExport]
    public static function lagKiller(on:Boolean):void {
      game.world.visible = on;
    }

    [BridgeExport]
    public static function skipCutscenes():void {
      game.clearExternamSWF();
    }

    [BridgeExport]
    public static function setName(name:String):void {
      CustomName.instance.customName = name || "";
    }

    [BridgeExport]
    public static function setGuild(name:String):void {
      CustomName.instance.customGuild = name || "";
    }

    [BridgeExport]
    public static function setWalkSpeed(speed:int):void {
      if (!speed)
        return;

      game.world.WALKSPEED = speed;
    }

    [BridgeExport]
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

    [BridgeExport]
    public static function setDeathAds(on:Boolean):void {
      game.userPreference.data.bDeathAd = on;
    }

    [BridgeExport]
    public static function setDisableCollisions(on:Boolean):void {
      if (on) {
        Modules.enable("DisableCollisions");
      }
      else {
        Modules.disable("DisableCollisions");
      }
    }

    [BridgeExport]
    public static function setDisableFX(on:Boolean):void {
      if (on) {
        Modules.enable("DisableFX");
      }
      else {
        Modules.disable("DisableFX");
      }
    }

    [BridgeExport]
    public static function setHidePlayers(on:Boolean):void {
      if (on) {
        Modules.enable("HidePlayers");
      }
      else {
        Modules.disable("HidePlayers");
      }
    }

    [BridgeExport]
    public static function setFPS(fps:int):void {
      Main.getInstance().getStage().frameRate = fps;
    }
  }
}
