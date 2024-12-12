export const IPC_EVENTS = {
	GET_DOCUMENTS_PATH: 'root:get-documents-path' as const,
	TOGGLE_DEV_TOOLS: 'root:toggle-dev-tools' as const,
	LOGIN: 'root:login' as const,
	LOGIN_SUCCESS: 'root:login-success' as const,
	LOAD_SCRIPT: 'root:load-script' as const,
	ACTIVATE_WINDOW: 'root:activate-window' as const,
	READ_FAST_TRAVELS: 'root:read-fast-travels' as const,
	SETUP_IPC: 'root:setup-ipc' as const,

	FAST_TRAVEL: 'fast-travel' as const,

	LOADER_GRABBER_LOAD: 'loader-grabber:load' as const,
	LOADER_GRABBER_GRAB: 'loader-grabber:grab' as const,
	LOADER_GRABBER_EXPORT: 'loader-grabber:export' as const,

	FOLLOWER_ME: 'follower:me' as const,
	FOLLOWER_START: 'follower:start' as const,
	FOLLOWER_STOP: 'follower:stop' as const,
} as const;
