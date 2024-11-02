package vexed.api
{
    import vexed.Main;
    import flash.filters.GlowFilter;

    public class Settings
    {
        private static var game:* = Main.instance.getGame();

        public static function magnetize():void
        {
            var target:* = game.world.myAvatar.target;
            if (target)
            {
                target.pMC.x = game.world.myAvatar.pMC.x;
                target.pMC.y = game.world.myAvatar.pMC.y;
            }
        }

        public static function infiniteRange():void
        {
            for (var i:int = 0; i < 6; i++)
            {
                game.world.actions.active[i].range = 20000;
            }
        }

        public static function skipCutscenes():void
        {
            while (game.mcExtSWF.numChildren > 0)
            {
                game.mcExtSWF.removeChildAt(0);
            }
            game.showInterface();
        }

        public static function setLagKiller(on:Boolean):void
        {
            game.world.visible = on;
        }

        public static function setDeathAds(on:Boolean):void
        {
            game.userPreference.data.bDeathAd = on;
        }

        public static function setName(name:String):void
        {
            game.world.myAvatar.pMC.pAV.objData.strUsername = name.toUpperCase();
            game.world.myAvatar.objData.strUsername = name.toUpperCase();
            game.world.myAvatar.pMC.pname.ti.text = name.toUpperCase();
            game.ui.mcPortrait.strName.text = name.toUpperCase();
        }

        public static function setGuild(guild:String):void
        {
            try
            {
                game.world.myAvatar.pMC.pname.tg.text = guild.toUpperCase();
                game.world.myAvatar.objData.guild.Name = guild.toUpperCase();
                game.world.myAvatar.pMC.pAV.objData.guild.Name = guild.toUpperCase();
            }
            catch (e:Error)
            {
            }
        }

        public static function setWalkSpeed(speed:int):void
        {
            game.world.WALKSPEED = speed;
        }

        public static function setAccessLevel(accessLevel:String):void
        {
            if (accessLevel == "Non Member")
            {
                game.world.myAvatar.pMC.pname.ti.textColor = 16777215;
                game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
                game.world.myAvatar.objData.iUpgDays = -1;
                game.world.myAvatar.objData.iUpg = 0;
            }
            else if (accessLevel == "Member")
            {
                game.world.myAvatar.pMC.pname.ti.textColor = 9229823;
                game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
                game.world.myAvatar.objData.iUpgDays = 30;
                game.world.myAvatar.objData.iUpg = 1;
            }
            else if (accessLevel == "Moderator" || accessLevel == "60")
            {
                // Yellow
                game.world.myAvatar.pMC.pname.ti.textColor = 16698168;
                game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
                game.world.myAvatar.objData.intAccessLevel = 60;
            }
            else if (accessLevel == "30")
            {
                // Dark Green
                game.world.myAvatar.pMC.pname.ti.textColor = 52881;
                game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
                game.world.myAvatar.objData.intAccessevel = 30;
            }
            else if (accessLevel == "40")
            {
                // Light Green
                game.world.myAvatar.pMC.pname.ti.textColor = 5308200;
                game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
                game.world.myAvatar.objData.intAccessLevel = 40;
            }
            else if (accessLevel == "50")
            {
                // Purple
                game.world.myAvatar.pMC.pname.ti.textColor = 12283391;
                game.world.myAvatar.pMC.pname.filters = [new GlowFilter(0, 1, 3, 3, 64, 1)];
                game.world.myAvatar.objData.intAccessLevel = 50;
            }
        }
    }
}