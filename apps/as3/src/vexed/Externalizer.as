package vexed
{
	import flash.external.ExternalInterface;
	import vexed.Main;
	import vexed.api.*;
	import vexed.module.ModuleStore;

	public class Externalizer
	{
		public function Externalizer():void
		{
			this.addCallback("compareAuras", Aura.compareAuras);
			this.addCallback("getSubjectAuras", Aura.getSubjectAuras);

			this.addCallback("isTemporarilyKicked", Auth.isTemporarilyKicked);
			this.addCallback("login", Auth.login);
			this.addCallback("logout", Auth.logout);
			this.addCallback("resetServers", Auth.resetServers);
			this.addCallback("connectTo", Auth.connectTo);

			this.addCallback("getBankItems", Bank.items);
			this.addCallback("getBankItem", Bank.getItem);
			this.addCallback("getBankItemByID", Bank.getItemByID);
			this.addCallback("getBankSlots", Bank.slots);
			this.addCallback("getBankUsedSlots", Bank.usedSlots);
			this.addCallback("bankDeposit", Bank.deposit);
			this.addCallback("bankWithdraw", Bank.withdraw);
			this.addCallback("bankSwap", Bank.swap);
			this.addCallback("openBank", Bank.open);
			this.addCallback("loadBank", Bank.load);

			this.addCallback("canUseSkill", Combat.canUseSkill);
			this.addCallback("useSkill", Combat.useSkill);
			this.addCallback("getSkillCooldown", Combat.getSkillCooldown);
			this.addCallback("untargetSelf", Combat.untargetSelf);
			this.addCallback("attackMonsterByMonMapID", Combat.attackMonsterByMonMapID);
			this.addCallback("attackMonsterByName", Combat.attackMonsterByName);
			this.addCallback("attackPlayer", Combat.attackPlayer);
			this.addCallback("cancelAutoAttack", Combat.cancelAutoAttack);
			this.addCallback("cancelTarget", Combat.cancelTarget);
			this.addCallback("cancelTargetSelf", Combat.cancelTargetSelf);

			this.addCallback("isUsingCustomDropsUI", Drops.isUsingCustomDropsUI);
			this.addCallback("isCustomDropsOpen", Drops.isCustomDropsOpen);
			this.addCallback("openCustomDropsUI", Drops.openCustomDropsUI);
			this.addCallback("getDropStack", Drops.getDropStack);
			this.addCallback("pickupDrops", Drops.pickupDrops);
			this.addCallback("rejectExcept", Drops.rejectExcept);

			this.addCallback("getInventoryItems", Inventory.items);
			this.addCallback("getInventoryItem", Inventory.getItem);
			this.addCallback("getInventoryItemByID", Inventory.getItemByID);
			this.addCallback("getInventorySlots", Inventory.slots);
			this.addCallback("getInventoryUsedSlots", Inventory.usedSlots);

			this.addCallback("cell", Player.cell);
			this.addCallback("pad", Player.pad);
			this.addCallback("factions", Player.factions);
			this.addCallback("state", Player.state);
			this.addCallback("health", Player.health);
			this.addCallback("healthMax", Player.healthMax);
			this.addCallback("mana", Player.mana);
			this.addCallback("manaMax", Player.manaMax);
			this.addCallback("level", Player.level);
			this.addCallback("isMember", Player.isMember);
			this.addCallback("gold", Player.gold);
			this.addCallback("position", Player.position);
			this.addCallback("join", Player.join);
			this.addCallback("jump", Player.jump);
			this.addCallback("rest", Player.rest);
			this.addCallback("hasActiveBoost", Player.hasActiveBoost);
			this.addCallback("playerClass", Player.playerClass);
			this.addCallback("userID", Player.userID);
			this.addCallback("charID", Player.charID);
			this.addCallback("gender", Player.gender);
			this.addCallback("playerData", Player.playerData);

			this.addCallback("isInProgress", Quests.isInProgress);
			this.addCallback("complete", Quests.complete);
			this.addCallback("accept", Quests.accept);
			this.addCallback("load", Quests.load);
			this.addCallback("loadMultiple", Quests.loadMultiple);
			this.addCallback("getQuests", Quests.getQuests);
			this.addCallback("isAvailable", Quests.isAvailable);
			this.addCallback("canComplete", Quests.canComplete);
			this.addCallback("hasRequiredItemsForQuest", Quests.hasRequiredItemsForQuest);
			this.addCallback("getQuestValidationString", Quests.getQuestValidationString);

			this.addCallback("magnetize", Settings.magnetize);
			this.addCallback("infiniteRange", Settings.infiniteRange);
			this.addCallback("skipCutscenes", Settings.skipCutscenes);
			this.addCallback("setLagKiller", Settings.setLagKiller);
			this.addCallback("setDeathAds", Settings.setDeathAds);
			this.addCallback("setName", Settings.setName);
			this.addCallback("setGuild", Settings.setGuild);
			this.addCallback("setWalkSpeed", Settings.setWalkSpeed);
			this.addCallback("setAccessLevel", Settings.setAccessLevel);

			this.addCallback("resetShopInfo",Shops.resetShopInfo);
			this.addCallback("isShopLoaded",Shops.isShopLoaded);
			this.addCallback("buyItem",Shops.buyItem);
			this.addCallback("buyItemQty",Shops.buyItemQty);
			this.addCallback("buyItemQtyByID",Shops.buyItemQtyByID);
			this.addCallback("getShopItem",Shops.getShopItem);
			this.addCallback("getShopItemByID",Shops.getShopItemByID);

			this.addCallback("getTempItems",TempInventory.getTempItems);
			this.addCallback("getTempItem",TempInventory.getTempItem);
			this.addCallback("isItemInTemp",TempInventory.isItemInTemp);

			this.addCallback("isMapLoadComplete", World.isMapLoadComplete);
			this.addCallback("getPlayers", World.getPlayers);
			this.addCallback("getPlayerByName", World.getPlayerByName);
			this.addCallback("getPlayerNames", World.getPlayerNames);
			this.addCallback("isPlayerInCell", World.isPlayerInCell);
			this.addCallback("isActionAvailable", World.isActionAvailable);
			this.addCallback("getMonsterInCell", World.getMonsterInCell);
			this.addCallback("availableMonstersInCell", World.availableMonstersInCell);
			this.addCallback("walkTo", World.walkTo);
			this.addCallback("getCells", World.getCells);
			this.addCallback("getCellPads", World.getCellPads);
			this.addCallback("getRoomID", World.getRoomID);
			this.addCallback("getMapName", World.getMapName);
			this.addCallback("getRoomNumber", World.getRoomNumber);
			this.addCallback("reloadMap", World.reloadMap);
			this.addCallback("loadMapSWF", World.loadMapSWF);

			this.addCallback("enableMod", ModuleStore.enable);
			this.addCallback("disableMod", ModuleStore.disable);

			this.addCallback("getGameObject", Main.getGameObject);
			this.addCallback("getGameObjectS", Main.getGameObjectS);
			this.addCallback("getGameObjectKey", Main.getGameObjectKey);
			this.addCallback("setGameObject", Main.setGameObject);
			this.addCallback("setGameObjectKey", Main.setGameObjectKey);
			this.addCallback("getArrayObject", Main.getArrayObject);
			this.addCallback("setArrayObject", Main.setArrayObject);
			this.addCallback("callGameFunction", Main.callGameFunction);
			this.addCallback("callGameFunction0", Main.callGameFunction0);
			this.addCallback("selectArrayObjects", Main.selectArrayObjects);
			this.addCallback("isNull", Main.isNull);

			this.debug("Externalizer#init done.");
		}

		public function addCallback(name:String, func:Function):void
		{
			ExternalInterface.addCallback(name, func);
		}

		public function call(name:String, ...rest):*
		{
			return ExternalInterface.call(name, rest);
		}

		public function debug(message:String):void
		{
			this.call("debug", message);
		}
	}
}
