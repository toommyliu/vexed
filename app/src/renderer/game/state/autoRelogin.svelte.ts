import type { Account } from "~/shared/types";

export type CredentialSource = "current" | "manual" | "saved";

const DEFAULT_DELAY = 5_000;

export function initAutoReloginState() {
    let enabled = $state(false);
    let username = $state<string | null>(null);
    let password = $state<string | null>(null);
    let server = $state<string | null>(null);
    let fallbackServer = $state<string | null>(null);
    let delay = $state(DEFAULT_DELAY);
    let source = $state<CredentialSource>("current");

    let manualUsername = $state("");
    let manualPassword = $state("");

    let savedAccounts = $state<Account[]>([]);
    let selectedSavedUsername = $state("");

    const isConfigured = $derived(
        enabled && username !== null && password !== null && server !== null
    );

    function setCredentials(
        newUsername: string,
        newPassword: string,
        newServer: string
    ) {
        username = newUsername;
        password = newPassword;
        server = newServer;
    }

    function enable(
        newUsername: string,
        newPassword: string,
        newServer: string
    ) {
        setCredentials(newUsername, newPassword, newServer);
        enabled = true;
    }

    function disable() {
        enabled = false;
    }

    function reset() {
        enabled = false;
        username = null;
        password = null;
        server = null;
        delay = DEFAULT_DELAY;
        source = "current";
        manualUsername = "";
        manualPassword = "";
        selectedSavedUsername = "";
    }

    return {
        get enabled() {
            return enabled;
        },
        set enabled(value) {
            enabled = value;
        },
        get username() {
            return username;
        },
        get password() {
            return password;
        },
        get server() {
            return server;
        },
        set server(value) {
            server = value;
        },
        get delay() {
            return delay;
        },
        set delay(value) {
            delay = value;
        },
        get source() {
            return source;
        },
        set source(value) {
            source = value;
        },

        get fallbackServer() {
            return fallbackServer;
        },
        set fallbackServer(value) {
            fallbackServer = value;
        },

        get manualUsername() {
            return manualUsername;
        },
        set manualUsername(value) {
            manualUsername = value;
        },
        get manualPassword() {
            return manualPassword;
        },
        set manualPassword(value) {
            manualPassword = value;
        },

        get savedAccounts() {
            return savedAccounts;
        },
        set savedAccounts(value) {
            savedAccounts = value;
        },
        get selectedSavedUsername() {
            return selectedSavedUsername;
        },
        set selectedSavedUsername(value) {
            selectedSavedUsername = value;
        },

        get isConfigured() {
            return isConfigured;
        },

        setCredentials,
        enable,
        disable,
        reset,
    };
}

export const autoReloginState = initAutoReloginState();
