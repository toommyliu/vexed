package vexed {
  import flash.external.ExternalInterface;
  import vexed.module.Modules;
  import vexed.game.*;
  import flash.text.TextField;
  // import flash.utils.Dictionary;
  // import vexed.module.Drops;

  public class Externalizer {
    public function init(root:Main):void {
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

      // Auth
      externalize("authIsLoggedIn", Auth.isLoggedIn);
      externalize("authIsTemporarilyKicked", Auth.isTemporarilyKicked);
      externalize("authLogin", Auth.login);
      externalize("authLogout", Auth.logout);
      externalize("authGetServers", Auth.getServers);
      externalize("authConnectTo", Auth.connectTo);

      // Bank
      externalize("bankGetItems", Bank.getItems);
      externalize("bankGetItem", Bank.getItem);
      externalize("bankContains", Bank.contains);
      externalize("bankLoadItems", Bank.loadItems);
      externalize("bankGetSlots", Bank.getSlots);
      externalize("bankGetUsedSlots", Bank.getUsedSlots);
      externalize("bankDeposit", Bank.deposit);
      externalize("bankWithdraw", Bank.withdraw);
      externalize("bankSwap", Bank.swap);
      externalize("bankOpen", Bank.open);
      externalize("bankIsOpen", Bank.isOpen);

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

      // DropStack
      externalize("dropStackAcceptDrop", DropStack.acceptDrop);
      externalize("dropStackRejectDrop", DropStack.rejectDrop);
      externalize("dropStackIsUsingCustomDrops", DropStack.isUsingCustomDrops);
      // externalize("dropStackSetCustomDropsUI", DropStack.);
      // externalize("dropStackIsCustomDropsUiOpen", DropStack.isCustomDropsUiOpen);
      // externalize("dropStackSetCustomDropsUiOpen", DropStack.setCustomDropsUiOpen);
      // House
      externalize("houseGetItems", House.getItems);
      externalize("houseGetItem", House.getItem);
      externalize("houseGetSlots", House.getSlots);
      externalize("houseGetUsedSlots", House.getUsedSlots);

      // Inventory
      externalize("inventoryGetItems", Inventory.getItems);
      externalize("inventoryGetItem", Inventory.getItem);
      externalize("inventoryContains", Inventory.contains);
      externalize("inventoryGetSlots", Inventory.getSlots);
      externalize("inventoryGetUsedSlots", Inventory.getUsedSlots);
      externalize("inventoryEquip", Inventory.equip);

      // Player
      externalize("playerJoinMap", Player.joinMap);
      externalize("playerGetMap", Player.getMap);
      externalize("playerJump", Player.jump);
      externalize("playerGetCell", Player.getCell);
      externalize("playerGetPad", Player.getPad);
      externalize("playerGetFactions", Player.getFactions);
      externalize("playerGetState", Player.getState);
      externalize("playerGetHp", Player.getHp);
      externalize("playerGetMaxHp", Player.getMaxHp);
      externalize("playerGetMp", Player.getMp);
      externalize("playerGetMaxMp", Player.getMaxMp);
      externalize("playerGetLevel", Player.getLevel);
      externalize("playerGetGold", Player.getGold);
      externalize("playerIsMember", Player.isMember);
      externalize("playerIsAfk", Player.isAfk);
      externalize("playerGetPosition", Player.getPosition);
      externalize("playerWalkTo", Player.walkTo);
      externalize("playerRest", Player.rest);
      externalize("playerUseBoost", Player.useBoost);
      externalize("playerHasActiveBoost", Player.hasActiveBoost);
      externalize("playerGetClassName", Player.getClassName);
      externalize("playerGetUserId", Player.getUserId);
      externalize("playerGetCharId", Player.getCharId);
      externalize("playerGetGender", Player.getGender);
      externalize("playerGetData", Player.getData);
      externalize("playerIsLoaded", Player.isLoaded);
      externalize("playerGoTo", Player.goToPlayer);

      // Quests
      externalize("questsIsInProgress", Quests.isInProgress);
      externalize("questsComplete", Quests.complete);
      externalize("questsAccept", Quests.accept);
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
      externalize("settingsProvokeMap", Settings.provokeMap);
      externalize("settingsProvokeCell", Settings.provokeCell);
      externalize("settingsEnemyMagnet", Settings.enemyMagnet);
      externalize("settingsLagKiller", Settings.lagKiller);
      externalize("settingsSkipCutscenes", Settings.skipCutscenes);
      externalize("settingsSetName", Settings.setName);
      externalize("settingsSetGuild", Settings.setGuild);
      externalize("settingsSetWalkSpeed", Settings.setWalkSpeed);
      externalize("settingsSetAccessLevel", Settings.setAccessLevel);
      externalize("settingsSetDeathAds", Settings.setDeathAds);
      externalize("settingsSetDisableCollisions", function(on:Boolean):void {
          if (on) {
            Modules.enable("DisableCollisions");
          }
          else {
            Modules.disable("DisableCollisions");
          }
        });
      externalize("settingsSetDisableFX", function(on:Boolean):void {
          if (on) {
            Modules.enable("DisableFX");
          }
          else {
            Modules.disable("DisableFX");
          }
        });
      externalize("settingsSetHidePlayers", function(on:Boolean):void {
          if (on) {
            Modules.enable("HidePlayers");
          }
          else {
            Modules.disable("HidePlayers");
          }
        });
      externalize("settingsSetFPS", function(fps:int):void {
          Main.getInstance().getStage().frameRate = fps;
        });

      // Shops
      externalize("shopGetInfo", Shops.getInfo);
      externalize("shopGetItems", Shops.getItems);
      externalize("shopGetItem", Shops.getItem);
      externalize("shopBuyByName", Shops.buyByName);
      externalize("shopBuyById", Shops.buyById);
      externalize("shopSellByName", Shops.sellByName);
      externalize("shopSellById", Shops.sellById);
      externalize("shopLoad", Shops.load);
      externalize("shopLoadHairShop", Shops.loadHairShop);
      externalize("shopLoadArmorCustomize", Shops.loadArmorCustomize);

      // TempInventory
      externalize("tempInventoryGetItems", TempInventory.getItems);
      externalize("tempInventoryGetItem", TempInventory.getItem);
      externalize("tempInventoryContains", TempInventory.contains);

      // World
      externalize("worldIsLoaded", World.isLoaded);
      externalize("worldGetPlayerNames", World.getPlayerNames);
      externalize("worldGetPlayers", World.getPlayers);
      externalize("worldGetPlayer", World.getPlayer);
      externalize("worldIsPlayerInCell", World.isPlayerInCell);
      externalize("worldIsActionAvailable", World.isActionAvailable);
      externalize("worldGetCellMonsters", World.getCellMonsters);
      externalize("worldGetMonsterByName", World.getMonsterByName);
      externalize("worldGetMonsterByMonMapId", World.getMonsterByMonMapId);
      // externalize("worldIsMonsterAvailable", World.isMonsterAvailable);
      externalize("worldGetCells", World.getCells);
      externalize("worldGetCellPads", World.getCellPads);
      // externalize("worldGetItemTree", World.getItemTree);
      externalize("worldGetRoomId", World.getRoomId);
      externalize("worldGetRoomNumber", World.getRoomNumber);
      externalize("worldReload", World.reload);
      externalize("worldLoadSwf", World.loadSwf);
      externalize("worldGetMapItem", World.getMapItem);
      externalize("worldSetSpawnPoint", World.setSpawnPoint);
      externalize("worldGetPlayerAuras", World.getPlayerAuras);

      externalize("isTextFieldFocused", function():Boolean {
          var game:* = Main.getInstance().getGame();

          try {
            return game.stage.focus is TextField;
          }
          catch (e:Error) {
            return false;
          }

          return false;
        });
      // externalize("startDrops", function():void {
      // Modules.enable("Drops");
      // });
      // externalize("getDrops", function():Dictionary {
      // return Drops.getDrops();
      // });
      // externalize("getDropsHumanized", function():Object {
      // return Drops.getDropsHumanized();
      // });

      debug("Externalizer::init done.");
    }

    public function externalize(name:String, func:Function):void {
      ExternalInterface.addCallback(name, func);
    }

    public function call(name:String, ...rest):* {
      return ExternalInterface.call(name, rest);
    }

    public function debug(message:String):void {
      this.call("flashDebug", message);
    }
  }
}
