package grimoire.game
{
	import flash.utils.*;
	import grimoire.*;

	public class Quests extends Object
	{

		public function Quests()
		{
			return;
		}

		public static function IsInProgress(id:String):String
		{
			return Root.Game.world.isQuestInProgress(parseInt(id)) ? Root.TrueString : Root.FalseString;
		}

		public static function Complete(id:String, qty:int = 1, itemID:String = "-1", special:String = "False"):void
		{
			Root.Game.world.tryQuestComplete(parseInt(id), parseInt(itemID), special == "True", qty);
		}

		public static function Accept(id:String):void
		{
			Root.Game.world.acceptQuest(parseInt(id));
		}

		public static function Load(id:String):void
		{
			Root.Game.world.showQuests([id], "q");
		}

		public static function LoadMultiple(ids:String):void
		{
			Root.Game.world.showQuests(ids.split(","), "q");
		}

		public static function GetQuests(ids:String):void
		{
			Root.Game.world.getQuests(ids.split(","));
		}

		public static function IsAvailable(param1:String):String
		{
			return GetQuestValidationString(parseInt(param1)) == "" ? (Root.TrueString) : (Root.FalseString);
		}

		public static function CanComplete(id:String):String
		{

			var validation:String = GetQuestValidationString(parseInt(id));
			// if (validation != "") {
			// Root.Game.chatF.pushMsg("warning", "Can\'t turn in quest(" + id + "), message : " + validation, "SERVER", "", 0);
			// }
			return Root.Game.world.canTurnInQuest(parseInt(id)) && validation == "" ? Root.TrueString : Root.FalseString;
		}

		private static function CloneObject(source:Object):Object
		{
			var ba:ByteArray = new ByteArray();
			ba.writeObject(source);
			ba.position = 0;
			return ba.readObject();
		}

		public static function GetQuestTree():String
		{
			var quests:Array = [];
			for each (var q:Object in Root.Game.world.questTree)
			{
				var quest:Object = CloneObject(q);
				trace("quest: " + quest);
				var requirements:Array = [];
				var rewards:Array = [];

				if (q.turnin != null && q.oItems != null)
				{
					for each (var req:Object in q.turnin)
					{
						var _req:Object = new Object();
						var item:Object = q.oItems[req.ItemID];
						_req.sName = item.sName;
						_req.ItemID = item.ItemID;
						_req.iQty = req.iQty;
						requirements.push(_req);
					}
				}

				quest.RequiredItems = requirements;

				if (q.reward != null && q.oRewards != null)
				{
					for each (var rew:Object in q.reward)
					{
						for each (var rewContainer:* in q.oRewards)
						{
							for each (var _item:Object in rewContainer)
							{
								if (_item.ItemID != null && _item.ItemID == rew.ItemID)
								{
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
			return JSON.stringify(quests);
		}

		public static function HasRequiredItemsForQuest(param1:Object):Boolean
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
					_loc_5 = Root.Game.world.invTree[_loc_3];
					if (_loc_5 == null || _loc_5.iQty < _loc_4)
					{
						return false;
					}
				}
			}
			return true;
		}

		public static function GetQuestValidationString(param1:int):String
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
			if ((_loc10_ = Root.Game.world.questTree[param1]).sField != null && Root.Game.world.getAchievement(_loc10_.sField, _loc10_.iIndex) != 0)
			{
				if (_loc10_.sField == "im0")
				{
					return "Monthly Quests are only available once per month.";
				}
				return "Daily Quests are only available once per day.";
			}
			if (_loc10_.bUpg == 1 && !Root.Game.world.myAvatar.isUpgraded())
			{
				return "Upgrade is required for this quest!";
			}
			if (_loc10_.iSlot >= 0 && Root.Game.world.getQuestValue(_loc10_.iSlot) < _loc10_.iValue - 1)
			{
				return "Quest has not been unlocked!";
			}
			if (_loc10_.iLvl > Root.Game.world.myAvatar.objData.intLevel)
			{
				return "Unlocks at Level " + _loc10_.iLvl + ".";
			}
			if (_loc10_.iClass > 0 && Root.Game.world.myAvatar.getCPByID(_loc10_.iClass) < _loc10_.iReqCP)
			{
				_loc2_ = Root.Game.getRankFromPoints(_loc10_.iReqCP);
				_loc3_ = _loc10_.iReqCP - Root.Game.arrRanks[_loc2_ - 1];
				if (_loc3_ > 0)
				{
					return "Requires " + _loc3_ + " Class Points on " + _loc10_.sClass + ", Rank " + _loc2_ + ".";
				}
				return "Requires " + _loc10_.sClass + ", Rank " + _loc2_ + ".";
			}
			if (_loc10_.FactionID > 1 && Root.Game.world.myAvatar.getRep(_loc10_.FactionID) < _loc10_.iReqRep)
			{
				_loc2_ = Root.Game.getRankFromPoints(_loc10_.iReqRep);
				if ((_loc4_ = _loc10_.iReqRep - Root.Game.arrRanks[_loc2_ - 1]) > 0)
				{
					return "Requires " + _loc4_ + " Reputation for " + _loc10_.sFaction + ", Rank " + _loc2_ + ".";
				}
				return "Requires " + _loc10_.sFaction + ", Rank " + _loc2_ + ".";
			}
			if (_loc10_.reqd != null && !HasRequiredItemsForQuest(_loc10_))
			{
				_loc5_ = "Required Item(s): ";
				for each (_loc6_ in _loc10_.reqd)
				{
					_loc7_ = _loc6_.ItemID;
					_loc8_ = int(_loc6_.iQty);
					if ((_loc9_ = Root.Game.world.invTree[_loc7_]).sES == "ar")
					{
						_loc2_ = Root.Game.getRankFromPoints(_loc8_);
						_loc3_ = _loc8_ - Root.Game.arrRanks[_loc2_ - 1];
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