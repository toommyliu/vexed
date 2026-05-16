function getSkillPlan(className) {
  switch (className) {
    case 'LEGION REVENANT':
      return { rotation: [3, 1, 2, 4, 5] }
    case 'CHAOS AVENGER':
      return { rotation: [5, 1, 3, 4, 2] }
    case 'LORD OF ORDER':
    case 'ARCHPALADIN':
      return { rotation: [1, 3, 4, 5], healSkill: 2 }
    default:
      return { rotation: [1, 2, 3, 4] }
  }
}

function* healIfNeeded(api, healSkill) {
  if (!healSkill) return false

  const players = yield* api.world.players.getAll()
  for (const player of players.values()) {
    if (player.isHpPercentageLessThan(70)) {
      yield* api.combat.useSkill(healSkill)
      return true
    }
  }

  return false
}

function* killForTempItem(api, script, target, item, options = {}) {
  const className = yield* api.player.getClassName()
  const { rotation, healSkill } = getSkillPlan(className)
  let index = 0

  while (!(yield* api.tempInventory.contains(item, 1))) {
    if (!(yield* api.player.isAlive())) {
      yield* script.sleep(1000)
      continue
    }

    if (yield* healIfNeeded(api, healSkill)) {
      yield* script.sleep(100)
      continue
    }

    let skill = rotation[index]
    index = (index + 1) % rotation.length

    const currentTarget = yield* api.combat.getTarget()
    if (
      options.archpaladinOnlyTyndariusTaunt &&
      currentTarget?.name === 'Ultra Avatar Tyndarius' &&
      className !== 'ARCHPALADIN' &&
      skill === 5
    ) {
      skill = rotation[index]
      index = (index + 1) % rotation.length
    }

    yield* api.combat.kill(target, {
      killPriority: options.killPriority,
      skillSet: [skill],
      skillWait: true,
    })
    yield* script.sleep(100)
  }
}

function* runUltra(api, script, map, setName, target, item, options = {}) {
  yield* api.army.joinMap(map)
  yield* api.army.equipSet(setName, { resolveItems: true })
  yield* api.recipes.buff()
  yield* api.combat.hunt(target)
  yield* api.world.map.setSpawnPoint()
  yield* killForTempItem(api, script, target, item, options)
  yield* api.player.jumpToCell('Enter', options.enterPad)
}

function tyndariusPriority(playerNumber) {
  if (playerNumber === 3) return ['id.3', 'id.1']
  if (playerNumber === 4) return undefined
  return ['id.1', 'id.3']
}

module.exports = function* run({ api, script }) {
  yield* api.recipes.goToHouse()
  yield* api.settings.setFrameRate(10)
  yield* api.settings.setLagKillerEnabled(true)
  yield* api.settings.setInfiniteRange(true)
  yield* api.army.start('config')

  yield* runUltra(
    api,
    script,
    'ultraezrajal',
    'UltraEzrajal',
    'Ultra Ezrajal',
    'Ultra Ezrajal Defeated',
    { enterPad: 'Spawn' },
  )
  yield* runUltra(
    api,
    script,
    'ultrawarden',
    'UltraWarden',
    'Ultra Warden',
    'Ultra Warden Defeated',
  )
  yield* runUltra(
    api,
    script,
    'ultraengineer',
    'UltraEngineer',
    'id.3',
    'Ultra Engineer Defeated',
    { killPriority: ['id.1', 'id.2'] },
  )

  yield* api.army.joinMap('ultratyndarius')
  yield* api.army.equipSet('UltraTyndarius', { resolveItems: true })
  yield* api.recipes.buff()
  yield* api.combat.hunt('Ultra Avatar Tyndarius')
  yield* api.world.map.setSpawnPoint()

  const playerNumber = yield* api.army.getPlayerNumber()
  yield* killForTempItem(api, script, 'id.2', 'Ultra Avatar Tyndarius Defeated', {
    killPriority: tyndariusPriority(playerNumber),
    archpaladinOnlyTyndariusTaunt: true,
  })

  yield* api.player.jumpToCell('Enter')
  yield* api.recipes.goToHouse()
}
