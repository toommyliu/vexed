const MAP = "doomvaultb-1e99";
const CELL = "r26";
const TARGET = "Undead Raxgore";

/** @param {ScriptContext} context */
module.exports = function* run({ api, counterAttack, script }) {
  const wasEnabled = yield* counterAttack.isEnabled();
  const disposeStart = yield* counterAttack.onStart((event) => {
    script.log(
      `Counter attack started: monMapId=${event.monMapId}, trigger=${event.triggerText}`,
    );
  });
  const disposeEnd = yield* counterAttack.onEnd((event) => {
    script.log(
      `Counter attack ended: monMapId=${event.monMapId}, trigger=${event.triggerText}`,
    );
  });

  try {
    yield* counterAttack.enable();
    yield* api.settings.setInfiniteRange(true);
    yield* api.player.joinMap(MAP, CELL);
    yield* script.sleep(1000);

    while (true) {
      yield* api.combat.kill(TARGET, {
        skillSet: [1, 2, 3, 4],
        skillDelay: 250,
      });
      yield* script.sleep(500);
    }
  } finally {
    disposeStart();
    disposeEnd();

    if (!wasEnabled) {
      yield* counterAttack.disable();
    }
  }
};
