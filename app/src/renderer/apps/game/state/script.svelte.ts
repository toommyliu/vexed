let isRunning = $state(false);
let isLoaded = $state(false);
let showOverlay = $state(false);

export const scriptState = {
  get isRunning() {
    return isRunning;
  },
  set isRunning(value) {
    isRunning = value;
  },
  get isLoaded() {
    return isLoaded;
  },
  set isLoaded(value) {
    isLoaded = value;
  },
  get showOverlay() {
    return showOverlay;
  },
  set showOverlay(value) {
    showOverlay = value;
  },
};
