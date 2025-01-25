package vexed.game
{
  import vexed.Main;
  import vexed.ExtractedFuncs;

  public class Combat
  {
    private static var game:Object = Main.getInstance().getGame();

    public static function hasTarget():Boolean
    {
      var target:Object = game.world.myAvatar.target;
      if (target !== null)
      {
        if (target.dataLeaf !== null)
        {
          return target.dataLeaf.intHP > 0;
        }
      }

      return false;
    }

    public static function getTarget():Object
    {
      var target:Object = game.world.myAvatar.target;
      if (target !== null)
      {
        if (target.npcType === "monster")
        {
          return target.dataLeaf;
        }
        else if (target.npcType === "player")
        {
          // TODO: aura checks break this
          return {
              name: target.dataLeaf.strUsername,
              hp: target.dataLeaf.intHP,
              hpMax: target.dataLeaf.intHPMax
            };
        }
      }

      return null;
    }

    public static function useSkill(index:int):void
    {
      var skill:* = game.world.actions.active[index];
      if (ExtractedFuncs.actionTimeCheck(skill))
      {
        game.world.testAction(skill);
      }
    }

    public static function forceUseSkill(index:int):void
    {
      var skill:* = game.world.actions.active[index];
      if (skill)
      {
        game.world.testAction(skill);
      }
    }

    public static function canUseSkill(index:int):Boolean
    {
      var skill:* = game.world.actions.active[index];
      return hasTarget() && ExtractedFuncs.actionTimeCheck(skill) && skill.isOK && (!skill.skillLock || !skill.lock);
    }

    public static function getSkillCooldownRemaining(index:int):int
    {
      var skill:* = game.world.actions.active[index];
      return ExtractedFuncs.getSkillCooldownRemaining(skill);
    }

    public static function cancelAutoAttack():void
    {
      game.world.cancelAutoAttack();
    }

    public static function cancelTarget():void
    {
      game.world.cancelTarget(); // cancel auto attack
      game.world.cancelTarget(); // cancel target
    }

    public static function attackMonster(name:*):void
    {
      if (!name || !(name is String))
        return;

      var monster:Object = World.getMonsterByName(name);
      if (monster !== null)
      {
        game.world.setTarget(monster);
        game.world.approachTarget();
      }
    }

    public static function attackMonsterById(monMapId:int):void
    {
      if (!monMapId || !(monMapId is int))
        return;

      var monster:Object = World.getMonsterByMonMapId(monMapId);
      if (monster !== null)
      {
        game.world.setTarget(monster);
        game.world.approachTarget();
      }
    }
  }
}