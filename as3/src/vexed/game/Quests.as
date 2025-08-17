package vexed.game {
  import vexed.Main;
  import flash.utils.ByteArray;

  public class Quests {
    private static var game:Object = Main.getInstance().getGame();

    public static function isInProgress(questId:int):Boolean {
      return game.world.isQuestInProgress(questId);
    }

    public static function complete(questId:int, turnIns:int = 1, itemId:int = -1, special:Boolean = false /* idk */):void {
      game.world.tryQuestComplete(questId, itemId, special, turnIns);
    }

    public static function accept(questId:int):void {
      game.world.acceptQuest(questId);
    }

    public static function load(questId:int):void {
      game.world.showQuests([questId], "q");
    }

    public static function get (questId:int):void {
      game.world.getQuests([questId]);
    }

    public static function getMultiple(questIds:String):void {
      game.world.getQuests(questIds.split(","));
    }

    public static function getTree():Array {
      var quests:Array = [];
      for each (var q:Object in game.world.questTree) {
        var quest:Object = cloneObject(q);
        var requirements:Array = [];
        var rewards:Array = [];

        if (q.turnin != null && q.oItems != null) {
          for each (var req:Object in q.turnin) {
            var _req:Object = new Object();
            var item:Object = q.oItems[req.ItemID];
            _req.sName = item.sName;
            _req.ItemID = item.ItemID;
            _req.iQty = req.iQty;
            requirements.push(_req);
          }
        }

        quest.RequiredItems = requirements;

        if (q.reward != null && q.oRewards != null) {
          for each (var rew:Object in q.reward) {
            for each (var rewContainer:* in q.oRewards) {
              for each (var _item:Object in rewContainer) {
                if (_item.ItemID != null && _item.ItemID == rew.ItemID) {
                  var reward:Object = new Object();
                  reward.sName = _item.sName;
                  reward.ItemID = rew.ItemID;
                  reward.iQty = rew.iQty;
                  reward.DropChance = String(rew.iRate) + "%";
                  rewards.push(reward);
                }
              }
            }
          }
        }

        quest.Rewards = rewards;
        quests.push(quest);
      }

      return quests;
    }

    public static function getQuestValidationString(questObj:Object):String {
      var _loc2_:int = 0;
      var _loc3_:* = undefined;
      var _loc4_:int = 0;
      var _loc5_:* = undefined;
      var _loc6_:* = null;
      var _loc7_:int = 0;
      var _loc8_:Object = null;
      var _loc9_:int = 0;
      var _loc10_:int = 0;
      var _loc11_:* = undefined;
      if (questObj.sField != null && game.world.getAchievement(questObj.sField, questObj.iIndex) != 0) {
        if (questObj.sField == "im0") {
          return "Monthly Quests are only available once per month.";
        }
        if (questObj.sField == "iw0") {
          return "Weekly Quests are only available once per week.";
        }
        return "Daily Quests are only available once per day.";
      }
      if (questObj.bUpg == 1 && !game.world.myAvatar.isUpgraded()) {
        return "Upgrade is required for this quest!";
      }
      if (questObj.iSlot >= 0 && game.world.getQuestValue(questObj.iSlot) < questObj.iValue - 1) {
        return "Quest has not been unlocked!";
      }
      if (questObj.iLvl > game.world.myAvatar.objData.intLevel) {
        return "Unlocks at Level " + questObj.iLvl + ".";
      }
      if (questObj.iClass > 0 && game.world.myAvatar.getCPByID(questObj.iClass) < questObj.iReqCP) {
        _loc2_ = game.getRankFromPoints(questObj.iReqCP);
        _loc3_ = questObj.iReqCP - game.arrRanks[_loc2_ - 1];
        if (_loc3_ > 0) {
          return "Requires " + _loc3_ + " Class Points on " + questObj.sClass + ", Rank " + _loc2_ + ".";
        }
        return "Requires " + questObj.sClass + ", Rank " + _loc2_ + ".";
      }
      if (questObj.FactionID > 1 && game.world.myAvatar.getRep(questObj.FactionID) < questObj.iReqRep) {
        _loc4_ = game.getRankFromPoints(questObj.iReqRep);
        _loc5_ = questObj.iReqRep - game.arrRanks[_loc4_ - 1];
        if (_loc5_ > 0) {
          return "Requires " + _loc5_ + " Reputation for " + questObj.sFaction + ", Rank " + _loc4_ + ".";
        }
        return "Requires " + questObj.sFaction + ", Rank " + _loc4_ + ".";
      }
      if (questObj.reqd != null && !hasRequiredItemsForQuest(questObj)) {
        _loc6_ = "Required Item(s): ";
        _loc7_ = 0;
        while (_loc7_ < questObj.reqd.length) {
          _loc8_ = game.world.invTree[questObj.reqd[_loc7_].ItemID];
          _loc9_ = int(questObj.reqd[_loc7_].iQty);
          if (_loc8_.sES == "ar") {
            _loc10_ = game.getRankFromPoints(_loc9_);
            _loc11_ = _loc9_ - game.arrRanks[_loc10_ - 1];
            if (_loc11_ > 0) {
              _loc6_ += _loc11_ + " Class Points on ";
            }
            _loc6_ += _loc8_.sName + ", Rank " + _loc10_;
          }
          else {
            _loc6_ += _loc8_.sName;
            if (_loc9_ > 1) {
              _loc6_ += "x" + _loc9_;
            }
          }
          _loc6_ += ", ";
          _loc7_++;
        }
        return _loc6_.substr(0, _loc6_.length - 2) + ".";
      }
      return "";
    }

    public static function hasRequiredItemsForQuest(questObj:Object):Boolean {
      var _loc2_:int = 0;
      var _loc3_:* = undefined;
      var _loc4_:int = 0;
      if (questObj.reqd != null && questObj.reqd.length > 0) {
        _loc2_ = 0;
        while (_loc2_ < questObj.reqd.length) {
          _loc3_ = questObj.reqd[_loc2_].ItemID;
          _loc4_ = int(questObj.reqd[_loc2_].iQty);
          if (game.world.invTree[_loc3_] == null || int(game.world.invTree[_loc3_].iQty) < _loc4_) {
            return false;
          }
          _loc2_++;
        }
      }
      return true;
    }

    public static function isAvailable(questId:int):Boolean {
      var quest:Object = game.world.questTree[questId];

      if (!quest)
        return false;

      return getQuestValidationString(quest) == "";
    }

    public static function canComplete(questId:int):Boolean {
      var quest:Object = game.world.questTree[questId];

      if (!quest)
        return false;

      return game.world.canTurnInQuest(questId) && getQuestValidationString(quest) == "";
    }

    public static function isOneTimeQuestDone(questId:int):Boolean {
      var quest:Object = game.world.questTree[quest];

      if (!quest)
        return false;

      return quest.bOnce == 1 && (quest.iSlot < 0 || game.world.getQuestValue(quest.iSlot) >= quest.iValue);
    }

    private static function cloneObject(source:Object):Object {
      var ba:ByteArray = new ByteArray();
      ba.writeObject(source);
      ba.position = 0;
      return ba.readObject();
    }
  }
}