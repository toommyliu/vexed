package vexed.game {
  import vexed.Main;

  public class Player {
    private static var game:Object = Main.getInstance().getGame();

    public static function joinMap(map:String, cell:String = "Enter", pad:String = "Spawn"):void {
      if (!map)
        return;

      game.world.gotoTown(map, cell, pad);
    }

    public static function getMap():String {
      return game.world.strMapName;
    }

    public static function jump(cell:String, pad:String = "Spawn"):void {
      if (!cell)
        return;

      game.world.moveToCell(cell, pad);
    }

    public static function getCell():String {
      return game.world.strFrame;
    }

    public static function getPad():String {
      return game.world.strPad;
    }

    public static function getFactions():Array {
      return game.world.myAvatar.factions;
    }

    public static function getState():int {
      return game.world.myAvatar.dataLeaf.intState;
    }

    public static function getHp():int {
      return game.world.myAvatar.dataLeaf.intHP;
    }

    public static function getMaxHp():int {
      return game.world.myAvatar.dataLeaf.intHPMax;
    }

    public static function getMp():int {
      return game.world.myAvatar.dataLeaf.intMP;
    }

    public static function getMaxMp():int {
      return game.world.myAvatar.dataLeaf.intMPMax;
    }

    public static function getLevel():int {
      return game.world.myAvatar.dataLeaf.intLevel;
    }

    public static function getGold():int {
      return game.world.myAvatar.objData.intGold;
    }

    public static function isMember():Boolean {
      return game.world.myAvatar.isUpgraded();
    }

    public static function isAfk():Boolean {
      return game.world.myAvatar.dataLeaf.afk;
    }

    public static function getPosition():Array {
      return [game.world.myAvatar.pMC.x, game.world.myAvatar.pMC.y];
    }

    public static function walkTo(x:int, y:int, walkSpeed:* = null):Boolean {
      if (!x || !y)
        return false;

      if (!walkSpeed)
        walkSpeed = game.world.WALKSPEED;

      game.world.myAvatar.pMC.walkTo(x, y, walkSpeed);
      game.world.moveRequest({mc: game.world.myAvatar.pMC, tx: x, ty: y, sp: walkSpeed});
      return true;
    }

    public static function rest():void {
      game.world.rest();
    }

    public static function useBoost(itemId:int):Boolean {
      var item:Object = Inventory.getItem(itemId);
      if (!item) {
        return false;
      }

      game.world.sendUseItemRequest(item);
      return true;
    }

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

    public static function getClassName():String {
      return game.world.myAvatar.objData.strClassName.toUpperCase();
    }

    public static function getUserId():int {
      return game.world.myAvatar.uid;
    }

    public static function getCharId():int {
      return game.world.myAvatar.objData.CharID;
    }

    public static function getGender():String {
      return game.world.myAvatar.objData.strGender.toUpperCase();
    }

    public static function getData():Object {
      if (!game.world.myAvatar) {
        return null;
      }

      return game.world.myAvatar.objData;
    }

    public static function isLoaded():Boolean {
      return game.world.myAvatar.items.length > 0 && World.isLoaded() && game.world.myAvatar.pMC.artLoaded();
    }

    public static function goToPlayer(name:String):void {
      if (!name) {
        return;
      }

      game.world['goto'](name);
    }
  }
}