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

cmd.accept_quest(8547) // dage

var opts = {
  skillAction() {
    let a = []
    let i = 0

    switch (this.bot.player.className) {
      case 'LEGION DOOMKNIGHT':
        a = [1, 2, 3, 4]
        break
      case 'QUANTUM CHRONOMANCER':
        a = [1, 2, 3, 4, 5]
        break
      case 'CHAOS AVENGER':
        a = [1, 2, 3, 4, 5]
        break
      case 'VERUS DOOMKNIGHT':
        a = [1, 2, 3, 4, 5]
    }

    return async function () {
      const plyrNumber = this.bot.army.getPlayerNumber()

      if (plyrNumber === 1 || plyrNumber === 3) {
        try {
          if (
            this.bot.combat.hasTarget() &&
            this.bot.combat.target.isMonster() &&
            !this.bot.combat.target.hasAura('Focus')
          ) {
            void this.bot.combat.useSkill(5, true, false)
          }
        } catch (error) {
          console.warn('failed aura check', error)
        }
      }

      await this.bot.combat.useSkill(a[i])
      i = (i + 1) % a.length
    }
  },
  skillDelay: 0,
}

cmd.army_join('ultradage')
cmd.army_equip_set('UltraDage', true)
cmd.use_autozone_ultradage()
cmd.buff()
cmd.hunt('Dage the Dark Lord')
cmd.set_spawnpoint()
cmd.army_kill_for_tempitem('*', 'Dage the Dark Lord Defeated', 1, opts)
cmd.jump_to_cell('Enter')
cmd.complete_quest(8547)
