cmd.register_drop(
  [
    'Unidentified 13',
    'Unidentified 10',
    'Tainted Gem',
    'Dark Crystal Shard',
    'Diamond of Nulgath',
    'Voucher of Nulgath (non-mem)',
    'Gem of Nulgath',
    'Essence of Nulgath',
  ]
)
cmd.register_quest(609) // bamboozle vs drudgen
cmd.register_quest(2857) // supplies to spin the wheel of chance
cmd.set_auto_register_requirements(true)
cmd.set_auto_register_rewards(true)
cmd.set_reject_else(true)

cmd.join('evilmarsh', 'End', 'Left')
cmd.label('kill')
cmd.kill_for_item('Tainted Elemental', 'Tainted Core', 1)
cmd.goto_label('kill')
