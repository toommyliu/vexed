package grimoire
{
	import flash.external.ExternalInterface;
	import grimoire.game.*;

	public class Externalizer
	{
		public function init(root:Root):void
		{
			// connection
			this.addCallback('isKicked', Connection.isKicked);
			this.addCallback('isLoggedIn', Connection.isLoggedIn);
			this.addCallback('login', Connection.login);
			this.addCallback('connectTo', Connection.Connect);

			this.addCallback("getGameObject", Caller.getGameObject);
			this.addCallback("getGameObjectS", Caller.getGameObjectS);
			this.addCallback("setGameObject", Caller.setGameObject);
			this.addCallback("getArrayObject", Caller.getArrayObject);
			this.addCallback("setArrayObject", Caller.setArrayObject);
			this.addCallback("callGameFunction", Caller.callGameFunction);
			this.addCallback("callGameFunction0", Caller.callGameFunction0);
			this.addCallback("selectArrayObjects", Caller.selectArrayObjects);
			this.addCallback("isNull", Caller.isNull);
			this.addCallback("sendClientPacket", Caller.sendClientPacket);

			// settings
			this.addCallback('setInfiniteRange', Settings.setInfiniteRange);
			this.addCallback('provokeCellMonsters', Settings.provokeCellMonsters);
			this.addCallback('enemyMagnet', Settings.enemyMagnet);
			this.addCallback('setLagKiller', Settings.setLagKiller);
			this.addCallback('setHidePlayers', Settings.setHidePlayers);
			this.addCallback('skipCutscenes', Settings.skipCutscenes);
			this.addCallback('setWalkSpeed', Settings.setWalkSpeed);

			// temp inventory
			this.addCallback('getTempItems', TempInventory.getTempItems);
			this.addCallback('getTempItem', TempInventory.getTempItem);
			this.addCallback('isItemInTemp', TempInventory.isItemInTemp);

			// world
			this.addCallback('isMapLoaded', World.isMapLoaded);
			this.addCallback('getPlayerNames', World.getPlayerNames);
			this.addCallback('isActionAvailable', World.isActionAvailable);
			this.addCallback('getCellMonsters', World.getCellMonsters);
			this.addCallback('getVisibleCellMonsters', World.getVisibleCellMonsters);
			this.addCallback('getMonsters', World.getMonsters); // TODO: fix
			this.addCallback('getMonster',World.getMonster);
			this.addCallback('getMonsterHealth', World.getMonsterHealth);


			this.debug('Externalizer#init done.');
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
			this.call('debug', message);
		}

		public static function debugS(message:String):void
		{
			ExternalInterface.call('debug', message);
		}
	}
}
