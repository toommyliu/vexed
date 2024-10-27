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

			this.addCallback("connectTo", Auth.connectTo);

			this.addCallback("canUseSkill", Combat.canUseSkill);
			this.addCallback("useSkill", Combat.useSkill);
			this.addCallback("untargetSelf", Combat.untargetSelf);
			this.addCallback("attackMonsterByMonMapID", Combat.attackMonsterByMonMapID);
			this.addCallback("attackMonsterByName", Combat.attackMonsterByName);
			this.addCallback("attackPlayer", Combat.attackPlayer);

			this.addCallback("isUsingCustomDropsUI", Drops.isUsingCustomDropsUI);
			this.addCallback("isCustomDropsOpen", Drops.isCustomDropsOpen);
			this.addCallback("openCustomDropsUI", Drops.openCustomDropsUI);
			this.addCallback("getDropStack", Drops.getDropStack);
			this.addCallback("pickupDrops", Drops.pickupDrops);
			this.addCallback("rejectExcept", Drops.rejectExcept);

			this.addCallback("magnetize", Settings.magnetize);
			this.addCallback("infiniteRange", Settings.infiniteRange);
			this.addCallback("skipCutscenes", Settings.skipCutscenes);
			this.addCallback("setLagKiller", Settings.setLagKiller);
			this.addCallback("setDeathAds", Settings.setDeathAds);

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
