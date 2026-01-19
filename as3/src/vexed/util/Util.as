package vexed.util {
  import vexed.Main;
  import flash.display.MovieClip;

  public class Util {

    // if (!actionTimeCheck(actionObj)) {
    // errMsg = "Ability \'" + actionObj.nam + "\' is not ready yet.";
    // }

    public static function actionTimeCheck(param1:*, param2:Boolean = false /* always false */):Boolean {
      const game:* = Main.getInstance().getGame();
      const world:* = game.world;

      var _loc3_:Number = NaN;
      var _loc4_:Number = NaN;
      var _loc5_:int = 0;
      _loc3_ = Number(new Date().getTime());
      _loc4_ = 1 - Math.min(Math.max(game.world.myAvatar.dataLeaf.sta.$tha, -1), 0.5);
      if (param1.auto) {
        if (game.world.autoActionTimer.running) {
          return false;
        }
        return true;
      }
      if (!param2) {
        if (_loc3_ - game.world.GCDTS < game.world.GCD) {
          return false;
        }
      }
      if (param1.OldCD != null) {
        _loc5_ = Math.round(param1.OldCD * _loc4_);
      }
      else {
        _loc5_ = Math.round(param1.cd * _loc4_);
      }
      if (_loc3_ - param1.ts >= _loc5_) {
        delete param1.OldCD;
        return true;
      }
      return false;
    }

    public static function getSkillCooldownRemaining(param1:*):int {
      var game:* = Main.getInstance().getGame();

      var _loc_4:* = NaN;
      var _loc_2:* = new Date().getTime();
      var _loc_3:* = 1 - Math.min(Math.max(game.world.myAvatar.dataLeaf.sta.$tha, -1), 0.5);
      if (param1.OldCD != null) {
        _loc_4 = Math.round(param1.OldCD * _loc_3);
        delete param1.OldCD;
      }
      else {
        _loc_4 = Math.round(param1.cd * _loc_3);
      }
      var _loc_5:* = game.world.GCD - (_loc_2 - game.world.GCDTS);
      if (_loc_5 < 0) {
        _loc_5 = 0;
      }
      var _loc_6:* = _loc_4 - (_loc_2 - param1.ts);
      if (_loc_6 < 0) {
        _loc_6 = 0;
      }
      return Math.max(_loc_5, _loc_6);
    }

    public static function canBuyItem(param1:Object):Boolean {
      const game:* = Main.getInstance().getGame();
      if (param1.bStaff == 1 && game.world.myAvatar.objData.intAccessLevel < 40) {
        return false;
      }
      else if (game.world.shopinfo.sField != "" && game.world.getAchievement(game.world.shopinfo.sField, game.world.shopinfo.iIndex) != 1) {
        // e.g. NostalgiaQuest
        return false;
      }
      else if (param1.bUpg == 1 && !game.world.myAvatar.isUpgraded()) {
        return false;
      }
      else if (param1.FactionID > 1 && game.world.myAvatar.getRep(param1.FactionID) < param1.iReqRep) {
        return false;
      }
      else if (!validateArmor(param1)) {
        return false;
      }
      else if (param1.iQSindex >= 0 && game.world.getQuestValue(param1.iQSindex) < int(param1.iQSvalue)) {
        return false;
      }
      else if (
          (game.world.myAvatar.isItemInInventory(param1.ItemID) || game.world.myAvatar.isItemInBank(param1.ItemID)) &&
          game.world.myAvatar.isItemStackMaxed(param1.ItemID)
        ) {
        return false;
      }
      else if (param1.bCoins == 0 && param1.iCost > game.world.myAvatar.objData.intGold) {
        return false;
      }
      else if (param1.bCoins == 1 && param1.iCost > game.world.myAvatar.objData.intCoins) {
        return false;
      }
      else if (
          !game.isHouseItem(param1) && game.world.myAvatar.items.length >= game.world.myAvatar.objData.iBagSlots ||
          game.isHouseItem(param1) && game.world.myAvatar.houseitems.length >= game.world.myAvatar.objData.iHouseSlots
        ) {
        return false;
      }

      return true;
    }

    private static function validateArmor(param1:Object):Boolean {
      const game:* = Main.getInstance().getGame();

      var _loc10_:uint = 0;
      var _loc11_:uint = 0;
      var _loc2_:Array = [];
      var _loc3_:Object = {};
      var _loc4_:int = 0;
      var _loc5_:int = 10;
      var _loc6_:Boolean = true;
      var _loc7_:Boolean = false;
      var _loc8_:Boolean = false;
      var _loc9_:int = int(param1.ItemID);
      switch (_loc9_) {
        case 319:
        case 2083:
          _loc7_ = true;
          _loc2_ = [16, 15654, 407, 20, 15651, 409];
          break;
        case 409:
          _loc8_ = true;
          _loc2_ = [20, 15651];
          break;
        case 408:
          _loc8_ = true;
          _loc2_ = [17, 15653];
          break;
        case 410:
          _loc8_ = true;
          _loc2_ = [18, 15652];
          break;
        case 407:
          _loc8_ = true;
          _loc2_ = [16, 15654];
      }
      if (_loc7_) {
        _loc10_ = 0;
        while (_loc10_ < _loc2_.length) {
          if (game.world.myAvatar.getCPByID(_loc2_[_loc10_]) < 302500) {
            _loc6_ = false;
          }
          else {
            _loc6_ = true;
            if (_loc10_ < 2) {
              _loc10_ = 2;
            }
            if (_loc10_ < 5 && _loc10_ > 2) {
              break;
            }
          }
          _loc10_++;
        }
        return _loc6_;
      }
      if (_loc8_) {
        _loc11_ = 0;
        while (_loc11_ < _loc2_.length) {
          if (game.world.myAvatar.getCPByID(_loc2_[_loc11_]) >= param1.iReqCP) {
            return true;
          }
          _loc11_++;
        }
        return false;
      }
      return !(Number(param1.iClass) > 0 && game.world.myAvatar.getCPByID(param1.iClass) < param1.iReqCP);
    }

    public static function findItem(items:Array, key:*):Object {
      if (items == null) return null;

      var item:Object;
      if (key is String) {
        var lowerKey:String = key.toLowerCase();
        for each (item in items) {
          if (item != null && item.sName != null && (item.sName === key || item.sName.toLowerCase() === lowerKey))
            return item;
        }
      } else if (key is int) {
        for each (item in items) {
          if (item != null && item.ItemID == key)
            return item;
        }
      }

      return null;
    }

    public static function hasItem(items:Array, key:*, quantity:int = 1):Boolean {
      var item:Object = findItem(items, key);
      return item != null && item.iQty >= quantity;
    }
  }
}
