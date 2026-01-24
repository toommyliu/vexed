import { writable } from "svelte/store";

export const platform = writable({
  isMac: false,
  isWindows: false,
  isLinux: false,
});
