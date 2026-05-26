const { features, script, api } = require("vexed")

const BOSS = 'Nulgath the Archfiend'
const BLADE = 'Overfiend Blade'

function getSkillPlan(className) {
  switch (className) {
    case 'LEGION REVENANT':
      return { rotation: [1, 2, 3, 4] }
    case 'CHAOS AVENGER':
      return { rotation: [4, 3, 1, 2, 5] }
    case 'LORD OF ORDER':
    case 'ARCHPALADIN':
      return { rotation: [1, 2, 3, 4], healSkill: 2 }
    default:
      return { rotation: [1, 2, 3, 4] }
  }
}

function* healIfNeeded(healSkill) {
  if (!healSkill) return false

  const playerNumber = yield* api.army.getPlayerNumber()
  if (playerNumber !== 3 && playerNumber !== 4) return false

  const players = yield* api.world.players.getAll()
  for (const player of players.values()) {
    if (player.isHpPercentageLessThan(60)) {
      yield* api.combat.useSkill(healSkill)
      return true
    }
  }

  return false
}

function* killUntilDefeated(options) {
  const className = yield* api.player.getClassName()
  const { rotation, healSkill } = getSkillPlan(className)
  let index = 0
  let loops = 0

  while (!(yield* api.tempInventory.contains('Nulgath the Archfiend Defeated?', 1))) {
    if (!(yield* api.player.isAlive())) {
      yield* script.sleep(1000)
      continue
    }

    if (yield* healIfNeeded(healSkill)) {
      yield* script.sleep(100)
      continue
    }

    let skill = rotation[index]
    index = (index + 1) % rotation.length

    const target = yield* api.combat.getTarget()
    if (className === 'CHAOS AVENGER' && target?.name === BOSS && skill === 5) {
      skill = rotation[index]
      index = (index + 1) % rotation.length
    }

    if (options.tauntBoss && loops % options.tauntCadence === 0) {
      yield* api.combat.attackMonster(BOSS)
      yield* api.combat.useSkill(5, true, true)
    }

    yield* api.combat.kill(BOSS, {
      killPriority: options.killPriority,
      skillSet: [skill],
      skillWait: true,
    })
    loops += 1
    yield* script.sleep(100)
  }
}

module.exports = function* run() {
  yield* api.recipes.goToHouse()
  yield* api.settings.setFrameRate(10)
  yield* api.settings.setLagKillerEnabled(true)
  yield* api.settings.setOtherPlayersVisible(false)
  yield* api.settings.setInfiniteRange(true)
  yield* api.army.start('config')

  yield* api.quests.accept(8692)
  yield* api.army.joinMap('ultranulgath')
  yield* api.army.equipSet('UltraNulgath', { resolveItems: true })
  yield* api.recipes.buff()
  yield* api.combat.hunt(BOSS)
  yield* api.world.map.setSpawnPoint()

  const playerNumber = yield* api.army.getPlayerNumber()
  if (playerNumber === 1 || playerNumber === 4) {
    yield* killUntilDefeated({
      tauntBoss: true,
      tauntCadence: playerNumber === 1 ? 1 : 2,
    })
  } else {
    yield* killUntilDefeated({ killPriority: [BLADE] })
  }

  yield* api.player.jumpToCell('Enter')
  if (yield* api.quests.canComplete(8692)) {
    yield* api.quests.complete(8692)
  }
}
