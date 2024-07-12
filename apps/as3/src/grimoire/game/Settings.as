package grimoire.game
{
	import grimoire.Root;
	import flash.utils.Timer;

	public class Settings
	{
		private static var classRanges:Object = {};
		private static var provokeTimer:Timer = new Timer(500);

		public static function setInfiniteRange(on:Boolean):void
		{
			var currentClass:String = Root.Game.world.myAvatar.objData.strClassName.toUpperCase();
			if (classRanges[currentClass] != null && !on)
			{
				var defaultRange:Array = classRanges[currentClass].split(',');
				for (var i:int = 0; i < Root.Game.world.actions.active.length; i++)
				{
					Root.Game.world.actions.active[i].range = parseInt(defaultRange[i]);
				}
				classRanges[currentClass] = null;
			}
			else if (on)
			{
				var sDefaultRange:String = '';
				for (i = 0; i < Root.Game.world.actions.active.length; i++)
				{
					sDefaultRange += Root.Game.world.actions.active[i].range + ',';
					Root.Game.world.actions.active[i].range = 20000;
				}
				classRanges[currentClass] = sDefaultRange;
			}
		}

		public static function provokeCellMonsters():void
		{
			Root.Game.world.aggroAllMon();
		}

		public static function enemyMagnet():void
		{
			if (Root.Game.world.myAvatar.target != null)
			{
				Root.Game.world.myAvatar.target.pMC.x = Root.Game.world.myAvatar.pMC.x;
				Root.Game.world.myAvatar.target.pMC.y = Root.Game.world.myAvatar.pMC.y;
			}
		}

		public static function setLagKiller(on:Boolean):void
		{
			Root.Game.world.visible = !on;
		}

		public static function setHidePlayers(on:Boolean):void
		{
			Root.Game.litePreference.data.bHidePlayers = on;

			for each (var avatar:* in Root.Game.world.avatars)
			{
				if (avatar != null && avatar.pnm != null && !avatar.isMyAvatar)
				{
					if (on)
					{
						avatar.hideMC();
					}
					else
					{
						avatar.showMC();
					}
				}
			}
		}

		public static function skipCutscenes():void
		{
			while (Root.Game.mcExtSWF.numChildren > 0)
			{
				Root.Game.mcExtSWF.removeChildAt(0);
			}
			Root.Game.world.visible = true;
			Root.Game.showInterface();
		}

		public static function setWalkSpeed(speed:String):void
		{
			Root.Game.world.WALKSPEED = parseInt(speed);
		}
	}
}
