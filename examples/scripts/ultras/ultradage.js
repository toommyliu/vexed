const BOSS = 'Dage the Dark Lord'

function getSkillPlan(className) {
  switch (className) {
    case 'LEGION DOOMKNIGHT':
      return [1, 2, 3, 4]
    case 'QUANTUM CHRONOMANCER':
    case 'CHAOS AVENGER':
    case 'VERUS DOOMKNIGHT':
      return [1, 2, 3, 4, 5]
    default:
      return [1, 2, 3, 4]
  }
}

function isSome(option) {
  return option && option._tag === 'Some'
}

function* useSkill(api, playerNumber, skill) {
  const target = yield* api.combat.getTarget()
  if (
    (playerNumber === 1 || playerNumber === 3) &&
    target &&
    target.isMonster() &&
    skill === 5
  ) {
    const focus = yield* api.world.monsters.getAura(target.monMapId, 'Focus')
    if (!isSome(focus)) {
      yield* api.combat.useSkill(5, true, false)
      return
    }
  }

  yield* api.combat.useSkill(skill)
}

module.exports = function* run({ api, autoZone, script }) {
  yield* api.recipes.goToHouse()
  yield* api.settings.setFrameRate(10)
  yield* api.settings.setLagKillerEnabled(true)
  yield* api.settings.setOtherPlayersVisible(false)
  yield* api.settings.setInfiniteRange(true)
  yield* api.army.start('config')

  yield* api.quests.accept(8547)
  yield* api.army.joinMap('ultradage')
  yield* api.army.equipSet('UltraDage', { resolveItems: true })
  yield* autoZone.setMap('ultradage')
  yield* autoZone.enable()
  yield* api.recipes.buff()
  yield* api.combat.hunt(BOSS)
  yield* api.world.map.setSpawnPoint()

  const playerNumber = yield* api.army.getPlayerNumber()
  const rotation = getSkillPlan(yield* api.player.getClassName())
  let index = 0

  while (!(yield* api.tempInventory.contains('Dage the Dark Lord Defeated', 1))) {
    if (!(yield* api.player.isAlive())) {
      yield* script.sleep(1000)
      continue
    }

    if (!(yield* api.combat.hasTarget())) {
      yield* api.combat.attackMonster(BOSS)
    }

    yield* useSkill(api, playerNumber, rotation[index])
    index = (index + 1) % rotation.length
    yield* script.sleep(100)
  }

  yield* api.player.jumpToCell('Enter')
  if (yield* api.quests.canComplete(8547)) {
    yield* api.quests.complete(8547)
  }
}
