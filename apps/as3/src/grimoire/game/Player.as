package grimoire.game
{
	import flash.filters.*;
	import grimoire.*;

	public class Player extends Object
	{
		public static function Cell() : String
		{
			return "\"" + Root.Game.world.strFrame + "\"";
		}

		public static function CheckPlayerInMyCell(param1:String) : String
		{
			var uoTree:* = Root.Game.world.uoTree;
			var strFrame:* = Root.Game.world.strFrame;
			return JSON.stringify(uoTree) + "  " + JSON.stringify(strFrame);
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

		public static function IsAfk() : String
		{
			return Root.Game.world.myAvatar.dataLeaf.afk ? (Root.TrueString) : (Root.FalseString);
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

		public static function Rest() : void
		{
			Root.Game.world.rest();
		}

		public static function Equip(param1:String) : void
		{
			Root.Game.world.sendEquipItemRequest({ItemID:parseInt(param1)});
		}

		public static function EquipPotion(param1:String, param2:String, param3:String, param4:String) : void
		{
			Root.Game.world.equipUseableItem({ItemID:parseInt(param1), sDesc:param2, sFile:param3, sName:param4});
		}

		public static function UseBoost(id:String):void
		{
			var boost:Object = Inventory.GetItemByID(parseInt(id));
			if (boost != null)
				Root.Game.world.sendUseItemRequest(boost);
		}

		public static function GetMapItem(itemId:String) : void
		{
			Root.Game.world.getMapItem(parseInt(itemId));
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

		public static function ChangeColorName(color: int) {
            Root.Game.world.myAvatar.pMC.pname.ti.textColor = color;
		}

        public static function GetAurasValue(self:String, auraName:String) : int
        {
			var value = 0;
			var isSelf = self == "True";
			var hasTarget = Root.Game.world.myAvatar.target != null && Root.Game.world.myAvatar.target.dataLeaf.intHP > 0;
            if (!isSelf && !hasTarget)
			{
				return value;
			}
			var objAura = isSelf ? Root.Game.world.myAvatar.dataLeaf.auras : Root.Game.world.myAvatar.target.dataLeaf.auras;
            for each (var aura in objAura) {
                if (aura.nam.toLowerCase() == auraName.toLowerCase())
                {
                    value = aura.val ? aura.val : 1;
                }
            }
			return value;
        }

		public static function GetAccessLevel(username: String) : int {
            var avatars:* = Root.Game.world.avatars;
            var accessLevel;
            for (var a in avatars)
            {
                var avatar = avatars[a];
                if (username != null) {
                    if (avatar.dataLeaf.strUsername.toLowerCase() == username.toLowerCase()) {
                        var uid = avatar.uid;
                        accessLevel = Root.Game.world.getAvatarByUserID(uid).objData.intAccessLevel;
                    }
                }
            }
            return accessLevel;
        }
	}

	 public static function isAvatarLoaded() : String
      {
         return Boolean(Root.Game.world.myAvatar.invLoaded) && Boolean(Root.Game.world.myAvatar.pMC.artLoaded()) ? Root.TrueString : Root.FalseString;
      }
}
