export const demoScriptName = "demo-loop";

export const demoScriptSource = `
module.exports = function* run({ api, script }) {
  script.log("Demo script started")
  yield* script.options.setUsePrivateRooms(true)
  yield* api.settings.setFrameRate(30)
  yield* api.settings.setLagKillerEnabled(true)
  yield* api.settings.setOtherPlayersVisible(false)
  yield* api.settings.setInfiniteRange(true)

  yield* api.player.joinMap("battleon", "Enter", "Spawn")
  yield* api.player.jumpToCell("Enter", "Spawn")
  yield* script.sleep(500)

  while (true) {
    yield* api.combat.attackMonster("*")
    yield* api.combat.useSkill(1, false, true)
    yield* script.sleep(1200)
  }
}
`.trim();
