package vexed.game {
  import vexed.Main;

  [BridgeNamespace("outfits")]
  public class Outfits {
    private static var game:Object = Main.getInstance().getGame();

    private static function getLoadouts():Object {
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

    private static function toOutfit(name:String, loadout:Object):Object {
      var outfit:Object = {};
      for (var key:String in loadout) {
        outfit[key] = loadout[key];
      }
      outfit.name = name;
      return outfit;
    }

    private static function sendLoadoutCommand(command:String, name:String, keepColors:Boolean = false):Boolean {
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
        outfits.push(toOutfit(name, loadouts[name]));
      }

      return outfits;
    }

    [BridgeExport]
    public static function get(name:String):Object {
      var loadout:Object = getLoadout(name);
      if (!loadout) {
        return null;
      }

      return toOutfit(name, loadout);
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
