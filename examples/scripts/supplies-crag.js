const DROPS = [
  'Unidentified 13',
  'Unidentified 10',
  'Tainted Gem',
  'Dark Crystal Shard',
  'Diamond of Nulgath',
  'Voucher of Nulgath (non-mem)',
  'Gem of Nulgath',
  'Essence of Nulgath',
  'Relic of Chaos',
  'Tainted Core'
]

module.exports = function* run({ api, script }) {
  for (const drop of DROPS) {
    yield* api.environment.addItem(drop)
  }

  yield* api.environment.addQuest(609)
  yield* api.environment.addQuest(2857)
  yield* api.environment.setRejectUnregisteredDrops(true)
  yield* api.environment.setAutoRegisterRequirements(true)

  yield* api.player.joinMap('evilmarsh', 'End', 'Left')

  while (true) {
    yield* api.combat.killForItem('Tainted Elemental', 'Tainted Core', 1)
    yield* script.sleep(250)
  }
}
