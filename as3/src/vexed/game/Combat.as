package vexed.game {
  import vexed.Main;
  import vexed.util.Util;

  public class Combat {
    private static var game:Object = Main.getInstance().getGame();

    public static function hasTarget():Boolean {
      var target:Object = game.world.myAvatar.target;
      if (target != null && target.dataLeaf != null) {
        return target.dataLeaf.intHP > 0;
      }

      return false;
    }

    public static function getTarget():Object {
      var target:Object = game.world.myAvatar.target;
      if (target != null) {
        var ret:Object = target.dataLeaf;
        var auras:Array = [];
        if (target.npcType === "monster" || target.npcType == "player") {
          auras = Util.serializeAuras(ret.auras);
          ret.auras = auras;
        }

        return ret;
      }

      return null;
    }

    public static function forceUseSkill(index:String):void {
      var skill:Object = game.world.actions.active[parseInt(index)];
      if (Util.getSkillCooldownRemaining(skill) == 0) {
        // if (game.world.myAvatar.dataLeaf.intMP >= skill.mp) {
        if (skill.isOK && !skill.skillLock) {
          game.world.testAction(skill);
        }
        // }
      }
    }

    public static function useSkill(index:String):void {
      var skill:Object = game.world.actions.active[parseInt(index)];

      if (skill.tgt == "s" || skill.tgt == "f") {
        forceUseSkill(index);
        return;
      }

      if (game.world.myAvatar.target == game.world.myAvatar) {
        game.world.myAvatar.target = null;
        return;
      }

      if (game.world.myAvatar.target != null && game.world.myAvatar.target.dataLeaf.intHP > 0) {
        game.world.approachTarget();
        forceUseSkill(index);
      }
    }

    public static function getSkillCooldownRemaining(index:int):int {
      var skill:* = game.world.actions.active[index];
      return Util.getSkillCooldownRemaining(skill);
    }

    public static function cancelAutoAttack():void {
      game.world.cancelAutoAttack();
    }

    public static function cancelTarget():void {
      game.world.cancelTarget(); // cancel auto attack
      game.world.cancelTarget(); // cancel target
    }

    public static function attackMonster(mon:String):void {
      if (!mon)
        return;

      var monster:Object = World.getMonsterByName(mon);
      if (monster != null) {
        game.world.setTarget(monster);
        game.world.approachTarget();
      }
    }

    public static function attackMonsterById(monMapId:int):void {
      if (!monMapId)
        return;

      var monster:Object = World.getMonsterByMonMapId(monMapId);
      if (monster != null) {
        game.world.setTarget(monster);
        game.world.approachTarget();
      }
    }
  }
}