package vexed.api
{
    import vexed.Main;

    public class Player
    {
        private static var game:* = Main.instance.getGame();

        public static function cell():String
        {
            return game.world.strFrame;
        }

        public static function pad():String
        {
            return game.world.strPad;
        }

        public static function factions():Array
        {
            return game.world.myAvatar.factions;
        }

        public static function state():int
        {
            return game.world.myAvatar.dataLeaf.intState;
        }

        public static function health():int
        {
            return game.world.myAvatar.dataLeaf.intHP;
        }

        public static function healthMax():int
        {
            return game.world.myAvatar.dataLeaf.intHPMax;
        }

        public static function mana():int
        {
            return game.world.myAvatar.dataLeaf.intMP;
        }

        public static function manaMax():int
        {
            return game.world.myAvatar.dataLeaf.intMPMax;
        }

        public static function level():int
        {
            return game.world.myAvatar.dataLeaf.intLevel;
        }

        public static function isMember():Boolean
        {
            return game.world.myAvatar.isUpgraded();
        }

        public static function gold():int
        {
            return game.world.myAvatar.objData.intGold;
        }

        public static function position():Object
        {
            return {x: game.world.myAvatar.pMC.x, y: game.world.myAvatar.pMC.y};
        }

        public static function join(cell:String, pad:String = "Enter", map:String = "Spawn"):void
        {
            game.world.gotoTown(cell, pad, map);
        }

        public static function jump(cell:String, pad:String = "Spawn"):void
        {
            game.world.moveToCell(cell, pad);
        }

        public static function rest():void
        {
            game.world.rest();
        }

        public static function hasActiveBoost(boost:String):Boolean
        {
            boost = boost.toLowerCase();
            if (boost.indexOf("gold") > -1)
            {
                return game.world.myAvatar.objData.iBoostG > 0;
            }
            if (boost.indexOf("xp") > -1)
            {
                return game.world.myAvatar.objData.iBoostXP > 0;
            }
            if (boost.indexOf("rep") > -1)
            {
                return game.world.myAvatar.objData.iBoostRep > 0;
            }
            if (boost.indexOf("class") > -1)
            {
                return game.world.myAvatar.objData.iBoostCP > 0;
            }
            return false;
        }

        public static function playerClass():String
        {
            return game.world.myAvatar.objData.strClassName.toUpperCase();
        }

        public static function userID():int
        {
            return game.world.myAvatar.uid;
        }

        public static function charID():int
        {
            return game.world.myAvatar.objData.CharID;
        }

        public static function gender():String
        {
            return game.world.myAvatar.objData.strGender.toUpperCase();
        }

        public static function playerData():Object
        {
            return game.world.myAvatar.objData;
        }

		/*public static function setEquip(param1:String, param2:Object):void
		{
			if (game.world.myAvatar.pMC.pAV.objData.eqp.Weapon == null)
			{
				return;
			}
			var _loc_3:String = param1;
			var _loc_4:Object = param2;
			if (param1 == "Off")
			{
				game.world.myAvatar.pMC.pAV.objData.eqp.Weapon.sLink = _loc_4.sLink;
				game.world.myAvatar.pMC.loadWeaponOff(_loc_4.sFile, _loc_4.sLink);
				game.world.myAvatar.pMC.pAV.getItemByEquipSlot("Weapon").sType = "Dagger";
			}
			else
			{
				game.world.myAvatar.objData.eqp[_loc_3] = _loc_4;
				game.world.myAvatar.loadMovieAtES(_loc_3, _loc_4.sFile, _loc_4.sLink);
			}
			return;
		}

		public static function getEquip(itemId:int):Object
		{
			return game.world.avatars[itemId].objData.eqp;
		}*/
    }
}