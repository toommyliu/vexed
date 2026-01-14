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
cmd.buy_lifesteal(99)
cmd.buy_scroll_of_enrage(999)
cmd.accept_quest(8300) // drakath

var opts = {
  skillAction() {
    let a = []
    let i = 0
    let h

    switch (this.bot.player.className) {
      case 'LEGION REVENANT':
        a = [3, 1, 2, 4]
        break
      case 'ARCHPALADIN':
        a = [3, 1, 2, 4, 5]
        break
      case 'STONECRUSHER':
        a = [1, 2, 3, 4, 5]
        h = 2
        break
      case 'LORD OF ORDER':
        a = [1, 3, 4, 5]
        h = 2
    }

    const boundaries = [
      { min: 18020000, max: 18250000, msg: 'taunt at 18.02mil - 18.25mil' },
      { min: 16020000, max: 16250000, msg: 'taunt at 16.02mil - 16.25mil' },
      { min: 14020000, max: 14250000, msg: 'taunt at 14.02mil - 14.25mil' },
      { min: 12020000, max: 12250000, msg: 'taunt at 12.02mil - 12.25mil' },
      { min: 10020000, max: 10150000, msg: 'taunt at 10.02mil - 10.15mil' },
      { min: 8020000, max: 8200000, msg: 'taunt at 8.02mil - 8.2mil' },
      { min: 6020000, max: 6200000, msg: 'taunt at 6.02mil - 6.2mil' },
      { min: 4020000, max: 4200000, msg: 'taunt at 4.02mil - 4.2mil' },
      { min: 2020000, max: 2200000, msg: 'taunt at 2.02mil - 2.2mil' },
    ]

    return async function () {
      const plyrNumber = this.bot.army.getPlayerNumber()

      if (plyrNumber === 1 && this.bot.combat.hasTarget()) {
        if (this._nextBoundaryIndex === undefined) this._nextBoundaryIndex = 0

        const hp = this.bot.combat.target.hp
        const b = boundaries[this._nextBoundaryIndex]

        if (b && hp <= b.max) {
          if (hp >= b.min) {
            console.log(b.msg)
            await this.bot.combat.useSkill(5, true, true)
            this._nextBoundaryIndex++
          } else if (hp < b.min) {
            // HP dropped below the current boundary without triggering or already triggered
            this._nextBoundaryIndex++
          }
        }
      }

      if ((plyrNumber === 3 || plyrNumber === 4) && h) {
        for (const username of this.bot.army.players) {
          const p = this.bot.world.players.get(username)
          if (p && p.isHpPercentageLessThan(60)) {
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

cmd.army_join('championdrakath')
cmd.army_equip_set('ChampionDrakath', true)
cmd.buff()
cmd.hunt('Champion Drakath')
cmd.set_spawn()
cmd.army_kill_for_tempitem(
  'Champion Drakath',
  'Champion Drakath Defeated',
  1,
  opts,
)
cmd.jump_to_cell('Enter')
cmd.complete_quest(8300)
