package vexed
{
	import flash.external.ExternalInterface;
	import vexed.module.Modules;
	import vexed.game.*;

	public class Externalizer
	{

		public function Externalizer()
		{
			super();
		}

		public function init(root:Main):void
		{
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

			// Auth
			this.addCallback("authIsLoggedIn", Auth.isLoggedIn);
			this.addCallback("authIsTemporarilyKicked", Auth.isTemporarilyKicked);
			this.addCallback("authLogin", Auth.login);
			this.addCallback("authLogout", Auth.logout);
			this.addCallback("authGetServers", Auth.getServers);
			this.addCallback("authConnectTo", Auth.connectTo);

			// Bank
			this.addCallback("bankGetItems", Bank.getItems);
			this.addCallback("bankGetItem", Bank.getItem);
			this.addCallback("bankContains", Bank.contains);
			this.addCallback("bankGetSlots", Bank.getSlots);
			this.addCallback("bankGetUsedSlots", Bank.getUsedSlots);
			this.addCallback("bankDeposit", Bank.deposit);
			this.addCallback("bankWithdraw", Bank.withdraw);
			this.addCallback("bankSwap", Bank.swap);
			this.addCallback("bankOpen", Bank.open);
			this.addCallback("bankIsOpen", Bank.isOpen);

			// Combat
			this.addCallback("combatHasTarget", Combat.hasTarget);
			this.addCallback("combatGetTarget", Combat.getTarget);
			this.addCallback("combatUseSkill", Combat.useSkill);
			this.addCallback("combatForceUseSkill", Combat.forceUseSkill);
			this.addCallback("combatCanUseSkill", Combat.canUseSkill);
			this.addCallback("combatGetSkillCooldownRemaining", Combat.getSkillCooldownRemaining);
			this.addCallback("combatCancelAutoAttack", Combat.cancelAutoAttack);
			this.addCallback("combatCancelTarget", Combat.cancelTarget);
			this.addCallback("combatAttackMonster", Combat.attackMonster);
			this.addCallback("combatAttackMonsterById", Combat.attackMonsterById);

			// DropStack
			this.addCallback("dropStackAcceptDrop", DropStack.acceptDrop);
			this.addCallback("dropStackRejectDrop", DropStack.rejectDrop);
			this.addCallback("dropStackIsUsingCustomDrops", DropStack.isUsingCustomDrops);
			this.addCallback("dropStackSetCustomDropsUi", DropStack.setCustomDropsUi);
			this.addCallback("dropStackIsCustomDropsUiOpen", DropStack.isCustomDropsUiOpen);

			// House
			this.addCallback("houseGetItems", House.getItems);
			this.addCallback("houseGetItem", House.getItem);
			this.addCallback("houseGetSlots", House.getSlots);
			this.addCallback("houseGetUsedSlots", House.getUsedSlots);

			// Inventory
			this.addCallback("inventoryGetItems", Inventory.getItems);
			this.addCallback("inventoryGetItem", Inventory.getItem);
			this.addCallback("inventoryContains", Inventory.contains);
			this.addCallback("inventoryGetSlots", Inventory.getSlots);
			this.addCallback("inventoryGetUsedSlots", Inventory.getUsedSlots);
			this.addCallback("inventoryEquip", Inventory.equip);
			this.addCallback("inventoryEquipConsumable", Inventory.equipConsumable);

			// Player
			this.addCallback("playerJoinMap", Player.joinMap);
			this.addCallback("playerGetMap", Player.getMap);
			this.addCallback("playerJump", Player.jump);
			this.addCallback("playerGetCell", Player.getCell);
			this.addCallback("playerGetPad", Player.getPad);
			this.addCallback("playerGetFactions", Player.getFactions);
			this.addCallback("playerGetState", Player.getState);
			this.addCallback("playerGetHp", Player.getHp);
			this.addCallback("playerGetMaxHp", Player.getMaxHp);
			this.addCallback("playerGetMp", Player.getMp);
			this.addCallback("playerGetMaxMp", Player.getMaxMp);
			this.addCallback("playerGetLevel", Player.getLevel);
			this.addCallback("playerGetGold", Player.getGold);
			this.addCallback("playerIsMember", Player.isMember);
			this.addCallback("playerIsAfk", Player.isAfk);
			this.addCallback("playerGetPosition", Player.getPosition);
			this.addCallback("playerWalkTo", Player.walkTo);
			this.addCallback("playerRest", Player.rest);
			this.addCallback("playerUseBoost", Player.useBoost);
			this.addCallback("playerHasActiveBoost", Player.hasActiveBoost);
			this.addCallback("playerGetClassName", Player.getClassName);
			this.addCallback("playerGetUserId", Player.getUserId);
			this.addCallback("playerGetCharId", Player.getCharId);
			this.addCallback("playerGetGender", Player.getGender);
			this.addCallback("playerGetData", Player.getData);
			this.addCallback("playerIsLoaded", Player.isLoaded);
			this.addCallback("playerGoTo", Player.goToPlayer);
			

			// Quests
			this.addCallback("questsIsInProgress", Quests.isInProgress);
			this.addCallback("questsComplete", Quests.complete);
			this.addCallback("questsAccept", Quests.accept);
			this.addCallback("questsLoad", Quests.load);
			this.addCallback("questsGet", Quests.get );
			this.addCallback("questsGetTree", Quests.getTree);

			// Settings
			this.addCallback("settingsInfiniteRange", Settings.infiniteRange);
			this.addCallback("settingsProvokeMap", Settings.provokeMap);
			this.addCallback("settingsProvokeCell", Settings.provokeCell);
			this.addCallback("settingsEnemyMagnet", Settings.enemyMagnet);
			this.addCallback("settingsLagKiller", Settings.lagKiller);
			this.addCallback("settingsSkipCutscenes", Settings.skipCutscenes);
			this.addCallback("settingsSetName", Settings.setName);
			this.addCallback("settingsSetGuild", Settings.setGuild);
			this.addCallback("settingsSetAccessLevel", Settings.setAccessLevel);
			this.addCallback("settingsSetDisableCollisions", function(on:Boolean):void
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
			this.addCallback("settingsSetDisableFX", function(on:Boolean):void
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
			this.addCallback("settingsHidePlayers", function(on:Boolean):void
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

			// Shops
			this.addCallback("shopGetInfo", Shops.getInfo);
			this.addCallback("shopGetItems", Shops.getItems);
			this.addCallback("shopGetItem", Shops.getItem);
			this.addCallback("shopBuyByName", Shops.buyByName);
			this.addCallback("shopBuyById", Shops.buyById);
			this.addCallback("shopSellByName", Shops.sellByName);
			this.addCallback("shopSellById", Shops.sellById);
			this.addCallback("shopLoad", Shops.load);
			this.addCallback("shopLoadHairShop", Shops.loadHairShop);
			this.addCallback("shopLoadArmorCustomize", Shops.loadArmorCustomize);

			// World
			this.addCallback("worldIsLoaded", World.isLoaded);
			this.addCallback("worldGetPlayerNames", World.getPlayerNames);
			this.addCallback("worldGetPlayers", World.getPlayers);
			this.addCallback("worldGetPlayer", World.getPlayer);
			this.addCallback("worldIsPlayerInCell", World.isPlayerInCell);
			this.addCallback("worldIsActionAvailable", World.isActionAvailable);
			this.addCallback("worldGetCellMonsters", World.getCellMonsters);
			this.addCallback("worldGetMonsterByName", World.getMonsterByName);
			this.addCallback("worldGetMonsterByMonMapId", World.getMonsterByMonMapId);
			this.addCallback("worldIsMonsterAvailable", World.isMonsterAvailable);
			this.addCallback("worldGetCells", World.getCells);
			this.addCallback("worldGetCellPads", World.getCellPads);
			this.addCallback("worldGetItemTree", World.getItemTree);
			this.addCallback("worldGetRoomId", World.getRoomId);
			this.addCallback("worldGetRoomNumber", World.getRoomNumber);
			this.addCallback("worldReload", World.reload);
			this.addCallback("worldLoadSwf", World.loadSwf);
			this.addCallback("worldGetMapItem", World.getMapItem);

			this.debug("Externalizer::init done.");
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
