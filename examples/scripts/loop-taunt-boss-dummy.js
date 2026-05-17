const TARGET = "Boss Dummy";

/** @param {ScriptContext} context */
module.exports = function* run({ api }) {
  yield* api.settings.setFrameRate(10);
  yield* api.settings.setLagKillerEnabled(true);
  yield* api.settings.setOtherPlayersVisible(false);
  yield* api.settings.setInfiniteRange(true);

  yield* api.army.start("config");
  yield* api.army.joinMap("classhall", "r4c", "Right");
  yield* api.inventory.equip("Scroll of Enrage");

  while (true) {
    const taunt = yield* api.army.startLoopTaunt({
      target: TARGET,
      skill: 5,
      aura: "Focus",
      players: [1, 2],
    });

    try {
      yield* api.army.kill(TARGET);
    } finally {
      yield* taunt.stop();
    }
  }
};
