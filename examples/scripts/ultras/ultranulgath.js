cmd.set_delay(0)
cmd.goto_house()
cmd.set_fps(10)
cmd.enable_lagkiller()
cmd.enable_hideplayers()
cmd.enable_infiniterange()
cmd.enable_anticounter()
cmd.army_set_config('army_config')
cmd.army_init()
cmd.set_delay(1000)

cmd.accept_quest(8692) // nulgath

var opts = {
  skillAction() {
    let a = []
    let i = 0
    let h

    switch (this.bot.player.className) {
      case 'LEGION REVENANT':
        a = [1, 2, 3, 4]
        break
      case 'CHAOS AVENGER':
        a = [4, 3, 1, 2, 5]
        break
      case 'LORD OF ORDER':
        a = [1, 2, 3, 4]
        h = 2
        break
      case 'ARCHPALADIN':
        a = [1, 2, 3, 4]
        h = 2
    }

    return async function () {
      const plyrNumber = this.bot.army.getPlayerNumber()

      // chaos avenger: skip taunt on Nulgath the Archfiend
      if (
        this.bot.player.className === 'CHAOS AVENGER' &&
        this.bot.combat.hasTarget() &&
        this.bot.combat.target.name === 'Nulgath the Archfiend'
      ) {
        if (a[i] === 5) {
          i = (i + 1) % a.length
          return
        }
      }

      if (plyrNumber === 3 || plyrNumber === 4) {
        for (const plyr of this.bot.army.players) {
          const p = this.bot.world.players.get(plyr)
          if (p.isHpPercentageLessThan(60) && h) {
            await this.bot.combat.useSkill(h)
            return
          }
        }
      }
      await this.bot.combat.useSkill(a[i])
      i = (i + 1) % a.length
    }
  },
  skillDelay: 0,
}

cmd.army_join('ultranulgath')
cmd.army_equip_set('UltraNulgath', true)
cmd.buff()
cmd.hunt('Nulgath the Archfiend')
cmd.set_spawnpoint()

cmd.or(
  () => cmd.is_player_number(1), // LR
  () => cmd.is_player_number(4), // AP
)
cmd.goto_label('kill_nul')
cmd.or(
  () => cmd.is_player_number(2), // CAV
  () => cmd.is_player_number(3), // LOO
)
cmd.goto_label('kill_blade')

cmd.label('kill_blade')
cmd.army_kill_for_tempitem(
  'Nulgath the Archfiend',
  'Nulgath the Archfiend Defeated?',
  1,
  {
    ...opts,
    killPriority: ['Overfiend Blade'],
  },
)
cmd.goto_label('dead-nul')

cmd.label('kill_nul')
cmd.is_player_number(1)
cmd.do_looptaunt(['Nulgath the Archfiend', 1, 2])
cmd.is_player_number(4)
cmd.do_looptaunt(['Nulgath the Archfiend', 2, 2])
cmd.army_kill_for_tempitem(
  'Nulgath the Archfiend',
  'Nulgath the Archfiend Defeated?',
  1,
  opts,
)
cmd.goto_label('dead-nul')

cmd.label('dead-nul')
cmd.jump_to_cell('Enter')
cmd.complete_quest(8692)

