const { features, script, api } = require("vexed")
const { autoZone } = features

module.exports = function* run() {
  yield* autoZone.setMap('darkcarnax')
  yield* autoZone.enable()
  yield* api.player.joinMap('darkcarnax-1e99', 'Boss', 'Right')
  yield* api.inventory.equip('Dragon of Time')
  yield* api.settings.setInfiniteRange(true)
  yield* api.combat.kill('*', { skillSet: [3, 2, 1, 2, 4] })
}
