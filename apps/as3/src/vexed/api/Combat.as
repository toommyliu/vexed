package vexed.api
{
    import vexed.Main;

    public class Combat
    {
        private static var game:* = Main.instance.getGame();

        private static function actionTimeCheck(param1:*):Boolean
        {
            var finalCD:* = 0;
            var currentTime:* = new Date().getTime();
            var hasteMultiplier:* = 1 - Math.min(Math.max(game.world.myAvatar.dataLeaf.sta.$tha, -1), 0.5);

            if (param1.auto)
            {
                if (game.world.autoActionTimer.running)
                {
                    Main.instance.getExternal().debug("AA TIMER SELF-CLIPPING");
                    // trace("AA TIMER SELF-CLIPPING");
                    return false;
                }
                return true;
            }

            if (currentTime - game.world.GCDTS < game.world.GCD)
            {
                return false;
            }

            if (param1.OldCD != null)
            {
                finalCD = Math.round(param1.OldCD * hasteMultiplier);
            }
            else
            {
                finalCD = Math.round(param1.cd * hasteMultiplier);
            }

            if (currentTime - param1.ts >= finalCD)
            {
                delete param1.OldCD;
                return true;
            }

            return false;
        }

        public static function canUseSkill(index:int):Boolean
        {
            var skill:* = game.world.actions.active[index];
            return (game.world.myAvatar.target != null && game.world.myAvatar.target.dataLeaf.intHP > 0 && actionTimeCheck(skill) && skill.isOK && (!skill.skillLock || !skill.lock));
        }

        public static function useSkill(index:int):Boolean
        {
            var skill:* = game.world.actions.active[index];
            if (actionTimeCheck(skill))
            {
                game.world.testAction(skill);
                return true;
            }

            return false;
        }

        private static function attackTarget(target:*):Boolean
        {
            if (target != null && target.pMC != null)
            {
                game.world.setTarget(target);
                game.world.approachTarget();
                return true;
            }
            return false;
        }

        public static function untargetSelf():void
        {
            var target:* = game.world.myAvatar.target;
            if (target && target == game.world.myAvatar)
            {
                game.world.cancelTarget();
            }
        }

        public static function attackMonsterByMonMapID(id:int):Boolean
        {
            var monster:* = game.world.getMonster(id);
            return attackTarget(monster);
        }

        public static function attackMonsterByName(name:String):Boolean
        {
            var monster:* = vexed.api.World.getMonsterInCell(name);
            return attackTarget(monster);
        }

        public static function attackPlayer(name:String):Boolean
        {
            var player:* = game.world.getAvatarByUserName(name.toLowerCase());
            return attackTarget(player);
        }
    }
}