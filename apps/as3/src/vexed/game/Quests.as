package vexed.game
{
  import vexed.Main;
  import flash.utils.ByteArray;

  public class Quests
  {
    private static var game:Object = Main.getInstance().getGame();

    public static function isInProgress(questId:int):Boolean
    {
      return game.world.isQuestInProgress(questId);
    }

    public static function complete(questId:int, turnIns:int = 1, itemId:int = -1, special:Boolean = false /* idk */):void
    {
      game.world.tryQuestComplete(questId, itemId, special, turnIns);
    }

    public static function accept(questId:int):void
    {
      game.world.acceptQuest(questId);
    }

    public static function load(questId:int):void
    {
      game.world.showQuests([questId], "q");
    }

    public static function get (questId:int):void
    {
      game.world.getQuests([questId]);
    }

    public static function getTree():Array
    {
      var quests:Array = [];
      for each (var q:Object in game.world.questTree)
      {
        var quest:Object = cloneObject(q);
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

      return quests;
    }

    // GetQuestValidationString
    // CanComplete
    // HasRequiredItems

    public static function isOneTimeQuestDone(quest:Object):Boolean
    {
      return quest.bOnce == 1 && (quest.iSlot < 0 || game.world.getQuestValue(quest.iSlot) >= quest.iValue);
    }

    private static function cloneObject(source:Object):Object
    {
      var ba:ByteArray = new ByteArray();
      ba.writeObject(source);
      ba.position = 0;
      return ba.readObject();
    }
  }
}