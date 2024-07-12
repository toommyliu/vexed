package grimoire.game
{
    import grimoire.Root;

    public class Skills
    {
        public static function AllSkillsAvailable():int
        {
            return Math.max(Math.max(IsSkillReady(Root.Game.world.actions.active[1]), IsSkillReady(Root.Game.world.actions.active[2])), Math.max(IsSkillReady(Root.Game.world.actions.active[3]), IsSkillReady(Root.Game.world.actions.active[4])));
        }

        public static function SkillAvailable(skillIndex:String):int
        {
            return IsSkillReady(Root.Game.world.actions.active[parseInt(skillIndex)]);
        }

        private static function IsSkillReady(param1):int
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

        public static function GetSkillCooldown(skill:String):String
        {
            return Root.Game.world.actions.active[parseInt(skill)].cd;
        }

        public static function SetSkillCooldown(skill:String, value:String):void
        {
            Root.Game.world.actions.active[parseInt(skill)].cd = value;
        }

        public static function SetSkillRange(skill:String, value:String):void
        {
            Root.Game.world.actions.active[parseInt(skill)].range = value;
        }

        public static function SetSkillMana(skill:String, value:String):void
        {
            Root.Game.world.actions.active[parseInt(skill)].mp = value;
        }

        public static function ForceUseSkill(index:String):void
        {
            var skill:Object = Root.Game.world.actions.active[parseInt(index)];
            if (IsSkillReady(skill) == 0)
            {
                // if (Root.Game.world.myAvatar.dataLeaf.intMP >= skill.mp)
                // if (true)
                // {
                if (skill.isOK && !skill.skillLock)
                {
                    Root.Game.world.testAction(skill);
                }
                // }
            }
        }

        public static function UseSkill(index:String):void
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

    }
}
