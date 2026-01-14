cmd.set_delay(0)
cmd.goto_house()
cmd.set_fps(10)
cmd.enable_lagkiller()
cmd.enable_hideplayers()
cmd.enable_infiniterange()
cmd.enable_anticounter()
cmd.enable_death_ads()
cmd.army_set_config('army_config')
cmd.army_init()
cmd.set_delay(1000)

cmd.accept_quest(9173) // ultraspeaker

var opts = {
  skillAction() {
    let a = []
    let i = 0
    let h
    let hV

    switch (this.bot.player.className) {
      case 'LEGION REVENANT':
        a = [3, 2, 1, 4, 5]
        break
      case 'ARCHPALADIN':
        a = [1, 3, 4, 5, 2]
        h = 2
        hV = 40
        break
      case 'LORD OF ORDER':
        a = [1, 3, 4, 5, 2]
        h = 2
        hV = 80
        break
      case 'VERUS DOOMKNIGHT':
        a = [1, 2, 3, 4, 5]
    }

    return async function () {
      const plyrNumber = this.bot.army.getPlayerNumber()

      if (plyrNumber === 3 || plyrNumber === 4) {
        for (const plyr of this.bot.army.players) {
          const p = this.bot.world.players.get(plyr)
          if (h && hV && p.isHpPercentageLessThan(hV)) {
            await this.bot.combat.useSkill(h)
            return
          }
        }
      }

      await this.bot.combat.useSkill(a[i])
      i = (i + 1) % a.length
    }
  }
}
cmd.army_join('ultraspeaker')
cmd.army_equip_set('UltraSpeaker', true)
cmd.buff()

cmd.hunt('The First Speaker')
cmd.set_spawnpoint()
cmd.register_task('walkToPoint', function () {
  const bot = this.bot
  const ctx = this.ctx

  let intervalId = setInterval(() => {
    if (!ctx.isRunning()) {
      clearInterval(intervalId)
      return
    }
    if (bot.world.name !== 'ultraspeaker') return
    if (bot.player.cell !== 'Enter') return
    bot.player.walkTo(28, 235) // top left
  }, 100)
})

cmd.army_kill_for_item('The First Speaker', 'The First Speaker Silenced', 1, {
  ...opts,
})
cmd.jump_to_cell('Enter')
cmd.complete_quest(9173)
