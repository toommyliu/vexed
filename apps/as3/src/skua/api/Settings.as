package skua.api
{
    import skua.Main;

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
    }
}