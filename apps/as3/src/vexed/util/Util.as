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

    // ServerList
    public static function killModals():void {
      const game:* = Main.getInstance().getGame();

      const loc1_:MovieClip = game.mcLogin.ModalStack;
      var loc2_:MovieClip = null;
      var loc3_:int = 0;
      while (loc3_ < loc1_.numChildren) {
        loc2_ = loc1_.getChildAt(loc3_) as MovieClip;
        if ("fClose" in loc2_) {
          loc2_.fClose();
        }
        loc3_++;
      }
    }

    public static function serializeAuras(auras:*):Array {
      var ret:Array = [];

      for each (var aura:* in auras) {
        if (!aura.nam) {
          continue;
        }

        ret.push({
              name: aura.nam,
              value: aura.val ? aura.val : 1
            });
      }

      return ret;
    }
  }
}