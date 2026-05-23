package vexed.game {
  import vexed.Main;

  [BridgeNamespace("outfits")]
  public class Outfits {
    private static function getGame():Object {
      return Main.getInstance().getGame();
    }

    private static function getLoadouts():Object {
      var game:Object = getGame();
      if (!game || !game.world || !game.world.objInfo) {
        return null;
      }

      var customs:Object = game.world.objInfo["customs"];
      if (!customs) {
        return null;
      }

      return customs.loadouts;
    }

    private static function getLoadout(name:String):Object {
      if (!name) {
        return null;
      }

      var loadouts:Object = getLoadouts();
      if (!loadouts) {
        return null;
      }

      return loadouts[name];
    }

    private static function toOutfit(name:String, loadout:*):Object {
      if (!name || !loadout || !(loadout is Object)) {
        return null;
      }

      var outfit:Object = {};
      try {
        for (var key:String in loadout) {
          outfit[key] = loadout[key];
        }
      } catch (error:Error) {
        return null;
      }

      outfit.name = name;
      return outfit;
    }

    private static function sendLoadoutCommand(command:String, name:String, keepColors:Boolean = false):Boolean {
      var game:Object = getGame();
      if (!game || !game.world || !game.sfc) {
        return false;
      }

      if (!getLoadout(name)) {
        return false;
      }

      if (!game.world.coolDown(command)) {
        return false;
      }

      game.sfc.sendXtMessage("zm", command, ["cmd", name, keepColors ? 1 : 0], "str", game.world.curRoom);
      return true;
    }

    [BridgeExport]
    public static function getAll():Array {
      var loadouts:Object = getLoadouts();
      var outfits:Array = [];
      if (!loadouts) {
        return outfits;
      }

      for (var name:String in loadouts) {
        var outfit:Object = toOutfit(name, loadouts[name]);
        if (outfit) {
          outfits.push(outfit);
        }
      }

      return outfits;
    }

    [BridgeExport]
    [BridgeTsReturnType("Record<string, unknown> | null")]
    public static function get(name:String):Object {
      return toOutfit(name, getLoadout(name));
    }

    [BridgeExport]
    public static function equip(name:String, keepColors:Boolean = false):Boolean {
      return sendLoadoutCommand("equipLoadout", name, keepColors);
    }

    [BridgeExport]
    public static function wear(name:String, keepColors:Boolean = false):Boolean {
      return sendLoadoutCommand("wearLoadout", name, keepColors);
    }
  }
}
