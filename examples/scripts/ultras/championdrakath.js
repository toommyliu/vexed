const { features, script, api } = require("vexed")

const BOSS = 'Champion Drakath'

const BOUNDARIES = [
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

function getSkillPlan(className) {
  switch (className) {
    case 'LEGION REVENANT':
      return { rotation: [3, 1, 2, 4] }
    case 'ARCHPALADIN':
      return { rotation: [3, 1, 2, 4, 5] }
    case 'STONECRUSHER':
      return { rotation: [1, 2, 3, 4, 5], healSkill: 2 }
    case 'LORD OF ORDER':
      return { rotation: [1, 3, 4, 5], healSkill: 2 }
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

function* tauntBoundaryIfNeeded(nextBoundaryIndex) {
  const playerNumber = yield* api.army.getPlayerNumber()
  if (playerNumber !== 1) return nextBoundaryIndex

  const target = yield* api.combat.getTarget()
  if (!target || target.name !== BOSS) return nextBoundaryIndex

  const boundary = BOUNDARIES[nextBoundaryIndex]
  if (!boundary || target.hp > boundary.max) return nextBoundaryIndex

  if (target.hp >= boundary.min) {
    script.log(boundary.msg)
    yield* api.combat.useSkill(5, true, true)
  }

  return nextBoundaryIndex + 1
}

module.exports = function* run() {
  yield* api.settings.setFrameRate(10)
  yield* api.settings.setLagKillerEnabled(true)
  yield* api.settings.setOtherPlayersVisible(false)
  yield* api.settings.setInfiniteRange(true)
  yield* api.settings.setDeathAdsVisible(false)

  yield* api.army.start('config')
  yield* api.recipes.goToHouse()
  yield* api.recipes.ensureLifeSteal(99)
  yield* api.recipes.ensureScrollOfEnrage(999)
  yield* api.quests.accept(8300)

  yield* api.army.joinMap('championdrakath')
  yield* api.army.equipSet('ChampionDrakath', { resolveItems: true })
  yield* api.recipes.buff()
  yield* api.combat.hunt(BOSS)
  yield* api.world.map.setSpawnPoint()

  const className = yield* api.player.getClassName()
  const { rotation, healSkill } = getSkillPlan(className)

  let skillIndex = 0
  let nextBoundaryIndex = 0

  while (!(yield* api.tempInventory.contains('Champion Drakath Defeated', 1))) {
    const alive = yield* api.player.isAlive()
    if (!alive) {
      yield* script.sleep(1000)
      continue
    }

    const hasTarget = yield* api.combat.hasTarget()
    if (!hasTarget) {
      yield* api.combat.attackMonster(BOSS)
    }

    nextBoundaryIndex = yield* tauntBoundaryIfNeeded(nextBoundaryIndex)

    if (yield* healIfNeeded(healSkill)) {
      yield* script.sleep(100)
      continue
    }

    yield* api.combat.useSkill(rotation[skillIndex])
    skillIndex = (skillIndex + 1) % rotation.length
    yield* script.sleep(100)
  }

  yield* api.player.jumpToCell('Enter')
  if (yield* api.quests.canComplete(8300)) {
    yield* api.quests.complete(8300)
  }
}
