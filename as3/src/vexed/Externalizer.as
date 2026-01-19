package vexed
{
  import flash.external.ExternalInterface;
  import vexed.module.Modules;
  import vexed.game.*;
  import flash.text.TextField;

  public class Externalizer
  {
    public function init(root:Main):void
    {
      externalize("getGameObject", Main.getGameObject);
      externalize("getGameObjectS", Main.getGameObjectS);
      externalize("getGameObjectKey", Main.getGameObjectKey);
      externalize("setGameObject", Main.setGameObject);
      externalize("setGameObjectKey", Main.setGameObjectKey);
      externalize("getArrayObject", Main.getArrayObject);
      externalize("setArrayObject", Main.setArrayObject);
      externalize("callGameFunction", Main.callGameFunction);
      externalize("callGameFunction0", Main.callGameFunction0);
      externalize("selectArrayObjects", Main.selectArrayObjects);
      externalize("isNull", Main.isNull);
      externalize("sendClientPacket", Main.sendClientPacket);
      externalize("isConnMcBackButtonVisible", Main.isConnMcBackButtonVisible);
      externalize("getConnMcText", Main.getConnMcText);
      externalize("hideConnMc", Main.hideConnMc);

      // Auth - done
      externalize("authIsLoggedIn", Auth.isLoggedIn);
      externalize("authIsTemporarilyKicked", Auth.isTemporarilyKicked);
      externalize("authLogin", Auth.login);
      externalize("authLogout", Auth.logout);
      externalize("authConnectTo", Auth.connectTo);

      // Bank - done
      externalize("bankGetItem", Bank.getItem);
      externalize("bankContains", Bank.contains);
      externalize("bankLoadItems", Bank.loadItems);
      externalize("bankDeposit", Bank.deposit);
      externalize("bankWithdraw", Bank.withdraw);
      externalize("bankSwap", Bank.swap);

      // Combat
      externalize("combatHasTarget", Combat.hasTarget);
      externalize("combatGetTarget", Combat.getTarget);
      externalize("combatUseSkill", Combat.useSkill);
      externalize("combatForceUseSkill", Combat.forceUseSkill);
      // externalize("combatCanUseSkill", Combat.canUseSkill);
      externalize("combatGetSkillCooldownRemaining", Combat.getSkillCooldownRemaining);
      externalize("combatCancelAutoAttack", Combat.cancelAutoAttack);
      externalize("combatCancelTarget", Combat.cancelTarget);
      externalize("combatAttackMonster", Combat.attackMonster);
      externalize("combatAttackMonsterById", Combat.attackMonsterById);

      // DropList
      externalize("dropStackAcceptDrop", DropList.acceptDrop);
      externalize("dropStackRejectDrop", DropList.rejectDrop);
      externalize("dropStackIsUsingCustomDrops", DropList.isUsingCustomDrops);
      externalize("dropStackGetDrops", DropList.getDrops);
      externalize("dropStackGetItems", DropList.getItems);
      externalize("dropStackToggleUi", DropList.toggleUi);

      // House - done
      externalize("houseGetItem", House.getItem);
      externalize("houseContains", House.contains);

      // Inventory - done
      externalize("inventoryGetItem", Inventory.getItem);
      externalize("inventoryContains", Inventory.contains);

      // Player
      externalize("playerWalkTo", Player.walkTo);
      externalize("playerIsLoaded", Player.isLoaded);

      // Quests
      externalize("questsIsInProgress", Quests.isInProgress);
      externalize("questsComplete", Quests.complete);
      externalize("questsAccept", Quests.accept);
      externalize("questsAbandon", Quests.abandon);
      externalize("questsLoad", Quests.load);
      externalize("questsGet", Quests.get );
      externalize("questsGetMultiple", Quests.getMultiple);
      externalize("questsGetTree", Quests.getTree);
      externalize("questsGetQuestValidationString", Quests.getQuestValidationString);
      externalize("questsHasRequiredItemsForQuest", Quests.hasRequiredItemsForQuest);
      externalize("questsIsAvailable", Quests.isAvailable);
      externalize("questsCanCompleteQuest", Quests.canComplete);
      externalize("questsIsOneTimeQuestDone", Quests.isOneTimeQuestDone);

      // Settings
      externalize("settingsInfiniteRange", Settings.infiniteRange);
      externalize("settingsProvokeCell", Settings.provokeCell);
      externalize("settingsEnemyMagnet", Settings.enemyMagnet);
      externalize("settingsLagKiller", Settings.lagKiller);
      externalize("settingsSkipCutscenes", Settings.skipCutscenes);
      externalize("settingsSetName", Settings.setName);
      externalize("settingsSetGuild", Settings.setGuild);
      externalize("settingsSetWalkSpeed", Settings.setWalkSpeed);
      externalize("settingsSetAccessLevel", Settings.setAccessLevel);
      externalize("settingsSetDeathAds", Settings.setDeathAds);
      externalize("settingsSetDisableCollisions", function(on:Boolean):void
        {
          if (on)
          {
            Modules.enable("DisableCollisions");
          }
          else
          {
            Modules.disable("DisableCollisions");
          }
        });
      externalize("settingsSetDisableFX", function(on:Boolean):void
        {
          if (on)
          {
            Modules.enable("DisableFX");
          }
          else
          {
            Modules.disable("DisableFX");
          }
        });
      externalize("settingsSetHidePlayers", function(on:Boolean):void
        {
          if (on)
          {
            Modules.enable("HidePlayers");
          }
          else
          {
            Modules.disable("HidePlayers");
          }
        });
      externalize("settingsSetFPS", function(fps:int):void
        {
          Main.getInstance().getStage().frameRate = fps;
        });

      // Shops

      // TempInventory
      externalize("tempInventoryGetItem", TempInventory.getItem);
      externalize("tempInventoryContains", TempInventory.contains);

      // World
      externalize("worldIsLoaded", World.isLoaded);
      externalize("worldIsActionAvailable", World.isActionAvailable);
      externalize("worldGetCellMonsters", World.getCellMonsters);
      externalize("worldGetCells", World.getCells);
      externalize("worldGetCellPads", World.getCellPads);

      externalize("isTextFieldFocused", function():Boolean
        {
          var game:* = Main.getInstance().getGame();

          try
          {
            return game.stage.focus is TextField;
          }
          catch (e:Error)
          {
            return false;
          }

          return false;
        });

      debug("Externalizer::init done.");
    }

    public function externalize(name:String, func:Function):void
    {
      ExternalInterface.addCallback(name, func);
    }

    public function call(name:String, ...rest):*
    {
      return ExternalInterface.call(name, rest);
    }

    public function debug(message:String):void
    {
      this.call("flashDebug", message);
    }
  }
}
