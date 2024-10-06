package skua.api
{
    import skua.Main;
    import skua.ExtractedFuncs;

    public class Combat
    {
        private static var game:* = Main.instance.getGame();

        public static function canUseSkill(index:int):String
        {
            var skill:* = game.world.actions.active[index];
            return (game.world.myAvatar.target != null && game.world.myAvatar.target.dataLeaf.intHP > 0 && skua.ExtractedFuncs.actionTimeCheck(skill) && skill.isOK && (!skill.skillLock || !skill.lock)).toString();
        }

        public static function useSkill(index:int):String
        {
            var skill:* = game.world.actions.active[index];
            if (skua.ExtractedFuncs.actionTimeCheck(skill))
            {
                game.world.testAction(skill);
                return true.toString();
            }

            return false.toString();
        }

        private static function attackTarget(target:*):String
        {
            if (target != null && target.pMC != null)
            {
                game.world.setTarget(target);
                game.world.approachTarget();
                return true.toString();
            }
            return false.toString();
        }

        public static function untargetSelf():void
        {
            var target:* = game.world.myAvatar.target;
            if (target && target == game.world.myAvatar)
            {
                game.world.cancelTarget();
            }
        }

        public static function attackMonsterByMonMapID(id:int):String
        {
            var monster:* = game.world.getMonster(id);
            return attackTarget(monster);
        }

        public static function attackMonsterByName(name:String):String
        {
            var monster:* = skua.api.World.getMonsterInCell(name);
            return attackTarget(monster);
        }

        public static function attackPlayer(name:String):String
        {
            var player:* = game.world.getAvatarByUserName(name.toLowerCase());
            return attackTarget(player);
        }
    }
}