let infiniteRange = $state(false);
let provokeCell = $state(false);
let enemyMagnet = $state(false);
let lagKiller = $state(false);
let hidePlayers = $state(false);
let skipCutscenes = $state(false);
let disableFx = $state(false);
let disableCollisions = $state(false);
let counterAttack = $state(false);
let disableDeathAds = $state(false);
let walkSpeed = $state(8);
let fps = $state(24);

export const optionsState = {
  get infiniteRange() {
    return infiniteRange;
  },
  set infiniteRange(value) {
    infiniteRange = value;
  },
  get provokeCell() {
    return provokeCell;
  },
  set provokeCell(value) {
    provokeCell = value;
  },
  get enemyMagnet() {
    return enemyMagnet;
  },
  set enemyMagnet(value) {
    enemyMagnet = value;
  },
  get lagKiller() {
    return lagKiller;
  },
  set lagKiller(value) {
    lagKiller = value;
  },
  get hidePlayers() {
    return hidePlayers;
  },
  set hidePlayers(value) {
    hidePlayers = value;
  },
  get skipCutscenes() {
    return skipCutscenes;
  },
  set skipCutscenes(value) {
    skipCutscenes = value;
  },
  get disableFx() {
    return disableFx;
  },
  set disableFx(value) {
    disableFx = value;
  },
  get disableCollisions() {
    return disableCollisions;
  },
  set disableCollisions(value) {
    disableCollisions = value;
  },
  get counterAttack() {
    return counterAttack;
  },
  set counterAttack(value) {
    counterAttack = value;
  },
  get disableDeathAds() {
    return disableDeathAds;
  },
  set disableDeathAds(value) {
    disableDeathAds = value;
  },
  get walkSpeed() {
    return walkSpeed;
  },
  set walkSpeed(value) {
    walkSpeed = value;
  },
  get fps() {
    return fps;
  },
  set fps(value) {
    fps = value;
    if (typeof value === "number") {
      try {
        swf.settingsSetFPS(value);
      } catch {}
    }
  },
};
