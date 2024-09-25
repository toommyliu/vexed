package skua
{
	import flash.external.ExternalInterface;
	import skua.Main;
	import skua.module.ModuleStore;

	public class Externalizer
	{
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

			this.addCallback("connectToServer", Main.connectToServer);
			this.addCallback("clickServer", Main.clickServer);

			this.addCallback("isLoggedIn", Main.isLoggedIn);
			this.addCallback("isKicked", Main.isKicked);

			this.addCallback("infiniteRange", Main.infiniteRange);
			this.addCallback("canUseSkill", Main.canUseSkill);
			this.addCallback("useSkill", Main.useSkill);

			this.addCallback("rejectExcept", Main.rejectExcept);

			this.addCallback("walkTo", Main.walkTo);
			this.addCallback("jumpCorrectRoom", Main.jumpCorrectRoom);

			this.addCallback("availableMonsters", Main.availableMonstersInCell);
			this.addCallback("attackMonsterName", Main.attackMonsterByName);
			this.addCallback("attackMonsterID", Main.attackMonsterByID);
			this.addCallback("untargetSelf", Main.untargetSelf);
			this.addCallback("attackPlayer", Main.attackPlayer);

			this.addCallback("buyItemByName", Main.buyItemByName);
			this.addCallback("buyItemByID", Main.buyItemByID);

			this.addCallback("sendClientPacket", Main.sendClientPacket);
			this.addCallback("catchPackets", Main.catchPackets);

			this.addCallback("disableDeathAd", Main.disableDeathAd);
			this.addCallback("skipCutscenes", Main.skipCutscenes);
			this.addCallback("magnetize", Main.magnetize);
			this.addCallback("killLag", Main.killLag);

			// Auras
			this.addCallback("auraComparison", Main.auraComparison);
			this.addCallback("getSubjectAuras", Main.getSubjectAuras);
			this.addCallback("getAvatar", Main.getAvatar);

			this.addCallback("userID", Main.userID);
			this.addCallback("gender", Main.gender);

			// Modules
			this.addCallback("modEnable", ModuleStore.enable);
			this.addCallback("modDisable", ModuleStore.disable);

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
