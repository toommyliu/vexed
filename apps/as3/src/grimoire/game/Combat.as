package grimoire.game
{
	import grimoire.Root;

	public class Combat
	{
		public static function HasTarget():String
		{
			return Root.Game.world.myAvatar.target != null && Root.Game.world.myAvatar.target.dataLeaf.intHP > 0 ? (Root.TrueString) : (Root.FalseString);
		}
		public static function CancelAutoAttack():void
		{
			Root.Game.world.cancelAutoAttack();
		}

		public static function CancelTarget():void
		{
			Root.Game.world.cancelTarget();
			Root.Game.world.cancelTarget();
		}

		public static function CancelTargetSelf():void
		{
			var targetAvatar:* = Root.Game.world.myAvatar.target;
			if (targetAvatar)
			{

			}
			if (targetAvatar == Root.Game.world.myAvatar)
			{
				Root.Game.world.cancelTarget();
			}
		}

		public static function SetTargetPlayer(username:String):void
		{
			var avatar:* = Root.Game.world.getAvatarByUserName(username);
			Root.Game.world.setTarget(avatar);
		}

		public static function GetAvatars():String
		{
			return JSON.stringify(Root.Game.world.avatars);
		}

		public static function SetTargetPvP(username:String):void
		{
			var avatars:* = Root.Game.world.avatars;
			for (var a in avatars)
			{
				var avatar = avatars[a];
				if (avatar.dataLeaf.strFrame == Root.Game.world.strFrame &&
						avatar.dataLeaf.pvpTeam != Root.Game.world.myAvatar.dataLeaf.pvpTeam &&
						!avatar.isMyAvatar &&
						avatar.dataLeaf.intState > 0
					)
				{
					if (!Root.Game.world.myAvatar.target)
					{
						Root.Game.world.setTarget(avatar);
					}

					if (username != null)
					{
						if (avatar.dataLeaf.strUsername.toLowerCase() == username.toLowerCase() &&
								Root.Game.world.myAvatar.target.dataLeaf.strUsername.toLowerCase() != username.toLowerCase())
						{
							Root.Game.world.setTarget(avatar);
						}
					}
				}
			}
		}

		public static function AttackMonster(monsterName:String):void
		{
			var monster:* = World.GetMonsterByName(monsterName);
			if (monster != null)
			{
				try
				{
					Root.Game.world.setTarget(monster);
					Root.Game.world.approachTarget();
				}
				catch (e)
				{
					return;
				}
			}
		}

		public static function AttackMonsterByMonMapId(monMapID:String):void
		{
			var monster:* = World.GetMonsterByMonMapId(monMapID);
			if (monster != null)
			{
				try
				{
					Root.Game.world.setTarget(monster);
					Root.Game.world.approachTarget();
				}
				catch (e)
				{
					return;
				}
			}
		}

		public static function GetTargetHealth():int
		{
			return Root.Game.world.myAvatar.target.dataLeaf.intHP;
		}
	}
}
