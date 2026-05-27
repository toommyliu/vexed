package vexed.game {
  import vexed.Main;

  [BridgeNamespace("player")]
  public class Player {
    private static var game:Object = Main.getInstance().getGame();

    [BridgeExport]
    public static function joinMap(map:String, cell:String = "Enter", pad:String = "Spawn"):void {
      if (!map)
        return;

      game.world.gotoTown(map, cell, pad);
    }

    [BridgeExport]
    public static function getMap():String {
      return game.world.strMapName;
    }

    [BridgeExport]
    public static function jump(cell:String, pad:String = "Spawn"):void {
      if (!cell)
        return;

      game.world.moveToCell(cell, pad);
    }

    [BridgeExport]
    public static function getCell():String {
      return game.world.strFrame;
    }

    [BridgeExport]
    public static function getPad():String {
      return game.world.strPad;
    }

    [BridgeExport]
    public static function getFactions():Array {
      return game.world.myAvatar.factions;
    }

    [BridgeExport]
    public static function getState():int {
      return game.world.myAvatar.dataLeaf.intState;
    }

    [BridgeExport]
    public static function getHp():int {
      return game.world.myAvatar.dataLeaf.intHP;
    }

    [BridgeExport]
    public static function getMaxHp():int {
      return game.world.myAvatar.dataLeaf.intHPMax;
    }

    [BridgeExport]
    public static function getMp():int {
      return game.world.myAvatar.dataLeaf.intMP;
    }

    [BridgeExport]
    public static function getMaxMp():int {
      return game.world.myAvatar.dataLeaf.intMPMax;
    }

    [BridgeExport]
    public static function getLevel():int {
      return game.world.myAvatar.dataLeaf.intLevel;
    }

    [BridgeExport]
    public static function getGold():int {
      return game.world.myAvatar.objData.intGold;
    }

    [BridgeExport]
    public static function isMember():Boolean {
      return game.world.myAvatar.isUpgraded();
    }

    [BridgeExport]
    public static function isAfk():Boolean {
      return game.world.myAvatar.dataLeaf.afk;
    }

    [BridgeExport]
    public static function getPosition():Array {
      return [game.world.myAvatar.pMC.x, game.world.myAvatar.pMC.y];
    }

    [BridgeExport]
    public static function walkTo(x:int, y:int, walkSpeed:* = null):Boolean {
      if (!x || !y)
        return false;

      if (!walkSpeed)
        walkSpeed = game.world.WALKSPEED;

      game.world.myAvatar.pMC.walkTo(x, y, walkSpeed);
      game.world.moveRequest({mc: game.world.myAvatar.pMC, tx: x, ty: y, sp: walkSpeed});
      return true;
    }

    [BridgeExport]
    public static function rest():void {
      game.world.rest();
    }

    [BridgeExport]
    public static function useBoost(itemId:int):Boolean {
      var item:Object = Inventory.getItem(itemId);
      if (!item) {
        return false;
      }

      game.world.sendUseItemRequest(item);
      return true;
    }

    [BridgeExport]
    public static function hasActiveBoost(boostType:String):Boolean {
      if (!boostType)
        return false;

      if (boostType.indexOf("gold") > -1) {
        return game.world.myAvatar.objData.iBoostG > 0;
      }

      if (boostType.indexOf("xp") > -1) {
        return game.world.myAvatar.objData.iBoostXP > 0;
      }

      if (boostType.indexOf("rep") > -1) {
        return game.world.myAvatar.objData.iBoostRep > 0;
      }

      if (boostType.indexOf("class") > -1) {
        return game.world.myAvatar.objData.iBoostCP > 0;
      }

      return false;
    }

    [BridgeExport]
    public static function getClassName():String {
      return game.world.myAvatar.objData.strClassName.toUpperCase();
    }

    [BridgeExport]
    public static function getUserId():int {
      return game.world.myAvatar.uid;
    }

    [BridgeExport]
    public static function getCharId():int {
      return game.world.myAvatar.objData.CharID;
    }

    [BridgeExport]
    public static function getGender():String {
      return game.world.myAvatar.objData.strGender.toUpperCase();
    }

    [BridgeExport]
    public static function getData():Object {
      if (!game.world.myAvatar) {
        return null;
      }

      return game.world.myAvatar.objData;
    }

    [BridgeExport]
    public static function isLoaded():Boolean {
      return game.world.myAvatar.items.length > 0 && World.isLoaded() && game.world.myAvatar.pMC.artLoaded();
    }

    [BridgeExport]
    public static function goToPlayer(name:String):void {
      if (!name) {
        return;
      }

      game.world['goto'](name);
    }
  }
}
