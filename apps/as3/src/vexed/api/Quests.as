package vexed.api
{
	import vexed.Main;
	import flash.utils.ByteArray;

	public class Quests
	{
		private static var game:* = Main.instance.getGame();

		private static function CloneObject(source:Object):Object
		{
			var ba:ByteArray = new ByteArray();
			ba.writeObject(source);
			ba.position = 0;
			return ba.readObject();
		}

		public static function isInProgress(questID:String):Boolean
		{
			return game.world.isQuestInProgress(parseInt(questID));
		}

		public static function complete(questID:String, qty:int = 1, itemID:String = "-1", special:String = "False"):void
		{
			game.world.tryQuestComplete(parseInt(questID), parseInt(itemID), special == "True", qty);
		}

		public static function accept(questID:String):void
		{
			game.world.acceptQuest(parseInt(questID));
		}

		public static function load(questID:String):void
		{
			// displays quest ui for questID ?
			game.world.showQuests([questID], "q");
		}

		public static function loadMultiple(questIDs:String):void
		{
			game.world.showQuests(questIDs.split(","), "q");
		}

		public static function getQuests(questIDs:String):void
		{
			// gets quest data ?
			game.world.getQuests(questIDs.split(","));
		}

		public static function isAvailable(questID:String):Boolean
		{
			return getQuestValidationString(parseInt(questID)) == "" ? true : false;
		}

		public static function canComplete(questID:String):Boolean
		{
			var id:int = parseInt(questID);
			var validation:String = getQuestValidationString(id);
			return game.world.canTurnInQuest(id) && validation != "";
		}

		public static function hasRequiredItemsForQuest(param1:Object /* quest requirement? */):Boolean
		{
			var _loc_2:* = null;
			var _loc_3:* = 0;
			var _loc_4:* = 0;
			var _loc_5:* = null;
			if (param1.reqd != null && param1.reqd.length > 0)
			{
				for each (_loc_2 in param1.reqd)
				{
					_loc_3 = _loc_2.ItemID;
					_loc_4 = int(_loc_2.iQty);
					_loc_5 = game.world.invTree[_loc_3];
					if (_loc_5 == null || _loc_5.iQty < _loc_4)
					{
						return false;
					}
				}
			}
			return true;
		}

		public static function getQuestValidationString(param1:int):String
		{
			var _loc2_:int = 0;
			var _loc3_:int = 0;
			var _loc4_:int = 0;
			var _loc6_:Object = null;
			var _loc7_:int = 0;
			var _loc8_:int = 0;
			var _loc9_:Object = null;
			var _loc5_:* = null;
			var _loc10_:Object;
			if ((_loc10_ = game.world.questTree[param1]).sField != null && game.world.getAchievement(_loc10_.sField, _loc10_.iIndex) != 0)
			{
				if (_loc10_.sField == "im0")
				{
					return "Monthly Quests are only available once per month.";
				}
				return "Daily Quests are only available once per day.";
			}
			if (_loc10_.bUpg == 1 && !game.world.myAvatar.isUpgraded())
			{
				return "Upgrade is required for this quest!";
			}
			if (_loc10_.iSlot >= 0 && game.world.getQuestValue(_loc10_.iSlot) < _loc10_.iValue - 1)
			{
				return "Quest has not been unlocked!";
			}
			if (_loc10_.iLvl > game.world.myAvatar.objData.intLevel)
			{
				return "Unlocks at Level " + _loc10_.iLvl + ".";
			}
			if (_loc10_.iClass > 0 && game.world.myAvatar.getCPByID(_loc10_.iClass) < _loc10_.iReqCP)
			{
				_loc2_ = game.getRankFromPoints(_loc10_.iReqCP);
				_loc3_ = _loc10_.iReqCP - game.arrRanks[_loc2_ - 1];
				if (_loc3_ > 0)
				{
					return "Requires " + _loc3_ + " Class Points on " + _loc10_.sClass + ", Rank " + _loc2_ + ".";
				}
				return "Requires " + _loc10_.sClass + ", Rank " + _loc2_ + ".";
			}
			if (_loc10_.FactionID > 1 && game.world.myAvatar.getRep(_loc10_.FactionID) < _loc10_.iReqRep)
			{
				_loc2_ = game.getRankFromPoints(_loc10_.iReqRep);
				if ((_loc4_ = _loc10_.iReqRep - game.arrRanks[_loc2_ - 1]) > 0)
				{
					return "Requires " + _loc4_ + " Reputation for " + _loc10_.sFaction + ", Rank " + _loc2_ + ".";
				}
				return "Requires " + _loc10_.sFaction + ", Rank " + _loc2_ + ".";
			}
			if (_loc10_.reqd != null && !hasRequiredItemsForQuest(_loc10_))
			{
				_loc5_ = "Required Item(s): ";
				for each (_loc6_ in _loc10_.reqd)
				{
					_loc7_ = _loc6_.ItemID;
					_loc8_ = int(_loc6_.iQty);
					if ((_loc9_ = game.world.invTree[_loc7_]).sES == "ar")
					{
						_loc2_ = game.getRankFromPoints(_loc8_);
						_loc3_ = _loc8_ - game.arrRanks[_loc2_ - 1];
						if (_loc3_ > 0)
						{
							_loc5_ = _loc5_ + _loc3_ + " Class Points on ";
						}
						_loc5_ = _loc5_ + _loc9_.sName + ", Rank " + _loc2_;
					}
					else
					{
						_loc5_ += _loc9_.sName;
						if (_loc8_ > 1)
						{
							_loc5_ = _loc5_ + "x" + _loc8_;
						}
					}
					_loc5_ += ", ";
				}
				return _loc5_.substr(0, _loc5_.length - 2) + ".";
			}
			return "";
		}
	}
}