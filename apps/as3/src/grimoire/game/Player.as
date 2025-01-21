package grimoire.game
{
	import flash.filters.*;
	import grimoire.*;

	public class Player extends Object
	{
		public static function IsLoggedIn() : String
		{
			return Root.Game != null && Root.Game.sfc != null && Root.Game.sfc.isConnected == true ? (Root.TrueString) : (Root.FalseString);
		}

		public static function Cell() : String
		{
			return "\"" + Root.Game.world.strFrame + "\"";
		}

		public static function GetFactions() : String
		{
			return JSON.stringify(Root.Game.world.myAvatar.factions);
		}

		public static function Pad() : String
		{
			return "\"" + Root.Game.world.strPad + "\"";
		}

		public static function State() : int
		{
			return Root.Game.world.myAvatar.dataLeaf.intState;
		}

		public static function Health() : int
		{
			return Root.Game.world.myAvatar.dataLeaf.intHP;
		}

		public static function HealthMax() : int
		{
			return Root.Game.world.myAvatar.dataLeaf.intHPMax;
		}

		public static function Mana() : int
		{
			return Root.Game.world.myAvatar.dataLeaf.intMP;
		}

		public static function ManaMax() : int
		{
			return Root.Game.world.myAvatar.dataLeaf.intMPMax;
		}

		public static function Map() : String
		{
			return "\"" + Root.Game.world.strMapName + "\"";
		}

		public static function Level() : int
		{
			return Root.Game.world.myAvatar.dataLeaf.intLevel;
		}

		public static function IsMember() : String
		{
			return Root.Game.world.myAvatar.objData.iUpgDays >= 0 ? (Root.TrueString) : (Root.FalseString);
		}

		public static function Gold() : int
		{
			return Root.Game.world.myAvatar.objData.intGold;
		}

		public static function HasTarget() : String
		{
			return Root.Game.world.myAvatar.target != null && Root.Game.world.myAvatar.target.dataLeaf.intHP > 0 ? (Root.TrueString) : (Root.FalseString);
		}

		public static function IsAfk() : String
		{
			return Root.Game.world.myAvatar.dataLeaf.afk ? (Root.TrueString) : (Root.FalseString);
		}

		public static function AllSkillsAvailable() : int
		{
			return Math.max(Math.max(IsSkillReady(Root.Game.world.actions.active[1]), IsSkillReady(Root.Game.world.actions.active[2])), Math.max(IsSkillReady(Root.Game.world.actions.active[3]), IsSkillReady(Root.Game.world.actions.active[4])));
		}

		public static function SkillAvailable(skillIndex:String) : int
		{
			return IsSkillReady(Root.Game.world.actions.active[parseInt(skillIndex)]);
		}

		private static function IsSkillReady(param1:Object) : int
		{
			var _loc_4:* = NaN;
			var _loc_2:* = new Date().getTime();
			var _loc_3:* = 1 - Math.min(Math.max(Root.Game.world.myAvatar.dataLeaf.sta.$tha, -1), 0.5);
			if (param1.OldCD != null)
			{
				_loc_4 = Math.round(param1.OldCD * _loc_3);
				delete param1.OldCD;
			}
			else
			{
				_loc_4 = Math.round(param1.cd * _loc_3);
			}
			var _loc_5:* = Root.Game.world.GCD - (_loc_2 - Root.Game.world.GCDTS);
			if (_loc_5 < 0)
			{
				_loc_5 = 0;
			}
			var _loc_6:* = _loc_4 - (_loc_2 - param1.ts);
			if (_loc_6 < 0)
			{
				_loc_6 = 0;
			}
			return Math.max(_loc_5, _loc_6);
		}

		public static function Position() : String
		{
			return JSON.stringify([Root.Game.world.myAvatar.pMC.x, Root.Game.world.myAvatar.pMC.y]);
		}

		public static function WalkToPoint(strX:String, strY:String):void
		{
			var x:int = parseInt(strX);
			var y:int = parseInt(strY);

			Root.Game.world.myAvatar.pMC.walkTo(x, y, Root.Game.world.WALKSPEED);
			Root.Game.world.moveRequest({mc:Root.Game.world.myAvatar.pMC, tx:x, ty:y, sp:Root.Game.world.WALKSPEED});
		}

		public static function CancelAutoAttack() : void
		{
			Root.Game.world.cancelAutoAttack();
		}

		public static function CancelTarget() : void
		{
			Root.Game.world.cancelTarget();
			Root.Game.world.cancelTarget();
		}

		public static function CancelTargetSelf() : void
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

		public static function SetTargetPlayer(username:String) : void
		{
			var avatar:* = Root.Game.world.getAvatarByUserName(username);
			Root.Game.world.setTarget(avatar);
		}

		public static function GetAvatars() : String
		{
			return JSON.stringify(Root.Game.world.avatars);
		}

		public static function SetTargetPvP(username:String) : void
		{
			var avatars:* = Root.Game.world.avatars;
			for (var a:* in avatars)
			{
				var avatar:Object = avatars[a];
				if (avatar.dataLeaf.strFrame == Root.Game.world.strFrame &&
					avatar.dataLeaf.pvpTeam != Root.Game.world.myAvatar.dataLeaf.pvpTeam &&
					!avatar.isMyAvatar &&
					avatar.dataLeaf.intState > 0
				){
					if (!Root.Game.world.myAvatar.target)
					{
						Root.Game.world.setTarget(avatar);
					}

					if (username != null) {
						if (avatar.dataLeaf.strUsername.toLowerCase() == username.toLowerCase() &&
							Root.Game.world.myAvatar.target.dataLeaf.strUsername.toLowerCase() != username.toLowerCase())
						{
							Root.Game.world.setTarget(avatar);
						}
					}
				}
			}
		}

		public static function GetSkillCooldown(skill:String) : int
		{
			return Root.Game.world.actions.active[parseInt(skill)].cd;
		}

		public static function MuteToggle(param1:Boolean) : void
		{
			if (param1)
			{
				Root.Game.chatF.unmuteMe();
			}
			else
			{
				Root.Game.chatF.muteMe(300000);
			}
		}

		public static function AttackMonster(monsterName:String) : void
		{
			var monster:* = World.GetMonsterByName(monsterName);
			if (monster != null)
			{
				try
				{
					Root.Game.world.setTarget(monster);
					Root.Game.world.approachTarget();
				}
				catch (e:Error)
				{
					return;
				}
			}
		}

		public static function AttackMonsterByMonMapId(monMapID:String) : void
		{
			var monster:* = World.GetMonsterByMonMapId(monMapID);
			if (monster != null)
			{
				try
				{
					Root.Game.world.setTarget(monster);
					Root.Game.world.approachTarget();
				}
				catch (e:Error)
				{
					return;
				}
			}
		}

		public static function Jump(param1:String, param2:String = "Spawn") : void
		{
			Root.Game.world.moveToCell(param1, param2);
		}

		public static function Rest() : void
		{
			Root.Game.world.rest();
		}

		public static function Join(param1:String, param2:String = "Enter", param3:String = "Spawn") : void
		{
			Root.Game.world.gotoTown(param1, param2, param3);
		}

		public static function Equip(param1:String) : void
		{
			Root.Game.world.sendEquipItemRequest({ItemID:parseInt(param1)});
		}

		public static function EquipPotion(param1:String, param2:String, param3:String, param4:String) : void
		{
			Root.Game.world.equipUseableItem({ItemID:parseInt(param1), sDesc:param2, sFile:param3, sName:param4});
		}

		public static function GoTo(username:String) : void
		{
			Root.Game.world.goto(username);
		}

		public static function UseBoost(id:String):void
		{
			var boost:Object = Inventory.GetItemByID(parseInt(id));
			if (boost != null)
				Root.Game.world.sendUseItemRequest(boost);
		}


		public static function ForceUseSkill(index:String) : void
		{
			var skill:Object = Root.Game.world.actions.active[parseInt(index)];
			if (IsSkillReady(skill) == 0)
			{
				//if (Root.Game.world.myAvatar.dataLeaf.intMP >= skill.mp)
				if (true)
				{
					if (skill.isOK && !skill.skillLock)
					{
						Root.Game.world.testAction(skill);
					}
				}
			}
		}

		public static function UseSkill(index:String) : void
		{
			var skill:Object = Root.Game.world.actions.active[parseInt(index)];

			if (skill.tgt == "s" || skill.tgt == "f")
			{
				ForceUseSkill(index);
				return;
			}

			if (Root.Game.world.myAvatar.target == Root.Game.world.myAvatar)
			{
				Root.Game.world.myAvatar.target = null;
				return;
			}

			if (Root.Game.world.myAvatar.target != null && Root.Game.world.myAvatar.target.dataLeaf.intHP > 0)
			{
				Root.Game.world.approachTarget();
				ForceUseSkill(index);
			}
		}

		public static function GetMapItem(itemId:String) : void
		{
			Root.Game.world.getMapItem(parseInt(itemId));
		}

		public static function Logout() : void
		{
			Root.Game.logout();
		}

		public static function HasActiveBoost(boost:String) : String
		{
			boost = boost.toLowerCase();
			if (boost.indexOf("gold") > -1)
			{
				return Root.Game.world.myAvatar.objData.iBoostG > 0 ? (Root.TrueString) : (Root.FalseString);
			}
			if (boost.indexOf("xp") > -1)
			{
				return Root.Game.world.myAvatar.objData.iBoostXP > 0 ? (Root.TrueString) : (Root.FalseString);
			}
			if (boost.indexOf("rep") > -1)
			{
				return Root.Game.world.myAvatar.objData.iBoostRep > 0 ? (Root.TrueString) : (Root.FalseString);
			}
			if (boost.indexOf("class") > -1)
			{
				return Root.Game.world.myAvatar.objData.iBoostCP > 0 ? (Root.TrueString) : (Root.FalseString);
			}
			return Root.FalseString;
		}

		public static function PlayerClass() : String
		{
			return "\"" + Root.Game.world.myAvatar.objData.strClassName.toUpperCase() + "\"";
		}

		public static function UserID() : int
		{
			return Root.Game.world.myAvatar.uid;
		}

		public static function CharID() : int
		{
			return Root.Game.world.myAvatar.objData.CharID;
		}

		public static function Gender() : String
		{
			return "\"" + Root.Game.world.myAvatar.objData.strGender.toUpperCase() + "\"";
		}

		public static function PlayerData() : Object
		{
			return Root.Game.world.myAvatar.objData;
		}

		public static function SetEquip(param1:String, param2:Object) : void
		{
			if (Root.Game.world.myAvatar.pMC.pAV.objData.eqp.Weapon == null)
			{
				return;
			}
			var _loc_3:* = param1;
			var _loc_4:* = param2;
			if (param1 == "Off")
			{
				Root.Game.world.myAvatar.pMC.pAV.objData.eqp.Weapon.sLink = _loc_4.sLink;
				Root.Game.world.myAvatar.pMC.loadWeaponOff(_loc_4.sFile, _loc_4.sLink);
				Root.Game.world.myAvatar.pMC.pAV.getItemByEquipSlot("Weapon").sType = "Dagger";
			}
			else
			{
				Root.Game.world.myAvatar.objData.eqp[_loc_3] = _loc_4;
				Root.Game.world.myAvatar.loadMovieAtES(_loc_3, _loc_4.sFile, _loc_4.sLink);
			}
			return;
		}

		public static function GetEquip(itemId:int) : String
		{
			return JSON.stringify(Root.Game.world.avatars[itemId].objData.eqp);
		}

		public static function ChangeName(name:String) : void
		{
			Root.Game.world.myAvatar.pMC.pname.ti.text = name.toUpperCase();
			Root.Game.ui.mcPortrait.strName.text = name.toUpperCase();
			Root.Game.world.myAvatar.objData.strUsername = name.toUpperCase();
			Root.Game.world.myAvatar.pMC.pAV.objData.strUsername = name.toUpperCase();
		}

		public static function ChangeGuild(guild:String) : void
		{
			if (Root.Game.world.myAvatar.objData.guild != null)
			{
				Root.Game.world.myAvatar.pMC.pname.tg.text = guild.toUpperCase();
				Root.Game.world.myAvatar.objData.guild.Name = guild.toUpperCase();
				Root.Game.world.myAvatar.pMC.pAV.objData.guild.Name = guild.toUpperCase();
			}
		}

		public static function SetWalkSpeed(param1:String) : void
		{
			Root.Game.world.WALKSPEED = parseInt(param1);
		}

		public static function ChangeAccessLevel(accessLevel:String) : void
		{
			if (accessLevel == "Non Member")
			{
				Root.Game.world.myAvatar.pMC.pname.ti.textColor = 16777215;
				Root.Game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
				Root.Game.world.myAvatar.objData.iUpgDays = -1;
				Root.Game.world.myAvatar.objData.iUpg = 0;
				//Root.Game.chatF.pushMsg("server", "Access : Non Member", "SERVER", "", 0);
			}
			else if (accessLevel == "Member")
			{
				Root.Game.world.myAvatar.pMC.pname.ti.textColor = 9229823;
				Root.Game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
				Root.Game.world.myAvatar.objData.iUpgDays = 30;
				Root.Game.world.myAvatar.objData.iUpg = 1;
				//Root.Game.chatF.pushMsg("server", "Access : Member", "SERVER", "", 0);
			}
			else if (accessLevel == "Moderator" || accessLevel == "60")
			{
				//Yellow
				Root.Game.world.myAvatar.pMC.pname.ti.textColor = 16698168;
				Root.Game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
				Root.Game.world.myAvatar.objData.intAccessLevel = 60;
				//Root.Game.chatF.pushMsg("server", "Access : Moderator", "SERVER", "", 0);
			}
			else if (accessLevel == "30")
			{
				//Dark Green
				Root.Game.world.myAvatar.pMC.pname.ti.textColor = 52881;
				Root.Game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
				Root.Game.world.myAvatar.objData.intAccessLevel = 30;
			}
			else if (accessLevel == "40")
			{
				//Light Green
				Root.Game.world.myAvatar.pMC.pname.ti.textColor = 5308200;
				Root.Game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
				Root.Game.world.myAvatar.objData.intAccessLevel = 40;
			}
			else if (accessLevel == "50")
			{
				//Purple
				Root.Game.world.myAvatar.pMC.pname.ti.textColor = 12283391;
				Root.Game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
				Root.Game.world.myAvatar.objData.intAccessLevel = 50;
			}
		}

		public static function ChangeColorName(color: int):void{
            Root.Game.world.myAvatar.pMC.pname.ti.textColor = color;
		}

		public static function GetTargetHealth() : int
		{
			return Root.Game.world.myAvatar.target.dataLeaf.intHP;
		}

        public static function GetAurasValue(self:String, auraName:String) : int
        {
			var value:int = 0;
			var isSelf:Boolean = self == "True";
			var hasTarget:Boolean = Root.Game.world.myAvatar.target != null && Root.Game.world.myAvatar.target.dataLeaf.intHP > 0;
            if (!isSelf && !hasTarget)
			{
				return value;
			}
			var objAura:Object = isSelf ? Root.Game.world.myAvatar.dataLeaf.auras : Root.Game.world.myAvatar.target.dataLeaf.auras;
            for each (var aura:Object in objAura) {
                if (aura.nam.toLowerCase() == auraName.toLowerCase())
                {
                    value = aura.val ? aura.val : 1;
                }
            }
			return value;
        }

		public static function GetAccessLevel(username: String) : int {
            var avatars:* = Root.Game.world.avatars;
            var accessLevel:int;
            for (var a:* in avatars)
            {
                var avatar:Object = avatars[a];
                if (username != null) {
                    if (avatar.dataLeaf.strUsername.toLowerCase() == username.toLowerCase()) {
                        var uid:* = avatar.uid;
                        accessLevel = Root.Game.world.getAvatarByUserID(uid).objData.intAccessLevel;
                    }
                }
            }
            return accessLevel;
        }
		public static function IsPlayerLoaded():String
		{
			return (
					Root.Game.world.myAvatar.items.length > 0 &&
					World.MapLoadComplete() === Root.TrueString &&
					Root.Game.world.myAvatar.pMC.artLoaded()) ? Root.TrueString : Root.FalseString;
		}
	}
}
