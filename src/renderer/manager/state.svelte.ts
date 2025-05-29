import { SvelteMap, SvelteSet } from "svelte/reactivity";
import type { ServerData } from "../game/lib/models/Server";

function initState() {
  const servers = new SvelteMap<string, ServerData>();
  const accounts = new SvelteMap<string, Account>();
  const selectedAccounts = new SvelteSet<string>();
  const timeouts = new SvelteMap<string, NodeJS.Timeout>();

  let selectedServer = $state<string>();
  let startWithScript = $state<boolean>(false);
  let scriptPath = $state<string>();

  return {
    servers,
    accounts,
    selectedAccounts,
    timeouts,
    get selectedServer() {
      return selectedServer;
    },
    set selectedServer(value) {
      selectedServer = value;
    },
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

export const state = initState();
