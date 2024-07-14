package grimoire.game
{
	import grimoire.Root;
	import flash.utils.Timer;
	import flash.filters.GlowFilter;

	public class Settings
	{
		private static var classRanges:Object = {};
		private static var provokeTimer:Timer = new Timer(500);

		public static function SetInfiniteRange(on:Boolean):void
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

		public static function setName(name:String):void
		{
			Root.Game.world.myAvatar.pMC.pname.ti.text = name.toUpperCase();
			Root.Game.ui.mcPortrait.strName.text = name.toUpperCase();
			Root.Game.world.myAvatar.objData.strUsername = name.toUpperCase();
			Root.Game.world.myAvatar.pMC.pAV.objData.strUsername = name.toUpperCase();
		}

		public static function setGuild(guild:String):void
		{
			if (Root.Game.world.myAvatar.objData.guild != null)
			{
				Root.Game.world.myAvatar.pMC.pname.tg.text = guild.toUpperCase();
				Root.Game.world.myAvatar.objData.guild.Name = guild.toUpperCase();
				Root.Game.world.myAvatar.pMC.pAV.objData.guild.Name = guild.toUpperCase();
			}
		}

		public static function setAccessLevel(accessLevel:String):void
		{
			if (accessLevel == "Non Member")
			{
				Root.Game.world.myAvatar.pMC.pname.ti.textColor = 16777215;
				Root.Game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
				Root.Game.world.myAvatar.objData.iUpgDays = -1;
				Root.Game.world.myAvatar.objData.iUpg = 0;
			}
			else if (accessLevel == "Member")
			{
				Root.Game.world.myAvatar.pMC.pname.ti.textColor = 9229823;
				Root.Game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
				Root.Game.world.myAvatar.objData.iUpgDays = 30;
				Root.Game.world.myAvatar.objData.iUpg = 1;
			}
			else if (accessLevel == "Moderator" || accessLevel == "60")
			{
				// Yellow
				Root.Game.world.myAvatar.pMC.pname.ti.textColor = 16698168;
				Root.Game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
				Root.Game.world.myAvatar.objData.intAccessLevel = 60;
			}
			else if (accessLevel == "30")
			{
				// Dark Green
				Root.Game.world.myAvatar.pMC.pname.ti.textColor = 52881;
				Root.Game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
				Root.Game.world.myAvatar.objData.intAccessLevel = 30;
			}
			else if (accessLevel == "40")
			{
				// Light Green
				Root.Game.world.myAvatar.pMC.pname.ti.textColor = 5308200;
				Root.Game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
				Root.Game.world.myAvatar.objData.intAccessLevel = 40;
			}
			else if (accessLevel == "50")
			{
				// Purple
				Root.Game.world.myAvatar.pMC.pname.ti.textColor = 12283391;
				Root.Game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
				Root.Game.world.myAvatar.objData.intAccessLevel = 50;
			}
		}
	}
}
