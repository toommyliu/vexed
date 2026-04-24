package vexed.game {
  import vexed.Main;
  import vexed.module.CustomName;
  import vexed.module.Modules;

  [BridgeNamespace("settings")]
  public class Settings {
    private static const MIN_FRAME_RATE:int = 1;
    private static const MAX_FRAME_RATE:int = 60;

    private static function sanitizeText(value:String):String {
      return value ? value : "";
    }

    private static function setModuleEnabled(moduleName:String, enabled:Boolean):void {
      if (enabled) {
        Modules.enable(moduleName);
      }
      else {
        Modules.disable(moduleName);
      }
    }

    private static function clamp(value:int, min:int, max:int):int {
      return Math.max(min, Math.min(value, max));
    }

    [BridgeExport]
    public static function infiniteRange():void {
      var world:Object = Main.getInstance().getGame().world;
      for (var i:int = 0; i <= 5; i++) {
        world.actions.active[i].range = 20000;
      }
    }

    [BridgeExport]
    public static function provokeCell():void {
      Main.getInstance().getGame().world.aggroAllMon();
    }

    [BridgeExport]
    public static function enemyMagnet():void {
      var world:Object = Main.getInstance().getGame().world;
      if (world.myAvatar && world.myAvatar.target != null && world.myAvatar.target.npcType == "monster") {
        world.myAvatar.target.pMC.x = world.myAvatar.pMC.x;
        world.myAvatar.target.pMC.y = world.myAvatar.pMC.y;
      }
    }

    [BridgeExport]
    public static function skipCutscenes():void {
      Main.getInstance().getGame().clearExternamSWF();
    }

    [BridgeExport]
    public static function setCustomName(name:String):void {
      CustomName.instance.customName = sanitizeText(name);
    }

    [BridgeExport]
    public static function setCustomGuild(name:String):void {
      CustomName.instance.customGuild = sanitizeText(name);
    }

    [BridgeExport]
    public static function setWalkSpeed(speed:int):void {
      Main.getInstance().getGame().world.WALKSPEED = speed;
    }

    [BridgeExport]
    public static function setDeathAdsEnabled(enabled:Boolean):void {
      Main.getInstance().getGame().userPreference.data.bDeathAd = enabled;
    }

    [BridgeExport]
    public static function setCollisionsEnabled(enabled:Boolean):void {
      setModuleEnabled("DisableCollisions", !enabled);
    }

    [BridgeExport]
    public static function setEffectsEnabled(enabled:Boolean):void {
      setModuleEnabled("DisableFX", !enabled);
    }

    [BridgeExport]
    public static function setPlayersVisible(visible:Boolean):void {
      setModuleEnabled("HidePlayers", !visible);
    }

    [BridgeExport]
    public static function setWorldVisible(visible:Boolean):void {
      Main.getInstance().getGame().world.visible = visible;
    }

    [BridgeExport]
    public static function setLagKillerEnabled(enabled:Boolean):void {
      setWorldVisible(!enabled);
    }

    [BridgeExport]
    public static function setFrameRate(fps:int):void {
      Main.getInstance().getStage().frameRate = clamp(fps, MIN_FRAME_RATE, MAX_FRAME_RATE);
    }
  }
}
