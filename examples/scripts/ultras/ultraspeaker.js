const BOSS = 'The First Speaker'

function getSkillPlan(className) {
  switch (className) {
    case 'LEGION REVENANT':
      return { rotation: [3, 2, 1, 4, 5] }
    case 'ARCHPALADIN':
      return { rotation: [1, 3, 4, 5, 2], healSkill: 2, healAt: 40 }
    case 'LORD OF ORDER':
      return { rotation: [1, 3, 4, 5, 2], healSkill: 2, healAt: 80 }
    case 'VERUS DOOMKNIGHT':
      return { rotation: [1, 2, 3, 4, 5] }
    default:
      return { rotation: [1, 2, 3, 4] }
  }
}

function* healIfNeeded(api, healSkill, healAt) {
  if (!healSkill || !healAt) return false

  const playerNumber = yield* api.army.getPlayerNumber()
  if (playerNumber !== 3 && playerNumber !== 4) return false

  const players = yield* api.world.players.getAll()
  for (const player of players.values()) {
    if (player.isHpPercentageLessThan(healAt)) {
      yield* api.combat.useSkill(healSkill)
      return true
    }
  }

  return false
}

function* keepEnterWalkPosition(api) {
  const mapName = yield* api.world.map.getName()
  if (mapName !== 'ultraspeaker') return

  const cell = yield* api.player.getCell()
  if (cell !== 'Enter') return

  yield* api.player.walkTo(28, 235)
}

module.exports = function* run({ api, script }) {
  yield* api.recipes.goToHouse()
  yield* api.settings.setFrameRate(10)
  yield* api.settings.setLagKillerEnabled(true)
  yield* api.settings.setOtherPlayersVisible(false)
  yield* api.settings.setInfiniteRange(true)
  yield* api.settings.setDeathAdsVisible(true)
  yield* api.army.start('config')

  yield* api.quests.accept(9173)
  yield* api.army.joinMap('ultraspeaker')
  yield* api.army.equipSet('UltraSpeaker', { resolveItems: true })
  yield* api.recipes.buff()
  yield* api.combat.hunt(BOSS)
  yield* api.world.map.setSpawnPoint()

  const { rotation, healSkill, healAt } = getSkillPlan(
    yield* api.player.getClassName(),
  )
  let index = 0

  while (!(yield* api.inventory.contains('The First Speaker Silenced', 1))) {
    yield* keepEnterWalkPosition(api)

    if (!(yield* api.player.isAlive())) {
      yield* script.sleep(1000)
      continue
    }

    if (!(yield* api.combat.hasTarget())) {
      yield* api.combat.attackMonster(BOSS)
    }

    if (yield* healIfNeeded(api, healSkill, healAt)) {
      yield* script.sleep(100)
      continue
    }

    yield* api.combat.useSkill(rotation[index])
    index = (index + 1) % rotation.length
    yield* script.sleep(100)
  }

  yield* api.player.jumpToCell('Enter')
  if (yield* api.quests.canComplete(9173)) {
    yield* api.quests.complete(9173)
  }
}
