// if you want to complete the daily:
// cmd.accept_quest(8152..8154)
// cmd.complete_quest(8152..8154)

cmd.set_delay(0)
cmd.goto_house()
cmd.set_fps(10)
cmd.enable_lagkiller()
cmd.enable_infiniterange()
cmd.enable_anticounter()
cmd.army_set_config('army_config')
cmd.army_init()
cmd.set_delay(1000)

let opts = {
  skillAction() {
    let a = []
    let i = 0
    let h

    switch (this.bot.player.className) {
      case 'LEGION REVENANT':
        a = [3, 1, 2, 4, 5]
        break
      case 'CHAOS AVENGER':
        a = [5, 1, 3, 4, 2]
        break
      case 'LORD OF ORDER':
        a = [1, 3, 4, 5]
        h = 2
        break
      case 'ARCHPALADIN':
        a = [1, 3, 4, 5]
        h = 2
    }

    return async function () {
      for (const plyr of this.bot.army.players) {
        const p = this.bot.world.players.get(plyr)
        if (p.isHpPercentageLessThan(70) && h) {
          await this.bot.combat.useSkill(h)
          return
        }
      }

      // for reliability, archpaladin should have exclusive taunt on Ultra Avatar Tyndarius
      if (
        this.bot?.combat?.target?.name === 'Ultra Avatar Tyndarius' &&
        this.bot.player.className !== 'ARCHPALADIN' &&
        a[i] === 5
      ) {
        i = (i + 1) % a.length
        return
      }

      await this.bot.combat.useSkill(a[i])
      i = (i + 1) % a.length
    }
  },
}

cmd.army_join('ultraezrajal')
cmd.army_equip_set('UltraEzrajal', true)
cmd.buff()
cmd.hunt('Ultra Ezrajal')
cmd.set_spawn()
cmd.army_kill_for('Ultra Ezrajal', 'Ultra Ezrajal Defeated', 1, true, opts)
cmd.move_to_cell('Enter', 'Spawn')

cmd.army_join('ultrawarden')
cmd.army_equip_set('UltraWarden', true)
cmd.buff()
cmd.hunt('Ultra Warden')
cmd.set_spawn()
cmd.army_kill_for('Ultra Warden', 'Ultra Warden Defeated', 1, true, opts)
cmd.move_to_cell('Enter')

cmd.army_join('ultraengineer')
cmd.army_equip_set('UltraEngineer', true)
cmd.buff()
cmd.hunt('Ultra Engineer')
cmd.set_spawn()
cmd.army_kill_for('id.3', 'Ultra Engineer Defeated', 1, true, {
  killPriority: ['id.1', 'id.2'],
  ...opts,
})
cmd.move_to_cell('Enter')

cmd.army_join('ultratyndarius')
cmd.army_equip_set('UltraTyndarius', true)
cmd.buff()
cmd.hunt('Ultra Avatar Tyndarius')
cmd.set_spawn()

cmd.is_player_number(1)
cmd.goto_label('tyn-p1')
cmd.is_player_number(2)
cmd.goto_label('tyn-p2')
cmd.is_player_number(3)
cmd.goto_label('tyn-p3')
cmd.is_player_number(4)
cmd.goto_label('tyn-p4')
cmd.stop_bot()

// id.1, 3 are the orbs
// id.2 is the boss

cmd.label('tyn-p1')
cmd.army_kill_for('id.2', 'Ultra Avatar Tyndarius Defeated', 1, true, {
  killPriority: ['id.1', 'id.3'], // orbs first, then boss
  ...opts,
})
cmd.goto_label('tyn-dead')

cmd.label('tyn-p2')
cmd.army_kill_for('id.2', 'Ultra Avatar Tyndarius Defeated', 1, true, {
  killPriority: ['id.1', 'id.3'],
  ...opts,
})
cmd.goto_label('tyn-dead')

cmd.label('tyn-p3')
cmd.army_kill_for('id.2', 'Ultra Avatar Tyndarius Defeated', 1, true, {
  killPriority: ['id.3', 'id.1'],
  ...opts,
})
cmd.goto_label('tyn-dead')

cmd.label('tyn-p4')
cmd.army_kill_for('id.2', 'Ultra Avatar Tyndarius Defeated', 1, true, { // focus boss
  ...opts,
})
cmd.goto_label('tyn-dead')

cmd.label('tyn-dead')
cmd.move_to_cell('Enter')
cmd.goto_house()