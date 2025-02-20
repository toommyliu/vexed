export const IPC_EVENTS = {
	// #region game
	LOAD_SCRIPT: 'game:load-script' as const,
	SCRIPT_LOADED: 'game:script-loaded' as const,
	TOGGLE_DEV_TOOLS: 'root:toggle-dev-tools' as const,
	LOGIN: 'root:login' as const,
	LOGIN_SUCCESS: 'root:login-success' as const,
	ACTIVATE_WINDOW: 'root:activate-window' as const,
	READ_FAST_TRAVELS: 'root:read-fast-travels' as const,
	SETUP_IPC: 'root:setup-ipc' as const,
	GET_WINDOW_ID: 'root:get-window-id' as const,

	FAST_TRAVEL: 'fast-travel' as const,

	LOADER_GRABBER_LOAD: 'loader-grabber:load' as const,
	LOADER_GRABBER_GRAB: 'loader-grabber:grab' as const,

	FOLLOWER_ME: 'follower:me' as const,
	FOLLOWER_START: 'follower:start' as const,
	FOLLOWER_STOP: 'follower:stop' as const,

	PACKET_LOGGER_START: 'packet-logger:start' as const,
	PACKET_LOGGER_STOP: 'packet-logger:stop' as const,
	PACKET_LOGGER_PACKET: 'packet-logger:packet' as const,

	PACKET_SPAMMER_START: 'packet-spammer:start' as const,
	PACKET_SPAMMER_STOP: 'packet-spammer:stop' as const,
	// #endregion

	// #region manager
	GET_ACCOUNTS: 'manager:get_accounts' as const,
	// #endregion
} as const;
