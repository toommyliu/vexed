const MAP = "doomvaultb-1e99";
const CELL = "r26";
const TARGET = "Undead Raxgore";

/** @param {ScriptContext} context */
module.exports = function* run({ api, features, script }) {
  const { antiCounter } = features;
  const wasEnabled = yield* antiCounter.isEnabled();
  const disposeStart = yield* antiCounter.onStart((event) => {
    script.log(
      `Anti-counter started: monMapId=${event.monMapId}, trigger=${event.triggerText}`,
    );
  });
  const disposeEnd = yield* antiCounter.onEnd((event) => {
    script.log(
      `Anti-counter ended: monMapId=${event.monMapId}, trigger=${event.triggerText}`,
    );
  });

  try {
    yield* antiCounter.enable();
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
      yield* antiCounter.disable();
    }
  }
};
