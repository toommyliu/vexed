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

cmd.accept_quest(8397) // drago

cmd.army_join('ultradrago')
cmd.army_equip_set('UltraDrago', true)
cmd.buff()

cmd.or(
  () => cmd.is_player_number(1), // LR
  () => cmd.is_player_number(3), // Loo
)
cmd.goto_label('left')
cmd.or(
  () => cmd.is_player_number(2), // CaV
  () => cmd.is_player_number(4), // AP
)
cmd.goto_label('right')

cmd.label('left')
cmd.hunt('King Drago')
cmd.set_spawnpoint()
cmd.is_player_number(1)
cmd.do_looptaunt(['Executioner Dene', 1, 2])
cmd.is_player_number(3)
cmd.do_looptaunt(['Executioner Dene', 2, 2])
cmd.army_kill_for_tempitem('King Drago', 'Drago Dethroned', 1, {
  killPriority: ['Executioner Dene', 'Bowmaster Algie'],
})

cmd.label('right')
cmd.hunt('King Drago')
cmd.set_spawnpoint()
cmd.is_player_number(2)
cmd.do_looptaunt(['Bowmaster Algie', 1, 2])
cmd.is_player_number(4)
cmd.do_looptaunt(['Bowmaster Algie', 2, 2])
cmd.army_kill_for_tempitem('King Drago', 'Drago Dethroned', 1, {
  killPriority: ['Bowmaster Algie', 'Executioner Dene'],
})

cmd.complete_quest(8397)
cmd.jump_to_cell('Enter')
