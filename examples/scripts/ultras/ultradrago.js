const BOSS = 'King Drago'
const LEFT_ADD = 'Executioner Dene'
const RIGHT_ADD = 'Bowmaster Algie'

function getSkillPlan(className) {
  switch (className) {
    case 'LEGION REVENANT':
      return [3, 1, 2, 4]
    case 'LORD OF ORDER':
      return [1, 3, 4, 5]
    case 'CHAOS AVENGER':
      return [5, 1, 3, 4, 2]
    case 'ARCHPALADIN':
      return [1, 3, 4, 5]
    default:
      return [1, 2, 3, 4]
  }
}

function* keepTauntOn(api, targetName, cadence, skillState) {
  if (skillState.loops % cadence === 0) {
    yield* api.combat.attackMonster(targetName)
    yield* api.combat.useSkill(5, true, true)
    yield* api.combat.attackMonster(BOSS)
  }
}

function* killDragoSide(api, script, addName, cadence, killPriority) {
  yield* api.combat.hunt(BOSS)
  yield* api.world.map.setSpawnPoint()

  const className = yield* api.player.getClassName()
  const rotation = getSkillPlan(className)
  const state = { index: 0, loops: 0 }

  while (!(yield* api.tempInventory.contains('Drago Dethroned', 1))) {
    if (!(yield* api.player.isAlive())) {
      yield* script.sleep(1000)
      continue
    }

    yield* keepTauntOn(api, addName, cadence, state)
    yield* api.combat.kill(BOSS, {
      killPriority,
      skillSet: [rotation[state.index]],
      skillWait: true,
    })
    state.index = (state.index + 1) % rotation.length
    state.loops += 1
    yield* script.sleep(100)
  }
}

module.exports = function* run({ api, script }) {
  yield* api.recipes.goToHouse()
  yield* api.settings.setFrameRate(10)
  yield* api.settings.setLagKillerEnabled(true)
  yield* api.settings.setOtherPlayersVisible(false)
  yield* api.settings.setInfiniteRange(true)
  yield* api.army.start('config')

  yield* api.quests.accept(8397)
  yield* api.army.joinMap('ultradrago')
  yield* api.army.equipSet('UltraDrago', { resolveItems: true })
  yield* api.recipes.buff()

  const playerNumber = yield* api.army.getPlayerNumber()
  if (playerNumber === 1 || playerNumber === 3) {
    yield* killDragoSide(api, script, LEFT_ADD, playerNumber, [LEFT_ADD, RIGHT_ADD])
  } else {
    yield* killDragoSide(api, script, RIGHT_ADD, playerNumber === 2 ? 1 : 2, [
      RIGHT_ADD,
      LEFT_ADD,
    ])
  }

  if (yield* api.quests.canComplete(8397)) {
    yield* api.quests.complete(8397)
  }
  yield* api.player.jumpToCell('Enter')
}
