import { writable } from "svelte/store";

export const scriptState = writable({
  isRunning: false,
  isLoaded: false,
  showOverlay: false,
});
