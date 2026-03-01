import { SvelteMap, SvelteSet } from "svelte/reactivity";
import type { Account } from "../../../shared/types";

function initManager() {
  const accounts = new SvelteMap<string, Account>();
  const selectedAccounts = new SvelteSet<string>();
  const timeouts = new SvelteMap<string, NodeJS.Timeout>();

  let startWithScript = $state<boolean>(false);
  let scriptPath = $state<string>();

  return {
    accounts,
    selectedAccounts,
    timeouts,
    get startWithScript() {
      return startWithScript;
    },
    set startWithScript(value) {
      startWithScript = value;
    },
    get scriptPath() {
      return scriptPath;
    },
    set scriptPath(value) {
      scriptPath = value;
    },
  };
}

export const managerState = initManager();
